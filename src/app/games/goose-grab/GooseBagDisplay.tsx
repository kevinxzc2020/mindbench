"use client";

/**
 * GooseBagDisplay —— 收纳栏 3D 缩略图。
 *
 * **关键性能修复**：之前每个槽位一个独立 `<Canvas>`（6 个槽 = 6 个 WebGL
 * context + 主游戏 1 个 = 7 个 GL context 共存）。每次点击都会新建/销毁 GL
 * context，造成明显卡顿。
 *
 * 新版：**整个收纳栏共用一个 Canvas**。所有 thumbnail 在同一个 R3F 场景里
 * 水平排列，每个 thumb 对齐其所在槽位的位置。增加/移除物品只是在同一
 * 场景里加/减一个 mesh，几乎零成本。
 */

import { Canvas } from "@react-three/fiber";
import { useGLTF, OrthographicCamera } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

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

// 槽位尺寸（DOM）—— 用于计算 thumbnail 之间的世界坐标间距
const SLOT_PX = 64;
const GAP_PX = 6;
// 用正交相机：1 个 ortho 单位高度 = 整个画布像素高度 / (2 * zoom)。
// 我们让 1 世界单位 = SLOT_PX / 2 像素 → 模型最大尺寸 1.4 → 视觉占满槽 70%
// 槽间距 = (SLOT_PX + GAP_PX) / SLOT_PX * 2 世界单位
const SLOT_SPACING_WORLD = ((SLOT_PX + GAP_PX) / SLOT_PX) * 2;
const ORTHO_ZOOM = SLOT_PX / 2; // 让 2 世界单位高 = SLOT_PX 像素（即每槽容纳 ±1 单位）

// ── 单个缩略图模型 ─────────────────────────────────────────────────────────
//
// 每个 GLB 的原始 pivot / 朝向 / 尺寸都不一样。在同一个共享 Canvas 里如果不
// 归一化，每个 thumbnail 就会姿势 + 大小不统一。
//
// 解决方法：
//   1) **只看可见 mesh 的 bbox**（避开 GLB 自带的隐藏 hitbox/helper）
//   2) **自动居中**：把可见几何中心移到 group 原点
//   3) **自动归一化**：缩到 targetSize 个世界单位
//   4) **统一 3/4 视角**（30° Y）让所有模型呈"左前方"姿势
//   5) 配合外层的 OrthographicCamera —— 没有透视畸变，规格化彻底干净
const TARGET_SIZE = 1.6; // 目标包围盒最长边
const VIEW_ROTATION_Y = Math.PI / 6;

function ThumbModel({
  typeIdx,
  xOffset,
}: {
  typeIdx: number;
  xOffset: number;
}) {
  const url = `/models/goose-grab/${MODEL_FILES[typeIdx % MODEL_FILES.length]}`;
  const { scene } = useGLTF(url);
  const { object, scale, centerOffset } = useMemo(() => {
    const obj = scene.clone(true);
    obj.updateMatrixWorld(true);

    // 只把可见 mesh 算进 bbox（避免不可见 collision proxy 把尺寸算大）
    const box = new THREE.Box3();
    let hasMesh = false;
    obj.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh && m.visible !== false) {
        const childBox = new THREE.Box3().setFromObject(m);
        if (!childBox.isEmpty()) {
          box.union(childBox);
          hasMesh = true;
        }
      }
    });

    if (!hasMesh) {
      return {
        object: obj,
        scale: 1,
        centerOffset: new THREE.Vector3(),
      };
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? TARGET_SIZE / maxDim : 1;
    return { object: obj, scale: s, centerOffset: center };
  }, [scene]);

  return (
    <group position={[xOffset, 0, 0]}>
      <group rotation={[0, VIEW_ROTATION_Y, 0]}>
        <primitive
          object={object}
          scale={scale}
          position={[
            -centerOffset.x * scale,
            -centerOffset.y * scale,
            -centerOffset.z * scale,
          ]}
        />
      </group>
    </group>
  );
}

// ── 共用灯光（一份就够，所有 thumb 共享）───────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={1.8} color="#fef3c7" />
      <directionalLight position={[2, 5, 4]} intensity={1.3} />
      <directionalLight position={[-2, 3, -2]} intensity={0.4} color="#cbd5e1" />
    </>
  );
}

// ── 公开组件 ───────────────────────────────────────────────────────────────
export default function GooseBagDisplay({
  types,
  capacity,
}: {
  types: number[];
  capacity: number;
}) {
  // Canvas 总宽度（覆盖整个槽位排）
  const totalWidth = capacity * SLOT_PX + (capacity - 1) * GAP_PX;

  return (
    <div className="rounded-xl bg-gray-900/80 border border-orange-900/40 p-2">
      <div className="relative mx-auto" style={{ width: totalWidth, height: SLOT_PX }}>
        {/* DOM 槽位边框（背景层） */}
        <div className="absolute inset-0 flex gap-[6px]">
          {Array.from({ length: capacity }, (_, i) => {
            const filled = types[i] !== undefined;
            return (
              <div
                key={i}
                className={`rounded-lg border transition-all flex-shrink-0 ${
                  filled
                    ? "border-orange-600/60 bg-gray-900/90"
                    : "border-gray-700/40 bg-gray-800/30"
                }`}
                style={{ width: SLOT_PX, height: SLOT_PX }}
              />
            );
          })}
        </div>
        {/* 单个共享 Canvas 渲染所有 thumbnail —— 关键性能改动 */}
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            gl={{ antialias: true, powerPreference: "high-performance" }}
            dpr={[1, 1.5]}
            style={{ background: "transparent" }}
          >
            {/* 正交相机：消除透视畸变，所有模型严格按几何尺寸渲染。
                位置 (0, 2.5, 2.5) + 绕 X 轴 -45° 旋转 → 精确朝原点看，
                形成 45° 下俯视角。
                注意：必须显式设 rotation —— OrthographicCamera 默认朝 -Z
                看不会自动 lookAt(0,0,0)，否则模型会落在视野外。 */}
            <OrthographicCamera
              makeDefault
              position={[0, 2.5, 2.5]}
              rotation={[-Math.PI / 4, 0, 0]}
              zoom={ORTHO_ZOOM}
              near={0.1}
              far={50}
            />
            <Lights />
            <Suspense fallback={null}>
              {types.map((type, i) => {
                if (type === undefined || i >= capacity) return null;
                const xOffset = (i - (capacity - 1) / 2) * SLOT_SPACING_WORLD;
                return <ThumbModel key={i} typeIdx={type} xOffset={xOffset} />;
              })}
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
}
