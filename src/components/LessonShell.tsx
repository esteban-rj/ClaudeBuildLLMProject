"use client";
import { useEffect } from "react";
import { getLesson, LESSONS, REGIONS } from "@/lib/lessons";
import { useGuideStore } from "@/lib/guide-store";
import { LESSON_COMPONENTS } from "@/lessons";

export function LessonShell({ id }: { id: string }) {
  const lesson = getLesson(id);
  const openLesson = useGuideStore((s) => s.openLesson);
  const done = useGuideStore((s) => s.completed.includes(id));

  // Clawd presenta la lección al entrar
  useEffect(() => {
    if (!lesson) return;
    const g = useGuideStore.getState();
    g.addMessage({ role: "assistant", content: `${lesson.emoji} ${lesson.title}\n\n${lesson.intro}` });
    g.enqueueSpeech(lesson.intro);
    g.setMood("explaining");
    window.scrollTo({ top: 0 });
  }, [lesson]);

  if (!lesson) return null;
  const Comp = LESSON_COMPONENTS[id];
  const prev = LESSONS[lesson.order - 2];
  const next = LESSONS[lesson.order];
  const region = REGIONS[lesson.region];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button onClick={() => openLesson(null)} className="rounded-xl bg-ivory/5 px-3 py-2 text-sm hover:bg-ivory/10">← Mapa</button>
        <div className="min-w-0 flex-1">
          <div className="text-xs" style={{ color: region.color }}>
            {region.name} · Lección {lesson.order} de {LESSONS.length} {done && "· ✅ completada"}
          </div>
          <h1 className="font-serif text-2xl md:text-3xl">{lesson.emoji} {lesson.title}</h1>
        </div>
        <div className="flex gap-2">
          {prev && <button onClick={() => openLesson(prev.id)} className="rounded-xl bg-ivory/5 px-3 py-2 text-sm hover:bg-ivory/10" title={prev.title}>‹ {prev.emoji}</button>}
          {next && <button onClick={() => openLesson(next.id)} className="rounded-xl bg-clay/20 px-3 py-2 text-sm text-clay hover:bg-clay/30" title={next.title}>{next.emoji} Siguiente ›</button>}
        </div>
      </div>
      <Comp key={id} />
    </div>
  );
}
