"use client";

// Emblema 3D arrastável da tela de entrada (`EntryGate.tsx`) - a peça mais
// "cinematográfica" do efeito pedido pelo Alfredo, reproduzida com a mesma
// técnica de uma referência de mercado que ele indicou: um "medalhão" em 3D
// que o visitante arrasta com o mouse/dedo pra girar livremente no eixo
// horizontal (com inércia ao soltar) e um pouco no vertical (limitado, pra
// nunca virar de cabeça pra baixo); parado, continua com uma flutuação/
// rotação idle bem sutil.
//
// O centro renderizado é o `InitialLogo.png` que o Alfredo preparou
// (`public/branding/InitialLogo.png` - o emblema completo: anel + wordmark
// "SCATHON" + cabeça de dragão + cauda/chama). Como é um PNG (arte já
// finalizada, não um vetor com paths separados), a técnica muda em relação
// à primeira versão deste componente (que extrudava o `icon.svg` via
// `SVGLoader`): aqui construímos nós mesmos um disco 3D com bisel
// (`ExtrudeGeometry` a partir de um círculo, não de paths do SVG) e colamos
// a arte como textura nas duas faces (frente/verso), com o material
// "chrome" preto só na lateral/bisel - o disco ganha profundidade e bordas
// reais que pegam luz de estúdio, e a arte em si mantém todo o detalhe
// desenhado pelo Alfredo (incluindo a sombra que ele já embutiu no PNG).
//
// `InitialLogo-medallion.png` (ao lado do original, gerado uma vez por um
// script local) é só uma versão da mesma arte recortada e centralizada num
// canvas quadrado - necessário porque o PNG original não é quadrado nem
// perfeitamente centralizado (532x469, com ~8px de folga a mais à direita),
// o que faria o anel do emblema sair oval em vez de circular ao mapear numa
// face redonda. O arquivo original não foi alterado.
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

// Raio do disco e espessura/bisel da extrusão, em unidades de cena - achados
// visualmente pra ocupar um espaço parecido com o da versão anterior
// (dragão isolado) dentro do mesmo enquadramento de câmera (fov 31,
// distância 5), mantendo a mesma proporção espessura/largura de um medalhão
// fino (não um bloco grosso).
const DISC_RADIUS = 1.2;
const EXTRUDE_SETTINGS: THREE.ExtrudeGeometryOptions = {
  depth: 0.16,
  bevelEnabled: true,
  bevelThickness: 0.022,
  bevelSize: 0.02,
  bevelSegments: 6,
  curveSegments: 96,
  steps: 1,
};

const LOGO_TEXTURE_URL = "/branding/InitialLogo-medallion.png";

type CanvasCursor = "grab" | "grabbing";

/* =========================================
   MATERIAL "CHROME" PRETO FOSCO (lateral/bisel)
========================================= */

function ChromeMaterial() {
  return (
    <meshPhysicalMaterial
      // Índice 1 = grupo das paredes laterais/bisel do ExtrudeGeometry (ver
      // comentário acima do <mesh>). Sem o `attach` explícito, dois
      // <meshPhysicalMaterial> filhos do mesmo <mesh> não viram um array de
      // materiais - o segundo simplesmente sobrescreve o primeiro em
      // `mesh.material` (foi exatamente o bug visto no teste: só o chrome
      // aparecia, cobrindo o disco inteiro).
      attach="material-1"
      color="#0a0a0a"
      metalness={1}
      // Um pouco mais fosco que um espelho puro, pra não gerar reflexos
      // duros demais sem um Environment map de verdade na cena.
      roughness={0.22}
      clearcoat={1}
      clearcoatRoughness={0.08}
      reflectivity={1}
      envMapIntensity={1}
      emissive="#000000"
      emissiveIntensity={0}
    />
  );
}

/* =========================================
   MATERIAL DA ARTE (frente/verso do medalhão)
========================================= */

