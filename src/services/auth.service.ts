import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAccessToken } from "@/lib/jwt";

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  static async createToken(userId: string, email: string, role: "USER" | "ADMIN") {
    return createAccessToken({ id: userId, email, role });
  }
}
