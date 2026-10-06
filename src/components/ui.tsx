"use client";
// Kit de UI compartido por todas las lecciones. Paleta: ver globals.css (@theme).
import type { ReactNode } from "react";

export function Card({ title, children, className = "", actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-ivory/10 bg-panel/80 p-5 shadow-xl backdrop-blur ${className}`}>
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="font-serif text-lg text-ivory">{title}</h3>}
          {actions}
        </header>
      )}
      <div className="text-sm leading-relaxed text-ivory/80">{children}</div>
    </section>
  );
}

export function Button({ children, onClick, variant = "primary", disabled, className = "", title }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline"; disabled?: boolean; className?: string; title?: string }) {
  const styles = {
    primary: "bg-clay text-night hover:bg-clay-light",
    ghost: "bg-ivory/5 text-ivory hover:bg-ivory/10",
    outline: "border border-clay/60 text-clay hover:bg-clay/10",
  }[variant];
  return (
    <button title={title} disabled={disabled} onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-medium transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Slider({ label, value, min, max, step = 0.01, onChange, format = (v) => v.toFixed(2), color = "#D97757" }: { label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string; color?: string }) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-xs text-ivory/70">
        <span>{label}</span>
        <span className="font-mono" style={{ color }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" style={{ accentColor: color }} />
    </label>
  );
}

/** Navegación por pasos dentro de una lección */
export function Steps({ steps, current, onChange }: { steps: string[]; current: number; onChange: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <button key={s} onClick={() => onChange(i)} className={`rounded-full px-3 py-1 text-xs transition ${i === current ? "bg-clay text-night" : i < current ? "bg-clay/20 text-clay" : "bg-ivory/5 text-ivory/50 hover:text-ivory"}`}>
          {i + 1}. {s}
        </button>
      ))}
    </div>
  );
}

/** Caja de fórmula / dato destacado */
export function Formula({ children }: { children: ReactNode }) {
  return <div className="my-2 rounded-lg bg-night/60 px-3 py-2 text-center font-mono text-sm text-clay-light">{children}</div>;
}

/** Contenedor estándar para escenas 3D (react-three-fiber) o 2D grandes */
export function Stage({ children, height = 420, className = "" }: { children: ReactNode; height?: number; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-ivory/10 bg-gradient-to-b from-night to-panel ${className}`} style={{ height }}>
      {children}
    </div>
  );
}

export const PALETTE = {
  clay: "#D97757",
  clayLight: "#E8A387",
  ivory: "#F0EEE6",
  night: "#141413",
  panel: "#1F1E1B",
  sky: "#6A9BCC",
  olive: "#788C5D",
  rose: "#C46686",
  sand: "#E3C77B",
  slate: "#8A8A85",
};
