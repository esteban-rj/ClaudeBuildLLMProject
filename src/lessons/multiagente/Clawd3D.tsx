"use client";
// Clawd en 3D hecho con cubos pixel: cuerpo ancho, dos ojos, bracitos y patas.
import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import type { Group } from "three";

const EYE = "#141413";

export function Clawd3D({ color = "#D97757", scale = 1, activity, phase = 0, position = [0, 0, 0], rotationY = 0 }: {
  color?: string;
  scale?: number;
  /** 0..1: cuánto "trabaja" (rebota y mueve los brazos) */
  activity?: MutableRefObject<number>;
  phase?: number;
  position?: [number, number, number];
  rotationY?: number;
}) {
  const root = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  useFrame((s) => {
    const a = activity?.current ?? 0;
    const t = s.clock.elapsedTime + phase;
    if (root.current) root.current.position.y = position[1] + Math.abs(Math.sin(t * (2 + a * 8))) * (0.04 + a * 0.12) * scale;
    const swing = Math.sin(t * (3 + a * 12)) * (0.2 + a * 0.9);
    if (armL.current) armL.current.rotation.z = swing;
    if (armR.current) armR.current.rotation.z = -swing;
  });
  const u = 0.25; // tamaño del "píxel"
  return (
    <group position={[position[0], 0, position[2]]} rotation={[0, rotationY, 0]} scale={scale}>
      <group ref={root} position={[0, position[1], 0]}>
        {/* cuerpo: 8x5 píxeles */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[8 * u, 5 * u, 5 * u]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* ojos */}
        <mesh position={[-1.5 * u, 1.15, 2.55 * u]}>
          <boxGeometry args={[u, 1.5 * u, 0.2 * u]} />
          <meshStandardMaterial color={EYE} />
        </mesh>
        <mesh position={[1.5 * u, 1.15, 2.55 * u]}>
          <boxGeometry args={[u, 1.5 * u, 0.2 * u]} />
          <meshStandardMaterial color={EYE} />
        </mesh>
        {/* brazos */}
        <group ref={armL} position={[-4 * u, 0.85, 0]}>
          <mesh position={[-1 * u, 0, 0]}>
            <boxGeometry args={[2 * u, 2 * u, 2 * u]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
        <group ref={armR} position={[4 * u, 0.85, 0]}>
          <mesh position={[1 * u, 0, 0]}>
            <boxGeometry args={[2 * u, 2 * u, 2 * u]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
        {/* patas */}
        {[-3, -1.2, 1.2, 3].map((x) => (
          <mesh key={x} position={[x * u, 0.25, 0]}>
            <boxGeometry args={[1.1 * u, 2 * u, 1.6 * u]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
