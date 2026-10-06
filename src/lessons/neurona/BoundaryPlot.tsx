"use client";
import { useEffect, useRef } from "react";
import { sigmoid, type Pt } from "./math";

const SIZE = 400;
const RANGE = 3; // el plano va de -3 a 3
const RES = 80;

const toPx = (v: number) => ((v + RANGE) / (2 * RANGE)) * SIZE;
const toPy = (v: number) => SIZE - ((v + RANGE) / (2 * RANGE)) * SIZE;

// clase 0 = azul (sky), clase 1 = naranja (clay)
const C0 = [106, 155, 204];
const C1 = [217, 119, 87];

/** Plano 2D con mapa de calor de la neurona, su recta frontera y los puntos */
export default function BoundaryPlot({ pts, w1, w2, b }: { pts: Pt[]; w1: number; w2: number; b: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    // mapa de calor de baja resolución, escalado
    const off = document.createElement("canvas");
    off.width = RES;
    off.height = RES;
    const octx = off.getContext("2d")!;
    const img = octx.createImageData(RES, RES);
    for (let j = 0; j < RES; j++) {
      for (let i = 0; i < RES; i++) {
        const x = -RANGE + ((i + 0.5) / RES) * 2 * RANGE;
        const y = RANGE - ((j + 0.5) / RES) * 2 * RANGE;
        const p = sigmoid(w1 * x + w2 * y + b);
        const k = (j * RES + i) * 4;
        for (let c = 0; c < 3; c++) img.data[k + c] = Math.round(C0[c] * (1 - p) + C1[c] * p);
        img.data[k + 3] = Math.round(40 + Math.abs(p - 0.5) * 2 * 90);
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#141413";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, SIZE, SIZE);

    // ejes
    ctx.strokeStyle = "rgba(240,238,230,0.15)";
    ctx.lineWidth = 1;
    for (let v = -RANGE; v <= RANGE; v++) {
      ctx.beginPath();
      ctx.moveTo(toPx(v), 0);
      ctx.lineTo(toPx(v), SIZE);
      ctx.moveTo(0, toPy(v));
      ctx.lineTo(SIZE, toPy(v));
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(240,238,230,0.35)";
    ctx.beginPath();
    ctx.moveTo(toPx(0), 0);
    ctx.lineTo(toPx(0), SIZE);
    ctx.moveTo(0, toPy(0));
    ctx.lineTo(SIZE, toPy(0));
    ctx.stroke();

    // recta frontera: w1·x + w2·y + b = 0
    ctx.strokeStyle = "#F0EEE6";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    if (Math.abs(w2) > 1e-6) {
      const yAt = (x: number) => -(w1 * x + b) / w2;
      ctx.moveTo(toPx(-RANGE), toPy(yAt(-RANGE)));
      ctx.lineTo(toPx(RANGE), toPy(yAt(RANGE)));
    } else if (Math.abs(w1) > 1e-6) {
      const x0 = -b / w1;
      ctx.moveTo(toPx(x0), 0);
      ctx.lineTo(toPx(x0), SIZE);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // puntos
    for (const p of pts) {
      const pred = w1 * p.x + w2 * p.y + b >= 0 ? 1 : 0;
      const px = toPx(p.x);
      const py = toPy(p.y);
      ctx.beginPath();
      if (p.label === 1) ctx.arc(px, py, 7, 0, Math.PI * 2);
      else ctx.rect(px - 6, py - 6, 12, 12);
      ctx.fillStyle = p.label === 1 ? "#D97757" : "#6A9BCC";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#141413";
      ctx.stroke();
      if (pred !== p.label) {
        ctx.strokeStyle = "#F0EEE6";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [pts, w1, w2, b]);

  return <canvas ref={ref} width={SIZE} height={SIZE} className="aspect-square w-full max-w-[460px] rounded-xl border border-ivory/10" />;
}
