"use client";

import * as THREE from "three";
import { useFBX, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";

/**
 * 仓库内源文件：`src/app/resources/pistol/source/arms@talon.fbx`（及 `textures/`）。
 * `npm run dev` / `npm run build` 前会同步到 `public/resources/pistol`，便于浏览器加载
 * 并让 FBX 内相对路径贴图解析到同域 `/resources/pistol/textures/...`。
 */
export const PISTOL_FBX_PATH = "/resources/pistol/source/arms@talon.fbx";

/**
 * 模型根空间里的枪管轴向（归一化前）。相机 viewmodel 前向为 **−Z**。
 * 若枪口仍不对：改成 `(0, 0, 1)`、`(0, 1, 0)` 或 `(-1, 0, 0)` 等再试。
 */
const GUN_BARREL_LOCAL = new THREE.Vector3(0, 0, 1);

const VIEWMODEL_FORWARD = new THREE.Vector3(0, 0, -1);

function applyTextureColorSpaces(m: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial) {
  if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
  if (m.emissiveMap) m.emissiveMap.colorSpace = THREE.SRGBColorSpace;
}

/** FBX 常带 Phong/Lambert + 纯黑 baseColor；贴图存在时把底色提亮，否则 PBR 会像剪影。 */
function lightenTooDarkAlbedo(
  m: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial
) {
  const lum =
    m.color.r * 0.2126 + m.color.g * 0.7152 + m.color.b * 0.0722;
  if (lum < 0.08) {
    if (m.map) m.color.setRGB(1, 1, 1);
    else m.color.setRGB(0.52, 0.52, 0.55);
  }
}

function phongLambertToStandard(
  m: THREE.MeshPhongMaterial | THREE.MeshLambertMaterial
): THREE.MeshStandardMaterial {
  const rough =
    m instanceof THREE.MeshPhongMaterial
      ? Math.max(0.28, 1 - Math.min(m.shininess / 180, 0.78))
      : 0.8;
  const std = new THREE.MeshStandardMaterial({
    color: m.color.clone(),
    map: m.map ?? null,
    normalMap: m.normalMap ?? null,
    bumpMap: m.bumpMap ?? null,
    emissive: m.emissive?.clone?.() ?? new THREE.Color(0x000000),
    emissiveMap: m.emissiveMap ?? null,
    opacity: m.opacity,
    transparent: m.transparent,
    roughness: rough,
    metalness: 0.1,
    envMapIntensity: 1.25,
  });
  applyTextureColorSpaces(std);
  lightenTooDarkAlbedo(std);
  m.dispose();
  return std;
}

function basicToStandard(m: THREE.MeshBasicMaterial): THREE.MeshStandardMaterial {
  const std = new THREE.MeshStandardMaterial({
    color: m.color.clone(),
    map: m.map ?? null,
    opacity: m.opacity,
    transparent: m.transparent,
    roughness: 0.68,
    metalness: 0.06,
    envMapIntensity: 1.25,
  });
  applyTextureColorSpaces(std);
  lightenTooDarkAlbedo(std);
  m.dispose();
  return std;
}

function upgradeMaterial(m: THREE.Material): THREE.Material {
  if (m instanceof THREE.MeshStandardMaterial) {
    applyTextureColorSpaces(m);
    m.envMapIntensity = Math.max(m.envMapIntensity ?? 1, 1.05);
    lightenTooDarkAlbedo(m);
    return m;
  }
  if (m instanceof THREE.MeshPhysicalMaterial) {
    applyTextureColorSpaces(m);
    m.envMapIntensity = Math.max(m.envMapIntensity ?? 1, 1.1);
    lightenTooDarkAlbedo(m);
    return m;
  }
  if (m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshLambertMaterial) {
    return phongLambertToStandard(m);
  }
  if (m instanceof THREE.MeshBasicMaterial) {
    return basicToStandard(m);
  }
  return m;
}

/** FBX 导入常见非 MeshStandard 材质；统一成 Standard 并接场景 IBL。 */
function normalizeFbxMaterials(root: THREE.Object3D) {
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const next = mats.map((mat) => upgradeMaterial(mat as THREE.Material));
    o.material = next.length === 1 ? next[0]! : next;
    o.castShadow = true;
    o.receiveShadow = true;
  });
}

