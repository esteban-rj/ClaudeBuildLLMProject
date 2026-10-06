// Registro central de lecciones. El mapa, el guía y el chat leen de aquí.
export type Region = "fundamentos" | "transformer" | "inferencia" | "agentes";

export interface LessonMeta {
  id: string;
  order: number;
  title: string;
  emoji: string;
  region: Region;
  summary: string;
  /** Posición en el mapa (porcentaje 0-100 del ancho/alto del mapa) */
  pos: { x: number; y: number };
  /** Lo que Clawd dice al entrar a la lección */
  intro: string;
  /** Contexto para el modelo cuando el usuario conversa dentro de esta lección */
  chatContext: string;
}

export const REGIONS: Record<Region, { name: string; color: string; description: string }> = {
  fundamentos: { name: "Bosque de las Neuronas", color: "#788C5D", description: "Las piezas más básicas: neuronas, redes y cómo aprenden." },
  transformer: { name: "La Fábrica del Transformer", color: "#D97757", description: "Tokens, atención y el bloque que lo cambió todo." },
  inferencia: { name: "Puerto de la Inferencia", color: "#6A9BCC", description: "Cómo un modelo genera texto rápido: sampling y caché." },
  agentes: { name: "Ciudad de los Agentes", color: "#C46686", description: "Modelos que razonan, usan herramientas y colaboran." },
};

