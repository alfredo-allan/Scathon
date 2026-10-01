"use client";

// Portal de entrada cinematográfico da Scathon - pedido pelo Alfredo com uma
// referência de mercado real (site de streetwear com emblema 3D arrastável +
// fundo plasma em WebGL + textos estilo HUD técnico + transição pra loja).
// Reproduz a MESMA técnica da referência (Three.js/React Three Fiber pro
// emblema em 3D, OGL pro fundo "plasma", GSAP pra coreografia de
// entrada/saída) só trocando o emblema pelo medalhão da própria Scathon
// (`public/branding/InitialLogo.png` - anel + wordmark + dragão, preparado
// pelo Alfredo - ver o doc comment de `EntryLogo3D.tsx`) e o texto pela voz
// da marca.
//
// Quando aparece: uma vez por ABA/SESSÃO DO NAVEGADOR - no primeiro acesso
// real ao site, nunca de novo depois disso (nem ao navegar pra um produto,
// nem num F5, nem em qualquer outra remontagem deste componente) até a aba
// ser fechada. Controlado por `sessionStorage` via `useHasSeenEntry` abaixo,
// não só pelo `phase` em memória: depender só do React state parte do
// pressuposto de que este componente, vivendo no ROOT layout (`src/app/
// layout.tsx`), nunca desmonta numa navegação via <Link> (que é verdade em
// teoria - o Next preserva o layout raiz entre páginas) - mas na prática o
// portal estava reaparecendo ao clicar num produto mesmo assim (reportado
// pelo Alfredo), então a garantia real passou a ser essa flag persistida:
// não importa POR QUE este componente remontou, se a aba já viu o portal uma
// vez, ele nunca anima de novo nela. `sessionStorage` (não `localStorage`) de
// propósito: zera ao fechar a aba, então uma visita nova mais tarde ainda
// conta como "primeiro acesso".
//
// O conteúdo real do site (`children`, já com <SiteChrome/> por dentro) fica
// SEMPRE montado no DOM, por baixo do portal (que é `position: fixed`,
// cobrindo a tela inteira) - diferente da referência, que só monta a Hero
// depois do clique em ENTRAR (lazy, por performance, já que a página deles
// carrega muito mais efeito pesado de uma vez). Aqui não precisa desse
// adiamento: a home da Scathon já é leve o bastante pra ficar pronta por
// baixo enquanto o portal anima por cima, e a revelação final é só o véu
// preto (`.entry__transition-cover`) desaparecendo.
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";

import "@fontsource/archivo-black";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import "./Entry.css";

import EntryLogo3D from "./EntryLogo3D";
import Plasma from "./Plasma";

type Phase = "intro" | "exiting" | "done";

// ---------------------------------------------------------------------------
// "Esta aba já viu o portal?" - sessionStorage lido via `useSyncExternalStore`
// ---------------------------------------------------------------------------
//
// Mesmo padrão de `createPersistedStore`/`useHydrated` (ver `src/lib/
// waitlist.ts` e `src/hooks/useHydrated.ts`) usado no resto do projeto pra
// ler algo do navegador sem cair no `react-hooks/set-state-in-effect`: nada
// de "useEffect que chama setState" - o valor vem direto de
// `useSyncExternalStore`, com `getServerSnapshot` sempre `false` (o servidor
// nunca sabe se a aba já viu o portal, então o HTML sempre assume que não) e
// o valor real do navegador chegando assim que o React reconcilia a
// hidratação.
const ENTRY_SESSION_KEY = "scathon:entry-seen";
const entrySeenListeners = new Set<() => void>();

