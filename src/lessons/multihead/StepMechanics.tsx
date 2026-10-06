"use client";
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import * as THREE from "three";
import { Button, Card, Formula, Slider, Stage } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { useSceneContext } from "../atencion/bits";

const HEAD_COLORS = ["#D97757", "#6A9BCC", "#788C5D", "#C46686", "#E3C77B", "#8A8A85"];
const H_TOTAL = 4;
const D_OPTIONS = [64, 128, 256, 512, 768, 1024];
const H_OPTIONS = [1, 2, 4, 8, 16];
const LABELS = ["1. Entrada: un vector de d_model números", "2. Se reparte entre h cabezas (cada una ve d_k)", "3. Cada cabeza hace su atención y se concatenan", "4. W_O mezcla todo y devuelve d_model"];

function Block({ pos, size, color, target, opacity = 1 }: { pos: [number, number, number]; size: [number, number, number]; color: string; target: [number, number, number]; opacity?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.lerp(new THREE.Vector3(...target), 1 - Math.exp(-6 * dt));
  });
  return (
    <mesh ref={ref} position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.5} />
    </mesh>
  );
}

function Scene({ h, stage }: { h: number; stage: number }) {
  const hh = H_TOTAL / h;
  const blocks = Array.from({ length: h }, (_, k) => {
    const yStack = (k - (h - 1) / 2) * hh;
    const ySpread = yStack * 1.5;
    const target: [number, number, number] = stage === 0 ? [-4.5, yStack, 0] : stage === 1 ? [-1.2, ySpread, 0] : stage === 2 ? [1.5, yStack, 0] : [1.5, yStack, 0];
    return { k, yStack, target };
  });
  const thick = stage === 1 ? 1.6 : 1;
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 6]} intensity={1.2} />
      {blocks.map(({ k, target }) => (
        <Block key={`${h}-${k}`} pos={[-4.5, target[1], 0]} size={[0.9 * thick, hh * (stage === 1 ? 0.8 : 0.96), 0.9 * thick]} color={HEAD_COLORS[k % HEAD_COLORS.length]} target={target} />
      ))}
      {/* W_O */}
      <mesh position={[3.4, 0, 0]} visible={stage >= 3}>
        <boxGeometry args={[0.5, H_TOTAL, H_TOTAL * 0.6]} />
        <meshStandardMaterial color="#F0EEE6" transparent opacity={0.35} />
      </mesh>
      {stage >= 3 && (
        <mesh position={[5.2, 0, 0]}>
          <boxGeometry args={[0.9, H_TOTAL, 0.9]} />
          <meshStandardMaterial color="#E8A387" />
        </mesh>
      )}
      <Html position={[-4.5, -3.1, 0]} center className="pointer-events-none whitespace-nowrap text-[11px] text-ivory/70">entrada</Html>
      {stage === 1 && <Html position={[-1.2, -3.4, 0]} center className="pointer-events-none whitespace-nowrap text-[11px] text-ivory/70">{h} cabezas en paralelo</Html>}
      {stage >= 2 && <Html position={[1.5, -3.1, 0]} center className="pointer-events-none whitespace-nowrap text-[11px] text-ivory/70">concatenado</Html>}
      {stage >= 3 && <Html position={[3.4, -3.1, 0]} center className="pointer-events-none whitespace-nowrap text-[11px] text-ivory/70">W_O</Html>}
      {stage >= 3 && <Html position={[5.2, -3.1, 0]} center className="pointer-events-none whitespace-nowrap text-[11px] text-ivory/70">salida</Html>}
      <OrbitControls enablePan={false} />
    </>
  );
}

export default function StepMechanics() {
  const guide = useGuide();
  const [di, setDi] = useState(3);
  const [hi, setHi] = useState(3);
  const [stage, setStage] = useState(0);
  const said = useRef(false);
  const d = D_OPTIONS[di];
  const h = H_OPTIONS[hi];
  const dk = d / h;
  const perHead = 3 * d * dk;
  const total = 4 * d * d;

  useSceneContext(`Paso 2 (mecánica multi-head, 3D). d_model=${d}, h=${h} cabezas, d_k=d_v=${dk}. Parámetros de atención por capa: ${total.toLocaleString("es")} (3 matrices Q/K/V de ${d}×${dk} por cabeza = ${perHead.toLocaleString("es")} + W_O ${d}×${d}). Etapa de la animación: ${LABELS[stage]}.`);

  const next = () => {
    const s = Math.min(3, stage + 1);
    setStage(s);
    if (s === 3 && !said.current) {
      said.current = true;
      guide.say("Fíjate: con más cabezas cada una es más pequeña, pero el total de parámetros no cambia. Reparten el trabajo, no lo multiplican.", "explaining");
    }
  };

  return (
    <div className="grid gap-4">
      <Card title="Dividir, atender en paralelo, concatenar">
        No se hacen h atenciones enormes: el vector de <b>d_model</b> números se reparte en h trozos de tamaño <b>d_k = d_model / h</b>. Cada cabeza
        trabaja en su trozo, todas a la vez, y al final se pegan (concatenan) y la matriz <b>W_O</b> las mezcla.
        <Formula>MultiHead = Concat(cabeza₁, …, cabezaₕ) · W_O</Formula>
      </Card>
      <Stage height={380}>
        <Canvas camera={{ position: [0, 1.5, 11], fov: 50 }}>
          <Scene h={h} stage={stage} />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-night/70 px-3 py-1.5 text-xs text-ivory">{LABELS[stage]}</div>
      </Stage>
      <div className="flex flex-wrap gap-2">
        <Button onClick={next} disabled={stage === 3}>Siguiente etapa ▶</Button>
        <Button variant="ghost" onClick={() => setStage(Math.max(0, stage - 1))} disabled={stage === 0}>◀ Atrás</Button>
        <Button variant="outline" onClick={() => setStage(0)}>Reiniciar</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Ajusta el tamaño">
          <div className="grid gap-3">
            <Slider label="d_model" value={di} min={0} max={D_OPTIONS.length - 1} step={1} onChange={setDi} format={(v) => String(D_OPTIONS[v])} />
            <Slider label="Cabezas (h)" value={hi} min={0} max={H_OPTIONS.length - 1} step={1} onChange={setHi} format={(v) => String(H_OPTIONS[v])} color="#6A9BCC" />
          </div>
        </Card>
        <Card title="Las cuentas">
          <div className="grid gap-1 font-mono text-xs">
            <div>d_k = {d} / {h} = <b className="text-clay-light">{dk}</b></div>
            <div>Q, K, V por cabeza: 3 × {d} × {dk} = {perHead.toLocaleString("es")}</div>
            <div>Las {h} cabezas: {(perHead * h).toLocaleString("es")} (= 3·{d}²)</div>
            <div>W_O: {d} × {d} = {(d * d).toLocaleString("es")}</div>
            <div className="mt-1 text-sm">Total: <b className="text-clay-light">{total.toLocaleString("es")}</b> parámetros</div>
          </div>
          <p className="mt-2 text-xs text-ivory/60">Mueve h: d_k cambia, pero el total solo depende de d_model.</p>
        </Card>
      </div>
    </div>
  );
}
