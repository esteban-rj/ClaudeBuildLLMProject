"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { PIECES, shuffled } from "./pieces";
import { PieceIcon } from "./PieceShape";
import { TowerStage } from "./Tower3D";
import { Confetti } from "./Confetti";

interface Props {
  mode: "guided" | "challenge";
  /** Se llama cuando la torre está completa (en el reto, solo si se llegó a tiempo) */
  onComplete?: () => void;
}

const LIMIT = 90; // segundos del reto
const PENALTY = 5;

export function Workshop({ mode, onComplete }: Props) {
  const guide = useGuide();
  const guideRef = useRef(guide);
  useEffect(() => {
    guideRef.current = guide;
  });
  const challenge = mode === "challenge";

  const [round, setRound] = useState(0);
  const order = useMemo(() => shuffled(PIECES.length, challenge ? 777 + round * 31 : 2024), [challenge, round]);
  const [used, setUsed] = useState<boolean[]>(() => PIECES.map(() => false));
  const [placed, setPlaced] = useState(0);
  const [shake, setShake] = useState<number | null>(null);
  const [status, setStatus] = useState(challenge ? "Pulsa «¡Empezar!» y reconstruye la torre sin pistas." : "Elige la primera pieza de la bandeja (clic o arrástrala a la torre).");
  const [started, setStarted] = useState(!challenge);
  const [timeLeft, setTimeLeft] = useState(LIMIT);
  const [errors, setErrors] = useState(0);
  const [result, setResult] = useState<null | "win" | "lose">(null);
  const endAt = useRef(0);
  const lastHint = useRef(0);

  // Cuenta atrás del reto
  useEffect(() => {
    if (!challenge || !started || result) return;
    const id = setInterval(() => {
      const left = (endAt.current - Date.now()) / 1000;
      if (left <= 0) {
        setTimeLeft(0);
        setResult("lose");
        guideRef.current.say("¡Se acabó el tiempo! No pasa nada: pulsa «Reintentar» y verás que cada vez sale más rápido.", "surprised");
      } else setTimeLeft(left);
    }, 100);
    return () => clearInterval(id);
  }, [challenge, started, result]);

  useEffect(() => {
    guideRef.current.setContext(
      challenge
        ? `Reto final del transformer: reconstruir la torre sin pistas contra reloj. ${started ? `Piezas colocadas ${placed}/10, errores ${errors}, quedan ${Math.ceil(timeLeft)} s.` : "Aún no ha empezado."}`
        : `Taller de construcción: el usuario ha colocado ${placed}/10 piezas del transformer en orden. ${placed < 10 ? `Siguiente pieza correcta: ${PIECES[placed].name}.` : "Torre completa."}`,
    );
    // timeLeft se omite a propósito para no actualizar cada décima
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, errors, started, challenge]);

  const tryPlace = (slot: number) => {
    if (used[slot] || placed >= PIECES.length || (challenge && (!started || result))) return;
    const pi = order[slot];
    const want = PIECES[placed];
    if (PIECES[pi].kind === want.kind) {
      const nextUsed = used.slice();
      nextUsed[slot] = true;
      setUsed(nextUsed);
      const np = placed + 1;
      setPlaced(np);
      if (!challenge) {
        setStatus(want.explain);
        guideRef.current.say(want.explain, np === PIECES.length ? "happy" : "explaining");
        if (np === PIECES.length) {
          setTimeout(() => guideRef.current.say("¡Lo has conseguido, has construido un transformer completo! Ahora vamos a encenderlo.", "happy"), 400);
          onComplete?.();
        }
      } else if (np === PIECES.length) {
        const left = (endAt.current - Date.now()) / 1000;
        if (left > 0) {
          setResult("win");
          setTimeLeft(left);
          guideRef.current.say(`¡Torre terminada en ${(LIMIT - left).toFixed(1)} segundos y con ${errors} errores! Ya entiendes cómo se construye un transformer. ¡Eres un maestro constructor!`, "happy");
          guideRef.current.complete("transformer");
          onComplete?.();
        }
      } else setStatus(`¡Bien! ${np}/10`);
    } else {
      setShake(slot);
      setTimeout(() => setShake(null), 450);
      if (challenge) {
        setErrors((e) => e + 1);
        endAt.current -= PENALTY * 1000;
        setStatus(`¡Esa no es! -${PENALTY} s de penalización.`);
      } else {
        setStatus(want.hint);
        const now = Date.now();
        if (now - lastHint.current > 2500) {
          lastHint.current = now;
          guideRef.current.say(want.hint, "thinking");
        }
      }
    }
  };

  const start = () => {
    setStarted(true);
    endAt.current = Date.now() + LIMIT * 1000;
    setTimeLeft(LIMIT);
    setStatus("¡Ya! Coloca las piezas en orden, de abajo arriba.");
    guideRef.current.say("¡Cronómetro en marcha! Sin pistas: tú sabes el orden.", "happy");
  };

  const reset = () => {
    setRound((r) => r + 1);
    setUsed(PIECES.map(() => false));
    setPlaced(0);
    setErrors(0);
    setResult(null);
    setStarted(!challenge);
    setTimeLeft(LIMIT);
    setStatus(challenge ? "Pulsa «¡Empezar!» y reconstruye la torre sin pistas." : "Elige la primera pieza de la bandeja.");
  };

  const pct = (placed / PIECES.length) * 100;
  const hidden = challenge && !started;

  return (
    <div className="space-y-3">
      {result === "win" && <Confetti />}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-full bg-ivory/10">
          <motion.div className="h-full bg-clay" animate={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs text-ivory/70">{placed}/10 piezas</span>
        {challenge && started && (
          <span className={`rounded-full px-3 py-1 font-mono text-sm ${timeLeft < 15 && !result ? "bg-rose/30 text-rose" : "bg-ivory/10 text-clay-light"}`}>
            ⏱ {timeLeft.toFixed(1)} s
          </span>
        )}
        {challenge && started && <span className="font-mono text-xs text-ivory/60">errores: {errors}</span>}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const v = parseInt(e.dataTransfer.getData("text/plain"), 10);
            if (!Number.isNaN(v)) tryPlace(v);
          }}
        >
          <TowerStage key={round} placed={placed} ghost={!challenge} labels height={480} />
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-ivory/50">Bandeja de piezas</div>
          <div className="grid grid-cols-2 gap-2">
            {order.map((pi, slot) => {
              const p = PIECES[pi];
              const isUsed = used[slot];
              return (
                <motion.button
                  key={slot}
                  draggable={!isUsed && !hidden}
                  onDragStart={(e) => (e as unknown as React.DragEvent).dataTransfer.setData("text/plain", String(slot))}
                  onClick={() => tryPlace(slot)}
                  disabled={isUsed || hidden}
                  animate={shake === slot ? { x: [0, -8, 8, -6, 6, 0], backgroundColor: ["rgba(196,102,134,0.4)", "rgba(240,238,230,0.05)"] } : { x: 0 }}
                  whileHover={isUsed ? undefined : { scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-1 rounded-xl border border-ivory/10 bg-ivory/5 p-2 text-center text-[11px] leading-tight text-ivory transition ${isUsed ? "opacity-20" : "cursor-grab"} ${hidden ? "blur-[2px]" : ""}`}
                  style={!isUsed ? { boxShadow: `inset 0 -3px 0 ${p.color}` } : undefined}
                >
                  <PieceIcon kind={p.kind} color={p.color} size={36} />
                  {p.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-night/60 p-3 text-sm text-ivory/85">
        <span className="text-xl">🦀</span>
        <span className="min-w-48 flex-1">{status}</span>
        {challenge && !started && <Button onClick={start}>¡Empezar!</Button>}
        {(result || (!challenge && placed > 0)) && (
          <Button variant="outline" onClick={reset}>
            {result === "lose" ? "Reintentar" : "Reiniciar"}
          </Button>
        )}
      </div>
      {result === "win" && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-clay/50 bg-clay/10 p-4 text-center font-serif text-xl text-clay-light">
          🏆 ¡Transformer construido en {(LIMIT - timeLeft).toFixed(1)} s con {errors} errores!
        </motion.div>
      )}
    </div>
  );
}
