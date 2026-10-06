"use client";
import dynamic from "next/dynamic";

// La app depende de APIs del navegador (voz, localStorage, WebGL): se renderiza solo en cliente.
export const ClientApp = dynamic(() => import("./App").then((m) => m.App), {
  ssr: false,
  loading: () => <div className="grid min-h-screen place-items-center text-ivory/50">Cargando Clawd Lab…</div>,
});
