"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import { Card, Stage } from "@/components/ui";
import { CLUSTERS, WORDS, byWord, cosine, nearest } from "./embedding-data";
import { say, setContext } from "./guide";

export default function StepSpace() {
  const [sel, setSel] = useState<string>("gato");
  const told = useRef(false);
  const selected = byWord(sel);
  const neigh = nearest(selected.v, 5, [sel]);
  const far = WORDS.filter((x) => x.w !== sel)
    .map((x) => ({ w: x.w, cos: cosine(selected.v, x.v) }))
    .sort((a, b) => a.cos - b.cos)[0];

  useEffect(() => {
    setContext(
      `Paso 4 · Espacio de embeddings 3D con ${WORDS.length} palabras en clusters (animales, comida, países, verbos, colores, personas/realeza). ` +
        `Seleccionada: «${sel}». Vecinos por similitud coseno: ${neigh.map((n) => `${n.w} (${n.cos.toFixed(3)})`).join(", ")}. Más lejana: ${far.w} (${far.cos.toFixed(3)}).`,
    );
    if (!told.current && sel !== "gato") {
      told.current = true;
      say(`¿Ves? Los vecinos de «${sel}» son palabras de su mismo mundo. Nadie lo programó: así quedan ordenados los vectores cuando el modelo aprende.`, "happy");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Stage height={470}>
        <Canvas camera={{ position: [9, 6, 11], fov: 50 }}>
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} intensity={80} />
          {WORDS.map((x) => {
            const c = CLUSTERS[x.cluster].color;
            const isSel = x.w === sel;
            const isN = neigh.some((n) => n.w === x.w);
            return (
              <group key={x.w} position={x.v}>
                <mesh
                  onClick={(e) => {
                    e.stopPropagation();
                    setSel(x.w);
                  }}
                  onPointerOver={() => (document.body.style.cursor = "pointer")}
                  onPointerOut={() => (document.body.style.cursor = "auto")}
                  scale={isSel ? 1.8 : isN ? 1.3 : 1}
                >
                  <sphereGeometry args={[0.2, 20, 20]} />
                  <meshStandardMaterial color={c} emissive={c} emissiveIntensity={isSel ? 1 : 0.35} />
                </mesh>
                <Html center distanceFactor={14} position={[0, 0.42, 0]} style={{ pointerEvents: "none" }}>
                  <span className={`whitespace-nowrap rounded px-1 text-[11px] ${isSel ? "bg-clay text-night font-bold" : isN ? "bg-night/80 text-ivory" : "text-ivory/60"}`}>{x.w}</span>
                </Html>
              </group>
            );
          })}
          {neigh.map((n) => (
            <Line key={n.w} points={[selected.v, byWord(n.w).v]} color="#F0EEE6" lineWidth={1.5} transparent opacity={0.6} />
          ))}
          <axesHelper args={[3]} />
          <OrbitControls autoRotate autoRotateSpeed={0.5} enablePan={false} />
        </Canvas>
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-night/70 px-3 py-1 text-xs text-ivory/70">Arrastra para girar · clic en una palabra</div>
      </Stage>
      <div className="space-y-4">
        <Card title={`Vecinos de «${sel}»`}>
          <p className="mb-2 font-mono text-xs text-ivory/60">vector = [{selected.v.map((n) => n.toFixed(2)).join(", ")}]</p>
          <div className="space-y-1.5">
            {neigh.map((n) => (
              <button key={n.w} onClick={() => setSel(n.w)} className="flex w-full items-center gap-2 text-left text-xs">
                <span className="w-20 truncate">{n.w}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded bg-ivory/10">
                  <div className="h-full bg-clay" style={{ width: `${Math.max(0, n.cos) * 100}%` }} />
                </div>
                <span className="w-12 text-right font-mono">{n.cos.toFixed(3)}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ivory/60">Más lejana: «{far.w}» con coseno {far.cos.toFixed(3)}.</p>
        </Card>
        <Card title="Similitud coseno">
          <p>
            Mide el <b>ángulo</b> entre dos vectores: <span className="font-mono text-clay-light">cos = (a·b) / (|a|·|b|)</span>. Vale 1
            si apuntan igual, 0 si son perpendiculares y −1 si son opuestos. Es la medida que usan los modelos para decir que dos
            palabras «se parecen».
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.values(CLUSTERS).map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-ivory/60">Aquí hay 3 dimensiones para poder verlas; un modelo real usa miles.</p>
        </Card>
      </div>
    </div>
  );
}
