/**
 * Scroll distance (px) past which the static <Header/> slides away and
 * the floating <FloatingDock/> anchor nav takes over. Shared by both
 * components (via useScrolledPast) so they flip in perfect sync instead
 * of drifting if one gets tuned without the other.
 */
export const FLOATING_NAV_SCROLL_THRESHOLD = 80;