function readHasSeenEntry(): boolean {
  try {
    return window.sessionStorage.getItem(ENTRY_SESSION_KEY) === "1";
  } catch {
    // Aba anônima/navegação privada com storage bloqueado, ou qualquer outro
    // motivo do navegador recusar - trata como "nunca visto". Pior caso
    // possível: o portal reaparece; nunca quebra a navegação em troca.
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribeToEntrySeen(listener: () => void): () => void {
  entrySeenListeners.add(listener);
  return () => entrySeenListeners.delete(listener);
}

function markEntrySeen(): void {
  try {
    window.sessionStorage.setItem(ENTRY_SESSION_KEY, "1");
  } catch {
    // Mesma tolerância do `readHasSeenEntry` - falha silenciosa.
  }
  entrySeenListeners.forEach((listener) => listener());
}

function useHasSeenEntry(): boolean {
  return useSyncExternalStore(subscribeToEntrySeen, readHasSeenEntry, getServerSnapshot);
}

export function EntryGate({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const enteringRef = useRef(false);
  const hasSeenEntry = useHasSeenEntry();

  const [phase, setPhase] = useState<Phase>("intro");

  // Só mostra o overlay quando a fase de saída ainda não terminou E esta aba
  // ainda não viu o portal - essa segunda condição é o que garante que uma
  // remontagem deste componente (navegar pra um produto, F5, ou qualquer
  // outro motivo) nunca reabre o portal depois da primeira vez na sessão.
  const showEntry = !hasSeenEntry && phase !== "done";

  /* =========================================
     CINEMÁTICA DE ENTRADA
  ========================================= */

  useLayoutEffect(() => {
    // Esta aba já viu o portal (seja porque já passou pelo clique em
    // ENTRAR, seja porque isto é uma remontagem no meio da mesma sessão) -
    // nada a animar.
    if (hasSeenEntry) return;
    if (phase !== "intro") return;

    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      // Sem animação: mostra tudo já no estado final, sem esperar timeline.
      return;
    }

    const context = gsap.context(() => {
      gsap.set(
        [".entry__brand", ".entry__meta", ".entry__footer", ".entry__hud"],
        { opacity: 0, y: 8 },
      );
      gsap.set(".entry__dot-field", { opacity: 0, scale: 1.04 });
      gsap.set(".entry__pattern", { opacity: 0 });
      gsap.set(".entry__emblem", {
        opacity: 0,
        scale: 0.72,
        y: 30,
        filter: "blur(10px)",
      });
      gsap.set(".entry__enter", {
        opacity: 0,
        y: 20,
        letterSpacing: "-0.08em",
      });
      gsap.set(".entry__subtitle", { opacity: 0, y: 10 });
      gsap.set(".entry__transition-cover", { opacity: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      timeline.to(".entry__brand", { opacity: 1, y: 0, duration: 0.7 }, 0.18);
      timeline.to(".entry__meta", { opacity: 1, y: 0, duration: 0.7 }, 0.28);
      timeline.to(
        ".entry__dot-field",
        { opacity: 0.95, scale: 1, duration: 1.25, ease: "power2.out" },
        0.32,
      );
      timeline.to(
        ".entry__pattern",
        { opacity: 1, duration: 0.9, ease: "power1.out" },
        0.6,
      );
      timeline.to(
        ".entry__emblem",
        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.15,
          ease: "power4.out",
        },
        0.72,
      );
      timeline.to(
        ".entry__hud",
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: "power2.out" },
        1.18,
      );
      timeline.to(
        ".entry__enter",
        {
          opacity: 1,
          y: 0,
          letterSpacing: "-0.045em",
          duration: 0.75,
          ease: "power3.out",
        },
        1.48,
      );
      timeline.to(
        ".entry__subtitle",
        { opacity: 1, y: 0, duration: 0.65 },
        1.72,
      );
      timeline.to(".entry__footer", { opacity: 1, y: 0, duration: 0.65 }, 1.92);
      timeline.set(
        ".entry__enter",
        { clearProps: "transform,letterSpacing" },
        2.58,
      );
    }, root);

    return () => {
      context.revert();
    };
  }, [phase, hasSeenEntry]);

  /* =========================================
     ENTRAR -> BLACKOUT -> REVELA O SITE
  ========================================= */

  function handleEnter() {
    if (enteringRef.current) return;
    enteringRef.current = true;

    const root = rootRef.current;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || !root) {
      markEntrySeen();
      setPhase("done");
      return;
    }

    setPhase("exiting");

    const context = gsap.context(() => {
      gsap.killTweensOf(".entry__enter");

      const timeline = gsap.timeline({
        defaults: { ease: "power3.inOut" },
      });

      timeline.to(".entry__hud", { opacity: 0, duration: 0.28, stagger: 0.035 }, 0);
      timeline.to(
        [".entry__brand", ".entry__meta", ".entry__footer"],
        { opacity: 0, y: -6, duration: 0.38 },
        0.06,
      );
      timeline.to(
        ".entry__enter",
        {
          opacity: 0,
          y: 18,
          scale: 0.96,
          letterSpacing: "0.05em",
          duration: 0.38,
        },
        0.08,
      );
      timeline.to(".entry__subtitle", { opacity: 0, y: 10, duration: 0.3 }, 0.12);
      timeline.to(".entry__pattern", { opacity: 0, duration: 0.48 }, 0.18);
      timeline.to(
        ".entry__dot-field",
        { opacity: 0.12, scale: 1.08, duration: 0.72, ease: "power2.inOut" },
        0.16,
      );
      timeline.to(
        ".entry__emblem",
        { scale: 1.07, y: -4, duration: 0.42, ease: "power2.out" },
        0.12,
      );
      timeline.to(
        ".entry__emblem",
        {
          scale: 1.2,
          opacity: 0.7,
          filter: "blur(1.5px)",
          duration: 0.58,
          ease: "power3.in",
        },
        0.48,
      );
      timeline.to(
        ".entry__transition-cover",
        { opacity: 1, duration: 0.42, ease: "power2.inOut" },
        0.7,
      );

      // Cover 100% preto encobrindo tudo - o site real por baixo já está
      // pronto, então não precisa esperar nada pra revelar (diferente da
      // referência, que só neste ponto começa a carregar a Hero). Marca a
      // sessão como "já viu o portal" só agora, no fim de verdade.
      timeline.call(() => {
        markEntrySeen();
        setPhase("done");
      }, [], 1.05);

      // Meio segundo depois do corte, o véu preto se dissolve revelando o
      // site já montado - o mesmo "crossfade a partir do preto" da
      // referência, só que sem esperar nenhum carregamento no meio.
      timeline.to(
        ".entry__transition-cover",
        { opacity: 0, duration: 0.58, ease: "power2.inOut" },
        1.15,
      );
    }, root);

    // `gsap.context` revertido só depois da timeline terminar de rodar (não
    // há novo layout effect nesse fluxo pra chamar `context.revert()` antes
    // da hora), então o cleanup roda quando o componente some do DOM.
    window.setTimeout(() => context.revert(), 2200);
  }

  // O wrapper de `children` fica sempre na MESMA posição da árvore (só o
  // `style` muda) em vez de alternar entre "com wrapper" e "sem wrapper" -
  // isso evita que o React desmonte e remonte o site inteiro (perdendo
  // scroll, estado de componentes client, etc.) no instante em que o portal
  // termina; só o overlay do portal é que entra/sai da árvore.
  return (
    <>
      <div style={showEntry ? { visibility: "hidden" } : undefined}>
        {children}
      </div>

      {showEntry && (
        <div ref={rootRef} className="entry" role="dialog" aria-modal="true" aria-label="Entrada Scathon">
        {/* GRÃO */}
        <div className="entry__grain" aria-hidden="true" />

        {/* CAMPO DE PONTOS (fundo plasma) */}
        <div className="entry__dot-field" aria-hidden="true">
          <Plasma
            color="#ffffff"
            speed={0.55}
            direction="forward"
            scale={1.2}
            opacity={0.38}
            mouseInteractive={false}
            renderScale={0.55}
            maxDpr={1.5}
            targetFps={45}
          />
        </div>

        {/* VINHETA CIRCULAR */}
        <div className="entry__corner-fade" aria-hidden="true" />

        {/* MIRA TÉCNICA */}
        <div className="entry__pattern" aria-hidden="true" />

        {/* CABEÇALHO */}
        <header className="entry__header">
          <div className="entry__brand">SCATHON</div>
          <div className="entry__meta entry__meta--right">
            <span>2026</span>
            <span>STREETWEAR</span>
          </div>
        </header>

        {/* CONTEÚDO CENTRAL */}
        <section className="entry__content">
          <div className="entry__hud entry__hud--left" aria-hidden="true">
            <div className="entry__hud-status">
              <span className="entry__hud-dot" />
              <span>SYS / ONLINE</span>
            </div>
            <span>LAT / 23.550S</span>
            <span>LNG / 46.633W</span>
          </div>

          <div className="entry__hud entry__hud--right" aria-hidden="true">
            <span>DROP / 001</span>
            <span>MODE / ENTRY</span>
            <span>SIGNAL / 98%</span>
          </div>

          <div className="entry__emblem entry__emblem--3d" aria-hidden="true">
            <EntryLogo3D />
          </div>

          <button className="entry__enter" type="button" onClick={handleEnter}>
            ENTRAR
          </button>

          <p className="entry__subtitle">ALGUNS COPIAM, OUTROS VESTEM SCATHON</p>
        </section>

        {/* RODAPÉ */}
        <footer className="entry__footer">
          <span>FEITO PARA O MOVIMENTO</span>
          <div className="entry__footer-center">
            <span className="entry__status-dot" />
            <span>SC / 001</span>
          </div>
          <span>SP / BRASIL</span>
        </footer>

        {/* VÉU PRETO DA TRANSIÇÃO */}
        <div className="entry__transition-cover" aria-hidden="true" />
        </div>
      )}
    </>
  );
}
