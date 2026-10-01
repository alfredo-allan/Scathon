/**
 * Cliente mínimo pra falar com o backend Flask real (`scathon-api`) - ver
 * `NEXT_PUBLIC_API_BASE_URL` em `.env.example`.
 *
 * Por enquanto só `@/lib/waitlist` usa isto (lista de espera de "avise-me
 * quando chegar" - seção 6 do briefing). O resto do app (login, catálogo,
 * carrinho, endereços, checkout...) ainda fala com os mocks espalhados em
 * `src/lib/*`, e não com este backend - reconectar cada um deles é um
 * trabalho à parte, fora do escopo desta mudança. Isso tem uma consequência
 * direta pra quem usar este cliente com `token`: como `<AuthContext/>` ainda
 * guarda uma sessão simulada (`"mock-token"`, não um JWT de verdade emitido
 * por `POST /api/v1/auth/login`), o backend nunca reconhece esse token como
 * válido e trata a chamada como anônima - ver o comentário em
 * `notifyInterest` sobre como isso é contornado (mandando o e-mail da conta
 * no corpo em vez de depender só do token). Nenhuma mudança é necessária
 * aqui quando o login real for conectado: este cliente já manda o header
 * `Authorization` sempre que um `token` existir.
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

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
