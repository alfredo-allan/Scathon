import { placeholderImage } from "@/lib/placeholder";
import type { DividerSlide } from "@/types";

export const dividerSlides: DividerSlide[] = [
  {
    id: "divider-hoodies",
    title: "Hoodies & Fleece",
    href: "/shop/hoodies",
    imageUrl: placeholderImage("Hoodies", {
      width: 1200,
      height: 700,
      bg: "#d4d4d4",
      fg: "#262626",
    }),
  },
  {
    id: "divider-outerwear",
    title: "Outerwear",
    href: "/shop/outerwear",
    imageUrl: placeholderImage("Outerwear", {
      width: 1200,
      height: 700,
      bg: "#a3a3a3",
      fg: "#171717",
    }),
  },
  {
    id: "divider-accessories",
    title: "Accessories",
    href: "/shop/accessories",
    imageUrl: placeholderImage("Accessories", {
      width: 1200,
      height: 700,
      bg: "#737373",
      fg: "#fafafa",
    }),
  },
];
