import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRoute } from "@/lib/server-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await validateRoute();
  if (error || !session) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;

  const reservation = await db.reservation.findUnique({ where: { id } });
  if (!reservation) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

  // Regla 9: Verificar propiedad o rol administrador
  if (reservation.userId !== session.id && session.role !== "ADMIN") {
    return NextResponse.json({ error: "No tienes permisos para cancelar esta reserva (Regla 9)" }, { status: 403 });
  }

  // Regla 10: Límite de 2 horas previas si es usuario normal
  if (session.role !== "ADMIN") {
    const hoursUntilStart = (reservation.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart < 2) {
      return NextResponse.json({ error: "Las cancelaciones deben hacerse con 2 horas de anticipación mínimo (Regla 10)" }, { status: 400 });
    }
  }

  // Regla 11: Actualizar a CANCELLED (sin borrar el registro)
  const updatedReservation = await db.reservation.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(updatedReservation);
}