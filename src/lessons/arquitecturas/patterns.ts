// Datos de los patrones: diagramas (nodos, flechas, fotogramas) y fichas.
import type { DEdge, DNode, Frame, Move } from "./FlowDiagram";
import { PALETTE } from "@/components/ui";

export interface Scene {
  name?: string;
  example: string;
  nodes: DNode[];
  edges: DEdge[];
  frames: Frame[];
  height?: number;
}

export interface Rating {
  level: 1 | 2 | 3 | 4 | 5;
  text: string;
}

export interface Pattern {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  scenes: Scene[];
  when: string[];
  pros: string[];
  costs: { latency: Rating; tokens: Rating; complexity: Rating };
  risks: string[];
  /** 1-5: autonomía, coste, latencia, previsibilidad, tareas abiertas */
  scores: { autonomia: number; coste: number; latencia: number; previsibilidad: number; abiertas: number };
}

const mv = (from: string, to: string, label: string, color?: string): Move => ({ from, to, label, color });
const fr = (log: string, moves: Move[], traces: Record<string, string> = {}): Frame => ({ log, moves, traces });
const OK = PALETTE.olive;
const BAD = PALETTE.rose;

// ---------- Prompt chaining ----------
const chaining: Scene = {
  example: "Escribir un artículo sobre café: primero un esquema, se valida, y solo entonces se redacta.",
  nodes: [
    { id: "in", label: "Tema", sub: "café", x: 55, y: 110, kind: "io", w: 70 },
    { id: "l1", label: "LLM 1", sub: "Esquema", x: 175, y: 110, kind: "llm", w: 90 },
    { id: "g", label: "¿Válido?", x: 320, y: 110, kind: "gate", w: 100 },
    { id: "l2", label: "LLM 2", sub: "Redacta", x: 465, y: 110, kind: "llm", w: 90 },
    { id: "out", label: "Artículo", x: 585, y: 110, kind: "io", w: 70 },
  ],
  edges: [
    { from: "in", to: "l1" },
    { from: "l1", to: "g" },
    { from: "g", to: "l1", curve: 55, dashed: true, label: "rehacer" },
    { from: "g", to: "l2", label: "sí" },
    { from: "l2", to: "out" },
  ],
  frames: [
    fr("El tema entra al primer LLM.", [mv("in", "l1", "tema")], { in: "Tema: «el café»" }),
    fr("LLM 1 genera un esquema.", [mv("l1", "g", "esquema")], { l1: "Esquema: 1 Origen, 2 Tueste" }),
    fr("La puerta lo revisa con código: faltan secciones. Se rechaza.", [mv("g", "l1", "rechazado", BAD)], { g: "Faltan ≥3 secciones ✗" }),
    fr("LLM 1 corrige el esquema con el feedback.", [mv("l1", "g", "esquema v2")], { l1: "v2: Origen, Tueste, Preparación" }),
    fr("Ahora pasa la validación.", [mv("g", "l2", "OK", OK)], { g: "3 secciones ✓" }),
    fr("LLM 2 redacta con el esquema aprobado.", [mv("l2", "out", "texto")], { l2: "Redactando 3 secciones…" }),
  ],
};

// ---------- Routing ----------
const routing: Scene = {
  example: "Un cliente escribe: «Me cobraron dos veces». El router elige al especialista adecuado.",
  height: 300,
  nodes: [
    { id: "in", label: "Mensaje", x: 55, y: 150, kind: "io", w: 76 },
    { id: "r", label: "Router", sub: "clasifica", x: 200, y: 150, kind: "llm", w: 96 },
    { id: "a", label: "Facturación", x: 400, y: 50, kind: "agent", w: 104 },
    { id: "b", label: "Soporte técnico", x: 400, y: 150, kind: "agent", w: 112 },
    { id: "c", label: "Ventas", x: 400, y: 250, kind: "agent", w: 90 },
    { id: "out", label: "Respuesta", x: 585, y: 150, kind: "io", w: 76 },
  ],
  edges: [
    { from: "in", to: "r" },
    { from: "r", to: "a" },
    { from: "r", to: "b" },
    { from: "r", to: "c" },
    { from: "a", to: "out" },
    { from: "b", to: "out" },
    { from: "c", to: "out" },
  ],
  frames: [
    fr("Llega el mensaje del cliente.", [mv("in", "r", "mensaje")], { in: "«Me cobraron dos veces»" }),
    fr("El router lo clasifica: es de facturación.", [mv("r", "a", "facturación")], { r: "Categoría: facturación (97%)" }),
    fr("Solo el especialista de facturación trabaja, con su prompt y sus herramientas.", [mv("a", "out", "respuesta")], { a: "Reembolso del cobro duplicado" }),
  ],
};

