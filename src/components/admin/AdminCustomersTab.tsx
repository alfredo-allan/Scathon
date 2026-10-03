"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAdminCustomers, type AdminCustomer } from "@/lib/adminCustomers";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/**
 * "Clientes" tab: clientes reais cadastrados (`GET /api/v1/admin/customers`
 * - ver `@/lib/adminCustomers`), com `ordersCount`/`totalSpent` já
 * agregados pelo backend.
 */
export function AdminCustomersTab() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setCustomers(await getAdminCustomers(token));
    } catch {
      setErrorMessage("Não foi possível carregar os clientes agora.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const sortedCustomers = useMemo(() => [...customers].sort((a, b) => b.totalSpent - a.totalSpent), [customers]);

  if (isLoading) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Carregando clientes…</p>;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold uppercase tracking-widest text-neutral-900 underline underline-offset-4 dark:text-neutral-100"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

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
          {sortedCustomers.map((customer) => (
            <tr key={customer.email}>
              <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{customer.name}</td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                <p>{customer.email}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">{customer.phone ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                {customer.city ? `${customer.city}/${customer.state}` : "—"}
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
          {sortedCustomers.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Nenhum cliente cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
