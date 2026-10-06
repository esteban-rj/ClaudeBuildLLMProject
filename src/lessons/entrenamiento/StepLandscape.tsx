"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Button, Card, Slider, Stage, PALETTE } from "@/components/ui";
import { GLOBAL_MIN, LAND, fmt, height, landGrad } from "./data";
import { say, setContext } from "./guide";

interface Pos {
  x: number;
  z: number;
}

const START: Pos = { x: 2.6, z: 1.2 };
const MAX_STEPS = 500;

function Terrain({ onPick }: { onPick: (p: Pos) => void }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(LAND * 2, LAND * 2, 90, 90);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const lo = new THREE.Color(PALETTE.sky);
    const mid = new THREE.Color(PALETTE.olive);
    const hi = new THREE.Color(PALETTE.clay);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = height(pos.getX(i), pos.getZ(i));
      pos.setY(i, h);
      const t = THREE.MathUtils.clamp((h + 1) / 4.2, 0, 1);
      if (t < 0.5) c.copy(lo).lerp(mid, t * 2);
      else c.copy(mid).lerp(hi, (t - 0.5) * 2);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh
      geometry={geo}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPick({ x: e.point.x, z: e.point.z });
      }}
    >
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.8} />
    </mesh>
  );
}

function Ball({
  lr,
  running,
  resetKey,
  start,
  onStep,
}: {
  lr: number;
  running: boolean;
  resetKey: number;
  start: Pos;
  onStep: (p: Pos, g: number, stepLen: number, n: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const sim = useRef({ x: start.x, z: start.z, n: 0, acc: 0 });

  useEffect(() => {
    sim.current = { x: start.x, z: start.z, n: 0, acc: 0 };
    ref.current?.position.set(start.x, height(start.x, start.z) + 0.2, start.z);
  }, [resetKey, start]);

  useFrame((_, dt) => {
    const s = sim.current;
    if (running && s.n < MAX_STEPS) {
      s.acc += dt;
      if (s.acc > 0.06) {
        s.acc = 0;
        const { gx, gz } = landGrad(s.x, s.z);
        s.x = THREE.MathUtils.clamp(s.x - lr * gx, -LAND, LAND);
        s.z = THREE.MathUtils.clamp(s.z - lr * gz, -LAND, LAND);
        s.n++;
        const g = Math.hypot(gx, gz);
        onStep({ x: s.x, z: s.z }, g, lr * g, s.n);
      }
    }
    if (ref.current) {
      const target = new THREE.Vector3(s.x, height(s.x, s.z) + 0.2, s.z);
      ref.current.position.lerp(target, 0.35);
    }
  });

  return (
    <mesh ref={ref} position={[start.x, height(start.x, start.z) + 0.2, start.z]}>
      <sphereGeometry args={[0.2, 24, 24]} />
      <meshStandardMaterial color={PALETTE.ivory} emissive={PALETTE.sand} emissiveIntensity={0.5} />
    </mesh>
  );
}

export default function StepLandscape() {
  const [lr, setLr] = useState(0.4);
  const [running, setRunning] = useState(false);
  const [start, setStart] = useState<Pos>(START);
  const [resetKey, setResetKey] = useState(0);
  const [trail, setTrail] = useState<Pos[]>([START]);
  const [info, setInfo] = useState({ n: 0, g: 0, h: height(START.x, START.z), pos: START });
  const flags = useRef({ jumpy: false, done: false });

  const reset = (p?: Pos) => {
    const s = p ?? start;
    setStart(s);
    setTrail([s]);
    setInfo({ n: 0, g: 0, h: height(s.x, s.z), pos: s });
    setRunning(false);
    flags.current = { jumpy: false, done: false };
    setResetKey((k) => k + 1);
  };

  const onStep = (p: Pos, g: number, stepLen: number, n: number) => {
    setTrail((t) => [...t.slice(-200), p]);
    const h = height(p.x, p.z);
    setInfo({ n, g, h, pos: p });
    if (stepLen > 1.2 && !flags.current.jumpy) {
      flags.current.jumpy = true;
      say("¡Uy! Con esa tasa de aprendizaje los pasos son enormes: la bolita se pasa de largo y rebota de pared a pared. Bájala un poco.", "surprised");
    }
    if (stepLen < 0.003 && !flags.current.done && n > 3) {
      flags.current.done = true;
      setRunning(false);
      if (h < GLOBAL_MIN.h + 0.2) {
        say(`¡Llegó al fondo del valle más profundo! Pérdida ${fmt(h, 2)}. Ese es el mínimo global.`, "happy");
      } else {
        say(`Se quedó atascada en un valle, pero no es el más profundo: pérdida ${fmt(h, 2)} frente a ${fmt(GLOBAL_MIN.h, 2)}. Eso es un mínimo local. Prueba a empezar desde otro sitio haciendo clic en la superficie.`, "thinking");
      }
    }
  };

  useEffect(() => {
    setContext(
      `Paso 2 · Paisaje de pérdida 3D. Tasa de aprendizaje ${fmt(lr, 2)}. Bolita en (${fmt(info.pos.x)}, ${fmt(info.pos.z)}) con pérdida ${fmt(info.h)}, ` +
        `${info.n} pasos dados, norma del gradiente ${fmt(info.g)}. ${running ? "Está cayendo." : "Está quieta."} ` +
        `El mínimo global tiene pérdida ${fmt(GLOBAL_MIN.h)} cerca de (${fmt(GLOBAL_MIN.x, 1)}, ${fmt(GLOBAL_MIN.z, 1)}); hay otros valles más someros (mínimos locales).`,
    );
  }, [lr, info, running]);

  const trailPts = trail.map((p) => [p.x, height(p.x, p.z) + 0.08, p.z] as [number, number, number]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Stage height={440}>
        <Canvas camera={{ position: [8, 7, 8], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 4]} intensity={1.6} />
          <Terrain onPick={(p) => reset(p)} />
          <Ball lr={lr} running={running} resetKey={resetKey} start={start} onStep={onStep} />
          {trailPts.length > 1 && <Line points={trailPts} color={PALETTE.ivory} lineWidth={2} />}
          <mesh position={[GLOBAL_MIN.x, GLOBAL_MIN.h + 0.05, GLOBAL_MIN.z]}>
            <ringGeometry args={[0.25, 0.32, 24]} />
            <meshBasicMaterial color={PALETTE.sand} side={THREE.DoubleSide} />
          </mesh>
          <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-night/70 px-3 py-1 text-xs text-ivory/70">
          Haz clic en el terreno para elegir el punto de partida
        </div>
      </Stage>
      <div className="space-y-4">
        <Card title="Baja la montaña a ciegas">
          <p className="mb-3">
            Altura = pérdida. La bolita no ve el mapa: solo siente la <b>pendiente</b> bajo sus pies (el gradiente) y da un paso cuesta
            abajo: <span className="font-mono text-clay-light">posición ← posición − tasa · gradiente</span>.
          </p>
          <Slider label="Tasa de aprendizaje" value={lr} min={0.02} max={2.6} step={0.02} onChange={setLr} />
          <p className="mt-1 text-xs text-ivory/60">
            {lr < 0.15 ? "Muy baja: segura pero lentísima." : lr < 1.2 ? "Razonable: baja con buen ritmo." : lr < 2 ? "Alta: rebota y oscila." : "Altísima: puede salir disparada."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setRunning((r) => !r)}>{running ? "Pausar" : "Soltar la bolita"}</Button>
            <Button variant="ghost" onClick={() => reset()}>Reiniciar</Button>
          </div>
        </Card>
        <Card title="Lo que siente la bolita">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div>pasos: <span className="text-clay-light">{info.n}</span></div>
            <div>pérdida: <span className="text-clay-light">{fmt(info.h)}</span></div>
            <div>|gradiente|: <span className="text-clay-light">{fmt(info.g)}</span></div>
            <div>mínimo global: <span className="text-sand">{fmt(GLOBAL_MIN.h)}</span></div>
          </div>
          <p className="mt-3">
            Cerca del fondo el gradiente se hace ~0 y los pasos se acortan solos. El anillo dorado marca el valle más profundo; los
            otros valles son <b>mínimos locales</b>: trampas donde el gradiente también es 0 pero hay algo mejor más lejos.
          </p>
        </Card>
      </div>
    </div>
  );
}
