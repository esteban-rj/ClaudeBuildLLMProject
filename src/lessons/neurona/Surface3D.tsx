"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import { Stage } from "@/components/ui";
import { sigmoid, type Pt } from "./math";

const HEIGHT = 2.5;
const SEG = 48;

function Surface({ w1, w2, b }: { w1: number; w2: number; b: number }) {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(6, 6, SEG, SEG);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
    const c0 = new THREE.Color("#6A9BCC");
    const c1 = new THREE.Color("#D97757");
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = -pos.getZ(i);
      const p = sigmoid(w1 * x + w2 * y + b);
      pos.setY(i, p * HEIGHT);
      tmp.copy(c0).lerp(c1, p);
      col.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    g.setAttribute("color", col);
    g.computeVertexNormals();
    return g;
  }, [w1, w2, b]);

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.6} transparent opacity={0.85} />
    </mesh>
  );
}

export default function Surface3D({ pts, w1, w2, b, height = 360 }: { pts: Pt[]; w1: number; w2: number; b: number; height?: number }) {
  return (
    <Stage height={height}>
      <Canvas camera={{ position: [6, 5, 6], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 8, 3]} intensity={1.2} />
        <Surface w1={w1} w2={w2} b={b} />
        {/* plano del umbral 0.5: donde lo corta la superficie está la frontera */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, HEIGHT / 2, 0]}>
          <planeGeometry args={[6, 6]} />
          <meshBasicMaterial color="#F0EEE6" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <gridHelper args={[6, 6, "#555", "#333"]} />
        {pts.map((p, i) => (
          <mesh key={i} position={[p.x, p.label * HEIGHT + 0.05, -p.y]}>
            {p.label === 1 ? <sphereGeometry args={[0.1, 12, 12]} /> : <boxGeometry args={[0.16, 0.16, 0.16]} />}
            <meshStandardMaterial color={p.label === 1 ? "#D97757" : "#6A9BCC"} emissive={p.label === 1 ? "#D97757" : "#6A9BCC"} emissiveIntensity={0.4} />
          </mesh>
        ))}
        <Html position={[3.4, HEIGHT, 0]} center>
          <div className="whitespace-nowrap rounded bg-night/70 px-1.5 text-[10px] text-clay">salida 1</div>
        </Html>
        <Html position={[3.4, 0, 0]} center>
          <div className="whitespace-nowrap rounded bg-night/70 px-1.5 text-[10px] text-sky">salida 0</div>
        </Html>
        <OrbitControls enablePan={false} minDistance={5} maxDistance={16} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-ivory/50">Arrastra para girar · la altura es la salida de la sigmoide</div>
    </Stage>
  );
}
