"use client";

import Link from "next/link";
import { useState } from "react";

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

const socials = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "YouTube", href: "https://youtube.com" },
];

/**
 * Site footer. Sections collapse into an accordion on mobile and expand
 * into plain columns from `sm` upward.
 */
export function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 text-xs text-neutral-600 dark:text-neutral-400 px-4 md:px-8">
      <div className="grid gap-0 sm:grid-cols-3 sm:gap-8">
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
                className="flex w-full items-center justify-between py-4 text-left font-semibold uppercase tracking-widest sm:tracking-[0.15em] text-neutral-900 dark:text-neutral-100 sm:pointer-events-none sm:pb-3"
              >
                {section.title}
                <span className="sm:hidden" aria-hidden>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <ul
                className={`flex flex-col gap-2 overflow-hidden transition-all sm:block sm:max-h-none sm:pb-2 ${
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
        <div className="flex gap-4 sm:gap-6">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="uppercase tracking-widest sm:tracking-[0.15em] hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              {social.label}
            </a>
          ))}
        </div>
        <p>
          &copy; {new Date().getFullYear()} Scathon. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
