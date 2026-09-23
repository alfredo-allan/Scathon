import type { Metadata } from "next";
import { AccountAddressesView } from "@/components/account/AccountAddressesView";

export const metadata: Metadata = {
  title: "Meus Endereços — Scathon",
  description: "Gerencie seus endereços salvos para entrega.",
};

export default function AccountAddressesPage() {
  return <AccountAddressesView />;
}
