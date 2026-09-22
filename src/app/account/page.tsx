import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Minha Conta — Scathon",
  description: "Seus dados, pedidos e favoritos na Scathon.",
};

export default function AccountPage() {
  return <AccountView />;
}
