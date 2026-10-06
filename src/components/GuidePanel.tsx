"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clawd } from "./Clawd";
import { useGuideStore } from "@/lib/guide-store";
import { getRecognitionCtor, speak, stopSpeaking, type SpeechRecognitionLike } from "@/lib/voice";

const SUGGESTIONS: Record<string, string[]> = {
  _map: ["¿Por dónde empiezo?", "¿Qué es un transformer?", "¿En qué se diferencia un agente de un chatbot?"],
  neurona: ["¿Para qué sirve el sesgo?", "¿Por qué hace falta una activación?"],
  red: ["¿Por qué XOR necesita una capa oculta?", "¿Cuántos parámetros tiene una red grande?"],
  entrenamiento: ["¿Qué pasa si la tasa de aprendizaje es muy alta?", "Explícame backpropagation fácil"],
  tokens: ["¿Por qué no usar letras en vez de tokens?", "¿Qué significa que dos embeddings estén cerca?"],
  atencion: ["¿Qué diferencia hay entre Q, K y V?", "¿Para qué es la máscara causal?"],
  multihead: ["¿Por qué varias cabezas?", "¿Qué es RoPE?"],
  transformer: ["¿Para qué sirven las conexiones residuales?", "¿Qué hace la red feed-forward?"],
  generacion: ["¿Qué hace la temperatura?", "¿Por qué los modelos alucinan?"],
  kvcache: ["¿Por qué no se guardan las Queries?", "¿Cómo ahorra dinero el prompt caching?"],
  agente: ["¿Cómo decide qué herramienta usar?", "¿Cuándo para un agente?"],
  arquitecturas: ["¿ReAct o plan-and-execute?", "¿Qué es RAG?"],
  multiagente: ["¿Cuándo compensa usar varios agentes?", "¿Cómo se construyó esta app?"],
};

