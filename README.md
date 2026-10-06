# Clawd Lab · ¡Vamos a construir un transformer!

Mapa interactivo en español para aprender cómo funcionan los modelos de lenguaje y los agentes,
desde la neurona hasta los sistemas multi-agente. Clawd (la mascota de Claude) es el guía: habla con voz
y puedes conversar con él por micrófono o por chat.

## Stack
- Next.js (App Router) + React + Tailwind
- three.js / @react-three/fiber / drei para escenas 3D, framer-motion para animaciones 2D
- Web Speech API: síntesis de voz (TTS) y reconocimiento (STT) en el navegador
- `/api/chat`: Claude (Anthropic SDK, `claude-opus-5-5`, streaming) con el contexto de la lección y la escena

## Desarrollo
```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

## Estructura
- `src/lib/lessons.ts` — registro de lecciones (mapa, intros, contexto para el chat)
- `src/lib/guide-store.ts` — estado del guía; `useGuide()` permite a cada lección hacer hablar a Clawd
- `src/lib/voice.ts` — voz (TTS/STT)
- `src/components/` — mapa, panel de Clawd, shell de lección, kit de UI
- `src/lessons/<id>/` — cada lección interactiva

## Despliegue
`vercel --prod` y configurar `ANTHROPIC_API_KEY` en el proyecto de Vercel.
