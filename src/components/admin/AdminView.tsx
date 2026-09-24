"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminOverviewTab } from "./AdminOverviewTab";
import { AdminOrdersTab } from "./AdminOrdersTab";
import { AdminInventoryTab } from "./AdminInventoryTab";
import { AdminCustomersTab } from "./AdminCustomersTab";
import { AdminShippingTab } from "./AdminShippingTab";
import { AdminIntegrationsTab } from "./AdminIntegrationsTab";

type TabId = "visao-geral" | "pedidos" | "estoque" | "clientes" | "frete" | "integracoes";

// A plain config array - not a switch scattered across the file - so
// adding a 7th tab later (a real backend endpoint, a marketing panel,
// whatever) is one array entry plus one component, not a hunt through
// several places that all need to agree. This is the "estrutura que
// permita escalar" part of the brief as far as the *page layout* goes.
const TABS: Array<{ id: TabId; label: string }> = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "pedidos", label: "Pedidos" },
  { id: "estoque", label: "Estoque" },
  { id: "clientes", label: "Clientes" },
  { id: "frete", label: "Frete & Despacho" },
  { id: "integracoes", label: "Integrações" },
];

/**
 * `/admin` page body - the internal dashboard for `role: "admin"` accounts
 * only (test login: admin@scathon.com / senha123, seeded in
 * `@/lib/accounts`). One page, tabbed, backed entirely by mock data
 * (`@/lib/adminOrders`, `@/lib/inventory`, `@/lib/adminCustomers`,
 * `@/lib/melhorEnvio`'s `calculateDispatch`, `@/lib/integrations`) so the
 * panel's shape and potential are real to look at today, even with zero
 * backend behind it.
 *
 * Security note (the "proteção total" part of the brief): this gate is a
 * `role === "admin"` check against client-side session state, which is
 * fine for *hiding* the panel from the wrong audience during development
 * but is not real protection - anyone can read/modify client JS or
 * localStorage. `registerAccount` (the public signup path) already refuses
 * to ever create an `"admin"` account, which closes the obvious self-
 * escalation hole, but the durable fix is server-side: once there's a real
 * backend, every `/api/admin/*` route needs its own role check against a
 * verified session (a signed httpOnly cookie/JWT), and this page should
 * become a Server Component that redirects before rendering anything
 * (Next's `middleware.ts` guarding the `/admin` path is the other common
 * place to enforce this) rather than trusting the client-side `isAdmin`
 * flag alone. Nothing below should ever assume this gate is sufficient by
 * itself.
 */
export function AdminView() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("visao-geral");

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Você precisa entrar com uma conta de administrador pra ver o painel.
        </p>
        <Link
          href="/login"
          className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Entrar
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Sua conta ({user.email}) não tem acesso ao painel administrativo.
        </p>
        <Link
          href="/account"
          className="rounded-app bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-50 transition-opacity hover:opacity-85 dark:bg-neutral-100 dark:text-neutral-950"
        >
          Minha Conta
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
              Página Inicial
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-neutral-900 dark:text-neutral-100">Painel Admin</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-2xl">
          Painel Admin
        </h1>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Conectado como <span className="font-medium text-neutral-900 dark:text-neutral-100">{user.displayName}</span>
        </span>
      </div>

      <div className="mt-6 flex gap-6 overflow-x-auto border-b border-neutral-200 text-xs font-medium tracking-widest uppercase dark:border-neutral-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 border-b-2 pb-3 transition-colors ${
              activeTab === tab.id
                ? "border-neutral-950 text-neutral-950 dark:border-neutral-100 dark:text-neutral-100"
                : "border-transparent text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "visao-geral" && <AdminOverviewTab />}
        {activeTab === "pedidos" && <AdminOrdersTab />}
        {activeTab === "estoque" && <AdminInventoryTab />}
        {activeTab === "clientes" && <AdminCustomersTab />}
        {activeTab === "frete" && <AdminShippingTab />}
        {activeTab === "integracoes" && <AdminIntegrationsTab />}
      </div>
    </div>
  );
}
