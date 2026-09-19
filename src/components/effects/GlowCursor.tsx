"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { OGLRenderingContext, Renderer } from "ogl";

export interface GlowCursorProps {
  /** Color at the bright head of the trail. */
  color?: string;
  /** Color blended into the end of the trail. */
  secondaryColor?: string;
  /** Number of smoothed points used to build the trail, from 2 to 64. */
  trailLength?: number;
  /** Width of the luminous trail core in pixels. */
  trailWidth?: number;
  /** How strongly the trail narrows and dims toward its tail. */
  trailTaper?: number;
  /** How quickly the glowing head catches the pointer. */
  followSpeed?: number;
  /** Strength of the soft inverse-square halo around the trail. */
  glowIntensity?: number;
  /** Distance the outer glow spreads from the trail core. */
  glowSpread?: number;
  /** Amount of white-hot color added to the brightest part of the trail. */
  hotspot?: number;
  /** Final luminance multiplier for the shader. */
  brightness?: number;
  /** Overall trail opacity. */
  opacity?: number;
  /** Speed of the energy pulse travelling through the trail. Set to 0 to stop it. */
  pulseSpeed?: number;
  /** Amount of fine animated texture in the glow. */
  noiseStrength?: number;
  /** Fade the effect when the pointer stops or leaves the container. */
  idleFade?: boolean;
  /** Idle time in milliseconds before fading begins. */
  idleTimeout?: number;
  /** Approximate duration of the idle fade in milliseconds. */
  fadeDuration?: number;
  /** CSS blend mode used to composite the canvas over its content. */
  blendMode?: "normal" | "screen" | "plus-lighter";
  /** Render-resolution cap for balancing sharpness and GPU cost. */
  maxDevicePixelRatio?: number;
  /** Enable or fade out the cursor effect. */
  enabled?: boolean;
  /** Optional content rendered beneath the interactive trail. */
  children?: ReactNode;
  /** Additional classes for the container. */
  className?: string;
  /** Inline styles for the container. */
  style?: CSSProperties;
}

const MAX_POINTS = 64;

const VERTEX_SHADER = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uPoints[${MAX_POINTS}];
  uniform int uPointCount;
  uniform vec3 uColor;
  uniform vec3 uSecondaryColor;
  uniform float uTrailWidth;
  uniform float uTrailTaper;
  uniform float uGlowIntensity;
  uniform float uGlowSpread;
  uniform float uHotspot;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform float uPulseSpeed;
  uniform float uNoiseStrength;
  uniform float uTime;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float distToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 fragCoord = vUv * uResolution;

    float core = 0.0;
    float glow = 0.0;
    vec3 colorAccum = vec3(0.0);
    float weightAccum = 0.0;

    for (int i = 0; i < ${MAX_POINTS}; i++) {
      if (i >= uPointCount - 1) break;

      vec2 a = uPoints[i];
      vec2 b = uPoints[i + 1];

      float t = float(i) / max(float(uPointCount - 1), 1.0);
      float widthFalloff = pow(clamp(1.0 - t, 0.0, 1.0), max(uTrailTaper, 0.0001));
      float segWidth = max(uTrailWidth * widthFalloff, 0.5);

      float d = distToSegment(fragCoord, a, b);

      // A narrow, fixed antialiasing band (not a wide fraction of
      // segWidth) keeps the core edge crisp instead of soft/blurry -
      // "fwidth()"-based derivatives would adapt this to resolution
      // automatically, but that needs the OES_standard_derivatives
      // extension, which isn't guaranteed on every device (software
      // rendering in particular), so a small constant is used instead
      // for something that always compiles. smoothstep's result is
      // only defined for edge0 < edge1, so the "bright at the centre,
      // fading toward segWidth" shape is built as 1.0 minus an
      // increasing step, never a decreasing one.
      float aa = 1.25;
      float coreI = 1.0 - smoothstep(segWidth - aa, segWidth + aa, d);
      float spread = max(segWidth * uGlowSpread, 1.0);
      float glowI = uGlowIntensity / (1.0 + pow(d / spread, 2.0));

      float pulse = 1.0;
      if (uPulseSpeed > 0.0) {
        float travel = fract(t * 3.0 - uTime * uPulseSpeed);
        pulse = 1.0 + 0.6 * smoothstep(0.85, 1.0, travel);
      }

      float strength = (coreI + glowI * 0.6) * widthFalloff * pulse;

      vec3 segColor = mix(uColor, uSecondaryColor, t);
      colorAccum += segColor * strength;
      weightAccum += strength;

      // Blend across overlapping segments instead of taking a hard
      // max(): picking whichever single segment is "closest" leaves
      // a faint seam exactly where two neighbouring segments swap the
      // lead, which reads as a subtly stepped/pixelated trail. A
      // "screen"-style combine for the core, and a plain sum for the
      // glow (a soft halo is meant to pile up where segments overlap,
      // the way real bloom does), both stay smooth across the whole
      // polyline with no per-segment boundary visible.
      core = 1.0 - (1.0 - core) * (1.0 - coreI * widthFalloff);
      glow += glowI * widthFalloff * pulse;
    }

    vec3 finalColor = weightAccum > 0.0001 ? colorAccum / weightAccum : uColor;
    finalColor = mix(finalColor, vec3(1.0), core * uHotspot);
    finalColor *= uBrightness;

    float noise = (hash(fragCoord * 0.75 + uTime) - 0.5) * uNoiseStrength;
    float alpha = clamp(core + glow + noise, 0.0, 1.0) * uOpacity;

    gl_FragColor = vec4(finalColor * alpha, alpha);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const value = parseInt(expanded, 16) || 0;
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

