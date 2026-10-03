/**
 * Cliente mínimo pra falar com o backend Flask real (`scathon-api`) - ver
 * `NEXT_PUBLIC_API_BASE_URL` em `.env.example`.
 *
 * Usado por todo o app agora (fase 4 do roadmap: catálogo, conta, endereços,
 * checkout, admin...), não só por `@/lib/auth`/`@/lib/waitlist` como nas
 * primeiras rodadas. Como o login é real (`<AuthContext/>` guarda o JWT de
 * verdade emitido por `POST /api/v1/auth/login`, válido por 12h), qualquer
 * chamada feita aqui com `token` já é reconhecida como autenticada pelo
 * backend - nada especial pra fazer além de passar o `token` que `useAuth()`
 * devolve.
 *
 * **Token morto (expirado, ou de uma sessão/segredo que não existe mais no
 * servidor):** quando uma chamada autenticada volta 401, isso nunca é "o
 * produto não existe" nem um erro passageiro de rede - é a prova de que a
 * sessão local não é mais válida pro servidor, então toda chamada seguinte
 * com o mesmo token vai falhar do mesmo jeito até alguém logar de novo.
 * Em vez de deixar cada hook/tela descobrir isso sozinho (e cada um
 * mostrando seu próprio erro, ou pior, uma rejeição não tratada - foi
 * exatamente isso que aconteceu com `useSavedAddresses`/`useInventory`
 * antes desta correção), dispara um evento global (`scathon:session-expired`)
 * que `<AuthContext/>` escuta pra limpar a sessão sozinho - o próximo render
 * já mostra o app como deslogado, em vez de continuar "logado" na aparência
 * enquanto toda chamada autenticada quebra por baixo.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://srv2027628.hstgr.cloud/api/v1";

/** Nome do evento disparado em `window` quando uma chamada autenticada volta 401 - ver o doc comment acima. `<AuthContext/>` é quem escuta. */
export const SESSION_EXPIRED_EVENT = "scathon:session-expired";

// Só a origem (esquema + host + porta), sem o "/api/v1" - é contra ISSO que
// um caminho de mídia relativo (avatar) precisa ser resolvido, não contra o
// `API_BASE_URL` inteiro. `new URL(...).origin` já descarta qualquer path.
function computeMediaOrigin(apiBaseUrl: string): string {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "";
  }
}
const MEDIA_ORIGIN = computeMediaOrigin(API_BASE_URL);

/**
 * `User.avatar_url`/fotos de produto enviadas pelo admin (ver
 * `app/models/user.py`/`app/admin/product_images.py` no backend) são salvas
 * como um caminho RELATIVO servido pelo Flask - `/media/avatars/user_7.jpg`,
 * `/media/products/p-123456/<uuid>.jpg`, nunca uma URL completa. Passar isso
 * direto pra `<Image src={...}>` faz o navegador resolver contra a origem do
 * PRÓPRIO FRONTEND (a Vercel, onde essa rota não existe) em vez do backend -
 * a imagem quebra (ver o bug real visto em produção: avatar quebrando e
 * mostrando o `alt` por cima do header; o mesmo aconteceu com a capa de um
 * produto recém-cadastrado via upload - "a foto de capa já não é exibida").
 * Toda vez que um desses campos vira `src` de uma `<Image>`, passa por aqui
 * primeiro - ver `@/lib/products`'s `mapSummary`/`mapDetail`, que já resolve
 * isso pra todo produto na origem, então nenhum componente downstream
 * (`<ProductCard/>`, `<ProductGallery/>`, carrinho, wishlist...) precisa
 * lembrar de chamar isto de novo.
 *
 * Só `/media/...` (servido pelo BACKEND) é reescrito - um caminho relativo
 * que NÃO comece com `/media/` é um asset ESTÁTICO DO PRÓPRIO FRONTEND
 * (`/category/...`, `/specimen/...`, em `public/`, usado pelo catálogo
 * seedado antes de existir upload de foto) e já resolve certo contra a
 * origem atual - prefixar esses quebraria a imagem ao contrário. Uma URL já
 * absoluta (`https://...`) passa direto também.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // já é uma URL completa - nada a fazer.
  if (!path.startsWith("/media/")) return path; // asset estático do frontend - não mexe.
  return `${MEDIA_ORIGIN}${path}`;
}

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
  /**
   * Repassado como `next.revalidate` do Next.js (cache de dados do App
   * Router) - só tem efeito quando esta chamada roda num Server Component
   * (ex.: `@/lib/products` nas páginas de catálogo); o `fetch` do navegador
   * simplesmente ignora essa chave quando a chamada é feita de um Client
   * Component. Omitido = comportamento padrão do Next (cache indefinido
   * pra um GET) - passe um número de segundos pra revalidar o catálogo
   * periodicamente, ou `false` pra nunca cachear (dado sensível a mudanças
   * frequentes, como o painel admin, que sempre roda em Client Components
   * mesmo assim).
   */
  revalidate?: number | false;
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
  const { method = "GET", body, token, revalidate } = options;

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
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
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

    // Só dispara pra chamada AUTENTICADA (tinha `token`) - um 401 numa rota
    // pública (ex.: e-mail/senha errados em `/auth/login`) é só uma credencial
    // incorreta, não uma sessão que precisa ser limpa.
    if (response.status === 401 && token && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    throw new ApiError(
      errorPayload.error ?? "Não foi possível completar a solicitação.",
      response.status,
      errorPayload.code,
    );
  }

  return payload as T;
}
