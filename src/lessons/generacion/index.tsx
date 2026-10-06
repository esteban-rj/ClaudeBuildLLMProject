"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Formula, Slider, Steps } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { START_PROMPTS, WORD_COLORS, applyTopKP, entropyBits, nextCounts, sampleIndex, softmaxT } from "./model";
import { Wheel } from "./Wheel";
import { Hallucination } from "./Hallucination";
import { Quiz } from "./Quiz";

const STEPS = ["Logits → softmax", "Temperatura", "Top-k y top-p", "Generar token a token", "¿Por qué alucinan?", "Quiz"];

const CANDS = ["rey", "niño", "dragón", "príncipe", "hombre", "lobo", "gato", "pequeño", "pueblo", "zorro", "castillo", "robot"];
const BASE_LOGITS = [3.5, 3.2, 2.8, 2.3, 2.2, 2.0, 1.8, 1.6, 1.5, 1.3, 1.0, 0.4];

const rnd = () => Math.random();
const pct = (x: number) => `${(x * 100).toFixed(x < 0.01 && x > 0 ? 1 : 0)}%`;

function Prompt() {
  return (
    <div className="mb-3 rounded-xl bg-night/60 px-4 py-3 font-serif text-lg text-ivory">
      Érase una vez un <span className="rounded bg-clay/30 px-2 text-clay-light">▯</span>
      <span className="ml-3 text-xs text-ivory/50">el modelo puntúa cada palabra posible</span>
    </div>
  );
}

/* ---------- Paso 1 ---------- */
function StepSoftmax({ logits, setLogits }: { logits: number[]; setLogits: (l: number[]) => void }) {
  const probs = softmaxT(logits, 1);
  const exps = logits.map((l) => Math.exp(l));
  const total = exps.reduce((a, b) => a + b, 0);
  const lo = Math.min(...logits, 0);
  const hi = Math.max(...logits);
  const bump = (i: number, d: number) => setLogits(logits.map((l, k) => (k === i ? Math.round((l + d) * 10) / 10 : l)));
  return (
    <Card title="De puntuaciones (logits) a probabilidades">
      <Prompt />
      <p className="mb-3 text-xs">
        La última capa del transformer da un número crudo por cada palabra del vocabulario: el <b>logit</b>. Puede ser negativo o enorme, no suma 1. Para convertirlo en probabilidad usamos <b>softmax</b>: elevamos e a cada logit y dividimos por la suma. Usa ▲▼ para cambiar un logit.
      </p>
      <div className="space-y-1">
        <div className="grid grid-cols-[84px_1fr_64px_1fr_44px] items-center gap-2 text-[10px] uppercase text-ivory/40">
          <span>Palabra</span><span>Logit z</span><span className="text-right">e^z</span><span>Probabilidad</span><span />
        </div>
        {CANDS.map((w, i) => (
          <div key={w} className="grid grid-cols-[84px_1fr_64px_1fr_44px] items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-mono text-ivory">
              <button className="text-ivory/40 hover:text-clay" onClick={() => bump(i, 0.3)} aria-label={`subir ${w}`}>▲</button>
              <button className="text-ivory/40 hover:text-clay" onClick={() => bump(i, -0.3)} aria-label={`bajar ${w}`}>▼</button>
              {w}
            </span>
            <div className="relative flex h-3 items-center rounded bg-ivory/10">
              <motion.div className="absolute h-full rounded" style={{ background: "#6A9BCC", left: `${(Math.min(0, logits[i]) - lo) / (hi - lo) * 100}%` }} animate={{ width: `${(Math.abs(logits[i]) / (hi - lo)) * 100}%` }} />
              <span className="absolute right-1 font-mono text-[10px] text-ivory/80">{logits[i].toFixed(1)}</span>
            </div>
            <span className="text-right font-mono text-ivory/60">{exps[i].toFixed(1)}</span>
            <div className="h-3 overflow-hidden rounded bg-ivory/10">
              <motion.div className="h-full bg-clay" animate={{ width: `${probs[i] * 100}%` }} />
            </div>
            <span className="text-right font-mono text-clay-light">{pct(probs[i])}</span>
          </div>
        ))}
      </div>
      <Formula>p(rey) = e^{logits[0].toFixed(1)} / Σ = {exps[0].toFixed(1)} / {total.toFixed(1)} = {pct(probs[0])}</Formula>
      <p className="text-xs text-ivory/60">Suma de todas las probabilidades: {(probs.reduce((a, b) => a + b, 0) * 100).toFixed(0)}%. Fíjate: subir un logit en 1 multiplica su peso por e ≈ 2,7.</p>
    </Card>
  );
}

