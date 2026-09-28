import { esUY } from "@clerk/localizations";

/** Configuración de Clerk compartida por `providers/ClerkProvider` y las pantallas de auth. */

export const SIGN_IN_URL = "/sign-in";
export const SIGN_UP_URL = "/sign-up";

/** Español rioplatense (voseo), el más cercano a es-AR que ofrece Clerk. */
export const clerkLocalization = esUY;

/** Tema "PULPAD": dark nativo con acento brand-500. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#4F86F7", // brand-500
    colorBackground: "#0F172A", // slate-900
    colorForeground: "#FFFFFF",
    colorMutedForeground: "#94A3B8", // slate-400
    colorMuted: "#1E293B", // slate-800
    colorInput: "#020617", // slate-950
    colorInputForeground: "#FFFFFF",
    colorNeutral: "#CBD5E1", // slate-300
    colorBorder: "#334155", // slate-700
    colorDanger: "#FB7185", // rose-400
    colorSuccess: "#34D399", // emerald-400
    colorWarning: "#FBBF24", // amber-400
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans)",
  },
};
