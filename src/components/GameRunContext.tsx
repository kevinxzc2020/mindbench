"use client";

import { createContext, useContext, useEffect } from "react";

export const GameRunContext = createContext<() => void>(() => {});

/** An internal restart must clear the shared result, just like the wrapper's retry. */
export function useGameRunPhase(phase: string) {
  const clearResult = useContext(GameRunContext);
  useEffect(() => {
    if (["idle", "playing", "showing", "countdown", "running", "waiting"].includes(phase)) clearResult();
  }, [phase, clearResult]);
  useEffect(() => {
    if (!["playing", "showing", "input", "countdown", "running", "waiting", "green"].includes(phase)) return;
    let frame = 0;
    const alignBoard = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => document.getElementById("mb-game-area")?.scrollIntoView({ block: "start", behavior: "instant" }));
    };
    alignBoard();
    window.addEventListener("orientationchange", alignBoard);
    const resize = () => { if (window.innerHeight < 520) alignBoard(); };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("orientationchange", alignBoard); window.removeEventListener("resize", resize); };
  }, [phase]);
}
