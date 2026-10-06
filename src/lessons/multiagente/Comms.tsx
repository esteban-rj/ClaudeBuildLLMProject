"use client";
import { useState } from "react";
import { Button, Card, PALETTE, Slider } from "@/components/ui";

// ---------- Reintentos ----------
type Chip = { name: string; attempts: number; ok: boolean };
const NAMES = ["Neurona", "Red", "Tokens", "Atención", "Generación", "Agente"];

function Retries() {
  const [p, setP] = useState(0.3);
  const [r, setR] = useState(1);
  const [res, setRes] = useState<Chip[]>([]);
  const simulate = () => {
    setRes(NAMES.map((name) => {
      let attempts = 0;
      let ok = false;
      while (attempts < r + 1 && !ok) { attempts++; ok = Math.random() >= p; }
      return { name, attempts, ok };
    }));
  };
  const pAgent = 1 - Math.pow(p, r + 1);
  const pAll = Math.pow(pAgent, NAMES.length);
  return (
    <Card title="🔁 Fallos y reintentos">
      <p className="mb-2">Los sub-agentes fallan (límite de herramientas, error de API, resultado inválido). El orquestador puede <b>reintentar</b>, y si sigue fallando, reasignar o avisar.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="Probabilidad de fallo por intento" value={p} min={0} max={0.7} step={0.05} onChange={setP} format={(v) => `${Math.round(v * 100)}%`} color={PALETTE.rose} />
        <Slider label="Reintentos permitidos" value={r} min={0} max={4} step={1} onChange={setR} format={(v) => String(v)} color={PALETTE.sky} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={simulate}>🎲 Simular 6 sub-agentes</Button>
        {res.map((c) => (
          <span key={c.name} className="rounded-full px-2.5 py-1 text-xs" style={{ background: c.ok ? "#788C5D44" : "#C4668644", color: c.ok ? PALETTE.olive : PALETTE.rose }}>
            {c.ok ? "✓" : "✗"} {c.name} ({c.attempts} intento{c.attempts > 1 ? "s" : ""})
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs">Probabilidad de que un agente acabe bien: <b className="text-ivory">{(pAgent * 100).toFixed(1)}%</b> · de que los 6 acaben bien: <b className="text-ivory">{(pAll * 100).toFixed(1)}%</b>. Con muchos agentes, hasta un fallo pequeño casi seguro aparece en alguno, por eso conviene reintentar y verificar.</p>
    </Card>
  );
}

// ---------- Conflictos de archivo ----------
const SHARED_STEPS = [
  { log: "Estado inicial: index.tsx tiene el esqueleto.", file: "// esqueleto", a: "", b: "" },
  { log: "A y B leen index.tsx a la vez.", file: "// esqueleto", a: "leyó", b: "leyó" },
  { log: "A escribe su lección de neuronas en index.tsx.", file: "// lección NEURONAS (A)", a: "✓ escribió", b: "leyó (versión vieja)" },
  { log: "B escribe su lección de atención en el MISMO archivo… ¡y pisa el trabajo de A!", file: "// lección ATENCIÓN (B)", a: "✗ trabajo perdido", b: "✓ escribió" },
];
const ISOLATED_STEPS = [
  { log: "Cada uno tiene su carpeta: src/lessons/neurona y src/lessons/atencion.", files: ["", ""], a: "", b: "" },
  { log: "A y B trabajan a la vez, sin tocarse.", files: ["…", "…"], a: "escribiendo", b: "escribiendo" },
  { log: "Ambos terminan: nada se pisa.", files: ["// lección NEURONAS", "// lección ATENCIÓN"], a: "✓", b: "✓" },
  { log: "El orquestador integra: registra las dos lecciones en un único sitio.", files: ["// lección NEURONAS", "// lección ATENCIÓN"], a: "✓", b: "✓" },
];

function Conflicts() {
  const [shared, setShared] = useState(true);
  const [i, setI] = useState(0);
  const steps = shared ? SHARED_STEPS : ISOLATED_STEPS;
  const s = steps[i];
  return (
    <Card title="💥 Conflictos al editar el mismo archivo">
      <p className="mb-2">Dos sub-agentes que escriben el mismo archivo se pisan. Por eso, al construir esta app, <b>cada sub-agente tuvo su propia carpeta</b> y solo el orquestador tocó lo compartido.</p>
      <div className="mb-3 flex gap-2">
        <button onClick={() => { setShared(true); setI(0); }} className={`rounded-lg px-3 py-1 text-xs ${shared ? "bg-rose text-night" : "bg-ivory/5 text-ivory/70"}`}>Mismo archivo</button>
        <button onClick={() => { setShared(false); setI(0); }} className={`rounded-lg px-3 py-1 text-xs ${!shared ? "bg-olive text-night" : "bg-ivory/5 text-ivory/70"}`}>Una carpeta cada uno</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-clay/40 bg-night/50 p-2 text-xs"><b className="text-clay">Agente A</b><div className="mt-1 font-mono text-ivory/80">{s.a || "—"}</div></div>
        <div className="rounded-xl border border-sky/40 bg-night/50 p-2 text-xs">
          <b className="text-sky">{shared ? "📄 index.tsx (compartido)" : "📁 carpetas"}</b>
          <div className="mt-1 space-y-1 font-mono text-ivory/80">
            {shared ? <div className={i === 3 ? "text-rose" : ""}>{(s as (typeof SHARED_STEPS)[number]).file}</div> : (s as (typeof ISOLATED_STEPS)[number]).files.map((f, k) => <div key={k} className="text-olive">{k === 0 ? "neurona/ " : "atencion/ "}{f}</div>)}
          </div>
        </div>
        <div className="rounded-xl border border-sky/40 bg-night/50 p-2 text-xs"><b className="text-sky">Agente B</b><div className="mt-1 font-mono text-ivory/80">{s.b || "—"}</div></div>
      </div>
      <p className="mt-2 min-h-[2.5rem] text-xs text-ivory">▸ {s.log}</p>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>←</Button>
        <Button onClick={() => setI(Math.min(steps.length - 1, i + 1))} disabled={i === steps.length - 1}>Avanzar →</Button>
      </div>
    </Card>
  );
}

// ---------- Contexto y modelos ----------
function Context() {
  const [mixed, setMixed] = useState(true);
  const [shared, setShared] = useState(false);
  // unidades relativas por millón de tokens (ilustrativas)
  const STRONG = 5, FAST = 1;
  const orchTok = 40_000;
  const subTok = 6 * 60_000;
  const cost = (orchTok * STRONG + subTok * (mixed ? FAST : STRONG)) / 1_000_000;
  const allStrong = (orchTok * STRONG + subTok * STRONG) / 1_000_000;
  const ctxSub = shared ? 120 : 20;
  return (
    <Card title="🫧 Contexto aislado vs. compartido, y qué modelo usar">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex gap-2">
            <button onClick={() => setShared(false)} className={`rounded-lg px-3 py-1 text-xs ${!shared ? "bg-sky text-night" : "bg-ivory/5 text-ivory/70"}`}>Aislado</button>
            <button onClick={() => setShared(true)} className={`rounded-lg px-3 py-1 text-xs ${shared ? "bg-sand text-night" : "bg-ivory/5 text-ivory/70"}`}>Compartido</button>
          </div>
          <div className="mb-1 flex justify-between text-xs text-ivory/70"><span>Contexto de cada sub-agente</span><span className="font-mono">{ctxSub}k tokens</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-night/70"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(ctxSub / 200) * 100}%`, background: shared ? PALETTE.sand : PALETTE.sky }} /></div>
          <p className="mt-2 text-xs">{shared
            ? "Compartido: todos ven todo. Coordinan mejor y no repiten, pero cada uno carga con el ruido de los demás: contexto más grande, más caro y más fácil de confundirse."
            : "Aislado: cada uno solo ve su briefing. Barato y enfocado, pero no sabe lo que hacen los demás: hay que darle por escrito todo lo que necesita (convenciones, rutas, formato de salida)."}</p>
        </div>
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={mixed} onChange={(e) => setMixed(e.target.checked)} /> Orquestador potente + sub-agentes rápidos y baratos</label>
          <div className="mb-1 flex justify-between text-xs text-ivory/70"><span>Coste relativo del proyecto</span><span className="font-mono">{cost.toFixed(2)} u.</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-night/70"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(cost / allStrong) * 100}%`, background: mixed ? PALETTE.olive : PALETTE.rose }} /></div>
          <p className="mt-2 text-xs">El orquestador planifica e integra (decisiones difíciles, pocos tokens) → modelo potente. Los sub-agentes ejecutan tareas acotadas (muchos tokens) → modelo rápido. {mixed ? `Ahorras un ${Math.round((1 - cost / allStrong) * 100)}% frente a usar el potente en todo.` : "Aquí todos usan el potente: funciona, pero caro y más lento."}</p>
          <p className="mt-1 text-[10px] text-ivory/40">Precios relativos ilustrativos: potente = 5 u./M tokens, rápido = 1 u./M tokens.</p>
        </div>
      </div>
    </Card>
  );
}

export default function Comms() {
  return (
    <div className="space-y-3">
      <Retries />
      <Conflicts />
      <Context />
    </div>
  );
}
