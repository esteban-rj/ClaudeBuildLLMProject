// Atajos estables para hablar con Clawd sin meter `useGuide()` en dependencias de efectos.
// Hacen exactamente lo mismo que useGuide() (ver src/lib/guide-store.ts).
import { useGuideStore, type Mood } from "@/lib/guide-store";

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
