import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key-cospace-2026"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo proteger rutas /dashboard y /admin
  const isPrivate = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");

  if (!isPrivate && !isAdmin) {
    return NextResponse.next();
  }

  const token = req.cookies.get("accessToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Validar acceso de administrador
    if (isAdmin && payload.role !== "ADMIN") {
      // Si un USER intenta entrar a /admin, mandarlo a su dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Si el access token expiró o es inválido, redirigir al login.
    // (El frontend será responsable de intentar llamar a /api/auth/refresh silenciosamente)
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};