import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRoute } from "@/lib/server-auth";

// GET: Listar reservas
export async function GET() {
  const { session, error } = await validateRoute();
  if (error || !session) return NextResponse.json({ error }, { status: 401 });

  // Regla 14: Filtrar SIEMPRE por el identificador del token (ignora query params)
  const reservations = await db.reservation.findMany({
    where: { userId: session.id },
    include: { space: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(reservations);
}

// POST: Crear Reserva
export async function POST(req: Request) {
  const { session, error } = await validateRoute();
  if (error || !session) return NextResponse.json({ error }, { status: 401 });

  const { spaceId, startTime: startStr, endTime: endStr } = await req.json();
  const startTime = new Date(startStr);
  const endTime = new Date(endStr);
  const now = new Date();

  // Regla 1: Duración de 1 a 4 horas exactas (Minutos y segundos en 0)
  if (startTime.getMinutes() !== 0 || endTime.getMinutes() !== 0) {
    return NextResponse.json({ error: "Las horas deben ser exactas (Regla 1)" }, { status: 400 });
  }
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  if (durationHours < 1 || durationHours > 4 || !Number.isInteger(durationHours)) {
    return NextResponse.json({ error: "Duración debe ser entre 1 y 4 horas enteras (Regla 1)" }, { status: 400 });
  }

  // Regla 2: Horarios estrictos de 07:00 a 21:00 (Trabajando en hora UTC para uniformidad)
  if (startTime.getUTCHours() < 7 || endTime.getUTCHours() > 21 || (endTime.getUTCHours() === 21 && endTime.getUTCMinutes() > 0)) {
    return NextResponse.json({ error: "Fuera del horario operativo: 07:00 - 21:00 (Regla 2)" }, { status: 400 });
  }

  // Regla 3: Fechas válidas (Ni pasado ni >30 días)
  if (startTime < now) {
    return NextResponse.json({ error: "No se puede reservar en el pasado (Regla 3)" }, { status: 400 });
  }
  const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (startTime > maxDate) {
    return NextResponse.json({ error: "No se puede reservar con más de 30 días de anticipación (Regla 3)" }, { status: 400 });
  }

  // Regla 7: Espacio existe y está activo
  const space = await db.space.findUnique({ where: { id: spaceId } });
  if (!space) return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
  if (!space.isActive) return NextResponse.json({ error: "Espacio inactivo (Regla 7)" }, { status: 400 });

  // Regla 6: Máximo 3 reservas activas a futuro
  const futureCount = await db.reservation.count({
    where: { userId: session.id, status: "CONFIRMED", startTime: { gt: now } },
  });
  if (futureCount >= 3) return NextResponse.json({ error: "Límite de reservas futuras alcanzado (Regla 6)" }, { status: 409 });

  // Regla 5: Solapamiento del usuario
  const userOverlap = await db.reservation.findFirst({
    where: { userId: session.id, status: "CONFIRMED", startTime: { lt: endTime }, endTime: { gt: startTime } },
  });
  if (userOverlap) return NextResponse.json({ error: "Ya tienes otra reserva en este horario (Regla 5)" }, { status: 409 });

  // Regla 4: Solapamiento del espacio
  const spaceOverlap = await db.reservation.findFirst({
    where: { spaceId, status: "CONFIRMED", startTime: { lt: endTime }, endTime: { gt: startTime } },
  });
  if (spaceOverlap) return NextResponse.json({ error: "El espacio ya está ocupado en este horario (Regla 4)" }, { status: 409 });

  // Regla 8: Cálculo del total en backend (Inmune a manipulaciones del frontend)
  const totalPrice = Number((durationHours * Number(space.pricePerHour)).toFixed(2));

  const newReservation = await db.reservation.create({
    data: { userId: session.id, spaceId, startTime, endTime, totalPrice, status: "CONFIRMED" },
  });

  return NextResponse.json(newReservation, { status: 201 });
}