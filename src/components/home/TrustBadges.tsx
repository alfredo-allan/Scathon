const badges = [
  { label: "Worldwide Shipping" },
  { label: "14 Day Returns" },
  { label: "65,000+ Customers" },
];

/**
 * Minimalist status section highlighting key assurances.
 */
export function TrustBadges() {
  return (
    <section
      aria-label="Why shop with us"
      className="grid grid-cols-3 gap-4 py-8 text-center text-xs tracking-wider border-y border-neutral-100 dark:border-neutral-800 px-4"
    >
      {badges.map((badge) => (
        <p key={badge.label} className="uppercase text-neutral-600 dark:text-neutral-400">
          {badge.label}
        </p>
      ))}
    </section>
  );
}
