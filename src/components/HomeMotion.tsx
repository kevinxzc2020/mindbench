"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Stable accessible copy; only the decorative duplicate is scrambled. */
export function ScrambleText({ text }: { text: string }) {
  return <span className="scramble-label" aria-label={text}><span className="scramble-measure" aria-hidden="true">{text}</span><span className="scramble-visual" aria-hidden="true" data-scramble={text}>{text}</span></span>;
}

/** Progressive enhancement scoped to the homepage. Never hides actual content. */
export function HomeMotion({ children, language, category, enabled }: { children: ReactNode; language: string; category: string; enabled: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    let dispose = () => {};

    function setup() {
      dispose();
      if (!root) return;
      root.dataset.systemMotion = motion.matches ? "reduced" : "full";
      root.dataset.motion = motion.matches || !enabled ? "reduced" : "active";
      if (motion.matches || !enabled) return;

      const hero = root.querySelector<HTMLElement>(".studio-hero")!;
      const photo = hero.querySelector<HTMLImageElement>(".studio-hero-image")!;
      const canvas = hero.querySelector<HTMLCanvasElement>(".studio-pixel-canvas")!;
      const trail = hero.querySelector<HTMLElement>(".studio-image-trail")!;
      const buffer = document.createElement("canvas");
      // Decode the same cached URL without srcset density correction. Canvas
      // source coordinates must refer to bitmap pixels, not responsive CSS size.
      const raster = new Image();
      const context = canvas.getContext("2d");
      const small = buffer.getContext("2d");
      const animations = new Set<Animation>();
      const textFrames = new Map<HTMLElement, number>();
      const cardTimes = new WeakMap<HTMLElement, number>();
      let pixelFrame = 0;
      let scrollFrame = 0;
      let disposed = false;
      let lastPixel = -Infinity;
      let lastTrail = { x: -1000, y: -1000, time: -Infinity };
      let trailIndex = 0;
      let rasterSource = "";

      function animate(element: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) {
        if (typeof element.animate !== "function") return null;
        const animation = element.animate(frames, timing);
        animations.add(animation);
        animation.onfinish = () => { animations.delete(animation); animation.cancel(); };
        return animation;
      }

      function scramble(element: HTMLElement) {
        const final = element.dataset.scramble ?? "";
        if (!final || textFrames.has(element)) return;
        const letters = Array.from(final);
        const start = performance.now();
        const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const han = "反应记忆思维速度精准探索";
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 620, 1);
          if (disposed || progress >= 1) {
            element.textContent = final;
            textFrames.delete(element);
            return;
          }
          const settled = Math.floor(progress * (letters.length + 2));
          element.textContent = letters.map((character, index) => {
            if (index < settled || /[\s.,!?。！？，/·]/.test(character)) return character;
            const pool = /[\u3400-\u9fff]/.test(character) ? han : latin;
            return pool[(Math.floor(now / 55) + index * 7) % pool.length];
          }).join("");
          textFrames.set(element, requestAnimationFrame(tick));
        };
        textFrames.set(element, requestAnimationFrame(tick));
      }

      function stopPixels() {
        cancelAnimationFrame(pixelFrame);
        pixelFrame = 0;
        canvas.style.opacity = "0";
        canvas.dataset.pixelState = "clear";
      }

      function pixelReveal() {
        if (disposed || !context || !small || !photo.complete || !photo.naturalWidth || document.hidden) return;
        const source = photo.currentSrc || photo.src;
        if (rasterSource !== source) { rasterSource = source; raster.src = source; return; }
        if (!raster.complete || !raster.naturalWidth) return;
        const now = performance.now();
        if (now - lastPixel < 1100) return;
        const box = hero.getBoundingClientRect();
        if (box.bottom <= 0 || box.top >= innerHeight) return;
        lastPixel = now;
        cancelAnimationFrame(pixelFrame);
        canvas.width = Math.round(box.width);
        canvas.height = Math.round(box.height);
        const scale = Math.max(box.width / raster.naturalWidth, box.height / raster.naturalHeight);
        const positions = getComputedStyle(photo).objectPosition.split(" ").map(parseFloat);
        const sx = (raster.naturalWidth - box.width / scale) * (positions[0] / 100 || 0);
        const sy = (raster.naturalHeight - box.height / scale) * (positions[1] / 100 || 0);
        const started = performance.now();
        canvas.dataset.pixelState = "revealing";
        const draw = (time: number) => {
          const progress = Math.min((time - started) / 1000, 1);
          if (disposed || progress >= 1) { stopPixels(); return; }
          const block = Math.max(1, Math.round(52 * Math.pow(1 - progress, 3)));
          buffer.width = Math.max(1, Math.ceil(box.width / block));
          buffer.height = Math.max(1, Math.ceil(box.height / block));
          small.imageSmoothingEnabled = true;
          small.drawImage(raster, sx, sy, box.width / scale, box.height / scale, 0, 0, buffer.width, buffer.height);
          context.imageSmoothingEnabled = false;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(buffer, 0, 0, canvas.width, canvas.height);
          canvas.style.opacity = String(progress < .78 ? 1 : (1 - progress) / .22);
          pixelFrame = requestAnimationFrame(draw);
        };
        pixelFrame = requestAnimationFrame(draw);
      }

      function updateScroll() {
        scrollFrame = 0;
        const rect = hero.getBoundingClientRect();
        const progress = Math.max(0, Math.min(-rect.top / rect.height, 1));
        hero.style.setProperty("--hero-shift", `${progress * 52}px`);
        hero.style.setProperty("--hero-blur", `${progress * 4}px`);
        hero.style.setProperty("--hero-zoom", String(1 + progress * .035));
      }
      function onScroll() {
        if (!scrollFrame && !document.hidden) scrollFrame = requestAnimationFrame(updateScroll);
      }

      function onPointerMove(event: PointerEvent) {
        if (!pointer.matches || event.pointerType === "touch" || document.hidden) return;
        // Real links/buttons always take priority; the trail lives behind the copy.
        if ((event.target as Element).closest("a, button")) return;
        const box = hero.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        const now = performance.now();
        if (now - lastTrail.time < 140 || Math.hypot(x - lastTrail.x, y - lastTrail.y) < 65) return;
        lastTrail = { x, y, time: now };
        const tile = document.createElement("span");
        const index = trailIndex++ % 3;
        tile.className = `studio-trail-tile studio-trail-tile-${index}`;
        tile.style.left = `${x}px`;
        tile.style.top = `${y}px`;
        trail.appendChild(tile);
        // A bounded pool prevents pointer activity from growing the DOM.
        if (trail.childElementCount > 6) trail.firstElementChild?.remove();
        const turn = index % 2 ? 9 : -9;
        const animation = animate(tile, [
          { opacity: 0, transform: `translate(-50%, -50%) scale(.65) rotate(${turn}deg)` },
          { opacity: .94, transform: `translate(-50%, -50%) scale(1) rotate(${-turn / 2}deg)`, offset: .18 },
          { opacity: .85, transform: "translate(-50%, -55%) scale(1)", offset: .62 },
          { opacity: 0, transform: `translate(-50%, -75%) scale(.9) rotate(${turn}deg)` },
        ], { duration: 1000, easing: "cubic-bezier(.2,.7,.2,1)" });
        if (animation) animation.onfinish = () => { animations.delete(animation); tile.remove(); };
        else tile.remove();
      }

      function animateCard(card: HTMLElement) {
        const now = performance.now();
        if (now - (cardTimes.get(card) ?? -Infinity) < 650) return;
        cardTimes.set(card, now);
        const tiles = card.querySelectorAll<HTMLElement>(".studio-pixel-curtain i");
        tiles.forEach((tile, index) => animate(tile, [
          { opacity: .85 }, { opacity: .6, offset: .25 }, { opacity: 0 },
        ], { duration: 430, delay: ((index * 7) % tiles.length) * 13, easing: "steps(3, end)" }));
        card.querySelectorAll<HTMLElement>("[data-scramble]").forEach(scramble);
      }

      function onEnter(event: Event) {
        const target = event.target as HTMLElement;
        const interactive = target.closest<HTMLElement>("[data-motion-card], [data-scramble-trigger]");
        if (!interactive) return;
        const previous = (event as PointerEvent).relatedTarget as Node | null;
        if (previous && interactive.contains(previous)) return;
        if (interactive.matches("[data-motion-card]")) animateCard(interactive);
        else interactive.querySelectorAll<HTMLElement>("[data-scramble]").forEach(scramble);
      }

      function replay() {
        lastPixel = -Infinity;
        pixelReveal();
        hero.querySelectorAll<HTMLElement>("[data-scramble]").forEach(scramble);
      }
      function onClick(event: MouseEvent) {
        if ((event.target as Element).closest("[data-replay-motion]")) replay();
      }
      function onResize() { stopPixels(); onScroll(); }
      function onVisibility() {
        if (!document.hidden) { onScroll(); return; }
        stopPixels();
        animations.forEach((animation) => animation.cancel());
        animations.clear();
        trail.replaceChildren();
        textFrames.forEach((frame, element) => { cancelAnimationFrame(frame); element.textContent = element.dataset.scramble ?? ""; });
        textFrames.clear();
      }

      const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          if (element.matches("[data-motion-card]")) {
            animate(element, [{ transform: "translateY(20px)" }, { transform: "translateY(0)" }], { duration: 600, easing: "cubic-bezier(.16,1,.3,1)" });
            animateCard(element);
          } else {
            element.querySelectorAll<HTMLElement>("[data-scramble]").forEach(scramble);
          }
          observer?.unobserve(element);
        });
      }, { threshold: .12 });
      root.querySelectorAll("[data-motion-card], [data-motion-heading]").forEach((element) => observer?.observe(element));
      photo.addEventListener("load", pixelReveal);
      raster.addEventListener("load", pixelReveal);
      hero.addEventListener("pointermove", onPointerMove, { passive: true });
      root.addEventListener("pointerover", onEnter);
      root.addEventListener("focusin", onEnter);
      root.addEventListener("click", onClick);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      updateScroll();
      pixelReveal();

      dispose = () => {
        disposed = true;
        stopPixels();
        cancelAnimationFrame(scrollFrame);
        animations.forEach((animation) => animation.cancel());
        textFrames.forEach((frame, element) => { cancelAnimationFrame(frame); element.textContent = element.dataset.scramble ?? ""; });
        observer?.disconnect();
        trail.replaceChildren();
        hero.style.removeProperty("--hero-shift");
        hero.style.removeProperty("--hero-blur");
        hero.style.removeProperty("--hero-zoom");
        photo.removeEventListener("load", pixelReveal);
        raster.removeEventListener("load", pixelReveal);
        hero.removeEventListener("pointermove", onPointerMove);
        root.removeEventListener("pointerover", onEnter);
        root.removeEventListener("focusin", onEnter);
        root.removeEventListener("click", onClick);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }
    setup();
    motion.addEventListener("change", setup);
    return () => { dispose(); motion.removeEventListener("change", setup); };
  }, [language, category, enabled]);

  return <div ref={rootRef} className="studio-home" data-language={language}>{children}</div>;
}
