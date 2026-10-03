"use client";

import { useEffect, useRef, useState } from "react";
import { getOrderById } from "@/lib/orders";

export interface PixPaymentModalProps {
  token: string;
  orderId: string;
  qrCode: string;
  qrCodeBase64: string;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 4000;
// Mesma janela de validade comum de um QR Pix - depois disso para de
// consultar sozinho (o e-mail de recibo, ver `mailer.send_payment_receipt`,
// continua avisando o cliente se o pagamento vier a aprovar mais tarde).
const POLL_TIMEOUT_MS = 30 * 60 * 1000;

type PollState = "pending" | "approved" | "rejected" | "timeout";

/**
 * Modal do Pix "inline" (ampliação da Fase 6, parte 2, do briefing - decisão
 * confirmada com o Alfredo): abre direto depois do `POST /checkout` com
 * `paymentMethod: "pix"` (ver `<CheckoutView/>`), sem redirecionar pro
 * Mercado Pago. Mostra o QR Code (só quando a API real manda uma imagem -
 * em modo mock `qrCodeBase64` vem vazio, então só o código copia-e-cola
 * aparece) e consulta `GET /api/v1/orders/{id}` a cada poucos segundos até
 * o pagamento aprovar - mesma rota que `/pedido/[id]` já usa, nenhum
 * endpoint novo só pra isso. A aprovação em si só acontece pelo webhook do
 * Mercado Pago (`app/webhooks/__init__.py`) - este modal nunca decide
 * sozinho que um pagamento foi aprovado, só fica perguntando até o backend
 * confirmar.
 *
 * Fechar o modal sem pagar (botão "X") não cancela o pedido - ele já existe
 * no banco como "pending" desde a criação. Hoje não existe uma tela pra
 * "retomar esse Pix depois" (o QR não fica salvo no pedido pra ser
 * reaberto), então fechar cedo demais significa que o cliente só vai saber
 * que aprovou pelo e-mail de recibo, não por aqui - limitação conhecida,
 * registrada pro Alfredo decidir se vale a pena resolver depois.
 */
export function PixPaymentModal({ token, orderId, qrCode, qrCodeBase64, onClose }: PixPaymentModalProps) {
  const [state, setState] = useState<PollState>("pending");
  const [copied, setCopied] = useState(false);
  const startedAtRef = useRef(Date.now());
  // Ref espelhando `state` só pra o `setInterval` abaixo sempre ler o valor
  // mais recente sem precisar recriar o intervalo a cada mudança de estado
  // (closure "congelada" é o motivo clássico de polling que some ou nunca
  // para sozinho).
  const stateRef = useRef<PollState>("pending");
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (stateRef.current !== "pending") {
        clearInterval(interval);
        return;
      }
      try {
        const order = await getOrderById(token, orderId);
        const status = order.payment?.status;
        if (status === "approved") {
          setState("approved");
        } else if (status === "rejected" || status === "refunded") {
          setState("rejected");
        } else if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
          setState("timeout");
        }
      } catch {
        // Falha de rede pontual não interrompe o polling - tenta de novo
        // no próximo tick.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token, orderId]);

  useEffect(() => {
    if (state !== "approved") return;
    const timeout = setTimeout(() => {
      window.location.href = "/";
    }, 1800);
    return () => clearTimeout(timeout);
  }, [state]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard pode falhar (permissão negada, navegador antigo) - o
      // campo de texto logo abaixo já deixa selecionar/copiar manualmente.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-app bg-white p-6 shadow-xl dark:bg-neutral-900">
        {state === "approved" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-700 dark:bg-green-900/40 dark:text-green-400">
              ✓
            </span>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Pagamento aprovado!</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Redirecionando…</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
                  Pagamento via Pix
                </h2>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Pedido {orderId}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {qrCodeBase64 ? (
              <div className="mx-auto mt-4 h-48 w-48 overflow-hidden rounded-app border border-neutral-200 dark:border-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 vindo direto da API, não faz sentido pelo otimizador de imagem do Next */}
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code do Pix"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Copie o código abaixo no app do seu banco (Pix Copia e Cola).
              </p>
            )}

            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
              Pix Copia e Cola
            </label>
            <textarea
              readOnly
              value={qrCode}
              rows={3}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-1 w-full resize-none rounded-app border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 w-full rounded-app bg-neutral-950 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
            >
              {copied ? "Código copiado!" : "Copiar código"}
            </button>

            <p className="mt-3 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
              {state === "rejected"
                ? "O pagamento não foi aprovado - feche esta janela e tente de novo."
                : state === "timeout"
                  ? "Ainda não identificamos o pagamento. Pode fechar esta janela - avisamos por e-mail assim que aprovar."
                  : "Abra o app do seu banco, escolha Pix Copia e Cola e cole o código. Assim que aprovar, atualizamos aqui sozinho."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
