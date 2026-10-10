"use client";

import { useEffect, useState } from "react";
import { formatDocument, isValidDocument, onlyDigits } from "@/lib/documentValidation";

export interface RecipientDocumentModalProps {
  /** Já preenchido quando o cliente volta pra editar um valor confirmado antes. */
  initialValue?: string | null;
  onClose: () => void;
  onSubmit: (digits: string) => void;
}

/**
 * Pedido do Alfredo em 2026-10-10 (segunda decisão do dia): quando o frete
 * escolhido no carrinho é pela Melhor Envio, o CPF/CNPJ do destinatário
 * passa a ser pedido direto AQUI, pro próprio cliente, dentro do checkout -
 * não mais só na hora do admin comprar a etiqueta no painel (`<ShippingLabel
 * Modal/>` em `<AdminOrdersTab/>`, que continua existindo como reserva pra
 * pedido sem esse dado, ex. feito antes dessa mudança). `<CheckoutView/>`
 * abre isto automaticamente assim que a página carrega com frete
 * "melhor_envio" e nenhum valor confirmado ainda, e de novo se o cliente
 * clicar "Editar" no resumo de Entrega.
 *
 * Visual com a identidade da Scathon - mesmo padrão de overlay/cartão/CTA
 * do resto do checkout (compare com `<PixPaymentModal/>`), nada de
 * aparência de formulário genérico de terceiro.
 */
export function RecipientDocumentModal({ initialValue, onClose, onSubmit }: RecipientDocumentModalProps) {
  const [draft, setDraft] = useState(initialValue ? formatDocument(initialValue) : "");
  const [showError, setShowError] = useState(false);
  const digits = onlyDigits(draft);
  const isValid = isValidDocument(digits);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function handleSubmit() {
    if (!isValid) {
      setShowError(true);
      return;
    }
    onSubmit(digits);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar CPF ou CNPJ do destinatário"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-app bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
          Scathon · Dados de envio
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          Pra emitir a etiqueta pelos Correios/transportadora, precisamos do CPF ou CNPJ de quem vai
          receber o pedido.
        </p>

        <label
          htmlFor="recipient-document"
          className="mt-4 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
        >
          CPF ou CNPJ do destinatário
        </label>
        <input
          id="recipient-document"
          type="text"
          inputMode="numeric"
          autoFocus
          value={draft}
          onChange={(event) => {
            setShowError(false);
            setDraft(formatDocument(event.target.value));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmit();
          }}
          placeholder="000.000.000-00"
          className="mt-1 w-full rounded-app border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100"
        />
        {showError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {digits.length !== 11 && digits.length !== 14
              ? "Digite um CPF (11 números) ou CNPJ (14 números)."
              : "Esse CPF/CNPJ não é válido - confira os números."}
          </p>
        )}

        <p className="mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
          Enviado junto com o resto do pedido, pela mesma conexão segura do checkout - usado só pra
          gerar a etiqueta de envio.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-app border border-neutral-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!draft}
            className="rounded-app bg-neutral-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-50 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-950"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
