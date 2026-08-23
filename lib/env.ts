// Server code (server components, server actions, API routes) checks the
// real VERCEL env var directly — authoritative, no config needed. Client
// components can't see that var, so they read the NEXT_PUBLIC_ mirror that
// next.config.ts sets from it at build time.
export const isReadOnly =
  typeof window === "undefined" ? process.env.VERCEL === "1" : process.env.NEXT_PUBLIC_READ_ONLY === "1";

export function assertMutable() {
  if (isReadOnly) {
    throw new Error(
      "Esta acción no está disponible en la versión desplegada. Edita los datos en local y vuelve a importar la copia de seguridad."
    );
  }
}
