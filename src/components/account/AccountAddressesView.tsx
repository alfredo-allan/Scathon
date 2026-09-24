"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedAddresses } from "@/hooks/useSavedAddresses";
import { removeAddress, saveAddress } from "@/lib/addresses";
import { formatCep, isCompleteCep, lookupAddressByCep, type ViaCepAddress } from "@/lib/viaCep";

type CepStatus = "idle" | "loading" | "done" | "invalid";

/**
 * `/account/addresses` page body: the "salvar mais de um endereço" half of
 * the signup flow (see `<LoginView/>`'s doc comment) made into a real,
 * revisitable screen rather than something only reachable mid-checkout -
 * lists every saved address (`useSavedAddresses`) with a way to remove one,
 * and a form to add another, using the same CEP-format-then-ViaCEP-lookup
 * pattern as `<ShippingEstimator/>`/`<CartView/>`/`<LoginView/>`.
 */
export function AccountAddressesView() {
  const { user, isAuthenticated } = useAuth();
  const addresses = useSavedAddresses();

  const [label, setLabel] = useState("");
  const [cep, setCep] = useState("");
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  const [resolvedAddress, setResolvedAddress] = useState<ViaCepAddress | null>(null);
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Você precisa entrar pra ver seus endereços.</p>
        <Link
          href="/login"
          className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Entrar
        </Link>
      </div>
    );
  }

  async function runLookup(rawCep: string) {
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
    setCep(formatted);
    if (!isCompleteCep(formatted)) {
      setCepStatus("idle");
      setResolvedAddress(null);
      return;
    }
    runLookup(formatted);
  }

  async function handleAddAddress() {
    if (!resolvedAddress || !label.trim() || !number.trim()) return;
    setIsSaving(true);
    try {
      await saveAddress({
        label: label.trim(),
        cep,
        street: resolvedAddress.street,
        number: number.trim(),
        complement: complement.trim() || undefined,
        neighborhood: resolvedAddress.neighborhood,
        city: resolvedAddress.city,
        state: resolvedAddress.state,
      });
      setLabel("");
      setCep("");
      setNumber("");
      setComplement("");
      setResolvedAddress(null);
      setCepStatus("idle");
    } finally {
      setIsSaving(false);
    }
  }

  const canSave = Boolean(resolvedAddress) && label.trim().length > 0 && number.trim().length > 0;

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
          <li>
            <Link href="/account" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Minha Conta
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Meus Endereços</li>
        </ol>
      </nav>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
        Meus Endereços
      </h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Salve mais de um endereço para escolher a preferência de entrega na hora de fechar o pedido.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3">
          {addresses.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Nenhum endereço salvo ainda.</p>
          ) : (
            addresses.map((address) => (
              <div key={address.id} className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{address.label}</p>
                    <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                      {address.street}, {address.number}
                      {address.complement ? ` - ${address.complement}` : ""}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {address.neighborhood} - {address.city}/{address.state}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">CEP {address.cep}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAddress(address.id)}
                    className="shrink-0 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Adicionar novo endereço
          </h2>

          <div className="mt-3 flex flex-col gap-3">
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Nome (ex: Casa, Trabalho)"
              className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-700"
            />

            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={cep}
                onChange={(event) => handleCepChange(event.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="w-32 rounded-app border border-neutral-300 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-700"
              />
              <button
                type="button"
                onClick={() => runLookup(cep)}
                disabled={cepStatus === "loading"}
                className="flex-1 rounded-app border border-neutral-950 dark:border-neutral-100 bg-neutral-950 dark:bg-neutral-100 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 dark:text-neutral-950 transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {cepStatus === "loading" ? "Buscando..." : "Buscar CEP"}
              </button>
            </div>

            {cepStatus === "invalid" && (
              <p className="text-xs text-red-600 dark:text-red-400">Não encontramos esse CEP. Confira e tente de novo.</p>
            )}

            {resolvedAddress && (
              <>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {[resolvedAddress.street, resolvedAddress.neighborhood].filter(Boolean).join(", ")}
                  {resolvedAddress.city ? ` — ${resolvedAddress.city}/${resolvedAddress.state}` : ""}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                    placeholder="Número"
                    className="w-24 rounded-app border border-neutral-300 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-700"
                  />
                  <input
                    type="text"
                    value={complement}
                    onChange={(event) => setComplement(event.target.value)}
                    placeholder="Complemento (opcional)"
                    className="flex-1 rounded-app border border-neutral-300 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-700"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleAddAddress}
              disabled={!canSave || isSaving}
              className="rounded-app border border-neutral-300 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-100"
            >
              {isSaving ? "Salvando..." : "Salvar endereço"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
