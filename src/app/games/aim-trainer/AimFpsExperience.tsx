"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, PointerLockControls, PerspectiveCamera } from "@react-three/drei";
import { PistolViewModel } from "./PistolViewModel";

const ROOM_CENTER = new THREE.Vector3(0, 2.15, -5.5);

function Room({ grid }: { grid: THREE.GridHelper }) {
  return (
    <>
      <mesh position={ROOM_CENTER.toArray()} receiveShadow>
        <boxGeometry args={[22, 5.4, 28]} />
        <meshStandardMaterial
          color="#eef2f7"
          side={THREE.BackSide}
          roughness={0.82}
          metalness={0.04}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.92} metalness={0.04} />
      </mesh>
      <primitive object={grid} position={[0, 0.02, 0]} />
    </>
  );
}

const TargetSphere = forwardRef<
  THREE.Mesh,
  {
    radius: number;
    lifeProgress: number;
    hasLifeLimit: boolean;
  }
>(function TargetSphere({ radius, lifeProgress, hasLifeLimit }, ref) {
  const meshRef = useRef<THREE.Mesh | null>(null);

  const assignRef = useCallback(
    (node: THREE.Mesh | null) => {
      meshRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref)
        (ref as React.MutableRefObject<THREE.Mesh | null>).current = node;
    },
    [ref]
  );

  useFrame((_, delta) => {
    const m = meshRef.current;
    if (!m) return;
    m.rotation.y += delta * 1.15;
    const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.045;
    m.scale.setScalar(radius * pulse);
  });

  return (
    <group>
      <mesh ref={assignRef} castShadow userData={{ isTarget: true }}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshStandardMaterial
          color="#5eead4"
          emissive="#06b6d4"
          emissiveIntensity={0.95}
          metalness={0.35}
          roughness={0.28}
        />
      </mesh>
      {hasLifeLimit && (
        <mesh
          scale={radius * 1.1}
          ref={(node) => {
            if (node) node.raycast = () => {};
          }}
        >
          <sphereGeometry args={[1, 28, 28]} />
          <meshBasicMaterial
            color="#e0f2fe"
            transparent
            opacity={0.18 * lifeProgress + 0.04}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
});

TargetSphere.displayName = "TargetSphere";

/** FBX pistol + arms：源在 `src/app/resources/pistol`，`predev`/`prebuild` 同步到 `public/resources/pistol`。 */
function ViewModel({ recoilRef }: { recoilRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const r = recoilRef.current;
    recoilRef.current = Math.max(0, r - delta * 5.5);
    g.rotation.x = 0.04 + r * 0.35;
    g.position.y = -0.26 - r * 0.04;
    g.position.z = -0.5 - r * 0.06;
  });

  // 略收 Yaw，避免整枪相对屏幕中轴偏转过大
  // 略偏下、略靠近身体，便于看到前臂/手；可按习惯微调
  return (
    <group ref={group} position={[0.2, -0.34, -0.46]} rotation={[0.04, 0, 0]}>
      <PistolViewModel recoilRef={recoilRef} />
    </group>
  );
}

/** R3F Canvas puts `id` on the outer wrapper div; pointer lock targets that div, not `<canvas>`. */
function pointerLockIsOnCanvasRoot(canvasId: string): boolean {
  const pe = document.pointerLockElement;
  if (!pe) return false;
  const root = document.getElementById(canvasId);
  if (!root) return false;
  return pe === root || root.contains(pe);
}

function ShootRaycaster({
  active,
  canShoot,
  canvasId,
  targetMeshRef,
  onHit,
  onMiss,
  recoilRef,
}: {
  active: boolean;
  canShoot: boolean;
  canvasId: string;
  targetMeshRef: React.MutableRefObject<THREE.Mesh | null>;
  onHit: () => void;
  onMiss: () => void;
  recoilRef: React.MutableRefObject<number>;
}) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!active || !canShoot || e.button !== 0) return;
      if (!pointerLockIsOnCanvasRoot(canvasId)) return;
      recoilRef.current = 1;
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const target = targetMeshRef.current;
      const list = target && target.visible ? [target] : [];
      const hits = raycaster.intersectObjects(list, true);
      const hitTarget = hits.some((h) => {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if (o.userData?.isTarget) return true;
          o = o.parent;
        }
        return false;
      });
      if (hitTarget) onHit();
      else onMiss();
    };
    // Capture: clicks go to the pointer-lock target (wrapper div), not always the <canvas>
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [
    active,
    camera,
    canvasId,
    canShoot,
    gl.domElement,
    onHit,
    onMiss,
    raycaster,
    recoilRef,
    targetMeshRef,
  ]);
  return null;
}

