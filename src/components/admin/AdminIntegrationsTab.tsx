"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getIntegrations, type IntegrationStatus } from "@/lib/integrations";

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
        dados determinísticos (não aleatórios), pra já dar pra testar o fluxo completo. Ativar de verdade é
        preencher as variáveis abaixo direto no <span className="font-mono">.env</span> da VPS (nunca aqui) e
        reiniciar o serviço - o restante do app não precisa mudar.
      </p>

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

            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
            >
              Ver documentação
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
