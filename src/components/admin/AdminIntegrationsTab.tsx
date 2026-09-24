import { INTEGRATIONS } from "@/lib/integrations";

/**
 * "Integrações" tab: estado do Mercado Pago e do Melhor Envio - ambos já
 * têm código real pronto pra usar (`@/lib/mercadoPago`, `@/lib/melhorEnvio`)
 * mas nenhum credencial ainda, então aparecem como "não conectado" de
 * propósito. Isso é uma checklist do que falta pra ligar de verdade, não um
 * formulário que salva nada - o "seguro" aqui é justamente nunca aceitar um
 * token pela UI: essas variáveis vivem no servidor (env vars), nunca no
 * bundle do cliente.
 */
export function AdminIntegrationsTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
        Nenhuma credencial real foi configurada ainda - o checkout e o cálculo de frete usam dados mock
        (determinísticos, não aleatórios) pra já dar pra visualizar o fluxo completo. Ativar de verdade é
        configurar as variáveis abaixo no servidor e trocar a função mock correspondente pela chamada real -
        o restante do app não precisa mudar.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
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
