export type UserRole = "admin" | "customer";

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface ColorVariant {
  name: string;
  hex: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  imageUrl: string;
  hoverImageUrl?: string;
  colors: ColorVariant[];
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  category: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  imageUrl: string;
  color: string;
  size: string;
  quantity: number;
}

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  /**
   * Optional dedicated tablet crop (~640px-1024px viewports). Falls back to
   * `desktopImageUrl` when a slide doesn't provide one, matching the old
   * two-tier (mobile/desktop) behaviour.
   */
  tabletImageUrl?: string;
  /**
   * Optional real aspect ratio ("width / height") override for the mobile
   * or tablet image box, when a slide's photo isn't cut to the default 4:5
   * / 16:10 crop. Desktop has no such override: that box is a fixed 21:9
   * and its image is `object-contain`ed to fit inside it (see
   * HeroCarousel), so the carousel's own size never depends on the photo.
   */
  mobileAspectRatio?: string;
  tabletAspectRatio?: string;
  theme: "light" | "dark";
}

export interface Category {
  id: string;
  label: string;
  href: string;
}

export interface DividerSlide {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
}

export interface Testimonial {
  id: string;
  rating: number;
  title: string;
  quote: string;
  author: string;
  avatarUrl: string;
  instagramHandle: string;
  instagramUrl: string;
}
