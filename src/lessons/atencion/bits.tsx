"use client";
import { useEffect } from "react";
import { useGuideStore } from "@/lib/guide-store";
import { fmt, type Mat, type Vec } from "./math";

/** Publica el estado de la escena para el chat de Clawd (setter estable de zustand). */
export function useSceneContext(text: string) {
  const setCtx = useGuideStore((s) => s.setSceneContext);
  useEffect(() => {
    setCtx(text);
  }, [setCtx, text]);
}

/** Color de una celda según su valor: naranja positivo, azul negativo. */
export function cellColor(v: number, max = 2) {
  const a = Math.min(1, Math.abs(v) / max);
  return v >= 0 ? `rgba(217,119,87,${0.12 + a * 0.75})` : `rgba(106,155,204,${0.12 + a * 0.75})`;
}

export function TokenPicker({ tokens, value, onChange, disabledFrom }: { tokens: string[]; value: number; onChange: (i: number) => void; disabledFrom?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((t, i) => (
        <button
          key={t + i}
          onClick={() => onChange(i)}
          disabled={disabledFrom !== undefined && i >= disabledFrom}
          className={`rounded-lg px-2.5 py-1 font-serif text-sm transition disabled:opacity-30 ${i === value ? "bg-clay text-night" : "bg-ivory/5 text-ivory/80 hover:bg-ivory/10"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function VecCells({ v, label, color, max = 2, size = "md" }: { v: Vec; label?: string; color?: string; max?: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-6 min-w-9 text-[10px]" : "h-8 min-w-11 text-xs";
  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="w-10 shrink-0 text-right font-mono text-xs" style={{ color: color ?? "#F0EEE6" }}>
          {label}
        </span>
      )}
      <div className="flex gap-0.5">
        {v.map((x, i) => (
          <div key={i} className={`flex items-center justify-center rounded px-1 font-mono text-ivory ${cls}`} style={{ background: cellColor(x, max) }}>
            {fmt(x)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatrixView({ m, label, color }: { m: Mat; label: string; color: string }) {
  return (
    <div className="inline-block">
      <div className="mb-1 text-center font-mono text-xs" style={{ color }}>
        {label} <span className="text-ivory/40">(4×4)</span>
      </div>
      <div className="grid grid-cols-4 gap-0.5 rounded-lg border p-1" style={{ borderColor: color + "66" }}>
        {m.flat().map((x, i) => (
          <div key={i} className="flex h-6 w-10 items-center justify-center rounded font-mono text-[10px] text-ivory" style={{ background: cellColor(x, 3) }}>
            {fmt(x, 1)}
          </div>
        ))}
      </div>
    </div>
  );
}
