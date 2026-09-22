import { useId } from "react";
import { cn } from "@/lib/cn";

const palettes = {
  CRISTAL: { fill: "#1e40af", line: "#93b4fb", glow: "#4f86f7" },
  SINTETICO: { fill: "#047857", line: "#a7f3d0", glow: "#34d399" },
  CEMENTO: { fill: "#475569", line: "#e2e8f0", glow: "#94a3b8" },
};

/**
 * Ilustración vectorial de una cancha de pádel (vista cenital).
 * `surface` define la paleta: CRISTAL | SINTETICO | CEMENTO. Sin imágenes → compatible con export estático.
 */
export function CourtArt({ surface = "CRISTAL", className }) {
  const { fill, line, glow } = palettes[surface] ?? palettes.CRISTAL;
  const uid = useId(); // ids únicos: la misma ilustración se repite en cada tarjeta

  return (
    <svg
      viewBox="0 0 200 400"
      aria-hidden
      className={cn("h-full w-full", className)}
      fill="none"
      stroke={line}
      strokeWidth="2"
      strokeLinecap="round"
    >
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fill} stopOpacity="0.95" />
          <stop offset="1" stopColor={fill} stopOpacity="0.55" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect x="6" y="6" width="188" height="388" rx="10" fill={glow} opacity="0.35" filter={`url(#${uid}-glow)`} stroke="none" />
      <rect x="10" y="10" width="180" height="380" rx="6" fill={`url(#${uid}-fill)`} />
      {/* líneas de saque */}
      <line x1="10" y1="90" x2="190" y2="90" />
      <line x1="10" y1="310" x2="190" y2="310" />
      <line x1="100" y1="90" x2="100" y2="310" />
      {/* red */}
      <line x1="4" y1="200" x2="196" y2="200" strokeWidth="4" strokeDasharray="2 6" />
      <circle cx="100" cy="200" r="3" fill={line} stroke="none" />
    </svg>
  );
}
