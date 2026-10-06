"use client";
import { useGuideStore, type Mood } from "@/lib/guide-store";

// Helpers estables (no dependen del render) para hablar con Clawd desde
// efectos, callbacks de animación o manejadores de eventos.
export function say(text: string, mood: Mood = "explaining") {
  const s = useGuideStore.getState();
  s.addMessage({ role: "assistant", content: text });
  s.enqueueSpeech(text);
  s.setMood(mood);
}

export function setContext(text: string) {
  useGuideStore.getState().setSceneContext(text);
}

export function complete(id: string) {
  useGuideStore.getState().markCompleted(id);
}
