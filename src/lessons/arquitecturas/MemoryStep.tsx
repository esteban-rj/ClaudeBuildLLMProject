"use client";
import { useState } from "react";
import { Button, Card, PALETTE } from "@/components/ui";
import { PatternFicha } from "./Gallery";

const LIMIT = 8000;
const SUMMARY_TOKENS = 350;

interface Turn { id: number; text: string; tokens: number; fact?: string }
const SCRIPT: Omit<Turn, "id">[] = [
  { text: "Hola, me llamo Lucía y soy alérgica a las nueces.", tokens: 1800, fact: "nombre: Lucía; alergia: nueces" },
  { text: "Busca recetas de postres para mi cumpleaños (salida de herramienta larga).", tokens: 2400 },
  { text: "Compara tres pastelerías cercanas (resultados de búsqueda).", tokens: 2600 },
  { text: "Mi presupuesto es de 40 €.", tokens: 1500, fact: "presupuesto: 40 €" },
  { text: "Lee el menú completo de la pastelería elegida (PDF).", tokens: 3000 },
  { text: "Reserva para el sábado a las 5.", tokens: 1400, fact: "reserva: sábado 17:00" },
];

interface MemState {
  turns: Turn[];
  summary: { tokens: number; facts: string[] } | null;
  store: string[];
  next: number;
  dropped: string[];
  note: string;
}
const INITIAL: MemState = { turns: [], summary: null, store: [], next: 0, dropped: [], note: "Añade turnos a la conversación y mira cómo se llena la ventana de contexto." };

const used = (s: MemState) => s.turns.reduce((a, t) => a + t.tokens, 0) + (s.summary?.tokens ?? 0);

function compact(s: MemState): MemState {
  if (s.turns.length <= 2) return s;
  const old = s.turns.slice(0, -2);
  const keep = s.turns.slice(-2);
  const facts = [...(s.summary?.facts ?? []), ...old.flatMap((t) => (t.fact ? [t.fact] : []))];
  const before = old.reduce((a, t) => a + t.tokens, 0) + (s.summary?.tokens ?? 0);
  return { ...s, turns: keep, summary: { tokens: SUMMARY_TOKENS, facts }, note: `Compactación: ${before.toLocaleString("es")} tokens de historia → resumen de ${SUMMARY_TOKENS}.` };
}

