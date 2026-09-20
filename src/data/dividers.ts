import { placeholderImage } from "@/lib/placeholder";
import type { DividerSlide } from "@/types";

export const dividerSlides: DividerSlide[] = [
  {
    id: "divider-hoodies",
    title: "Moletons e Fleece",
    href: "/shop/moletons",
    imageUrl: placeholderImage("Moletons", {
      width: 1200,
      height: 700,
      bg: "#d4d4d4",
      fg: "#262626",
    }),
  },
  {
    id: "divider-outerwear",
    title: "Casacos",
    href: "/shop/casacos",
    imageUrl: placeholderImage("Casacos", {
      width: 1200,
      height: 700,
      bg: "#a3a3a3",
      fg: "#171717",
    }),
  },
  {
    id: "divider-accessories",
    title: "Acessórios",
    href: "/shop/acessorios",
    imageUrl: placeholderImage("Acessórios", {
      width: 1200,
      height: 700,
      bg: "#737373",
      fg: "#fafafa",
    }),
  },
];
