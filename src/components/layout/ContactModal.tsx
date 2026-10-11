"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/apiClient";
import { sendContactMessage } from "@/lib/contact";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal simples de "Contato" aberto a partir do rodapé (pedido do Alfredo em
 * 2026-10-11, substituindo o antigo link "Contato" que apontava pra "/" -
 * ver o doc comment de `sections` em `<Footer/>`). Mesmo tratamento de
 * overlay em tela cheia que `<SearchOverlay/>` já usa (trava o scroll do
 * body enquanto aberto, fecha no "X" ou ao enviar com sucesso).
 *
 * Sem conta/token - qualquer visitante pode mandar, nome+e-mail+mensagem
 * só. O backend (`POST /api/v1/contact`) encaminha por e-mail pra loja - ver
 * `@/lib/contact`'s doc comment.
 */
export function ContactModal({ open, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Reseta o formulário só quando o modal termina de fechar (não no fechar
  // em si) - evita um piscar de "Mensagem enviada!" virando campos vazios
  // antes da animação/transição de saída terminar, caso o Alfredo reabra o
  // modal rapidamente depois de enviar.
  function handleClose() {
    onClose();
    setTimeout(() => {
      setName("");
      setEmail("");
      setMessage("");
      setErrorMessage(null);
      setIsSent(false);
    }, 200);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await sendContactMessage(name.trim(), email.trim(), message.trim());
      setIsSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Não deu pra enviar agora - tenta de novo em instantes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Contato"
      className="fixed inset-0 z-50 bg-white dark:bg-neutral-900 p-4 sm:p-6 overflow-y-auto animate-slide-down"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-6 sm:gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Contato
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="p-1 text-neutral-600 dark:text-neutral-400"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isSent ? (
          <div className="flex items-start gap-2.5 rounded-app border border-neutral-300 px-4 py-3.5 text-sm text-neutral-800 dark:border-neutral-700 dark:text-neutral-200">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden>
              <path
                d="M4.5 12.75l5.5 5.5L19.5 7.75"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Mensagem enviada! Vamos te responder por e-mail em breve.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-name" className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Nome
              </label>
              <input
                id="contact-name"
                type="text"
                required
                autoFocus
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                E-mail
              </label>
              <input
                id="contact-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                className="rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-message" className="text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Mensagem
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                maxLength={4000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="resize-none rounded-app border border-neutral-300 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100"
              />
            </div>
            {errorMessage && <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-app bg-neutral-950 py-3.5 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-950"
            >
              {isSubmitting ? "Enviando…" : "Enviar mensagem"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
