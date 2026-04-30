"use client";

// 3D 抓大鹅场景 —— 基于 goose-catch 开源 sample 改写：
// - R3F + Rapier 物理引擎让食物模型自然堆叠
// - 8 种 GLB 食物模型（来自 Sketchfab 免费 Low Poly Food Pack）
// - 点击 → GSAP 弹到底部卡槽 → 3 同自动消除

import { Canvas } from "@react-three/fiber";
import { Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import gsap from "gsap";

// ─── 模型 URL（运行时从 public/models/goose-grab/ 加载） ────────────────────

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

// 预加载（drei 会在客户端缓存）
MODEL_FILES.forEach((f) => useGLTF.preload(`/models/goose-grab/${f}`));

// ─── 类型 ────────────────────────────────────────────────────────────────────

interface BagSlotItem {
  id: number;
  type: number;
  meshRef: React.RefObject<THREE.Object3D | null>;
}

interface SceneProps {
  totalItems: number;
  bagCapacity: number;
  onWin: () => void;
  onLose: () => void;
  onItemsLeftChange: (n: number) => void;
  // passes full array of type-indices so parent can render 2-D bag HUD
  onBagItemsChange: (types: number[]) => void;
  // 让外部触发"摇一摇"
  shakeKey: number;
  // whether to skip spawn-stagger (hell mode: all appear at once)
  instantSpawn?: boolean;
}

// ─── Container —— 木质展示柜（底 + 4 面玻璃墙） ───────────────────────────

function Container() {
  const tileWidth = 4;
  const tileDepth = 10;
  const tileHeight = 0.2;

  // 物理用的隐形碰撞体（薄一点比较稳）
  const physMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0,
      }),
    []
  );

  // 木质底 + 边框（visible decorative）
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7c2d12",
        roughness: 0.85,
        metalness: 0.05,
      }),
    []
  );
  const woodAccentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#451a03",
        roughness: 0.7,
      }),
    []
  );
  // 玻璃墙（半透明，让你能"透过"看到食物）
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#fef3c7",
        transparent: true,
        opacity: 0.08,
        roughness: 0.05,
        metalness: 0,
        transmission: 0.7,
        thickness: 0.3,
      }),
    []
  );

  return (
    <group>
      {/* 物理碰撞 — 不可见 */}
      <mesh material={physMat} position={[0, 0, 0]}>
        <boxGeometry args={[tileWidth * 4, tileHeight, tileWidth * 4]} />
      </mesh>
      <mesh position={[0, 4, -2.1]} material={physMat}>
        <boxGeometry args={[tileWidth, tileDepth, tileHeight]} />
      </mesh>
      <mesh position={[0, 4, 2.1]} material={physMat}>
        <boxGeometry args={[tileWidth, tileDepth, tileHeight]} />
      </mesh>
      <mesh position={[2.1, 4, 0]} material={physMat}>
        <boxGeometry args={[tileHeight, tileDepth, tileWidth]} />
      </mesh>
      <mesh position={[-2.1, 4, 0]} material={physMat}>
        <boxGeometry args={[tileHeight, tileDepth, tileWidth]} />
      </mesh>

      {/* 视觉装饰：木质底盘（比物理底更宽，伸出来当托盘） */}
      <mesh position={[0, -0.15, 0]} material={woodMat} receiveShadow>
        <boxGeometry args={[6, 0.3, 6]} />
      </mesh>
      {/* 木边框 4 条 */}
      <mesh position={[0, 0.05, -3.05]} material={woodAccentMat} castShadow>
        <boxGeometry args={[6, 0.4, 0.2]} />
      </mesh>
      <mesh position={[0, 0.05, 3.05]} material={woodAccentMat} castShadow>
        <boxGeometry args={[6, 0.4, 0.2]} />
      </mesh>
      <mesh position={[3.05, 0.05, 0]} material={woodAccentMat} castShadow>
        <boxGeometry args={[0.2, 0.4, 6]} />
      </mesh>
      <mesh position={[-3.05, 0.05, 0]} material={woodAccentMat} castShadow>
        <boxGeometry args={[0.2, 0.4, 6]} />
      </mesh>
      {/* 4 面半透明玻璃墙（视觉上看到展示柜的"罩子"） */}
      <mesh position={[0, 2.2, -3.0]} material={glassMat}>
        <boxGeometry args={[6, 4.4, 0.04]} />
      </mesh>
      <mesh position={[0, 2.2, 3.0]} material={glassMat}>
        <boxGeometry args={[6, 4.4, 0.04]} />
      </mesh>
      <mesh position={[-3.0, 2.2, 0]} material={glassMat}>
        <boxGeometry args={[0.04, 4.4, 6]} />
      </mesh>
      <mesh position={[3.0, 2.2, 0]} material={glassMat}>
        <boxGeometry args={[0.04, 4.4, 6]} />
      </mesh>
      {/* 玻璃顶（更透明，让光线进来） */}
      <mesh position={[0, 4.4, 0]} material={glassMat}>
        <boxGeometry args={[6, 0.04, 6]} />
      </mesh>
    </group>
  );
}

