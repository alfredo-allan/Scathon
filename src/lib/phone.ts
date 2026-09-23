/**
 * Formats raw digits into a Brazilian phone pattern as the user types -
 * `(11) 9123-4567` while it's still short enough to be a landline, sliding
 * into the 9-digit mobile shape `(11) 91234-5678` once there's an 11th
 * digit. Same "format on every keystroke" approach as `@/lib/viaCep`'s
 * `formatCep`.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isCompletePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}
