"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { TouchEvent } from "react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

// Distância mínima de arrasto (px) pra contar como "troquei de foto" no
// swipe mobile - abaixo disso é só o dedo tremendo/um toque comum.
const SWIPE_THRESHOLD_PX = 40;

/**
 * Product photo gallery for the PDP - dois layouts bem diferentes, um por
 * breakpoint (não é o mesmo markup com classes responsivas por cima, são
 * duas árvores de JSX distintas, cada uma só existindo de verdade no seu
 * breakpoint via `hidden`/hidden-inverso - ver comentário de cada bloco
 * abaixo pro motivo).
 *
 * Mobile/`md`-down: uma foto grande em destaque + uma fileira de miniaturas
 * pequenas embaixo, que trocam a foto em destaque ao tocar (padrão pedido
 * pelo Alfredo com print de referência). A foto grande também responde a
 * arrastar o dedo pros lados (`onTouchStart`/`onTouchEnd`) - sem isso, quem
 * não percebe a fileira de miniaturas ficaria preso na primeira foto.
 *
 * Desktop/tablet (`lg`+): sem foto "em destaque" nem miniaturas - a galeria
 * inteira vira uma pane própria, presa na tela (`lg:sticky lg:top-6`, mesmo
 * offset do painel de compra ao lado) com um scroll independente
 * (`lg:overflow-y-auto` + `lg:max-h-[...]`). Rolar com o cursor em cima das
 * fotos rola por *elas* primeiro; só quando esse scroll interno chega ao
 * fim é que o resto do gesto passa pra rolagem da página inteira - isso é o
 * "scroll chaining" nativo do navegador (não precisa de JS pra isso), e só
 * funciona com `overscroll-behavior` no padrão `auto`: a tentativa anterior
 * usava `overscroll-contain`, que parece a escolha "segura" mas na
 * verdade bloqueia exatamente essa passagem de bastão pra página - testado
 * com um scroll simulado de verdade, não só lendo a spec. `no-scrollbar`
 * (mesma utilidade que o `<Header/>` e o `<CategoryBar/>` já usam) esconde a
 * barra de rolagem sem desligar o scroll que ela representa.
 */
export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const safeIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));
  const hasMultiplePhotos = images.length > 1;

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

    // Arrastou pra esquerda (delta negativo) -> próxima foto; pra direita ->
    // foto anterior. Sem "dar a volta" nas pontas, igual à fileira de
    // miniaturas (que também simplesmente para na primeira/última).
    setActiveIndex((current) => {
      const next = delta < 0 ? current + 1 : current - 1;
      return Math.max(0, Math.min(images.length - 1, next));
    });
  }

  return (
    <>
      {/* Mobile/tablet - foto em destaque + miniaturas.
          `min-w-0` aqui não é decoração: este <div> é item direto do grid de
          duas colunas da página (`ProductDetail.tsx`), e por padrão um item
          de grid/flex tem `min-width: auto` - ou seja, o navegador nunca o
          encolhe abaixo da largura "natural" do próprio conteúdo. Sem isso,
          um produto com bastante fotos faria a fileira de miniaturas (que
          quer rolar por conta própria, ver `overflow-x-auto` abaixo) esticar
          esta div - e com ela a coluna inteira do grid e a página junto -
          em vez de simplesmente ganhar sua própria barra de rolagem
          horizontal. `min-w-0` devolve pra esta div a permissão de ficar
          mais estreita que seu conteúdo, que é exatamente o que a rolagem
          interna da fileira precisa pra funcionar de verdade. */}
      <div className="min-w-0 lg:hidden">
        <div
          className="relative aspect-[3/4] w-full overflow-hidden rounded-app bg-neutral-300 dark:bg-neutral-700"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={images[safeIndex]}
            alt={`${title} - foto ${safeIndex + 1}`}
            fill
            unoptimized
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        {hasMultiplePhotos && (
          // `justify-between` é o "cálculo" pedido, só que feito pelo próprio
          // motor de layout do navegador em vez de JS/`ResizeObserver` nosso:
          // como não há uma quantidade fixa de fotos por produto, a largura
          // de cada miniatura é fixa (`w-14`) e o espaço que sobra entre elas
          // é sempre recalculado pra preencher a largura inteira do card,
          // qualquer que seja o número de fotos (2, 3, 4...). `gap-2` some
          // como piso mínimo entre elas nesse cálculo - nunca ficam mais
          // próximas que isso, só mais distantes quando sobra espaço.
          // Quando as miniaturas já não cabem (produto com bem mais fotos),
          // não sobra espaço livre pra distribuir - o próprio flexbox então
          // empilha do início pra fora sem inventar espaço extra, e
          // `overflow-x-auto` assume a rolagem horizontal a partir daí. Ou
          // seja, os dois comportamentos pedidos (preencher quando cabe,
          // rolar quando não cabe) saem do mesmo `justify-between`, sem
          // precisar de duas classes/condicionais diferentes.
          <div className="no-scrollbar mt-3 flex justify-between gap-2 overflow-x-auto">
            {images.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                aria-label={`Ver foto ${index + 1} de ${title}`}
                aria-current={index === safeIndex}
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-app border bg-neutral-300 transition-colors dark:bg-neutral-700 ${
                  index === safeIndex
                    ? "border-neutral-950 dark:border-neutral-100"
                    : "border-transparent"
                }`}
              >
                <Image src={src} alt="" fill unoptimized sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop/tablet lg+ - pane própria com scroll independente. */}
      <div className="no-scrollbar hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:overscroll-y-auto lg:pr-1">
        <div className="mx-auto flex max-w-xl flex-col gap-3 md:max-w-2xl">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-[3/4] w-full overflow-hidden rounded-app bg-neutral-300 dark:bg-neutral-700"
            >
              <Image
                src={src}
                alt={`${title} - foto ${index + 1}`}
                fill
                unoptimized
                priority={index === 0}
                sizes="(min-width: 1024px) 42rem, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