function LogoFaceMaterial() {
  const texture = useLoader(THREE.TextureLoader, LOGO_TEXTURE_URL);

  // Cor precisa ser interpretada como sRGB (padrão pra texturas de cor, não
  // de dado) pra não sair "lavada"/escurecida.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  return (
    <meshPhysicalMaterial
      // Índice 0 = grupo das tampas (frente/verso) do ExtrudeGeometry.
      attach="material-0"
      map={texture}
      transparent
      // Descarta os pixels quase totalmente transparentes (fora do anel,
      // vãos das letras) bem cedo, evitando artefato de ordenação entre a
      // frente e o verso do disco tão fino; o que sobra ainda faz blend
      // normal, preservando a suavidade da borda desenhada no PNG.
      alphaTest={0.08}
      // Fosco o bastante pra arte permanecer legível em vez de virar um
      // espelho que estoura de luz da iluminação de estúdio.
      metalness={0.2}
      roughness={0.55}
      clearcoat={0.3}
      clearcoatRoughness={0.35}
    />
  );
}

/* =========================================
   MEDALHÃO
========================================= */

type EmblemMeshProps = {
  canvas: HTMLCanvasElement | null;
  onCursorChange: (cursor: CanvasCursor) => void;
};

function EmblemMesh({ canvas, onCursorChange }: EmblemMeshProps) {
  const group = useRef<THREE.Group>(null);

  // Pose inicial levemente inclinada - dá a impressão de "objeto real
  // pousado ali", não um ícone 2D forçado em 3D de frente.
  const initialY = 0.42;
  const initialX = -0.16;

  const rotationY = useRef(initialY);
  const targetRotationY = useRef(initialY);

  const rotationX = useRef(initialX);
  const targetRotationX = useRef(initialX);

  // Inércia horizontal ao soltar o arrasto.
  const velocityY = useRef(0);

  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Disco simples (círculo extrudado com bisel) - a arte em si vem da
  // textura em `LogoFaceMaterial`, não da geometria.
  const discGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, DISC_RADIUS, 0, Math.PI * 2, false);

    const geometry = new THREE.ExtrudeGeometry(shape, EXTRUDE_SETTINGS);

    // O gerador de UV padrão do ExtrudeGeometry usa as coordenadas X/Y
    // "cruas" do vértice como U/V nas tampas (não normaliza pra 0-1) - pra
    // um círculo de raio DISC_RADIUS isso dá UVs entre -DISC_RADIUS e
    // +DISC_RADIUS, então a textura só aparecia (bem pequena, cortada no
    // canto) onde essas coordenadas cruas caíam por coincidência dentro da
    // faixa 0-1. Remapeamos aqui só o grupo das tampas (materialIndex 0)
    // pra uma projeção planar 0-1 baseada no raio, igual à de
    // CircleGeometry/CylinderGeometry - assim a arte cobre o disco inteiro,
    // centralizada.
    const capGroup = geometry.groups.find((group) => group.materialIndex === 0);
    const uvAttribute = geometry.getAttribute("uv") as THREE.BufferAttribute;

    if (capGroup) {
      for (let i = capGroup.start; i < capGroup.start + capGroup.count; i++) {
        const rawU = uvAttribute.getX(i);
        const rawV = uvAttribute.getY(i);
        uvAttribute.setXY(
          i,
          (rawU + DISC_RADIUS) / (2 * DISC_RADIUS),
          (rawV + DISC_RADIUS) / (2 * DISC_RADIUS),
        );
      }
      uvAttribute.needsUpdate = true;
    }

    return geometry;
  }, []);

  /* =======================================
     ARRASTAR PRA GIRAR (360°)
  ======================================= */

  useEffect(() => {
    if (!canvas) return;

    const pointerDown = (event: PointerEvent) => {
      dragging.current = true;
      lastPointer.current.x = event.clientX;
      lastPointer.current.y = event.clientY;
      velocityY.current = 0;
      onCursorChange("grabbing");
      canvas.setPointerCapture?.(event.pointerId);
    };

    const pointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;

      const deltaX = event.clientX - lastPointer.current.x;
      const deltaY = event.clientY - lastPointer.current.y;

      // Giro horizontal livre (sem limite - pode dar a volta).
      const horizontalForce = deltaX * 0.012;
      targetRotationY.current += horizontalForce;
      velocityY.current = horizontalForce;

      // Vertical limitado, pra nunca virar de cabeça pra baixo.
      targetRotationX.current = THREE.MathUtils.clamp(
        targetRotationX.current + deltaY * 0.0035,
        -0.34,
        0.34,
      );

      lastPointer.current.x = event.clientX;
      lastPointer.current.y = event.clientY;
    };

    const pointerUp = (event: PointerEvent) => {
      dragging.current = false;
      onCursorChange("grab");
      if (canvas.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("pointerleave", pointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("pointerleave", pointerUp);
    };
  }, [canvas, onCursorChange]);

  /* =======================================
     MOVIMENTO + INÉRCIA + IDLE
  ======================================= */

  useFrame(({ clock }, delta) => {
    if (!group.current) return;

    if (!dragging.current) {
      // Inércia ao soltar.
      targetRotationY.current += velocityY.current;
      velocityY.current = THREE.MathUtils.damp(velocityY.current, 0, 3.2, delta);

      // Flutuação/rotação idle bem sutil quando ninguém está mexendo.
      const idleX = initialX + Math.sin(clock.elapsedTime * 0.65) * 0.025;
      const idleY = initialY + Math.sin(clock.elapsedTime * 0.45) * 0.045;

      targetRotationX.current = THREE.MathUtils.damp(
        targetRotationX.current,
        idleX,
        1.8,
        delta,
      );

      if (Math.abs(velocityY.current) < 0.002) {
        targetRotationY.current = THREE.MathUtils.damp(
          targetRotationY.current,
          idleY,
          0.55,
          delta,
        );
      }
    }

    rotationY.current = THREE.MathUtils.damp(
      rotationY.current,
      targetRotationY.current,
      dragging.current ? 13 : 7,
      delta,
    );

    rotationX.current = THREE.MathUtils.damp(
      rotationX.current,
      targetRotationX.current,
      7,
      delta,
    );

    group.current.rotation.y = rotationY.current;
    group.current.rotation.x = rotationX.current;

    // Flutuação de posição muito sutil, só pra não parecer estático.
    group.current.position.y = Math.sin(clock.elapsedTime * 0.75) * 0.028;
    group.current.position.x = Math.sin(clock.elapsedTime * 0.42) * 0.008;
  });

  return (
    <group ref={group}>
      <mesh geometry={discGeometry}>
        {/* Grupo de material 0 = tampas (frente/verso) do ExtrudeGeometry;
            grupo 1 = paredes laterais + bisel. Ver node_modules/three -
            ExtrudeGeometry monta os grupos nessa ordem. `attach="material-N"`
            em cada material abaixo é o que efetivamente monta o array
            `mesh.material` com as duas entradas (ver comentário dentro de
            `ChromeMaterial`). */}
        <LogoFaceMaterial />
        <ChromeMaterial />
      </mesh>
    </group>
  );
}

