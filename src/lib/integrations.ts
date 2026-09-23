export interface IntegrationStatus {
  id: "mercado_pago" | "melhor_envio";
  name: string;
  connected: boolean;
  mode: "sandbox" | "produção";
  /**
   * The env vars the real integration needs - shown in the admin panel only
   * as names/labels, never values. These belong in server-side environment
   * variables (Vercel project settings, `.env.local` - never committed)
   * once there's a real backend; the client bundle must never see a real
   * secret, only whether one has been configured.
   */
  requiredEnvVars: string[];
  /** Where that provider's webhook (payment/shipment status updates) would land once there's a server route to receive it. */
  webhookPath: string;
  docsUrl: string;
}

/**
 * Static "estado da integração" for `<AdminIntegrationsTab/>` - both
 * providers already have real client-side seams (`@/lib/mercadoPago`,
 * `@/lib/melhorEnvio`) that return realistic mock data, but neither has
 * credentials yet, so `connected` stays `false` for both. This is a
 * checklist of what "ligar de verdade" requires, not a settings form that
 * writes anywhere - flipping these on for real happens by setting the env
 * vars listed here on the server and swapping the mock function bodies for
 * the real `fetch` calls already sketched in their doc comments.
 */
export const INTEGRATIONS: IntegrationStatus[] = [
  {
    id: "mercado_pago",
    name: "Mercado Pago",
    connected: false,
    mode: "sandbox",
    requiredEnvVars: ["MERCADO_PAGO_ACCESS_TOKEN", "MERCADO_PAGO_PUBLIC_KEY", "MERCADO_PAGO_WEBHOOK_SECRET"],
    webhookPath: "/api/webhooks/mercado-pago",
    docsUrl: "https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing",
  },
  {
    id: "melhor_envio",
    name: "Melhor Envio",
    connected: false,
    mode: "sandbox",
    requiredEnvVars: ["MELHOR_ENVIO_CLIENT_ID", "MELHOR_ENVIO_CLIENT_SECRET", "MELHOR_ENVIO_TOKEN"],
    webhookPath: "/api/webhooks/melhor-envio",
    docsUrl: "https://docs.menvio.me/",
  },
];
