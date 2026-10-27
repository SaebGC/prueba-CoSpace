import { Role } from "@prisma/client";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  user: UserSession;
  token: string;
}