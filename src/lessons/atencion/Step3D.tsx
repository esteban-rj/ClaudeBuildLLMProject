"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, QuadraticBezierLine } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import * as THREE from "three";
import { Button, Card, Stage } from "@/components/ui";
import { useGuide } from "@/lib/guide-store";
import { TOKENS, attentionMatrix } from "./math";
import { TokenPicker, useSceneContext } from "./bits";

const SPACING = 1.3;
const xOf = (i: number) => (i - (TOKENS.length - 1) / 2) * SPACING;
const heightOf = (received: number) => 0.4 + received * 1.1;

function Column({ i, height, selected, onSelect }: { i: number; height: number; selected: boolean; onSelect: () => void }) {
  const orb = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!orb.current) return;
    const s = selected ? 1.25 + Math.sin(clock.elapsedTime * 4) * 0.12 : 1;
    orb.current.scale.setScalar(s);
  });
  return (
    <group position={[xOf(i), 0, 0]}>
      <mesh
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <cylinderGeometry args={[0.28, 0.34, height, 24]} />
        <meshStandardMaterial color={selected ? "#D97757" : "#3a3833"} emissive={selected ? "#D97757" : "#000000"} emissiveIntensity={selected ? 0.35 : 0} roughness={0.5} />
      </mesh>
      <mesh ref={orb} position={[0, height + 0.25, 0]} onClick={onSelect}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={selected ? "#E8A387" : "#F0EEE6"} emissive={selected ? "#D97757" : "#6A9BCC"} emissiveIntensity={selected ? 0.9 : 0.15} />
      </mesh>
      <Html position={[0, -0.35, 0.3]} center>
        <button onClick={onSelect} className={`whitespace-nowrap rounded-md px-1.5 py-0.5 font-serif text-xs ${selected ? "bg-clay text-night" : "bg-night/70 text-ivory/80"}`}>
          {TOKENS[i]}
        </button>
      </Html>
    </group>
  );
}

function Beam({ from, to, w, hFrom, hTo, zBend, offset }: { from: number; to: number; w: number; hFrom: number; hTo: number; zBend: number; offset: number }) {
  // La información viaja desde el Value de "to" hasta el token que pregunta ("from").
  const start = useMemo(() => new THREE.Vector3(xOf(to), hTo + 0.25, 0), [to, hTo]);
  const end = useMemo(() => new THREE.Vector3(xOf(from), hFrom + 0.25, 0), [from, hFrom]);
  const mid = useMemo(() => new THREE.Vector3((start.x + end.x) / 2, Math.max(start.y, end.y) + 0.8 + Math.abs(start.x - end.x) * 0.25, zBend), [start, end, zBend]);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(start, mid, end), [start, mid, end]);
  const particle = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!particle.current) return;
    const t = (clock.elapsedTime * 0.45 + offset) % 1;
    particle.current.position.copy(curve.getPoint(t));
  });
  return (
    <group>
      <QuadraticBezierLine start={start} end={end} mid={mid} color="#D97757" lineWidth={1 + w * 14} transparent opacity={Math.min(1, 0.15 + w * 1.5)} />
      {w > 0.04 && (
        <mesh ref={particle}>
          <sphereGeometry args={[0.05 + w * 0.12, 12, 12]} />
          <meshBasicMaterial color="#E3C77B" />
        </mesh>
      )}
    </group>
  );
}

export default function Step3D() {
  const guide = useGuide();
  const [sel, setSel] = useState(7);
  const [all, setAll] = useState(false);
  const [causal, setCausal] = useState(false);
  const said = useRef(false);
  const A = useMemo(() => attentionMatrix(causal), [causal]);
  const received = useMemo(() => TOKENS.map((_, j) => A.reduce((s, row) => s + row[j], 0)), [A]);
  const heights = received.map(heightOf);
  const topReceiver = received.indexOf(Math.max(...received));

  useSceneContext(
    `Paso 5 (vista 3D). Columnas = tokens; altura = atención total recibida (suma de su columna). Mostrando ${all ? "todas las conexiones fuertes (>12%)" : `los haces del token "${TOKENS[sel]}"`}. Máscara causal ${causal ? "activada" : "desactivada"}. Token que más atención recibe: "${TOKENS[topReceiver]}" (${received[topReceiver].toFixed(2)}).`,
  );

  const beams: { from: number; to: number; w: number }[] = [];
  A.forEach((row, i) => {
    if (!all && i !== sel) return;
    row.forEach((w, j) => {
      if (i === j) return;
      if (all ? w > 0.12 : w > 0.005) beams.push({ from: i, to: j, w });
    });
  });

  const toggleAll = () => {
    setAll((a) => !a);
    if (!said.current) {
      said.current = true;
      guide.say(`Así se ve la telaraña completa. Fíjate en que «${TOKENS[topReceiver]}» es la columna más alta: es el token del que más información se toma.`, "happy");
    }
  };

  return (
    <div className="grid gap-4">
      <Stage height={440}>
        <Canvas camera={{ position: [0, 4.5, 9.5], fov: 50 }} dpr={[1, 2]}>
          <color attach="background" args={["#141413"]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 8, 6]} intensity={60} color="#F0EEE6" />
          <pointLight position={[-6, 3, -4]} intensity={25} color="#6A9BCC" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <circleGeometry args={[8, 64]} />
            <meshStandardMaterial color="#1F1E1B" />
          </mesh>
          {TOKENS.map((_, i) => (
            <Column key={i} i={i} height={heights[i]} selected={!all && i === sel} onSelect={() => setSel(i)} />
          ))}
          {beams.map((b, k) => (
            <Beam key={`${b.from}-${b.to}-${all}-${causal}`} from={b.from} to={b.to} w={b.w} hFrom={heights[b.from]} hTo={heights[b.to]} zBend={all ? (b.from - b.to) * 0.18 : 0} offset={(k * 0.137) % 1} />
          ))}
          <OrbitControls enablePan={false} minDistance={5} maxDistance={18} target={[0, 1, 0]} />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-night/70 px-2 py-1 text-[11px] text-ivory/70">Arrastra para girar · las bolitas doradas son información (Values) viajando</div>
      </Stage>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Haces de atención">
          <p className="mb-2">Toca una columna (o un botón) para ver a quién mira ese token. Grosor y brillo del haz = peso de atención. La altura de cada columna es cuánta atención recibe en total.</p>
          <TokenPicker tokens={TOKENS} value={all ? -1 : sel} onChange={(i) => { setSel(i); setAll(false); }} />
        </Card>
        <Card title="Controles">
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggleAll} variant={all ? "primary" : "outline"}>{all ? "Ver un token" : "Ver toda la red"}</Button>
            <Button onClick={() => setCausal((c) => !c)} variant={causal ? "primary" : "ghost"}>{causal ? "🔒 Causal" : "Máscara causal"}</Button>
          </div>
          <p className="mt-2 text-xs text-ivory/60">
            Con la máscara causal los haces solo van hacia atrás (hacia la izquierda): cada token solo puede leer el pasado. Columna más alta ahora: <b className="text-clay">{TOKENS[topReceiver]}</b>.
          </p>
        </Card>
      </div>
    </div>
  );
}