export const LESSONS: LessonMeta[] = [
  {
    id: "neurona", order: 1, title: "La neurona", emoji: "🧠", region: "fundamentos",
    summary: "Pesos, sesgo y activación: la unidad mínima de una red.",
    pos: { x: 10, y: 78 },
    intro: "¡Empezamos por lo más pequeño! Una neurona artificial multiplica cada entrada por un peso, suma todo con un sesgo y pasa el resultado por una función de activación. Mueve los deslizadores y mira cómo cambia su decisión.",
    chatContext: "Lección 1: la neurona artificial (perceptrón). Entradas, pesos, sesgo, suma ponderada, funciones de activación (escalón, sigmoide, ReLU, tanh), frontera de decisión lineal.",
  },
  {
    id: "red", order: 2, title: "Redes neuronales", emoji: "🕸️", region: "fundamentos",
    summary: "Capas de neuronas que juntas aprenden funciones complejas.",
    pos: { x: 22, y: 62 },
    intro: "Una sola neurona solo traza líneas rectas. Si apilamos muchas en capas, la red puede doblar el espacio y aprender formas complejas. Mira cómo fluye la información capa por capa.",
    chatContext: "Lección 2: redes neuronales multicapa (MLP). Capas ocultas, forward pass, no linealidad, por qué XOR necesita capa oculta, aproximación universal.",
  },
  {
    id: "entrenamiento", order: 3, title: "Cómo aprende una red", emoji: "⛰️", region: "fundamentos",
    summary: "Función de pérdida, descenso de gradiente y backpropagation.",
    pos: { x: 13, y: 42 },
    intro: "Aprender es bajar una montaña a ciegas: medimos el error con una función de pérdida y damos pasitos cuesta abajo siguiendo el gradiente. ¡Suelta la bolita y ajusta la tasa de aprendizaje!",
    chatContext: "Lección 3: entrenamiento. Función de pérdida, descenso de gradiente, tasa de aprendizaje, mínimos locales, backpropagation y regla de la cadena, épocas, batches.",
  },
  {
    id: "tokens", order: 4, title: "Tokens y embeddings", emoji: "🔤", region: "transformer",
    summary: "Cómo el texto se convierte en números con significado.",
    pos: { x: 32, y: 28 },
    intro: "Los modelos no leen letras: leen tokens. Cada token se convierte en un vector, un punto en un espacio de muchas dimensiones donde las palabras parecidas quedan cerca. ¡Escribe algo y míralo trocearse!",
    chatContext: "Lección 4: tokenización (BPE, subpalabras) y embeddings. Vocabulario, IDs de token, vectores de embedding, similitud coseno, aritmética de vectores (rey - hombre + mujer ≈ reina).",
  },
  {
    id: "atencion", order: 5, title: "Self-attention", emoji: "👀", region: "transformer",
    summary: "Query, Key, Value: cada token decide a quién prestar atención.",
    pos: { x: 46, y: 40 },
    intro: "Aquí está el corazón del transformer. Cada token hace una pregunta, la Query, y la compara con las Keys de los demás tokens. Cuanto más se parecen, más atención le presta y más toma de su Value. Pasa el ratón por las palabras.",
    chatContext: "Lección 5: self-attention. Matrices Q, K, V, producto punto, escalado por raíz de d_k, softmax, mapa de atención, máscara causal, resolución de correferencias.",
  },
  {
    id: "multihead", order: 6, title: "Multi-head y posición", emoji: "🎭", region: "transformer",
    summary: "Varias cabezas de atención y cómo el modelo sabe el orden.",
    pos: { x: 58, y: 26 },
    intro: "Una sola atención mira las cosas de una manera. Con varias cabezas, cada una se especializa: una mira la gramática, otra los nombres, otra lo que viene antes. Y como la atención no sabe de orden, le añadimos codificación posicional.",
    chatContext: "Lección 6: multi-head attention (cabezas en paralelo, concatenación, proyección de salida) y codificación posicional (sinusoidal, aprendida, RoPE).",
  },
  {
    id: "transformer", order: 7, title: "¡Construyamos un Transformer!", emoji: "🏗️", region: "transformer",
    summary: "Ensambla el bloque pieza a pieza y mira los datos fluir en 3D.",
    pos: { x: 70, y: 42 },
    intro: "¡Llegó el gran momento! Vamos a construir un transformer pieza por pieza: embeddings, atención, conexiones residuales, normalización y la red feed-forward. Arrastra o haz clic en cada pieza para ponerla en su lugar.",
    chatContext: "Lección 7: arquitectura completa del transformer decoder-only. Embedding + posición, bloques apilados (LayerNorm, multi-head attention, residual, FFN/MLP), unembedding, softmax. Diferencias encoder vs decoder.",
  },
  {
    id: "generacion", order: 8, title: "Generar texto", emoji: "🎲", region: "inferencia",
    summary: "Logits, softmax, temperatura, top-k/top-p y autoregresión.",
    pos: { x: 82, y: 58 },
    intro: "El transformer no escribe frases enteras: predice un token cada vez, lo añade y vuelve a empezar. Juega con la temperatura y mira cómo cambia lo creativo o predecible que soy.",
    chatContext: "Lección 8: generación autoregresiva. Logits, softmax, temperatura, greedy, top-k, top-p (nucleus), tokens de parada, por qué los LLMs pueden alucinar.",
  },
  {
    id: "kvcache", order: 9, title: "KV cache y prompt caching", emoji: "⚡", region: "inferencia",
    summary: "Por qué reutilizar Keys y Values hace todo más rápido y barato.",
    pos: { x: 70, y: 74 },
    intro: "Al generar token a token, recalcular la atención de todo el texto anterior sería un desperdicio. El KV cache guarda las Keys y Values ya calculadas. Y el prompt caching lleva esa idea entre peticiones. ¡Compara con y sin caché!",
    chatContext: "Lección 9: KV cache (guardar K y V por capa, coste cuadrático vs lineal, memoria), fase prefill vs decode, ventana de contexto, prompt caching en APIs (prefijo idéntico, ahorro de coste y latencia).",
  },
  {
    id: "agente", order: 10, title: "¿Qué es un agente?", emoji: "🤖", region: "agentes",
    summary: "El bucle percibir → pensar → actuar con herramientas.",
    pos: { x: 54, y: 66 },
    intro: "Un agente es un modelo de lenguaje dentro de un bucle: piensa, decide usar una herramienta, recibe el resultado y vuelve a pensar hasta terminar la tarea. ¡Dame una tarea y mira cómo trabajo paso a paso!",
    chatContext: "Lección 10: agentes LLM. Bucle agéntico, tool use / function calling, observaciones, memoria de contexto, condición de parada, diferencia entre chatbot, workflow y agente.",
  },
  {
    id: "arquitecturas", order: 11, title: "Arquitecturas de agentes", emoji: "🗺️", region: "agentes",
    summary: "ReAct, plan-and-execute, router, RAG, evaluador-optimizador...",
    pos: { x: 40, y: 80 },
    intro: "No todos los agentes se construyen igual. Algunos piensan y actúan alternando, otros planifican primero, otros enrutan a especialistas o se autocorrigen. Compara los patrones y mira en qué se diferencian.",
    chatContext: "Lección 11: patrones de arquitectura de agentes. Prompt chaining, routing, parallelization, ReAct, plan-and-execute, evaluator-optimizer (reflexión), RAG, memoria a corto/largo plazo. Ventajas, costes y cuándo usar cada uno.",
  },
  {
    id: "multiagente", order: 12, title: "Sistemas multi-agente", emoji: "🐝", region: "agentes",
    summary: "Un orquestador que reparte el trabajo entre sub-agentes.",
    pos: { x: 26, y: 90 },
    intro: "¿Y si un agente no basta? Un orquestador puede dividir una tarea grande y repartirla entre varios sub-agentes que trabajan en paralelo, cada uno con su propio contexto. ¡Así se construyó esta misma app!",
    chatContext: "Lección 12: sistemas multi-agente. Orquestador-trabajadores, sub-agentes con contexto aislado, paralelismo, comunicación, agregación de resultados, coste en tokens, cuándo compensa.",
  },
];

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id);
