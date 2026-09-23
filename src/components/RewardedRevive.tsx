"use client";

import Script from "next/script";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/language-context";
import { getAdSenseConfig, isLocalAdPreview } from "@/lib/adsense";
import styles from "./RewardedRevive.module.css";

type RewardedAdState = "idle" | "loading" | "ready" | "watching" | "unavailable" | "closed" | "granted";

type RewardedSlot = {
  addService: (service: unknown) => RewardedSlot;
};

type RewardedReadyEvent = {
  slot: RewardedSlot;
  makeRewardedVisible: () => void;
};

type RewardedEvent = {
  slot: RewardedSlot;
};

type SlotRenderEndedEvent = {
  slot: RewardedSlot;
  isEmpty?: boolean;
};

type PubAds = {
  addEventListener: (
    name: "rewardedSlotReady" | "rewardedSlotGranted" | "rewardedSlotClosed" | "slotRenderEnded",
    callback: (event: RewardedReadyEvent | RewardedEvent | SlotRenderEndedEvent) => void,
  ) => void;
};

type Googletag = {
  cmd: Array<() => void>;
  enums?: { OutOfPageFormat?: { REWARDED?: string } };
  pubads?: () => PubAds;
  defineOutOfPageSlot?: (path: string, format: string) => RewardedSlot | null;
  enableServices?: () => void;
  display?: (slot: RewardedSlot) => void;
  destroySlots?: (slots?: RewardedSlot[]) => void;
};

declare global {
  interface Window {
    googletag?: Googletag;
  }
}

const COPY = {
  en: {
    eyebrow: "REWARDED PLAY",
    title: "One more try?",
    description: "Choose to watch one ad and receive one extra chance. Skipping it will not affect normal replay.",
    watch: "Watch ad to continue",
    noThanks: "No thanks",
    loading: "Preparing the ad…",
    watching: "The ad is playing…",
    closed: "The ad was closed before the reward was granted. You can still replay normally.",
    unavailable: "Rewarded ads are not configured here yet. You can still replay normally.",
  },
  zh: {
    eyebrow: "奖励机会",
    title: "再来一次？",
    description: "自愿观看一次广告，获得一次额外机会。跳过广告不会影响正常重玩。",
    watch: "观看广告继续",
    noThanks: "暂不观看",
    loading: "正在准备广告…",
    watching: "广告播放中…",
    closed: "广告在发放奖励前关闭了，你仍然可以正常重新开始。",
    unavailable: "奖励广告暂未配置，你仍然可以正常重新开始。",
  },
  es: {
    eyebrow: "JUEGO CON RECOMPENSA",
    title: "¿Un intento más?",
    description: "Elige ver un anuncio para recibir una oportunidad extra. Omitirlo no afecta al reinicio normal.",
    watch: "Ver anuncio y continuar",
    noThanks: "Ahora no",
    loading: "Preparando el anuncio…",
    watching: "El anuncio se está reproduciendo…",
    closed: "El anuncio se cerró antes de conceder la recompensa. Puedes reiniciar normalmente.",
    unavailable: "Los anuncios con recompensa aún no están configurados aquí. Puedes reiniciar normalmente.",
  },
} as const;

