"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// 漂浮的 3D 形状属性
interface FloatProps {
  position: [number, number, number];
  scale: number;
  shape: "sphere" | "torus" | "box" | "icos";
  color: string;
  speed: number;
  phase: number;
  rotSpeed: [number, number, number];
}

function FloatingShape({
  position,
  scale,
  shape,
  color,
  speed,
  phase,
  rotSpeed,
}: FloatProps) {
  const ref = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // 上下漂浮
    ref.current.position.y = initialY + Math.sin(t * speed + phase) * 0.6;
    // 缓慢旋转
    ref.current.rotation.x = t * rotSpeed[0];
    ref.current.rotation.y = t * rotSpeed[1];
    ref.current.rotation.z = t * rotSpeed[2];
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case "sphere":
        return new THREE.SphereGeometry(0.5, 24, 24);
      case "torus":
        return new THREE.TorusGeometry(0.4, 0.15, 16, 32);
      case "box":
        return new THREE.BoxGeometry(0.65, 0.65, 0.65);
      case "icos":
        return new THREE.IcosahedronGeometry(0.5, 0);
    }
  }, [shape]);

  return (
    <mesh ref={ref} position={position} scale={scale} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        roughness={0.35}
        metalness={0.2}
      />
    </mesh>
  );
}

export default function TileMatchBackground() {
  // 一次性生成 14 个随机形状（memoized 保证不会每帧重建）
  const shapes = useMemo<FloatProps[]>(() => {
    // 糖果柔和色板（贴合三消水果主题）
    const palette = [
      "#fda4af", // rose
      "#fcd34d", // amber
      "#86efac", // emerald
      "#a5b4fc", // indigo
      "#fbbf24", // gold
      "#f9a8d4", // pink
      "#67e8f9", // cyan
      "#c4b5fd", // violet
      "#fb7185", // crimson
      "#fdba74", // peach
    ];
    const shapeTypes: FloatProps["shape"][] = [
      "sphere",
      "torus",
      "box",
      "icos",
    ];
    const result: FloatProps[] = [];
    // 板内空间不大，10 个就够，分布也要收敛
    for (let i = 0; i < 10; i++) {
      result.push({
        position: [
          (Math.random() - 0.5) * 10, // x: -5..5
          (Math.random() - 0.5) * 5, // y: -2.5..2.5
          -3 - Math.random() * 5, // z: -3..-8 (远景)
        ],
        scale: 0.45 + Math.random() * 0.75,
        shape: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        color: palette[Math.floor(Math.random() * palette.length)],
        speed: 0.25 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: [
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.2,
        ],
      });
    }
    return result;
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 55 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
    >
      {/* 暖色环境光 */}
      <ambientLight intensity={0.45} />
      {/* 顶光：偏暖黄 */}
      <pointLight
        position={[6, 6, 6]}
        intensity={1.4}
        color="#fef3c7"
        distance={30}
      />
      {/* 底光：偏粉 */}
      <pointLight
        position={[-5, -4, 3]}
        intensity={0.8}
        color="#fda4af"
        distance={20}
      />
      {/* 远处冷光：拉对比度 */}
      <pointLight
        position={[0, 0, -10]}
        intensity={0.6}
        color="#a5b4fc"
        distance={25}
      />

      {shapes.map((s, i) => (
        <FloatingShape key={i} {...s} />
      ))}
    </Canvas>
  );
}
