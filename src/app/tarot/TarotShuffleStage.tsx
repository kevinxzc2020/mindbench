"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Application, Assets, BlurFilter, Container, Graphics, Sprite, Texture } from "pixi.js";
import Matter from "matter-js";
import { buildShuffleSeed } from "@/lib/tarot-seeded";

const CARD_BACK_URL = "/resources/card/cardlow.png";
const CARD_BACK_MASK_URL = "/resources/card/cardmasklow.png";
const TABLE_BACKGROUND_URL = "/resources/card/background.png";
const CARD_COUNT = 78;
/** 开扇后从扇面选入顶栏的牌数 */
const PICK_SLOT_COUNT = 4;
/** 选牌飞到顶栏的时长 */
const PICK_FLY_DURATION_MS = 580;
/** 四张牌翻开：相邻两张启动间隔 */
const PICK_REVEAL_STAGGER_MS = 260;
/** 单张翻牌时长 */
const PICK_REVEAL_DURATION_MS = 520;
/** 选满四张后：剩余扇面收拢至中心 */
const REMAIN_CLOSE_STAGGER_MS = 26;
const REMAIN_CLOSE_DURATION_MS = 700;
/** 收拢后再渐隐 */
const REMAIN_FADE_DURATION_MS = 600;
const TABLE_PAD = 36;
/** 距内边小于此比例×短边时，施加指向中心的微弱拉力（避免牌全贴在四墙） */
const EDGE_PULL_ZONE_FRAC = 0.15;
/** 与 delta、质量、距边权重相乘的拉力系数，尽量弱 */
const EDGE_PULL_STRENGTH = 2.4e-6;

/** 收拢后牌叠悬停：与页面菜单 pill（紫边提亮）视觉同向的 Pixi 反馈 */
const DECK_HOVER_HIT_PAD = 8;
/** 每毫秒向 0/1 混合的比例上限，越大跟手越快 */
const DECK_HOVER_BLEND_PER_MS = 0.018;

/** Matter 碰撞分类：牌只与墙、指针碰撞，牌与牌不碰撞 */
const COL = {
  WALL: 0x0001,
  CARD: 0x0002,
  POINTER: 0x0004,
} as const;

/** 牌背宽/高：在原始 54:100 基础上宽度再加约 10%，略宽一点 */
const CARD_WIDTH_OVER_HEIGHT = (54 / 100) * 1.1;

/**
 * 根据桌面区域（Pixi 画布逻辑像素）自适应牌尺寸：随 min(宽,高) 变化，并限制上下限以免过小或穿模。
 */
function getCardPhysSize(layoutW: number, layoutH: number): { w: number; h: number } {
  const minDim = Math.min(layoutW, layoutH);
  /** 约为短边的 1/4，避免在高大画布上牌面过大 */
  let h = Math.round(minDim * 0.26);
  h = Math.max(64, Math.min(220, h));
  const w = Math.max(40, Math.round(h * CARD_WIDTH_OVER_HEIGHT));
  return { w, h };
}

/** 指针圆形刚体半径：与牌高成比例，便于不同窗口下手感一致 */
function getPointerRadius(cardH: number): number {
  return Math.max(44, Math.min(Math.round(cardH * 0.52), 160));
}

/** 物理时间缩放：1 → 正常；0.5 → 约一半速度（弹飞更慢） */
const PHYS_TIME_SCALE = 0.5;
/** 单帧传给 Matter 的最大毫秒，避免切后台或掉帧时一大步穿墙 */
const MAX_PHYS_STEP_MS = 38;
/** 牌心最大线速度（px/s 量级），减轻指针瞬移造成的爆炸分离 */
const MAX_CARD_SPEED_PX = 2100;

/** 收拢：相邻两张牌开启动画的间隔（流水感） */
const GATHER_STAGGER_MS = 44;
/** 单张牌飞到中心的大致时长 */
const GATHER_DURATION_MS = 880;

/**
 * 位移进度：先较快靠近，中段明显减速略作“顿”，再轻轻合拢，模拟牌叠厚重感。
 * 返回值 0→1 表示从起点到终点的插值系数。
 */
function easeGatherStack(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const t1 = 0.66;
  const t2 = 0.84;
  if (t < t1) {
    const u = t / t1;
    return 0.76 * (1 - Math.pow(1 - u, 1.9));
  }
  if (t < t2) {
    const u = (t - t1) / (t2 - t1);
    const s = u * u * (3 - 2 * u);
    return 0.76 + 0.13 * s;
  }
  const u = (t - t2) / (1 - t2);
  return 0.89 + 0.11 * (1 - Math.pow(1 - u, 2.35));
}

function easeOutCubic(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const u = 1 - t;
  return 1 - u * u * u;
}

/** 限速 + 将牌心钳在桌面内（保守半对角），防止高速/大 delta 穿墙飞出可视区 */
function clampCardBodiesToTable(
  Body: typeof Matter.Body,
  bodies: readonly Matter.Body[],
  layoutW: number,
  layoutH: number,
  cardPhysW: number,
  cardPhysH: number
) {
  // 使用接近牌宽高的轴向边距，避免使用半对角导致贴边时出现明显“跳入场内”观感。
  const padX = cardPhysW * 0.54;
  const padY = cardPhysH * 0.54;
  const minX = padX;
  const maxX = layoutW - padX;
  const minY = padY;
  const maxY = layoutH - padY;
  if (minX >= maxX || minY >= maxY) return;

  for (const b of bodies) {
    const vx = b.velocity.x;
    const vy = b.velocity.y;
    const sp = Math.hypot(vx, vy);
    if (sp > MAX_CARD_SPEED_PX && sp > 0) {
      const k = MAX_CARD_SPEED_PX / sp;
      Body.setVelocity(b, { x: vx * k, y: vy * k });
    }

    let x = b.position.x;
    let y = b.position.y;
    let fixed = false;
    if (x < minX) {
      x = minX;
      fixed = true;
    } else if (x > maxX) {
      x = maxX;
      fixed = true;
    }
    if (y < minY) {
      y = minY;
      fixed = true;
    } else if (y > maxY) {
      y = maxY;
      fixed = true;
    }
    if (fixed) {
      // 仅做温和回推而非硬瞬移，减少边缘继续施压时的突兀闪现。
      const nx = b.position.x + (x - b.position.x) * 0.5;
      const ny = b.position.y + (y - b.position.y) * 0.5;
      Body.setPosition(b, { x: nx, y: ny });
      Body.setVelocity(b, { x: b.velocity.x * 0.3, y: b.velocity.y * 0.3 });
      Body.setAngularVelocity(b, b.angularVelocity * 0.45);
    }
  }
}

type Props = {
  onComplete: (seed: number, pickedOrientations: boolean[]) => void;
  onBack: () => void;
};

/** 与浏览器实际绘制区域一致（flex 子项用 rect 比单独 client 更稳） */
function readMountRect(mount: HTMLElement): { w: number; h: number } {
  const r = mount.getBoundingClientRect();
  return {
    w: Math.max(1, Math.floor(r.width)),
    h: Math.max(1, Math.floor(r.height)),
  };
}

function isReversedByRotation(rad: number): boolean {
  const turn = Math.PI * 2;
  const normalized = ((rad % turn) + turn) % turn;
  return normalized > Math.PI / 2 && normalized < Math.PI * 1.5;
}

function getCardFaceUrlCandidates(cardId: number): string[] {
  const major: Record<number, string[]> = {
    0: ["0fool", "0Fool", "fool"],
    1: ["1magician", "1Magician"],
    2: ["2highpriestess", "2HighPriestess", "2High Priestess"],
    3: ["3empress", "3Empress"],
    4: ["4Emperor", "4emperor"],
    5: ["5HIEROPHANT", "5Hierophant", "5hierophant"],
    6: ["6Lover", "6Lovers", "6lovers"],
    7: ["7chariot", "6chariot", "7Chariot"],
    8: ["8strength", "8Strength", "strength"],
    9: ["9hermit", "9Hermit"],
    10: ["10wheel of fortune", "10Wheel of Fortune"],
    11: ["11Justice", "11justice"],
    12: ["12Hanged Man", "12hanged man", "12HangedMan"],
    13: ["13Death", "13death"],
    14: ["14Temperance", "14temperance"],
    15: ["15Devil", "15devil"],
    16: ["16Tower", "16tower"],
    17: ["17star", "17Star"],
    18: ["18moon", "18Moon"],
    19: ["19sun", "19Sun"],
    20: ["20Judgement", "20Judgment", "20judgement"],
    21: ["21world", "21World"],
  };
  if (major[cardId]) return major[cardId]!.map((n) => `/resources/card/${n}.png`);

  const suit =
    cardId >= 22 && cardId <= 35
      ? "wands"
      : cardId >= 36 && cardId <= 49
        ? "Cup"
        : cardId >= 50 && cardId <= 63
          ? "Sword"
          : cardId >= 64 && cardId <= 77
            ? "pentacles"
            : null;
  if (!suit) return [];
  const rank =
    suit === "wands" ? cardId - 21 : suit === "Cup" ? cardId - 35 : suit === "Sword" ? cardId - 49 : cardId - 63;
  const names = [
    `${rank}${suit}`,
    `${rank}${suit.toLowerCase()}`,
    `${rank}${suit[0]!.toUpperCase()}${suit.slice(1)}`,
  ];
  if (suit === "Cup") names.push(`${rank}Cups`, `${rank}cup`);
  if (suit === "Sword") names.push(`${rank}Swords`, `${rank}sword`);
  if (suit === "pentacles") names.push(`${rank}pentacle`, `${rank}Pentacles`);
  return Array.from(new Set(names)).map((n) => `/resources/card/${n}.png`);
}