interface GlowCursorConfig {
  color: string;
  secondaryColor: string;
  trailLength: number;
  trailWidth: number;
  trailTaper: number;
  followSpeed: number;
  glowIntensity: number;
  glowSpread: number;
  hotspot: number;
  brightness: number;
  opacity: number;
  pulseSpeed: number;
  noiseStrength: number;
  idleFade: boolean;
  idleTimeout: number;
  fadeDuration: number;
  maxDevicePixelRatio: number;
}

/**
 * Builds the WebGL scene (via `ogl`) and starts its render loop inside
 * `host`. Everything here reads live values off `configRef` each frame,
 * so prop changes never need to tear down and recreate the GL context -
 * only mount/unmount (desktop <-> mobile, enabled <-> disabled) does.
 * Returns a cleanup function that tears the whole thing down.
 */
async function mountGlowCursor(
  host: HTMLDivElement,
  configRef: { current: GlowCursorConfig },
): Promise<() => void> {
  const { Renderer, Program, Mesh, Triangle } = await import("ogl");

  const renderer: Renderer = new Renderer({
    alpha: true,
    antialias: true,
    dpr: Math.min(window.devicePixelRatio || 1, configRef.current.maxDevicePixelRatio),
  });
  const gl: OGLRenderingContext = renderer.gl;
  Object.assign(gl.canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  });
  host.appendChild(gl.canvas);

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: VERTEX_SHADER,
    fragment: FRAGMENT_SHADER,
    transparent: true,
    depthTest: false,
    uniforms: {
      uResolution: { value: [window.innerWidth, window.innerHeight] },
      // A plain Array, not a Float32Array: ogl only recognises a real
      // `Array` as an array-valued uniform (it checks `Array.isArray`
      // internally) - a typed array here gets silently treated as
      // "missing" and every point would stay at (0, 0).
      uPoints: { value: new Array(MAX_POINTS * 2).fill(0) },
      uPointCount: { value: 0 },
      uColor: { value: hexToRgb(configRef.current.color) },
      uSecondaryColor: { value: hexToRgb(configRef.current.secondaryColor) },
      uTrailWidth: { value: configRef.current.trailWidth },
      uTrailTaper: { value: configRef.current.trailTaper },
      uGlowIntensity: { value: configRef.current.glowIntensity },
      uGlowSpread: { value: configRef.current.glowSpread },
      uHotspot: { value: configRef.current.hotspot },
      uBrightness: { value: configRef.current.brightness },
      uOpacity: { value: 0 },
      uPulseSpeed: { value: configRef.current.pulseSpeed },
      uNoiseStrength: { value: configRef.current.noiseStrength },
      uTime: { value: 0 },
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uResolution.value = [window.innerWidth, window.innerHeight];
  }
  resize();
  window.addEventListener("resize", resize);

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let hasMoved = false;
  let lastMoveAt = performance.now();

  function handlePointerMove(event: PointerEvent) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    hasMoved = true;
    lastMoveAt = performance.now();
  }
  window.addEventListener("pointermove", handlePointerMove);

  const points = Array.from({ length: MAX_POINTS }, () => ({ x: pointer.x, y: pointer.y }));
  const flatPoints = program.uniforms.uPoints.value as number[];

  let visibility = 0;
  let lastFrameAt = performance.now();
  let raf = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const cfg = configRef.current;
    const dt = Math.max(now - lastFrameAt, 0);
    lastFrameAt = now;

    const count = Math.max(2, Math.min(MAX_POINTS, Math.round(cfg.trailLength)));

    // Chain-follow: the head eases toward the pointer, and each next
    // point eases toward the previous one - the classic springy,
    // multi-segment "snake" trail.
    points[0].x += (pointer.x - points[0].x) * cfg.followSpeed;
    points[0].y += (pointer.y - points[0].y) * cfg.followSpeed;
    for (let i = 1; i < count; i++) {
      points[i].x += (points[i - 1].x - points[i].x) * cfg.followSpeed;
      points[i].y += (points[i - 1].y - points[i].y) * cfg.followSpeed;
    }

    const canvasHeight = gl.canvas.height / renderer.dpr;
    for (let i = 0; i < count; i++) {
      flatPoints[i * 2] = points[i].x;
      flatPoints[i * 2 + 1] = canvasHeight - points[i].y;
    }

    program.uniforms.uPointCount.value = count;
    program.uniforms.uColor.value = hexToRgb(cfg.color);
    program.uniforms.uSecondaryColor.value = hexToRgb(cfg.secondaryColor);
    program.uniforms.uTrailWidth.value = cfg.trailWidth;
    program.uniforms.uTrailTaper.value = cfg.trailTaper;
    program.uniforms.uGlowIntensity.value = cfg.glowIntensity;
    program.uniforms.uGlowSpread.value = cfg.glowSpread;
    program.uniforms.uHotspot.value = cfg.hotspot;
    program.uniforms.uBrightness.value = cfg.brightness;
    program.uniforms.uPulseSpeed.value = cfg.pulseSpeed;
    program.uniforms.uNoiseStrength.value = cfg.noiseStrength;
    program.uniforms.uTime.value = now * 0.001;

    const idleElapsed = now - lastMoveAt;
    const targetVisible = !hasMoved ? 0 : cfg.idleFade && idleElapsed > cfg.idleTimeout ? 0 : 1;
    const fadeRate = 1 / Math.max(cfg.fadeDuration, 16);
    visibility += (targetVisible - visibility) * Math.min(1, dt * fadeRate);
    program.uniforms.uOpacity.value = visibility * cfg.opacity;

    renderer.render({ scene: mesh });
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", handlePointerMove);
    if (gl.canvas.parentNode === host) host.removeChild(gl.canvas);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

