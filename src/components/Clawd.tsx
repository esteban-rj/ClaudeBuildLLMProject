"use client";
// Clawd: la mascota pixelada de Claude, dibujada en SVG con estados de ánimo.
import type { Mood } from "@/lib/guide-store";

const ORANGE = "#D97757";
const DARK = "#141413";

export function Clawd({ size = 96, mood = "idle", speaking = false, listening = false }: { size?: number; mood?: Mood; speaking?: boolean; listening?: boolean }) {
  const wiggle = mood === "happy" || mood === "surprised";
  return (
    <svg
      width={size}
      height={size * 0.85}
      viewBox="0 0 20 17"
      shapeRendering="crispEdges"
      style={{ animation: `clawd-bob ${speaking ? 0.5 : 2.4}s ease-in-out infinite`, overflow: "visible" }}
      aria-label="Clawd, el guía"
      role="img"
    >
      {listening && (
        <circle cx="10" cy="8" r="10" fill="none" stroke="#6A9BCC" strokeWidth="0.4" opacity="0.8">
          <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* sombra */}
      <ellipse cx="10" cy="16.6" rx="6.5" ry="0.6" fill="#000" opacity="0.35" />
      {/* brazos */}
      <g style={{ transformOrigin: "3px 7px", animation: wiggle ? "clawd-wiggle 0.6s ease-in-out infinite" : undefined }}>
        <rect x="0" y="6" width="3" height="3" fill={ORANGE} />
      </g>
      <g style={{ transformOrigin: "17px 7px", animation: wiggle || mood === "explaining" ? "clawd-wiggle 0.8s ease-in-out infinite reverse" : undefined }}>
        <rect x="17" y="6" width="3" height="3" fill={ORANGE} />
      </g>
      {/* cuerpo */}
      <rect x="3" y="2" width="14" height="11" fill={ORANGE} />
      {/* patas */}
      <rect x="4" y="13" width="1.5" height="3" fill={ORANGE} />
      <rect x="7" y="13" width="1.5" height="3" fill={ORANGE} />
      <rect x="11.5" y="13" width="1.5" height="3" fill={ORANGE} />
      <rect x="14.5" y="13" width="1.5" height="3" fill={ORANGE} />
      {/* ojos */}
      <g style={{ transformOrigin: "10px 6px", animation: "clawd-blink 4s infinite" }}>
        {mood === "happy" ? (
          <>
            <path d="M5.5 6.5 L6.5 5 L7.5 6.5" stroke={DARK} strokeWidth="0.9" fill="none" />
            <path d="M12.5 6.5 L13.5 5 L14.5 6.5" stroke={DARK} strokeWidth="0.9" fill="none" />
          </>
        ) : mood === "surprised" ? (
          <>
            <rect x="5.5" y="4" width="2" height="3" fill={DARK} />
            <rect x="12.5" y="4" width="2" height="3" fill={DARK} />
          </>
        ) : mood === "thinking" ? (
          <>
            <rect x="6" y="4.5" width="1.5" height="1.5" fill={DARK} />
            <rect x="13" y="4.5" width="1.5" height="1.5" fill={DARK} />
          </>
        ) : (
          <>
            <rect x="6" y="4.5" width="1.5" height="2.5" fill={DARK} />
            <rect x="12.5" y="4.5" width="1.5" height="2.5" fill={DARK} />
          </>
        )}
      </g>
      {/* boca */}
      {speaking ? (
        <rect x="8.5" y="8.5" width="3" height="2" fill={DARK} style={{ transformOrigin: "10px 9.5px", animation: "clawd-talk 0.22s ease-in-out infinite" }} />
      ) : mood === "happy" ? (
        <path d="M8 8.8 Q10 10.6 12 8.8" stroke={DARK} strokeWidth="0.7" fill="none" />
      ) : mood === "surprised" ? (
        <rect x="9.2" y="8.6" width="1.6" height="1.6" fill={DARK} />
      ) : null}
      {mood === "thinking" && (
        <g fill="#F0EEE6">
          <circle cx="18" cy="1.5" r="0.5"><animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" /></circle>
          <circle cx="19.3" cy="0.4" r="0.6"><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.3s" repeatCount="indefinite" /></circle>
        </g>
      )}
    </svg>
  );
}
