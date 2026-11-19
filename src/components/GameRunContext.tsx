"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { trackGame } from "@/lib/analytics";
import type { Difficulty } from "@/lib/difficulty";

/** What the wrapper hands to the game it hosts: clear the shared result, and report where the run is. */
export interface GameRun { clearResult: () => void; begin: () => void; rest: () => void }
export const GameRunContext = createContext<GameRun>({ clearResult: () => {}, begin: () => {}, rest: () => {} });

/** Phases in which a run is under way, from the click on Start (a scene may still be preparing) to the end of play. */
const RUNNING = ["preparing", "playing", "showing", "input", "countdown", "running", "waiting", "green"];

/**
 * Funnel events for one game page: it opened, a run started, a run produced a score. A run starts when the game leaves its idle
 * screen and ends on a score, on a return to the idle screen, or when the difficulty is changed. Only the game id and the
 * difficulty label are sent, and nothing at all before analytics consent (see `trackGame`).
 */
export function useGameJourney(gameId: string, difficulty: Difficulty | null, clearResult: () => void) {
  const live = useRef(false), opened = useRef(false);
  useEffect(() => {
    // Without consent nothing is sent yet; the page is counted once analytics reports it is ready.
    const open = () => { if (!opened.current) opened.current = trackGame({ name: "game_open", game: gameId }); };
    open(); window.addEventListener("mindbench-analytics-ready", open);
    return () => window.removeEventListener("mindbench-analytics-ready", open);
  }, [gameId]);
  const begin = useCallback(() => {
    if (live.current || !difficulty) return;
    live.current = true;
    trackGame({ name: "game_start", game: gameId, difficulty });
  }, [gameId, difficulty]);
  const rest = useCallback(() => { live.current = false; }, []);
  const complete = useCallback(() => {
    live.current = false;
    if (difficulty) trackGame({ name: "game_complete", game: gameId, difficulty });
  }, [gameId, difficulty]);
  const value = useMemo<GameRun>(() => ({ clearResult, begin, rest }), [clearResult, begin, rest]);
  return { value, rest, complete };
}

/** An internal restart must clear the shared result, just like the wrapper's retry. */
export function useGameRunPhase(phase: string) {
  const { clearResult, begin, rest } = useContext(GameRunContext);
  useEffect(() => {
    if (["idle", "playing", "showing", "countdown", "running", "waiting"].includes(phase)) clearResult();
  }, [phase, clearResult]);
  useEffect(() => {
    if (phase === "idle") rest(); else if (RUNNING.includes(phase)) begin();
  }, [phase, begin, rest]);
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
