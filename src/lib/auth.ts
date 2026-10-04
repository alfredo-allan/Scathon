import type { User, UserRole } from "@/types";
import { apiFetch, ApiError } from "./apiClient";

/**
 * Login/cadastro reais contra o backend Flask (`scathon-api` - ver
 * `app/auth/__init__.py`), chamados por `<LoginView/>`. Substitui o antigo
 * `@/lib/accounts.ts` (tabela mock em `localStorage`, apagado) - duas contas
 * de teste seguem funcionando com as mesmas credenciais de antes porque
 * agora são linhas de verdade no banco (`seed.py`):
 *   cliente@scathon.com / senha123 (customer)
 *   admin@scathon.com   / senha123 (admin)
 *
 * O formato do `User` devolvido pelo backend (`User.to_public_dict()`) já
 * bate com o tipo `User` do frontend (`@/types`), exceto `id` (número lá,
 * string aqui, por isso o `String(...)` abaixo) - mesma convenção dos outros
 * ids do catálogo.
 */

interface ApiUser {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  phone: string | null;
  city: string | null;
  state: string | null;
  avatarUrl: string | null;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface AuthResult {
  token: string;
  user: User;
}

function mapUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    displayName: apiUser.displayName,
    email: apiUser.email,
    avatarUrl: apiUser.avatarUrl,
    phone: apiUser.phone ?? undefined,
    city: apiUser.city ?? undefined,
    state: apiUser.state ?? undefined,
    role: apiUser.role,
  };
}

/** `POST /api/v1/auth/login` - rate-limitado pelo próprio backend (10/min/IP). */
export async function loginRequest(email: string, password: string): Promise<AuthResult> {
  const data = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return { token: data.token, user: mapUser(data.user) };
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  /**
   * Data URL (de `@/lib/imageFile`'s `readImageAsDataUrl`) pra mandar como
   * foto de perfil junto do cadastro, ou `null`/omitido pra pular. Quando
   * presente, o corpo vira `multipart/form-data` - mesmo contrato de
   * `POST /api/v1/me/avatar` (ver `app/account/avatar.py`), só que num só
   * request em vez de dois.
   */
  avatarDataUrl?: string | null;
}

/**
 * `POST /api/v1/auth/register` - sempre cria `role: "customer"` do lado do
 * servidor (ver `RegisterSchema`/a rota em si), nunca aceita um papel vindo
 * daqui. Não existe campo de telefone no cadastro em si (o backend só pede
 * e-mail/senha/nome) - `<LoginView/>` persiste o telefone digitado com uma
 * chamada separada a `updateProfile` logo em seguida, pra não perder o que
 * o visitante já tinha preenchido.
 */
export async function registerRequest(input: RegisterInput): Promise<AuthResult> {
  let body: unknown;
  if (input.avatarDataUrl) {
    const form = new FormData();
    form.set("email", input.email);
    form.set("password", input.password);
    form.set("displayName", input.displayName);
    form.set("avatar", dataUrlToFile(input.avatarDataUrl, "avatar.jpg"));
    body = form;
  } else {
    body = { email: input.email, password: input.password, displayName: input.displayName };
  }

  const data = await apiFetch<AuthResponse>("/auth/register", { method: "POST", body });
  return { token: data.token, user: mapUser(data.user) };
}

export interface ProfileUpdateInput {
  displayName?: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
}

/**
 * `PATCH /api/v1/me` - atualiza qualquer combinação dos campos "soltos" do
 * perfil (nome, telefone, cidade, estado). `email`/senha/foto não passam por
 * aqui de propósito: e-mail e senha são "alterações sensíveis" (ver
 * `<AccountEditView/>`'s doc comment) que vão exigir confirmação por código
 * quando o serviço de SMTP existir; a foto tem seu próprio endpoint
 * multipart (`uploadAvatar`/`removeAvatar` abaixo), já que esse PATCH só
 * aceita JSON.
 *
 * Usado tanto por `<LoginView/>` (persistir o telefone logo após o cadastro)
 * quanto por `<AccountEditView/>` (edição completa de perfil).
 */
export async function updateProfile(token: string, input: ProfileUpdateInput): Promise<User> {
  const data = await apiFetch<{ user: ApiUser }>("/me", {
    method: "PATCH",
    token,
    body: input,
  });
  return mapUser(data.user);
}

