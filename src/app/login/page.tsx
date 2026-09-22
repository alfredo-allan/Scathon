import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "Entrar — Scathon",
  description: "Entre na sua conta ou crie uma nova conta Scathon.",
};

export default function LoginPage() {
  return <LoginView />;
}
