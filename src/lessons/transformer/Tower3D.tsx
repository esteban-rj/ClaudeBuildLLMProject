"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import type { Group, Mesh, MeshBasicMaterial, PointLight } from "three";
import { Stage } from "@/components/ui";
import { GAP, PIECES, RAIL_Z } from "./pieces";
import { PieceShape } from "./PieceShape";

export interface Item {
  pi: number; // índice en PIECES
  y: number;
  z: number;
  key: string;
}

/** Orden de la torre: embed, pos, N × [LN, MHA, +, LN, MLP, +], unembed, softmax */
export function layoutItems(n: number): { items: Item[]; height: number } {
  const order: number[] = [0, 1];
  for (let b = 0; b < n; b++) order.push(2, 3, 4, 5, 6, 7);
  order.push(8, 9);
  let base = 0;
  const items = order.map((pi, i) => {
    const p = PIECES[pi];
    const it = { pi, y: base + p.h / 2, z: p.kind === "add" ? RAIL_Z : 0, key: `${i}-${pi}` };
    base += p.h + GAP;
    return it;
  });
  return { items, height: base - GAP };
}

const TOKEN_COLORS = ["#E3C77B", "#6A9BCC", "#9DB37E", "#D97757", "#C46686", "#7FD1C1"];

function easeOutBack(x: number) {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function PieceMesh({ item, glow, animate, ghost = false }: { item: Item; glow: number; animate: boolean; ghost?: boolean }) {
  const p = PIECES[item.pi];
  const ref = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const t = useRef(animate && !ghost ? 0 : 1);
  const land = useRef(animate && !ghost ? 0 : 99);
  const [start] = useState<[number, number, number]>(() => (animate && !ghost ? [item.z + 6, item.y + 4, 5] : [0, item.y, item.z]));

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (t.current < 1) t.current = Math.min(1, t.current + dt / 0.95);
    else land.current += dt;
    const e = Math.min(1.2, easeOutBack(t.current));
    const k = 1 - e;
    g.position.set(6 * k, item.y + 4 * k, item.z + 5 * k - (ghost ? 0 : 0));
    g.rotation.y = k * Math.PI * 3;
    g.scale.setScalar(Math.max(0.05, 0.5 + 0.5 * e));
    if (ring.current) {
      const r = land.current;
      const m = ring.current.material as MeshBasicMaterial;
      if (r < 0.7) {
        ring.current.visible = true;
        ring.current.scale.setScalar(1 + r * 3);
        m.opacity = 0.7 * (1 - r / 0.7);
      } else ring.current.visible = false;
    }
  });

  return (
    <group>
      <group ref={ref} position={start}>
        <PieceShape kind={p.kind} color={p.color} glow={glow} opacity={ghost ? 0.22 : 1} />
      </group>
      {!ghost && (
        <mesh ref={ring} position={[0, item.y - p.h / 2, item.z]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[1.0, 1.12, 48]} />
          <meshBasicMaterial color={p.color} transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function Flow({ items, H, run, onActive, onDone }: { items: Item[]; H: number; run: number; onActive: (i: number) => void; onDone: () => void }) {
  const pts = useRef<(Mesh | null)[]>([]);
  const rail = useRef<(Mesh | null)[]>([]);
  const light = useRef<PointLight>(null);
  const st = useRef({ t: 0, run: 0, active: -2, done: true });
  const speed = Math.max(0.8, H / 9);
  const RAILN = 16;

  useFrame((_, dt) => {
    const s = st.current;
    if (s.run !== run) {
      st.current = { t: 0, run, active: -2, done: run === 0 };
      return;
    }
    const hideAll = () => {
      pts.current.forEach((m) => m && (m.visible = false));
      rail.current.forEach((m) => m && (m.visible = false));
      if (light.current) light.current.intensity = 0;
    };
    if (s.done) {
      hideAll();
      return;
    }
    s.t += dt;
    const front = s.t * speed - 0.3;
    if (front > H + 0.8) {
      s.done = true;
      onActive(-1);
      onDone();
      return;
    }
    // partículas de tokens
    pts.current.forEach((m, i) => {
      if (!m) return;
      const y = front - i * 0.16;
      m.visible = y > -0.1 && y < H + 0.1;
      m.position.set((i - 2.5) * 0.34, y, 0);
    });
    // carril residual: puntitos que suben sin parar
    rail.current.forEach((m, k) => {
      if (!m) return;
      const y = (s.t * speed * 1.3 + (k / RAILN) * H) % H;
      m.visible = true;
      m.position.set(((k % 3) - 1) * 0.06, y, RAIL_Z);
    });
    if (light.current) {
      light.current.intensity = 6;
      light.current.position.set(0, front, 1.2);
    }
    let idx = -1;
    items.forEach((it, i) => {
      const p = PIECES[it.pi];
      if (front >= it.y - p.h / 2 - GAP / 2 && front < it.y + p.h / 2 + GAP / 2) idx = i;
    });
    if (idx !== s.active) {
      s.active = idx;
      onActive(idx);
    }
  });

  return (
    <group>
      {TOKEN_COLORS.map((c, i) => (
        <mesh key={i} ref={(m) => { pts.current[i] = m; }} visible={false}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshBasicMaterial color={c} />
        </mesh>
      ))}
      {Array.from({ length: RAILN }, (_, k) => (
        <mesh key={k} ref={(m) => { rail.current[k] = m; }} visible={false}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#FFF6D8" />
        </mesh>
      ))}
      <pointLight ref={light} color="#FFD9A8" intensity={0} distance={6} />
    </group>
  );
}

export interface TowerProps {
  n?: number;
  /** Cuántas piezas están colocadas (por defecto todas) */
  placed?: number;
  ghost?: boolean;
  labels?: boolean;
  run?: number;
  onStage?: (itemIdx: number) => void;
  onDone?: () => void;
}

function Tower({ n = 1, placed, ghost, labels, run = 0, onStage, onDone }: TowerProps) {
  const { items, height } = useMemo(() => layoutItems(n), [n]);
  const s = Math.min(1, 7.5 / height);
  const [active, setActive] = useState(-1);
  const count = placed ?? items.length;
  const railOn = run > 0 && active !== -1 ? 1 : 0;
  const shown = items.slice(0, count);
  const topY = shown.length ? shown[shown.length - 1].y + 0.6 : 0.5;

  return (
    <>
      <group scale={s}>
        {/* carril residual */}
        {count > 0 && (
          <mesh position={[0, topY / 2 - 0.3, RAIL_Z]}>
            <cylinderGeometry args={[0.05, 0.05, topY + 0.3, 12]} />
            <meshStandardMaterial color="#F0EEE6" emissive="#F0EEE6" emissiveIntensity={0.25 + railOn * 0.6} />
          </mesh>
        )}
        {shown.map((it) => {
          const p = PIECES[it.pi];
          const idx = items.indexOf(it);
          return (
            <group key={it.key}>
              <PieceMesh item={it} animate glow={active === idx ? 0.7 : 0} />
              {p.kind === "add" && (
                <mesh position={[0, it.y, RAIL_Z / 2]}>
                  <boxGeometry args={[0.06, 0.06, RAIL_Z]} />
                  <meshStandardMaterial color="#F0EEE6" emissive="#F0EEE6" emissiveIntensity={0.3} />
                </mesh>
              )}
              {labels && (
                <Html position={[-2.1, it.y, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
                  <div className="whitespace-nowrap rounded-md bg-night/75 px-2 py-0.5 text-[10px] text-ivory/90 -translate-x-1/2">{p.short}</div>
                </Html>
              )}
            </group>
          );
        })}
        {ghost && count < items.length && <PieceMesh key={`ghost-${count}`} item={items[count]} animate={false} glow={0} ghost />}
        {labels && count > 0 && (
          <Html position={[0, -0.6, RAIL_Z]} center style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded-md bg-ivory/90 px-2 py-0.5 text-[10px] font-medium text-night">carril residual</div>
          </Html>
        )}
        <Flow
          items={items}
          H={height}
          run={run}
          onActive={(i) => {
            setActive(i);
            onStage?.(i);
          }}
          onDone={() => onDone?.()}
        />
      </group>
    </>
  );
}

function Scene(props: TowerProps) {
  const { height } = useMemo(() => layoutItems(props.n ?? 1), [props.n]);
  const hs = Math.min(height, 7.5);
  return (
    <>
      <color attach="background" args={["#141413"]} />
      <fog attach="fog" args={["#141413", 14, 34]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 9, 6]} intensity={1.6} />
      <pointLight position={[-5, 3, 4]} intensity={20} color="#D97757" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0.8]}>
        <circleGeometry args={[4, 64]} />
        <meshStandardMaterial color="#26241f" roughness={0.9} />
      </mesh>
      <gridHelper args={[8, 16, "#D97757", "#3a3732"]} position={[0, -0.04, 0.8]} />
      <Sparkles count={50} scale={[9, hs + 2, 9]} position={[0, hs / 2, 0]} size={2.5} speed={0.4} color="#E8A387" />
      <Tower {...props} />
      <OrbitControls target={[0, hs / 2, 0.6]} enablePan={false} minDistance={6} maxDistance={22} maxPolarAngle={Math.PI / 2 - 0.05} />
    </>
  );
}

export function TowerStage({ height = 460, className = "", ...props }: TowerProps & { height?: number; className?: string }) {
  return (
    <Stage height={height} className={className}>
      <Canvas camera={{ position: [6.5, 5.5, 10.5], fov: 48 }} dpr={[1, 2]}>
        <Scene {...props} />
      </Canvas>
    </Stage>
  );
}
