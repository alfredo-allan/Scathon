import type { Category } from "@/types";

export const categories: Category[] = [
  { id: "shop-all", label: "Shop All", href: "/shop" },
  { id: "new-in", label: "New In", href: "/shop?filter=new" },
  { id: "best-sellers", label: "Best Sellers", href: "/shop?filter=best-sellers" },
  { id: "ss26", label: "SS26", href: "/collections/ss26" },
];

export const popularCategories: Category[] = [
  { id: "hoodies", label: "Hoodies", href: "/shop/hoodies" },
  { id: "tees", label: "T-Shirts", href: "/shop/tees" },
  { id: "outerwear", label: "Outerwear", href: "/shop/outerwear" },
  { id: "pants", label: "Pants", href: "/shop/pants" },
  { id: "accessories", label: "Accessories", href: "/shop/accessories" },
];
