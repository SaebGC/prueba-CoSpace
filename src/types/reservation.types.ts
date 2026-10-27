import { ReservationStatus } from "@prisma/client";

export interface ReservationDTO {
  id: string;
  userId: string;
  spaceId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: ReservationStatus;
}