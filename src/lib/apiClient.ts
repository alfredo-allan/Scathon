/**
 * Cliente mínimo pra falar com o backend Flask real (`scathon-api`) - ver
 * `NEXT_PUBLIC_API_BASE_URL` em `.env.example`.
 *
 * Usado por `@/lib/auth` (login/cadastro real - ver `<LoginView/>`) e por
 * `@/lib/waitlist` (lista de espera de "avise-me quando chegar" - seção 6 do
 * briefing). O resto do app (catálogo, carrinho, endereços, checkout...)
 * ainda fala com os mocks espalhados em `src/lib/*`, e não com este backend -
 * reconectar cada um deles é um trabalho à parte, fora do escopo desta
 * mudança. Como o login agora é real (`<AuthContext/>` guarda o JWT de
 * verdade emitido por `POST /api/v1/auth/login`), qualquer chamada feita
 * aqui com `token` já é reconhecida como autenticada pelo backend - nada
 * especial pra fazer além de passar o `token` que `useAuth()` devolve.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5000/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /**
   * Um valor serializável como JSON, ou um `FormData` já pronto (ex.: foto
   * de perfil no cadastro - ver `@/lib/auth`'s `registerRequest`). Quando é
   * `FormData`, o `Content-Type` (com o boundary certo) é quem o próprio
   * `fetch` define sozinho - setá-lo à mão aqui quebraria o multipart.
   */
  body?: unknown;
  /** Bearer token, se houver uma sessão - omitido quando `null`/`undefined`. */
  token?: string | null;
}

interface ApiErrorPayload {
  error?: string;
  code?: string;
}

/**
 * Faz uma chamada ao backend e devolve o corpo já decodificado como `T`.
 * Lança `ApiError` (com `status`/`code`, pra quem chama decidir a mensagem
 * certa pro visitante) em qualquer resposta que não seja 2xx.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {};
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    // Backend fora do ar / sem rede - mensagem genérica em vez de deixar o
    // erro de fetch (técnico demais) estourar pra UI.
    throw new ApiError("Não foi possível falar com o servidor agora.", 0, "network_error");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Corpo vazio (ex.: 204 No Content) - segue com `payload = null`.
  }

  if (!response.ok) {
    const errorPayload = (payload ?? {}) as ApiErrorPayload;
    throw new ApiError(
      errorPayload.error ?? "Não foi possível completar a solicitação.",
      response.status,
      errorPayload.code,
    );
  }

  return payload as T;
}
