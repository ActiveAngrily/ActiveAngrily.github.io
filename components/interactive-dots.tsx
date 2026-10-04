"use client";

import { useEffect, useRef } from "react";

export function InteractiveDots({ spacing, opacity }: { spacing: number; opacity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const canvas = canvasElement;
    const context = canvas.getContext("2d");
    if (!context) return;
    const texture = document.createElement("canvas");
    const drawingContext = texture.getContext("2d");
    if (!drawingContext) return;
    const textureContext = drawingContext;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, pixelRatio = 1, frame = 0, previousTime = 0;
    const pointer = { x: 0, y: 0, active: false, strength: 0 };
    const radius = 110;

    function render(time: number) {
      const animate = !reducedMotion.matches;
      const driftX = animate ? Math.sin(time / 6500) * 2 : 0;
      const driftY = animate ? Math.cos(time / 8500) * 2 : 0;
      context!.clearRect(0, 0, width, height);
      context!.drawImage(texture, -24 + driftX, -24 + driftY, width + 48, height + 48);
      pointer.strength += ((pointer.active && animate ? 1 : 0) - pointer.strength) * 0.12;
      if (pointer.strength < 0.002) return;

      // Repaint only the small area around the mouse; the rest uses a cached grid.
      const left = pointer.x - radius, top = pointer.y - radius;
      context!.save();
      context!.beginPath();
      context!.rect(left, top, radius * 2, radius * 2);
      context!.clip();
      context!.clearRect(left, top, radius * 2, radius * 2);
      context!.beginPath();
      for (let row = Math.floor((top - driftY) / spacing) - 1; row <= Math.ceil((top + radius * 2 - driftY) / spacing); row++) {
        for (let column = Math.floor((left - driftX) / spacing) - 1; column <= Math.ceil((left + radius * 2 - driftX) / spacing); column++) {
          let x = column * spacing + spacing / 2 + driftX;
          let y = row * spacing + spacing / 2 + driftY;
          const dx = x - pointer.x, dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const force = Math.max(0, 1 - distance / radius) ** 2 * 24 * pointer.strength;
          x += dx / (distance || 1) * force;
          y += dy / (distance || 1) * force;
          const size = 1 + force / 60;
          context!.moveTo(x + size, y);
          context!.arc(x, y, size, 0, Math.PI * 2);
        }
      }
      context!.fill();
      context!.restore();
    }

    function resize() {
      width = innerWidth; height = innerHeight;
      pixelRatio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * pixelRatio); canvas.height = Math.ceil(height * pixelRatio);
      context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      texture.width = Math.ceil((width + 48) * pixelRatio); texture.height = Math.ceil((height + 48) * pixelRatio);
      textureContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      textureContext.beginPath();
      for (let y = spacing / 2; y < height + 48; y += spacing) {
        for (let x = spacing / 2; x < width + 48; x += spacing) {
          textureContext.moveTo(x + 1, y);
          textureContext.arc(x, y, 1, 0, Math.PI * 2);
        }
      }
      textureContext.fill();
      render(0);
    }

    function tick(time: number) {
      if (time - previousTime >= 1000 / 30) { render(time); previousTime = time; }
      frame = requestAnimationFrame(tick);
    }
    function syncAnimation() {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
      else render(0);
    }
    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true;
    }
    function leave() { pointer.active = false; }
    resize(); syncAnimation();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", syncAnimation);
    reducedMotion.addEventListener("change", syncAnimation);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", syncAnimation);
      reducedMotion.removeEventListener("change", syncAnimation);
    };
  }, [spacing]);

  return <canvas ref={canvasRef} className="interactive-dots" style={{ opacity }} aria-hidden="true" />;
}
