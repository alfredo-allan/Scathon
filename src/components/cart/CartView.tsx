"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { CartLineItem } from "./CartLineItem";
import { useCheckoutShipping } from "@/hooks/useCheckoutShipping";
import { useSavedAddresses } from "@/hooks/useSavedAddresses";
import { saveAddress, type SavedAddress } from "@/lib/addresses";
import { formatCep, isCompleteCep, lookupAddressByCep, type ViaCepAddress } from "@/lib/viaCep";
import { getShippingQuotes, type ShippingQuote } from "@/lib/melhorEnvio";
import { SELLER_WHATSAPP_NUMBER } from "@/lib/layoutConstants";
import type { DeliveryMethod } from "@/lib/checkoutShipping";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * `/cart` page body: line items with quantity controls, then two required
 * steps before `/checkout` is reachable - an "endereço de entrega" (a real
 * `SavedAddress` on the account, since `POST /api/v1/checkout` always needs
 * a concrete `addressId`, no matter the delivery method - see
 * `@/lib/checkoutShipping`'s doc comment on `ShippingSelection.addressId`)
 * and a "forma de envio" (a Melhor Envio quote for that address' CEP, or
 * "combinar com o vendedor" for a pickup/custom arrangement made directly
 * over WhatsApp). Both choices are written to `checkoutShippingStore`
 * (`useCheckoutShipping`) so `<CheckoutView/>` can read them back.
 *
 * Antes da fase 4 (integração com o backend real), o endereço era opcional
 * aqui - só um CEP digitado pra cotar frete, sem precisar virar um endereço
 * salvo. Isso parou de ser suficiente: o backend sempre grava um retrato do
 * endereço no pedido (`Order.shipping_*`), então precisa de um `Address` de
 * verdade por trás - daí a seleção de endereço ter virado o primeiro passo
 * obrigatório, não mais uma conveniência opcional só pra "salvar depois".
 */
export function CartView() {
  const { token, isAuthenticated } = useAuth();
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const { selection, update, confirm } = useCheckoutShipping();
  const { addresses: savedAddresses, isLoading: isLoadingAddresses, reload: reloadAddresses } = useSavedAddresses();

  const [quotes, setQuotes] = useState<ShippingQuote[]>(selection.quote ? [selection.quote] : []);
  const [isQuoting, setIsQuoting] = useState(false);

  const [isAddingAddress, setIsAddingAddress] = useState(savedAddresses.length === 0);
  const [cepInput, setCepInput] = useState("");
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "done" | "invalid">("idle");
  const [resolvedAddress, setResolvedAddress] = useState<ViaCepAddress | null>(null);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const method: DeliveryMethod = selection.method ?? "melhor_envio";
  const isConfirmed = Boolean(selection.confirmedAt);
  const selectedAddress = savedAddresses.find((address) => address.id === selection.addressId) ?? null;

  async function quoteFor(cep: string) {
    setIsQuoting(true);
    const results = await getShippingQuotes(cep);
    setQuotes(results);
    setIsQuoting(false);
    return results;
  }

  function handleSelectSavedAddress(address: SavedAddress) {
    update({ addressId: address.id, cep: address.cep, quote: null });
    setIsAddingAddress(false);
    quoteFor(address.cep);
  }

  async function runCepLookup(rawCep: string) {
    if (!isCompleteCep(rawCep)) {
      setCepStatus("invalid");
      setResolvedAddress(null);
      return;
    }
    setCepStatus("loading");
    const address = await lookupAddressByCep(rawCep);
    setResolvedAddress(address);
    setCepStatus(address ? "done" : "invalid");
  }

  function handleCepChange(value: string) {
    const formatted = formatCep(value);
    setCepInput(formatted);
    if (!isCompleteCep(formatted)) {
      setCepStatus("idle");
      setResolvedAddress(null);
    } else {
      runCepLookup(formatted);
    }
  }

  async function handleSaveNewAddress() {
    if (!token || !resolvedAddress || !addressNumber.trim()) return;
    setIsSavingAddress(true);
    setAddressError(null);
    try {
      const saved = await saveAddress(token, {
        label: addressLabel.trim() || "Endereço de entrega",
        cep: cepInput,
        street: resolvedAddress.street,
        number: addressNumber.trim(),
        complement: addressComplement.trim() || undefined,
        neighborhood: resolvedAddress.neighborhood,
        city: resolvedAddress.city,
        state: resolvedAddress.state,
      });
      await reloadAddresses();
      update({ addressId: saved.id, cep: saved.cep, quote: null });
      setIsAddingAddress(false);
      setCepInput("");
      setCepStatus("idle");
      setResolvedAddress(null);
      setAddressLabel("");
      setAddressNumber("");
      setAddressComplement("");
      quoteFor(saved.cep);
    } catch {
      setAddressError("Não foi possível salvar esse endereço agora. Tente de novo.");
    } finally {
      setIsSavingAddress(false);
    }
  }

  function handleSelectQuote(quote: ShippingQuote) {
    update({ quote, method: "melhor_envio" });
  }

  function handleSelectMethod(nextMethod: DeliveryMethod) {
    update({ method: nextMethod });
  }

  function handleConfirmShipping() {
    const canConfirm =
      Boolean(selection.addressId) &&
      (method === "melhor_envio" ? Boolean(selection.quote) : selection.customNote.trim().length > 0);
    if (!canConfirm) return;
    confirm();
  }

  const shippingCost = method === "melhor_envio" ? selection.quote?.price ?? 0 : 0;
  const total = totalAmount + shippingCost;

  const whatsappHref = (() => {
    const lines = items.map((item) => `- ${item.title} (${item.color}, ${item.size}) x${item.quantity}`);
    const message = [
      "Olá! Gostaria de combinar a entrega/retirada do meu pedido na Scathon:",
      ...lines,
      `Total dos produtos: ${currencyFormatter.format(totalAmount)}`,
      selection.customNote.trim() ? `Observação: ${selection.customNote.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${SELLER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  })();

  if (items.length === 0) {
    return (
      <div className="px-4 md:px-8 py-6">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
                Página Inicial
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-neutral-900 dark:text-neutral-100">Carrinho</li>
          </ol>
        </nav>

        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Seu carrinho está vazio.</p>
          <Link
            href="/"
            className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Carrinho</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Carrinho
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        {/* Line items */}
        <div className="flex flex-col divide-y divide-neutral-100 border-t border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
          {items.map((item) => (
            <CartLineItem
              key={`${item.productId}-${item.color}-${item.size}`}
              item={item}
              onIncrease={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
              onDecrease={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
              onRemove={() => removeItem(item.productId, item.color, item.size)}
            />
          ))}
        </div>

        {/* Summary + shipping */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Resumo
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Subtotal</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">{currencyFormatter.format(totalAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600 dark:text-neutral-400">Frete</dt>
                <dd className="text-neutral-900 dark:text-neutral-100">
                  {method === "melhor_envio" && selection.quote
                    ? currencyFormatter.format(selection.quote.price)
                    : method === "combinar_com_vendedor"
                      ? "A combinar"
                      : "—"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold dark:border-neutral-800">
                <dt className="text-neutral-950 dark:text-neutral-50">Total</dt>
                <dd className="text-neutral-950 dark:text-neutral-50">{currencyFormatter.format(total)}</dd>
              </div>
            </dl>
          </div>

          {!isAuthenticated ? (
            <div className="rounded-app border border-neutral-200 p-4 text-center dark:border-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Entre na sua conta pra escolher o endereço de entrega e continuar.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
              >
                Entrar
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                  Endereço de entrega
                </h2>

                {isLoadingAddresses ? (
                  <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">Carregando endereços…</p>
                ) : (
                  <>
                    {savedAddresses.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {savedAddresses.map((address) => {
                          const isActive = selection.addressId === address.id;
                          return (
                            <button
                              key={address.id}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => handleSelectSavedAddress(address)}
                              className={`rounded-app border px-3 py-2 text-left text-xs transition-colors ${
                                isActive
                                  ? "border-neutral-950 dark:border-neutral-100"
                                  : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
                              }`}
                            >
                              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{address.label}</span>
                              <span className="block text-neutral-600 dark:text-neutral-400">
                                {address.street}, {address.number} · {address.neighborhood} · {address.city}/{address.state}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!isAddingAddress ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(true)}
                        className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
                      >
                        + Adicionar novo endereço
                      </button>
                    ) : (
                      <div className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-900">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cepInput}
                            onChange={(event) => handleCepChange(event.target.value)}
                            placeholder="00000-000"
                            maxLength={9}
                            className="w-full max-w-[160px] rounded-app border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                          />
                        </div>

                        {cepStatus === "invalid" && (
                          <p className="text-xs text-red-600 dark:text-red-400">Digite um CEP válido com 8 dígitos.</p>
                        )}
                        {cepStatus === "loading" && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Buscando endereço…</p>
                        )}

                        {resolvedAddress && (resolvedAddress.street || resolvedAddress.city) && (
                          <>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {[resolvedAddress.street, resolvedAddress.neighborhood].filter(Boolean).join(", ")}
                              {resolvedAddress.city ? ` — ${resolvedAddress.city}/${resolvedAddress.state}` : ""}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <input
                                type="text"
                                value={addressLabel}
                                onChange={(event) => setAddressLabel(event.target.value)}
                                placeholder="Nome (ex: Casa)"
                                className="min-w-0 flex-1 rounded-app border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                              />
                              <input
                                type="text"
                                value={addressNumber}
                                onChange={(event) => setAddressNumber(event.target.value)}
                                placeholder="Número"
                                className="w-20 rounded-app border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                              />
                              <input
                                type="text"
                                value={addressComplement}
                                onChange={(event) => setAddressComplement(event.target.value)}
                                placeholder="Complemento"
                                className="min-w-0 flex-1 rounded-app border border-neutral-300 dark:border-neutral-700 bg-transparent px-2.5 py-2 text-xs outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveNewAddress}
                              disabled={!addressNumber.trim() || isSavingAddress}
                              className="self-start rounded-app border border-neutral-950 dark:border-neutral-100 bg-neutral-950 dark:bg-neutral-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-50 dark:text-neutral-950 transition-opacity hover:opacity-80 disabled:opacity-50"
                            >
                              {isSavingAddress ? "Salvando…" : "Usar este endereço"}
                            </button>
                          </>
                        )}

                        {addressError && <p className="text-xs text-red-600 dark:text-red-400">{addressError}</p>}

                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsAddingAddress(false)}
                            className="self-start text-[11px] text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                  Forma de envio
                </h2>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectMethod("melhor_envio")}
                    aria-pressed={method === "melhor_envio"}
                    className={`flex-1 rounded-app border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                      method === "melhor_envio"
                        ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                        : "border-neutral-300 text-neutral-800 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100"
                    }`}
                  >
                    Transportadora
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectMethod("combinar_com_vendedor")}
                    aria-pressed={method === "combinar_com_vendedor"}
                    className={`flex-1 rounded-app border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                      method === "combinar_com_vendedor"
                        ? "border-neutral-950 bg-neutral-950 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
                        : "border-neutral-300 text-neutral-800 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100"
                    }`}
                  >
                    Combinar com o vendedor
                  </button>
                </div>

                {method === "melhor_envio" ? (
                  <div className="mt-4">
                    {!selectedAddress ? (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Escolha um endereço de entrega acima pra ver as opções de frete.
                      </p>
                    ) : isQuoting ? (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Calculando frete…</p>
                    ) : quotes.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {quotes.map((quote) => {
                          const isActive = selection.quote?.id === quote.id;
                          return (
                            <button
                              key={quote.id}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => handleSelectQuote(quote)}
                              className={`flex items-center justify-between rounded-app border px-3 py-2 text-left text-xs transition-colors ${
                                isActive
                                  ? "border-neutral-950 dark:border-neutral-100"
                                  : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500"
                              }`}
                            >
                              <span className="text-neutral-800 dark:text-neutral-100">
                                {quote.carrier} {quote.service} · até {quote.estimatedDays} dias úteis
                              </span>
                              <span className="font-semibold text-neutral-950 dark:text-neutral-50">
                                {currencyFormatter.format(quote.price)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Não encontramos opções de frete pra esse CEP agora.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      Combine a retirada ou uma forma alternativa de entrega diretamente com o vendedor.
                    </p>
                    <textarea
                      value={selection.customNote}
                      onChange={(event) => update({ customNote: event.target.value, method: "combinar_com_vendedor" })}
                      placeholder="Ex: prefiro retirar na loja no sábado à tarde"
                      rows={3}
                      className="mt-2 w-full resize-none rounded-app border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500"
                    />
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-800 underline underline-offset-2 hover:text-neutral-950 dark:text-neutral-200 dark:hover:text-neutral-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.2c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.4.1 1.1.5 2.1 1.2 3 1 1.5 2.3 2.7 3.9 3.5.5.2.9.4 1.4.5.6.2 1.2.2 1.8.1.6-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" />
                      </svg>
                      Falar com o vendedor no WhatsApp
                    </a>
                  </div>
                )}

                {isConfirmed ? (
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs dark:border-neutral-900">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">Envio confirmado ✓</span>
                    <button
                      type="button"
                      onClick={() => update({})}
                      className="text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      Alterar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmShipping}
                    className="mt-4 w-full rounded-app bg-neutral-950 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-950"
                    disabled={
                      !selection.addressId ||
                      (method === "melhor_envio" ? !selection.quote : selection.customNote.trim().length === 0)
                    }
                  >
                    Confirmar envio
                  </button>
                )}
              </div>
            </>
          )}

          {isConfirmed ? (
            <Link
              href="/checkout"
              className="w-full rounded-app bg-neutral-950 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
            >
              Ir para o checkout
            </Link>
          ) : isAuthenticated ? (
            <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
              Escolha um endereço e confirme o envio acima para continuar para o checkout.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
