"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mood = "idle" | "happy" | "thinking" | "surprised" | "explaining";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface GuideState {
  /** Lección abierta (null = mapa) */
  lessonId: string | null;
  /** Qué está viendo el usuario ahora mismo dentro de la lección (lo fija cada lección) */
  sceneContext: string;
  messages: ChatMessage[];
  mood: Mood;
  speaking: boolean;
  listening: boolean;
  voiceEnabled: boolean;
  /** Conversación manos libres: tras hablar Clawd vuelve a escuchar */
  handsFree: boolean;
  panelOpen: boolean;
  completed: string[];
  /** Cola de frases que el guía debe pronunciar (la consume GuidePanel) */
  speechQueue: string[];

  openLesson: (id: string | null) => void;
  setSceneContext: (ctx: string) => void;
  addMessage: (m: Omit<ChatMessage, "id">) => string;
  updateMessage: (id: string, content: string) => void;
  setMood: (m: Mood) => void;
  setSpeaking: (v: boolean) => void;
  setListening: (v: boolean) => void;
  toggleVoice: () => void;
  toggleHandsFree: () => void;
  setPanelOpen: (v: boolean) => void;
  markCompleted: (id: string) => void;
  enqueueSpeech: (text: string) => void;
  shiftSpeech: () => string | undefined;
  clearSpeech: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      lessonId: null,
      sceneContext: "",
      messages: [],
      mood: "idle",
      speaking: false,
      listening: false,
      voiceEnabled: true,
      handsFree: false,
      panelOpen: true,
      completed: [],
      speechQueue: [],

      openLesson: (id) => set({ lessonId: id, sceneContext: "" }),
      setSceneContext: (sceneContext) => set({ sceneContext }),
      addMessage: (m) => {
        const id = uid();
        set((s) => ({ messages: [...s.messages, { ...m, id }].slice(-60) }));
        return id;
      },
      updateMessage: (id, content) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, content } : m)) })),
      setMood: (mood) => set({ mood }),
      setSpeaking: (speaking) => set({ speaking }),
      setListening: (listening) => set({ listening }),
      toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
      toggleHandsFree: () => set((s) => ({ handsFree: !s.handsFree })),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      markCompleted: (id) =>
        set((s) => (s.completed.includes(id) ? s : { completed: [...s.completed, id] })),
      enqueueSpeech: (text) => set((s) => ({ speechQueue: [...s.speechQueue, text] })),
      shiftSpeech: () => {
        const [first, ...rest] = get().speechQueue;
        set({ speechQueue: rest });
        return first;
      },
      clearSpeech: () => set({ speechQueue: [] }),
    }),
    {
      name: "clawd-lab",
      partialize: (s) => ({ completed: s.completed, voiceEnabled: s.voiceEnabled, handsFree: s.handsFree }),
    },
  ),
);

/**
 * Hook para las lecciones. Permite que Clawd narre lo que ocurre en la escena.
 *
 *   const guide = useGuide();
 *   guide.say("¡Mira! La neurona se activó.", "surprised");
 *   guide.setContext("El usuario tiene w1=0.8, w2=-0.3, sesgo=0.1; salida=0.71");
 */
export function useGuide() {
  const addMessage = useGuideStore((s) => s.addMessage);
  const enqueueSpeech = useGuideStore((s) => s.enqueueSpeech);
  const setMood = useGuideStore((s) => s.setMood);
  const setSceneContext = useGuideStore((s) => s.setSceneContext);
  const markCompleted = useGuideStore((s) => s.markCompleted);

  return {
    /** Clawd dice algo (aparece en el chat y lo pronuncia en voz alta) */
    say: (text: string, mood: Mood = "explaining") => {
      addMessage({ role: "assistant", content: text });
      enqueueSpeech(text);
      setMood(mood);
    },
    setMood,
    /** Describe el estado actual de la escena para que el chat con IA tenga contexto */
    setContext: setSceneContext,
    complete: markCompleted,
  };
}
