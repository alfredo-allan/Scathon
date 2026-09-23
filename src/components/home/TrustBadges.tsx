const badges = [{ label: 'Envio para Todo o Mundo' }, { label: 'Devolução em 14 Dias' }, { label: 'Mais de 65.000 Clientes' }]

/**
 * Minimalist status section highlighting key assurances.
 */
export function TrustBadges() {
  return (
    <section
      aria-label="Por que comprar conosco"
      className="grid grid-cols-3 gap-4 py-8 text-center text-xs tracking-wider border-y border-neutral-100 dark:border-neutral-800 px-4 hidden">
      {badges.map((badge) => (
        <p key={badge.label} className="uppercase text-neutral-600 dark:text-neutral-400">
          {badge.label}
        </p>
      ))}
    </section>
  )
}