/**
 * `POST /api/v1/me/avatar` (multipart) - troca a foto de perfil de uma conta
 * já existente. Mesmo contrato de tamanho/formato do avatar enviado junto do
 * cadastro em `registerRequest` (até 5MB, JPEG/PNG/WEBP/GIF na entrada,
 * sempre volta como JPEG 256px).
 */
export async function uploadAvatar(token: string, file: File): Promise<User> {
  const form = new FormData();
  form.set("avatar", file);
  const data = await apiFetch<{ user: ApiUser }>("/me/avatar", {
    method: "POST",
    token,
    body: form,
  });
  return mapUser(data.user);
}

/** `DELETE /api/v1/me/avatar` - volta pro círculo com a inicial (sem foto). */
export async function removeAvatar(token: string): Promise<void> {
  await apiFetch<void>("/me/avatar", { method: "DELETE", token });
}

// ---------------------------------------------------------------------------
// Recuperação de senha (sem login) e alterações sensíveis (logado) - Fase 6,
// parte 2 do briefing. O backend já tinha tudo isso pronto desde antes do
// SMTP funcionar de verdade (ver `app/auth/__init__.py`/`app/account/
// __init__.py`); agora que o e-mail sai de verdade, `<LoginView/>`/
// `<AccountEditView/>` passam a usar essas funções em vez de mostrar "em
// breve".
// ---------------------------------------------------------------------------

/**
 * `POST /api/v1/auth/forgot-password` - sempre devolve sucesso (o backend
 * nunca revela se o e-mail tem conta ou não, pra não virar um jeito de
 * descobrir e-mails cadastrados) e dispara um código de 6 dígitos pro e-mail
 * SE ele tiver uma conta. Rate-limitado por IP (5/hora) pelo próprio backend.
 */
export async function forgotPasswordRequest(email: string): Promise<void> {
  await apiFetch<{ ok: boolean; message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/**
 * `POST /api/v1/auth/reset-password` - troca a senha de quem esqueceu, usando
 * o código de `forgotPasswordRequest`. Lança `ApiError` com `code:
 * "invalid_code"` pra código errado/expirado ou e-mail errado - mesma
 * mensagem genérica pros dois casos (não dá pra saber qual dos dois foi).
 */
export async function resetPasswordRequest(email: string, code: string, newPassword: string): Promise<void> {
  await apiFetch<{ ok: boolean }>("/auth/reset-password", {
    method: "POST",
    body: { email, code, newPassword },
  });
}

export type VerificationPurpose = "profile_change" | "password_change" | "email_change";

/**
 * `POST /api/v1/me/verification-code` - pede o envio de um código novo por
 * e-mail pra confirmar uma troca de e-mail/senha (ou uma 2ª+ edição de perfil
 * no mesmo dia - ver `<AccountEditView/>`'s uso de `password_change`/
 * `email_change`). Pra `purpose: "email_change"`, o código vai pro e-mail
 * NOVO (`newEmail`), não pro atual - é assim que o backend confirma que quem
 * pediu a troca realmente tem acesso a essa caixa de entrada. Rate-limitado
 * por conta (5/hora) pelo próprio backend.
 */
export async function requestAccountVerificationCode(
  token: string,
  purpose: VerificationPurpose,
  newEmail?: string,
): Promise<{ expiresInMinutes: number }> {
  return apiFetch<{ ok: boolean; expiresInMinutes: number }>("/me/verification-code", {
    method: "POST",
    token,
    body: { purpose, newEmail },
  });
}

/**
 * `POST /api/v1/me/email` - confirma a troca de e-mail com o código que
 * chegou no e-mail NOVO (ver `requestAccountVerificationCode` acima). Devolve
 * o usuário já com o e-mail atualizado.
 */
export async function confirmEmailChange(token: string, code: string): Promise<User> {
  const data = await apiFetch<{ user: ApiUser }>("/me/email", {
    method: "POST",
    token,
    body: { code },
  });
  return mapUser(data.user);
}

/**
 * `POST /api/v1/me/password` - troca a senha de uma conta JÁ LOGADA
 * (diferente de `resetPasswordRequest`, pra quem esqueceu a senha e não
 * consegue entrar). Exige a senha atual (prova que é a própria pessoa no
 * teclado) + o código de `requestAccountVerificationCode` com `purpose:
 * "password_change"`.
 */
export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
  code: string,
): Promise<void> {
  await apiFetch<{ ok: boolean }>("/me/password", {
    method: "POST",
    token,
    body: { currentPassword, newPassword, code },
  });
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(header ?? "");
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export { ApiError };
