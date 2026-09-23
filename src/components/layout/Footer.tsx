"use client";

import Link from "next/link";
import { useState } from "react";
import { config } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faPinterest } from "@fortawesome/free-brands-svg-icons";

// Same reasoning as `<TestimonialsCarousel/>`: render icons sized purely by
// our own Tailwind classes instead of FontAwesome auto-injecting its own
// <style> tag (which briefly flashes oversized icons on load). Set here
// too, not just there - <Footer/> renders on every page via layout.tsx,
// including ones that never mount <TestimonialsCarousel/> (e.g. /login),
// so this can't rely on that other file's copy of the same line having
// already run first.
config.autoAddCss = false;

interface FooterSection {
  id: string;
  title: string;
  links: { label: string; href: string }[];
}

// Every internal href in this file is "/" on purpose - none of these
// pages exist yet (no all-products listing, no SS26 collection page, no
// support/about/wholesale/careers/press pages), and they used to 404 from
// the footer. No resources yet to build all of that out, so every one of
// these sends the visitor home instead of into a dead end - same fix
// applied to the header's CategoryBar (`@/data/categories`) and to
// `<ProductDetail/>`'s "Relatar problema" link. Point each one at its real
// destination once that page exists; only the hrefs need to change.
const sections: FooterSection[] = [
  {
    id: "menu",
    title: "Menu",
    links: [
      { label: "Todos os Produtos", href: "/" },
      { label: "Novidades", href: "/" },
      { label: "Mais Vendidos", href: "/" },
      { label: "SS26", href: "/" },
    ],
  },
  {
    id: "support",
    title: "Suporte",
    links: [
      { label: "Contato", href: "/" },
      { label: "Trocas e Devoluções", href: "/" },
      { label: "Guia de Medidas", href: "/" },
      { label: "Rastrear Pedido", href: "/" },
    ],
  },
  {
    id: "business",
    title: "Empresa",
    links: [
      { label: "Sobre Nós", href: "/" },
      { label: "Atacado", href: "/" },
      { label: "Trabalhe Conosco", href: "/" },
      { label: "Imprensa", href: "/" },
    ],
  },
];

// Real brand marks instead of text labels ("INSTAGRAM", "TIKTOK",
// "YOUTUBE") - Alfredo wants icons that are actually representative of
// each network, not their name spelled out. Icons render via `currentColor`
// (see the `<FontAwesomeIcon/>` usage below), so they already pick up the
// same `text-neutral-*`/`dark:text-neutral-*` treatment as everything else
// in the footer and need no separate light/dark asset - "acompanhem o tema
// do site" falls out of that for free.
const socials = [
  { label: "Instagram", href: "https://www.instagram.com/scathonbr/", icon: faInstagram },
  { label: "TikTok", href: "https://www.tiktok.com/@scathonbr", icon: faTiktok },
  { label: "Pinterest", href: "https://br.pinterest.com/scathon01/", icon: faPinterest },
];

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
 * same cap already used on `<FloatingDock/>` - so the three columns don't
 * stretch edge-to-edge into huge, unevenly-spaced gaps on very wide desktop
 * monitors (exactly what made the columns feel scattered rather than
 * grouped in the screenshot Alfredo sent). Like the dock, this is a no-op
 * below 1200px - phones and most laptops are unaffected.
 */
export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-sm text-neutral-600 dark:text-neutral-400 px-4 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-0 sm:grid-cols-3 sm:gap-12 lg:gap-20">
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div
                key={section.id}
                className="border-b border-neutral-200 dark:border-neutral-800 sm:border-none"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenSection((current) => (current === section.id ? null : section.id))
                  }
                  className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-widest sm:tracking-[0.15em] text-neutral-900 dark:text-neutral-100 sm:pointer-events-none sm:pb-0 sm:mb-4"
                >
                  {section.title}
                  <span className="sm:hidden" aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <ul
                  className={`flex flex-col gap-3 overflow-hidden transition-all sm:block sm:space-y-3 sm:max-h-none sm:pb-2 ${
                    isOpen ? "max-h-96 pb-4" : "max-h-0 sm:overflow-visible"
                  }`}
                >
                  {section.links.map((link) => (
                    // Keyed by label, not href - several links in the same
                    // section now share the placeholder href "/" (see the
                    // doc comment on `sections` above), so href alone is no
                    // longer unique. Labels are unique within a section.
                    <li key={link.label}>
                      <Link href={link.href} className="hover:text-neutral-900 dark:hover:text-neutral-100">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
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
                className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                <FontAwesomeIcon icon={social.icon} className="h-5 w-5" aria-hidden />
              </a>
            ))}
          </div>
          <p>
            &copy; {new Date().getFullYear()} Scathon. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
