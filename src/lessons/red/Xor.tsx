"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Slider, Button } from "@/components/ui";
import { useGuide, useGuideStore } from "@/lib/guide-store";
import { makeXor } from "../neurona/math";
import { accuracyOf, createMlp, predict, trainStep, type Mlp, type Sample } from "./nn";

const SIZE = 380;
const R = 3;
const RES = 64;
const toPx = (v: number) => ((v + R) / (2 * R)) * SIZE;
const toPy = (v: number) => SIZE - ((v + R) / (2 * R)) * SIZE;

export default function Xor() {
  const guide = useGuide();
  const setContext = useGuideStore((s) => s.setSceneContext);
  const data = useMemo<Sample[]>(() => makeXor(11, 10).map((p) => ({ x: [p.x, p.y], y: p.label })), []);
  const [hidden, setHidden] = useState(4);
  const [seed, setSeed] = useState(1);
  const net = useRef<Mlp>(createMlp([2, 4, 1], 1));
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ epoch: 0, loss: 0.7, acc: 0.5 });
  const [tick, setTick] = useState(0);
  const cv = useRef<HTMLCanvasElement>(null);
  const epoch = useRef(0);
  const said = useRef(false);

  const reset = useCallback((h: number, s: number) => {
    net.current = createMlp([2, h, 1], s);
    epoch.current = 0;
    setStats({ epoch: 0, loss: 0.7, acc: accuracyOf(net.current, data) });
    setTick((t) => t + 1);
  }, [data]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      let loss = 0;
      for (let k = 0; k < 12; k++) loss = trainStep(net.current, data, 0.5);
      epoch.current += 12;
      const acc = accuracyOf(net.current, data);
      setStats({ epoch: epoch.current, loss, acc });
      setTick((t) => t + 1);
      if (acc >= 0.97 && !said.current) {
        said.current = true;
        guide.say("¡Lo logró! La capa oculta dobló el espacio: ahora la frontera ya no es una recta. Eso es lo que una sola neurona no podía hacer.", "happy");
      }
      if (epoch.current >= 6000) {
        setRunning(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, data]);

  useEffect(() => {
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const off = document.createElement("canvas");
    off.width = RES;
    off.height = RES;
    const octx = off.getContext("2d")!;
    const img = octx.createImageData(RES, RES);
    for (let j = 0; j < RES; j++)
      for (let i = 0; i < RES; i++) {
        const p = predict(net.current, [-R + ((i + 0.5) / RES) * 2 * R, R - ((j + 0.5) / RES) * 2 * R]);
        const k = (j * RES + i) * 4;
        img.data[k] = 106 * (1 - p) + 217 * p;
        img.data[k + 1] = 155 * (1 - p) + 119 * p;
        img.data[k + 2] = 204 * (1 - p) + 87 * p;
        img.data[k + 3] = 60 + Math.abs(p - 0.5) * 2 * 140;
      }
    octx.putImageData(img, 0, 0);
    ctx.fillStyle = "#141413";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(off, 0, 0, SIZE, SIZE);
    ctx.strokeStyle = "rgba(240,238,230,0.3)";
    ctx.beginPath();
    ctx.moveTo(SIZE / 2, 0);
    ctx.lineTo(SIZE / 2, SIZE);
    ctx.moveTo(0, SIZE / 2);
    ctx.lineTo(SIZE, SIZE / 2);
    ctx.stroke();
    for (const d of data) {
      ctx.beginPath();
      if (d.y === 1) ctx.arc(toPx(d.x[0]), toPy(d.x[1]), 6, 0, Math.PI * 2);
      else ctx.rect(toPx(d.x[0]) - 5, toPy(d.x[1]) - 5, 10, 10);
      ctx.fillStyle = d.y === 1 ? "#D97757" : "#6A9BCC";
      ctx.fill();
      ctx.strokeStyle = "#141413";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [tick, data]);

  useEffect(() => {
    setContext(`Paso 3 (resolver XOR): red 2-${hidden}-1 entrenándose con backprop. Época ${stats.epoch}, pérdida ${stats.loss.toFixed(3)}, acierto ${Math.round(stats.acc * 100)}%. ${running ? "Entrenando ahora." : "Detenida."} Con 1 neurona oculta no puede resolver XOR; con 2 o más sí.`);
  }, [hidden, stats, running, setContext]);

  const changeHidden = (h: number) => {
    setRunning(false);
    said.current = false;
    setHidden(h);
    reset(h, seed);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={<>Mapa de la red · <span className={stats.acc >= 0.95 ? "text-olive" : "text-clay"}>{Math.round(stats.acc * 100)}% de aciertos</span></>}>
        <div className="flex justify-center">
          <canvas ref={cv} width={SIZE} height={SIZE} className="aspect-square w-full max-w-[420px] rounded-xl border border-ivory/10" />
        </div>
        <p className="mt-2 text-xs text-ivory/50">El color de fondo es lo que la red «cree» en cada punto: naranja = clase 1, azul = clase 0.</p>
      </Card>
      <Card title="Entrena la red">
        <p className="mb-3">Es XOR: naranja en las esquinas opuestas. Una neurona sola fracasaba; aquí hay una <b className="text-ivory">capa oculta</b>. Pulsa entrenar y mira cómo la frontera se dobla.</p>
        <Slider label="Neuronas en la capa oculta" value={hidden} min={1} max={8} step={1} onChange={changeHidden} format={(v) => String(v)} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => setRunning((r) => !r)}>{running ? "Pausar" : "Entrenar"}</Button>
          <Button variant="ghost" onClick={() => { setRunning(false); said.current = false; const s = seed + 1; setSeed(s); reset(hidden, s); }}>Reiniciar pesos</Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs">
          <div className="rounded-lg bg-night/60 p-2">época<br /><span className="text-clay-light">{stats.epoch}</span></div>
          <div className="rounded-lg bg-night/60 p-2">pérdida<br /><span className="text-clay-light">{stats.loss.toFixed(3)}</span></div>
          <div className="rounded-lg bg-night/60 p-2">aciertos<br /><span className="text-clay-light">{Math.round(stats.acc * 100)}%</span></div>
        </div>
        <p className="mt-3 text-xs text-ivory/50">Cada época: la red predice, mide su error (pérdida) y ajusta todos sus pesos un poquito en la dirección que lo reduce (backpropagation). Prueba con 1 neurona oculta: ¡no puede! Con 2 o más, sí. A veces conviene reiniciar los pesos si se atasca. En la próxima lección veremos cómo funciona ese ajuste.</p>
      </Card>
    </div>
  );
}
