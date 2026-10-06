"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { Button, Card, PALETTE, Stage } from "@/components/ui";
import { say, setContext } from "./clawd";

const R = 2.2;
const STATIONS = [
  { name: "Percibir", color: PALETTE.sky, desc: "Lee la petición y el contexto: mensajes, resultados previos." },
  { name: "Pensar", color: PALETTE.clay, desc: "El LLM razona y decide: ¿respondo ya o necesito una herramienta?" },
  { name: "Actuar", color: PALETTE.rose, desc: "Se emite una llamada a herramienta y tu código la ejecuta." },
  { name: "Observar", color: PALETTE.olive, desc: "El resultado vuelve al contexto y empieza otra vuelta." },
];
const TOOLS = [
  { name: "get_weather", color: PALETTE.sky },
  { name: "calculator", color: PALETTE.sand },
  { name: "search_web", color: PALETTE.olive },
  { name: "send_email", color: PALETTE.rose },
];
// Estación i en ángulo: arriba, derecha, abajo, izquierda (sentido horario)
const stationAngle = (i: number) => Math.PI / 2 - (i * Math.PI) / 2;

function Station({ i, active }: { i: number; active: boolean }) {
  const s = STATIONS[i];
  const a = stationAngle(i);
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = active ? 1.35 : 1;
    m.scale.setScalar(m.scale.x + (t - m.scale.x) * 0.15);
    (m.material as MeshStandardMaterial).emissiveIntensity += ((active ? 1.2 : 0.15) - (m.material as MeshStandardMaterial).emissiveIntensity) * 0.15;
  });
  return (
    <group position={[Math.cos(a) * R, 0, -Math.sin(a) * R]}>
      <mesh ref={ref}>
        <cylinderGeometry args={[0.38, 0.38, 0.25, 32]} />
        <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.15} />
      </mesh>
      <Html center position={[0, 0.65, 0]}>
        <div className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${active ? "bg-ivory text-night" : "bg-night/70 text-ivory/70"}`}>
          {i + 1}. {s.name}
        </div>
      </Html>
    </group>
  );
}

function Scene({ playing, tool, onStation }: { playing: boolean; tool: number; onStation: (i: number) => void }) {
  const ball = useRef<Mesh>(null);
  const sats = useRef<Group>(null);
  const prog = useRef(0);
  const cur = useRef(-1);
  const [active, setActive] = useState(0);

  useFrame((_, dt) => {
    if (playing) prog.current = (prog.current + dt * 0.3) % 4;
    const p = prog.current;
    const a = Math.PI / 2 - (p * Math.PI) / 2;
    ball.current?.position.set(Math.cos(a) * R, 0.1, -Math.sin(a) * R);
    // estación activa = la más cercana
    const idx = Math.round(p) % 4;
    if (idx !== cur.current) {
      cur.current = idx;
      setActive(idx);
      onStation(idx);
    }
    if (sats.current) sats.current.rotation.y += dt * 0.5;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 4, 3]} intensity={40} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R, 0.04, 12, 96]} />
        <meshStandardMaterial color={PALETTE.ivory} emissive={PALETTE.ivory} emissiveIntensity={0.15} />
      </mesh>
      {STATIONS.map((_, i) => (
        <Station key={i} i={i} active={active === i} />
      ))}
      <mesh ref={ball}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#fff" emissive={PALETTE.clay} emissiveIntensity={1.5} />
      </mesh>
      {/* Satélites: herramientas orbitando al estar en Actuar */}
      <group ref={sats}>
        {TOOLS.map((t, i) => {
          const a = (i / TOOLS.length) * Math.PI * 2;
          const lit = active === 2 && tool === i;
          return (
            <group key={t.name} position={[Math.cos(a) * 1.0, 0.0, Math.sin(a) * 1.0]}>
              <mesh>
                <sphereGeometry args={[lit ? 0.22 : 0.15, 16, 16]} />
                <meshStandardMaterial color={t.color} emissive={t.color} emissiveIntensity={lit ? 2 : tool === i ? 0.6 : 0.1} />
              </mesh>
              <Html center position={[0, 0.3, 0]}>
                <div className={`whitespace-nowrap rounded px-1 text-[10px] ${lit ? "bg-ivory text-night" : "bg-night/60 text-ivory/60"}`}>🛠 {t.name}</div>
              </Html>
            </group>
          );
        })}
      </group>
      <Html center position={[0, -0.05, 0]}>
        <div className="pointer-events-none rounded-lg bg-night/70 px-2 py-1 text-[11px] text-clay">LLM</div>
      </Html>
    </>
  );
}

export default function StepRing3D() {
  const [playing, setPlaying] = useState(true);
  const [tool, setTool] = useState(0);
  const [station, setStation] = useState(0);
  const said = useRef(false);

  const onStation = (i: number) => {
    setStation(i);
  };

  useEffect(() => {
    if (station === 2 && !said.current) {
      said.current = true;
      say("Mira: cuando la esfera llega a «Actuar», se enciende la herramienta elegida. Luego vuelve «Observar» y empieza otra vuelta. Eso es un agente.", "explaining");
    }
  }, [station]);

  useEffect(() => {
    setContext(`Paso 3 (anillo 3D). La esfera recorre 4 estaciones: Percibir, Pensar, Actuar, Observar. Estación actual: ${STATIONS[station].name}. Herramienta seleccionada: ${TOOLS[tool].name}. ${playing ? "Animación en marcha" : "Animación en pausa"}.`);
  }, [station, tool, playing]);

  return (
    <div className="space-y-4">
      <Card title="El bucle como un anillo" actions={<Button variant="ghost" onClick={() => setPlaying((p) => !p)}>{playing ? "Pausar" : "Reanudar"}</Button>}>
        <p className="mb-3">
          Un agente da vueltas y vueltas a este anillo. Elige qué herramienta usa en la estación <b className="text-rose">Actuar</b> y arrastra la escena para girarla.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {TOOLS.map((t, i) => (
            <Button key={t.name} variant={tool === i ? "primary" : "ghost"} onClick={() => setTool(i)}>
              {t.name}
            </Button>
          ))}
        </div>
        <Stage height={380}>
          <Canvas camera={{ position: [0, 4.2, 5.2], fov: 45 }}>
            <Scene playing={playing} tool={tool} onStation={onStation} />
            <OrbitControls enablePan={false} minDistance={4} maxDistance={10} />
          </Canvas>
        </Stage>
        <div className="mt-3 rounded-xl border border-ivory/10 bg-night/50 p-3 text-sm">
          <b style={{ color: STATIONS[station].color }}>
            {station + 1}. {STATIONS[station].name}
          </b>
          : {STATIONS[station].desc}
        </div>
      </Card>
    </div>
  );
}
