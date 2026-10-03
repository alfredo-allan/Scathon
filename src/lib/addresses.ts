import { apiFetch } from "./apiClient";

export interface SavedAddress {
  id: string;
  /** Short name the customer gives it, e.g. "Casa", "Trabalho". */
  label: string;
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Endereços salvos do cliente logado, real contra o backend
 * (`GET/POST/PATCH/DELETE /api/v1/me/addresses` - ver `app/account/
 * __init__.py`), fase 4 do roadmap. Substitui o antigo `savedAddressesStore`
 * (um array em `localStorage`, igual pra qualquer sessão) - cada campo aqui
 * já bate 1:1 com `Address.to_dict()` do backend, sem remapeamento nenhum
 * (ver `AddressSchema`).
 *
 * Toda rota exige um `token` porque todo endereço salvo é por conta - sem
 * sessão não tem o que listar/criar.
 */

interface AddressesResponse {
  items: SavedAddress[];
}

interface AddressResponse {
  address: SavedAddress;
}

export async function getSavedAddresses(token: string | null): Promise<SavedAddress[]> {
  if (!token) return [];
  const data = await apiFetch<AddressesResponse>("/me/addresses", { token });
  return data.items;
}

export async function saveAddress(
  token: string,
  address: Omit<SavedAddress, "id">,
): Promise<SavedAddress> {
  const data = await apiFetch<AddressResponse>("/me/addresses", {
    method: "POST",
    token,
    body: address,
  });
  return data.address;
}

export async function updateAddress(
  token: string,
  id: string,
  patch: Partial<Omit<SavedAddress, "id">>,
): Promise<SavedAddress> {
  const data = await apiFetch<AddressResponse>(`/me/addresses/${id}`, {
    method: "PATCH",
    token,
    body: patch,
  });
  return data.address;
}

export async function removeAddress(token: string, id: string): Promise<void> {
  await apiFetch<void>(`/me/addresses/${id}`, { method: "DELETE", token });
}
