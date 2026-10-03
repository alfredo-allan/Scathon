"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listProducts } from "@/lib/products";
import {
  createProduct,
  deleteProduct,
  getAdminProductDetail,
  listCategories,
  resolveProductImageUrl,
  updateProduct,
  uploadProductImage,
  type AdminCategory,
  type AdminProductDetail,
  type AdminProductPayload,
} from "@/lib/adminProducts";
import type { ColorVariant, Product } from "@/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/** Um id local só pra `key` de React nas linhas de cor - nunca enviado ao backend (o schema de cor não tem/precisa de id, só name/hex/imageUrl). */
let colorRowSeq = 0;
interface ColorDraft extends ColorVariant {
  _key: number;
}

type FormMode = "create" | "edit";

/**
 * "Produtos" tab: criar/editar/apagar produto e subir fotos direto do painel
 * admin, pra Alfredo nunca mais precisar mexer em código pra isso (pedido em
 * 2026-10-03). Backend: `POST/PATCH/DELETE /api/v1/admin/products`,
 * `POST /api/v1/admin/products/{id}/images` - ver `@/lib/adminProducts` pro
 * contrato completo. A listagem reaproveita o endpoint público do catálogo
 * (`@/lib/products`'s `listProducts`) - é a mesma fonte que a loja já usa,
 * então o que aparece aqui é exatamente o que o cliente vê.
 */
