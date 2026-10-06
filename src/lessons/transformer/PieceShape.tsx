"use client";
import { RoundedBox } from "@react-three/drei";
import type { Kind } from "./pieces";

interface MatProps {
  color: string;
  glow: number;
  opacity: number;
}

function Mat({ color, glow, opacity }: MatProps) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.08 + glow}
      roughness={0.35}
      metalness={0.15}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity >= 1}
    />
  );
}

/** Geometría distintiva para cada tipo de pieza (centrada en el origen) */
export function PieceShape({ kind, color, glow = 0, opacity = 1 }: { kind: Kind; color: string; glow?: number; opacity?: number }) {
  const m = { color, glow, opacity };
  switch (kind) {
    case "embed":
      return (
        <group>
          <RoundedBox args={[2.6, 0.45, 1.4]} radius={0.08} smoothness={3}>
            <Mat {...m} />
          </RoundedBox>
          {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((x) => (
            <mesh key={x} position={[x, 0, 0.72]}>
              <boxGeometry args={[0.22, 0.22, 0.06]} />
              <Mat color="#141413" glow={0} opacity={opacity} />
            </mesh>
          ))}
        </group>
      );
    case "pos":
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.0, 0.15, 16, 48]} />
            <Mat {...m} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 1.0, Math.sin(a * 2) * 0.08, Math.sin(a) * 1.0]}>
                <sphereGeometry args={[0.1, 12, 12]} />
                <Mat color="#F0EEE6" glow={glow} opacity={opacity} />
              </mesh>
            );
          })}
        </group>
      );
    case "ln":
      return (
        <mesh>
          <cylinderGeometry args={[1.15, 1.15, 0.18, 48]} />
          <Mat {...m} />
        </mesh>
      );
    case "mha":
      return (
        <group>
          <RoundedBox args={[2.4, 0.9, 1.4]} radius={0.12} smoothness={3}>
            <Mat {...m} />
          </RoundedBox>
          {[-0.75, -0.25, 0.25, 0.75].map((x) => (
            <mesh key={x} position={[x, 0, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.16, 20]} />
              <Mat color="#E8A387" glow={glow + 0.2} opacity={opacity} />
            </mesh>
          ))}
          {[-0.75, -0.25, 0.25, 0.75].map((x) => (
            <mesh key={`e${x}`} position={[x, 0, 0.84]}>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshBasicMaterial color="#141413" transparent={opacity < 1} opacity={opacity} />
            </mesh>
          ))}
        </group>
      );
    case "add":
      return (
        <group>
          <mesh>
            <torusGeometry args={[0.32, 0.07, 12, 32]} />
            <Mat {...m} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.36, 0.08, 0.08]} />
            <Mat color="#D97757" glow={glow + 0.3} opacity={opacity} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.08, 0.36, 0.08]} />
            <Mat color="#D97757" glow={glow + 0.3} opacity={opacity} />
          </mesh>
        </group>
      );
    case "ffn":
      return (
        <group>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[1.3, 0.6, 0.4, 8]} />
            <Mat {...m} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.6, 1.3, 0.4, 8]} />
            <Mat {...m} />
          </mesh>
        </group>
      );
    case "unembed":
      return (
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[1.55, 0.9, 0.5, 4]} />
          <Mat {...m} />
        </mesh>
      );
    case "softmax":
      return (
        <mesh>
          <coneGeometry args={[0.8, 0.7, 6]} />
          <Mat {...m} />
        </mesh>
      );
  }
}

/** Icono 2D (SVG) de cada pieza para la bandeja */
export function PieceIcon({ kind, color, size = 34 }: { kind: Kind; color: string; size?: number }) {
  const s = size;
  const c = color;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden>
      {kind === "embed" && (
        <g>
          <rect x="3" y="12" width="34" height="16" rx="3" fill={c} />
          {[8, 15, 22, 29].map((x) => <rect key={x} x={x} y="17" width="4" height="6" fill="#141413" />)}
        </g>
      )}
      {kind === "pos" && (
        <g fill="none" stroke={c} strokeWidth="4">
          <ellipse cx="20" cy="20" rx="15" ry="7" />
          <circle cx="5" cy="20" r="2" fill="#F0EEE6" stroke="none" />
          <circle cx="35" cy="20" r="2" fill="#F0EEE6" stroke="none" />
          <circle cx="20" cy="27" r="2" fill="#F0EEE6" stroke="none" />
        </g>
      )}
      {kind === "ln" && <rect x="3" y="17" width="34" height="6" rx="3" fill={c} />}
      {kind === "mha" && (
        <g>
          <rect x="3" y="8" width="34" height="24" rx="5" fill={c} />
          {[9, 16, 23, 30].map((x) => <circle key={x} cx={x + 1} cy="20" r="3" fill="#E8A387" stroke="#141413" strokeWidth="1.5" />)}
        </g>
      )}
      {kind === "add" && (
        <g>
          <circle cx="20" cy="20" r="12" fill="none" stroke={c} strokeWidth="4" />
          <path d="M20 13v14M13 20h14" stroke="#D97757" strokeWidth="4" />
        </g>
      )}
      {kind === "ffn" && <path d="M3 8h34L26 20l11 12H3l11-12z" fill={c} />}
      {kind === "unembed" && <path d="M10 30h20l7-20H3z" fill={c} />}
      {kind === "softmax" && <path d="M20 6L35 32H5z" fill={c} />}
    </svg>
  );
}