export function RewardedRevive({
  gameId,
  iframeRef,
}: {
  gameId: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];
  const config = getAdSenseConfig();
  const [eligible, setEligible] = useState(false);
  const [scriptRequested, setScriptRequested] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [adState, setAdState] = useState<RewardedAdState>("idle");
  const slotRef = useRef<RewardedSlot | null>(null);
  const readyEventRef = useRef<RewardedReadyEvent | null>(null);
  const rewardGrantedRef = useRef(false);
  const usedReviveRef = useRef(false);

  useEffect(() => {
    setEligible(
      config.mode === "live"
      && Boolean(config.rewardedUnitPath)
      && !isLocalAdPreview(window.location.hostname),
    );
  }, [config.mode, config.rewardedUnitPath]);

  const clearSlot = useCallback(() => {
    if (slotRef.current) {
      window.googletag?.destroySlots?.([slotRef.current]);
    }
    slotRef.current = null;
    readyEventRef.current = null;
    rewardGrantedRef.current = false;
  }, []);

  const sendToGame = useCallback((message: Record<string, unknown>) => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      { source: "mindbench-host", game: gameId, ...message },
      window.location.origin,
    );
  }, [gameId, iframeRef]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      const data = event.data;
      if (!data || data.source !== "mindbench-mini-game" || data.game !== gameId || data.type !== "state") return;

      if (data.state === "playing") {
        usedReviveRef.current = false;
        setPromptVisible(false);
        setAdState("idle");
        clearSlot();
        return;
      }

      if (data.state === "won") {
        setPromptVisible(false);
        clearSlot();
        return;
      }

      if (data.state === "lost" && !usedReviveRef.current) {
        setPromptVisible(true);
        if (eligible) {
          setAdState("loading");
          setScriptRequested(true);
        } else {
          setAdState("unavailable");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [clearSlot, eligible, gameId, iframeRef]);

  useEffect(() => {
    if (!eligible || !scriptReady || !promptVisible || slotRef.current || !config.rewardedUnitPath) return;

    const tag = window.googletag;
    if (!tag) {
      setAdState("unavailable");
      return;
    }

    tag.cmd = tag.cmd || [];
    tag.cmd.push(() => {
      const format = tag.enums?.OutOfPageFormat?.REWARDED;
      const pubads = tag.pubads?.();
      if (!format || !pubads || !tag.defineOutOfPageSlot || !tag.display) {
        setAdState("unavailable");
        return;
      }

      const slot = tag.defineOutOfPageSlot(config.rewardedUnitPath as string, format);
      if (!slot) {
        setAdState("unavailable");
        return;
      }

      slot.addService(pubads);
      slotRef.current = slot;

      pubads.addEventListener("rewardedSlotReady", (event) => {
        const readyEvent = event as RewardedReadyEvent;
        if (readyEvent.slot !== slot) return;
        readyEventRef.current = readyEvent;
        setAdState("ready");
      });

      pubads.addEventListener("rewardedSlotGranted", (event) => {
        if ((event as RewardedEvent).slot !== slot || rewardGrantedRef.current) return;
        rewardGrantedRef.current = true;
        usedReviveRef.current = true;
        setAdState("granted");
        setPromptVisible(false);
        sendToGame({ type: "revive" });
      });

      pubads.addEventListener("rewardedSlotClosed", (event) => {
        if ((event as RewardedEvent).slot !== slot) return;
        if (!rewardGrantedRef.current) setAdState("closed");
        tag.destroySlots?.([slot]);
        slotRef.current = null;
        readyEventRef.current = null;
      });

      pubads.addEventListener("slotRenderEnded", (event) => {
        const renderEvent = event as SlotRenderEndedEvent;
        if (renderEvent.slot !== slot || !renderEvent.isEmpty) return;
        setAdState("unavailable");
        clearSlot();
      });

      tag.enableServices?.();
      tag.display(slot);
    });
  }, [clearSlot, config.rewardedUnitPath, eligible, promptVisible, scriptReady, sendToGame]);

  useEffect(() => () => clearSlot(), [clearSlot]);

  if (!promptVisible) {
    return scriptRequested && eligible ? (
      <Script
        id="mindbench-gpt-rewarded"
        src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setAdState("unavailable")}
      />
    ) : null;
  }

  const statusText = adState === "loading"
    ? copy.loading
    : adState === "watching"
      ? copy.watching
      : adState === "closed"
        ? copy.closed
      : !eligible || adState === "unavailable"
        ? copy.unavailable
        : "";

  return (
    <>
      {scriptRequested && eligible && (
        <Script
          id="mindbench-gpt-rewarded"
          src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() => setAdState("unavailable")}
        />
      )}
      <aside className={styles.prompt} role="dialog" aria-label={copy.title}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h2 className={styles.title}>{copy.title}</h2>
        <p className={styles.description}>{copy.description}</p>
        {statusText && <p className={styles.status}>{statusText}</p>}
        <div className={styles.actions}>
          <button
            className={styles.watch}
            type="button"
            disabled={adState !== "ready"}
            onClick={() => {
              const readyEvent = readyEventRef.current;
              if (!readyEvent) return;
              setAdState("watching");
              readyEvent.makeRewardedVisible();
            }}
          >
            {copy.watch}
          </button>
          <button
            className={styles.dismiss}
            type="button"
            onClick={() => {
              setPromptVisible(false);
              clearSlot();
            }}
          >
            {copy.noThanks}
          </button>
        </div>
      </aside>
    </>
  );
}
