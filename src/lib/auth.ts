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

/**
 * `PATCH /api/v1/me` - só pra persistir o telefone logo após um cadastro
 * (ver `registerRequest` acima); `<LoginView/>` não tem (ainda) uma tela de
 * edição de perfil separada que chame isso, essa é a única chamadora hoje.
 */
export async function updatePhone(token: string, phone: string): Promise<User> {
  const data = await apiFetch<{ user: ApiUser }>("/me", {
    method: "PATCH",
    token,
    body: { phone },
  });
  return mapUser(data.user);
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
