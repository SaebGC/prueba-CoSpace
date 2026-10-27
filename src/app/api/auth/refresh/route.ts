import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyToken, createAccessToken } from "@/lib/jwt";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) return NextResponse.json({ error: "No token" }, { status: 401 });

    const payload = await verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.hashedRefreshToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Validar que el token coincida con el hash de la BD
    const isValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isValid) return NextResponse.json({ error: "Token revocado" }, { status: 401 });

    // Generar y setear NUEVO Access Token
    const newAccessToken = await createAccessToken({ id: user.id, email: user.email, role: user.role });
    cookieStore.set("accessToken", newAccessToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 15 * 60
    });

    return NextResponse.json({ message: "Token renovado" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}