import { apiFetch } from "./apiClient";

export interface ShippingQuote {
  id: string;
  carrier: string;
  service: string;
  price: number;
  estimatedDays: number;
}

interface ShippingQuoteResponse {
  options: ShippingQuote[];
}

/**
 * Cotação real de frete contra o backend (`POST /api/v1/shipping/quote` -
 * ver `app/checkout/__init__.py` e `app/integrations/melhor_envio.py`),
 * fase 4 do roadmap. Pública (sem `token`) - mesma regra da rota no
 * backend. Enquanto não há `MELHOR_ENVIO_TOKEN` configurado no servidor, o
 * backend roda a MESMA fórmula determinística que vivia aqui antes
 * (copiada literalmente pro Python - ver o doc comment de
 * `melhor_envio.py`), então os valores mostrados continuam idênticos ao
 * que já era mostrado antes desta mudança; a diferença é que agora vêm de
 * uma chamada de rede, não de uma conta local.
 */
export async function getShippingQuotes(cep: string): Promise<ShippingQuote[]> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return [];

  try {
    const data = await apiFetch<ShippingQuoteResponse>("/shipping/quote", {
      method: "POST",
      body: { cep: digits },
    });
    return data.options;
  } catch {
    // Backend fora do ar / CEP sem cobertura - mesmo comportamento de antes
    // (lista vazia), pra UI já saber lidar com "nenhuma opção encontrada".
    return [];
  }
}

export interface DispatchQuote extends ShippingQuote {
  originCep: string;
  destinationCep: string;
  weightKg: number;
}

interface DispatchResponse {
  options: DispatchQuote[];
}

/**
 * "Cálculo de despacho" livre do admin (`<AdminShippingTab/>`) - real contra
 * `POST /api/v1/admin/shipping/dispatch`, que espelha esta mesma função 1:1
 * do lado do Flask agora. Exige token de admin.
 */
export async function calculateDispatch(
  token: string,
  originCep: string,
  destinationCep: string,
  weightKg: number,
): Promise<DispatchQuote[]> {
  try {
    const data = await apiFetch<DispatchResponse>("/admin/shipping/dispatch", {
      method: "POST",
      token,
      body: {
        originCep: originCep.trim() ? originCep : undefined,
        destinationCep,
        weightKg,
      },
    });
    return data.options;
  } catch {
    return [];
  }
}
