"use client";

/**
 * GooseBagDisplay — one mini Canvas per slot, model always centered at [0,0,0].
 * No tricky spacing math; each thumbnail is perfectly framed.
 */

import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";

const MODEL_FILES = [
  "ice-cream.glb",
  "coockie-man.glb",
  "cheese.glb",
  "hotdog.glb",
  "sandwich.glb",
  "sandwich-toast.glb",
  "pancake-big.glb",
  "toast.glb",
] as const;

MODEL_FILES.forEach((f) => useGLTF.preload(`/models/goose-grab/${f}`));

// ── Single centered model ────────────────────────────────────────────────────
function ThumbModel({ typeIdx }: { typeIdx: number }) {
  const url = `/models/goose-grab/${MODEL_FILES[typeIdx % MODEL_FILES.length]}`;
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  // All at origin — camera is fixed above/front, so it's always centered
  return <primitive object={cloned} position={[0, 0, 0]} scale={0.55} />;
}

// ── Shared lights (inside each Canvas) ──────────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={1.8} color="#fef3c7" />
      <directionalLight position={[2, 5, 4]} intensity={1.3} />
      <directionalLight position={[-2, 3, -2]} intensity={0.4} color="#cbd5e1" />
    </>
  );
}

// ── One slot cell ─────────────────────────────────────────────────────────────
function SlotCell({ typeIdx }: { typeIdx: number | undefined }) {
  const filled = typeIdx !== undefined;
  return (
    <div
      className={`w-16 h-16 rounded-lg border overflow-hidden transition-all flex-shrink-0 ${
        filled
          ? "border-orange-600/60 bg-gray-900/90"
          : "border-gray-700/40 bg-gray-800/30"
      }`}
    >
      {filled ? (
        <Canvas
          camera={{ position: [0, 1.2, 3.2], fov: 38 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.5]}
          style={{ background: "transparent" }}
        >
          <Lights />
          <Suspense fallback={null}>
            <ThumbModel typeIdx={typeIdx} />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export default function GooseBagDisplay({
  types,
  capacity,
}: {
  types: number[];
  capacity: number;
}) {
  return (
    <div className="rounded-xl bg-gray-900/80 border border-orange-900/40 p-2">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {Array.from({ length: capacity }, (_, i) => (
          <SlotCell key={i} typeIdx={types[i]} />
        ))}
      </div>
    </div>
  );
}
