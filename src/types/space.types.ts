export interface SpaceDTO {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  imageUrl?: string | null;
  isActive: boolean;
}