import { cepDigits } from "./viaCep";

export interface ShippingQuote {
  id: string;
  carrier: string;
  service: string;
  price: number;
  estimatedDays: number;
}

/**
 * Deterministic mock quotes - no Melhor Envio credentials (OAuth client
 * id/secret + a shipping-from CEP) exist for this project yet, so this
 * stands in for `POST /api/v2/me/shipment/calculate` until they do. Kept
 * deterministic (seeded off the CEP's own digits, not `Math.random()`) so
 * the same CEP always quotes the same prices/deadlines in a session -
 * closer to how a real carrier API behaves, and easier to eyeball while
 * testing the cart/checkout flow.
 *
 * Swapping this out for the real integration later is a one-function
 * change - every caller (`<ShippingEstimator/>`, `<CartView/>`) only ever
 * sees `ShippingQuote[]`, so the body below becomes:
 *
 *   const response = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
 *     method: "POST",
 *     headers: {
 *       "Content-Type": "application/json",
 *       Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
 *     },
 *     body: JSON.stringify({
 *       from: { postal_code: STORE_ORIGIN_CEP },
 *       to: { postal_code: cepDigits(cep) },
 *       products: cartItemsAsMelhorEnvioProducts(items),
 *     }),
 *   });
 *   return (await response.json()).map(mapMelhorEnvioService);
 */
export async function getShippingQuotes(cep: string): Promise<ShippingQuote[]> {
  const digits = cepDigits(cep);
  if (digits.length !== 8) return [];

  // Simulates real network latency so loading states in the UI are
  // actually exercised instead of resolving instantly every time.
  await new Promise((resolve) => setTimeout(resolve, 500));

  const seed = Number(digits.slice(-3));
  const basePac = 18.9 + (seed % 40);
  const baseSedex = 32.5 + (seed % 55);

  return [
    {
      id: "pac",
      carrier: "Correios",
      service: "PAC",
      price: Math.round(basePac * 100) / 100,
      estimatedDays: 6 + (seed % 4),
    },
    {
      id: "sedex",
      carrier: "Correios",
      service: "SEDEX",
      price: Math.round(baseSedex * 100) / 100,
      estimatedDays: 2 + (seed % 2),
    },
    {
      id: "jadlog",
      carrier: "Jadlog",
      service: ".Package",
      price: Math.round((basePac - 4.3) * 100) / 100,
      estimatedDays: 5 + (seed % 3),
    },
  ];
}

export interface DispatchQuote extends ShippingQuote {
  originCep: string;
  destinationCep: string;
  weightKg: number;
}

/**
 * Admin-facing "cálculo de despacho" - the `<AdminShippingTab/>` tool for
 * quoting any origin/destination/weight combination on demand, the way
 * Melhor Envio's own "cotação" screen works, rather than the customer-facing
 * `getShippingQuotes` above (which always assumes the store's own fixed
 * origin). Built on top of that same deterministic mock and just applies a
 * weight multiplier, so the two stay consistent instead of drifting on
 * separate pricing logic.
 *
 * Swaps for the real integration the same way `getShippingQuotes` does -
 * `from`/`to`/`package` in that function's doc comment would come from this
 * function's `originCep`/`destinationCep`/`weightKg` parameters instead of
 * fixed values, and `<AdminShippingTab/>` wouldn't need to change.
 */
export async function calculateDispatch(
  originCep: string,
  destinationCep: string,
  weightKg: number,
): Promise<DispatchQuote[]> {
  const quotes = await getShippingQuotes(destinationCep);
  const weightMultiplier = 1 + Math.max(0, weightKg - 1) * 0.18;
  return quotes.map((quote) => ({
    ...quote,
    price: Math.round(quote.price * weightMultiplier * 100) / 100,
    originCep,
    destinationCep,
    weightKg,
  }));
}
