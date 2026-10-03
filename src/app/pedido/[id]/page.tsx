import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmationView } from "@/components/orders/OrderConfirmationView";

export const metadata: Metadata = {
  title: "Pedido — Scathon",
  description: "Confira os detalhes do seu pedido, pagamento e entrega.",
};

interface OrderPageParams {
  id: string;
}

export default async function OrderPage({ params }: { params: Promise<OrderPageParams> }) {
  const { id } = await params;
  return (
    // `<OrderConfirmationView/>` usa `useSearchParams()` (pra ler `?mock=true`
    // e `?status=failure|pending` do retorno do checkout) - o Next exige que
    // todo uso de `useSearchParams()` numa página fique dentro de um
    // `<Suspense>`, senão `next build` falha com "missing-suspense-with-csr-
    // bailout" mesmo numa rota sem `generateStaticParams()` como esta.
    <Suspense fallback={<div className="px-4 md:px-8 py-6 text-sm text-neutral-500 dark:text-neutral-400">Carregando pedido…</div>}>
      <OrderConfirmationView orderId={id} />
    </Suspense>
  );
}
