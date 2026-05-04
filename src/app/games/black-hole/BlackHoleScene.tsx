"use client";

import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";
import {
  loadManifest,
  emptyManifest,
  pickTier,
  sampleItemForTier,
  getModelFormat,
  type ModelManifest,
  type SampledItem,
  type ShapeKind as PoolShapeKind,
} from "@/lib/black-hole-models";

// ─── 类型 ────────────────────────────────────────────────────────────────────

// fallback 时使用的几何体种类（与 black-hole-models 同步）
type ShapeKind = PoolShapeKind;

interface Building {
  id: number;
  x: number;
  z: number;
  // 把整个 SampledItem 数据带进来，渲染时决定走 GLB 还是 fallback
  item: SampledItem;
  consumed: boolean;
  consumedAt: number;
}

interface SceneProps {
  initialMass: number;
  durationSec: number;
  spawnRate: number;
  buildingCount: number;
  massDistribution: [number, number, number, number];
  onMassUpdate: (mass: number) => void;
  onTimeUpdate: (timeLeft: number) => void;
  onGameEnd: (finalMass: number) => void;
}

const WORLD_SIZE = 80;

function makeBuilding(
  id: number,
  distribution: [number, number, number, number],
  manifest: ModelManifest,
  avoidPos?: { x: number; z: number; r: number }
): Building {
  const tier = pickTier(distribution);
  const item = sampleItemForTier(tier, manifest);

  let x: number, z: number;
  let attempts = 0;
  do {
    x = (Math.random() - 0.5) * WORLD_SIZE;
    z = (Math.random() - 0.5) * WORLD_SIZE;
    attempts++;
  } while (
    attempts < 8 &&
    avoidPos &&
    Math.hypot(x - avoidPos.x, z - avoidPos.z) < avoidPos.r + 1.5
  );
  return {
    id,
    x,
    z,
    item,
    consumed: false,
    consumedAt: 0,
  };
}

// ─── 各种形状组件 ────────────────────────────────────────────────────────────

function ShapeBush() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
    </group>
  );
}

function ShapeTree() {
  return (
    <group>
      {/* 树干 */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.8, 8]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.95} />
      </mesh>
      {/* 树冠：两层圆锥 */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <coneGeometry args={[0.55, 0.9, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.4, 0.7, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.85} />
      </mesh>
    </group>
  );
}

function ShapeFireHydrant() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.2, 0.55, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* 侧出水口 */}
      <mesh position={[0.22, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 8]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
    </group>
  );
}

function ShapeCar() {
  return (
    <group>
      {/* 车身 */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.5, 0.4, 0.7]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* 车顶 */}
      <mesh position={[-0.05, 0.55, 0]} castShadow>
        <boxGeometry args={[0.85, 0.32, 0.65]} />
        <meshStandardMaterial color="#991b1b" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* 4 个轮子 */}
      {[
        [-0.55, 0, -0.3],
        [-0.55, 0, 0.3],
        [0.5, 0, -0.3],
        [0.5, 0, 0.3],
      ].map((p, i) => (
        <mesh
          key={i}
          position={p as [number, number, number]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.13, 0.13, 0.1, 12]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
      ))}
      {/* 挡风玻璃（深色玻璃感） */}
      <mesh position={[0.2, 0.55, 0]} castShadow>
        <boxGeometry args={[0.05, 0.28, 0.62]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.5} />
      </mesh>
    </group>
  );
}

function ShapePhoneBox() {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 1.4, 0.5]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      {/* 玻璃窗格（深色） */}
      <mesh position={[0, 0.85, 0.26]} castShadow>
        <boxGeometry args={[0.4, 0.8, 0.02]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.5} />
      </mesh>
      {/* 顶部 */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[0.6, 0.12, 0.6]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
    </group>
  );
}

