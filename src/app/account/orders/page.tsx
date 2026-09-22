import type { Metadata } from "next";
import { AccountOrdersView } from "@/components/account/AccountOrdersView";

export const metadata: Metadata = {
  title: "Meus Pedidos — Scathon",
  description: "Acompanhe seus pedidos recentes e avalie os produtos que você comprou.",
};

export default function AccountOrdersPage() {
  return <AccountOrdersView />;
}
