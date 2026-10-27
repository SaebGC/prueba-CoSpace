import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createAccessToken, createRefreshToken } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/cookies";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await db.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const accessToken = await createAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = await createRefreshToken({ id: user.id });

    // Hashear el refresh token y guardarlo en la BD
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await db.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({ message: "Login exitoso", role: user.role });
  } catch (error) {
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}