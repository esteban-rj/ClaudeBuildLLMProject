"use client";
// Voz del guía: síntesis (TTS) y reconocimiento (STT) con la Web Speech API del navegador.

// --- Tipos mínimos para SpeechRecognition (no incluidos en lib.dom de TS) ---
interface SpeechRecognitionResultLike { isFinal: boolean; 0: { transcript: string } }
interface SpeechRecognitionEventLike { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

let cachedVoice: SpeechSynthesisVoice | null | undefined;

/** Elige la mejor voz en español disponible (prefiere voces neuronales/naturales). */
export function pickSpanishVoice(): SpeechSynthesisVoice | null {
  if (!canSpeak()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const es = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural|premium|enhanced|online/.test(n)) s += 5;
    if (/google/.test(n)) s += 3;
    if (/paulina|mónica|monica|jorge|elvira|dalia|helena|sabina|lucia|lucía/.test(n)) s += 2;
    if (v.lang === "es-ES" || v.lang === "es-MX" || v.lang === "es-US") s += 1;
    return s;
  };
  cachedVoice = es.sort((a, b) => score(b) - score(a))[0] ?? null;
  return cachedVoice;
}

if (canSpeak()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = undefined;
  };
}

/** Limpia markdown/emoji para que la voz suene natural. */
export function cleanForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " (te dejo el código en el chat) ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*?|__|#+\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[\p{Extended_Pictographic}️]/gu, "")
    .replace(/√/g, "raíz de ")
    .replace(/→/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(text: string, opts: { onStart?: () => void; onEnd?: () => void } = {}) {
  if (!canSpeak()) {
    opts.onEnd?.();
    return;
  }
  const clean = cleanForSpeech(text);
  if (!clean) {
    opts.onEnd?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(clean);
  const voice = pickSpanishVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "es-ES";
  u.rate = 1.05;
  u.pitch = 1.15;
  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
