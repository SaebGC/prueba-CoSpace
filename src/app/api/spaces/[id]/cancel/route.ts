import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateAdminRoute } from "@/lib/server-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await validateAdminRoute();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Regla 13: Validación antes de desactivar (soft delete)
  if (body.isActive === false) {
    const futureReservationsCount = await db.reservation.count({
      where: {
        spaceId: id,
        status: "CONFIRMED",
        startTime: { gt: new Date() },
      },
    });

    if (futureReservationsCount > 0) {
      return NextResponse.json(
        { error: "Conflicto: Existen reservas futuras confirmadas (Regla 13)" },
        { status: 409 }
      );
    }
  }

  try {
    const updatedSpace = await db.space.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updatedSpace);
  } catch (e) {
    return NextResponse.json({ error: "Espacio no encontrado o datos inválidos" }, { status: 404 });
  }
}