// ---------- Parallelization ----------
const sectioning: Scene = {
  name: "Sectioning",
  example: "Revisar un código: seguridad, estilo y tests se miran a la vez, cada uno por separado.",
  height: 300,
  nodes: [
    { id: "in", label: "Código", x: 50, y: 150, kind: "io", w: 70 },
    { id: "a", label: "Seguridad", x: 235, y: 50, kind: "llm", w: 100 },
    { id: "b", label: "Estilo", x: 235, y: 150, kind: "llm", w: 100 },
    { id: "c", label: "Tests", x: 235, y: 250, kind: "llm", w: 100 },
    { id: "g", label: "Agregador", x: 430, y: 150, kind: "gate", w: 110 },
    { id: "out", label: "Informe", x: 570, y: 150, kind: "io", w: 70 },
  ],
  edges: [
    { from: "in", to: "a" }, { from: "in", to: "b" }, { from: "in", to: "c" },
    { from: "a", to: "g" }, { from: "b", to: "g" }, { from: "c", to: "g" },
    { from: "g", to: "out" },
  ],
  frames: [
    fr("El mismo código se reparte a tres LLM a la vez.", [mv("in", "a", "código"), mv("in", "b", "código"), mv("in", "c", "código")], { in: "PR #42 (120 líneas)" }),
    fr("Cada uno revisa solo su aspecto, en paralelo.", [], { a: "SQL sin escapar, línea 31", b: "Nombres poco claros", c: "Falta test de error" }),
    fr("Los resultados vuelven al agregador (código normal).", [mv("a", "g", "1 fallo"), mv("b", "g", "1 aviso"), mv("c", "g", "1 aviso")], { g: "Combinando 3 informes" }),
    fr("Se entrega el informe completo.", [mv("g", "out", "informe")]),
  ],
};
const voting: Scene = {
  name: "Voting",
  example: "¿Este código es malicioso? Se lanza 3 veces la misma pregunta y se vota para ganar fiabilidad.",
  height: 300,
  nodes: [
    { id: "in", label: "Código", x: 50, y: 150, kind: "io", w: 70 },
    { id: "a", label: "Juez 1", x: 235, y: 50, kind: "llm", w: 90 },
    { id: "b", label: "Juez 2", x: 235, y: 150, kind: "llm", w: 90 },
    { id: "c", label: "Juez 3", x: 235, y: 250, kind: "llm", w: 90 },
    { id: "g", label: "Votación", x: 430, y: 150, kind: "gate", w: 110 },
    { id: "out", label: "Veredicto", x: 570, y: 150, kind: "io", w: 76 },
  ],
  edges: [
    { from: "in", to: "a" }, { from: "in", to: "b" }, { from: "in", to: "c" },
    { from: "a", to: "g" }, { from: "b", to: "g" }, { from: "c", to: "g" },
    { from: "g", to: "out" },
  ],
  frames: [
    fr("La misma pregunta se envía a tres jueces.", [mv("in", "a", "¿malicioso?"), mv("in", "b", "¿malicioso?"), mv("in", "c", "¿malicioso?")], { in: "Función eval(userInput)" }),
    fr("Cada juez razona por su cuenta (con algo de temperatura).", [], { a: "Sí: ejecuta entrada", b: "Sí: eval peligroso", c: "No: parece un test" }),
    fr("Votos al contador.", [mv("a", "g", "sí", BAD), mv("b", "g", "sí", BAD), mv("c", "g", "no", OK)], { g: "2 de 3 dicen «sí»" }),
    fr("Gana la mayoría: se marca como sospechoso.", [mv("g", "out", "⚠ sospechoso", BAD)]),
  ],
};

