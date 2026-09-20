/**
 * Generates a deterministic SVG placeholder image as a data URI, so the
 * scaffold has zero external image dependencies (no network calls, no
 * next/image remote-pattern config needed). Swap these out for real
 * product photography / CDN URLs once available - every place that calls
 * this only needs its `imageUrl` string replaced.
 */
export function placeholderImage(
  label: string,
  {
    width = 800,
    height = 1000,
    bg = "#e5e5e5",
    fg = "#737373",
    fontSize,
  }: {
    width?: number;
    height?: number;
    bg?: string;
    fg?: string;
    /** Override the auto-computed font size (useful for short labels
     * like a single initial in a small avatar circle). */
    fontSize?: number;
  } = {}
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${bg}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${
          fontSize ?? Math.round(width / 14)
        }"
        fill="${fg}" letter-spacing="1">${escapeXml(label)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Retorna o caminho da foto de avatar real contida no diretório /public.
 */
export function placeholderAvatar(): string {
  return "/avatar.jpg";
}
