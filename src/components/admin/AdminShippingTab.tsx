"use client";

import { useState } from "react";
import { formatCep, isCompleteCep } from "@/lib/viaCep";
import { calculateDispatch, type DispatchQuote } from "@/lib/melhorEnvio";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * "Frete & Despacho" tab: the admin-side counterpart to the storefront's
 * `<ShippingEstimator/>`/`<CartView/>` - instead of a fixed store origin,
 * lets the admin quote any origem/destino/peso combination on demand
 * (`@/lib/melhorEnvio`'s `calculateDispatch`), the way Melhor Envio's own
 * "cotação" screen works. Useful for a one-off shipment, or for sanity-
 * checking a quote before a customer even asks.
 */
export function AdminShippingTab() {
  const [originCep, setOriginCep] = useState("");
  const [destinationCep, setDestinationCep] = useState("");
  const [weight, setWeight] = useState("1");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [quotes, setQuotes] = useState<DispatchQuote[]>([]);

  const originValid = isCompleteCep(originCep);
  const destinationValid = isCompleteCep(destinationCep);
  const weightValid = Number(weight) > 0;
  const canCalculate = originValid && destinationValid && weightValid && status !== "loading";

  async function handleCalculate() {
    if (!canCalculate) return;
    setStatus("loading");
    const results = await calculateDispatch(originCep, destinationCep, Number(weight));
    if (results.length === 0) {
      setStatus("error");
      setQuotes([]);
      return;
    }
    setQuotes(results);
    setStatus("done");
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
      <div className="flex w-full flex-col gap-3 lg:max-w-xs">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
          CEP de origem
          <input
            type="text"
            inputMode="numeric"
            value={originCep}
            onChange={(event) => setOriginCep(formatCep(event.target.value))}
            placeholder="00000-000"
            maxLength={9}
            className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
          CEP de destino
          <input
            type="text"
            inputMode="numeric"
            value={destinationCep}
            onChange={(event) => setDestinationCep(formatCep(event.target.value))}
            placeholder="00000-000"
            maxLength={9}
            className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
          Peso do pacote (kg)
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            className="w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
          />
        </label>

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!canCalculate}
          className="mt-1 rounded-app border border-neutral-950 bg-neutral-950 px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-40 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950"
        >
          {status === "loading" ? "Calculando..." : "Calcular despacho"}
        </button>

        {status === "error" && (
          <p className="text-xs text-red-600 dark:text-red-400">Não encontramos opções de frete para esse CEP.</p>
        )}
      </div>

      <div className="flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Cotações
        </h2>

        {quotes.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            Informe origem, destino e peso pra ver as opções de envio.
          </p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-neutral-100 rounded-app border border-neutral-200 dark:divide-neutral-900 dark:border-neutral-800">
            {quotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {quote.carrier} · {quote.service}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Prazo estimado: {quote.estimatedDays} {quote.estimatedDays === 1 ? "dia útil" : "dias úteis"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {currencyFormatter.format(quote.price)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
