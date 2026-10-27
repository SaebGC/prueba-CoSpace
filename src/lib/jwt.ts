import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key-cospace-2026"
);

export async function createAccessToken(payload: { id: string; email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // Vida corta: 15 minutos
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: { id: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Vida larga: 7 días
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string; role: string; exp: number };
  } catch (error) {
    return null;
  }
}