export default function MemoryStep() {
  const [longTerm, setLongTerm] = useState(false);
  const [auto, setAuto] = useState(false);
  const [s, setS] = useState<MemState>(INITIAL);
  const [answer, setAnswer] = useState<string | null>(null);

  const add = () => {
    setAnswer(null);
    setS((prev) => {
      if (prev.next >= SCRIPT.length) return { ...prev, note: "Se acabó el guion: reinicia para probar otra configuración." };
      const t: Turn = { ...SCRIPT[prev.next], id: prev.next };
      let n: MemState = { ...prev, turns: [...prev.turns, t], next: prev.next + 1, note: `Turno añadido (+${t.tokens.toLocaleString("es")} tokens).` };
      if (longTerm && t.fact) n = { ...n, store: [...n.store, t.fact], note: n.note + " Dato guardado en el almacén externo." };
      if (used(n) > LIMIT) {
        if (auto) n = compact(n);
        else {
          const dropped: string[] = [...n.dropped];
          const turns = [...n.turns];
          while (used({ ...n, turns }) > LIMIT && turns.length > 1) {
            const d = turns.shift();
            if (d?.fact) dropped.push(d.fact);
          }
          n = { ...n, turns, dropped, note: "¡Ventana llena! Se descartaron los turnos más antiguos para que quepa." };
        }
      }
      return n;
    });
  };

  const ask = (fact: string, label: string) => {
    const inCtx = s.turns.some((t) => t.fact === fact) ;
    const inSum = s.summary?.facts.includes(fact);
    const inStore = s.store.includes(fact);
    if (inCtx) setAnswer(`✅ ${label}: lo encuentro en el contexto reciente.`);
    else if (inSum) setAnswer(`🟡 ${label}: lo recuerdo gracias al resumen compactado.`);
    else if (inStore) setAnswer(`🟢 ${label}: no está en el contexto, pero lo recupero del almacén de largo plazo.`);
    else if (s.turns.length === 0 && !s.summary) setAnswer("Primero añade turnos.");
    else setAnswer(`❌ ${label}: ¡lo olvidé! Ya no está en mi contexto ni en ningún almacén.`);
  };

  const pct = Math.min(100, (used(s) / LIMIT) * 100);

  return (
    <div className="space-y-3">
      <Card title="🧠 Memoria: contexto, almacén y compactación" actions={<Button variant="ghost" onClick={() => { setS(INITIAL); setAnswer(null); }}>Reiniciar</Button>}>
        <p className="mb-3">El <b className="text-clay-light">corto plazo</b> es la ventana de contexto: todo lo que el modelo ve ahora (aquí, solo {LIMIT.toLocaleString("es")} tokens para que se llene rápido). El <b className="text-olive">largo plazo</b> es un almacén externo (archivos, base de datos) al que se escribe y se lee mediante herramientas. La <b className="text-sand">compactación</b> resume lo viejo para hacer sitio.</p>

        <div className="mb-3 flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" checked={longTerm} onChange={(e) => setLongTerm(e.target.checked)} /> Guardar datos clave en memoria de largo plazo</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Compactar automáticamente al llenarse</label>
        </div>

        <div className="mb-1 flex justify-between text-xs text-ivory/70">
          <span>Ventana de contexto</span>
          <span className="font-mono">{used(s).toLocaleString("es")} / {LIMIT.toLocaleString("es")} tokens</span>
        </div>
        <div className="mb-3 h-5 overflow-hidden rounded-full bg-night/70">
          <div className="flex h-full transition-all duration-500" style={{ width: `${pct}%` }}>
            {s.summary && <div style={{ width: `${(s.summary.tokens / Math.max(used(s), 1)) * 100}%`, background: PALETTE.sand }} title="Resumen" />}
            {s.turns.map((t, i) => (
              <div key={t.id} className="border-r border-night" style={{ width: `${(t.tokens / Math.max(used(s), 1)) * 100}%`, background: i % 2 ? PALETTE.clay : PALETTE.clayLight }} title={t.text} />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-ivory/10 bg-night/40 p-3">
            <div className="mb-2 text-xs font-semibold text-clay-light">Contexto (corto plazo)</div>
            <ul className="space-y-1 text-xs">
              {s.summary && <li className="rounded bg-sand/20 px-2 py-1 text-sand">📝 Resumen ({s.summary.tokens} tok): {s.summary.facts.length ? s.summary.facts.join(" · ") : "—"}</li>}
              {s.turns.map((t) => <li key={t.id} className="rounded bg-clay/15 px-2 py-1">{t.text} <span className="font-mono text-ivory/50">{t.tokens}</span></li>)}
              {!s.summary && s.turns.length === 0 && <li className="text-ivory/40">vacío</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-ivory/10 bg-night/40 p-3">
            <div className="mb-2 text-xs font-semibold text-olive">Almacén externo (largo plazo)</div>
            <ul className="space-y-1 text-xs">
              {s.store.map((f) => <li key={f} className="rounded bg-olive/20 px-2 py-1 text-olive">💾 {f}</li>)}
              {s.store.length === 0 && <li className="text-ivory/40">{longTerm ? "vacío (se llenará con los datos clave)" : "desactivado"}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={add} disabled={s.next >= SCRIPT.length}>＋ Añadir turno ({s.next}/{SCRIPT.length})</Button>
          <Button variant="outline" onClick={() => setS((p) => compact(p))} disabled={s.turns.length <= 2}>🗜 Compactar ahora</Button>
        </div>
        <p className="mt-2 text-xs text-ivory/70">{s.note}</p>

        <div className="mt-3 rounded-xl bg-night/50 p-3">
          <div className="mb-2 text-xs text-ivory/70">Pregúntale a Clawd:</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => ask(SCRIPT[0].fact!, "Nombre y alergia")}>¿Cómo me llamo y qué alergia tengo?</Button>
            <Button variant="ghost" onClick={() => ask(SCRIPT[3].fact!, "Presupuesto")}>¿Cuál era mi presupuesto?</Button>
          </div>
          {answer && <p className="mt-2 text-sm text-ivory">{answer}</p>}
        </div>
        <p className="mt-2 text-xs text-ivory/50">Prueba: sin ninguna opción, añade los 6 turnos y pregunta por el nombre. Luego reinicia y activa el almacén.</p>
      </Card>
      <PatternFicha id="memory" />
    </div>
  );
}
