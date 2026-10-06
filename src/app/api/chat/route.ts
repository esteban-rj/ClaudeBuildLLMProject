import Anthropic from "@anthropic-ai/sdk";
import { oidcFederationProvider } from "@anthropic-ai/sdk/lib/credentials/oidc-federation";
import type { AccessToken, AccessTokenProvider } from "@anthropic-ai/sdk/lib/credentials/types";
import { getLesson, LESSONS } from "@/lib/lessons";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  lessonId: string | null;
  sceneContext?: string;
}

const SYSTEM = `Eres Clawd, la mascota de Claude (un bichito naranja pixelado y entrañable), y guías al usuario por "Clawd Lab", un mapa interactivo para aprender cómo funcionan los modelos de lenguaje y los agentes: desde la neurona hasta los sistemas multi-agente. El lema es "¡Vamos a construir un transformer!".

Cómo hablas:
- Siempre en español, tono cercano, entusiasta y paciente, como un buen profesor.
- Tus respuestas se leen EN VOZ ALTA: frases cortas y naturales, normalmente 2-5 oraciones. Nada de tablas, listas largas ni markdown pesado. Evita fórmulas complejas; si hace falta una, dila con palabras ("Q por K transpuesta, dividido entre raíz de d").
- Explica desde lo básico con analogías y ejemplos concretos con números pequeños. Si el usuario parece avanzado, sube el nivel.
- Relaciona lo que dices con lo que el usuario está viendo en pantalla (te paso el contexto de la escena) e invítale a probar algo concreto en la visualización.
- Si te preguntan por detalles internos no publicados de Claude (nº de parámetros, arquitectura exacta), di con honestidad que Anthropic no los ha publicado.
- Termina a menudo con una pregunta corta o una sugerencia para seguir explorando.

Mapa de lecciones:
${LESSONS.map((l) => `${l.order}. ${l.title} (${l.id}): ${l.summary}`).join("\n")}`;

// Workload Identity Federation: en Vercel cambiamos el token OIDC del proyecto
// por un token de acceso de Anthropic, sin guardar ninguna API key.
let cachedToken: AccessToken | null = null;

function federationCredentials(req: Request): AccessTokenProvider | null {
  const ruleId = process.env.ANTHROPIC_FEDERATION_RULE_ID;
  const orgId = process.env.ANTHROPIC_ORGANIZATION_ID;
  const oidc = req.headers.get("x-vercel-oidc-token") ?? process.env.VERCEL_OIDC_TOKEN;
  if (!ruleId || !orgId || !oidc) return null;
  const exchange = oidcFederationProvider({
    identityTokenProvider: () => oidc,
    federationRuleId: ruleId,
    organizationId: orgId,
    serviceAccountId: process.env.ANTHROPIC_SERVICE_ACCOUNT_ID,
    workspaceId: process.env.ANTHROPIC_WORKSPACE_ID,
    baseURL: "https://api.anthropic.com",
    fetch,
  });
  return async (opts) => {
    const fresh = cachedToken && (cachedToken.expiresAt === null || cachedToken.expiresAt - Date.now() / 1000 > 60);
    if (!fresh || opts?.forceRefresh) cachedToken = await exchange();
    return cachedToken!;
  };
}

function makeClient(req: Request): Anthropic | null {
  if (process.env.ANTHROPIC_API_KEY) return new Anthropic();
  const credentials = federationCredentials(req);
  return credentials ? new Anthropic({ credentials }) : null;
}

export async function POST(req: Request) {
  const client = makeClient(req);
  if (!client) {
    return new Response(
      "¡Ups! Aún no tengo cerebro conectado: falta configurar ANTHROPIC_API_KEY o la federación de identidades (ANTHROPIC_FEDERATION_RULE_ID y ANTHROPIC_ORGANIZATION_ID) en el servidor. Mientras tanto puedes seguir explorando las lecciones interactivas.",
      { status: 503 },
    );
  }

  const body = (await req.json()) as ChatBody;
  const lesson = body.lessonId ? getLesson(body.lessonId) : null;
  const messages = body.messages
    .filter((m) => m.content.trim())
    .slice(-20);
  // La API exige empezar con un turno de usuario
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) return new Response("Mensaje vacío", { status: 400 });

  const where = lesson
    ? `El usuario está en la lección ${lesson.order}: "${lesson.title}". ${lesson.chatContext}`
    : "El usuario está en el mapa principal, eligiendo lección.";
  const scene = body.sceneContext ? `\nEstado actual de la escena interactiva: ${body.sceneContext}` : "";

  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 2048,
    // Conversación por voz: priorizamos baja latencia
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: `${where}${scene}` },
    ],
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        stream.on("text", (t) => controller.enqueue(encoder.encode(t)));
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("Mmm, de eso prefiero no hablar. ¿Seguimos con los transformers?"));
        }
      } catch (err) {
        console.error(err);
        const msg = err instanceof Anthropic.RateLimitError
          ? "Estoy recibiendo muchas preguntas a la vez. Dame unos segundos y vuelve a intentarlo."
          : "Se me cruzaron los cables y no pude responder. ¿Lo intentamos otra vez?";
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
