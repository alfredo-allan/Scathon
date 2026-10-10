"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { connectMelhorEnvio, getIntegrations, type IntegrationStatus } from "@/lib/integrations";

/**
 * Resultado da volta do OAuth da Melhor Envio (`?melhorEnvio=connected|error`
 * na URL - ver `GET /webhooks/melhor-envio/oauth-callback` no backend, que
 * redireciona o navegador de volta pra cá). Lido uma vez na montagem e
 * limpo da URL logo em seguida (`history.replaceState`) - sem isso, dar F5
 * na página mostraria o mesmo aviso de novo pra sempre.
 */
function readOAuthCallbackResult(): "connected" | "error" | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get("melhorEnvio");
  if (value !== "connected" && value !== "error") return null;
  params.delete("melhorEnvio");
  const query = params.toString();
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState({}, "", newUrl);
  return value;
}

/**
 * "Integrações" tab: estado real do Mercado Pago e da Melhor Envio
 * (`GET /api/v1/admin/integrations` - ver `@/lib/integrations`) - `connected`
 * agora reflete de verdade se o servidor tem as credenciais configuradas,
 * nunca um `false` fixo. Continua sem formulário nenhum que salve algo -
 * essas variáveis só existem no `.env` do servidor, nunca no bundle do
 * cliente.
 */
export function AdminIntegrationsTab() {
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oauthResult, setOauthResult] = useState<"connected" | "error" | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    setOauthResult(readOAuthCallbackResult());
  }, []);

  async function handleConnect(id: "melhor_envio") {
    if (!token) return;
    setConnectingId(id);
    setConnectError(null);
    try {
      const { authorizeUrl } = await connectMelhorEnvio(token);
      // Navegação de página inteira de propósito (não um `fetch` de novo) -
      // o resto do fluxo OAuth acontece fora do nosso app, na tela da
      // própria Melhor Envio.
      window.location.href = authorizeUrl;
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Não foi possível iniciar a conexão com a Melhor Envio agora.",
      );
      setConnectingId(null);
    }
  }

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setIntegrations(await getIntegrations(token));
    } catch {
      setErrorMessage("Não foi possível carregar o estado das integrações agora.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando integrações…</p>;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
        Enquanto as credenciais reais não estiverem configuradas no servidor, o checkout e o cálculo de frete usam
        dados determinísticos (não aleatórios), pra já dar pra testar o fluxo completo. Mercado Pago e SMTP ativam
        preenchendo as variáveis direto no <span className="font-mono">.env</span> da VPS (nunca aqui) e reiniciando
        o serviço. A Melhor Envio é diferente - usa OAuth de verdade, então depois de preencher
        <span className="font-mono"> MELHOR_ENVIO_CLIENT_ID</span>/<span className="font-mono">CLIENT_SECRET</span>/
        <span className="font-mono"> MELHOR_ENVIO_REDIRECT_URI</span> no servidor, precisa clicar em "Conectar"
        abaixo pra autorizar de verdade.
      </p>

      {oauthResult === "connected" && (
        <p className="rounded-app border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          Melhor Envio conectada com sucesso.
        </p>
      )}
      {oauthResult === "error" && (
        <p className="rounded-app border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Não foi possível concluir a conexão com a Melhor Envio. Tente clicar em "Conectar" de novo.
        </p>
      )}
      {connectError && (
        <p className="text-sm text-red-600 dark:text-red-400">{connectError}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <div key={integration.id} className="rounded-app border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{integration.name}</p>
              <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${integration.connected ? "bg-emerald-500" : "bg-neutral-400"}`}
                  aria-hidden
                />
                {integration.connected ? "Conectado" : "Não conectado"}
              </span>
            </div>

            <p className="mt-1 text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Modo: {integration.mode}
            </p>

            <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-900">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Variáveis de ambiente necessárias
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {integration.requiredEnvVars.map((name) => (
                  <li key={name} className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {name}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              Webhook: <span className="font-mono">{integration.webhookPath}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
              >
                Ver documentação
              </a>

              {integration.id === "melhor_envio" && (
                <button
                  type="button"
                  onClick={() => handleConnect("melhor_envio")}
                  disabled={connectingId === "melhor_envio"}
                  className="rounded-app border border-neutral-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-900 transition-colors hover:border-neutral-500 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
                >
                  {connectingId === "melhor_envio"
                    ? "Redirecionando…"
                    : integration.connected
                      ? "Reconectar"
                      : "Conectar"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
