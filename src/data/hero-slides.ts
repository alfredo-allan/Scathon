// import { placeholderImage } from "@/lib/placeholder";
import type { HeroSlide } from "@/types";

export const heroSlides: HeroSlide[] = [
  {
    id: "slide-ss26",
    eyebrow: "Coleção SS26",
    title: "",
    subtitle: "",
    ctaLabel: "Ver o Drop",
    // "" used to be an empty/dead href - there's no dedicated drop page
    // yet, so this points home instead (same fix as the rest of the site's
    // still-missing pages; see `@/data/categories`'s doc comment).
    ctaHref: "/",
    // Real banner artwork (test render) - swap these back to placeholderImage(...)
    // calls if the real assets are ever pulled from /public/banner.
    desktopImageUrl: "/banner/Banner_1Desktop.png",
    tabletImageUrl: "/banner/Banner_1Tablet.png",
    mobileImageUrl: "/banner/Baner_1Mobile.png",
    // Desktop box stays a fixed 21:9 (see HeroCarousel's object-contain
    // comment) - it no longer needs a per-slide aspect override.
    theme: "dark",
  },
  {
    id: "slide-bestsellers",
    eyebrow: "Mais Vendidos",
    title: "",
    subtitle: "",
    ctaLabel: "Ver Mais Vendidos",
    ctaHref: "/",
    desktopImageUrl: "/banner/Banner_2Desktop.png",
    // No dedicated tablet crop exists yet for this slide (there's no
    // Banner_2Tablet.png in /public/banner) - leaving tabletImageUrl unset
    // makes the tablet tier fall back to desktopImageUrl automatically
    // (see HeroCarousel). Add a real Banner_2Tablet.png + this field once
    // one's shot.
    // File on disk is "Baner_2Mobile.png" (missing the second "n", same
    // typo as slide 1's Baner_1Mobile.png) - pointing at the real filename
    // instead of renaming it, to match how slide 1 was handled.
    mobileImageUrl: "/banner/Baner_2Mobile.png",
    theme: "light",
  },
  // {
  //   id: "slide-newin",
  //   eyebrow: "Acabou de Chegar",
  //   title: "Novidades da Semana",
  //   subtitle: "Looks novos, reposição diária.",
  //   ctaLabel: "Ver Novidades",
  //   ctaHref: "/shop?filter=new",
  //   desktopImageUrl: placeholderImage("Novidades — Desktop 21:9", {
  //     width: 2400,
  //     height: 1000,
  //     bg: "#0a0a0a",
  //     fg: "#fafafa",
  //   }),
  //   mobileImageUrl: placeholderImage("Novidades — Mobile 4:5", {
  //     width: 1000,
  //     height: 1250,
  //     bg: "#0a0a0a",
  //     fg: "#fafafa",
  //   }),
  //   theme: "dark",
  // },
];
