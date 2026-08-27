import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isReadOnly } from "@/lib/env";

export async function assertMutable() {
  if (isReadOnly) {
    throw new Error(
      "Esta acción no está disponible en la versión desplegada. Edita los datos en local y vuelve a importar la copia de seguridad."
    );
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("No autenticado.");
  }
}
