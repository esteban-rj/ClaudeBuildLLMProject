"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { mulberry32 } from "./pieces";

const COLORS = ["#D97757", "#E3C77B", "#6A9BCC", "#9DB37E", "#C46686", "#A58BD6", "#7FD1C1", "#F0EEE6"];

export function Confetti({ count = 90 }: { count?: number }) {
  const bits = useMemo(() => {
    const r = mulberry32(42);
    return Array.from({ length: count }, (_, i) => ({
      x: r() * 100,
      drift: (r() - 0.5) * 240,
      delay: r() * 0.8,
      dur: 2.4 + r() * 2,
      rot: (r() - 0.5) * 1440,
      w: 6 + r() * 8,
      h: 8 + r() * 10,
      c: COLORS[i % COLORS.length],
    }));
  }, [count]);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <motion.div
          key={i}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", x: b.drift, rotate: b.rot, opacity: [1, 1, 0.8] }}
          transition={{ duration: b.dur, delay: b.delay, ease: "easeIn" }}
          style={{ position: "absolute", left: `${b.x}%`, top: 0, width: b.w, height: b.h, background: b.c, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}
