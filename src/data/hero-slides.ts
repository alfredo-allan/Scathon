import { placeholderImage } from "@/lib/placeholder";
import type { HeroSlide } from "@/types";

export const heroSlides: HeroSlide[] = [
  {
    id: "slide-ss26",
    eyebrow: "SS26 Collection",
    title: "New Season, New Rules",
    subtitle: "Streetwear built for movement.",
    ctaLabel: "Shop the Drop",
    ctaHref: "/collections/ss26",
    desktopImageUrl: placeholderImage("SS26 — Desktop 21:9", {
      width: 2400,
      height: 1000,
      bg: "#171717",
      fg: "#fafafa",
    }),
    mobileImageUrl: placeholderImage("SS26 — Mobile 4:5", {
      width: 1000,
      height: 1250,
      bg: "#171717",
      fg: "#fafafa",
    }),
    theme: "dark",
  },
  {
    id: "slide-bestsellers",
    eyebrow: "Best Sellers",
    title: "Back in Stock",
    subtitle: "The pieces everyone's been asking for.",
    ctaLabel: "Shop Best Sellers",
    ctaHref: "/shop?filter=best-sellers",
    desktopImageUrl: placeholderImage("Best Sellers — Desktop 21:9", {
      width: 2400,
      height: 1000,
      bg: "#e5e5e5",
      fg: "#404040",
    }),
    mobileImageUrl: placeholderImage("Best Sellers — Mobile 4:5", {
      width: 1000,
      height: 1250,
      bg: "#e5e5e5",
      fg: "#404040",
    }),
    theme: "light",
  },
  {
    id: "slide-newin",
    eyebrow: "Just Landed",
    title: "New In This Week",
    subtitle: "Fresh fits, restocked daily.",
    ctaLabel: "Discover New In",
    ctaHref: "/shop?filter=new",
    desktopImageUrl: placeholderImage("New In — Desktop 21:9", {
      width: 2400,
      height: 1000,
      bg: "#0a0a0a",
      fg: "#fafafa",
    }),
    mobileImageUrl: placeholderImage("New In — Mobile 4:5", {
      width: 1000,
      height: 1250,
      bg: "#0a0a0a",
      fg: "#fafafa",
    }),
    theme: "dark",
  },
];
