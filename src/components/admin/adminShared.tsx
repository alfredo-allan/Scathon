"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { OrderStatus, PaymentStatus } from "@/lib/adminOrders";

/** Below this stock count, `<AdminInventoryTab/>`/`<AdminOverviewTab/>` flag a product as "estoque baixo" instead of waiting for it to hit zero. */
export const LOW_STOCK_THRESHOLD = 5;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  processando: "Processando",
  "a caminho": "A caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

// Same monochrome border/pill treatment `<AccountOrdersView/>` already uses
// for a customer's own order status - kept consistent rather than
// reinventing a second visual language for the same states in the admin
// view.
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  processando: "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400",
  "a caminho": "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100",
  entregue:
    "border-neutral-300 bg-neutral-900 text-neutral-50 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950",
  cancelado: "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400",
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { dot: string; label: string }> = {
  approved: { dot: "bg-emerald-500", label: "Aprovado" },
  pending: { dot: "bg-amber-500", label: "Pendente" },
  refunded: { dot: "bg-neutral-400", label: "Reembolsado" },
  rejected: { dot: "bg-red-500", label: "Rejeitado" },
};

/**
 * A colored dot plus a text label - never color alone - for a payment
 * receipt's Mercado-Pago-style status. Shared between `<AdminOverviewTab/>`
 * and `<AdminOrdersTab/>` so the same status always reads the same way
 * wherever it shows up in the panel.
 */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status];
  return (
    <span className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  );
}

/**
 * Lightbox genérico - foto em destaque, fundo com opacidade
 * (`bg-neutral-950/80` + leve blur). Extraído de `<AdminCustomersTab/>`
 * (onde nasceu, pra foto de perfil do cliente) pra ser reaproveitado por
 * `<AdminOrdersTab/>` também (nota fiscal anexada ao pedido) - mesmo
 * componente, só `src`/`alt`/`caption` mudam.
 *
 * Um modal fixo em tela cheia já é, por natureza, a solução mobile aqui
 * (não tem layout de tabela/coluna pra adaptar) - os únicos cuidados extras
 * pra toque são: botão de fechar com alvo de ≥44px (`h-11 w-11`, recomendação
 * de acessibilidade pra toque), e a imagem sempre limitada a `vw`/`vh`
 * (nunca vaza da tela, celular ou desktop). Fecha ao clicar fora, no X, ou
 * com Esc; trava o scroll do body enquanto aberto pra não "vazar" o fundo
 * rolando atrás no celular.
 */
export function ImageLightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {/* `stopPropagation` aqui - senão clicar na própria imagem "vaza" pro
          backdrop e fecha o lightbox junto, já que os dois são o mesmo
          elemento clicável em cascata. */}
      <figure onClick={(event) => event.stopPropagation()} className="flex flex-col items-center gap-3">
        <Image
          src={src}
          alt={alt}
          width={480}
          height={480}
          unoptimized
          className="max-h-[75vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl sm:max-h-[80vh] sm:max-w-[70vw]"
        />
        {caption && <figcaption className="text-sm font-medium text-white/90">{caption}</figcaption>}
      </figure>
    </div>
  );
}
