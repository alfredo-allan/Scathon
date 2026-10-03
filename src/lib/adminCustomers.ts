import { apiFetch } from "./apiClient";

export interface AdminCustomer {
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  joinedAt: string;
  ordersCount: number;
  totalSpent: number;
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