/* =========================================
   CENA
========================================= */

function EntryLogo3D() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [cursor, setCursor] = useState<CanvasCursor>("grab");

  return (
    <Canvas
      dpr={[1.25, 2]}
      camera={{ position: [0, 0, 5], fov: 31, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => setCanvas(gl.domElement)}
      style={{ cursor, touchAction: "none" }}
    >
      <Suspense fallback={null}>
        {/* Iluminação de estúdio pensada pro material "chrome" preto: pouca
            luz ambiente (pra preservar o preto), um realce branco amplo e um
            preenchimento mais fraco do lado oposto. Sem Environment map -
            propositalmente, pra não gerar reflexos retangulares artificiais
            de HDRI. */}
        <ambientLight intensity={0.18} color="#ffffff" />
        <hemisphereLight intensity={0.35} color="#d8dce2" groundColor="#000000" />
        <spotLight position={[4.5, 5, 6]} intensity={7} angle={0.9} penumbra={1} color="#ffffff" />
        <spotLight position={[-5, 2, 5]} intensity={3.5} angle={1} penumbra={1} color="#aeb4bc" />
        <spotLight position={[-3, -2, 4]} intensity={8} angle={0.62} penumbra={1} color="#eef2f5" />
        <pointLight position={[2.2, -1.2, -2]} intensity={5.5} color="#ffffff" />

        <EmblemMesh canvas={canvas} onCursorChange={setCursor} />
      </Suspense>
    </Canvas>
  );
}

export default EntryLogo3D;