export function GuidePanel({ compact = false }: { compact?: boolean }) {
  const s = useGuideStore();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sendRef = useRef<(text: string) => void>(() => {});
  const lastWasReplyRef = useRef(false);
  const micSupported = typeof window !== "undefined" && !!getRecognitionCtor();

  // Auto-scroll del chat
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [s.messages]);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    stopSpeaking();
    useGuideStore.getState().clearSpeech();
    useGuideStore.getState().setSpeaking(false);
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput(finalText || interim);
    };
    rec.onerror = () => useGuideStore.getState().setListening(false);
    rec.onend = () => {
      useGuideStore.getState().setListening(false);
      recRef.current = null;
      if (finalText.trim()) {
        setInput("");
        sendRef.current(finalText.trim());
      }
    };
    recRef.current = rec;
    useGuideStore.getState().setListening(true);
    useGuideStore.getState().setMood("idle");
    rec.start();
  }, []);

  const stopListening = () => recRef.current?.stop();

  // Consumidor de la cola de voz: pronuncia frase a frase
  useEffect(() => {
    if (s.speaking || !s.speechQueue.length) return;
    const st = useGuideStore.getState();
    const next = st.shiftSpeech();
    if (!next) return;
    if (!st.voiceEnabled) return;
    st.setSpeaking(true);
    speak(next, {
      onEnd: () => {
        const g = useGuideStore.getState();
        g.setSpeaking(false);
        if (!g.speechQueue.length) {
          if (g.mood === "explaining") g.setMood("idle");
          // Modo manos libres: después de responder, vuelve a escuchar
          if (g.handsFree && lastWasReplyRef.current && !busyRef.current) {
            lastWasReplyRef.current = false;
            setTimeout(() => startListening(), 250);
          }
        }
      },
    });
  }, [s.speaking, s.speechQueue, startListening]);

  const busyRef = useRef(false);
  busyRef.current = busy;

  const send = useCallback(async (text: string) => {
    const st = useGuideStore.getState();
    if (!text.trim()) return;
    abortRef.current?.abort();
    stopSpeaking();
    st.clearSpeech();
    st.setSpeaking(false);
    st.addMessage({ role: "user", content: text });
    const history = useGuideStore.getState().messages.map(({ role, content }) => ({ role, content }));
    const id = st.addMessage({ role: "assistant", content: "" });
    st.setMood("thinking");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let full = "";
    let pending = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lessonId: st.lessonId, sceneContext: st.sceneContext }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error("sin respuesta");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      useGuideStore.getState().setMood("explaining");
      lastWasReplyRef.current = true;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        pending += chunk;
        useGuideStore.getState().updateMessage(id, full);
        // Envía a la voz cada frase completa en cuanto llega
        while (true) {
          const again = pending.match(/^([\s\S]*?[.!?…\n])\s+/);
          if (!again) break;
          useGuideStore.getState().enqueueSpeech(again[1]);
          pending = pending.slice(again[0].length);
        }
      }
      if (pending.trim()) useGuideStore.getState().enqueueSpeech(pending);
      if (!res.ok) useGuideStore.getState().setMood("surprised");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        useGuideStore.getState().updateMessage(id, "No pude conectarme. Revisa tu conexión e inténtalo de nuevo.");
        useGuideStore.getState().setMood("surprised");
      }
    } finally {
      setBusy(false);
    }
  }, []);
  sendRef.current = send;

  const lessonKey = s.lessonId ?? "_map";
  const suggestions = SUGGESTIONS[lessonKey] ?? SUGGESTIONS._map;

  return (
    <div className={`flex h-full flex-col ${compact ? "" : "border-l border-ivory/10"} bg-panel/95`}>
      {/* Cabecera con Clawd */}
      <div className="flex items-center gap-3 border-b border-ivory/10 px-4 py-3">
        <button onClick={() => (s.listening ? stopListening() : startListening())} title="Hablar con Clawd" className="shrink-0">
          <Clawd size={64} mood={s.mood} speaking={s.speaking} listening={s.listening} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg leading-tight">Clawd</div>
          <div className="truncate text-xs text-ivory/50">
            {s.listening ? "Te escucho…" : s.speaking ? "Hablando…" : busy ? "Pensando…" : "Tu guía · pregúntame lo que quieras"}
          </div>
        </div>
        <div className="flex gap-1">
          <IconToggle on={s.voiceEnabled} onClick={() => { if (s.voiceEnabled) { stopSpeaking(); s.clearSpeech(); s.setSpeaking(false); } s.toggleVoice(); }} title={s.voiceEnabled ? "Silenciar voz" : "Activar voz"}>
            {s.voiceEnabled ? "🔊" : "🔇"}
          </IconToggle>
          {micSupported && (
            <IconToggle on={s.handsFree} onClick={s.toggleHandsFree} title="Conversación manos libres: Clawd vuelve a escucharte tras responder">
              🔁
            </IconToggle>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {s.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "rounded-br-sm bg-clay text-night" : "rounded-bl-sm bg-ivory/[0.06] text-ivory/90"}`}>
              {m.content || <span className="inline-flex gap-1"><Dot /><Dot d={0.15} /><Dot d={0.3} /></span>}
            </div>
          </div>
        ))}
      </div>

      {/* Sugerencias */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {suggestions.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={busy} className="shrink-0 rounded-full border border-ivory/15 px-3 py-1 text-xs text-ivory/70 transition hover:border-clay hover:text-clay disabled:opacity-40">
            {q}
          </button>
        ))}
      </div>

      {/* Entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = input;
          setInput("");
          send(t);
        }}
        className="flex items-center gap-2 border-t border-ivory/10 p-3"
      >
        {micSupported && (
          <button
            type="button"
            onClick={() => (s.listening ? stopListening() : startListening())}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${s.listening ? "animate-pulse bg-sky text-night" : "bg-ivory/10 hover:bg-ivory/20"}`}
            title={s.listening ? "Dejar de escuchar" : "Hablar"}
          >
            🎤
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={s.listening ? "Habla, te escucho…" : "Escribe o pulsa 🎤 para hablar"}
          className="min-w-0 flex-1 rounded-full bg-night/70 px-4 py-2 text-sm outline-none ring-clay/50 placeholder:text-ivory/30 focus:ring-2"
        />
        <button type="submit" disabled={busy || !input.trim()} className="h-10 shrink-0 rounded-full bg-clay px-4 text-sm font-medium text-night disabled:opacity-40">
          ➤
        </button>
      </form>
      {!micSupported && <p className="px-4 pb-2 text-[11px] text-ivory/40">Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari para hablar con Clawd.</p>}
    </div>
  );
}

function IconToggle({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${on ? "bg-clay/25" : "bg-ivory/5 opacity-60 hover:opacity-100"}`}>
      {children}
    </button>
  );
}

function Dot({ d = 0 }: { d?: number }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ivory/60" style={{ animationDelay: `${d}s` }} />;
}
