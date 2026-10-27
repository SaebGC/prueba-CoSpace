import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { clearAuthCookies } from "@/lib/cookies";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload) {
        // Eliminar el refresh token de la base de datos
        await db.user.update({
          where: { id: payload.id },
          data: { hashedRefreshToken: null },
        });
      }
    }

    await clearAuthCookies();
    return NextResponse.json({ message: "Logout exitoso" });
  } catch (error) {
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}