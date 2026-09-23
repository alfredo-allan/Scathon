"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCep, isCompleteCep, lookupAddressByCep, type ViaCepAddress } from "@/lib/viaCep";
import { getShippingQuotes, type ShippingQuote } from "@/lib/melhorEnvio";
import { useSavedAddresses } from "@/hooks/useSavedAddresses";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type LookupStatus = "idle" | "loading" | "done" | "invalid";

/**
 * "Calcular frete" on the product detail page - a quick estimate, not the
 * final shipping choice (that's a cart-level decision made once in
 * `<CartView/>`, since it can cover several line items at once). As the
 * customer types a CEP it auto-formats to Brazil's `00000-000` pattern
 * (`formatCep`), and once it's complete this quietly resolves + shows the
 * matching street/neighborhood/city via the real ViaCEP API
 * (`lookupAddressByCep`) alongside a Melhor Envio quote (`getShippingQuotes`
 * - currently mocked, see that file's doc comment for why). When the
 * customer already has saved addresses, a subtle prompt offers to reuse one
 * instead of retyping a CEP.
 */
export function ShippingEstimator() {
  const [cep, setCep] = useState("");
  const [status, setStatus] = useState<LookupStatus>("idle");
  const [address, setAddress] = useState<ViaCepAddress | null>(null);
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const savedAddresses = useSavedAddresses();

  async function runLookup(rawCep: string) {
    if (!isCompleteCep(rawCep)) {
      setStatus("invalid");
      setAddress(null);
      setQuotes([]);
      return;
    }
    setStatus("loading");
    const [resolvedAddress, resolvedQuotes] = await Promise.all([
      lookupAddressByCep(rawCep),
      getShippingQuotes(rawCep),
    ]);
    setAddress(resolvedAddress);
    setQuotes(resolvedQuotes);
    setStatus("done");
  }

  function handleCepChange(value: string) {
    const formatted = formatCep(value);
    setCep(formatted);
    if (!isCompleteCep(formatted)) {
      setStatus("idle");
      setAddress(null);
      setQuotes([]);
    }
  }

  function handleUseSavedAddress(savedCep: string) {
    const formatted = formatCep(savedCep);
    setCep(formatted);
    runLookup(formatted);
  }

  const cheapestQuote = quotes.length > 0 ? [...quotes].sort((a, b) => a.price - b.price)[0] : null;

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Calcular frete
        </h2>
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Não sei o CEP
        </a>
      </div>

      {savedAddresses.length > 0 && cep.length === 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <span>Deseja entregar em algum dos seus endereços salvos?</span>
          {savedAddresses.map((saved) => (
            <button
              key={saved.id}
              type="button"
              onClick={() => handleUseSavedAddress(saved.cep)}
              className="border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-800 transition-colors hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
            >
              {saved.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={cep}
          onChange={(event) => handleCepChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") runLookup(cep);
          }}
          placeholder="00000-000"
          maxLength={9}
          className="w-full max-w-[160px] border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500"
        />
        <button
          type="button"
          onClick={() => runLookup(cep)}
          disabled={status === "loading"}
          className="border border-neutral-950 dark:border-neutral-100 bg-neutral-950 dark:bg-neutral-100 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 dark:text-neutral-950 transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {status === "loading" ? "Calculando..." : "Calcular"}
        </button>
      </div>

      {status === "invalid" && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">Digite um CEP válido com 8 dígitos.</p>
      )}

      {status === "done" && (
        <div className="mt-3 flex flex-col gap-1">
          {address && (address.street || address.city) && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {[address.street, address.neighborhood].filter(Boolean).join(", ")}
              {address.city ? ` — ${address.city}/${address.state}` : ""}
            </p>
          )}
          {cheapestQuote ? (
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Entrega estimada em até {cheapestQuote.estimatedDays} dias úteis, a partir de{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {currencyFormatter.format(cheapestQuote.price)}
              </span>{" "}
              ({cheapestQuote.carrier} {cheapestQuote.service}).{" "}
              <Link href="/cart" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100">
                Ver todas as opções no carrinho
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-red-600 dark:text-red-400">
              Não foi possível calcular o frete para esse CEP agora. Tente novamente no carrinho.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        Confira a nossa{" "}
        {/* No dedicated policy page yet - points home rather than 404ing
            (same fix as the rest of the site's still-missing pages; see
            `@/data/categories`'s doc comment). */}
        <Link href="/" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100">
          Política de Frete e Entregas
        </Link>
        .
      </p>
    </div>
  );
}
