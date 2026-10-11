'use client'

import Link from 'next/link'
import { useState } from 'react'
import { config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faTiktok, faPinterest } from '@fortawesome/free-brands-svg-icons'
import { ContactModal } from './ContactModal'

// Same reasoning as `<TestimonialsCarousel/>`: render icons sized purely by
// our own Tailwind classes instead of FontAwesome auto-injecting its own
// <style> tag (which briefly flashes oversized icons on load). Set here
// too, not just there - <Footer/> renders on every page via layout.tsx,
// including ones that never mount <TestimonialsCarousel/> (e.g. /login),
// so this can't rely on that other file's copy of the same line having
// already run first.
config.autoAddCss = false

interface FooterLink {
  label: string
  /** Omitido pra um link que não navega pra lugar nenhum - hoje só
   * "Contato" (`isContactTrigger` abaixo), que abre o `<ContactModal/>`. */
  href?: string
  /** Abre numa aba nova via `<a target="_blank">` em vez de `<Link>` do
   * Next - pro "Rastrear Pedido" (Melhor Envio, um domínio de verdade fora
   * do site), onde faz sentido o visitante nunca sair da própria loja. */
  external?: boolean
  /** "Contato" não é mais um link - abre o `<ContactModal/>` (pedido do
   * Alfredo em 2026-10-11, substituindo o antigo placeholder "/"). */
  isContactTrigger?: boolean
}

interface FooterSection {
  id: string
  title: string
  links: FooterLink[]
}

// Pedido do Alfredo em 2026-10-11: removida a coluna "Empresa" inteira
// (Sobre Nós/Atacado/Trabalhe Conosco/Imprensa não existem ainda e não há
// previsão de página própria pra nenhuma) e "Guia de Medidas" (sem conteúdo
// pronto). "Menu" continua apontando pra "/" - mesmo motivo de antes (essas
// páginas - todos os produtos, novidades, mais vendidos, SS26 - ainda não
// existem como rotas próprias). "Trocas e Devoluções" e "Rastrear Pedido"
// já têm destino real agora (ver `FooterLink` acima).
const sections: FooterSection[] = [
  {
    id: 'menu',
    title: 'Menu',
    links: [
      { label: 'Todos os Produtos', href: '/' },
      { label: 'Novidades', href: '/' },
      { label: 'Mais Vendidos', href: '/' },
      { label: 'SS26', href: '/' }
    ]
  },
  {
    id: 'support',
    title: 'Suporte',
    links: [
      { label: 'Contato', isContactTrigger: true },
      { label: 'Trocas e Devoluções', href: '/politicas/trocas-e-devolucoes' },
      { label: 'Rastrear Pedido', href: 'https://melhorrastreio.com.br/', external: true }
    ]
  }
]

// Real brand marks instead of text labels ("INSTAGRAM", "TIKTOK",
// "YOUTUBE") - Alfredo wants icons that are actually representative of
// each network, not their name spelled out. Icons render via `currentColor`
// (see the `<FontAwesomeIcon/>` usage below), so they already pick up the
// same `text-neutral-*`/`dark:text-neutral-*` treatment as everything else
// in the footer and need no separate light/dark asset - "acompanhem o tema
// do site" falls out of that for free.
const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/scathonbr/', icon: faInstagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@scathonbr', icon: faTiktok },
  { label: 'Pinterest', href: 'https://br.pinterest.com/scathon01/', icon: faPinterest }
]

/**
 * Site footer. Sections collapse into an accordion on mobile and expand
 * into plain columns from `sm` upward.
 *
 * Typography was bumped a full step up from the original `text-xs`
 * (12px)/`gap-2` combo - at desktop width, that size read as cramped and
 * "embaralhado" (jumbled) rather than organized into three clear columns.
 * `text-sm` links with more line gap (`gap-3`) and a clearer gap between
 * each heading and its own list (`mb-3`) give every column room to read as
 * its own group at a glance instead of a wall of small text.
 *
 * The whole content block is also capped at `max-w-[1200px] mx-auto` - the
 * same cap already used on `<FloatingDock/>` - so the columns don't stretch
 * edge-to-edge into huge, unevenly-spaced gaps on very wide desktop
 * monitors (exactly what made the columns feel scattered rather than
 * grouped in the screenshot Alfredo sent). Like the dock, this is a no-op
 * below 1200px - phones and most laptops are unaffected. Switched from a
 * 3-column `grid` to a `flex` row (`sm:flex-row`) since the "Empresa"
 * section was removed (pedido do Alfredo em 2026-10-11) - a 2-column grid
 * would've stretched "Menu"/"Suporte" to split the full 1200px width in
 * half, leaving a huge, unbalanced gap between them; `flex` sizes each
 * column to its own content instead, so the two stay close together like
 * in the original 3-column design.
 */
export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [isContactOpen, setIsContactOpen] = useState(false)

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-sm text-neutral-600 dark:text-neutral-400 px-4 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-0 sm:flex-row sm:gap-12 lg:gap-20">
          {sections.map((section) => {
            const isOpen = openSection === section.id
            return (
              <div key={section.id} className="border-b border-neutral-200 dark:border-neutral-800 sm:border-none">
                <button
                  type="button"
                  onClick={() => setOpenSection((current) => (current === section.id ? null : section.id))}
                  className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-widest sm:tracking-[0.15em] text-neutral-900 dark:text-neutral-100 sm:pointer-events-none sm:pb-0 sm:mb-4">
                  {section.title}
                  <span className="sm:hidden" aria-hidden>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <ul
                  className={`flex flex-col gap-3 overflow-hidden transition-all sm:block sm:space-y-3 sm:max-h-none sm:pb-2 ${
                    isOpen ? 'max-h-96 pb-4' : 'max-h-0 sm:overflow-visible'
                  }`}>
                  {section.links.map((link) => (
                    // Keyed by label - "Menu" ainda compartilha o
                    // placeholder href "/" entre seus itens (ver o doc
                    // comment de `sections` acima), então href sozinho não
                    // é único; labels são únicas dentro de cada seção.
                    <li key={link.label}>
                      {link.isContactTrigger ? (
                        <button
                          type="button"
                          onClick={() => setIsContactOpen(true)}
                          className="hover:text-neutral-900 dark:hover:text-neutral-100">
                          {link.label}
                        </button>
                      ) : link.external ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className="hover:text-neutral-900 dark:hover:text-neutral-100">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href ?? '/'} className="hover:text-neutral-900 dark:hover:text-neutral-100">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5 sm:gap-6">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
                <FontAwesomeIcon icon={social.icon} className="h-5 w-5" aria-hidden />
              </a>
            ))}
          </div>
          <p>&copy; {new Date().getFullYear()} Scathon. Todos os direitos reservados.</p>
        </div>
      </div>

      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </footer>
  )
}
