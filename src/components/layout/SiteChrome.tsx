"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingDock } from "./FloatingDock";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AdminHeader } from "@/components/admin/AdminHeader";

/**
 * Picks the site's chrome (header/footer/dock/cart) based on the current
 * route, instead of `layout.tsx` hardcoding one set for every page.
 *
 * `/admin` and everything under it gets `<AdminHeader/>` alone - no
 * `<Header/>` (product search, hamburger drawer full of shop categories),
 * no `<Footer/>`, no `<FloatingDock/>` (curtidos/pedidos/carrinho shortcuts)
 * and no `<CartDrawer/>`. That's the point: an administrator working in the
 * panel shouldn't be one click away from the customer storefront's own nav -
 * see the doc comment on `<AdminHeader/>` for the reasoning. Every other
 * route keeps the exact storefront chrome this app always had.
 *
 * A plain `pathname.startsWith("/admin")` check, not an auth check - the
 * real security boundary is `src/proxy.ts` (a signed, httpOnly cookie
 * checked on the server before the route ever renders); this component only
 * decides which nav to *draw* once a request is already allowed through,
 * and drawing the admin-flavored chrome even for a rejected/expired session
 * limbo state is harmless (it's still just chrome, not the panel's own
 * data - `<AdminView/>` handles the "not actually an admin" fallback UI
 * itself).
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  if (isAdminRoute) {
    return (
      <>
        <AdminHeader />
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Fixed-position, see FloatingDock's own doc comment for how it
          hands off with <Header/> on scroll. */}
      <FloatingDock />
      {/* Lives alongside <Header/>'s own <DrawerMenu/>/<SearchOverlay/>,
          since it needs to open from any storefront page the moment
          `addItem` runs - see <CartContext/> and <CartDrawer/>'s own doc
          comments. Not rendered in the admin section, which has no "add to
          cart" actions of its own. */}
      <CartDrawer />
    </>
  );
}