function ShapeHouse() {
  return (
    <group>
      {/* 主体 */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.4, 1.2, 1.4]} />
        <meshStandardMaterial color="#fde68a" roughness={0.85} />
      </mesh>
      {/* 屋顶（金字塔=4 边圆锥） */}
      <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.05, 0.7, 4]} />
        <meshStandardMaterial color="#9a3412" roughness={0.85} />
      </mesh>
      {/* 门 */}
      <mesh position={[0, 0.4, 0.71]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.04]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {/* 窗户两个 */}
      <mesh position={[-0.4, 0.75, 0.71]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.04]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.4, 0.75, 0.71]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.04]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function ShapeShop() {
  return (
    <group>
      {/* 主体 */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.8, 1.4, 1.2]} />
        <meshStandardMaterial color="#fdba74" roughness={0.8} />
      </mesh>
      {/* 招牌带 */}
      <mesh position={[0, 1.5, 0.61]} castShadow>
        <boxGeometry args={[1.7, 0.3, 0.05]} />
        <meshStandardMaterial color="#7c2d12" />
      </mesh>
      {/* 大窗户（玻璃感） */}
      <mesh position={[0, 0.7, 0.61]} castShadow>
        <boxGeometry args={[1.5, 0.85, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.6} emissive="#fcd34d" emissiveIntensity={0.15} />
      </mesh>
      {/* 平顶 */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <boxGeometry args={[1.85, 0.05, 1.25]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
    </group>
  );
}

function ShapeSkyscraper() {
  // 大楼用 3 段叠起的 box + 顶端避雷针
  return (
    <group>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[1.0, 3.2, 1.0]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.5}
          metalness={0.4}
          emissive="#fcd34d"
          emissiveIntensity={0.18}
        />
      </mesh>
      {/* 4 面"窗格"：用四个薄板贴上去，每个有 emissive 模拟楼内灯光 */}
      {[
        [0.51, 0],
        [-0.51, 0],
        [0, 0.51],
        [0, -0.51],
      ].map(([dx, dz], i) => (
        <mesh
          key={i}
          position={[dx, 1.6, dz]}
          rotation={[0, Math.atan2(dx, dz), 0]}
          castShadow
        >
          <planeGeometry args={[0.85, 2.8]} />
          <meshStandardMaterial
            transparent
            opacity={0.0}
            emissive="#fcd34d"
            emissiveIntensity={0.7}
            // 制造垂直分布的光带
            color="#0f172a"
          />
        </mesh>
      ))}
      {/* 楼顶 */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[0.9, 0.2, 0.9]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* 避雷针 */}
      <mesh position={[0, 3.65, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} />
      </mesh>
    </group>
  );
}

function ShapeTower() {
  // 塔：底部宽，往上变细的多段
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.85, 1.2, 8]} />
        <meshStandardMaterial color="#52525b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.7, 1.4, 8]} />
        <meshStandardMaterial color="#71717a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.45, 1.2, 8]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.7} />
      </mesh>
      {/* 顶端球 */}
      <mesh position={[0, 3.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>
      {/* 顶端尖刺 */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <coneGeometry args={[0.05, 0.4, 6]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
    </group>
  );
}

function ShapeByKind({ kind }: { kind: ShapeKind }) {
  switch (kind) {
    case "bush": return <ShapeBush />;
    case "tree": return <ShapeTree />;
    case "fireHydrant": return <ShapeFireHydrant />;
    case "car": return <ShapeCar />;
    case "phoneBox": return <ShapePhoneBox />;
    case "house": return <ShapeHouse />;
    case "shop": return <ShapeShop />;
    case "skyscraper": return <ShapeSkyscraper />;
    case "tower": return <ShapeTower />;
  }
}

// ─── GLB 模型渲染 ────────────────────────────────────────────────────────────
//
// 加载用户在 public/models/black-hole/ 下放的 GLB，运行时 clone scene
// 并应用色调微偏移（让同模型每次出现都不雷同）。
function GLBModel({
  url,
  hueShift,
  flipX,
  yOffset,
}: {
  url: string;
  hueShift: number;
  flipX: boolean;
  yOffset: number;
}) {
  const { scene } = useGLTF(`/models/black-hole/${url}`);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const original = obj.material as THREE.MeshStandardMaterial;
        const mat = original.clone();
        if (hueShift !== 0 && mat.color) {
          const hsl = { h: 0, s: 0, l: 0 };
          mat.color.getHSL(hsl);
          mat.color.setHSL((hsl.h + hueShift + 1) % 1, hsl.s, hsl.l);
        }
        obj.material = mat;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [cloned, hueShift]);

  return (
    <primitive
      object={cloned}
      position={[0, yOffset, 0]}
      scale={[flipX ? -1 : 1, 1, 1]}
    />
  );
}

// ─── STL 模型渲染 ────────────────────────────────────────────────────────────
//
// STL 文件只有几何，没有材质/颜色 → 必须在 manifest 里给 defaultColor。
// 然后我们在这里包一层 MeshStandardMaterial，再叠 hueShift 变化。
function STLModel({
  url,
  defaultColor,
  hueShift,
  flipX,
  yOffset,
}: {
  url: string;
  defaultColor: string;
  hueShift: number;
  flipX: boolean;
  yOffset: number;
}) {
  const geometry = useLoader(
    STLLoader,
    `/models/black-hole/${url}`
  ) as THREE.BufferGeometry;

  // 应用色调偏移
  const finalColor = useMemo(() => {
    const c = new THREE.Color(defaultColor);
    if (hueShift !== 0) {
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      c.setHSL((hsl.h + hueShift + 1) % 1, hsl.s, hsl.l);
    }
    return c;
  }, [defaultColor, hueShift]);

  // STL 文件常常需要重新计算法线（很多生成器没烘）
  useEffect(() => {
    if (geometry && !geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }
  }, [geometry]);

  return (
    <mesh
      geometry={geometry}
      position={[0, yOffset, 0]}
      scale={[flipX ? -1 : 1, 1, 1]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={finalColor}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}

// ─── 主场景 ──────────────────────────────────────────────────────────────────

function GameScene({
  initialMass,
  durationSec,
  buildingCount,
  massDistribution,
  onMassUpdate,
  onTimeUpdate,
  onGameEnd,
}: SceneProps) {
  const { camera, mouse, raycaster } = useThree();

  const massRef = useRef(initialMass);
  const holePosRef = useRef(new THREE.Vector3(0, 0.01, 0));
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const buildingsRef = useRef<Building[]>([]);
  const nextIdRef = useRef(0);
  const startTimeRef = useRef(performance.now());
  const lastMassReportRef = useRef(0);
  const lastTimeReportRef = useRef(0);
  const endedRef = useRef(false);

  const slotGroupRefs = useRef<Map<number, THREE.Group>>(new Map());
  const groundPlaneRef = useRef<THREE.Mesh>(null);
  const holeMeshRef = useRef<THREE.Mesh>(null);
  const holeRingRef = useRef<THREE.Mesh>(null);
  const holeOuterRingRef = useRef<THREE.Mesh>(null);

  // 模型 manifest（运行时 fetch；成功后用 ref 存，触发 buildings 初始化）
  const manifestRef = useRef<ModelManifest>(emptyManifest());

  useEffect(() => {
    let alive = true;
    loadManifest().then((m) => {
      if (!alive) return;
      manifestRef.current = m;
      // 用最终 manifest 重建 buildings
      const arr: Building[] = [];
      for (let i = 0; i < buildingCount; i++) {
        arr.push(
          makeBuilding(nextIdRef.current++, massDistribution, m, {
            x: 0,
            z: 0,
            r: 4,
          })
        );
      }
      buildingsRef.current = arr;
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    const timeLeft = Math.max(0, durationSec - elapsed);

    if (now - lastTimeReportRef.current > 100) {
      onTimeUpdate(timeLeft);
      lastTimeReportRef.current = now;
    }

    if (timeLeft <= 0 && !endedRef.current) {
      endedRef.current = true;
      onGameEnd(Math.round(massRef.current));
      return;
    }

    // 鼠标 → 世界坐标
    if (groundPlaneRef.current) {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(groundPlaneRef.current);
      if (hits.length > 0) {
        targetPosRef.current.copy(hits[0].point);
      }
    }

    holePosRef.current.x +=
      (targetPosRef.current.x - holePosRef.current.x) * 0.18;
    holePosRef.current.z +=
      (targetPosRef.current.z - holePosRef.current.z) * 0.18;
    holePosRef.current.x = Math.max(
      -WORLD_SIZE / 2,
      Math.min(WORLD_SIZE / 2, holePosRef.current.x)
    );
    holePosRef.current.z = Math.max(
      -WORLD_SIZE / 2,
      Math.min(WORLD_SIZE / 2, holePosRef.current.z)
    );

    const holeRadius = Math.sqrt(massRef.current) * 0.42;

    // 黑洞渲染
    if (holeMeshRef.current) {
      holeMeshRef.current.position.set(
        holePosRef.current.x,
        0.02,
        holePosRef.current.z
      );
      holeMeshRef.current.scale.set(holeRadius, 1, holeRadius);
    }
    // 时间为基准的旋转角度，确保 X 轴永远是 -π/2（环平躺地面）
    const tNow = now / 1000;
    if (holeRingRef.current) {
      holeRingRef.current.position.set(
        holePosRef.current.x,
        0.04,
        holePosRef.current.z
      );
      holeRingRef.current.scale.set(holeRadius, 1, holeRadius);
      // 显式设置完整 Euler，防止累加导致的旋转跑偏
      holeRingRef.current.rotation.set(-Math.PI / 2, 0, tNow * 0.5);
    }
    if (holeOuterRingRef.current) {
      holeOuterRingRef.current.position.set(
        holePosRef.current.x,
        0.05,
        holePosRef.current.z
      );
      holeOuterRingRef.current.scale.set(holeRadius * 1.4, 1, holeRadius * 1.4);
      holeOuterRingRef.current.rotation.set(-Math.PI / 2, 0, -tNow * 0.3);
    }

    // 摄像机跟随
    const camDist = 16 + holeRadius * 0.55;
    camera.position.set(
      holePosRef.current.x,
      camDist * 0.85,
      holePosRef.current.z + camDist * 0.45
    );
    camera.lookAt(holePosRef.current.x, 0, holePosRef.current.z);

    // 建筑碰撞 + 吞噬动画
    for (const b of buildingsRef.current) {
      const group = slotGroupRefs.current.get(b.id);
      if (!group) continue;

      if (b.consumed) {
        const t = Math.min(1, (now - b.consumedAt) / 700);
        const dx = holePosRef.current.x - b.x;
        const dz = holePosRef.current.z - b.z;
        // 向黑洞移动
        group.position.x = b.x + dx * t * 0.85;
        group.position.z = b.z + dz * t * 0.85;
        // 沉降
        group.position.y = -t * 3.5;
        // 旋转倒下
        group.rotation.x = t * Math.PI * 0.6 * Math.sign(dz || 1);
        group.rotation.z = t * Math.PI * 0.6 * Math.sign(-dx || 1);
        // 缩小
        const s = b.item.scale * (1 - t * 0.85);
        group.scale.set(s, s, s);
        group.visible = t < 1;

        if (t >= 1) {
          group.visible = false;
          // 替换为新 building（远离黑洞）
          const replacement = makeBuilding(
            nextIdRef.current++,
            massDistribution,
            manifestRef.current,
            {
              x: holePosRef.current.x,
              z: holePosRef.current.z,
              r: holeRadius + 6,
            }
          );
          const idx = buildingsRef.current.findIndex((bb) => bb.id === b.id);
          if (idx >= 0) {
            slotGroupRefs.current.delete(b.id);
            buildingsRef.current[idx] = replacement;
          }
        }
        continue;
      }

      const dx = b.x - holePosRef.current.x;
      const dz = b.z - holePosRef.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist < holeRadius && b.item.mass <= massRef.current * 1.05) {
        b.consumed = true;
        b.consumedAt = now;
        massRef.current += b.item.mass * 0.5;
      }
    }

    if (now - lastMassReportRef.current > 100) {
      onMassUpdate(Math.round(massRef.current));
      lastMassReportRef.current = now;
    }
  });

  const slots = useMemo(
    () => Array.from({ length: buildingCount }).map((_, i) => i),
    [buildingCount]
  );

  return (
    <>
      {/* 灯光：白天暖色 + 蓝紫氛围光 */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[15, 22, 12]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        color="#fef3c7"
      />
      <pointLight position={[-20, 10, -15]} intensity={0.4} color="#a78bfa" />
      <hemisphereLight args={["#bae6fd", "#0f172a", 0.35]} />

      {/* 地面 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#334155" roughness={0.95} />
      </mesh>
      {/* 街道网格 */}
      <gridHelper
        args={[WORLD_SIZE, 20, "#fbbf24", "#1e293b"]}
        position={[0, 0.005, 0]}
      />

      {/* picking plane */}
      <mesh
        ref={groundPlaneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[WORLD_SIZE * 1.5, WORLD_SIZE * 1.5]} />
        <meshBasicMaterial />
      </mesh>

      {/* 楼们 */}
      {slots.map((slotIdx) => (
        <BuildingSlot
          key={slotIdx}
          slotIdx={slotIdx}
          buildingsRef={buildingsRef}
          slotGroupRefs={slotGroupRefs}
        />
      ))}

      {/* 黑洞主体（黑色圆盘） */}
      <mesh
        ref={holeMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {/* 内圈光环：完整 360° 圆环，紫色发光 */}
      <mesh
        ref={holeRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
      >
        <ringGeometry args={[0.92, 1.0, 64]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 外圈光环：完整 360° 更细更暗的青色环 */}
      <mesh
        ref={holeOuterRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[0.98, 1.02, 64]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

// 单个建筑 slot
function BuildingSlot({
  slotIdx,
  buildingsRef,
  slotGroupRefs,
}: {
  slotIdx: number;
  buildingsRef: React.MutableRefObject<Building[]>;
  slotGroupRefs: React.MutableRefObject<Map<number, THREE.Group>>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lastIdRef = useRef<number>(-1);
  // 渲染状态：item 描述当前 slot 应该是哪个 GLB 或 fallback shape
  const [currentItem, setCurrentItem] = useState<SampledItem | null>(null);

  useFrame(() => {
    const b = buildingsRef.current[slotIdx];
    if (!b || !groupRef.current) return;

    if (b.id !== lastIdRef.current) {
      lastIdRef.current = b.id;
      groupRef.current.position.set(b.x, 0, b.z);
      groupRef.current.rotation.set(0, b.item.rotation, 0);
      groupRef.current.scale.set(b.item.scale, b.item.scale, b.item.scale);
      groupRef.current.visible = true;
      slotGroupRefs.current.set(b.id, groupRef.current);
      // item 变了 → 触发 re-render 换形状/模型
      // 比较 model.file 和 fallbackKind 来判定是否真的变了
      const same =
        currentItem &&
        currentItem.model?.file === b.item.model?.file &&
        currentItem.fallbackKind === b.item.fallbackKind;
      if (!same) {
        setCurrentItem(b.item);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {currentItem && (
        currentItem.model
          ? <ModelByFormat item={currentItem} />
          : <ShapeByKind kind={currentItem.fallbackKind} />
      )}
    </group>
  );
}

// 根据文件扩展名分发到 GLBModel / STLModel
function ModelByFormat({ item }: { item: SampledItem }) {
  if (!item.model) return null;
  const fmt = getModelFormat(item.model.file);
  if (fmt === "glb" || fmt === "gltf") {
    return (
      <GLBModel
        url={item.model.file}
        hueShift={item.hueShift}
        flipX={item.flipX}
        yOffset={item.yOffset}
      />
    );
  }
  if (fmt === "stl") {
    return (
      <STLModel
        url={item.model.file}
        defaultColor={item.model.defaultColor ?? "#cbd5e1"}
        hueShift={item.hueShift}
        flipX={item.flipX}
        yOffset={item.yOffset}
      />
    );
  }
  return null;
}

// ─── 顶层导出 ────────────────────────────────────────────────────────────────

export default function BlackHoleScene(props: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 18, 14], fov: 50 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ background: "linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)" }}
    >
      <fog attach="fog" args={["#1e293b", 30, 70]} />
      <GameScene {...props} />
    </Canvas>
  );
}
