import { db } from "@/lib/db";

export class SpacesService {
  static async getActiveSpaces() {
    return db.space.findMany({ where: { isActive: true } });
  }

  static async deactivateSpace(id: string) {
    // Regla: no desactivar si tiene reservas activas a futuro
    const activeReservations = await db.reservation.count({
      where: {
        spaceId: id,
        status: "CONFIRMED",
        startTime: { gte: new Date() },
      },
    });

    if (activeReservations > 0) {
      throw new Error("No se puede desactivar un espacio con reservas futuras activas");
    }

    return db.space.update({
      where: { id },
      data: { isActive: false },
    });
  }
}