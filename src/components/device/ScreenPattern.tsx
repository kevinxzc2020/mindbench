"use client";

import { useEffect, useRef, useState } from "react";
import { canvasBackingSize, frameSummary, FRAME_WINDOW, gradientRGB, movingTargetX, steppedPosition, type GradientPreset, type ScreenMode } from "@/lib/screen-diagnostics";
import styles from "./ScreenTester.module.css";

export interface PatternSettings { mode: ScreenMode; gradient: GradientPreset; vertical: boolean; steps: number | null; speed: number; size: number; direction: "left" | "right" }
export interface FrameReadout { mode: ScreenMode; summary: ReturnType<typeof frameSummary>; intervals: number[]; sampleArea: { width: number; height: number } | null; buffer: { width: number; height: number; limited: boolean }; cssSize: { width: number; height: number } }
export function ScreenPattern({ settings, running, resetKey, onReadout, onResize, label }: { settings: PatternSettings; running: boolean; resetKey: number; onReadout: (data: FrameReadout) => void; onResize: () => void; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0, dpr: 1 });
  const sizeRef = useRef(size);
  const elapsed = useRef(0);
  const samples = useRef<number[]>([]);
  const readoutRef = useRef(onReadout); readoutRef.current = onReadout;
  const resizeRef = useRef(onResize); resizeRef.current = onResize;
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const next = { width: Math.max(1, Math.round(rect.width)), height: Math.max(1, Math.round(rect.height)), dpr: window.devicePixelRatio || 1 };
      const old = sizeRef.current;
      if (next.width !== old.width || next.height !== old.height || next.dpr !== old.dpr) {
        if (old.width) resizeRef.current();
        elapsed.current = 0; samples.current = []; sizeRef.current = next; setSize(next);
      }
    };
    const observer = new ResizeObserver(measure); observer.observe(el); window.addEventListener("resize", measure);
    const timer = window.setInterval(measure, 1000); measure();
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); clearInterval(timer); };
  }, []);
  useEffect(() => { elapsed.current = 0; samples.current = []; }, [resetKey, settings.mode, settings.gradient, settings.vertical, settings.steps, settings.speed, settings.size, settings.direction]);
  useEffect(() => {
    const el = canvas.current; if (!el || !size.width) return;
    const ctx = el.getContext("2d", { alpha: false }); if (!ctx) return;
    const buffer = canvasBackingSize(size.width, size.height, size.dpr);
    el.width = buffer.width; el.height = buffer.height;
    let raf = 0, previous: number | null = null, lastReport = 0;
    const publish = () => { const summary = frameSummary(samples.current); readoutRef.current({ mode: settings.mode, summary, intervals: samples.current.slice(-120), sampleArea: summary ? { width: size.width, height: size.height } : null, buffer: { width: buffer.width, height: buffer.height, limited: buffer.limited }, cssSize: { width: size.width, height: size.height } }); };
    if (settings.mode === "gradient") {
      const bands = settings.gradient === "rgb" ? 3 : 1;
      const length = settings.vertical ? buffer.height : buffer.width;
      for (let band = 0; band < bands; band++) for (let i = 0; i < length; i++) {
        const position = steppedPosition(i / Math.max(1, length - 1), settings.steps);
        const color = gradientRGB(settings.gradient, position, band);
        ctx.fillStyle = `rgb(${color.join(",")})`;
        if (settings.vertical) ctx.fillRect(Math.floor(band * buffer.width / bands), i, Math.ceil(buffer.width / bands), 1);
        else ctx.fillRect(i, Math.floor(band * buffer.height / bands), 1, Math.ceil(buffer.height / bands));
      }
      publish(); return;
    }
    if (settings.mode !== "motion") { publish(); return; }
    const draw = () => {
      ctx.setTransform(buffer.width / size.width, 0, 0, buffer.height / size.height, 0, 0);
      const backgrounds = ["#efefef", "#808080", "#101010"];
      const foregrounds = ["#101010", "#ffffff", "#efefef"];
      const laneHeight = size.height / 3;
      const targetSize = Math.min(settings.size, laneHeight * .68);
      const x = movingTargetX(elapsed.current, settings.speed, size.width, targetSize, settings.direction);
      for (let lane = 0; lane < 3; lane++) {
        ctx.fillStyle = backgrounds[lane]; ctx.fillRect(0, lane * laneHeight, size.width, laneHeight);
        const y = lane * laneHeight + (laneHeight - targetSize) / 2;
        ctx.fillStyle = foregrounds[lane]; ctx.fillRect(x, y, targetSize, targetSize);
        ctx.fillStyle = lane === 0 ? "#efefef" : "#101010";
        for (let bar = 1; bar < 8; bar += 2) ctx.fillRect(x + bar * targetSize / 9, y + targetSize * .18, targetSize / 18, targetSize * .64);
        ctx.fillRect(x + targetSize * .15, y + targetSize * .46, targetSize * .7, targetSize * .08);
      }
    };
    const tick = (timestamp: number) => {
      if (document.hidden) return;
      if (previous !== null) {
        const interval = timestamp - previous;
        if (interval > 0) { elapsed.current += interval; samples.current.push(interval); if (samples.current.length > FRAME_WINDOW) samples.current.shift(); }
      }
      previous = timestamp; draw();
      if (timestamp - lastReport >= 500) { publish(); lastReport = timestamp; }
      raf = requestAnimationFrame(tick);
    };
    // A paused target starts in view; every animated frame clears the previous one.
    if (!elapsed.current) elapsed.current = (size.width * .25 + settings.size) / settings.speed * 1000;
    draw(); publish();
    if (running) raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); };
  }, [size, settings.mode, settings.gradient, settings.vertical, settings.steps, settings.speed, settings.size, settings.direction, running, resetKey]);
  return <canvas ref={canvas} className={styles.patternCanvas} role="img" aria-label={label}/>;
}
