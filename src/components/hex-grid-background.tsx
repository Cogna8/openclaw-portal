"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function HexGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const darkRef = useRef(resolvedTheme === "dark");

  useEffect(() => {
    darkRef.current = resolvedTheme === "dark";
  }, [resolvedTheme]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctx2d = canvasEl.getContext("2d");
    if (!ctx2d) return;

    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    let animId = 0;
    let t = 0;
    let mouseX = -9999;
    let mouseY = -9999;

    const hexRadius = 120;
    const hexHeight = Math.sqrt(3) * hexRadius;
    const hexWidth = hexRadius * 2;
    const colSpacing = hexWidth * 0.75;
    const rowSpacing = hexHeight * 0.5;
    const hexHeat = new Map<string, number>();
    const FADE_RATE = 0.012;
    const HEAT_RADIUS = 320;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function onMouseLeave() {
      mouseX = -9999;
      mouseY = -9999;
    }

    function drawHex(
      cx: number,
      cy: number,
      r: number,
      strokeAlpha: number,
      fillAlpha: number,
    ) {
      const isDark = darkRef.current;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      if (fillAlpha > 0.003) {
        ctx.fillStyle = isDark
          ? `rgba(230, 160, 70, ${fillAlpha})`
          : `rgba(232, 130, 60, ${fillAlpha * 1.2})`;
        ctx.fill();
      }

      ctx.strokeStyle = isDark
        ? `rgba(255, 180, 100, ${strokeAlpha * 0.85})`
        : `rgba(220, 120, 60, ${strokeAlpha * 1.2})`;
      ctx.lineWidth = isDark ? 0.8 : 1.0;
      ctx.stroke();
    }

    function animate() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isDark = darkRef.current;

      ctx.fillStyle = isDark ? "#0a0a0a" : "#FAFAFA";
      ctx.fillRect(0, 0, w, h);

      const cols = Math.ceil(w / colSpacing) + 2;
      const rows = Math.ceil(h / rowSpacing) + 2;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const offset = row % 2 === 0 ? 0 : colSpacing * 0.5;
          const cx = col * colSpacing + offset;
          const cy = row * rowSpacing;
          const key = `${row},${col}`;

          const wave1x = w * 0.3 + Math.cos(t * 0.4) * w * 0.25;
          const wave1y = h * 0.4 + Math.sin(t * 0.3) * h * 0.25;
          const d1 = Math.sqrt((cx - wave1x) ** 2 + (cy - wave1y) ** 2);
          const ripple1 = Math.sin(d1 * 0.008 - t * 1.2) * 0.5 + 0.5;

          const wave2x = w * 0.7 + Math.sin(t * 0.25) * w * 0.2;
          const wave2y = h * 0.6 + Math.cos(t * 0.35) * h * 0.2;
          const d2 = Math.sqrt((cx - wave2x) ** 2 + (cy - wave2y) ** 2);
          const ripple2 = Math.sin(d2 * 0.01 - t * 0.9 + 1.5) * 0.5 + 0.5;

          const baseAlpha = isDark
            ? 0.08 + ripple1 * 0.12 + ripple2 * 0.08
            : 0.14 + ripple1 * 0.20 + ripple2 * 0.14;

          const dm = Math.sqrt((cx - mouseX) ** 2 + (cy - mouseY) ** 2);
          if (dm < HEAT_RADIUS) {
            const intensity = 1 - dm / HEAT_RADIUS;
            const target = intensity * intensity * 0.6;
            const current = hexHeat.get(key) || 0;
            if (target > current) {
              hexHeat.set(key, current + (target - current) * 0.15);
            }
          }

          const currentHeat = hexHeat.get(key) || 0;
          if (currentHeat > 0.001) {
            hexHeat.set(key, currentHeat * (1 - FADE_RATE));
          } else if (currentHeat > 0) {
            hexHeat.delete(key);
          }

          const heat = hexHeat.get(key) || 0;
          drawHex(cx, cy, hexRadius, baseAlpha + heat * 0.5, heat * 0.08);
        }
      }

      t += 0.008;
      animId = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
