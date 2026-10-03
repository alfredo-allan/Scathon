import type { Metadata } from "next";
import { AccountEditView } from "@/components/account/AccountEditView";

export const metadata: Metadata = {
  title: "Editar Perfil — Scathon",
  description: "Atualize sua foto e seus dados cadastrais.",
};

export default function AccountEditPage() {
  return <AccountEditView />;
}
