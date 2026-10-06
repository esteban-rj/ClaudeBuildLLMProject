"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Stage } from "@/components/ui";
import { createMlp } from "./nn";

const GAP = 2.2;
const SP = 0.85;

function layout(sizes: number[]) {
  const pos: THREE.Vector3[][] = [];
  sizes.forEach((n, l) => {
    const col: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * SP;
      const z = (i % 2 === 0 ? 1 : -1) * 0.25 * Math.min(1, n / 3);
      col.push(new THREE.Vector3((l - (sizes.length - 1) / 2) * GAP, y, z));
    }
    pos.push(col);
  });
  return pos;
}

interface Conn {
  a: THREE.Vector3;
  b: THREE.Vector3;
  w: number;
  layer: number;
}

function Scene({ sizes, seed, pulses }: { sizes: number[]; seed: number; pulses: boolean }) {
  const pos = useMemo(() => layout(sizes), [sizes]);
  const conns = useMemo<Conn[]>(() => {
    const net = createMlp(sizes, seed);
    const out: Conn[] = [];
    for (let l = 0; l < sizes.length - 1; l++)
      for (let j = 0; j < sizes[l + 1]; j++)
        for (let i = 0; i < sizes[l]; i++) out.push({ a: pos[l][i], b: pos[l + 1][j], w: net.W[l][j][i], layer: l });
    return out;
  }, [sizes, seed, pos]);

  const cyl = useRef<THREE.InstancedMesh>(null);
  const dots = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const m = cyl.current;
    if (!m) return;
    const pc = new THREE.Color("#D97757");
    const nc = new THREE.Color("#6A9BCC");
    const up = new THREE.Vector3(0, 1, 0);
    const maxW = Math.max(0.01, ...conns.map((c) => Math.abs(c.w)));
    conns.forEach((c, k) => {
      const dir = c.b.clone().sub(c.a);
      const len = dir.length();
      dummy.position.copy(c.a).add(c.b).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(up, dir.normalize());
      const r = 0.012 + 0.05 * (Math.abs(c.w) / maxW);
      dummy.scale.set(r, len, r);
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
      m.setColorAt(k, c.w >= 0 ? pc : nc);
    });
    m.count = conns.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [conns, dummy]);

  const layers = sizes.length - 1;
  useFrame(({ clock }) => {
    const m = dots.current;
    if (!m) return;
    const t = clock.getElapsedTime() * 0.7;
    const cycle = layers + 1.5;
    const ph = t % cycle;
    conns.forEach((c, k) => {
      const p = ph - c.layer;
      if (!pulses || p < 0 || p > 1) {
        dummy.scale.setScalar(0.0001);
      } else {
        dummy.position.lerpVectors(c.a, c.b, p);
        dummy.scale.setScalar(0.5 + Math.abs(c.w) * 0.4);
      }
      dummy.updateMatrix();
      m.setMatrixAt(k, dummy.matrix);
    });
    m.count = conns.length;
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh key={`c${conns.length}`} ref={cyl} args={[undefined, undefined, Math.max(1, conns.length)]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial roughness={0.5} transparent opacity={0.75} />
      </instancedMesh>
      <instancedMesh key={`d${conns.length}`} ref={dots} args={[undefined, undefined, Math.max(1, conns.length)]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#F0EEE6" />
      </instancedMesh>
      {pos.map((col, l) =>
        col.map((p, i) => (
          <mesh key={`${l}-${i}`} position={p}>
            <sphereGeometry args={[0.2, 20, 20]} />
            <meshStandardMaterial color={l === 0 ? "#6A9BCC" : l === pos.length - 1 ? "#E3C77B" : "#F0EEE6"} emissive={l === 0 ? "#6A9BCC" : l === pos.length - 1 ? "#E3C77B" : "#D97757"} emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
        )),
      )}
    </>
  );
}

/** Red 3D: esferas = neuronas, cilindros = conexiones (grosor = |peso|, naranja = positivo, azul = negativo) */
export default function Network3D({ sizes, seed = 3, height = 380, pulses = true }: { sizes: number[]; seed?: number; height?: number; pulses?: boolean }) {
  const dist = Math.max(8, (sizes.length - 1) * GAP + 3, Math.max(...sizes) * SP + 2);
  return (
    <Stage height={height}>
      <Canvas camera={{ position: [0, 1, dist], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 6, 5]} intensity={1.2} />
        <Scene sizes={sizes} seed={seed} pulses={pulses} />
        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.6} minDistance={4} maxDistance={24} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-ivory/50">Naranja = peso positivo · azul = negativo · más grueso = más fuerte · arrastra para girar</div>
    </Stage>
  );
}
