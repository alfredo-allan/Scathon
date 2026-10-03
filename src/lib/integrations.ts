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
