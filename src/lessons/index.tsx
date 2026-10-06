"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const loading = () => <div className="p-10 text-center text-ivory/60 animate-pulse">Cargando escena…</div>;

// Cada lección vive en src/lessons/<id>/index.tsx y exporta un componente por defecto.
export const LESSON_COMPONENTS: Record<string, ComponentType> = {
  neurona: dynamic(() => import("./neurona"), { ssr: false, loading }),
  red: dynamic(() => import("./red"), { ssr: false, loading }),
  entrenamiento: dynamic(() => import("./entrenamiento"), { ssr: false, loading }),
  tokens: dynamic(() => import("./tokens"), { ssr: false, loading }),
  atencion: dynamic(() => import("./atencion"), { ssr: false, loading }),
  multihead: dynamic(() => import("./multihead"), { ssr: false, loading }),
  transformer: dynamic(() => import("./transformer"), { ssr: false, loading }),
  generacion: dynamic(() => import("./generacion"), { ssr: false, loading }),
  kvcache: dynamic(() => import("./kvcache"), { ssr: false, loading }),
  agente: dynamic(() => import("./agente"), { ssr: false, loading }),
  arquitecturas: dynamic(() => import("./arquitecturas"), { ssr: false, loading }),
  multiagente: dynamic(() => import("./multiagente"), { ssr: false, loading }),
};