// ---------- ReAct ----------
const react: Scene = {
  example: "«¿Cuántos años tiene el director de Interstellar, multiplicado por 2?» Alterna pensar y actuar.",
  height: 300,
  nodes: [
    { id: "in", label: "Pregunta", x: 50, y: 150, kind: "io", w: 76 },
    { id: "m", label: "LLM", sub: "Pensar → Actuar", x: 235, y: 150, kind: "llm", w: 120, trace: "below" },
    { id: "t1", label: "buscar_web", x: 440, y: 50, kind: "tool", w: 100 },
    { id: "t2", label: "calculadora", x: 440, y: 250, kind: "tool", w: 100 },
    { id: "out", label: "Respuesta", x: 585, y: 150, kind: "io", w: 76 },
  ],
  edges: [
    { from: "in", to: "m" },
    { from: "m", to: "t1", curve: 22 }, { from: "t1", to: "m", curve: 22 },
    { from: "m", to: "t2", curve: 22 }, { from: "t2", to: "m", curve: 22 },
    { from: "m", to: "out" },
  ],
  frames: [
    fr("Entra la pregunta.", [mv("in", "m", "pregunta")], { in: "¿Edad del director × 2?" }),
    fr("Pensamiento: necesito saber quién dirigió Interstellar. Acción: buscar.", [mv("m", "t1", "acción")], { m: "Pienso: ¿quién dirigió? → buscar" }),
    fr("Observación: Christopher Nolan, nacido en 1970.", [mv("t1", "m", "observación")], { t1: "Nolan, n. 1970" }),
    fr("Pensamiento: tiene 56 años; ahora multiplico. Acción: calculadora.", [mv("m", "t2", "56 × 2")], { m: "Pienso: 2026 − 1970 = 56" }),
    fr("Observación: 112.", [mv("t2", "m", "112")], { t2: "112" }),
    fr("Pensamiento: ya tengo todo. Respondo.", [mv("m", "out", "112")], { m: "Listo: no necesito más herramientas" }),
  ],
};

// ---------- Plan-and-execute ----------
const plan: Scene = {
  example: "«Organiza un viaje a Lisboa por 600 €». Se planifica primero; si un paso falla, se replanifica.",
  height: 290,
  nodes: [
    { id: "in", label: "Objetivo", x: 50, y: 130, kind: "io", w: 70, trace: "above" },
    { id: "p", label: "Planificador", x: 185, y: 130, kind: "llm", w: 100, trace: "above" },
    { id: "e", label: "Ejecutor", x: 335, y: 130, kind: "llm", w: 90, trace: "above" },
    { id: "g", label: "¿Fue bien?", x: 475, y: 130, kind: "gate", w: 100, trace: "above" },
    { id: "out", label: "Resultado", x: 590, y: 130, kind: "io", w: 70, trace: "above" },
    { id: "t", label: "Herramientas", x: 335, y: 245, kind: "tool", w: 110 },
  ],
  edges: [
    { from: "in", to: "p" }, { from: "p", to: "e" },
    { from: "e", to: "t", curve: 16 }, { from: "t", to: "e", curve: 16 },
    { from: "e", to: "g" },
    { from: "g", to: "p", curve: -80, dashed: true, label: "replanificar" },
    { from: "g", to: "out" },
  ],
  frames: [
    fr("El objetivo llega al planificador.", [mv("in", "p", "objetivo")], { in: "Lisboa, 600 €" }),
    fr("Crea el plan completo antes de actuar.", [mv("p", "e", "paso 1")], { p: "Plan: 1 vuelos, 2 hotel, 3 presupuesto" }),
    fr("El ejecutor usa herramientas para el paso 1.", [mv("e", "t", "buscar vuelos")], { e: "Ejecutando paso 1" }),
    fr("Resultado del paso 1.", [mv("t", "e", "vuelo 180 €")], { t: "Vuelo ida/vuelta: 180 €" }),
    fr("El ejecutor informa y se evalúa: el hotel que tocaba cuesta 500 €. ¡Presupuesto roto!", [mv("e", "g", "estado")], { e: "Hotel: 500 € (¡caro!)" }),
    fr("Fallo: se vuelve al planificador con lo aprendido.", [mv("g", "p", "replanificar", BAD)], { g: "Total 680 € > 600 € ✗" }),
    fr("Nuevo plan: hostal en vez de hotel.", [mv("p", "e", "plan v2")], { p: "Plan v2: hostal 150 €" }),
    fr("Ahora sí cuadra.", [mv("e", "g", "estado")], { e: "Total: 330 €" }),
    fr("Se entrega el resultado.", [mv("g", "out", "itinerario", OK)], { g: "330 € ≤ 600 € ✓" }),
  ],
};

