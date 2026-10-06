// Herramientas locales simuladas. La calculadora calcula de verdad.

/** Evaluador aritmético seguro (+ - * / ^ paréntesis, decimales con . o ,) */
export function calc(expr: string): number {
  const src = expr.replace(/,/g, ".").replace(/\s+/g, "");
  if (!/^[0-9+\-*/^().%]+$/.test(src)) throw new Error("Expresión no válida");
  let p = 0;
  const peek = () => src[p];
  function num(): number {
    if (peek() === "(") {
      p++;
      const v = add();
      if (peek() !== ")") throw new Error("Falta )");
      p++;
      return v;
    }
    if (peek() === "-") {
      p++;
      return -pow();
    }
    const m = /^[0-9]*\.?[0-9]+/.exec(src.slice(p));
    if (!m) throw new Error("Número esperado");
    p += m[0].length;
    return parseFloat(m[0]);
  }
  function pow(): number {
    const b = num();
    if (peek() === "^") {
      p++;
      return Math.pow(b, pow());
    }
    return b;
  }
  function mul(): number {
    let v = pow();
    while (peek() === "*" || peek() === "/") {
      const op = src[p++];
      const r = pow();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function add(): number {
    let v = mul();
    while (peek() === "+" || peek() === "-") {
      const op = src[p++];
      const r = mul();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  const out = add();
  if (p !== src.length) throw new Error("Sobran caracteres");
  return out;
}

export type ToolName = "get_weather" | "calculator" | "search_web";

export const TOOL_DEFS: Record<ToolName, { icon: string; description: string }> = {
  get_weather: { icon: "🌦️", description: "Devuelve el tiempo actual de una ciudad." },
  calculator: { icon: "🧮", description: "Evalúa una expresión aritmética." },
  search_web: { icon: "🔎", description: "Busca información en una enciclopedia." },
};

const WEATHER: Record<string, { temp_c: number; condition: string; rain_mm: number }> = {
  madrid: { temp_c: 11, condition: "lluvia ligera", rain_mm: 3.2 },
};

const SEARCH: { match: RegExp; result: string }[] = [
  { match: /cien a.os/i, result: "«Cien años de soledad» (1967) es una novela del escritor colombiano Gabriel García Márquez." },
  { match: /garc.a m.rquez/i, result: "Gabriel García Márquez nació el 6 de marzo de 1927 en Aracataca (Colombia) y recibió el Nobel de Literatura en 1982." },
];

export function runTool(name: ToolName, args: Record<string, string>): Record<string, unknown> {
  if (name === "get_weather") {
    const w = WEATHER[(args.city ?? "").toLowerCase()];
    return w ? { city: args.city, ...w } : { error: "ciudad no encontrada" };
  }
  if (name === "calculator") {
    try {
      const v = calc(args.expression ?? "");
      return { result: Math.round(v * 1e6) / 1e6 };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  const hit = SEARCH.find((s) => s.match.test(args.query ?? ""));
  return { snippet: hit ? hit.result : "Sin resultados." };
}
