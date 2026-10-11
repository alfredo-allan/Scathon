import { apiFetch } from "./apiClient";

/**
 * Modal de "Contato" no rodapé (pedido do Alfredo em 2026-10-11) - fala com
 * `POST /api/v1/contact` no backend real (`scathon-api`, ver
 * `app/catalog/__init__.py`), que encaminha a mensagem por e-mail pra loja
 * (`CONTACT_FORM_EMAIL`, hoje `contato@scathon.com.br`). Sem conta, sem
 * token - igual ao formulário de visitante do `<NotifyMeButton/>`
 * (`@/lib/waitlist`), mas sem equivalente logado: contato não depende de já
 * ter comprado nada.
 */
export async function sendContactMessage(name: string, email: string, message: string): Promise<void> {
  await apiFetch<{ ok: boolean }>("/contact", {
    method: "POST",
    body: { name, email, message },
  });
}
