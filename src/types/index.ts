export type UserRole = "admin" | "customer";

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  /** Optional - older/mock sessions created before this field existed simply omit it. */
  phone?: string | null;
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
  /**
   * Real product photography cover image, following the asset convention
   * `public/category/[categoria]/[arquivo]` (e.g.
   * "/category/shirt/BlackCathedral-T-shirt.jpeg" for a file at
   * `public/category/shirt/BlackCathedral-T-shirt.jpeg` - anything under
   * `public/` is served from the site root, so the leading `/category/...`
   * *is* the URL). Deliberately kept separate from `imageUrl` (the
   * placeholder-era cover) rather than replacing it: when a product sets
   * `coverImage`, every cover/thumbnail spot (`<ProductCard/>`, the detail
   * page's gallery fallback) prefers it over `imageUrl` and `colors[].
   * imageUrl`; when it's omitted, those keep working exactly as before.
   * This lets real photography and placeholder products coexist in the
   * same catalog without a forced migration.
   */
  coverImage?: string;
  /**
   * Real product photography for the detail page gallery ("specimen"/model
   * photos), following the asset convention `public/specimen/[arquivo]`
   * (e.g. "/specimen/BlackModelCathedral-T-shirt.jpeg"). When present, this
   * takes priority over `images` (and over the placeholder-derived
   * fallback) in `<ProductGallery/>` - same additive relationship as
   * `coverImage` above.
   */
  specimenImages?: string[];
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
  /**
   * When `"coming_soon"`, the product isn't orderable yet: `<ProductCard/>`
   * shows an "Em breve" badge instead of/alongside "Novo" and swaps its
   * color/rating row for a `<NotifyMeButton/>`, and the detail page replaces
   * "Adicionar ao carrinho" (and the shipping estimator) with the same
   * waitlist control. Omit entirely - or set `"in_stock"` explicitly, same
   * effect - for a normal, purchasable product; this is additive so every
   * existing product keeps working unchanged.
   */
  availability?: "in_stock" | "coming_soon";
  /**
   * Marks a product for the home page's "Mais Vendidos" curated rail (see
   * `getBestSellers()`); when at least one product sets this, that rail
   * shows exactly the flagged products instead of the reviewCount-sorted
   * fallback, so specific products (including a `coming_soon` one with no
   * reviews yet) can be featured there deliberately.
   */
  isBestSeller?: boolean;
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
  /**
   * Wide banner shown from the `md` breakpoint up (tablet and desktop share
   * this one image, unlike `HeroSlide` which splits tablet out too - these
   * banners are shot/cropped as a single 21:9 asset meant to cover both).
   * Rendered with `object-cover` inside a fixed `aspect-[21/9]` box.
   */
  desktopImageUrl: string;
  /**
   * Dedicated portrait crop shown below `md`. Rendered inside a fixed
   * `aspect-[9/16]` box, matching the real assets' own crop (1536×2752)
   * rather than an arbitrary default.
   */
  mobileImageUrl: string;
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
