import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRoute, validateAdminRoute } from "@/lib/server-auth";

export async function GET() {
  const { session } = await validateRoute();
  
  // Listar: Usuarios públicos/regulares ven activos, ADMIN ve todos.
  const isAdmin = session?.role === "ADMIN";
  
  const spaces = await db.space.findMany({
    where: isAdmin ? {} : { isActive: true },
  });

  return NextResponse.json(spaces);
}

export async function POST(req: Request) {
  const { session, error } = await validateAdminRoute();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  
  try {
    const newSpace = await db.space.create({ data: body });
    return NextResponse.json(newSpace, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}