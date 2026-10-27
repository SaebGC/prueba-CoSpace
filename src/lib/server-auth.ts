import { cookies } from "next/headers";
import { verifyToken } from "./jwt";

export async function validateRoute() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { session: null, error: "Acceso denegado: Token inexistente" };
  }

  const payload = await verifyToken(token);
  
  if (!payload) {
    return { session: null, error: "Acceso denegado: Token inválido o expirado" };
  }

  return { session: payload, error: null };
}

export async function validateAdminRoute() {
  const { session, error } = await validateRoute();

  if (error || !session) {
    return { session: null, error: error || "Acceso denegado" };
  }

  if (session.role !== "ADMIN") {
    return { session: null, error: "Acceso denegado: Se requieren permisos de administrador" };
  }

  return { session, error: null };
}