"use client";
// Motor de diagramas animados: nodos + flechas + "paquetes" que viajan por ellas.
// Lo usan la galería de patrones (arquitecturas) y las topologías (multiagente).
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { PALETTE } from "@/components/ui";

export type NodeKind = "io" | "llm" | "gate" | "tool" | "store" | "agent" | "boss";

export interface DNode {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  kind: NodeKind;
  w?: number;
  /** Dónde va la caja de traza: debajo (por defecto), encima o ninguna */
  trace?: "below" | "above" | "none";
}

export interface DEdge {
  from: string;
  to: string;
  /** Desplazamiento perpendicular de la curva (0 = recta) */
  curve?: number;
  label?: string;
  dashed?: boolean;
}

export interface Move {
  from: string;
  to: string;
  label: string;
  color?: string;
}

export interface Frame {
  moves: Move[];
  /** Texto corto que aparece en cada nodo en este momento */
  traces: Record<string, string>;
  /** Línea larga para el registro */
  log: string;
}

export const KIND_COLOR: Record<NodeKind, string> = {
  io: PALETTE.slate,
  llm: PALETTE.clay,
  gate: PALETTE.sand,
  tool: PALETTE.sky,
  store: PALETTE.olive,
  agent: PALETTE.rose,
  boss: PALETTE.clay,
};

const NODE_H = 40;
const DEFAULT_W = 100;

type Pt = { x: number; y: number };

function curvePoints(a: Pt, b: Pt, curve = 0, n = 28): Pt[] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * curve;
  const cy = my + (dx / len) * curve;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push({ x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y });
  }
  return pts;
}

const inside = (p: Pt, n: DNode, pad = 4) =>
  Math.abs(p.x - n.x) < (n.w ?? DEFAULT_W) / 2 + pad && Math.abs(p.y - n.y) < NODE_H / 2 + pad;

/** Avanza fotograma a fotograma cuando se pulsa "Ejecutar". */
export function useRunner(count: number, ms: number, onDone?: () => void) {
  const [idx, setIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      if (idx + 1 >= count) {
        setRunning(false);
        doneRef.current?.();
      } else setIdx(idx + 1);
    }, ms);
    return () => clearTimeout(t);
  }, [running, idx, count, ms]);

  const run = useCallback(() => {
    setIdx(0);
    setRunning(true);
  }, []);
  const reset = useCallback(() => {
    setIdx(-1);
    setRunning(false);
  }, []);
  return { idx, running, run, reset, done: !running && idx >= count - 1 && idx >= 0 };
}

