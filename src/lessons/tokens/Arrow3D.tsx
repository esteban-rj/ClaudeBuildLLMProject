"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { V3 } from "./embedding-data";

/** Flecha 3D que crece desde `from` hasta `to` al aparecer */
export default function Arrow3D({ from, to, color, dashed = false }: { from: V3; to: V3; color: string; dashed?: boolean }) {
  const t = useRef(0);
  const cone = useRef<THREE.Mesh>(null);
  const line = useRef<{ geometry: { setPositions: (p: number[]) => void } } | null>(null);
  const dir = useMemo(() => new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]), [from, to]);
  const len = dir.length();
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()), [dir]);

  useFrame((_, dt) => {
    t.current = Math.min(1, t.current + dt * 1.6);
    const k = 1 - Math.pow(1 - t.current, 3);
    const e: V3 = [from[0] + dir.x * k, from[1] + dir.y * k, from[2] + dir.z * k];
    line.current?.geometry.setPositions([...from, ...e]);
    cone.current?.position.set(e[0], e[1], e[2]);
  });

  return (
    <group>
      <Line ref={line as never} points={[from, from]} color={color} lineWidth={3} dashed={dashed} dashSize={0.2} gapSize={0.12} />
      <mesh ref={cone} position={from} quaternion={quat}>
        <coneGeometry args={[0.13, Math.min(0.4, len * 0.4), 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
