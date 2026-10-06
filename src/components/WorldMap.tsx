"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { LESSONS, REGIONS, type Region } from "@/lib/lessons";
import { useGuideStore } from "@/lib/guide-store";
import { Clawd } from "./Clawd";

// Zonas del mapa (elipses difusas) en coordenadas 0-100
const ZONES: Record<Region, { cx: number; cy: number; rx: number; ry: number; label: { x: number; y: number } }> = {
  fundamentos: { cx: 15, cy: 62, rx: 16, ry: 28, label: { x: 4, y: 30 } },
  transformer: { cx: 52, cy: 33, rx: 26, ry: 17, label: { x: 36, y: 12 } },
  inferencia: { cx: 79, cy: 66, rx: 14, ry: 17, label: { x: 72, y: 46 } },
  agentes: { cx: 40, cy: 80, rx: 22, ry: 13, label: { x: 44, y: 96 } },
};

export function WorldMap() {
  const completed = useGuideStore((s) => s.completed);
  const openLesson = useGuideStore((s) => s.openLesson);
  const mood = useGuideStore((s) => s.mood);
  const speaking = useGuideStore((s) => s.speaking);
  const [hover, setHover] = useState<string | null>(null);

  const next = LESSONS.find((l) => !completed.includes(l.id)) ?? LESSONS[LESSONS.length - 1];
  const target = LESSONS.find((l) => l.id === hover) ?? next;
  const path = LESSONS.map((l, i) => `${i === 0 ? "M" : "L"} ${l.pos.x} ${l.pos.y}`).join(" ");
  const hovered = LESSONS.find((l) => l.id === hover);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">¡Vamos a construir un <span className="text-clay">transformer</span>!</h1>
          <p className="mt-1 max-w-2xl text-sm text-ivory/60">
            Recorre el mapa desde la neurona hasta los sistemas multi-agente. Clawd te acompaña: pregúntale por voz o por chat lo que quieras.
          </p>
        </div>
        <div className="text-right text-xs text-ivory/50">
          <div className="font-mono text-2xl text-clay">{completed.length}/{LESSONS.length}</div>
          lecciones completadas
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-3xl border border-ivory/10 bg-[radial-gradient(ellipse_at_top,#25231f,#141413)]" style={{ aspectRatio: "16 / 10" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            {Object.entries(REGIONS).map(([k, r]) => (
              <radialGradient key={k} id={`zone-${k}`}>
                <stop offset="0%" stopColor={r.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={r.color} stopOpacity="0" />
              </radialGradient>
            ))}
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#F0EEE6" strokeOpacity="0.035" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {(Object.keys(ZONES) as Region[]).map((k) => {
            const z = ZONES[k];
            return <ellipse key={k} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill={`url(#zone-${k})`} />;
          })}
          {/* camino */}
          <path d={path} fill="none" stroke="#F0EEE6" strokeOpacity="0.12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 10 }} />
          <path d={path} fill="none" stroke="#D97757" strokeOpacity="0.6" strokeDasharray="1 1.5" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dashoffset" values="0;-5" dur="2s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* nombres de región */}
        {(Object.keys(ZONES) as Region[]).map((k) => (
          <div key={k} className="pointer-events-none absolute hidden font-serif text-sm italic sm:block md:text-base" style={{ left: `${ZONES[k].label.x}%`, top: `${ZONES[k].label.y}%`, color: REGIONS[k].color, transform: "translateY(-50%)" }}>
            {REGIONS[k].name}
          </div>
        ))}

        {/* nodos */}
        {LESSONS.map((l) => {
          const done = completed.includes(l.id);
          const isNext = l.id === next.id;
          const color = REGIONS[l.region].color;
          return (
            <button
              key={l.id}
              onClick={() => openLesson(l.id)}
              onMouseEnter={() => setHover(l.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(l.id)}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${l.pos.x}%`, top: `${l.pos.y}%` }}
              aria-label={`Lección ${l.order}: ${l.title}`}
            >
              <span
                className={`relative grid h-11 w-11 place-items-center rounded-full border-2 text-xl shadow-lg transition group-hover:scale-125 md:h-14 md:w-14 md:text-2xl ${isNext ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}`}
                style={{ borderColor: color, background: done ? color : "#1F1E1B", boxShadow: `0 0 ${isNext ? 24 : 10}px ${color}66` }}
              >
                {l.emoji}
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-night text-[10px] font-bold" style={{ color }}>
                  {done ? "✓" : l.order}
                </span>
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden w-max max-w-[9rem] -translate-x-1/2 text-center text-[11px] leading-tight text-ivory/70 md:block">
                {l.title}
              </span>
            </button>
          );
        })}

        {/* Clawd camina por el mapa */}
        <motion.div
          className="pointer-events-none absolute z-10"
          animate={{ left: `${target.pos.x}%`, top: `${target.pos.y}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
          style={{ x: "-50%", y: "-135%" }}
        >
          <Clawd size={52} mood={hover ? "happy" : mood} speaking={speaking} />
        </motion.div>

        {/* tarjeta de la lección señalada */}
        {hovered && (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-2xl border border-ivory/10 bg-night/85 p-3 backdrop-blur sm:right-auto sm:max-w-sm">
            <div className="text-xs" style={{ color: REGIONS[hovered.region].color }}>{REGIONS[hovered.region].name}</div>
            <div className="font-serif text-lg">{hovered.emoji} {hovered.title}</div>
            <div className="text-sm text-ivory/70">{hovered.summary}</div>
          </div>
        )}
      </div>

      {/* Lista accesible / móvil */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(REGIONS) as Region[]).map((k) => (
          <div key={k} className="rounded-2xl border border-ivory/10 bg-panel/60 p-4">
            <div className="font-serif" style={{ color: REGIONS[k].color }}>{REGIONS[k].name}</div>
            <p className="mb-2 text-xs text-ivory/50">{REGIONS[k].description}</p>
            <ul className="space-y-1">
              {LESSONS.filter((l) => l.region === k).map((l) => (
                <li key={l.id}>
                  <button onClick={() => openLesson(l.id)} className="text-left text-sm text-ivory/80 hover:text-clay">
                    {completed.includes(l.id) ? "✅" : l.emoji} {l.order}. {l.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
