"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { geometryKey, type ScreenGeometry } from "@/lib/screen-diagnostics";

export function useScreenPresentation(onPause: () => void) {
  const surface = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef(false);
  const pauseRef = useRef(onPause); pauseRef.current = onPause;
  const [expanded, setExpanded] = useState(false);
  const [native, setNative] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [notice, setNotice] = useState("");
  const [geometry, setGeometry] = useState<ScreenGeometry | null>(null);
  const geometryRef = useRef<ScreenGeometry | null>(null);
  const expandedRef = useRef(false); expandedRef.current = expanded;
  const measure = useCallback(() => {
    const el = surface.current; if (!el) return null;
    const rect = el.getBoundingClientRect();
    const round = (n: number) => Math.round(n * 100) / 100;
    const next: ScreenGeometry = { width: round(rect.width), height: round(rect.height), left: round(rect.left), top: round(rect.top), dpr: window.devicePixelRatio || 1, screenX: window.screenX, screenY: window.screenY, screenWidth: screen.width, screenHeight: screen.height, presentation: document.fullscreenElement === el ? "fullscreen" : expandedRef.current ? "expanded" : "preview" };
    if (!geometryRef.current || geometryKey(next) !== geometryKey(geometryRef.current)) { geometryRef.current = next; setGeometry(next); }
    return next;
  }, []);
  const closePresentation = useCallback(() => {
    pauseRef.current(); setExpanded(false); setNative(false); nativeRef.current = false; setHidden(false);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);
  const exit = useCallback(async () => {
    if (document.fullscreenElement === surface.current) {
      try { await document.exitFullscreen(); } catch { setNotice("exit-with-escape"); return; }
    }
    closePresentation();
  }, [closePresentation]);
  const enter = useCallback(async () => {
    const el = surface.current; if (!el) return;
    pauseRef.current(); setNotice(""); setHidden(false); setExpanded(true); expandedRef.current = true;
    if (el.requestFullscreen && document.fullscreenEnabled) {
      try { await el.requestFullscreen(); nativeRef.current = document.fullscreenElement === el; setNative(nativeRef.current); }
      catch { setNotice("page-expanded"); }
    } else setNotice("page-expanded");
    el.focus({ preventScroll: true }); measure();
  }, [measure]);
  useEffect(() => {
    const change = () => {
      if (document.fullscreenElement === surface.current) { nativeRef.current = true; setNative(true); setExpanded(true); }
      else if (nativeRef.current) closePresentation();
      measure();
    };
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, [closePresentation, measure]);
  useEffect(() => {
    const el = surface.current; if (!el) return;
    let frame = 0;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(update); observer.observe(el);
    window.addEventListener("resize", update); window.addEventListener("scroll", update, true);
    const timer = window.setInterval(() => { if (!document.hidden) measure(); }, 1000);
    measure();
    return () => { observer.disconnect(); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); clearInterval(timer); cancelAnimationFrame(frame); };
  }, [measure]);
  useEffect(() => {
    if (!expanded) return;
    const oldOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    surface.current?.focus({ preventScroll: true }); measure();
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); void exit(); } };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", escape); };
  }, [expanded, exit, measure]);
  return { surface, opener, expanded, native, hidden, setHidden, notice, setNotice, geometry, measure, enter, exit };
}