// ─── 单个食物 Item ──────────────────────────────────────────────────────────

const SELECTED_MAT = new THREE.MeshStandardMaterial({
  color: "gold",
  side: THREE.BackSide,
  depthTest: false,
  transparent: true,
});

interface ItemProps {
  id: number;
  type: number;
  position: [number, number, number];
  delay: number;
  modelScene: THREE.Group | null;
  shakeKey: number; // 摇一摇信号：每次 +1 都触发一次冲量
  onPick: (item: BagSlotItem, startPos: THREE.Vector3) => void;
}

function Item({ id, type, position, delay, modelScene, shakeKey, onPick }: ItemProps) {
  const [visible, setVisible] = useState(false);
  const [picked, setPicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const bodyRef = useRef<RapierRigidBody>(null);
  const groupRef = useRef<THREE.Group>(null);
  const animRef = useRef<THREE.Group>(null);
  const startPosRef = useRef(new THREE.Vector3());
  // All picked items fly to the same off-screen sink — bag is rendered as 2D HUD
  const targetRef = useRef(new THREE.Vector3(0, -12, 0));
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const originalMaterialRef = useRef<THREE.Material | null>(null);

  // 克隆模型
  const model = useMemo(() => modelScene?.clone(true), [modelScene]);

  // 延迟出生（spawn 错开避免同时刷出来卡顿）
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  // hover 高亮
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const m = mesh.material as THREE.Material;
        if (hovered) {
          if (!originalMaterialRef.current) originalMaterialRef.current = m;
          mesh.material = SELECTED_MAT;
        } else if (originalMaterialRef.current) {
          mesh.material = originalMaterialRef.current;
        }
      }
    });
  }, [hovered]);

  // 飞向卡槽动画
  useEffect(() => {
    if (!picked || !animRef.current) return;
    tweenRef.current?.kill();
    tweenRef.current = gsap.to(animRef.current.position, {
      x: targetRef.current.x,
      y: targetRef.current.y,
      z: targetRef.current.z,
      duration: 0.25,
      ease: "power3.inOut",
    });
    // 还原材质
    if (model && originalMaterialRef.current) {
      model.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).material = originalMaterialRef.current!;
        }
      });
    }
    return () => {
      tweenRef.current?.kill();
    };
  }, [picked, model]);

  // 卸载清理
  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      originalMaterialRef.current = null;
    };
  }, []);

  // 摇一摇：shakeKey 变化时给 RigidBody 施加随机冲量 + 扭矩
  // 这样食物会"跳起来"重新落下，但不重置游戏状态
  useEffect(() => {
    if (shakeKey === 0) return; // 初次 mount 不摇
    if (picked) return; // 已被拾取的不摇
    const body = bodyRef.current;
    if (!body) return;
    // 向上冲量（让物体跳起来）+ 横向小推力（错开）
    body.applyImpulse(
      {
        x: (Math.random() - 0.5) * 4,
        y: 4 + Math.random() * 4,
        z: (Math.random() - 0.5) * 4,
      },
      true
    );
    // 扭矩让物体翻滚
    body.applyTorqueImpulse(
      {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.5,
      },
      true
    );
  }, [shakeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  // Once picked, remove from 3D scene entirely — the 2D HUD shows bag contents
  if (picked) return null;

  return (
    <RigidBody position={position} colliders="hull" ref={bodyRef}>
      <group
        ref={groupRef}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (picked) return;
          // 记录拾取瞬间的世界位置
          const t = bodyRef.current?.translation();
          if (t) {
            startPosRef.current.set(t.x, t.y, t.z);
          }
          onPick(
            { id, type, meshRef: animRef as React.RefObject<THREE.Object3D | null> },
            startPosRef.current
          );
          // onPick handles lose/win internally; item always flies off
          setPicked(true);
        }}
      >
        {model ? <primitive object={model} scale={0.6} /> : null}
      </group>
    </RigidBody>
  );
}

// ─── 主场景内容 ──────────────────────────────────────────────────────────────

