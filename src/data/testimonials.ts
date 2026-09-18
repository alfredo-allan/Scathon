import { placeholderImage } from "@/lib/placeholder";
import type { Testimonial } from "@/types";

function avatar(initial: string, bg: string) {
  return placeholderImage(initial, { width: 96, height: 96, bg, fg: "#404040", fontSize: 40 });
}

function instagram(handle: string) {
  return {
    instagramHandle: `@${handle}`,
    instagramUrl: `https://instagram.com/${handle}`,
  };
}

export const testimonials: Testimonial[] = [
  {
    id: "t-001",
    rating: 5,
    title: "Qualidade Incrível",
    quote: "Qualidade incrível, os produtos são muito bons e o caimento é exatamente como descrito.",
    author: "Bianca",
    avatarUrl: avatar("B", "#f5d0c5"),
    ...instagram("bianca.ss"),
  },
  {
    id: "t-002",
    rating: 5,
    title: "Entrega Rápida",
    quote: "O pedido chegou em 3 dias e a embalagem estava impecável.",
    author: "James",
    avatarUrl: avatar("J", "#c5d8f5"),
    ...instagram("james.wear"),
  },
  {
    id: "t-003",
    rating: 4,
    title: "Tamanho Perfeito",
    quote: "Finalmente uma marca streetwear que acerta na tabela de tamanhos sempre.",
    author: "Marcos",
    avatarUrl: avatar("M", "#d7f5c5"),
    ...instagram("marcos.fits"),
  },
  {
    id: "t-004",
    rating: 5,
    title: "Ótimo Suporte",
    quote: "Tive um problema com meu pedido e o time resolveu no mesmo dia. Atendimento de verdade.",
    author: "Luiza",
    avatarUrl: avatar("L", "#f5e1c5"),
    ...instagram("luiza.style"),
  },
  {
    id: "t-005",
    rating: 5,
    title: "Viciada na Marca",
    quote: "Comprei o moletom heavyweight e agora quero em todas as cores.",
    author: "Renata",
    avatarUrl: avatar("R", "#e5c5f5"),
    ...instagram("renata.drip"),
  },
  {
    id: "t-006",
    rating: 4,
    title: "Vale o Investimento",
    quote: "Mais caro que fast fashion, mas o tecido e o acabamento justificam.",
    author: "Diego",
    avatarUrl: avatar("D", "#c5f5ef"),
    ...instagram("diego.fits"),
  },
  {
    id: "t-007",
    rating: 5,
    title: "Cliente Fiel",
    quote: "Essa já é minha quarta compra. Qualidade consistente sempre.",
    author: "Paula",
    avatarUrl: avatar("P", "#f5c5d3"),
    ...instagram("paula.looks"),
  },
];
