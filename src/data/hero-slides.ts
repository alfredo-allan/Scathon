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
    // Real banner artwork (test render) - swap these back to placeholderImage(...)
    // calls if the real assets are ever pulled from /public/banner.
    desktopImageUrl: "/banner/Banner_1Desktop.png",
    tabletImageUrl: "/banner/Banner_1Tablet.png",
    mobileImageUrl: "/banner/Baner_1Mobile.png",
    // The desktop export is a near-square photo (2184x1920, ~1.14:1), not a
    // wide cinematic shot. The carousel's default 21:9 desktop crop forced
    // it to lose about half its height (heads/feet got cut off), so this
    // slide overrides to a gentler 16:9 - most of the photo stays visible
    // without making the hero section unreasonably tall. Mobile/tablet
    // already crop this same photo fine at their defaults (4:5 / 16:10),
    // so those are left alone.
    desktopAspectRatio: "16 / 9",
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