function Scene({
  active,
  pointerLocked,
  canvasId,
  sphereRadius,
  targetPosition,
  targetLifeProgress,
  hasLifeLimit,
  targetId,
  onHit,
  onMiss,
  grid,
}: {
  active: boolean;
  pointerLocked: boolean;
  canvasId: string;
  sphereRadius: number;
  targetPosition: THREE.Vector3;
  targetLifeProgress: number;
  hasLifeLimit: boolean;
  targetId: number;
  onHit: () => void;
  onMiss: () => void;
  grid: THREE.GridHelper;
}) {
  const targetMeshRef = useRef<THREE.Mesh | null>(null);
  const recoilRef = useRef(0);
  const canShoot = pointerLocked;

  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#f1f5f9", 28, 95]} />

      <hemisphereLight
        color="#ffffff"
        groundColor="#94a3b8"
        intensity={0.95}
      />
      <ambientLight intensity={0.62} />
      <directionalLight
        castShadow
        position={[8, 20, 14]}
        intensity={2.85}
        color="#fffef8"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <directionalLight position={[-12, 10, -8]} intensity={1.05} color="#e2e8f0" />
      <pointLight position={[0, 3.4, 2]} intensity={1.35} color="#ffffff" distance={32} decay={2} />
      <pointLight position={[-4, 2.2, -8]} intensity={0.72} color="#f8fafc" distance={26} decay={2} />

      <Environment preset="studio" />

      <Room grid={grid} />

      <PerspectiveCamera makeDefault position={[0, 1.62, 2.25]} fov={72} near={0.06} far={120}>
        <ViewModel recoilRef={recoilRef} />
      </PerspectiveCamera>

      <PointerLockControls />

      {active && (
        <group key={targetId} position={targetPosition}>
          <TargetSphere
            ref={targetMeshRef}
            radius={sphereRadius}
            lifeProgress={targetLifeProgress}
            hasLifeLimit={hasLifeLimit}
          />
        </group>
      )}

      <ShootRaycaster
        active={active}
        canShoot={canShoot}
        canvasId={canvasId}
        targetMeshRef={targetMeshRef}
        onHit={onHit}
        onMiss={onMiss}
        recoilRef={recoilRef}
      />
    </>
  );
}

export type AimFpsExperienceProps = {
  active: boolean;
  pointerLocked: boolean;
  onPointerLockChange: (locked: boolean) => void;
  canvasId: string;
  sphereRadius: number;
  targetId: number;
  targetPosition: [number, number, number];
  targetLifeProgress: number;
  hasLifeLimit: boolean;
  onHit: () => void;
  onMiss: () => void;
};

export function AimFpsExperience({
  active,
  pointerLocked,
  onPointerLockChange,
  canvasId,
  sphereRadius,
  targetId,
  targetPosition,
  targetLifeProgress,
  hasLifeLimit,
  onHit,
  onMiss,
}: AimFpsExperienceProps) {
  const pos = useMemo(
    () => new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2]),
    [targetPosition[0], targetPosition[1], targetPosition[2]]
  );

  const grid = useMemo(
    () => new THREE.GridHelper(26, 26, "#78716c", "#d6d3d1"),
    []
  );

  useEffect(() => {
    const onChange = () => {
      onPointerLockChange(pointerLockIsOnCanvasRoot(canvasId));
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, [canvasId, onPointerLockChange]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <Canvas
        id={canvasId}
        shadows
        resize={{ debounce: 0, scroll: false }}
        className="block h-full w-full touch-none bg-white"
        style={{ display: "block", width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.12;
        }}
      >
        <Suspense fallback={null}>
          <Scene
            active={active}
            pointerLocked={pointerLocked}
            canvasId={canvasId}
            sphereRadius={sphereRadius}
            targetPosition={pos}
            targetLifeProgress={targetLifeProgress}
            hasLifeLimit={hasLifeLimit}
            targetId={targetId}
            onHit={onHit}
            onMiss={onMiss}
            grid={grid}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default AimFpsExperience;
