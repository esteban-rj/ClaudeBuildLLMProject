# Clawd Lab · ¡Vamos a construir un transformer!

Mapa interactivo en español para aprender cómo funcionan los modelos de lenguaje y los agentes,
desde la neurona hasta los sistemas multi-agente. Clawd (la mascota de Claude) es el guía: habla con voz
y puedes conversar con él por micrófono o por chat.

<p align="center">
  <img src="docs/screenshots/transformer.gif" alt="Encendiendo la torre del transformer: los tokens suben capa por capa hasta predecir el siguiente token" width="760">
</p>

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/01-welcome.png" alt="Pantalla de bienvenida"></td>
    <td width="50%"><img src="docs/screenshots/02-map.png" alt="Mapa de lecciones con el panel de Clawd"></td>
  </tr>
  <tr>
    <td align="center"><b>Bienvenida</b>: empieza con voz o en silencio.</td>
    <td align="center"><b>El mapa</b>: 12 paradas en 4 regiones, con Clawd siempre a la derecha para charlar.</td>
  </tr>
</table>

## Recorrido

Cada lección se divide en pasos interactivos (deslizadores, escenas 3D que se pueden rotar, simulaciones
paso a paso) y termina con un reto o quiz. Clawd narra cada paso y responde preguntas con el contexto de la escena.

### 🌲 Bosque de las Neuronas: fundamentos

| | |
|---|---|
| ![Calculadora de la neurona](docs/screenshots/03-neurona-calculadora.png) | ![Frontera de decisión en 2D y 3D](docs/screenshots/04-neurona-frontera-3d.png) |
| **1 · La neurona**: mueve entradas, pesos y sesgo y mira la cuenta en vivo. | **Frontera de decisión**: la recta en el plano y la superficie sigmoide en 3D. |
| ![Red resolviendo XOR](docs/screenshots/05-red-xor.png) | ![Diseña tu red en 3D](docs/screenshots/06-red-profundidad-3d.png) |
| **2 · Redes neuronales**: entrena una capa oculta y mírala resolver XOR. | **Profundidad y anchura**: diseña la red y compárala con modelos reales. |
| ![Paisaje de pérdida en 3D](docs/screenshots/07-entrenamiento-paisaje-3d.png) | |
| **3 · Cómo aprende una red**: suelta la bolita en el paisaje de pérdida y ajusta la tasa de aprendizaje. | |

### 🏭 La Fábrica del Transformer

<p align="center">
  <img src="docs/screenshots/atencion.gif" alt="Self-attention: al pasar el ratón por cada palabra se dibujan los arcos de atención" width="760">
  <br><em>5 · Self-attention: pasa el ratón por cada palabra y mira a quién presta atención.</em>
</p>

| | |
|---|---|
| ![Tokenizador](docs/screenshots/08-tokens-tokenizador.png) | ![Espacio de embeddings 3D](docs/screenshots/09-tokens-espacio-3d.png) |
| **4 · Tokens y embeddings**: escribe y mira cómo se trocea el texto en tokens e IDs. | **Espacio 3D**: palabras parecidas quedan cerca; haz clic para ver sus vecinos. |
| ![Mapa de atención y máscara causal](docs/screenshots/11-atencion-mapa.png) | ![Haces de atención en 3D](docs/screenshots/12-atencion-3d.png) |
| **Mapa de atención** completo y máscara causal. | **Vista 3D**: haces de luz entre tokens; más brillo, más peso. |
| ![Cabezas de atención](docs/screenshots/13-multihead-cabezas.png) | ![Apilar bloques del transformer](docs/screenshots/15-transformer-apilar.png) |
| **6 · Multi-head y posición**: cada cabeza se especializa (correferencia, sujeto-verbo…). | **7 · ¡Construyamos un Transformer!**: ensambla la torre, enciéndela y apila bloques para ver crecer los parámetros. |

### ⚓ Puerto de la Inferencia

| | |
|---|---|
| ![Ruleta de generación](docs/screenshots/16-generacion-ruleta.png) | ![KV cache: con y sin caché](docs/screenshots/18-kvcache-comparar.png) |
| **8 · Generar texto**: gira la ruleta token a token y juega con temperatura, top-k y top-p. | **9 · KV cache**: compara el coste de generar con y sin caché. |
| ![Calculadora de memoria de la caché](docs/screenshots/19-kvcache-memoria.png) | |
| **Memoria**: calcula cuánto ocupa la caché (MHA, GQA, MQA, precisión). | |

### 🏙️ Ciudad de los Agentes

<p align="center">
  <img src="docs/screenshots/agente.gif" alt="Traza del agente: pensamiento, llamada a herramienta, resultado y respuesta final" width="760">
  <br><em>10 · ¿Qué es un agente?: sigue la traza paso a paso (pensamiento → herramienta → resultado → respuesta).</em>
</p>

| | |
|---|---|
| ![El bucle del agente como anillo 3D](docs/screenshots/21-agente-anillo-3d.png) | ![Galería de patrones de agentes](docs/screenshots/22-arquitecturas-galeria.png) |
| **El anillo 3D**: percibir → pensar → actuar → observar. | **11 · Arquitecturas**: ejecuta cada patrón (chaining, routing, ReAct, evaluador-optimizador…). |
| ![RAG en 3D](docs/screenshots/23-arquitecturas-rag-3d.png) | ![Comparar patrones en radar](docs/screenshots/24-arquitecturas-comparar.png) |
| **RAG en 3D**: la consulta busca a sus vecinos más cercanos antes de responder. | **Comparar**: enfrenta dos patrones en coste, latencia, autonomía y previsibilidad. |

<p align="center">
  <img src="docs/screenshots/multiagente.gif" alt="Simulación 3D: el orquestador reparte el trabajo entre sub-agentes" width="760">
  <br><em>12 · Sistemas multi-agente: así se hizo esta app, con un orquestador y sub-agentes en paralelo.</em>
</p>

<p align="center">
  <img src="docs/screenshots/26-multiagente-topologias.png" alt="Topologías multi-agente: orquestador-trabajadores" width="760">
  <br><em>Topologías: orquestador-trabajadores, jerarquía, pipeline, debate y enjambre.</em>
</p>

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
- `docs/screenshots/` — capturas y GIFs de este README

## Despliegue
`vercel --prod` y configurar `ANTHROPIC_API_KEY` en el proyecto de Vercel.
