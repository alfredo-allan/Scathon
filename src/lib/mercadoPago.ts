import { apiFetch } from "./apiClient";
import type { DeliveryMethod } from "./checkoutShipping";

export type PaymentMethod = "pix" | "credito" | "boleto";

export interface CheckoutItemInput {
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

export interface SubmitCheckoutInput {
  addressId: string;
  items: CheckoutItemInput[];
  deliveryMethod: DeliveryMethod;
  /** Obrigatório quando `deliveryMethod` é "melhor_envio" - o `id` da opção escolhida em `getShippingQuotes`. */
  shippingQuoteId?: string | null;
  /** Só usado quando `deliveryMethod` é "combinar_com_vendedor". */
  shippingNote?: string | null;
  paymentMethod: PaymentMethod;
}

export interface PlacedOrder {
  id: string;
  placedAt: string;
  status: string;
}

export interface SubmitCheckoutResult {
  order: PlacedOrder;
  checkout: {
    method: PaymentMethod;
    /**
     * Só presente quando `method` é "credito"/"boleto" - pra onde
     * redirecionar o navegador pra concluir o pagamento (Checkout Pro). Em
     * modo mock (sem `MERCADO_PAGO_ACCESS_TOKEN` no servidor - ver
     * `app/integrations/mercado_pago.py`), já é a própria página de
     * confirmação do pedido (`/pedido/{id}`) com `?mock=true` - o mesmo
     * link que o Mercado Pago de verdade devolveria (`init_point`) quando
     * as credenciais reais entrarem.
     */
    initPoint?: string;
    preferenceId?: string;
    /**
     * Só presente quando `method` é "pix" - fluxo "inline" (decisão
     * confirmada com o Alfredo): sem redirecionar, `<PixPaymentModal/>`
     * mostra o QR Code/código copia-e-cola direto aqui e consulta
     * `GET /orders/{id}` até o pagamento aprovar pelo webhook.
     */
    pix?: {
      qrCode: string;
      /** Em modo mock vem vazio - só a API real manda a imagem pronta. */
      qrCodeBase64: string;
      ticketUrl: string;
    };
  };
}

/**
 * Fecha o pedido de verdade contra o backend (`POST /api/v1/checkout` - ver
 * `app/checkout/__init__.py`), fase 4 do roadmap. Substitui o antigo mock
 * que só gerava um id/timestamp falso - agora cria um `Order`/`Payment`
 * reais, valida estoque e re-cota o frete no servidor (nunca confia num
 * preço que o cliente mande). A forma de concluir o pagamento depende do
 * `method` da resposta (ver `SubmitCheckoutResult.checkout` acima) - Pix
 * fica num modal inline, cartão/boleto redirecionam pro Checkout Pro.
 * Exige sessão - `<CheckoutView/>` já garante isso antes de chamar.
 */
export async function submitCheckout(
  token: string,
  input: SubmitCheckoutInput,
): Promise<SubmitCheckoutResult> {
  return apiFetch<SubmitCheckoutResult>("/checkout", {
    method: "POST",
    token,
    body: {
      addressId: input.addressId,
      items: input.items,
      deliveryMethod: input.deliveryMethod,
      shippingQuoteId: input.shippingQuoteId ?? undefined,
      shippingNote: input.shippingNote ?? undefined,
      paymentMethod: input.paymentMethod,
    },
  });
}
