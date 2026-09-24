"use client";

import { useMemo } from "react";
import { getAdminCustomers } from "@/lib/adminCustomers";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/**
 * "Clientes" tab: "listar clientes cadastrados com seus dados" from the
 * brief - name, contato, localização, desde quando, e atividade (pedidos/
 * gasto total, derivados de `getAdminOrders` dentro de
 * `getAdminCustomers`).
 */
export function AdminCustomersTab() {
  const customers = useMemo(
    () => [...getAdminCustomers()].sort((a, b) => b.totalSpent - a.totalSpent),
    [],
  );

  return (
    <div className="overflow-x-auto rounded-app border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Contato</th>
            <th className="px-4 py-3">Localização</th>
            <th className="px-4 py-3">Cliente desde</th>
            <th className="px-4 py-3 text-right">Pedidos</th>
            <th className="px-4 py-3 text-right">Total gasto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
          {customers.map((customer) => (
            <tr key={customer.email}>
              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{customer.name}</td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                <p>{customer.email}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">{customer.phone}</p>
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                {customer.city}/{customer.state}
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                {dateFormatter.format(new Date(customer.joinedAt))}
              </td>
              <td className="px-4 py-3 text-right text-neutral-900 dark:text-neutral-100">{customer.ordersCount}</td>
              <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">
                {currencyFormatter.format(customer.totalSpent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
