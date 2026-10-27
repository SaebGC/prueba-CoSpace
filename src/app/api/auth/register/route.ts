import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "El correo ya existe" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { name, email, password: hashedPassword, role: "USER" },
    });

    return NextResponse.json({ message: "Usuario creado exitosamente" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}