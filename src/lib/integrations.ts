import { apiFetch } from "./apiClient";

export interface IntegrationStatus {
  id: "mercado_pago" | "melhor_envio";
  name: string;
  connected: boolean;
  mode: "sandbox" | "produção";
  requiredEnvVars: string[];
  webhookPath: string;
  docsUrl: string;
}

interface IntegrationsResponse {
  integrations: IntegrationStatus[];
}

/**
 * Estado real das integrações (`GET /api/v1/admin/integrations` - ver
 * `app/admin/__init__.py`), fase 4 do roadmap. Substitui o array estático
 * `INTEGRATIONS` (sempre `connected: false`) - agora `connected` reflete de
 * verdade se o servidor tem as credenciais configuradas
 * (`mercado_pago.is_connected()`/`melhor_envio.is_connected()`), nunca um
 * valor hardcoded. Exige token de admin.
 */
export async function getIntegrations(token: string): Promise<IntegrationStatus[]> {
  const data = await apiFetch<IntegrationsResponse>("/admin/integrations", { token });
  return data.integrations;
}

/**
 * Inicia a conexão OAuth com a Melhor Envio (`POST /admin/integrations/
 * melhor-envio/connect` - ver `app/admin/__init__.py`) - pedido do Alfredo
 * (2026-10-10): diferente do Mercado Pago/SMTP (credencial fixa, só preenche
 * o `.env`), a Melhor Envio exige autorizar numa tela deles, então o botão
 * "Conectar" pega essa URL e redireciona a página inteira pra lá
 * (`window.location.href = authorizeUrl` - ver `<AdminIntegrationsTab/>`),
 * nunca um `fetch` de novo depois.
 */
export async function connectMelhorEnvio(token: string): Promise<{ authorizeUrl: string }> {
  return apiFetch<{ authorizeUrl: string }>("/admin/integrations/melhor-envio/connect", {
    method: "POST",
    token,
  });
}