export function AdminProductsTab() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  // `null` = lista; `"new"` = formulário de criação; um slug = editando aquele produto.
  const [activeSlug, setActiveSlug] = useState<string | null | "new">(null);

  const load = useCallback(async () => {
    if (!hasLoadedOnce.current) setIsLoading(true);
    setErrorMessage(null);
    try {
      const [productList, categoryList] = await Promise.all([
        listProducts({ perPage: 100 }),
        listCategories(),
      ]);
      setProducts(productList);
      setCategories(categoryList);
    } catch {
      setErrorMessage("Não foi possível carregar o catálogo agora.");
    } finally {
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando produtos…</p>;
  }

  if (errorMessage && products.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  if (activeSlug !== null) {
    return (
      <ProductForm
        key={activeSlug === "new" ? "new" : activeSlug}
        mode={activeSlug === "new" ? "create" : "edit"}
        slug={activeSlug === "new" ? null : activeSlug}
        token={token}
        categories={categories}
        onCancel={() => setActiveSlug(null)}
        onSaved={() => {
          setActiveSlug(null);
          load();
        }}
        onDeleted={() => {
          setActiveSlug(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {products.length} {products.length === 1 ? "produto cadastrado" : "produtos cadastrados"}.
        </p>
        <button
          type="button"
          onClick={() => setActiveSlug("new")}
          className="rounded-app bg-neutral-950 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950 md:px-5 md:py-2.5 md:text-sm"
        >
          + Novo produto
        </button>
      </div>

      <div className="flex flex-col divide-y divide-neutral-100 rounded-app border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
        {products.map((product) => {
          const thumb = resolveProductImageUrl(product.coverImage ?? product.imageUrl);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => setActiveSlug(product.slug)}
              className="flex flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
            >
              <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-app bg-neutral-200 dark:bg-neutral-800">
                {thumb && (
                  <Image src={thumb} alt={product.title} fill unoptimized sizes="44px" className="object-cover" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-900 dark:text-neutral-100">{product.title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {product.category} · {product.slug}
                  {product.availability === "coming_soon" ? " · Em breve" : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {currencyFormatter.format(product.price)}
              </p>
            </button>
          );
        })}
        {products.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Nenhum produto no catálogo ainda.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100";
const labelClass = "text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700 dark:border-neutral-700 dark:border-t-neutral-300"
    />
  );
}

function ProductForm({
  mode,
  slug,
  token,
  categories,
  onCancel,
  onSaved,
  onDeleted,
}: {
  mode: FormMode;
  slug: string | null;
  token: string | null;
  categories: AdminCategory[];
  onCancel: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [isLoadingDetail, setIsLoadingDetail] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);

  // `productId` fica `null` até o primeiro "Salvar" bem-sucedido no modo de
  // criação - é o que habilita os uploads de foto (o backend exige um
  // produto já existente pra guardar a imagem em `/media/products/<id>/...`).
  // Depois de criado, o resto do formulário (edição, mais fotos, apagar)
  // continua na mesma tela, sem navegar pra nenhum outro lugar - só troca de
  // "criando" pra "editando" por baixo.
  const [productId, setProductId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slugField, setSlugField] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState<"in_stock" | "coming_soon">("in_stock");
  const [isNew, setIsNew] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [styleCode, setStyleCode] = useState("");
  const [stock, setStock] = useState("0");
  const [sizesText, setSizesText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [hoverImageUrl, setHoverImageUrl] = useState("");
  const [specimenImages, setSpecimenImages] = useState<string[]>([]);
  const [colors, setColors] = useState<ColorDraft[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !slug) return;
    let cancelled = false;
    setIsLoadingDetail(true);
    setLoadError(null);
    getAdminProductDetail(slug)
      .then((detail: AdminProductDetail) => {
        if (cancelled) return;
        setProductId(detail.id);
        setTitle(detail.title);
        setSlugField(detail.slug);
        setSlugTouched(true);
        setPrice(String(detail.price));
        setCategory(detail.category);
        setDescription(detail.description ?? "");
        setAvailability(detail.availability ?? "in_stock");
        setIsNew(Boolean(detail.isNew));
        setIsBestSeller(Boolean(detail.isBestSeller));
        setStyleCode(detail.styleCode ?? "");
        setStock(String(detail.stock ?? 0));
        setSizesText((detail.sizes ?? []).join(", "));
        setImageUrl(detail.imageUrl ?? "");
        setCoverImage(detail.coverImage ?? "");
        setHoverImageUrl(detail.hoverImageUrl ?? "");
        setSpecimenImages(detail.specimenImages ?? []);
        setColors((detail.colors ?? []).map((c) => ({ ...c, _key: colorRowSeq++ })));
      })
      .catch(() => {
        if (!cancelled) setLoadError("Não foi possível carregar esse produto agora.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, slug]);

  useEffect(() => {
    if (!slugTouched) setSlugField(slugify(title));
  }, [title, slugTouched]);

  function buildPayload(): AdminProductPayload {
    return {
      slug: slugField.trim(),
      title: title.trim(),
      price: Number(price.replace(",", ".")) || 0,
      category,
      description: description.trim() || null,
      availability,
      isNew,
      isBestSeller,
      styleCode: styleCode.trim() || null,
      stock: Math.max(0, Math.round(Number(stock) || 0)),
      sizes: sizesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: imageUrl.trim() || null,
      coverImage: coverImage.trim() || null,
      hoverImageUrl: hoverImageUrl.trim() || null,
      specimenImages,
      // Uma cor sem foto ainda não é uma cor válida pro backend (`imageUrl`
      // é obrigatório no schema) - fica de fora até alguém subir uma foto
      // pra ela, em vez de travar o salvamento do resto do produto.
      colors: colors
        .filter((c) => c.name.trim() && c.hex.trim() && c.imageUrl.trim())
        .map(({ name, hex, imageUrl: url }) => ({ name, hex, imageUrl: url })),
    };
  }

  async function handleSave() {
    if (!token) return;
    if (!title.trim() || !slugField.trim() || !category) {
      setSaveError("Preencha pelo menos título, slug e categoria.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const payload = buildPayload();
      if (productId === null) {
        const newId = await createProduct(token, payload);
        setProductId(newId);
        setSaveMessage("Produto criado! Agora você já pode adicionar fotos abaixo.");
      } else {
        await updateProduct(token, productId, payload);
        setSaveMessage("Alterações salvas.");
      }
    } catch {
      setSaveError("Não foi possível salvar esse produto agora - confira os campos e tente de novo.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload(slotKey: string, file: File, onDone: (url: string) => void) {
    if (!token || !productId) return;
    setUploadingSlot(slotKey);
    setUploadError(null);
    try {
      const url = await uploadProductImage(token, productId, file);
      onDone(url);
    } catch {
      setUploadError("Não foi possível enviar essa imagem agora - confira o formato/tamanho e tente de novo.");
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleDelete() {
    if (!token || !productId) return;
    setIsDeleting(true);
    try {
      await deleteProduct(token, productId);
      onDeleted();
    } catch {
      setSaveError("Não foi possível apagar esse produto agora.");
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  }

  if (isLoadingDetail) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando produto…</p>;
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Voltar
        </button>
      </div>
    );
  }

  const canUploadImages = productId !== null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold uppercase tracking-widest text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Voltar aos produtos
        </button>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          {mode === "create" && productId === null ? "Novo produto" : "Editar produto"}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Título">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Slug (URL)">
          <input
            className={inputClass}
            value={slugField}
            onChange={(e) => {
              setSlugTouched(true);
              setSlugField(e.target.value);
            }}
          />
        </Field>
        <Field label="Preço (R$)">
          <input
            className={inputClass}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Categoria">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="" disabled>
              Selecione…
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estoque">
          <input
            className={inputClass}
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </Field>
        <Field label="Código/SKU (opcional)">
          <input className={inputClass} value={styleCode} onChange={(e) => setStyleCode(e.target.value)} />
        </Field>
        <Field label="Disponibilidade">
          <select
            className={inputClass}
            value={availability}
            onChange={(e) => setAvailability(e.target.value as "in_stock" | "coming_soon")}
          >
            <option value="in_stock">Em estoque</option>
            <option value="coming_soon">Em breve (pré-lançamento)</option>
          </select>
        </Field>
        <Field label="Tamanhos (separados por vírgula)">
          <input
            className={inputClass}
            value={sizesText}
            onChange={(e) => setSizesText(e.target.value)}
            placeholder="P, M, G, GG"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
          Marcar como novidade
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
          Destacar em "Mais Vendidos"
        </label>
      </div>

      <Field label="Descrição">
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Texto que aparece na página do produto…"
        />
      </Field>

      <div className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <p className={labelClass}>Fotos do produto</p>
        {!canUploadImages && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Salve as informações básicas acima primeiro - o upload de fotos é liberado assim que o produto existir.
          </p>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <ImageSlot
            label="Capa"
            url={coverImage}
            disabled={!canUploadImages}
            isUploading={uploadingSlot === "cover"}
            onUpload={(file) => handleUpload("cover", file, setCoverImage)}
            onClear={() => setCoverImage("")}
          />
          <ImageSlot
            label="Hover (ao passar o mouse)"
            url={hoverImageUrl}
            disabled={!canUploadImages}
            isUploading={uploadingSlot === "hover"}
            onUpload={(file) => handleUpload("hover", file, setHoverImageUrl)}
            onClear={() => setHoverImageUrl("")}
          />
          <ImageSlot
            label="Principal (fallback)"
            url={imageUrl}
            disabled={!canUploadImages}
            isUploading={uploadingSlot === "main"}
            onUpload={(file) => handleUpload("main", file, setImageUrl)}
            onClear={() => setImageUrl("")}
          />
        </div>

        <div className="mt-5">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Galeria (fotos extras da página do produto)</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {specimenImages.map((url, index) => (
              <div key={`${url}-${index}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-app bg-neutral-200 dark:bg-neutral-800">
                <Image
                  src={resolveProductImageUrl(url) ?? url}
                  alt={`Foto ${index + 1}`}
                  fill
                  unoptimized
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSpecimenImages((current) => current.filter((_, i) => i !== index))}
                  aria-label="Remover foto"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-950/70 text-xs text-neutral-50"
                >
                  ×
                </button>
              </div>
            ))}
            <ImageSlot
              label="+ Adicionar"
              compact
              url=""
              disabled={!canUploadImages}
              isUploading={uploadingSlot === "gallery"}
              onUpload={(file) =>
                handleUpload("gallery", file, (url) => setSpecimenImages((current) => [...current, url]))
              }
            />
          </div>
        </div>

        {uploadError && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
      </div>

      <div className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-3">
          <p className={labelClass}>Variantes de cor</p>
          <button
            type="button"
            onClick={() => setColors((current) => [...current, { name: "", hex: "#000000", imageUrl: "", _key: colorRowSeq++ }])}
            className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
          >
            + Adicionar cor
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {colors.map((colorDraft, index) => (
            <div
              key={colorDraft._key}
              className="flex flex-wrap items-center gap-3 rounded-app border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-app bg-neutral-200 dark:bg-neutral-800">
                {colorDraft.imageUrl && (
                  <Image
                    src={resolveProductImageUrl(colorDraft.imageUrl) ?? colorDraft.imageUrl}
                    alt={colorDraft.name || "Cor"}
                    fill
                    unoptimized
                    sizes="44px"
                    className="object-cover"
                  />
                )}
              </div>
              <input
                className={`${inputClass} w-32`}
                placeholder="Nome da cor"
                value={colorDraft.name}
                onChange={(e) =>
                  setColors((current) =>
                    current.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)),
                  )
                }
              />
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(colorDraft.hex) ? colorDraft.hex : "#000000"}
                onChange={(e) =>
                  setColors((current) =>
                    current.map((c, i) => (i === index ? { ...c, hex: e.target.value } : c)),
                  )
                }
                className="h-9 w-9 shrink-0 cursor-pointer rounded-app border border-neutral-300 bg-transparent dark:border-neutral-700"
              />
              <ImageSlot
                label="Foto"
                compact
                url={colorDraft.imageUrl}
                disabled={!canUploadImages}
                isUploading={uploadingSlot === `color-${index}`}
                onUpload={(file) =>
                  handleUpload(`color-${index}`, file, (url) =>
                    setColors((current) => current.map((c, i) => (i === index ? { ...c, imageUrl: url } : c))),
                  )
                }
              />
              <button
                type="button"
                onClick={() => setColors((current) => current.filter((_, i) => i !== index))}
                className="ml-auto shrink-0 text-xs font-semibold uppercase tracking-widest text-red-600 underline underline-offset-4 dark:text-red-400"
              >
                Remover
              </button>
            </div>
          ))}
          {colors.length === 0 && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Nenhuma variante de cor ainda.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-app bg-neutral-950 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950"
        >
          {isSaving && <Spinner />}
          {productId === null ? "Criar produto" : "Salvar alterações"}
        </button>

        {saveMessage && <p className="text-xs text-emerald-600 dark:text-emerald-400">{saveMessage}</p>}
        {saveError && <p className="text-xs text-red-600 dark:text-red-400">{saveError}</p>}

        {productId !== null && (
          <div className="ml-auto flex items-center gap-2">
            {confirmingDelete ? (
              <>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">Apagar esse produto?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded-app border border-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-600 disabled:opacity-50 dark:border-red-400 dark:text-red-400"
                >
                  {isDeleting && <Spinner />}
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isDeleting}
                  className="text-xs text-neutral-500 underline underline-offset-4 dark:text-neutral-400"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-semibold uppercase tracking-widest text-red-600 underline underline-offset-4 dark:text-red-400"
              >
                Apagar produto
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageSlot({
  label,
  url,
  disabled,
  isUploading,
  onUpload,
  onClear,
  compact,
}: {
  label: string;
  url: string;
  disabled: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onClear?: () => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedUrl = resolveProductImageUrl(url);

  return (
    <div className={compact ? "flex flex-col items-center gap-1" : "flex flex-col gap-1.5"}>
      {!compact && <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>}
      <div
        className={`relative overflow-hidden rounded-app border border-dashed border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 ${
          compact ? "h-24 w-20" : "aspect-[3/4] w-full"
        }`}
      >
        {resolvedUrl && (
          <Image src={resolvedUrl} alt={label} fill unoptimized sizes="200px" className="object-cover" />
        )}
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-neutral-950/0 text-xs font-semibold uppercase tracking-widest text-neutral-50 opacity-0 transition-opacity hover:bg-neutral-950/50 hover:opacity-100 disabled:cursor-not-allowed"
        >
          {isUploading ? <Spinner /> : resolvedUrl ? "Trocar" : compact ? "+" : "Enviar foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onUpload(file);
          }}
        />
      </div>
      {!compact && url && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-[11px] text-neutral-500 underline underline-offset-4 dark:text-neutral-400"
        >
          Remover
        </button>
      )}
    </div>
  );
}
