import type { DividerSlide } from "@/types";

// Real campaign photography (see `DividerSlide.desktopImageUrl`'s doc
// comment for the 21:9 + portrait-crop convention) - replaces the three
// generic solid-color placeholders (Moletons/Casacos/Acessórios) this
// section used to show, since mixing real photos with flat placeholder
// tiles in the same carousel read as unfinished. `title`/`href` are the one
// part these banners don't carry themselves (no baked-in text) - easy to
// swap for different copy or a link straight into a specific collection
// whenever there's one to point at.
// Both `href`s below are "/" - they used to point at `/shop` and
// `/shop?filter=best-sellers`, an all-products listing that doesn't exist
// yet, so the banners 404'd. Same fix applied sitewide (see
// `@/data/categories` and `<Footer/>`'s doc comments) rather than just
// these two: point each at its real collection page once one exists.
export const dividerSlides: DividerSlide[] = [
  // {
  //   id: "divider-banner-3",
  //   title: "Autenticidade Scathon",
  //   href: "/",
  //   desktopImageUrl: "/banner/Banner_3Desktop.jpeg",
  //   mobileImageUrl: "/banner/Banner_3Moblie.jpeg",
  // },
  {
    id: "divider-banner-4",
    title: "Peças Essenciais",
    href: "/",
    desktopImageUrl: "/banner/Banner_4Desktop.jpeg",
    mobileImageUrl: "/banner/Banner_4Mobile.jpeg",
  },
];
