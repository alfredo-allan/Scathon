interface StarRatingProps {
  rating: number;
  reviewCount: number;
}

/**
 * Aggregated rating score + review count, e.g. "★★★★☆ 4.7 (128)".
 * Purely presentational - fed by <ProductCard/>.
 */
export function StarRating({ rating, reviewCount }: StarRatingProps) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-1 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
      <span aria-hidden className="flex text-neutral-900 dark:text-neutral-100">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index}>{index < rounded ? "★" : "☆"}</span>
        ))}
      </span>
      <span className="tabular-nums">{rating.toFixed(1)}</span>
      <span>({reviewCount})</span>
    </div>
  );
}
