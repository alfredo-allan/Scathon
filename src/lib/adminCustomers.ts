import { apiFetch } from "./apiClient";
import { normalizeAdminOrder, type AdminOrder } from "./adminOrders";

export interface AdminCustomer {
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  joinedAt: string;
  ordersCount: number;
  totalSpent: number;
  /** Mesmo caminho servível de `User.to_public_dict()`'s `avatarUrl` - passa por `resolveMediaUrl()` antes de virar `src` de `<img>`. */
  avatarUrl: string | null;
}

interface AdminCustomersResponse {
  items: AdminCustomer[];
  page: number;
  perPage: number;
  total: number;
}

/**
 * Clientes cadastrados (`GET /api/v1/admin/customers` - ver `app/admin/
 * __init__.py`), fase 4 do roadmap. Substitui `getAdminCustomers()` (que
 * cruzava um array mockado de perfis com `getAdminOrders()` à mão) - o
 * backend já devolve `ordersCount`/`totalSpent` prontos, agregados de
 * verdade sobre `Order`/`Payment`. Exige token de admin.
 */
export async function getAdminCustomers(token: string): Promise<AdminCustomer[]> {
  const data = await apiFetch<AdminCustomersResponse>("/admin/customers?perPage=100", { token });
  return data.items;
}

/**
 * Últimos pedidos de UM cliente (`GET /api/v1/admin/customers/{email}/orders`
 * - ver `app/admin/__init__.py`) - pedido do Alfredo (2026-10-08): ao clicar
 * num cliente na aba "Clientes", ver o histórico dele sem precisar ir pra
 * aba "Pedidos" caçar por nome. Mesmo formato `AdminOrder` de `getAdminOrders`
 * (`@/lib/adminOrders`), normalizado do mesmo jeito (`normalizeAdminOrder`)
 * pra `imageUrl`/`invoiceUrl` nunca quebrarem.
 */
export async function getCustomerOrders(token: string, email: string): Promise<AdminOrder[]> {
  const data = await apiFetch<{ items: AdminOrder[] }>(
    `/admin/customers/${encodeURIComponent(email)}/orders`,
    { token },
  );
  return data.items.map(normalizeAdminOrder);
}
