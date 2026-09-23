import { CUSTOMER_PROFILES, type AdminCustomerProfile } from "./adminCustomerProfiles";
import { getAdminOrders } from "./adminOrders";

export interface AdminCustomer extends AdminCustomerProfile {
  ordersCount: number;
  /** What the customer has actually paid across approved orders (itens + frete) - not a raw order count, so "cliente VIP" reads as spend, not just activity. */
  totalSpent: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Registered customers with their order activity folded in - "listar
 * clientes cadastrados com seus dados" from the admin brief. Derives
 * `ordersCount`/`totalSpent` from `getAdminOrders()` on every call (rather
 * than hardcoding them alongside the profile) so this can never drift out
 * of sync with what the Pedidos tab shows for the same customer.
 */
export function getAdminCustomers(): AdminCustomer[] {
  const orders = getAdminOrders();
  return CUSTOMER_PROFILES.map((profile) => {
    const ownOrders = orders.filter((order) => order.customerEmail === profile.email);
    const approvedOrders = ownOrders.filter((order) => order.payment.status === "approved");
    const totalSpent = round2(
      approvedOrders.reduce((sum, order) => sum + order.payment.grossAmount + order.shippingCost, 0),
    );
    return {
      ...profile,
      ordersCount: ownOrders.length,
      totalSpent,
    };
  });
}