/**
 * Site-wide mouse-follow glow trail, built with `ogl` (WebGL) to match a
 * component briefed from reactbits - the actual source wasn't available,
 * so this reimplements the documented prop surface from scratch: a
 * chain of easing points forms a tapered, glowing polyline behind the
 * pointer, colored head-to-tail between `color` and `secondaryColor`,
 * with an inverse-square halo, an optional travelling pulse, a little
 * animated noise, and an idle fade.
 *
 * Desktop-only by design (a mouse-follow effect has nothing to follow
 * on a touchscreen): it only mounts when the viewport matches
 * `(min-width: 768px) and (pointer: fine)`, checked with the project's
 * existing `useMediaQuery` hook so there's no separate media-query
 * logic to keep in sync, and it renders `children` unconditionally so
 * layout never depends on whether the effect is active. The WebGL
 * module and context are only touched inside `useEffect` (dynamically
 * imported), so nothing runs during SSR or on a phone that will never
 * use it.
 *
 * The canvas itself is a `position: fixed`, `pointer-events: none`
 * overlay above all page content, tracking `window` pointer position -
 * so it works as a global effect wrapping the whole app in one place
 * (e.g. inside `<Providers>`) without needing every page to opt in.
 */
export function GlowCursor({
  color = "#67E8F9",
  secondaryColor = "#A78BFA",
  trailLength = 40,
  trailWidth = 8,
  trailTaper = 0.8,
  followSpeed = 0.16,
  glowIntensity = 1.9,
  glowSpread = 1.2,
  hotspot = 0.65,
  brightness = 1.25,
  opacity = 1,
  pulseSpeed = 1.1,
  noiseStrength = 0.035,
  idleFade = true,
  idleTimeout = 700,
  fadeDuration = 900,
  blendMode = "screen",
  maxDevicePixelRatio = 2,
  enabled = true,
  children,
  className,
  style,
}: GlowCursorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const isDesktopPointer = useMediaQuery("(min-width: 768px) and (pointer: fine)");
  const active = isDesktopPointer && enabled;

  const configRef = useRef<GlowCursorConfig>({
    color,
    secondaryColor,
    trailLength,
    trailWidth,
    trailTaper,
    followSpeed,
    glowIntensity,
    glowSpread,
    hotspot,
    brightness,
    opacity,
    pulseSpeed,
    noiseStrength,
    idleFade,
    idleTimeout,
    fadeDuration,
    maxDevicePixelRatio,
  });
  useEffect(() => {
    configRef.current = {
      color,
      secondaryColor,
      trailLength,
      trailWidth,
      trailTaper,
      followSpeed,
      glowIntensity,
      glowSpread,
      hotspot,
      brightness,
      opacity,
      pulseSpeed,
      noiseStrength,
      idleFade,
      idleTimeout,
      fadeDuration,
      maxDevicePixelRatio,
    };
  });

  useEffect(() => {
    if (!active) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    mountGlowCursor(host, configRef).then((dispose) => {
      if (cancelled) {
        dispose();
        return;
      }
      cleanup = dispose;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [active]);

  return (
    <div className={className} style={style}>
      {active && (
        <div
          ref={hostRef}
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            pointerEvents: "none",
            mixBlendMode: blendMode,
          }}
        />
      )}
      {children}
    </div>
  );
}
