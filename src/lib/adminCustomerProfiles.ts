/**
 * Shared cadastro-style fields for the admin panel's mock customer base -
 * split into its own file (rather than living inside `@/lib/adminOrders` or
 * `@/lib/adminCustomers`) purely to avoid a circular import: `adminOrders`
 * needs these names/emails to build order history, and `adminCustomers`
 * needs both these profiles *and* that order history (to compute pedidos/
 * gasto total per customer) - this file has no dependency on either, so
 * both can import it safely.
 *
 * These are independent from `@/lib/accounts`'s `accountsStore` on purpose:
 * that table is only the tiny set of logins actually testable against
 * `/login` (seeded customer + admin, plus whatever a real signup adds in
 * this browser). This is a fuller mock customer base so the admin panel's
 * "Clientes"/"Pedidos" tabs have enough data to show what a real, busier
 * store would look like - swap for a real `GET /api/admin/customers` later
 * and `@/lib/adminCustomers`'s `getAdminCustomers()` is the only thing that
 * needs to change.
 */
export interface AdminCustomerProfile {
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  /** ISO date the account joined - kept relative to "now" (see `daysAgo`) so this never reads as stale sample data. */
  joinedAt: string;
}

export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const CUSTOMER_PROFILES: AdminCustomerProfile[] = [
  {
    email: "cliente@scathon.com",
    name: "Cliente Scathon",
    phone: "(11) 91234-5678",
    city: "São Paulo",
    state: "SP",
    joinedAt: daysAgo(120),
  },
  {
    email: "mariana.silva@example.com",
    name: "Mariana Silva",
    phone: "(21) 98877-1122",
    city: "Rio de Janeiro",
    state: "RJ",
    joinedAt: daysAgo(96),
  },
  {
    email: "joao.pereira@example.com",
    name: "João Pereira",
    phone: "(31) 97766-3344",
    city: "Belo Horizonte",
    state: "MG",
    joinedAt: daysAgo(70),
  },
  {
    email: "ana.souza@example.com",
    name: "Ana Souza",
    phone: "(41) 96655-5566",
    city: "Curitiba",
    state: "PR",
    joinedAt: daysAgo(45),
  },
  {
    email: "carlos.lima@example.com",
    name: "Carlos Lima",
    phone: "(51) 95544-7788",
    city: "Porto Alegre",
    state: "RS",
    joinedAt: daysAgo(30),
  },
  {
    email: "beatriz.santos@example.com",
    name: "Beatriz Santos",
    phone: "(85) 94433-9900",
    city: "Fortaleza",
    state: "CE",
    joinedAt: daysAgo(12),
  },
];