// ---------- Evaluator-optimizer ----------
const evalopt: Scene = {
  example: "«Escribe un haiku sobre el café»: un LLM escribe, otro critica y el primero mejora.",
  nodes: [
    { id: "in", label: "Petición", x: 55, y: 130, kind: "io", w: 76 },
    { id: "g", label: "Generador", x: 205, y: 130, kind: "llm", w: 100 },
    { id: "v", label: "Evaluador", sub: "rúbrica", x: 375, y: 130, kind: "llm", w: 100 },
    { id: "out", label: "Haiku final", x: 560, y: 130, kind: "io", w: 86 },
  ],
  edges: [
    { from: "in", to: "g" }, { from: "g", to: "v" },
    { from: "v", to: "g", curve: 60, dashed: true, label: "feedback" },
    { from: "v", to: "out" },
  ],
  frames: [
    fr("Llega la petición.", [mv("in", "g", "petición")], { in: "Haiku sobre café" }),
    fr("Primer borrador.", [mv("g", "v", "borrador 1")], { g: "«Café caliente / por la mañana me despierta / qué bueno»" }),
    fr("El evaluador puntúa con una rúbrica y da feedback concreto.", [mv("v", "g", "5/10 ✗", BAD)], { v: "No es 5-7-5. Cierre flojo." }),
    fr("El generador mejora usando el feedback.", [mv("g", "v", "borrador 2")], { g: "«Vapor al alba / el mundo despierta lento / sorbo de calma»" }),
    fr("Evaluación: cumple la métrica y es bonito. Se acepta.", [mv("v", "out", "9/10 ✓", OK)], { v: "5-7-5 ✓ imagen clara ✓" }),
  ],
};

