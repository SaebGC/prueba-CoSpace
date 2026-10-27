import { db } from "@/lib/db";

export class ReservationsService {
  static async checkOverlap(spaceId: string, start: Date, end: Date): Promise<boolean> {
    const conflict = await db.reservation.findFirst({
      where: {
        spaceId,
        status: "CONFIRMED",
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
    });
    return !!conflict;
  }
}