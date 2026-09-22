import { getProductBySlug } from "@/data/products";

export interface OrderItem {
  slug: string;
  category: string;
  title: string;
  price: number;
  imageUrl: string;
  color: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  placedAt: string; // ISO date
  status: "processando" | "a caminho" | "entregue";
  items: OrderItem[];
}

function itemFromSlug(slug: string, color: string, size: string, quantity = 1): OrderItem {
  const product = getProductBySlug(slug);
  if (!product) {
    throw new Error(`getRecentOrders: unknown product slug "${slug}"`);
  }
  return {
    slug: product.slug,
    category: product.category,
    title: product.title,
    price: product.price,
    imageUrl: product.coverImage ?? product.colors.find((c) => c.name === color)?.imageUrl ?? product.imageUrl,
    color,
    size,
    quantity,
  };
}

// There's no checkout/order backend yet, so this is mock history built
// from real catalog products - only the two that are actually purchasable
// today (`cathedral-t-shirt-preta`/`-branca`; everything else in the
// catalog is `availability: "coming_soon"`, so a past *delivered* order
// for one of those would contradict its own "Em breve" badge). Just
// enough for `/account/orders` to show something real-looking rather than
// an empty page. Dates are relative to "now" so the page still reads as
// recent whenever it's opened, instead of visibly going stale.
function buildMockOrders(): Order[] {
  const now = Date.now();
  const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "SCT-100482",
      placedAt: daysAgo(3),
      status: "a caminho",
      items: [itemFromSlug("cathedral-t-shirt-preta", "Preto", "M")],
    },
    {
      id: "SCT-100317",
      placedAt: daysAgo(19),
      status: "entregue",
      items: [itemFromSlug("cathedral-t-shirt-branca", "Branco", "G")],
    },
    {
      id: "SCT-100205",
      placedAt: daysAgo(41),
      status: "entregue",
      items: [
        itemFromSlug("cathedral-t-shirt-preta", "Preto", "P"),
        itemFromSlug("cathedral-t-shirt-branca", "Branco", "M", 2),
      ],
    },
  ];
}

/**
 * Recent order history for the signed-in customer. Kept as a plain
 * synchronous function - like `getBestSellers()`/`getProductsByCategory()`
 * in `@/data/products` - rather than the `async`/`Promise` seam used by
 * `@/lib/waitlist` and `@/lib/orderReviews`: those two *write* data (there's
 * a real future POST to swap in), while this only *reads* a list that,
 * once there's a real backend, becomes a `fetch("/api/orders")` call in
 * this one function - `<AccountOrdersView/>`, its only caller, wouldn't
 * need to change either way.
 */
export function getRecentOrders(): Order[] {
  return buildMockOrders();
}