export const PATTERNS: Pattern[] = [
  {
    id: "chaining", name: "Prompt chaining", emoji: "⛓️", color: PALETTE.sand,
    tagline: "Una tarea dividida en pasos fijos; cada salida alimenta el siguiente prompt.",
    scenes: [chaining],
    when: ["La tarea se descompone limpiamente en pasos conocidos.", "Quieres más precisión a cambio de algo de latencia.", "Puedes validar resultados intermedios con código (puertas)."],
    pros: ["Cada llamada es más simple y fiable.", "Las puertas de validación atrapan errores pronto.", "Fácil de depurar: ves cada paso."],
    costs: { latency: { level: 3, text: "Suma de todos los pasos (en serie)." }, tokens: { level: 2, text: "Varias llamadas cortas, ~2-4× una sola." }, complexity: { level: 1, text: "Muy baja: es código secuencial." } },
    risks: ["Un error temprano se propaga hacia el final.", "Rígido: no se adapta si la tarea cambia."],
    scores: { autonomia: 1, coste: 2, latencia: 3, previsibilidad: 5, abiertas: 1 },
  },
  {
    id: "routing", name: "Routing", emoji: "🚦", color: PALETTE.sky,
    tagline: "Un clasificador decide a qué especialista o prompt va cada entrada.",
    scenes: [routing],
    when: ["Hay categorías claramente distintas de entradas.", "Cada categoría necesita su propio prompt, modelo o herramientas.", "Quieres mandar lo fácil a un modelo barato y lo difícil a uno potente."],
    pros: ["Especialización: prompts cortos y enfocados.", "Ahorra coste enviando lo sencillo a modelos pequeños.", "Fácil de ampliar con nuevas rutas."],
    costs: { latency: { level: 2, text: "Una llamada extra de clasificación." }, tokens: { level: 2, text: "Poco: solo trabaja el especialista elegido." }, complexity: { level: 2, text: "Baja-media: mantener varias rutas." } },
    risks: ["Si el router se equivoca, todo lo demás también.", "Entradas ambiguas que caen entre dos categorías."],
    scores: { autonomia: 2, coste: 1, latencia: 2, previsibilidad: 4, abiertas: 2 },
  },
  {
    id: "parallel", name: "Parallelization", emoji: "⚡", color: PALETTE.olive,
    tagline: "Varias llamadas a la vez: sectioning (partes distintas) o voting (misma tarea repetida).",
    scenes: [sectioning, voting],
    when: ["Hay subtareas independientes que pueden ir a la vez.", "Necesitas varias perspectivas o más confianza en una decisión.", "La latencia importa más que el gasto de tokens."],
    pros: ["Mucho menos tiempo de espera que en serie.", "Voting reduce errores puntuales.", "Cada llamada se centra en una sola cosa."],
    costs: { latency: { level: 1, text: "La del más lento, no la suma." }, tokens: { level: 4, text: "Alto: pagas todas las ramas." }, complexity: { level: 2, text: "Media: lanzar y combinar resultados." } },
    risks: ["Resultados contradictorios difíciles de combinar.", "Gasto multiplicado si abusas.", "Las ramas no pueden depender unas de otras."],
    scores: { autonomia: 1, coste: 4, latencia: 1, previsibilidad: 4, abiertas: 2 },
  },
  {
    id: "react", name: "ReAct", emoji: "🔁", color: PALETTE.clay,
    tagline: "Razonar y actuar en bucle: piensa, usa una herramienta, observa, vuelve a pensar.",
    scenes: [react],
    when: ["No sabes de antemano cuántos pasos harán falta.", "Cada paso depende de lo que devolvió el anterior.", "Hay herramientas (búsqueda, código, APIs) a su disposición."],
    pros: ["Se adapta sobre la marcha a lo que encuentra.", "El razonamiento visible facilita auditar.", "Es el bucle base de casi todos los agentes."],
    costs: { latency: { level: 4, text: "Muchas iteraciones en serie." }, tokens: { level: 4, text: "El contexto crece en cada vuelta." }, complexity: { level: 3, text: "Media: herramientas, límites, paradas." } },
    risks: ["Bucles infinitos o dar vueltas sin avanzar.", "Errores acumulados si una observación es mala.", "Coste difícil de predecir."],
    scores: { autonomia: 4, coste: 4, latencia: 4, previsibilidad: 2, abiertas: 5 },
  },
  {
    id: "plan", name: "Plan-and-execute", emoji: "📋", color: PALETTE.rose,
    tagline: "Primero un plan completo, luego se ejecuta paso a paso, replanificando si falla.",
    scenes: [plan],
    when: ["La tarea es larga con pasos dependientes.", "Quieres que un modelo potente planifique y uno barato ejecute.", "Necesitas ver el plan antes de gastar recursos."],
    pros: ["Visión global: menos despistes que ReAct puro.", "El ejecutor puede ser un modelo pequeño y barato.", "El plan se puede revisar o aprobar."],
    costs: { latency: { level: 4, text: "Plan + ejecución + posibles replanes." }, tokens: { level: 3, text: "Medio: el plan es reutilizable." }, complexity: { level: 4, text: "Alta: estado del plan y replanificación." } },
    risks: ["Un plan malo arrastra todo si no se replanifica.", "Sobreplanificar tareas simples."],
    scores: { autonomia: 4, coste: 3, latencia: 4, previsibilidad: 3, abiertas: 4 },
  },
  {
    id: "evalopt", name: "Evaluator-optimizer", emoji: "🪞", color: PALETTE.clayLight,
    tagline: "Un LLM genera, otro evalúa con criterios y se itera hasta cumplir (reflexión).",
    scenes: [evalopt],
    when: ["Hay criterios de calidad claros y medibles.", "La primera respuesta rara vez es la mejor (traducción, código, estilo).", "El feedback concreto mejora de verdad el resultado."],
    pros: ["Sube la calidad de forma notable.", "Los criterios quedan explícitos.", "Funciona también con tests como evaluador."],
    costs: { latency: { level: 4, text: "Cada ronda añade 2 llamadas." }, tokens: { level: 4, text: "Se regenera el texto varias veces." }, complexity: { level: 3, text: "Media: rúbrica y límite de rondas." } },
    risks: ["Evaluador complaciente o demasiado estricto.", "Bucle sin fin sin un máximo de rondas.", "Mejora ficticia si el criterio es vago."],
    scores: { autonomia: 3, coste: 4, latencia: 4, previsibilidad: 3, abiertas: 3 },
  },
  {
    id: "rag", name: "RAG", emoji: "📚", color: PALETTE.sky,
    tagline: "Antes de responder, recuperar los textos más parecidos de una base de conocimiento.",
    scenes: [],
    when: ["Los datos son privados, enormes o cambian a menudo.", "Necesitas citar fuentes y reducir alucinaciones.", "No cabe todo en el contexto."],
    pros: ["Conocimiento actualizable sin reentrenar.", "Respuestas con fuentes verificables.", "Contexto pequeño y barato."],
    costs: { latency: { level: 2, text: "Embedding + búsqueda: milisegundos." }, tokens: { level: 2, text: "Solo los fragmentos recuperados." }, complexity: { level: 3, text: "Media: trocear, indexar, evaluar." } },
    risks: ["Recupera fragmentos irrelevantes y el modelo se confunde.", "Trozos mal cortados pierden contexto.", "Documentos desactualizados en el índice."],
    scores: { autonomia: 1, coste: 2, latencia: 2, previsibilidad: 4, abiertas: 3 },
  },
  {
    id: "memory", name: "Memoria", emoji: "🧠", color: PALETTE.olive,
    tagline: "Corto plazo = el contexto; largo plazo = un almacén externo; compactar para no desbordar.",
    scenes: [],
    when: ["Las conversaciones o tareas duran más que la ventana de contexto.", "Debe recordar preferencias entre sesiones.", "Agentes largos que acumulan resultados de herramientas."],
    pros: ["Continuidad entre turnos y sesiones.", "Personalización.", "Contexto limpio gracias a la compactación."],
    costs: { latency: { level: 2, text: "Lectura/escritura en el almacén." }, tokens: { level: 3, text: "Resumir cuesta tokens; recordar ahorra." }, complexity: { level: 4, text: "Alta: qué guardar, cuándo olvidar." } },
    risks: ["Resúmenes que pierden detalles clave.", "Recuerdos erróneos o desactualizados.", "Privacidad de lo almacenado."],
    scores: { autonomia: 2, coste: 3, latencia: 2, previsibilidad: 3, abiertas: 3 },
  },
];

export const AXES: { key: keyof Pattern["scores"]; label: string; hint: string }[] = [
  { key: "autonomia", label: "Autonomía", hint: "Cuánto decide el modelo por sí solo" },
  { key: "coste", label: "Coste", hint: "Tokens y dinero (más = más caro)" },
  { key: "latencia", label: "Latencia", hint: "Tiempo de espera (más = más lento)" },
  { key: "previsibilidad", label: "Previsibilidad", hint: "Cuánto sabes de antemano qué hará" },
  { key: "abiertas", label: "Tareas abiertas", hint: "Capacidad para problemas sin guion" },
];
