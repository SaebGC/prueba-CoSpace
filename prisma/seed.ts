import { PrismaClient, Role, SpaceType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Cargar variables de entorno del archivo .env de forma nativa en Node.js
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Omite si las variables ya están en el entorno
  }
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL o DIRECT_URL no están definidas en las variables de entorno");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando la siembra de datos (Seed)...");

  // 1. Crear o actualizar Administrador
  const adminPassword = await bcrypt.hash("Admin123*", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cospace.com" },
    update: {
      password: adminPassword,
      role: Role.ADMIN,
    },
    create: {
      email: "admin@cospace.com",
      name: "Administrador General",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Usuario Admin listo: ${adminUser.email}`);

  // 2. Crear usuario regular de prueba
  const userPassword = await bcrypt.hash("User123*", 10);
  const regularUser = await prisma.user.upsert({
    where: { email: "usuario@cospace.com" },
    update: {
      password: userPassword,
      role: Role.USER,
    },
    create: {
      email: "usuario@cospace.com",
      name: "Juan Pérez",
      password: userPassword,
      role: Role.USER,
    },
  });
  console.log(`Usuario Regular listo: ${regularUser.email}`);

  // 3. Crear espacios iniciales
  const spaces = [
    {
      id: "desk-caribe-01",
      name: "Hot Desk Caribe",
      type: SpaceType.DESK,
      description: "Puesto de trabajo ergonómico individual en zona compartida silenciosa. Incluye café y Wi-Fi de alta velocidad.",
      capacity: 1,
      pricePerHour: 12.50,
      imageUrl: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80",
      isActive: true,
    },
    {
      id: "meeting-boardroom-01",
      name: "Sala de Juntas Executive",
      type: SpaceType.MEETING_ROOM,
      description: "Sala de conferencias equipada con pantalla 4K para presentaciones, pizarra de cristal y sistema de videoconferencia.",
      capacity: 10,
      pricePerHour: 45.00,
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      isActive: true,
    },
    {
      id: "booth-focus-01",
      name: "Cabina Acústica Focus Pod",
      type: SpaceType.BOOTH,
      description: "Cabina insonorizada individual para llamadas telefónicas confidenciales o videollamadas sin interrupciones.",
      capacity: 1,
      pricePerHour: 18.00,
      imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
      isActive: true,
    },
  ];

  for (const space of spaces) {
    await prisma.space.upsert({
      where: { id: space.id },
      update: {
        name: space.name,
        type: space.type,
        description: space.description,
        capacity: space.capacity,
        pricePerHour: space.pricePerHour,
        imageUrl: space.imageUrl,
        isActive: space.isActive,
      },
      create: space,
    });
    console.log(`Espacio listo [${space.type}]: ${space.name}`);
  }

  console.log("Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });