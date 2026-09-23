import type { Metadata } from "next";
import { AdminView } from "@/components/admin/AdminView";

export const metadata: Metadata = {
  title: "Painel Admin — Scathon",
  description: "Pedidos, estoque, clientes, frete e integrações.",
  // Kept out of search results/sitemaps like the rest of the account area -
  // this is an internal tool, not a page worth indexing.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminView />;
}
