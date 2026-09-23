export interface ViaCepAddress {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Formats raw digits into Brazil's `00000-000` CEP pattern as the user types. */
export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function cepDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isCompleteCep(value: string): boolean {
  return cepDigits(value).length === 8;
}

/**
 * Resolves a CEP into a street/neighborhood/city/state via ViaCEP - a real,
 * free, keyless public API (https://viacep.com.br), so this one is a genuine
 * network call rather than a mock, unlike `@/lib/melhorEnvio` and
 * `@/lib/mercadoPago` (which do need paid/OAuth credentials this project
 * doesn't have yet). Returns `null` for an invalid/unknown CEP or a network
 * failure - callers show a quiet fallback rather than an error state, since
 * this is a subtle "here's the address" convenience, not a required step.
 */
export async function lookupAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = cepDigits(cep);
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.erro) return null;

    return {
      cep: formatCep(digits),
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    // Offline, ViaCEP unreachable, blocked by a proxy, etc. - swallow it,
    // the CEP itself is still valid for a shipping quote even without the
    // resolved address to show alongside it.
    return null;
  }
}
