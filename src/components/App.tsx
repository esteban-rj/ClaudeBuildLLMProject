"use client";
import { useEffect, useRef, useState } from "react";
import { useGuideStore } from "@/lib/guide-store";
import { WorldMap } from "./WorldMap";
import { LessonShell } from "./LessonShell";
import { GuidePanel } from "./GuidePanel";
import { Clawd } from "./Clawd";

const WELCOME =
  "¡Hola! Soy Clawd, tu guía. Vamos a descubrir cómo funcionan los modelos como yo, desde una simple neurona hasta agentes que trabajan en equipo. Elige una parada en el mapa, o pregúntame lo que quieras: puedes escribirme o hablarme con el micrófono.";

export function App() {
  const lessonId = useGuideStore((s) => s.lessonId);
  const mood = useGuideStore((s) => s.mood);
  const speaking = useGuideStore((s) => s.speaking);
  const [started, setStarted] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);

  // Navegación con el botón "atrás" del navegador
  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace("#", "") || null;
      if (useGuideStore.getState().lessonId !== id) useGuideStore.getState().openLesson(id);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    const h = lessonId ? `#${lessonId}` : "";
    if (window.location.hash !== h) history.pushState(null, "", h || window.location.pathname);
  }, [lessonId]);

  const start = (withVoice: boolean) => {
    const g = useGuideStore.getState();
    if (g.voiceEnabled !== withVoice) g.toggleVoice();
    setStarted(true);
    g.clearSpeech();
    if (!g.messages.length) {
      g.addMessage({ role: "assistant", content: WELCOME });
      g.enqueueSpeech(WELCOME);
      g.setMood("happy");
    }
  };

  return (
    <div className="flex min-h-screen">
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ivory/10 bg-night/80 px-4 py-2 backdrop-blur">
          <button onClick={() => useGuideStore.getState().openLesson(null)} className="flex items-center gap-2">
            <Clawd size={28} />
            <span className="font-serif text-lg">Clawd <span className="text-clay">Lab</span></span>
          </button>
          <span className="hidden text-xs text-ivory/40 sm:inline">De la neurona a los agentes</span>
        </header>
        {lessonId ? <LessonShell id={lessonId} /> : <WorldMap />}
      </main>

      {/* Panel lateral en escritorio */}
      <aside className="sticky top-0 hidden h-screen w-[380px] shrink-0 lg:block">
        <GuidePanel />
      </aside>

      {/* Móvil: Clawd flotante + hoja inferior */}
      <div className="lg:hidden">
        {mobileChat ? (
          <div className="fixed inset-x-0 bottom-0 z-40 h-[75vh] overflow-hidden rounded-t-3xl border-t border-ivory/10 shadow-2xl">
            <button onClick={() => setMobileChat(false)} className="absolute right-3 top-3 z-10 rounded-full bg-ivory/10 px-3 py-1 text-sm">✕</button>
            <GuidePanel compact />
          </div>
        ) : (
          <button onClick={() => setMobileChat(true)} className="fixed bottom-4 right-4 z-40 rounded-full bg-panel p-3 shadow-2xl ring-1 ring-clay/40">
            <Clawd size={56} mood={mood} speaking={speaking} />
          </button>
        )}
      </div>

      {/* Bienvenida: desbloquea el audio con una interacción del usuario */}
      {!started && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-night/90 p-6 backdrop-blur">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 w-fit"><Clawd size={140} mood="happy" /></div>
            <h1 className="font-serif text-4xl">Clawd <span className="text-clay">Lab</span></h1>
            <p className="mt-3 text-ivory/70">
              Un viaje interactivo por dentro de los modelos de lenguaje: neuronas, atención, transformers, caché y agentes.
              <br />
              <b className="text-clay">¡Vamos a construir un transformer!</b>
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => start(true)} className="rounded-2xl bg-clay px-6 py-3 font-medium text-night hover:bg-clay-light">🔊 Empezar con voz</button>
              <button onClick={() => start(false)} className="rounded-2xl bg-ivory/10 px-6 py-3 hover:bg-ivory/15">Empezar en silencio</button>
            </div>
            <p className="mt-4 text-xs text-ivory/40">Para hablar con Clawd usa Chrome, Edge o Safari y permite el micrófono.</p>
          </div>
        </div>
      )}
    </div>
  );
}
