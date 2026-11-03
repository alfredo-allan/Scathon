import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "Entrar — Scathon",
  description: "Entre na sua conta ou crie uma nova conta Scathon.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; mode?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginView
      returnPath={typeof params.from === "string" ? params.from : null}
      initialMode={params.mode === "criar" ? "criar" : "entrar"}
    />
  );
}
