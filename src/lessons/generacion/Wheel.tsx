"use client";
import { motion } from "framer-motion";
import { WORD_COLORS } from "./model";

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Ruleta de probabilidad: cada gajo mide lo que su probabilidad. El ángulo se anima desde fuera. */
export function Wheel({ words, probs, angle, duration, onDone, size = 240 }: { words: string[]; probs: number[]; angle: number; duration: number; onDone: () => void; size?: number }) {
  const c = size / 2;
  const r = c - 6;
  const slices = words.map((w, i) => {
    const a0 = probs.slice(0, i).reduce((s, x) => s + x, 0) * 360;
    const a1 = a0 + probs[i] * 360;
    const [x0, y0] = polar(c, c, r, a0);
    const [x1, y1] = polar(c, c, r, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    const mid = (a0 + a1) / 2;
    const [tx, ty] = polar(c, c, r * 0.68, mid);
    const d = probs[i] >= 0.9999 ? `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.01} ${c - r} Z` : `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    return { w, d, tx, ty, mid, show: probs[i] > 0.06, color: WORD_COLORS[i % WORD_COLORS.length] };
  });
  return (
    <div className="relative mx-auto" style={{ width: size, height: size + 14 }}>
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-2xl leading-none text-ivory drop-shadow">▼</div>
      <motion.div
        className="absolute left-0 top-3.5"
        style={{ width: size, height: size }}
        animate={{ rotate: angle }}
        transition={{ duration, ease: [0.15, 0.7, 0.2, 1] }}
        onAnimationComplete={onDone}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s) => (
            <g key={s.w}>
              <path d={s.d} fill={s.color} stroke="#141413" strokeWidth="2" />
              {s.show && (
                <text x={s.tx} y={s.ty} fontSize="11" fontWeight="600" fill="#141413" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${s.mid - 90} ${s.tx} ${s.ty})`}>
                  {s.w}
                </text>
              )}
            </g>
          ))}
          <circle cx={c} cy={c} r="14" fill="#141413" />
        </svg>
      </motion.div>
    </div>
  );
}
