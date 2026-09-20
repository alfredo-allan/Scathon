"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
// GlowCursor (mouse-follow WebGL trail) disabled per request - not deleted,
// just switched off. To bring it back, uncomment this import and the
// <GlowCursor> wrapper below. Component source is untouched at
// src/components/effects/GlowCursor.tsx.
// import { GlowCursor } from "@/components/effects/GlowCursor";

/**
 * Single entry point that composes every global context provider. Keeping
 * this in one place means adding a new context later only touches this
 * file instead of layout.tsx.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            {/*
              <GlowCursor
                color="#67E8F9"
                secondaryColor="#A78BFA"
                trailLength={40}
                trailWidth={8}
                trailTaper={0.8}
                followSpeed={0.16}
                glowIntensity={1.9}
                glowSpread={1.2}
                hotspot={0.65}
                brightness={1.25}
                opacity={1}
                pulseSpeed={1.1}
                noiseStrength={0.035}
                idleFade
                idleTimeout={700}
                fadeDuration={900}
                blendMode="screen"
              >
                {children}
              </GlowCursor>
            */}
            {children}
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