/** 不应作为默认循环待机播放的片段（换弹、开火、掏枪等）。用 \\b 避免 threshold / standard 等误判。 */
function isTransientClipName(name: string): boolean {
  const n = name.toLowerCase();
  return [
    /\breload\b/,
    /\bre-?load\b/,
    /\bmagazine\b/,
    /\bammo\b/,
    /\bbolt\b/,
    /\brack\b/,
    /\bempty\b/,
    /\bdraw\b/,
    /\bholster\b/,
    /\bswap\b/,
    /\binsert\b/,
    /\bcharge\b/,
    /\bshoot\b/,
    /\bfire\b/,
    /\brecoil\b/,
    /\battack\b/,
    /\bshot\b/,
    /\bads\b/,
    /\bmelee\b/,
    /\bdamage\b/,
    /\binspect\b/,
    /\bgrab\b/,
  ].some((re) => re.test(n));
}

/** 仅当名字明确像「待机」时才循环播放；不做「第一个看起来无害的 clip」回退，避免整条时间轴/换弹被当 idle。 */
function looksLikeExplicitIdleClip(name: string): boolean {
  if (isTransientClipName(name)) return false;
  const n = name.toLowerCase();
  return (
    /\b(idle|rig_idle|weapon_idle|aim_idle|low_idle|high_idle|guard_idle)\b/.test(
      n
    ) ||
    /\b(tpose|t_pose)\b/.test(n)
  );
}

function PistolModelInner({
  recoilRef,
}: {
  recoilRef: MutableRefObject<number>;
}) {
  const fbx = useFBX(PISTOL_FBX_PATH);
  const model = useMemo(() => {
    const c = fbx.clone(true);
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.quaternion.identity();
    c.scale.set(1, 1, 1);
    normalizeFbxMaterials(c);
    return c;
  }, [fbx]);
  const { actions, names, mixer } = useAnimations(model.animations, model);

  const barrelAlignQuat = useMemo(() => {
    const from = GUN_BARREL_LOCAL.clone().normalize();
    const to = VIEWMODEL_FORWARD.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(from, to);
  }, []);

  const scale = useMemo(() => {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1e-4);
    return 0.52 / maxDim;
  }, [model]);

  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  useLayoutEffect(() => {
    if (!names.length) return;

    mixer.stopAllAction();

    const idleName = names.find(looksLikeExplicitIdleClip) ?? null;

    if (!idleName) {
      queueMicrotask(() => mixer.stopAllAction());
      return () => {
        mixer.stopAllAction();
      };
    }

    const act = actions[idleName];
    if (act) {
      act.reset();
      act.setLoop(THREE.LoopRepeat, Infinity);
      act.fadeIn(0.15).play();
      idleActionRef.current = act;
    }
    return () => {
      idleActionRef.current?.fadeOut(0.12);
      idleActionRef.current = null;
      mixer.stopAllAction();
    };
  }, [actions, mixer, names]);

  const prevRecoil = useRef(0);
  useFrame(() => {
    const r = recoilRef.current;
    const rising = r > 0.55 && prevRecoil.current <= 0.55;
    prevRecoil.current = r;
    if (!rising || !names.length) return;

    // 只触发「击发」类片段，不要把换弹当作每次开枪自动播（换弹由 FBX 里单独 clip 时再绑按键）
    const fireName = names.find(
      (n) =>
        /shoot|fire|recoil|attack|shot/i.test(n) && !/reload|magazine|ammo/i.test(n)
    );
    if (!fireName) return;
    const act = actions[fireName];
    if (!act) return;

    act.reset();
    act.setLoop(THREE.LoopOnce, 1);
    act.clampWhenFinished = true;
    act.fadeIn(0.06).play();
  });

  // 用四元数把「枪管局部轴」对齐到 viewmodel 前向 −Z；外层 group 避免与 FBX 根节点自带旋转打架。
  return (
    <group quaternion={barrelAlignQuat} position={[0.02, -0.02, 0]}>
      <primitive object={model} scale={scale} />
    </group>
  );
}

export function PistolViewModel({
  recoilRef,
}: {
  recoilRef: MutableRefObject<number>;
}) {
  return (
    <Suspense fallback={null}>
      <PistolModelInner recoilRef={recoilRef} />
    </Suspense>
  );
}
