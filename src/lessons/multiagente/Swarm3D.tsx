"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { PALETTE } from "@/components/ui";
import { Clawd3D } from "./Clawd3D";

export const WORKER_NAMES = ["Neurona", "Red", "Entrenamiento", "Tokens", "Atención", "Multi-head", "Transformer", "Generación"];
export type Phase = "idle" | "decompose" | "work" | "integrate" | "done";

const T_DEC = 1.6;
const RETURN = 1.2;
const INTEGRATE = 1.4;
const ORCH: [number, number, number] = [0, 0, -1.2];

const BUBBLE_TEXT: Record<Phase, string> = {
  idle: "«Construye una app educativa sobre transformers»",
  decompose: "Descompongo en subtareas…",
  work: "Esperando resultados (mi contexto está limpio)",
  integrate: "Integrando los resultados…",
  done: "¡App lista! 🎉",
};

function Sim({ n, size, runId, onPhase }: { n: number; size: number; runId: number; onPhase: (p: Phase) => void }) {
  const sim = useRef({ t: 0, running: false });
  const phaseRef = useRef<Phase>("idle");
  const [phase, setPhase] = useState<Phase>("idle");
  const orchAct = useRef(0);
  const taskRefs = useRef<(Mesh | null)[]>([]);
  const resRefs = useRef<(Mesh | null)[]>([]);
  const barRefs = useRef<(Mesh | null)[]>([]);
  const bubbleRefs = useRef<(Mesh | null)[]>([]);
  const orchGroup = useRef<Group>(null);

  const workers = useMemo(() => {
    return Array.from({ length: n }, (_, i) => {
      const th = n === 1 ? 0 : (-110 + (220 * i) / (n - 1)) * (Math.PI / 180);
      const R = 4.2;
      const x = ORCH[0] + R * Math.sin(th);
      const z = ORCH[2] + R * Math.cos(th) * 0.9 + 1.5;
      return { x, z, f: i === 0 ? 1 : 0.65 + 0.35 * (((i * 37) % 10) / 10), stagger: (0.6 * i) / Math.max(n, 1), act: { current: 0 } };
    });
  }, [n]);

  const W = 2.5 + size * 0.5;
  const finish = workers.map((w) => T_DEC + W * w.f);
  const tEnd = Math.max(...finish) + RETURN + INTEGRATE;

  const lastRun = useRef(runId);
  useEffect(() => {
    if (runId !== lastRun.current) {
      lastRun.current = runId;
      sim.current = { t: 0, running: true };
    }
  }, [runId]);

  useFrame((_, dt) => {
    const s = sim.current;
    if (s.running) {
      s.t += Math.min(dt, 0.05);
      if (s.t >= tEnd) { s.running = false; s.t = tEnd; }
    }
    const t = s.t;
    const started = s.running || t > 0;
    let ph: Phase = "idle";
    if (started) ph = t < T_DEC ? "decompose" : t < Math.max(...finish) ? "work" : t < tEnd ? "integrate" : "done";
    if (ph !== phaseRef.current) { phaseRef.current = ph; setPhase(ph); onPhase(ph); }

    orchAct.current = ph === "decompose" || ph === "integrate" ? 1 : ph === "done" ? 0.6 : 0;
    if (orchGroup.current) orchGroup.current.scale.setScalar(ph === "integrate" ? 1 + 0.05 * Math.sin(t * 14) : 1);

    workers.forEach((w, i) => {
      const task = taskRefs.current[i];
      const res = resRefs.current[i];
      const bar = barRefs.current[i];
      const bub = bubbleRefs.current[i];
      // paquete de tarea: orquestador -> trabajador
      if (task) {
        const p = (t - w.stagger) / 1.0;
        task.visible = started && p > 0 && p < 1;
        const e = Math.min(Math.max(p, 0), 1);
        task.position.set(ORCH[0] + (w.x - ORCH[0]) * e, 1.8 + Math.sin(e * Math.PI) * 1.2, ORCH[2] + (w.z - ORCH[2]) * e);
        task.rotation.y = t * 6;
      }
      // progreso
      const p0 = T_DEC;
      const prog = !started ? 0 : Math.min(Math.max((t - p0) / (finish[i] - p0), 0), 1);
      if (bar) {
        bar.scale.x = Math.max(prog, 0.001);
        bar.position.x = -0.6 + 0.6 * prog;
        (bar.material as MeshStandardMaterial).color.set(prog >= 1 ? PALETTE.olive : PALETTE.sand);
      }
      w.act.current = prog > 0 && prog < 1 ? 1 : 0;
      if (bub) (bub.material as MeshStandardMaterial).opacity = 0.1 + (prog > 0 && prog < 1 ? 0.1 : 0);
      // resultado: trabajador -> orquestador
      if (res) {
        const p = (t - finish[i]) / RETURN;
        res.visible = started && p > 0 && p < 1;
        const e = Math.min(Math.max(p, 0), 1);
        res.position.set(w.x + (ORCH[0] - w.x) * e, 1.8 + Math.sin(e * Math.PI) * 1.2, w.z + (ORCH[2] - w.z) * e);
      }
    });
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 6]} intensity={1.6} />
      <gridHelper args={[16, 16, "#3a3935", "#2a2926"]} position={[0, -0.02, 0]} />

      {/* Orquestador */}
      <group ref={orchGroup} position={ORCH}>
        <Clawd3D scale={1.8} activity={orchAct} />
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[2.0, 24, 16]} />
          <meshStandardMaterial color={PALETTE.clay} transparent opacity={0.07} depthWrite={false} />
        </mesh>
        <Html center position={[0, 3.6, 0]} distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div className="w-44 rounded-xl border border-clay/60 bg-night/90 px-2 py-1 text-center text-[10px] leading-tight text-ivory">
            <div className="font-semibold text-clay">Orquestador</div>
            {BUBBLE_TEXT[phase]}
          </div>
        </Html>
        <Html center position={[0, -0.3, 1.3]} distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded bg-clay/20 px-1.5 py-0.5 text-[9px] text-clay-light">ctx: solo resúmenes</div>
        </Html>
      </group>

      {/* Sub-agentes */}
      {workers.map((w, i) => (
        <group key={i} position={[w.x, 0, w.z]}>
          <Clawd3D scale={0.8} color={PALETTE.clayLight} activity={w.act} phase={i} rotationY={Math.atan2(ORCH[0] - w.x, ORCH[2] - w.z)} />
          <mesh ref={(m) => { bubbleRefs.current[i] = m; }} position={[0, 0.7, 0]}>
            <sphereGeometry args={[1.05, 20, 14]} />
            <meshStandardMaterial color={PALETTE.sky} transparent opacity={0.1} depthWrite={false} />
          </mesh>
          {/* barra de progreso */}
          <mesh position={[0, 1.95, 0]}>
            <boxGeometry args={[1.2, 0.14, 0.14]} />
            <meshStandardMaterial color="#2a2926" />
          </mesh>
          <mesh ref={(m) => { barRefs.current[i] = m; }} position={[-0.6, 1.95, 0.02]}>
            <boxGeometry args={[1.2, 0.12, 0.14]} />
            <meshStandardMaterial color={PALETTE.sand} />
          </mesh>
          <Html center position={[0, -0.35, 0.6]} distanceFactor={10} style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded border border-sky/40 bg-night/85 px-1.5 py-0.5 text-center text-[9px] leading-tight text-ivory">
              <div className="font-semibold">{WORKER_NAMES[i % WORKER_NAMES.length]}</div>
              <div className="text-sky">ctx aislado ~{size * 10}k</div>
            </div>
          </Html>
        </group>
      ))}

      {/* Paquetes */}
      {workers.map((_, i) => (
        <group key={`p${i}`}>
          <mesh ref={(m) => { taskRefs.current[i] = m; }} visible={false}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color={PALETTE.clay} emissive={PALETTE.clay} emissiveIntensity={0.8} />
          </mesh>
          <mesh ref={(m) => { resRefs.current[i] = m; }} visible={false}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial color={PALETTE.olive} emissive={PALETTE.olive} emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
      <OrbitControls enablePan={false} minDistance={6} maxDistance={20} maxPolarAngle={Math.PI / 2.1} target={[0, 0.8, 1]} />
    </>
  );
}

export default function Swarm3D({ n, size, runId, onPhase }: { n: number; size: number; runId: number; onPhase: (p: Phase) => void }) {
  return (
    <Canvas camera={{ position: [0, 6.5, 11], fov: 48 }}>
      <Sim key={n} n={n} size={size} runId={runId} onPhase={onPhase} />
    </Canvas>
  );
}
