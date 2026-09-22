import { Geist, Geist_Mono, Sora } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { SITE } from "@/config/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });

export const metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
};

/** Server Component. Solo `AuthProvider` es Client; `children` sigue siendo estático. */
export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="bg-space flex min-h-full flex-col text-slate-300">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
