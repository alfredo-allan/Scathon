"use client";

import { useState } from "react";

/**
 * "Calcular frete" mock - there's no real carrier/CEP integration yet, so
 * this validates the CEP shape (8 digits) and returns a generic estimate
 * instead of a fabricated specific delivery date/carrier quote. It exists
 * so the detail page's layout and interaction pattern are already in
 * place; swap `estimateShipping` for a real API call once one exists.
 */
function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function estimateShipping(cep: string): { ok: true; message: string } | { ok: false; message: string } {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return { ok: false, message: "Digite um CEP válido com 8 dígitos." };
  }
  return {
    ok: true,
    message: "Entrega estimada em até 7 dias úteis. Frete calculado no fechamento do pedido.",
  };
}

export function ShippingEstimator() {
  const [cep, setCep] = useState("");
  const [result, setResult] = useState<ReturnType<typeof estimateShipping> | null>(null);

  function handleCalculate() {
    setResult(estimateShipping(cep));
  }

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

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={cep}
          onChange={(event) => setCep(formatCep(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleCalculate();
          }}
          placeholder="00000-000"
          maxLength={9}
          className="w-full max-w-[160px] border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500"
        />
        <button
          type="button"
          onClick={handleCalculate}
          className="border border-neutral-950 dark:border-neutral-100 bg-neutral-950 dark:bg-neutral-100 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 dark:text-neutral-950 transition-opacity hover:opacity-80"
        >
          Calcular
        </button>
      </div>

      {result && (
        <p
          className={`mt-3 text-xs ${
            result.ok
              ? "text-neutral-600 dark:text-neutral-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {result.message}
        </p>
      )}

      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        Confira a nossa{" "}
        <a href="/politica-de-frete" className="underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100">
          Política de Frete e Entregas
        </a>
        .
      </p>
    </div>
  );
}