async function waitForMountLayout(
  mount: HTMLElement,
  alive: { current: boolean }
): Promise<{ w: number; h: number }> {
  const deadline = (typeof performance !== "undefined" ? performance.now() : Date.now()) + 1500;
  while (alive.current) {
    const { w, h } = readMountRect(mount);
    if (w >= 64 && h >= 64) return { w, h };
    if ((typeof performance !== "undefined" ? performance.now() : Date.now()) > deadline) {
      return {
        w: w < 80 ? 800 : w,
        h: h < 80 ? 480 : h,
      };
    }
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return { w: 800, h: 480 };
}

type GatherItem = {
  sprite: Sprite;
  fromX: number;
  fromY: number;
  fromR: number;
  startAt: number;
  duration: number;
  toX: number;
  toY: number;
  zFinal: number;
};

type SpreadItem = {
  sprite: Sprite;
  fromX: number;
  fromY: number;
  fromR: number;
  toX: number;
  toY: number;
  toR: number;
  startAt: number;
  duration: number;
  zFinal: number;
};

/** 关扇：未选中牌收拢到桌面中心（与 GatherItem 同形，外加 cardIndex） */
type RemainCloseItem = GatherItem & { cardIndex: number };

export function TarotShuffleStage({ onComplete, onBack }: Props) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [gatherBusy, setGatherBusy] = useState(false);
  const [gatherDone, setGatherDone] = useState(false);
  const stopShuffleRef = useRef<(() => void) | null>(null);
  const deckEntropyRef = useRef(0);

  const seedInputRef = useRef({
    pointerPathPx: 0,
    t0: typeof performance !== "undefined" ? performance.now() : 0,
    lastX: 0,
    lastY: 0,
    hasPointer: false,
  });

  const pointerRef = useRef({ x: 0, y: 0, active: false });

  const snapshotSeed = useCallback(() => {
    const s = seedInputRef.current;
    const durationMs = Math.max(
      0,
      Math.floor(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - s.t0
      )
    );
    return buildShuffleSeed({
      pointerPathPx: s.pointerPathPx,
      durationMs,
      lastX: s.lastX,
      lastY: s.lastY,
      deckEntropy: deckEntropyRef.current,
    });
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const aliveRef = { current: true };
    const Engine = Matter.Engine;
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    const Composite = Matter.Composite;

    let application: Application | null = null;
    let engine: Matter.Engine | null = null;
    let onTick: (() => void) | null = null;
    let gatherAnim: { items: GatherItem[] } | null = null;
    let spreadAnim: { items: SpreadItem[] } | null = null;
    let gatherCompletedLocal = false;
    let spreadCompletedLocal = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeRafId = 0;
    let deckShadowLayer: Container | null = null;
    let deckHoverRing: Graphics | null = null;
    let deckHoverAura: Sprite | null = null;
    let deckHoverMaskGlow:
      | { root: Container; fill: Sprite; mask: Sprite }
      | null = null;
    let spreadHoverRing: Graphics | null = null;
    let spreadHoverAura: Sprite | null = null;
    let pickedGlowAuras: (Sprite | null)[] = Array.from({ length: PICK_SLOT_COUNT }, () => null);
    let spreadHoverMaskGlow:
      | { root: Container; fill: Sprite; mask: Sprite }
      | null = null;
    let spreadHoverLerp: number[] = Array.from({ length: CARD_COUNT }, () => 0);
    /** 开扇后已选中的牌（顺序即顶栏槽位 0..3） */
    let pickedOrder: number[] = [];
    let pickedCardIds: number[] = [];
    let pickedFaceTextures: (Texture | null)[] = Array.from({ length: PICK_SLOT_COUNT }, () => null);
    /** true=逆位，false=正位；顺序与 pickedOrder 一致 */
    let pickedOrientations: boolean[] = [];
    const pickedSet = new Set<number>();
    type PickFlyAnim = {
      cardIndex: number;
      slot: number;
      startAt: number;
      duration: number;
      fromX: number;
      fromY: number;
      fromR: number;
      toX: number;
      toY: number;
      toR: number;
    };
    let pickFlyAnims: PickFlyAnim[] = [];
    type PickRevealAnim = { slot: number; startAt: number; duration: number };
    let pickRevealAnims: PickRevealAnim[] = [];
    let pickRevealStarted = false;
    let pickRevealDoneSlots = new Set<number>();
    /** 四张飞到位后开始关扇+渐隐，避免重复触发 */
    let postPickCloseStarted = false;
    let remainCloseAnim: { items: RemainCloseItem[] } | null = null;
    let remainFadeAnim: { startAt: number } | null = null;
    /** 关扇动画中的牌：不同步 Matter 位姿，避免拉回扇面 */
    let remainCloseIndices = new Set<number>();
    let exitToNextPhaseDone = false;
    /** 0→1，收拢后指针在牌叠上时趋近 1（平滑），用于缩放 / tint / 描边 */
    let deckHoverLerp = 0;
    /** 填满 host 的挂载层，尺寸与 Pixi renderer 一一对应，避免在 card 上测到错误宽高 */
    let pixiMount: HTMLDivElement | null = null;

    const boot = async () => {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
        if (!aliveRef.current) return;

        pixiMount = document.createElement("div");
        pixiMount.setAttribute("data-pixi-mount", "1");
        pixiMount.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;";
        host.appendChild(pixiMount);

        let { w, h } = await waitForMountLayout(pixiMount, aliveRef);
        if (w < 100) w = 800;
        if (h < 100) h = 480;
        let layoutW = w;
        let layoutH = h;
        const initialCard = getCardPhysSize(layoutW, layoutH);
        let cardPhysW = initialCard.w;
        let cardPhysH = initialCard.h;
        let pointerRadius = getPointerRadius(cardPhysH);

        const app = new Application();
        await app.init({
          width: layoutW,
          height: layoutH,
          preference: "webgl",
          powerPreference: "high-performance",
          backgroundColor: 0x121520,
          backgroundAlpha: 1,
          antialias: true,
          /** 折中清晰度与性能：高 DPI 屏提高清晰度，但限制上限避免负载过高 */
          resolution:
            typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1,
          autoDensity: true,
        });
        if (!aliveRef.current) {
          app.destroy(true);
          return;
        }

        application = app;
        pixiMount.appendChild(app.canvas);
        Object.assign(app.canvas.style, {
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none",
        });

        const [tex, bgTex, cardMaskTex] = await Promise.all([
          Assets.load<Texture>(CARD_BACK_URL),
          Assets.load<Texture>(TABLE_BACKGROUND_URL),
          Assets.load<Texture>(CARD_BACK_MASK_URL),
        ]);
        if (!tex || tex.orig.width < 2) {
          throw new Error("card texture invalid");
        }
        const cardTexW = Math.max(1, tex.orig.width);
        const cardTexH = Math.max(1, tex.orig.height);
        if (!bgTex || bgTex.orig.width < 2) {
          throw new Error("table background texture invalid");
        }
        if (!cardMaskTex || cardMaskTex.orig.width < 2) {
          throw new Error("card mask texture invalid");
        }
        if (!aliveRef.current) {
          app.destroy(true);
          return;
        }
        const faceTextureCache = new Map<number, Promise<Texture | null>>();
        const loadCardFaceTexture = (cardId: number): Promise<Texture | null> => {
          if (faceTextureCache.has(cardId)) return faceTextureCache.get(cardId)!;
          const task = (async () => {
            const urls = getCardFaceUrlCandidates(cardId);
            for (const url of urls) {
              try {
                const t = await Assets.load<Texture>(url);
                if (t && t.orig.width > 2) return t;
              } catch {
                // Try next candidate.
              }
            }
            return null;
          })();
          faceTextureCache.set(cardId, task);
          return task;
        };

        const tableBg = new Sprite(bgTex);
        const bgTw = Math.max(1, bgTex.orig.width);
        const bgTh = Math.max(1, bgTex.orig.height);
        tableBg.scale.set(layoutW / bgTw, layoutH / bgTh);
        tableBg.position.set(0, 0);
        tableBg.eventMode = "none";
        app.stage.addChild(tableBg);

        const world = new Container();
        world.sortableChildren = true;
        app.stage.addChild(world);

        const eng = Engine.create({ gravity: { x: 0, y: 0 } });
        eng.gravity.y = 0;
        eng.positionIterations = 10;
        eng.velocityIterations = 8;
        engine = eng;

        const wallT = 80;
        const wallFilter = {
          category: COL.WALL,
          mask: COL.CARD,
        };
        const walls: Matter.Body[] = [
          Bodies.rectangle(layoutW / 2, -wallT / 2, layoutW + wallT * 2, wallT, {
            isStatic: true,
            collisionFilter: wallFilter,
          }),
          Bodies.rectangle(layoutW / 2, layoutH + wallT / 2, layoutW + wallT * 2, wallT, {
            isStatic: true,
            collisionFilter: wallFilter,
          }),
          Bodies.rectangle(-wallT / 2, layoutH / 2, wallT, layoutH + wallT * 2, {
            isStatic: true,
            collisionFilter: wallFilter,
          }),
          Bodies.rectangle(layoutW + wallT / 2, layoutH / 2, wallT, layoutH + wallT * 2, {
            isStatic: true,
            collisionFilter: wallFilter,
          }),
        ];
        Composite.add(eng.world, walls);

        const ptr = Bodies.circle(-9999, -9999, pointerRadius, {
          isStatic: true,
          isSensor: false,
          friction: 0,
          frictionStatic: 0,
          restitution: 0.18,
          label: "pointer",
          collisionFilter: {
            category: COL.POINTER,
            mask: COL.CARD,
          },
        });
        Composite.add(eng.world, ptr);

        const cardBodies: Matter.Body[] = [];
        const sprites: Sprite[] = [];
        const rng = () => Math.random();
        const hiddenCardIds = Array.from({ length: CARD_COUNT }, (_, i) => i);
        for (let i = hiddenCardIds.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          const t = hiddenCardIds[i]!;
          hiddenCardIds[i] = hiddenCardIds[j]!;
          hiddenCardIds[j] = t;
        }

        for (let i = 0; i < CARD_COUNT; i++) {
          const x = TABLE_PAD + rng() * Math.max(8, layoutW - TABLE_PAD * 2 - cardPhysW);
          const y = TABLE_PAD + rng() * Math.max(8, layoutH - TABLE_PAD * 2 - cardPhysH);
          const angle = (rng() - 0.5) * Math.PI * 1.35;
          const body = Bodies.rectangle(
            x + cardPhysW / 2,
            y + cardPhysH / 2,
            cardPhysW,
            cardPhysH,
            {
              angle,
              frictionAir: 0.088,
              friction: 0.45,
              restitution: 0.07,
              density: 0.0019,
              chamfer: { radius: 3 },
              label: `card-${hiddenCardIds[i]}`,
              collisionFilter: {
                category: COL.CARD,
                mask: COL.WALL | COL.POINTER,
              },
            }
          );
          Body.setVelocity(body, {
            x: (rng() - 0.5) * 1.1 * PHYS_TIME_SCALE,
            y: (rng() - 0.5) * 1.1 * PHYS_TIME_SCALE,
          });
          Body.setAngularVelocity(body, (rng() - 0.5) * 0.11 * PHYS_TIME_SCALE);
          cardBodies.push(body);
          Composite.add(eng.world, body);

          const sp = new Sprite(tex);
          sp.anchor.set(0.5, 0.5);
          sp.scale.set(cardPhysW / cardTexW, cardPhysH / cardTexH);
          sp.x = body.position.x;
          sp.y = body.position.y;
          sp.rotation = body.angle;
          sp.visible = true;
          sprites.push(sp);
          world.addChild(sp);
        }

        const onMove = (clientX: number, clientY: number) => {
          const rect = app.canvas.getBoundingClientRect();
          const sx = rect.width / app.renderer.width;
          const sy = rect.height / app.renderer.height;
          const x = (clientX - rect.left) / sx;
          const y = (clientY - rect.top) / sy;
          pointerRef.current = { x, y, active: true };

          const s = seedInputRef.current;
          if (s.hasPointer) {
            s.pointerPathPx += Math.hypot(x - s.lastX, y - s.lastY);
          }
          s.lastX = x;
          s.lastY = y;
          s.hasPointer = true;
        };

        const onLeave = () => {
          pointerRef.current.active = false;
          Body.setPosition(ptr, { x: -9999, y: -9999 });
        };

        const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY);
        const tm = (e: TouchEvent) => {
          if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        const mc = (e: MouseEvent) => onCanvasClick(e.clientX, e.clientY);
        const te = (e: TouchEvent) => {
          if (e.changedTouches[0]) onCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        };

        app.canvas.addEventListener("mousemove", mm);
        app.canvas.addEventListener("mouseleave", onLeave);
        app.canvas.addEventListener("touchmove", tm, { passive: true });
        app.canvas.addEventListener("touchend", onLeave);
        app.canvas.addEventListener("click", mc);
        app.canvas.addEventListener("touchend", te, { passive: true });

        const destroyDeckShadowLayer = () => {
          if (deckShadowLayer) {
            world.removeChild(deckShadowLayer);
            deckShadowLayer.destroy({ children: true });
            deckShadowLayer = null;
          }
        };

        const destroyDeckHoverRing = () => {
          if (deckHoverRing) {
            world.removeChild(deckHoverRing);
            deckHoverRing.destroy();
            deckHoverRing = null;
          }
          if (deckHoverAura) {
            world.removeChild(deckHoverAura);
            deckHoverAura.destroy();
            deckHoverAura = null;
          }
          if (deckHoverMaskGlow) {
            world.removeChild(deckHoverMaskGlow.root);
            deckHoverMaskGlow.root.destroy({ children: true });
            deckHoverMaskGlow = null;
          }
          deckHoverLerp = 0;
        };

        const destroySpreadHoverRing = () => {
          if (spreadHoverRing) {
            world.removeChild(spreadHoverRing);
            spreadHoverRing.destroy();
            spreadHoverRing = null;
          }
          if (spreadHoverAura) {
            world.removeChild(spreadHoverAura);
            spreadHoverAura.destroy();
            spreadHoverAura = null;
          }
          if (spreadHoverMaskGlow) {
            world.removeChild(spreadHoverMaskGlow.root);
            spreadHoverMaskGlow.root.destroy({ children: true });
            spreadHoverMaskGlow = null;
          }
          spreadHoverLerp = Array.from({ length: CARD_COUNT }, () => 0);
        };

        const destroyPickedGlowAuras = () => {
          for (let i = 0; i < pickedGlowAuras.length; i++) {
            const aura = pickedGlowAuras[i];
            if (aura) {
              world.removeChild(aura);
              aura.destroy();
              pickedGlowAuras[i] = null;
            }
          }
        };

        /** 多层模糊暗色牌形叠加：底层 blur 大、alpha 略高；上层 blur 小，边缘更「利」 */
        const rebuildDeckShadowLayer = (cx: number, cy: number) => {
          if (!gatherCompletedLocal) return;
          destroyDeckShadowLayer();
          const SHADOW_LAYERS = 8;
          const c = new Container();
          c.label = "deck-stack-shadow";
          c.zIndex = -200000;
          c.position.set(cx, cy);
          const minSide = Math.min(cardPhysW, cardPhysH);
          for (let i = 0; i < SHADOW_LAYERS; i++) {
            const u = SHADOW_LAYERS > 1 ? i / (SHADOW_LAYERS - 1) : 0;
            const spr = new Sprite(tex);
            spr.anchor.set(0.5, 0.5);
            const pad = (1 - u) * 0.04;
            const sw = (cardPhysW * (1 + pad)) / cardTexW;
            const sh = (cardPhysH * (1 + pad)) / cardTexH;
            spr.scale.set(sw, sh);
            spr.tint = 0x05060c;
            const blurStrong = Math.min(28, minSide * 0.16);
            const blur = 2 + (1 - u) * blurStrong;
            spr.alpha = 0.05 + (1 - u) * 0.12;
            spr.filters = [
              new BlurFilter({
                strength: blur,
                quality: 2,
                kernelSize: 9,
              }),
            ];
            c.addChild(spr);
          }
          world.addChild(c);
          deckShadowLayer = c;
          world.sortChildren();
        };

        const applyGatheredCardVisibility = () => {
          if (!gatherCompletedLocal) return;
          if (spreadCompletedLocal || spreadAnim) {
            for (const sp of sprites) {
              sp.visible = true;
              sp.tint = 0xffffff;
              sp.alpha = 1;
            }
            return;
          }
          let topZ = -1;
          for (const sp of sprites) topZ = Math.max(topZ, sp.zIndex);
          for (const sp of sprites) {
            sp.visible = sp.zIndex === topZ;
            sp.tint = 0xffffff;
            sp.alpha = 1;
          }
        };

        const syncSpriteToBody = (sp: Sprite, b: Matter.Body) => {
          sp.x = b.position.x;
          sp.y = b.position.y;
          sp.rotation = b.angle;
          sp.tint = 0xffffff;
        };

        const recalcDeckEntropy = () => {
          const cx = layoutW / 2;
          const cy = layoutH / 2;
          const ordered = cardBodies
            .map((b, i) => ({
              i,
              x: b.position.x,
              y: b.position.y,
              ang: Math.atan2(b.position.y - cy, b.position.x - cx),
            }))
            .filter((o) => !(spreadCompletedLocal && pickedSet.has(o.i)))
            .sort((a, b) => {
              const da = a.ang - b.ang;
              if (Math.abs(da) > 1e-6) return da;
              return a.i - b.i;
            });
          let h = 0x811c9dc5 >>> 0;
          for (let k = 0; k < ordered.length; k++) {
            const it = ordered[k]!;
            const cardId = hiddenCardIds[it.i]!;
            const px = Math.max(0, Math.min(0xffff, Math.floor(it.x * 4)));
            const py = Math.max(0, Math.min(0xffff, Math.floor(it.y * 4)));
            const v = (cardId ^ (px << 8) ^ (py << 1) ^ (k * 0x9e37)) >>> 0;
            h ^= v;
            h = Math.imul(h, 0x01000193) >>> 0;
          }
          deckEntropyRef.current = h >>> 0;
        };

        const isPointerOverDeck = (x: number, y: number) => {
          if (!gatherCompletedLocal || spreadCompletedLocal || spreadAnim) return false;
          const cx = layoutW / 2;
          const cy = layoutH / 2;
          return (
            Math.abs(x - cx) <= cardPhysW / 2 + DECK_HOVER_HIT_PAD &&
            Math.abs(y - cy) <= cardPhysH / 2 + DECK_HOVER_HIT_PAD
          );
        };

        const startSpread = () => {
          if (!gatherCompletedLocal || spreadCompletedLocal || spreadAnim) return;
          destroyDeckShadowLayer();
          destroyDeckHoverRing();
          destroySpreadHoverRing();
          destroyPickedGlowAuras();
          const cx = layoutW / 2;
          const cy = layoutH / 2;
          const radius = Math.max(cardPhysH * 1.1, Math.min(layoutW, layoutH) * 0.31);
          const now = performance.now();
          const items: SpreadItem[] = sprites.map((sp, i) => {
            const theta = (i / CARD_COUNT) * Math.PI * 2 - Math.PI / 2;
            const toX = cx + Math.cos(theta) * radius;
            const toY = cy + Math.sin(theta) * radius;
            const toR = theta + Math.PI / 2;
            return {
              sprite: sp,
              fromX: sp.x,
              fromY: sp.y,
              fromR: sp.rotation,
              toX,
              toY,
              toR,
              startAt: now + i * 8,
              duration: 560,
              zFinal: i,
            };
          });
          for (const sp of sprites) {
            sp.visible = true;
            sp.texture = tex;
          }
          spreadAnim = { items };
        };

        /**
         * 四张选中牌落点：左上 / 右上 / 左下 / 右下。
         * 先取靠角的安全锚点，再沿「角 → 桌面中心」内推一段，使牌停在边角与中央牌堆之间的空白带，不贴角。
         */
        const computeHandSlotBase = (
          slot: number,
          lw: number = layoutW,
          lh: number = layoutH,
          cw: number = cardPhysW,
          ch: number = cardPhysH
        ) => {
          const cx = lw / 2;
          const cy = lh / 2;
          const padX = Math.max(18, cw * 0.2);
          const padY = Math.max(18, ch * 0.16);
          let bx: number;
          let by: number;
          if (slot === 0) {
            bx = padX + cw / 2;
            by = padY + ch / 2;
          } else if (slot === 1) {
            bx = lw - padX - cw / 2;
            by = padY + ch / 2;
          } else if (slot === 2) {
            bx = padX + cw / 2;
            by = lh - padY - ch / 2;
          } else {
            bx = lw - padX - cw / 2;
            by = lh - padY - ch / 2;
          }
          /** 0=贴角，1=桌面中心；取中间偏内，落在「角—牌堆」之间的视觉空隙 */
          const inwardFrac = 0.44;
          const x = bx + (cx - bx) * inwardFrac;
          const y = by + (cy - by) * inwardFrac;
          return { x, y, r: 0 };
        };

        const cornerSettleWobble = (slot: number, nowMs: number) => {
          const w = Math.sin(nowMs * 0.0022 + slot * 0.66) * 4;
          const dir =
            slot === 0 ? [1, 1] : slot === 1 ? [-1, 1] : slot === 2 ? [1, -1] : [-1, -1];
          return { ox: dir[0]! * w, oy: dir[1]! * w };
        };

        const hitTestSpreadFan = (wx: number, wy: number): number => {
          if (!spreadCompletedLocal || spreadAnim) return -1;
          for (let i = sprites.length - 1; i >= 0; i--) {
            if (pickedSet.has(i)) continue;
            const sp = sprites[i]!;
            if (!sp.visible) continue;
            const dx = wx - sp.x;
            const dy = wy - sp.y;
            const c = Math.cos(sp.rotation);
            const s = Math.sin(sp.rotation);
            const lx = dx * c + dy * s;
            const ly = -dx * s + dy * c;
            if (Math.abs(lx) <= cardPhysW / 2 + 4 && Math.abs(ly) <= cardPhysH / 2 + 4) {
              return i;
            }
          }
          return -1;
        };

        const tryPickSpreadCard = (cardIndex: number) => {
          if (!spreadCompletedLocal || spreadAnim) return;
          if (pickedSet.has(cardIndex)) return;
          if (pickedOrder.length >= PICK_SLOT_COUNT) return;
          const slot = pickedOrder.length;
          const sp = sprites[cardIndex]!;
          const b = cardBodies[cardIndex]!;
          const cardId = hiddenCardIds[cardIndex]!;
          const hand = computeHandSlotBase(slot);
          const reversed = isReversedByRotation(sp.rotation);
          pickFlyAnims.push({
            cardIndex,
            slot,
            startAt: performance.now(),
            duration: PICK_FLY_DURATION_MS,
            fromX: sp.x,
            fromY: sp.y,
            fromR: sp.rotation,
            toX: hand.x,
            toY: hand.y,
            toR: reversed ? Math.PI : hand.r,
          });
          pickedOrder.push(cardIndex);
          pickedCardIds.push(cardId);
          pickedFaceTextures[slot] = null;
          pickedOrientations.push(reversed);
          pickedSet.add(cardIndex);
          void loadCardFaceTexture(cardId).then((faceTex) => {
            if (!aliveRef.current) return;
            if (pickedCardIds[slot] !== cardId) return;
            pickedFaceTextures[slot] = faceTex;
          });
          Body.setStatic(b, true);
          Body.setVelocity(b, { x: 0, y: 0 });
          Body.setAngularVelocity(b, 0);
          Body.setPosition(b, { x: -9000, y: -9000 - cardIndex * 4 });
          b.collisionFilter = { category: 0, mask: 0 };
          spreadHoverLerp[cardIndex] = 0;
        };

        const startRemainCloseToCenter = () => {
          destroySpreadHoverRing();
          const cx = layoutW / 2;
          const cy = layoutH / 2;
          const now = performance.now();
          const indices: number[] = [];
          for (let i = 0; i < sprites.length; i++) {
            if (!pickedSet.has(i)) indices.push(i);
          }
          const ordered = indices
            .map((i) => {
              const b = cardBodies[i]!;
              const dx = b.position.x - cx;
              const dy = b.position.y - cy;
              // 从 12 点方向开始：top=0；逆时针递增到 2π。
              const angleFromTopCCW = (Math.atan2(-dx, -dy) + Math.PI * 2) % (Math.PI * 2);
              return { i, angleFromTopCCW };
            })
            .sort((a, b) => a.angleFromTopCCW - b.angleFromTopCCW);
          const items: RemainCloseItem[] = ordered.map((o, rank) => {
            const sp = sprites[o.i]!;
            return {
              cardIndex: o.i,
              sprite: sp,
              fromX: sp.x,
              fromY: sp.y,
              fromR: sp.rotation,
              startAt: now + rank * REMAIN_CLOSE_STAGGER_MS,
              duration: REMAIN_CLOSE_DURATION_MS,
              toX: cx,
              toY: cy,
              zFinal: rank,
            };
          });
          remainCloseIndices = new Set(items.map((it) => it.cardIndex));
          for (const it of items) {
            it.sprite.zIndex = it.zFinal;
          }
          world.sortChildren();
          remainCloseAnim = { items };
        };

        const onCanvasClick = (clientX: number, clientY: number) => {
          const rect = app.canvas.getBoundingClientRect();
          const sx = rect.width / app.renderer.width;
          const sy = rect.height / app.renderer.height;
          const x = (clientX - rect.left) / sx;
          const y = (clientY - rect.top) / sy;
          if (isPointerOverDeck(x, y)) {
            startSpread();
            return;
          }
          if (spreadCompletedLocal && !spreadAnim && pickedOrder.length < PICK_SLOT_COUNT) {
            const hi = hitTestSpreadFan(x, y);
            if (hi >= 0) tryPickSpreadCard(hi);
          }
        };

        const applyViewportResize = () => {
          if (!aliveRef.current || !application || gatherAnim || spreadAnim || remainCloseAnim || !pixiMount)
            return;

          const { w: nw, h: nh } = readMountRect(pixiMount);
          if (nw < 100 || nh < 100) return;
          if (Math.abs(nw - layoutW) < 4 && Math.abs(nh - layoutH) < 4) return;

          const ox = layoutW / 2;
          const oy = layoutH / 2;
          const nx = nw / 2;
          const ny = nh / 2;
          const sx = nw / layoutW;
          const sy = nh / layoutH;

          if (gatherCompletedLocal && !spreadCompletedLocal) {
            for (const b of cardBodies) {
              Body.setPosition(b, { x: nx, y: ny });
              Body.setAngle(b, 0);
              Body.setVelocity(b, { x: 0, y: 0 });
              Body.setAngularVelocity(b, 0);
            }
            for (let i = 0; i < sprites.length; i++) {
              const sp = sprites[i]!;
              sp.position.set(nx, ny);
              sp.rotation = 0;
            }
          } else if (spreadCompletedLocal) {
            const radius = Math.max(cardPhysH * 1.1, Math.min(nw, nh) * 0.31);
            for (let i = 0; i < cardBodies.length; i++) {
              if (pickedSet.has(i)) {
                const b = cardBodies[i]!;
                Body.setPosition(b, { x: -9000, y: -9000 - i * 4 });
                Body.setAngle(b, 0);
                Body.setVelocity(b, { x: 0, y: 0 });
                Body.setAngularVelocity(b, 0);
                continue;
              }
              const theta = (i / CARD_COUNT) * Math.PI * 2 - Math.PI / 2;
              const px = nx + Math.cos(theta) * radius;
              const py = ny + Math.sin(theta) * radius;
              const rot = theta + Math.PI / 2;
              const b = cardBodies[i]!;
              const sp = sprites[i]!;
              Body.setPosition(b, { x: px, y: py });
              Body.setAngle(b, rot);
              Body.setVelocity(b, { x: 0, y: 0 });
              Body.setAngularVelocity(b, 0);
              sp.position.set(px, py);
              sp.rotation = rot;
              sp.visible = true;
              sp.zIndex = i;
            }
            for (const anim of pickFlyAnims) {
              const hb = computeHandSlotBase(anim.slot, nw, nh);
              anim.toX = hb.x;
              anim.toY = hb.y;
              anim.toR = hb.r;
            }
          } else {
            for (let i = 0; i < cardBodies.length; i++) {
              const b = cardBodies[i]!;
              const px = (b.position.x - ox) * sx + nx;
              const py = (b.position.y - oy) * sy + ny;
              Body.setPosition(b, { x: px, y: py });
              Body.setVelocity(b, { x: b.velocity.x * sx, y: b.velocity.y * sy });
              sprites[i]!.position.set(px, py);
            }
          }

          const nextCard = getCardPhysSize(nw, nh);
          const scaleCW = nextCard.w / cardPhysW;
          const scaleCH = nextCard.h / cardPhysH;
          if (Math.abs(scaleCW - 1) > 0.004 || Math.abs(scaleCH - 1) > 0.004) {
            for (const b of cardBodies) {
              Body.scale(b, scaleCW, scaleCH, b.position);
            }
            for (const sp of sprites) {
              sp.scale.set(nextCard.w / cardTexW, nextCard.h / cardTexH);
            }
            cardPhysW = nextCard.w;
            cardPhysH = nextCard.h;
          }
          const targetPtrR = getPointerRadius(cardPhysH);
          if (Math.abs(targetPtrR / pointerRadius - 1) > 0.004) {
            Body.scale(ptr, targetPtrR / pointerRadius, targetPtrR / pointerRadius, ptr.position);
            pointerRadius = targetPtrR;
          }

          for (const wall of walls) {
            Composite.remove(eng.world, wall);
          }
          walls.length = 0;
          walls.push(
            Bodies.rectangle(nw / 2, -wallT / 2, nw + wallT * 2, wallT, {
              isStatic: true,
              collisionFilter: wallFilter,
            }),
            Bodies.rectangle(nw / 2, nh + wallT / 2, nw + wallT * 2, wallT, {
              isStatic: true,
              collisionFilter: wallFilter,
            }),
            Bodies.rectangle(-wallT / 2, nh / 2, wallT, nh + wallT * 2, {
              isStatic: true,
              collisionFilter: wallFilter,
            }),
            Bodies.rectangle(nw + wallT / 2, nh / 2, wallT, nh + wallT * 2, {
              isStatic: true,
              collisionFilter: wallFilter,
            })
          );
          Composite.add(eng.world, walls);

          app.renderer.resize(nw, nh);
          tableBg.scale.set(nw / bgTw, nh / bgTh);
          layoutW = nw;
          layoutH = nh;
          if (gatherCompletedLocal && !spreadCompletedLocal) {
            applyGatheredCardVisibility();
            rebuildDeckShadowLayer(nw / 2, nh / 2);
          }

        };

        const startGather = () => {
          if (gatherAnim !== null || gatherCompletedLocal) return;
          destroyDeckShadowLayer();
          destroyDeckHoverRing();
          destroySpreadHoverRing();
          destroyPickedGlowAuras();
          pickedOrder = [];
          pickedCardIds = [];
          pickedFaceTextures = Array.from({ length: PICK_SLOT_COUNT }, () => null);
          pickRevealAnims = [];
          pickRevealStarted = false;
          pickRevealDoneSlots.clear();
          pickedOrientations = [];
          pickedSet.clear();
          pickFlyAnims = [];
          postPickCloseStarted = false;
          remainCloseAnim = null;
          remainFadeAnim = null;
          remainCloseIndices = new Set<number>();
          exitToNextPhaseDone = false;
          for (const sp of sprites) {
            sp.visible = true;
          }
          pointerRef.current.active = false;
          Body.setPosition(ptr, { x: -9999, y: -9999 });

          const cx = layoutW / 2;
          const cy = layoutH / 2;

          const order = cardBodies
            .map((b, i) => ({
              i,
              y: b.position.y,
              x: b.position.x,
              dist: Math.hypot(b.position.x - cx, b.position.y - cy),
            }))
            .sort((a, b) => {
              const dy = b.y - a.y;
              if (Math.abs(dy) > 0.5) return dy;
              return a.dist - b.dist;
            });

          for (const b of cardBodies) {
            Composite.remove(eng.world, b);
          }

          const now = performance.now();
          const items: GatherItem[] = order.map((o, rank) => {
            const sp = sprites[o.i]!;
            const b = cardBodies[o.i]!;
            sp.x = b.position.x;
            sp.y = b.position.y;
            sp.rotation = b.angle;
            return {
              sprite: sp,
              fromX: b.position.x,
              fromY: b.position.y,
              fromR: b.angle,
              startAt: now + rank * GATHER_STAGGER_MS,
              duration: GATHER_DURATION_MS,
              toX: cx,
              toY: cy,
              zFinal: rank,
            };
          });

          for (const it of items) {
            it.sprite.zIndex = it.zFinal;
          }
          world.sortChildren();

          gatherAnim = { items };
          if (aliveRef.current) setGatherBusy(true);
        };

        stopShuffleRef.current = startGather;

        onTick = () => {
          if (gatherAnim) {
            const now = performance.now();
            let allDone = true;
            for (const it of gatherAnim.items) {
              if (now < it.startAt) {
                allDone = false;
                continue;
              }
              const u = Math.min(1, (now - it.startAt) / it.duration);
              const p = easeGatherStack(u);
              it.sprite.x = it.fromX + (it.toX - it.fromX) * p;
              it.sprite.y = it.fromY + (it.toY - it.fromY) * p;
              it.sprite.rotation = it.fromR * (1 - p);
              if (u < 1) allDone = false;
            }
            world.sortChildren();
            if (allDone) {
              // 牌已从 world 移除，但 cardBodies 仍保留移除前的坐标；若不同步，下一帧物理分支会把精灵拉回散落位置。
              const cx = layoutW / 2;
              const cy = layoutH / 2;
              for (const b of cardBodies) {
                Body.setPosition(b, { x: cx, y: cy });
                Body.setAngle(b, 0);
                Body.setVelocity(b, { x: 0, y: 0 });
                Body.setAngularVelocity(b, 0);
              }
              for (let i = 0; i < sprites.length; i++) {
                const sp = sprites[i]!;
                sp.position.set(cx, cy);
                sp.rotation = 0;
                sp.tint = 0xffffff;
              }
              gatherAnim = null;
              gatherCompletedLocal = true;
              spreadCompletedLocal = false;
              applyGatheredCardVisibility();
              rebuildDeckShadowLayer(cx, cy);
              if (!deckHoverRing) {
                const g = new Graphics();
                g.eventMode = "none";
                g.zIndex = 2600;
                world.addChild(g);
                deckHoverRing = g;
                world.sortChildren();
              }
              if (!deckHoverAura) {
                const aura = new Sprite(tex);
                aura.anchor.set(0.5, 0.5);
                aura.visible = false;
                aura.eventMode = "none";
                aura.zIndex = 2500;
                aura.tint = 0xf2c14e;
                aura.alpha = 0;
                aura.blendMode = "add";
                world.addChild(aura);
                deckHoverAura = aura;
              }
              if (!deckHoverMaskGlow) {
                const root = new Container();
                root.eventMode = "none";
                root.zIndex = 2550;
                root.visible = false;
                const fill = new Sprite(Texture.WHITE);
                fill.anchor.set(0.5, 0.5);
                fill.tint = 0xffd46b;
                fill.alpha = 0;
                fill.blendMode = "screen";
                const mask = new Sprite(cardMaskTex);
                mask.anchor.set(0.5, 0.5);
                fill.mask = mask;
                root.addChild(fill);
                root.addChild(mask);
                world.addChild(root);
                deckHoverMaskGlow = { root, fill, mask };
              }
              if (aliveRef.current) {
                setGatherBusy(false);
                setGatherDone(true);
              }
              recalcDeckEntropy();
            }
            return;
          }

          if (spreadAnim) {
            const now = performance.now();
            let allDone = true;
            for (const it of spreadAnim.items) {
              if (now < it.startAt) {
                allDone = false;
                continue;
              }
              const u = Math.min(1, (now - it.startAt) / it.duration);
              const p = easeGatherStack(u);
              it.sprite.x = it.fromX + (it.toX - it.fromX) * p;
              it.sprite.y = it.fromY + (it.toY - it.fromY) * p;
              it.sprite.rotation = it.fromR + (it.toR - it.fromR) * p;
              it.sprite.zIndex = it.zFinal;
              it.sprite.visible = true;
              if (u < 1) allDone = false;
            }
            world.sortChildren();
            if (allDone) {
              for (let i = 0; i < spreadAnim.items.length; i++) {
                const it = spreadAnim.items[i]!;
                const b = cardBodies[i]!;
                Body.setPosition(b, { x: it.toX, y: it.toY });
                Body.setAngle(b, it.toR);
                Body.setVelocity(b, { x: 0, y: 0 });
                Body.setAngularVelocity(b, 0);
              }
              spreadAnim = null;
              spreadCompletedLocal = true;
              if (!spreadHoverRing) {
                const g = new Graphics();
                g.eventMode = "none";
                g.zIndex = 2600;
                world.addChild(g);
                spreadHoverRing = g;
              }
              if (!spreadHoverAura) {
                const aura = new Sprite(tex);
                aura.anchor.set(0.5, 0.5);
                aura.visible = false;
                aura.eventMode = "none";
                aura.zIndex = 2500;
                aura.tint = 0xf2c14e;
                aura.alpha = 0;
                aura.blendMode = "add";
                world.addChild(aura);
                spreadHoverAura = aura;
              }
              if (!spreadHoverMaskGlow) {
                const root = new Container();
                root.eventMode = "none";
                root.zIndex = 2550;
                root.visible = false;
                const fill = new Sprite(Texture.WHITE);
                fill.anchor.set(0.5, 0.5);
                fill.tint = 0xffd46b;
                fill.alpha = 0;
                fill.blendMode = "screen";
                const mask = new Sprite(cardMaskTex);
                mask.anchor.set(0.5, 0.5);
                mask.tint = 0xffffff;
                fill.mask = mask;
                root.addChild(fill);
                root.addChild(mask);
                world.addChild(root);
                spreadHoverMaskGlow = { root, fill, mask };
              }
              recalcDeckEntropy();
            }
            return;
          }

          const p = pointerRef.current;
          if (p.active) {
            Body.setPosition(ptr, { x: p.x, y: p.y });
          } else {
            Body.setPosition(ptr, { x: -9999, y: -9999 });
          }
          const physDt = Math.min(
            Math.max(1, app.ticker.deltaMS * PHYS_TIME_SCALE),
            MAX_PHYS_STEP_MS
          );
          Engine.update(eng, physDt);

          if (!gatherAnim && !gatherCompletedLocal) {
            clampCardBodiesToTable(Body, cardBodies, layoutW, layoutH, cardPhysW, cardPhysH);

            const dt = physDt || 8;
            const cxPull = layoutW / 2;
            const cyPull = layoutH / 2;
            const edgeZone = Math.min(layoutW, layoutH) * EDGE_PULL_ZONE_FRAC;
            const pad = TABLE_PAD + Math.max(cardPhysW, cardPhysH) * 0.35;
            for (const b of cardBodies) {
              const px = b.position.x;
              const py = b.position.y;
              const dEdge = Math.min(px - pad, layoutW - pad - px, py - pad, layoutH - pad - py);
              if (dEdge >= edgeZone) continue;
              const w = Math.min(1, Math.max(0, (edgeZone - dEdge) / edgeZone));
              const wx = w * w;
              const dx = cxPull - px;
              const dy = cyPull - py;
              const len = Math.hypot(dx, dy);
              if (len < 0.5) continue;
              const f = EDGE_PULL_STRENGTH * wx * dt * b.mass;
              Body.applyForce(b, b.position, {
                x: (dx / len) * f,
                y: (dy / len) * f,
              });
            }
          }

          const flyingSet = new Set(pickFlyAnims.map((a) => a.cardIndex));
          const order = cardBodies
            .map((b, i) => ({ b, i }))
            .sort((a, b) => a.b.position.y - b.b.position.y);
          for (let k = 0; k < order.length; k++) {
            const { b, i } = order[k]!;
            const sp = sprites[i]!;
            const skipBodySync =
              spreadCompletedLocal &&
              (pickedSet.has(i) || flyingSet.has(i) || remainCloseIndices.has(i));
            if (!skipBodySync) {
              syncSpriteToBody(sp, b);
            }
            if (!gatherCompletedLocal) {
              // 贴边时加入轻微“受压形变”（仅视觉），强化推墙反馈并降低突兀感。
              const edgeDist = Math.min(
                b.position.x,
                layoutW - b.position.x,
                b.position.y,
                layoutH - b.position.y
              );
              const nearEdgeT = Math.min(
                1,
                Math.max(0, (Math.min(cardPhysW, cardPhysH) * 0.7 - edgeDist) / Math.max(1, Math.min(cardPhysW, cardPhysH) * 0.7))
              );
              if (nearEdgeT > 0.001) {
                const sxBase = cardPhysW / cardTexW;
                const syBase = cardPhysH / cardTexH;
                const squeeze = 1 - 0.12 * nearEdgeT;
                const stretch = 1 + 0.1 * nearEdgeT;
                const vx = Math.abs(b.velocity.x);
                const vy = Math.abs(b.velocity.y);
                if (vx >= vy) {
                  sp.scale.set(sxBase * squeeze, syBase * stretch);
                } else {
                  sp.scale.set(sxBase * stretch, syBase * squeeze);
                }
              } else {
                sp.scale.set(cardPhysW / cardTexW, cardPhysH / cardTexH);
              }
              sp.zIndex = k;
            }
          }

          if (gatherCompletedLocal && !spreadCompletedLocal) {
            const cx = layoutW / 2;
            const cy = layoutH / 2;
            const pr = pointerRef.current;
            const inside =
              pr.active &&
              Math.abs(pr.x - cx) <= cardPhysW / 2 + DECK_HOVER_HIT_PAD &&
              Math.abs(pr.y - cy) <= cardPhysH / 2 + DECK_HOVER_HIT_PAD;
            const target = inside ? 1 : 0;
            const dm = app.ticker.deltaMS || 16;
            const blend = Math.min(1, dm * DECK_HOVER_BLEND_PER_MS);
            deckHoverLerp += (target - deckHoverLerp) * blend;
            const breathe = 0.5 + 0.5 * Math.sin(performance.now() * 0.0022);
            const breatheSoft = 0.72 + 0.28 * breathe;

            if (deckHoverRing) {
              deckHoverRing.clear();
              const t = deckHoverLerp;
              if (t > 0.02) {
                const pad = 4 + 5 * t;
                const rw = cardPhysW + pad * 2;
                const rh = cardPhysH + pad * 2;
                const rr = Math.min(16, Math.min(cardPhysW, cardPhysH) * 0.09);
                deckHoverRing
                  .roundRect(cx - rw / 2, cy - rh / 2, rw, rh, rr)
                  .stroke({ width: 3, color: 0xf2c14e, alpha: (0.4 + 0.28 * breatheSoft) * t });
                deckHoverRing.filters = [
                  new BlurFilter({
                    strength: (3 + 6 * breatheSoft) * t,
                    quality: 2,
                    kernelSize: 9,
                  }),
                ];
              } else {
                deckHoverRing.filters = null;
              }
            }

            const sxBase = cardPhysW / cardTexW;
            const syBase = cardPhysH / cardTexH;
            for (const sp of sprites) {
              if (!sp.visible) {
                sp.scale.set(sxBase, syBase);
                continue;
              }
              const t = deckHoverLerp;
              const s = 1 + (0.026 + 0.012 * breatheSoft) * t;
              sp.scale.set(sxBase * s, syBase * s);
              const tr = Math.round(255 - 8 * t);
              const tg = Math.round(255 - 12 * t);
              const tb = Math.round(255 - 34 * t);
              sp.tint = (tr << 16) | (tg << 8) | tb;
            }
            if (deckHoverAura) {
              const t = deckHoverLerp;
              if (t > 0.01) {
                deckHoverAura.visible = true;
                deckHoverAura.position.set(cx, cy);
                const auraScale = 1.12 + 0.12 * t;
                deckHoverAura.scale.set(sxBase * auraScale, syBase * auraScale);
                deckHoverAura.alpha = (0.22 + 0.34 * breatheSoft) * t;
                deckHoverAura.filters = [
                  new BlurFilter({
                    strength: (8 + 11 * breatheSoft) * t,
                    quality: 2,
                    kernelSize: 11,
                  }),
                ];
              } else {
                deckHoverAura.visible = false;
                deckHoverAura.alpha = 0;
                deckHoverAura.filters = null;
              }
            }
            if (deckHoverMaskGlow) {
              const t = deckHoverLerp;
              if (t > 0.01) {
                deckHoverMaskGlow.root.visible = true;
                deckHoverMaskGlow.root.position.set(cx, cy);
                deckHoverMaskGlow.fill.width = cardPhysW;
                deckHoverMaskGlow.fill.height = cardPhysH;
                deckHoverMaskGlow.fill.alpha = (0.16 + 0.28 * breatheSoft) * t;
                deckHoverMaskGlow.fill.filters = [
                  new BlurFilter({
                    strength: (0.6 + 1.4 * breatheSoft) * t,
                    quality: 2,
                    kernelSize: 7,
                  }),
                ];
                deckHoverMaskGlow.mask.scale.set(sxBase, syBase);
              } else {
                deckHoverMaskGlow.root.visible = false;
                deckHoverMaskGlow.fill.alpha = 0;
                deckHoverMaskGlow.fill.filters = null;
              }
            }

            app.canvas.style.cursor = deckHoverLerp > 0.08 ? "pointer" : "default";
          } else if (spreadCompletedLocal) {
            const cx = layoutW / 2;
            const cy = layoutH / 2;
            const nowMs = performance.now();
            const breathe = 0.5 + 0.5 * Math.sin(nowMs * 0.0022);
            const breatheSoft = 0.72 + 0.28 * breathe;

            if (remainCloseAnim) {
              let allCloseDone = true;
              for (const it of remainCloseAnim.items) {
                if (nowMs < it.startAt) {
                  allCloseDone = false;
                  continue;
                }
                const u = Math.min(1, (nowMs - it.startAt) / it.duration);
                const p = easeGatherStack(u);
                it.sprite.x = it.fromX + (it.toX - it.fromX) * p;
                it.sprite.y = it.fromY + (it.toY - it.fromY) * p;
                it.sprite.rotation = it.fromR * (1 - p);
                it.sprite.zIndex = it.zFinal;
                it.sprite.visible = true;
                it.sprite.alpha = 1;
                if (u < 1) allCloseDone = false;
              }
              world.sortChildren();
              if (allCloseDone) {
                for (const it of remainCloseAnim.items) {
                  const b = cardBodies[it.cardIndex]!;
                  Body.setPosition(b, { x: cx, y: cy });
                  Body.setAngle(b, 0);
                  Body.setVelocity(b, { x: 0, y: 0 });
                  Body.setAngularVelocity(b, 0);
                  it.sprite.position.set(cx, cy);
                  it.sprite.rotation = 0;
                }
                remainCloseAnim = null;
                remainCloseIndices.clear();
                remainFadeAnim = { startAt: nowMs };
              }
            }

            if (remainFadeAnim && !exitToNextPhaseDone) {
              const uFade = Math.min(1, (nowMs - remainFadeAnim.startAt) / REMAIN_FADE_DURATION_MS);
              const a = 1 - easeOutCubic(uFade);
              for (let i = 0; i < sprites.length; i++) {
                if (pickedSet.has(i)) continue;
                sprites[i]!.alpha = a;
              }
              if (uFade >= 1) {
                remainFadeAnim = null;
                for (let i = 0; i < sprites.length; i++) {
                  if (!pickedSet.has(i)) {
                    sprites[i]!.visible = false;
                    sprites[i]!.alpha = 0;
                  }
                }
                if (!pickRevealStarted) {
                  pickRevealStarted = true;
                  pickRevealAnims = pickedOrder.map((_, slot) => ({
                    slot,
                    startAt: nowMs + slot * PICK_REVEAL_STAGGER_MS,
                    duration: PICK_REVEAL_DURATION_MS,
                  }));
                }
              }
            }

            if (pickRevealAnims.length > 0) {
              const nextRevealAnims: PickRevealAnim[] = [];
              for (const anim of pickRevealAnims) {
                const u = Math.min(1, (nowMs - anim.startAt) / anim.duration);
                if (u >= 1) {
                  pickRevealDoneSlots.add(anim.slot);
                } else {
                  nextRevealAnims.push(anim);
                }
              }
              pickRevealAnims = nextRevealAnims;
            }

            const nextFlies: PickFlyAnim[] = [];
            for (const anim of pickFlyAnims) {
              const u = Math.min(1, (nowMs - anim.startAt) / anim.duration);
              const p = easeOutCubic(u);
              const sp = sprites[anim.cardIndex]!;
              sp.x = anim.fromX + (anim.toX - anim.fromX) * p;
              sp.y = anim.fromY + (anim.toY - anim.fromY) * p;
              sp.rotation = anim.fromR + (anim.toR - anim.fromR) * p;
              const baseSX = cardPhysW / cardTexW;
              const baseSY = cardPhysH / cardTexH;
              sp.scale.set(baseSX * (1 + 0.02 * p), baseSY * (1 + 0.02 * p));
              sp.tint = 0xffffff;
              sp.zIndex = 3200 + anim.slot;
              if (u < 1) {
                nextFlies.push(anim);
              } else {
                const hb = computeHandSlotBase(anim.slot);
                const { ox, oy } = cornerSettleWobble(anim.slot, nowMs);
                sp.position.set(hb.x + ox, hb.y + oy);
                sp.rotation = hb.r;
                sp.scale.set(baseSX, baseSY);
              }
            }
            pickFlyAnims = nextFlies;

            if (
              pickFlyAnims.length === 0 &&
              pickedOrder.length === PICK_SLOT_COUNT &&
              !postPickCloseStarted &&
              !remainCloseAnim &&
              !remainFadeAnim
            ) {
              postPickCloseStarted = true;
              startRemainCloseToCenter();
            }

            const flyingIdx = new Set(pickFlyAnims.map((a) => a.cardIndex));
            for (let slot = 0; slot < pickedOrder.length; slot++) {
              const idx = pickedOrder[slot]!;
              if (flyingIdx.has(idx)) continue;
              const sp = sprites[idx]!;
              const hb = computeHandSlotBase(slot);
              const { ox, oy } = cornerSettleWobble(slot, nowMs);
              sp.position.set(hb.x + ox, hb.y + oy);
              sp.rotation = hb.r + (pickedOrientations[slot] ? Math.PI : 0);
              sp.tint = 0xffffff;
              const baseSX = cardPhysW / cardTexW;
              const baseSY = cardPhysH / cardTexH;
              let revealU = pickRevealDoneSlots.has(slot) ? 1 : 0;
              const runningReveal = pickRevealAnims.find((a) => a.slot === slot);
              if (runningReveal) {
                revealU = Math.min(1, Math.max(0, (nowMs - runningReveal.startAt) / runningReveal.duration));
              }
              const pinch = Math.max(0.08, Math.abs(1 - 2 * revealU));
              const sxSign = revealU < 0.5 ? 1 : -1;
              const faceTex = pickedFaceTextures[slot];
              const shownTex = revealU >= 0.5 && faceTex ? faceTex : tex;
              if (sp.texture !== shownTex) sp.texture = shownTex;
              const shownTexW = Math.max(1, shownTex.orig.width);
              const shownTexH = Math.max(1, shownTex.orig.height);
              const shownSX = cardPhysW / shownTexW;
              const shownSY = cardPhysH / shownTexH;
              sp.scale.set(shownSX * pinch * sxSign, shownSY);
              sp.zIndex = 3100 + slot;
              if (!pickedGlowAuras[slot]) {
                const aura = new Sprite(tex);
                aura.anchor.set(0.5, 0.5);
                aura.eventMode = "none";
                aura.blendMode = "add";
                aura.tint = 0xf2c14e;
                aura.alpha = 0;
                aura.visible = false;
                aura.zIndex = 3090 + slot;
                world.addChild(aura);
                pickedGlowAuras[slot] = aura;
              }
              const aura = pickedGlowAuras[slot]!;
              const breatheAura = 0.5 + 0.5 * Math.sin(nowMs * 0.0026 + slot * 0.7);
              aura.visible = true;
              aura.position.set(sp.x, sp.y);
              aura.rotation = sp.rotation;
              const auraScale = 1.08 + 0.09 * breatheAura;
              aura.scale.set(baseSX * auraScale, baseSY * auraScale);
              aura.alpha = 0.18 + 0.2 * breatheAura;
              aura.filters = [
                new BlurFilter({
                  strength: 8 + 10 * breatheAura,
                  quality: 2,
                  kernelSize: 11,
                }),
              ];
            }
            for (let slot = pickedOrder.length; slot < PICK_SLOT_COUNT; slot++) {
              const aura = pickedGlowAuras[slot];
              if (!aura) continue;
              aura.visible = false;
              aura.alpha = 0;
              aura.filters = null;
            }

            if (
              !exitToNextPhaseDone &&
              pickedOrder.length === PICK_SLOT_COUNT &&
              pickRevealStarted &&
              pickRevealDoneSlots.size >= PICK_SLOT_COUNT
            ) {
              exitToNextPhaseDone = true;
              queueMicrotask(() => {
                if (aliveRef.current) onCompleteRef.current(snapshotSeed(), [...pickedOrientations]);
              });
            }

            const pr = pointerRef.current;
            let hoveredIndex = -1;
            if (
              pr.active &&
              pickedOrder.length < PICK_SLOT_COUNT &&
              !remainCloseAnim &&
              !remainFadeAnim
            ) {
              for (let i = sprites.length - 1; i >= 0; i--) {
                if (pickedSet.has(i)) continue;
                const sp = sprites[i]!;
                if (!sp.visible) continue;
                const dx = pr.x - sp.x;
                const dy = pr.y - sp.y;
                const c = Math.cos(sp.rotation);
                const s = Math.sin(sp.rotation);
                const lx = dx * c + dy * s;
                const ly = -dx * s + dy * c;
                if (Math.abs(lx) <= cardPhysW / 2 + 3 && Math.abs(ly) <= cardPhysH / 2 + 3) {
                  hoveredIndex = i;
                  break;
                }
              }
            }

            const dm = app.ticker.deltaMS || 16;
            const blend = Math.min(1, dm * 0.02);
            for (let i = 0; i < sprites.length; i++) {
              if (pickedSet.has(i) || flyingIdx.has(i) || remainCloseIndices.has(i)) continue;
              if (remainFadeAnim) continue;
              const b = cardBodies[i]!;
              const sp = sprites[i]!;
              const target = i === hoveredIndex ? 1 : 0;
              spreadHoverLerp[i] += (target - spreadHoverLerp[i]!) * blend;
              const t = spreadHoverLerp[i]!;
              const nx0 = b.position.x - cx;
              const ny0 = b.position.y - cy;
              const len = Math.hypot(nx0, ny0) || 1;
              const nx = nx0 / len;
              const ny = ny0 / len;
              const lift = (6 + 4 * breatheSoft) * t;
              sp.x = b.position.x + nx * lift;
              sp.y = b.position.y + ny * lift;
              const baseSX = cardPhysW / cardTexW;
              const baseSY = cardPhysH / cardTexH;
              const sHover = 1 + (0.026 + 0.012 * breatheSoft) * t;
              sp.scale.set(baseSX * sHover, baseSY * sHover);
              const tr = Math.round(255 - 8 * t);
              const tg = Math.round(255 - 12 * t);
              const tb = Math.round(255 - 34 * t);
              sp.tint = (tr << 16) | (tg << 8) | tb;
              sp.zIndex = i + (i === hoveredIndex ? 1000 : 0);
            }

            if (spreadHoverRing) {
              spreadHoverRing.clear();
              if (hoveredIndex >= 0) {
                const sp = sprites[hoveredIndex]!;
                const t = spreadHoverLerp[hoveredIndex]!;
                const pad = 4 + 4 * t;
                const rw = cardPhysW + pad * 2;
                const rh = cardPhysH + pad * 2;
                const rr = Math.min(16, Math.min(cardPhysW, cardPhysH) * 0.09);
                spreadHoverRing.position.set(sp.x, sp.y);
                spreadHoverRing.rotation = sp.rotation;
                spreadHoverRing
                  .roundRect(-rw / 2, -rh / 2, rw, rh, rr)
                  .stroke({ width: 3, color: 0xf2c14e, alpha: (0.4 + 0.28 * breatheSoft) * t });
                spreadHoverRing.filters = [
                  new BlurFilter({
                    strength: (3 + 6 * breatheSoft) * t,
                    quality: 2,
                    kernelSize: 9,
                  }),
                ];
              } else {
                spreadHoverRing.filters = null;
              }
            }

            if (spreadHoverAura) {
              if (hoveredIndex >= 0) {
                const sp = sprites[hoveredIndex]!;
                const t = spreadHoverLerp[hoveredIndex]!;
                spreadHoverAura.visible = true;
                spreadHoverAura.position.set(sp.x, sp.y);
                spreadHoverAura.rotation = sp.rotation;
                const baseSX = cardPhysW / cardTexW;
                const baseSY = cardPhysH / cardTexH;
                const auraScale = 1.12 + 0.12 * t;
                spreadHoverAura.scale.set(baseSX * auraScale, baseSY * auraScale);
                spreadHoverAura.alpha = (0.22 + 0.34 * breatheSoft) * t;
                spreadHoverAura.tint = 0xf2c14e;
                spreadHoverAura.filters = [
                  new BlurFilter({
                    strength: (8 + 11 * breatheSoft) * t,
                    quality: 2,
                    kernelSize: 11,
                  }),
                ];
              } else {
                spreadHoverAura.visible = false;
                spreadHoverAura.alpha = 0;
                spreadHoverAura.filters = null;
              }
            }

            if (spreadHoverMaskGlow) {
              if (hoveredIndex >= 0) {
                const sp = sprites[hoveredIndex]!;
                const t = spreadHoverLerp[hoveredIndex]!;
                const baseSX = cardPhysW / cardTexW;
                const baseSY = cardPhysH / cardTexH;
                spreadHoverMaskGlow.root.visible = true;
                spreadHoverMaskGlow.root.position.set(sp.x, sp.y);
                spreadHoverMaskGlow.root.rotation = sp.rotation;
                spreadHoverMaskGlow.fill.width = cardPhysW;
                spreadHoverMaskGlow.fill.height = cardPhysH;
                spreadHoverMaskGlow.fill.alpha = (0.16 + 0.28 * breatheSoft) * t;
                spreadHoverMaskGlow.fill.tint = 0xffd46b;
                spreadHoverMaskGlow.fill.filters = [
                  new BlurFilter({
                    strength: (0.6 + 1.4 * breatheSoft) * t,
                    quality: 2,
                    kernelSize: 7,
                  }),
                ];
                spreadHoverMaskGlow.mask.scale.set(baseSX, baseSY);
              } else {
                spreadHoverMaskGlow.root.visible = false;
                spreadHoverMaskGlow.fill.alpha = 0;
                spreadHoverMaskGlow.fill.filters = null;
              }
            }

            app.canvas.style.cursor =
              remainCloseAnim || remainFadeAnim
                ? "default"
                : pickedOrder.length < PICK_SLOT_COUNT && hoveredIndex >= 0
                  ? "pointer"
                  : "default";
          } else {
            deckHoverLerp = 0;
            const sxB = cardPhysW / cardTexW;
            const syB = cardPhysH / cardTexH;
            for (const sp of sprites) {
              sp.scale.set(sxB, syB);
            }
            if (spreadHoverRing) {
              spreadHoverRing.clear();
              spreadHoverRing.filters = null;
            }
            if (deckHoverRing) {
              deckHoverRing.clear();
              deckHoverRing.filters = null;
            }
            if (deckHoverAura) {
              deckHoverAura.visible = false;
              deckHoverAura.alpha = 0;
              deckHoverAura.filters = null;
            }
            if (deckHoverMaskGlow) {
              deckHoverMaskGlow.root.visible = false;
              deckHoverMaskGlow.fill.alpha = 0;
              deckHoverMaskGlow.fill.filters = null;
            }
            if (spreadHoverAura) {
              spreadHoverAura.visible = false;
              spreadHoverAura.alpha = 0;
              spreadHoverAura.filters = null;
            }
            if (spreadHoverMaskGlow) {
              spreadHoverMaskGlow.root.visible = false;
              spreadHoverMaskGlow.fill.alpha = 0;
              spreadHoverMaskGlow.fill.filters = null;
            }
            spreadHoverLerp.fill(0);
            app.canvas.style.cursor = "";
          }

          world.sortChildren();
          recalcDeckEntropy();
        };
        app.ticker.add(onTick);
        recalcDeckEntropy();

        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            cancelAnimationFrame(resizeRafId);
            resizeRafId = requestAnimationFrame(() => {
              if (!aliveRef.current) return;
              applyViewportResize();
            });
          });
          resizeObserver.observe(pixiMount);
          requestAnimationFrame(() => {
            if (aliveRef.current) applyViewportResize();
          });
        }

        if (aliveRef.current) {
          setStageReady(true);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (aliveRef.current) setLoadError(msg);
      }
    };

    void boot();

    return () => {
      aliveRef.current = false;
      cancelAnimationFrame(resizeRafId);
      resizeRafId = 0;
      resizeObserver?.disconnect();
      resizeObserver = null;
      stopShuffleRef.current = null;
      gatherAnim = null;
      spreadAnim = null;
      gatherCompletedLocal = false;
      spreadCompletedLocal = false;
      deckShadowLayer = null;
      deckHoverRing = null;
      deckHoverAura = null;
      deckHoverMaskGlow = null;
      spreadHoverRing = null;
      spreadHoverAura = null;
      spreadHoverMaskGlow = null;
      pickedGlowAuras = [];
      pickRevealAnims = [];
      pickRevealStarted = false;
      pickRevealDoneSlots = new Set<number>();
      deckHoverLerp = 0;
      spreadHoverLerp = [];
      postPickCloseStarted = false;
      remainCloseAnim = null;
      remainFadeAnim = null;
      remainCloseIndices = new Set<number>();
      exitToNextPhaseDone = false;
      setStageReady(false);
      setGatherBusy(false);
      setGatherDone(false);
      if (application && onTick) {
        application.ticker.remove(onTick);
      }
      if (engine) {
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      }
      engine = null;
      if (application) {
        application.destroy(true);
        application = null;
      }
      host.innerHTML = "";
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col animate-fade-in">
      <div className="card flex min-h-0 h-full max-h-full flex-col gap-3 p-4 sm:p-5">
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onBack} className="btn-ghost px-4 py-2 text-sm">
            返回
          </button>
          <button
            type="button"
            className="btn-ghost px-4 py-2 text-sm border border-amber-600/50 text-amber-100/90 hover:bg-amber-900/20 disabled:opacity-40 disabled:pointer-events-none"
            disabled={!stageReady || gatherBusy || gatherDone}
            onClick={() => stopShuffleRef.current?.()}
          >
            {gatherBusy ? "收拢中…" : "停止洗牌"}
          </button>
        </div>

        <div
          ref={hostRef}
          className="relative w-full flex-1 min-h-[200px] rounded-xl border border-gray-700/60 bg-[#0b0e18] overflow-hidden"
        />
        {loadError && (
          <p className="text-sm text-red-400 shrink-0">
            贴图加载失败：{loadError}（请确认 {CARD_BACK_URL} 可访问）
          </p>
        )}
      </div>
    </div>
  );
}
