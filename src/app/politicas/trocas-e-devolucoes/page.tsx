import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trocas e Devoluções — Scathon",
  description: "Política de trocas, devoluções e direito de arrependimento da Scathon.",
};

/**
 * Página estática de política de trocas/devoluções (pedido do Alfredo em
 * 2026-10-11, pra substituir o antigo link placeholder "Trocas e
 * Devoluções" do rodapé, que apontava pra "/" - ver `<Footer/>`).
 *
 * Conteúdo alinhado ao Código de Defesa do Consumidor (arrependimento -
 * art. 49 - e vício do produto - arts. 18/26) e ao Decreto 7.962/2013
 * (comércio eletrônico). Texto GENÉRICO, pensado pra já sair no ar
 * cobrindo o essencial - revisar com um advogado antes de tratar como
 * política final, principalmente os PRAZOS DE REEMBOLSO (aqui "até 10 dias
 * úteis" é só um prazo comum de mercado, não um número exigido por lei) e
 * o endereço físico de devolução, que ainda não está preenchido.
 */
export default function TrocasEDevolucoesPage() {
  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Trocas e Devoluções</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
          Trocas e Devoluções
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Última atualização: outubro de 2026.
        </p>

        <div className="mt-8 flex flex-col gap-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Direito de arrependimento (7 dias)
            </h2>
            <p>
              Como a compra é feita fora de um estabelecimento físico, você tem até{" "}
              <strong>7 (sete) dias corridos</strong>, contados a partir do dia em que recebe o
              produto, para desistir da compra sem precisar dar nenhum motivo - direito garantido
              pelo Código de Defesa do Consumidor (art. 49) e pelo Decreto nº 7.962/2013.
            </p>
            <p className="mt-2">
              Nesse caso, devolvemos <strong>100% do valor pago, incluindo o frete</strong> da
              entrega original, sem nenhum custo extra pra você.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Troca ou devolução por defeito
            </h2>
            <p>
              Se o produto chegar com defeito de fabricação, você tem até{" "}
              <strong>30 (trinta) dias corridos</strong> a partir do recebimento pra nos avisar
              (art. 26 do Código de Defesa do Consumidor). Nesse caso, o frete de ida e volta corre
              por nossa conta, e você escolhe entre troca pelo mesmo produto, troca por outro ou
              reembolso integral.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Condições para aceitar a devolução
            </h2>
            <p>Pra devoluções por arrependimento (sem defeito), o produto precisa estar:</p>
            <ul className="mt-2 flex flex-col gap-1.5 pl-5 list-disc marker:text-neutral-400">
              <li>sem sinais de uso e com as etiquetas originais;</li>
              <li>na embalagem original, sempre que possível;</li>
              <li>acompanhado da nota fiscal ou do número do pedido.</li>
            </ul>
            <p className="mt-2">
              Pra devoluções por defeito, essas condições não se aplicam - o defeito em si já
              garante o seu direito, independente do estado da embalagem.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Como solicitar
            </h2>
            <p>
              Entre em contato pelo nosso{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                formulário de contato
              </span>{" "}
              (no rodapé do site) ou pelo e-mail{" "}
              <a
                href="mailto:contato@scathon.com.br"
                className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
              >
                contato@scathon.com.br
              </a>
              , informando o número do pedido e o motivo da troca/devolução. Vamos te responder com
              o passo a passo e, quando aplicável, o código de postagem para envio sem custo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Reembolso
            </h2>
            <p>
              Após recebermos e conferirmos o produto devolvido, o reembolso é processado em até{" "}
              <strong>10 (dez) dias úteis</strong>, pelo mesmo meio de pagamento usado na compra
              (estorno no cartão ou, no caso de Pix/boleto, transferência pra uma conta de sua
              titularidade).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
