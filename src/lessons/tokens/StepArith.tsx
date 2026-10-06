"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Html } from "@/lib/drei-html";
import { Button, Card, Formula, Stage, PALETTE } from "@/components/ui";
import Arrow3D from "./Arrow3D";
import { ANALOGIES, WORDS, byWord, nearest, plus, sub, type V3 } from "./embedding-data";
import { say, setContext } from "./guide";

function Dot({ p, label, color, big = false }: { p: V3; label: string; color: string; big?: boolean }) {
  return (
    <group position={p}>
      <mesh>
        <sphereGeometry args={[big ? 0.3 : 0.2, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <Html center distanceFactor={14} position={[0, 0.5, 0]} style={{ pointerEvents: "none" }}>
        <span className="whitespace-nowrap rounded bg-night/80 px-1.5 text-xs font-bold" style={{ color }}>{label}</span>
      </Html>
    </group>
  );
}

export default function StepArith() {
  const [ai, setAi] = useState(0);
  const [phase, setPhase] = useState(0);
  const told = useRef(false);
  const an = ANALOGIES[ai];
  const A = byWord(an.a).v;
  const B = byWord(an.b).v;
  const C = byWord(an.c).v;
  const diff = sub(A, B);
  const result = plus(diff, C);
  const near = nearest(result, 3, [an.a, an.b, an.c]);
  const people = WORDS.filter((w) => w.cluster === "personas");

  useEffect(() => {
    setContext(
      `Paso 5 · Aritmética de vectores: ${an.a} − ${an.b} + ${an.c}. Fase ${phase}/3. Resultado = [${result.map((n) => n.toFixed(2)).join(", ")}]; ` +
        `palabras más cercanas por coseno: ${near.map((n) => `${n.w} (${n.cos.toFixed(3)})`).join(", ")}. Esperado: ${an.expect}.`,
    );
    if (phase === 3 && !told.current) {
      told.current = true;
      say(`¡Magia! ${an.a} − ${an.b} + ${an.c} cae casi encima de «${near[0].w}». La dirección «${an.b} → ${an.a}» codifica un concepto, y se puede aplicar a otra palabra.`, "happy");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai, phase]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Stage height={440}>
        <Canvas camera={{ position: [-2, 3, 5], fov: 50 }}>
          <ambientLight intensity={1} />
          <pointLight position={[5, 8, 5]} intensity={60} />
          <group>
            {people.map((p) => (
              <mesh key={p.w} position={p.v}>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshBasicMaterial color="#9B87C9" transparent opacity={0.4} />
              </mesh>
            ))}
            <Dot p={A} label={an.a} color={PALETTE.clay} />
            <Dot p={B} label={an.b} color={PALETTE.sky} />
            <Dot p={C} label={an.c} color={PALETTE.sand} />
            {phase >= 1 && <Arrow3D key={`d${ai}`} from={B} to={A} color={PALETTE.rose} />}
            {phase >= 2 && <Arrow3D key={`e${ai}`} from={C} to={result} color={PALETTE.rose} dashed />}
            {phase >= 3 && <Dot p={result} label={`≈ ${near[0].w}`} color={PALETTE.olive} big />}
          </group>
          <OrbitControls enablePan={false} target={[-3.5, 2.5, -2.2]} />
        </Canvas>
      </Stage>
      <div className="space-y-4">
        <Card title="rey − hombre + mujer ≈ reina">
          <div className="mb-3 flex flex-wrap gap-2">
            {ANALOGIES.map((x, i) => (
              <Button key={i} variant={i === ai ? "primary" : "ghost"} className="!px-3 !py-1 text-xs" onClick={() => { setAi(i); setPhase(0); told.current = false; }}>
                {x.a} − {x.b} + {x.c}
              </Button>
            ))}
          </div>
          <Formula>
            {an.a} − {an.b} + {an.c}
          </Formula>
          <ol className="list-decimal space-y-1 pl-5">
            <li className={phase >= 1 ? "text-ivory" : "text-ivory/40"}>
              Restar «{an.b}» a «{an.a}» da la <b>flecha</b> {an.b} → {an.a} (el concepto que los separa).
            </li>
            <li className={phase >= 2 ? "text-ivory" : "text-ivory/40"}>Sumamos esa flecha a «{an.c}»: desde ahí avanzamos lo mismo.</li>
            <li className={phase >= 3 ? "text-ivory" : "text-ivory/40"}>Buscamos la palabra más cercana (coseno) al punto de llegada.</li>
          </ol>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => setPhase((p) => Math.min(3, p + 1))} disabled={phase >= 3}>Siguiente</Button>
            <Button variant="ghost" onClick={() => setPhase(0)}>Reiniciar</Button>
          </div>
        </Card>
        {phase >= 3 && (
          <Card title="Resultado">
            <p className="font-mono text-xs text-ivory/60">[{result.map((n) => n.toFixed(2)).join(", ")}]</p>
            {near.map((n) => (
              <div key={n.w} className="flex justify-between font-mono text-xs">
                <span className={n.w === an.expect ? "text-olive" : ""}>{n.w}</span>
                <span>{n.cos.toFixed(4)}</span>
              </div>
            ))}
            <p className="mt-2 text-xs text-ivory/60">
              Es un espacio de juguete construido con estas direcciones. En modelos reales el efecto aparece de forma natural (y más imperfecta).
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
