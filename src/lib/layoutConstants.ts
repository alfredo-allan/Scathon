/**
 * Scroll distance (px) past which the static <Header/> slides away and
 * the floating <FloatingDock/> anchor nav takes over. Shared by both
 * components (via useScrolledPast) so they flip in perfect sync instead
 * of drifting if one gets tuned without the other.
 */
export const FLOATING_NAV_SCROLL_THRESHOLD = 80;

/**
 * Seller WhatsApp number (E.164 digits only, no "+"), used by the cart's
 * "combinar com o vendedor" custom-delivery option to open a prefilled
 * `wa.me` chat. Placeholder - swap for the real Scathon storefront number
 * once one exists; every caller reads this one constant.
 */
export const SELLER_WHATSAPP_NUMBER = "5511999999999";