export function FlowDiagram({
  nodes,
  edges,
  frames,
  frameIdx,
  height = 320,
  width = 640,
  packetMs = 900,
  showTraces = true,
}: {
  nodes: DNode[];
  edges: DEdge[];
  frames: Frame[];
  frameIdx: number;
  height?: number;
  width?: number;
  packetMs?: number;
  showTraces?: boolean;
}) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const frame = frameIdx >= 0 ? frames[frameIdx] : undefined;

  // Última traza de cada nodo hasta el fotograma actual
  const traces: Record<string, string> = {};
  for (let i = 0; i <= frameIdx && i < frames.length; i++) Object.assign(traces, frames[i].traces);
  const hot = new Set<string>();
  frame?.moves.forEach((m) => hot.add(m.to));
  if (frame) Object.keys(frame.traces).forEach((k) => hot.add(k));

  const edgeFor = (from: string, to: string) => edges.find((e) => e.from === from && e.to === to);
  const pathFor = (from: string, to: string) => {
    const a = byId[from];
    const b = byId[to];
    if (!a || !b) return [];
    return curvePoints(a, b, edgeFor(from, to)?.curve ?? 0);
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full select-none">
      <defs>
        <marker id="fd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={PALETTE.ivory} fillOpacity={0.45} />
        </marker>
        <filter id="fd-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Flechas */}
      {edges.map((e) => {
        const a = byId[e.from];
        const b = byId[e.to];
        if (!a || !b) return null;
        const pts = curvePoints(a, b, e.curve ?? 0).filter((p) => !inside(p, a) && !inside(p, b));
        if (pts.length < 2) return null;
        const mid = pts[Math.floor(pts.length / 2)];
        const active = frame?.moves.some((m) => m.from === e.from && m.to === e.to);
        return (
          <g key={`${e.from}-${e.to}`}>
            <polyline
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={active ? PALETTE.clayLight : PALETTE.ivory}
              strokeOpacity={active ? 0.9 : 0.28}
              strokeWidth={active ? 2 : 1.4}
              strokeDasharray={e.dashed ? "4 4" : undefined}
              markerEnd="url(#fd-arrow)"
            />
            {e.label && (
              <text x={mid.x} y={mid.y - 5} textAnchor="middle" fontSize={9} fill={PALETTE.ivory} fillOpacity={0.55}>
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodos */}
      {nodes.map((n) => {
        const w = n.w ?? DEFAULT_W;
        const c = KIND_COLOR[n.kind];
        const isHot = hot.has(n.id);
        const tr = traces[n.id];
        const traceY = n.trace === "above" ? n.y - NODE_H / 2 - 50 : n.y + NODE_H / 2 + 4;
        return (
          <g key={n.id}>
            {n.kind === "gate" ? (
              <polygon
                points={`${n.x},${n.y - 24} ${n.x + w / 2},${n.y} ${n.x},${n.y + 24} ${n.x - w / 2},${n.y}`}
                fill={c}
                fillOpacity={isHot ? 0.45 : 0.18}
                stroke={c}
                strokeWidth={isHot ? 2.5 : 1.2}
                filter={isHot ? "url(#fd-glow)" : undefined}
              />
            ) : (
              <rect
                x={n.x - w / 2}
                y={n.y - NODE_H / 2}
                width={w}
                height={NODE_H}
                rx={n.kind === "tool" || n.kind === "store" ? 6 : 14}
                fill={c}
                fillOpacity={isHot ? 0.45 : 0.16}
                stroke={c}
                strokeWidth={isHot ? 2.5 : 1.2}
                filter={isHot ? "url(#fd-glow)" : undefined}
              />
            )}
            <text x={n.x} y={n.sub ? n.y - 2 : n.y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={PALETTE.ivory}>
              {n.label}
            </text>
            {n.sub && (
              <text x={n.x} y={n.y + 11} textAnchor="middle" fontSize={8.5} fill={PALETTE.ivory} fillOpacity={0.6}>
                {n.sub}
              </text>
            )}
            {showTraces && tr && n.trace !== "none" && (
              <foreignObject x={n.x - 64} y={traceY} width={128} height={48}>
                <motion.div
                  key={tr}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md border px-1.5 py-1 text-center leading-tight text-ivory/90"
                  style={{ fontSize: 8.5, borderColor: `${c}66`, background: "rgba(20,20,19,0.85)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {tr}
                </motion.div>
              </foreignObject>
            )}
          </g>
        );
      })}

      {/* Paquetes en vuelo */}
      {frame?.moves.map((m, i) => {
        const pts = pathFor(m.from, m.to);
        if (!pts.length) return null;
        const col = m.color ?? PALETTE.clay;
        return (
          <motion.g
            key={`${frameIdx}-${i}`}
            initial={{ x: pts[0].x, y: pts[0].y, opacity: 0 }}
            animate={{ x: pts.map((p) => p.x), y: pts.map((p) => p.y), opacity: [0, 1, 1, 1, 0.9] }}
            transition={{ duration: packetMs / 1000, ease: "easeInOut" }}
          >
            <circle r={7} fill={col} filter="url(#fd-glow)" />
            <circle r={3} fill={PALETTE.ivory} />
            <text y={-11} textAnchor="middle" fontSize={9} fontWeight={600} fill={col} stroke={PALETTE.night} strokeWidth={3} paintOrder="stroke">
              {m.label}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}
