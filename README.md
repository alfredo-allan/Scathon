# Scathon E-commerce

Loja virtual de streetwear minimalista — Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, com suporte a tema claro/escuro via classe (`dark:`), gerenciado com **pnpm**.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19)
- **TypeScript**
- **Tailwind CSS v4** — dark mode via classe (`.dark` no `<html>`), configurado em `src/app/globals.css` com `@custom-variant dark`
- **pnpm** como gerenciador de pacotes

## Rodando o projeto

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

Outros scripts:

```bash
pnpm build   # build de produção (Turbopack)
pnpm start   # sobe o build de produção
pnpm lint    # ESLint (flat config, next/core-web-vitals)
```

## Estrutura

```
src/
  app/
    layout.tsx        # Root layout: providers, Header, Footer, script anti-flash de tema
    page.tsx           # Home (Hero, TrustBadges, grids de produto, dividers)
    globals.css         # Tailwind v4 + dark mode class strategy + tokens
  context/
    AuthContext.tsx     # JWT + user (avatarUrl, displayName, role) persistido em localStorage
    ThemeContext.tsx     # light/dark sincronizado com a classe `dark` no <html>
    CartContext.tsx      # itens do carrinho, persistidos em localStorage
  hooks/
    useAuth.ts, useCart.ts, useTheme.ts   # atalhos para os contexts acima
    useMediaQuery.ts     # breakpoints via useSyncExternalStore (ex.: useIsDesktop)
    useDebounce.ts        # debounce genérico (usado no SearchOverlay)
  components/
    layout/    Header, DrawerMenu, UserAvatar, CartBadge, SearchOverlay, CategoryBar, Footer, ThemeToggle
    home/      HeroCarousel, TrustBadges, CategoryDividerCarousel, ProductGrid
    product/   ProductCard, ColorSwatches, StarRating
    providers/ Providers.tsx (compõe Theme + Auth + Cart)
  data/        Mock de produtos, categorias, hero slides e dividers (trocar por API depois)
  lib/
    placeholder.ts            # gera imagens placeholder em SVG (data URI) — zero dependência de rede
    createPersistedStore.ts   # store genérico localStorage + useSyncExternalStore, usado por Auth/Cart
  types/       Tipos compartilhados (Product, User, CartItem, etc.)
```

## Decisões de arquitetura

- **Sem imagens externas ainda**: os cards de produto e banners usam placeholders SVG gerados em `lib/placeholder.ts`. Basta trocar o campo `imageUrl`/`colors[].imageUrl` nos dados (ou já plugar numa API/CMS) para usar fotos reais. Ao usar imagens remotas de verdade, configure `images.remotePatterns` em `next.config.ts`.
- **Sem Google Fonts por padrão**: o layout usa a stack de fontes do sistema (`ui-sans-serif, system-ui...`) para não depender de acesso a `fonts.googleapis.com` no build. Para usar uma fonte de marca, plugue `next/font/local` (self-hosted) ou reative `next/font/google` em `src/app/layout.tsx`.
- **Tema sem flash**: um script inline em `app/layout.tsx` aplica a classe `dark` no `<html>` antes da hidratação; o `ThemeContext` lê o mesmo estado via `useSyncExternalStore`, sem `useEffect` + `setState` (compatível com a regra `react-hooks/set-state-in-effect` do ESLint do Next 16).
- **Auth/Cart persistidos**: `AuthContext` e `CartContext` usam o mesmo store genérico (`createPersistedStore`) para ler/escrever em `localStorage` sem duplicar lógica.

## Próximos passos sugeridos

1. Conectar `AuthContext.login` a um backend real (JWT).
2. Trocar os dados mockados em `src/data/` por chamadas a uma API/CMS.
3. Páginas de produto (`/product/[slug]`), listagem (`/shop`) e carrinho (`/cart`).
4. Substituir os placeholders SVG por fotografia real dos produtos.
5. Deploy na [Vercel](https://vercel.com/new).