/* ---------- Paso 2 ---------- */
function StepTemp({ T, setT }: { T: number; setT: (t: number) => void }) {
  const probs = softmaxT(BASE_LOGITS, T);
  const [counts, setCounts] = useState<number[] | null>(null);
  const H = entropyBits(probs);
  const label = T < 0.3 ? "casi greedy: siempre la misma palabra" : T <= 1.2 ? "equilibrado" : "creativo… y cada vez más caótico";
  const sample = () => {
    const c = CANDS.map(() => 0);
    for (let k = 0; k < 20; k++) c[sampleIndex(probs, rnd())]++;
    setCounts(c);
  };
  return (
    <Card title="Temperatura: cuánto arriesga el modelo">
      <Prompt />
      <p className="mb-3 text-xs">Antes del softmax dividimos los logits entre T: <b>p = softmax(z / T)</b>. T baja → gana el favorito; T alta → todo se iguala.</p>
      <Slider label="Temperatura T" value={T} min={0.1} max={2} step={0.05} onChange={(v) => { setT(v); setCounts(null); }} />
      <div className="my-2 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => { setT(0.1); setCounts(null); }}>🧊 Greedy (0,1)</Button>
        <Button variant="ghost" onClick={() => { setT(1); setCounts(null); }}>⚖️ Normal (1,0)</Button>
        <Button variant="ghost" onClick={() => { setT(1.8); setCounts(null); }}>🔥 Creativo (1,8)</Button>
        <Button variant="outline" onClick={sample} className="ml-auto">🎲 Muestrear 20 veces</Button>
      </div>
      <div className="space-y-1">
        {CANDS.map((w, i) => (
          <div key={w} className="flex items-center gap-2 text-xs">
            <span className="w-20 font-mono text-ivory">{w}</span>
            <div className="h-3 flex-1 overflow-hidden rounded bg-ivory/10">
              <motion.div className="h-full" style={{ background: WORD_COLORS[i % 12] }} animate={{ width: `${probs[i] * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 25 }} />
            </div>
            <span className="w-10 text-right font-mono text-clay-light">{pct(probs[i])}</span>
            <span className="w-14 font-mono text-[11px] text-ivory/60">{counts ? "●".repeat(Math.min(counts[i], 6)) + (counts[i] > 6 ? `+${counts[i] - 6}` : "") : ""}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-ivory/70">
        T = <b className="text-clay-light">{T.toFixed(2)}</b>: {label}. Entropía ≈ {H.toFixed(2)} bits (0 = totalmente seguro, 3,6 = reparto uniforme entre 12).
      </div>
      {counts && <div className="mt-1 text-xs text-ivory/60">En 20 muestreos salieron {counts.filter((c) => c > 0).length} palabras distintas.</div>}
    </Card>
  );
}

/* ---------- Paso 3 ---------- */
function StepTopKP({ T }: { T: number }) {
  const [k, setK] = useState(12);
  const [p, setP] = useState(1);
  const probs = softmaxT(BASE_LOGITS, T);
  const f = applyTopKP(probs, k, p);
  const [pick, setPick] = useState<string | null>(null);
  const kept = f.status.filter((s) => s === "kept").length;
  return (
    <Card title="Top-k y top-p: recortar la cola">
      <Prompt />
      <p className="mb-3 text-xs">
        Las palabras muy improbables rara vez son buenas. <b>Top-k</b> se queda con las k más probables. <b>Top-p (nucleus)</b> se queda con las más probables hasta sumar p. Lo tachado se descarta y el resto se <b>renormaliza</b> para volver a sumar 100%. (Usando T = {T.toFixed(2)} del paso anterior.)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="top-k" value={k} min={1} max={12} step={1} onChange={(v) => { setK(v); setPick(null); }} format={(v) => (v === 12 ? "12 (todas)" : String(v))} color="#6A9BCC" />
        <Slider label="top-p" value={p} min={0.1} max={1} step={0.05} onChange={(v) => { setP(v); setPick(null); }} format={(v) => (v === 1 ? "1,00 (todas)" : v.toFixed(2))} color="#9DB37E" />
      </div>
      <div className="mt-3 space-y-1">
        {f.order.map((idx, r) => {
          const st = f.status[r];
          const cum = f.order.slice(0, r + 1).reduce((a, j) => a + probs[j], 0);
          return (
            <div key={CANDS[idx]} className={`flex items-center gap-2 text-xs ${st === "kept" ? "" : "opacity-45"}`}>
              <span className={`w-20 font-mono ${st === "kept" ? "text-ivory" : "text-ivory line-through decoration-rose decoration-2"}`}>{CANDS[idx]}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded bg-ivory/10">
                <div className="absolute h-full bg-ivory/25" style={{ width: `${probs[idx] * 100}%` }} />
                <motion.div className="absolute h-full bg-clay" animate={{ width: `${f.final[idx] * 100}%` }} />
              </div>
              <span className="w-24 text-right font-mono text-[11px] text-ivory/60">{pct(probs[idx])} → <span className="text-clay-light">{pct(f.final[idx])}</span></span>
              <span className="w-12 text-[10px] text-ivory/40">Σ{(cum * 100).toFixed(0)}%</span>
              <span className="w-10 text-[10px] text-rose">{st === "k" ? "top-k" : st === "p" ? "top-p" : ""}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-ivory/70">Quedan {kept} candidatas.</span>
        <Button variant="outline" onClick={() => setPick(CANDS[sampleIndex(f.final, rnd())])}>🎲 Muestrear</Button>
        {pick && <span className="rounded bg-clay/20 px-2 py-1 font-mono text-clay-light">→ {pick}</span>}
      </div>
      <p className="mt-2 text-xs text-ivory/50">Con k=1 tienes greedy. Con p=0,9 quitas la cola del 10% menos probable, pero si el modelo está muy seguro quizá solo quede 1 palabra.</p>
    </Card>
  );
}

/* ---------- Paso 4 ---------- */
function StepGenerate({ T, setT }: { T: number; setT: (t: number) => void }) {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [startIdx, setStartIdx] = useState(0);
  const [tokens, setTokens] = useState<string[]>(START_PROMPTS[0].tokens);
  const [auto, setAuto] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const pending = useRef<string | null>(null);
  const told = useRef(false);
  const ended = tokens[tokens.length - 1] === "." || tokens.length >= 40;
  const running = auto && !ended;

  const dist = useMemo(() => {
    const n = nextCounts(tokens);
    const probs = softmaxT(n.counts.map((c) => Math.log(c)), T);
    return { ...n, probs };
  }, [tokens, T]);

  const generate = useCallback(() => {
    if (spinning || ended) return;
    const i = sampleIndex(dist.probs, rnd());
    let a0 = 0;
    for (let k = 0; k < i; k++) a0 += dist.probs[k];
    const mid = (a0 + dist.probs[i] * (0.15 + rnd() * 0.7)) * 360;
    pending.current = dist.words[i];
    setAngle((cur) => cur + 1440 + ((((-mid - cur) % 360) + 360) % 360));
    setSpinning(true);
  }, [spinning, ended, dist]);

  const onDone = () => {
    if (!pending.current) return;
    const w = pending.current;
    pending.current = null;
    setTokens((t) => [...t, w]);
    setSpinning(false);
    if (w === "." && !told.current) {
      told.current = true;
      gRef.current.say("¡Frase terminada! Cada palabra se eligió una a una, dependiendo solo de las anteriores. Dale otra vez: con la misma entrada saldrá una historia distinta.", "happy");
    }
  };

  useEffect(() => {
    if (!running || spinning) return;
    const id = setTimeout(generate, 350);
    return () => clearTimeout(id);
  }, [running, spinning, generate]);

  useEffect(() => {
    gRef.current.setContext(`Generación autoregresiva con un mini modelo de ${dist.kind}s. Texto: «${tokens.join(" ")}». T=${T.toFixed(2)}. Candidatos: ${dist.words.map((w, i) => `${w} ${(dist.probs[i] * 100).toFixed(0)}%`).join(", ")}.`);
  }, [tokens, T, dist]);

  const reset = (idx = startIdx) => {
    setAuto(false);
    setSpinning(false);
    pending.current = null;
    setTokens(START_PROMPTS[idx].tokens);
  };

  return (
    <Card title="Generación autoregresiva: un token cada vez">
      <p className="mb-3 text-xs">
        Un mini modelo de lenguaje en español hecho a mano (tablas de trigramas/bigramas: mira las dos últimas palabras y sabe qué suele venir). Funciona igual que un LLM: calcula una distribución, <b>gira la ruleta</b>, añade el token y repite.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ivory/60">Empieza con:</span>
        {START_PROMPTS.map((s, i) => (
          <button key={i} onClick={() => { setStartIdx(i); reset(i); }} className={`rounded-full px-3 py-1 ${i === startIdx ? "bg-clay text-night" : "bg-ivory/5 text-ivory/70 hover:text-ivory"}`}>{s.label}</button>
        ))}
      </div>
      <div className="min-h-16 rounded-xl bg-night/60 p-3 font-serif text-lg leading-relaxed text-ivory">
        {tokens.map((t, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={i < START_PROMPTS[startIdx].tokens.length ? "text-ivory/60" : "text-clay-light"}>
            {t === "." || t === "," ? "" : " "}
            {t}
          </motion.span>
        ))}
        {!ended && <span className="ml-1 animate-pulse text-clay">▮</span>}
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-[260px_1fr]">
        <Wheel words={dist.words} probs={dist.probs} angle={angle} duration={1.5} onDone={onDone} />
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-ivory/40">Siguiente token ({dist.kind})</div>
          {dist.words.map((w, i) => (
            <div key={w} className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-sm" style={{ background: WORD_COLORS[i % 12] }} />
              <span className="w-20 font-mono text-ivory">{w === "." ? "«.» (fin)" : w}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded bg-ivory/10">
                <motion.div className="h-full" style={{ background: WORD_COLORS[i % 12] }} animate={{ width: `${dist.probs[i] * 100}%` }} />
              </div>
              <span className="w-10 text-right font-mono text-clay-light">{pct(dist.probs[i])}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <Slider label="Temperatura" value={T} min={0.1} max={2} step={0.05} onChange={setT} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={generate} disabled={spinning || ended || running}>🎰 Generar token</Button>
          <Button variant={running ? "primary" : "outline"} onClick={() => setAuto((a) => !a)} disabled={ended}>{running ? "⏸ Parar" : "▶ Auto"}</Button>
          <Button variant="ghost" onClick={() => reset()}>↺ Reiniciar</Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-ivory/50">Con T baja siempre sale la misma frase aburrida; con T alta aparecen palabras raras. Un LLM real hace lo mismo con un vocabulario de ~100.000 tokens y mucho más contexto.</p>
    </Card>
  );
}

/* ---------- Lección ---------- */
export default function Lesson() {
  const guide = useGuide();
  const gRef = useRef(guide);
  useEffect(() => {
    gRef.current = guide;
  });
  const [step, setStep] = useState(0);
  const [logits, setLogits] = useState(BASE_LOGITS);
  const [T, setT] = useState(1);
  const said = useRef<Set<number>>(new Set());

  useEffect(() => {
    gRef.current.setContext(`Lección de generación, paso ${step + 1}: ${STEPS[step]}.`);
    if (step > 0 && !said.current.has(step)) {
      said.current.add(step);
      const msgs: Record<number, string> = {
        1: "La temperatura es el botón de creatividad. Muévela de 0,1 a 2 y observa cómo se aplana el reparto.",
        2: "Ahora recortamos la cola: top-k y top-p tachan los candidatos raros y renormalizan lo que queda.",
        3: "¡A generar! Gira la ruleta: cada gajo es una palabra y su tamaño es su probabilidad. Mira el resultado con distintas temperaturas.",
        4: "Esto es lo más importante para usar bien un modelo: elige lo probable, no lo verdadero. Pruébalo con tres preguntas.",
        5: "¡Quiz final! Demuestra lo que has aprendido sobre cómo generan texto los modelos.",
      };
      gRef.current.say(msgs[step], "explaining");
    }
  }, [step]);

  return (
    <div className="space-y-4">
      <Steps steps={STEPS} current={step} onChange={setStep} />
      {step === 0 && <StepSoftmax logits={logits} setLogits={setLogits} />}
      {step === 1 && <StepTemp T={T} setT={setT} />}
      {step === 2 && <StepTopKP T={T} />}
      {step === 3 && <StepGenerate T={T} setT={setT} />}
      {step === 4 && <Hallucination />}
      {step === 5 && <Quiz />}
      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>← Anterior</Button>
        <Button disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Siguiente →</Button>
      </div>
    </div>
  );
}
