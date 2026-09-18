import { placeholderImage } from "@/lib/placeholder";
import type { Product } from "@/types";

function productImages(label: string, colorLabel: string, bg: string) {
  return {
    imageUrl: placeholderImage(`${label}\n${colorLabel}`, { bg }),
    hoverImageUrl: placeholderImage(`${label}\n${colorLabel} (alt)`, {
      bg,
      fg: "#171717",
    }),
  };
}

export const products: Product[] = [
  {
    id: "p-001",
    slug: "oversized-heavyweight-hoodie",
    title: "Oversized Heavyweight Hoodie",
    price: 349.9,
    compareAtPrice: 429.9,
    currency: "BRL",
    category: "hoodies",
    rating: 4.7,
    reviewCount: 128,
    isNew: true,
    ...productImages("Heavyweight Hoodie", "Black", "#d4d4d4"),
    colors: [
      { name: "Black", hex: "#171717", imageUrl: placeholderImage("Hoodie\nBlack", { bg: "#d4d4d4" }) },
      { name: "Stone", hex: "#d6d3d1", imageUrl: placeholderImage("Hoodie\nStone", { bg: "#e7e5e4" }) },
      { name: "Olive", hex: "#4d5339", imageUrl: placeholderImage("Hoodie\nOlive", { bg: "#dad9d0" }) },
    ],
  },
  {
    id: "p-002",
    slug: "boxy-fit-tee",
    title: "Boxy Fit Graphic Tee",
    price: 149.9,
    currency: "BRL",
    category: "tees",
    rating: 4.5,
    reviewCount: 84,
    ...productImages("Boxy Tee", "White", "#f5f5f5"),
    colors: [
      { name: "White", hex: "#fafafa", imageUrl: placeholderImage("Tee\nWhite", { bg: "#f5f5f5" }) },
      { name: "Black", hex: "#171717", imageUrl: placeholderImage("Tee\nBlack", { bg: "#e5e5e5" }) },
    ],
  },
  {
    id: "p-003",
    slug: "cargo-utility-pants",
    title: "Cargo Utility Pants",
    price: 389.9,
    currency: "BRL",
    category: "pants",
    rating: 4.8,
    reviewCount: 201,
    isNew: true,
    ...productImages("Cargo Pants", "Khaki", "#e7e5e4"),
    colors: [
      { name: "Khaki", hex: "#a8a29e", imageUrl: placeholderImage("Cargo\nKhaki", { bg: "#e7e5e4" }) },
      { name: "Black", hex: "#171717", imageUrl: placeholderImage("Cargo\nBlack", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-004",
    slug: "coach-shell-jacket",
    title: "Coach Shell Jacket",
    price: 549.9,
    compareAtPrice: 649.9,
    currency: "BRL",
    category: "outerwear",
    rating: 4.6,
    reviewCount: 57,
    ...productImages("Coach Jacket", "Navy", "#d1d5db"),
    colors: [
      { name: "Navy", hex: "#1e293b", imageUrl: placeholderImage("Jacket\nNavy", { bg: "#d1d5db" }) },
      { name: "Black", hex: "#171717", imageUrl: placeholderImage("Jacket\nBlack", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-005",
    slug: "ribbed-beanie",
    title: "Ribbed Knit Beanie",
    price: 89.9,
    currency: "BRL",
    category: "accessories",
    rating: 4.9,
    reviewCount: 312,
    ...productImages("Beanie", "Charcoal", "#e5e5e5"),
    colors: [
      { name: "Charcoal", hex: "#404040", imageUrl: placeholderImage("Beanie\nCharcoal", { bg: "#e5e5e5" }) },
      { name: "Cream", hex: "#f5f0e6", imageUrl: placeholderImage("Beanie\nCream", { bg: "#f5f5f4" }) },
      { name: "Rust", hex: "#9a3412", imageUrl: placeholderImage("Beanie\nRust", { bg: "#e7e5e4" }) },
    ],
  },
  {
    id: "p-006",
    slug: "relaxed-denim-jeans",
    title: "Relaxed Fit Denim",
    price: 329.9,
    currency: "BRL",
    category: "pants",
    rating: 4.4,
    reviewCount: 96,
    ...productImages("Denim", "Washed Blue", "#dbeafe"),
    colors: [
      { name: "Washed Blue", hex: "#60a5fa", imageUrl: placeholderImage("Denim\nWashed Blue", { bg: "#dbeafe" }) },
      { name: "Black", hex: "#171717", imageUrl: placeholderImage("Denim\nBlack", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-007",
    slug: "logo-crewneck-sweatshirt",
    title: "Logo Crewneck Sweatshirt",
    price: 279.9,
    currency: "BRL",
    category: "hoodies",
    rating: 4.6,
    reviewCount: 143,
    isNew: true,
    ...productImages("Crewneck", "Heather Grey", "#e5e7eb"),
    colors: [
      { name: "Heather Grey", hex: "#9ca3af", imageUrl: placeholderImage("Crewneck\nGrey", { bg: "#e5e7eb" }) },
      { name: "Black", hex: "#171717", imageUrl: placeholderImage("Crewneck\nBlack", { bg: "#d4d4d4" }) },
    ],
  },
  {
    id: "p-008",
    slug: "nylon-crossbody-bag",
    title: "Nylon Crossbody Bag",
    price: 199.9,
    currency: "BRL",
    category: "accessories",
    rating: 4.3,
    reviewCount: 41,
    ...productImages("Crossbody Bag", "Black", "#d4d4d4"),
    colors: [
      { name: "Black", hex: "#171717", imageUrl: placeholderImage("Bag\nBlack", { bg: "#d4d4d4" }) },
      { name: "Olive", hex: "#4d5339", imageUrl: placeholderImage("Bag\nOlive", { bg: "#dad9d0" }) },
    ],
  },
];

export function getBestSellers() {
  return [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);
}

export function getNewArrivals() {
  return products.filter((product) => product.isNew);
}
