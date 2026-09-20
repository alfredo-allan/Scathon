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

export interface ProductReview {
  author: string;
  rating: number;
  comment: string;
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
  /**
   * Extra gallery photos for the product detail page
   * (`/shop/[category]/[product]`). Optional on purpose: when a product
   * doesn't provide one yet, `<ProductGallery/>` derives a small gallery
   * from `imageUrl`/`hoverImageUrl`/the active color's own photo instead,
   * so a newly-added product renders a complete detail page immediately -
   * a real photoshoot's multiple angles just slot in here later.
   */
  images?: string[];
  colors: ColorVariant[];
  /**
   * Available sizes ("P"/"M"/"G" for apparel, numeric for pants/jeans).
   * Omit entirely for one-size items (beanies, bags) to hide the size
   * selector on the detail page rather than showing an empty one.
   */
  sizes?: string[];
  /** Style/SKU code shown in the detail page's spec list (e.g. "SCT-HW01-001"). */
  styleCode?: string;
  /**
   * Longer marketing copy for the detail page's "Descrição" section.
   * Supports blank-line-separated paragraphs. Falls back to a generic
   * paragraph built from the title when omitted.
   */
  description?: string;
  /**
   * A handful of written reviews to show under the aggregate rating.
   * Optional - most products only carry the aggregate `rating`/
   * `reviewCount` for now; add real reviews here as they come in.
   */
  reviews?: ProductReview[];
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
