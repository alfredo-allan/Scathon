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
 * only (test login: admin@scathon.com / senha123, a real row seeded by the
 * backend's `seed.py` - ver `@/lib/auth`). One page, tabbed; every tab now
 * reads real data from the Flask backend (`@/lib/adminOrders`,
 * `@/lib/inventory`, `@/lib/adminCustomers`, `@/lib/melhorEnvio`'s
 * `calculateDispatch`, `@/lib/integrations`) - fase 4 do roadmap já
 * concluída. (`@/lib/adminCustomerProfiles` é código morto da fase 1-3,
 * mantido só como registro histórico - nada mais importa dele.)
 *
 * Security note: the real gate lives in `src/proxy.ts` - it checks a
 * signed, httpOnly cookie (issued by `POST /api/auth/login`, see
 * `@/lib/session`) on the server, before this component (or any `/admin`
 * route) is even allowed to render, for both hard loads and client-side
 * navigations. The backend's public `POST /api/v1/auth/register` also still
 * refuses to ever create an `"admin"` account (always forces
 * `role: "customer"` server-side - ver `app/auth/__init__.py`), closing the
 * obvious self-escalation hole.
 *
 * The two checks below (`!isAuthenticated`/`!isAdmin`) are what's left
 * *after* that: friendly fallback screens for the narrow window where the
 * client's own `scathon:session` (localStorage, see `<AuthContext/>`) is
 * out of sync with the real cookie - e.g. it expired mid-visit, or
 * `logout()` cleared it - never the actual security boundary. Nothing below
 * should assume otherwise.
 *
 * Cada chamada aos endpoints `/admin/*` exige o token de admin (ver
 * `apiFetch`'s `token` option) - o backend confere o `role` do usuário no
 * JWT antes de devolver qualquer dado, então os dados aqui nunca vazam pra
 * uma aba client-side sem autorização de verdade por trás.
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