function SceneContent({
  totalItems,
  bagCapacity,
  shakeKey,
  onWin,
  onLose,
  onItemsLeftChange,
  onBagItemsChange,
  instantSpawn,
}: SceneProps) {
  // 加载所有模型
  const models = useMemo(
    () => MODEL_FILES.map((f) => `/models/goose-grab/${f}`),
    []
  );
  const gltfList = models.map((url) => useGLTF(url));

  // bag 状态（refs 避免每次都 re-render 整个场景）
  const bagItemsRef = useRef<BagSlotItem[]>([]);
  const itemsLeftRef = useRef(totalItems);
  const endedRef = useRef(false);

  // 初始报告状态给外部
  useEffect(() => {
    onItemsLeftChange(itemsLeftRef.current);
    onBagItemsChange([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // checkAndRemove：bag 里 3 张同 type → 消除
  const checkAndRemoveTriples = (): boolean => {
    const bag = bagItemsRef.current;
    const buckets: Record<number, number[]> = {};
    bag.forEach((item, i) => {
      (buckets[item.type] ??= []).push(i);
    });
    const toRemove: number[] = [];
    Object.values(buckets).forEach((idxs) => {
      if (idxs.length >= 3) toRemove.push(...idxs.slice(0, 3));
    });

    let full = false;
    if (toRemove.length > 0) {
      bagItemsRef.current = bag.filter((_, i) => !toRemove.includes(i));
      onBagItemsChange(bagItemsRef.current.map((i) => i.type));
    } else if (bag.length >= bagCapacity) {
      full = true;
    }
    return !full;
  };

  // 拾取一个 item — bag 存满了就触发 lose，否则入袋并做 3-match 检查
  const handlePick = (item: BagSlotItem, _startPos: THREE.Vector3): void => {
    if (endedRef.current) return;
    const bag = bagItemsRef.current;
    if (bag.length >= bagCapacity) {
      endedRef.current = true;
      onLose();
      return;
    }
    // 插入同类相邻
    const sameTypeLast = bag.findIndex((i) => i.type === item.type);
    const newIdx = sameTypeLast !== -1 ? sameTypeLast + 1 : bag.length;
    bagItemsRef.current = [...bag.slice(0, newIdx), item, ...bag.slice(newIdx)];
    itemsLeftRef.current -= 1;

    // 报告外部（传完整 type 数组给 2D HUD）
    onBagItemsChange(bagItemsRef.current.map((i) => i.type));
    onItemsLeftChange(itemsLeftRef.current);

    // 下一帧检查 3-match
    setTimeout(() => {
      const ok = checkAndRemoveTriples();
      if (!ok && !endedRef.current) {
        endedRef.current = true;
        onLose();
      } else if (itemsLeftRef.current <= 0 && !endedRef.current) {
        endedRef.current = true;
        onWin();
      }
    }, 50);
  };

  // 生成 items：N 件食物，初始位置在容器内随机偏移
  // instantSpawn=true (hell) → 0 delay so all appear together, no "raining" effect
  const items = useMemo(
    () =>
      Array.from({ length: totalItems }, (_, i) => ({
        id: i,
        type: i % MODEL_FILES.length,
        pos: [
          ((i % 10) - 4.5) * 0.35,
          Math.floor(i / 10) * 0.55 + 0.8,
          (Math.floor(i / 50) - 0.5) * 0.35,
        ] as [number, number, number],
        delay: instantSpawn ? 0 : (i / 90) * 1000,
      })),
    [totalItems, instantSpawn]
  );

  return (
    <>
      {/* trimesh gives accurate concave collision so items stay inside the tray */}
      <RigidBody type="fixed" colliders="trimesh">
        <Container />
      </RigidBody>

      {items.map((it) => (
        <Item
          key={it.id}
          id={it.id}
          type={it.type}
          position={it.pos}
          delay={it.delay}
          modelScene={(gltfList[it.type]?.scene as THREE.Group) ?? null}
          shakeKey={shakeKey}
          onPick={handlePick}
        />
      ))}

      {/* 灯光：暖色顶光（像店里的射灯）+ 蓝色冷光填充 */}
      <ambientLight intensity={0.55} color="#fef3c7" />
      <directionalLight
        position={[-5, 10, 5]}
        intensity={1.4}
        color="#fef3c7"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[5, 8, -3]} intensity={0.6} color="#cbd5e1" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#fcd34d" />
    </>
  );
}

// ─── 顶层 Canvas ─────────────────────────────────────────────────────────────

export default function GooseGrabScene({
  totalItems,
  bagCapacity,
  shakeKey,
  onWin,
  onLose,
  onItemsLeftChange,
  onBagItemsChange,
  instantSpawn,
}: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 8], fov: 48 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{
        background:
          "radial-gradient(circle at 50% 30%, #fde68a 0%, #d97706 35%, #7c2d12 75%, #451a03 100%)",
      }}
    >
      <Physics gravity={[0, -4, 0]} timeStep="vary">
        <SceneContent
          totalItems={totalItems}
          bagCapacity={bagCapacity}
          shakeKey={shakeKey}
          onWin={onWin}
          onLose={onLose}
          onItemsLeftChange={onItemsLeftChange}
          onBagItemsChange={onBagItemsChange}
          instantSpawn={instantSpawn}
        />
      </Physics>
    </Canvas>
  );
}
