import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { connection } from "next/server";
import { notFound } from "next/navigation";

const spaceTypeLabels: Record<string, string> = {
  DESK: "Escritorio",
  MEETING_ROOM: "Sala de Reuniones",
  BOOTH: "Cabina",
};

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // SSR dinámico en servidor para Next.js 16
  await connection();
  const { id } = await params;

  const space = await db.space.findUnique({
    where: { id },
  });

  if (!space || !space.isActive) {
    notFound();
  }

  const defaultImage =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/spaces"
        className="text-sm font-medium text-blue-600 hover:underline mb-6 inline-block"
      >
        &larr; Volver al catálogo
      </Link>

      <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-100 mb-6 shadow-sm">
        <Image
          src={space.imageUrl || defaultImage}
          alt={space.name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
            {spaceTypeLabels[space.type] ?? space.type}
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">{space.name}</h1>
          <p className="text-slate-600 mt-4 leading-relaxed">{space.description}</p>
        </div>

        <div className="min-w-[220px] p-4 bg-slate-50 border border-slate-200 rounded-lg text-right">
          <span className="text-xs text-slate-500 block">Tarifa por hora</span>
          <span className="text-2xl font-bold text-slate-900">
            ${space.pricePerHour.toString()}
          </span>
        </div>
      </div>
    </div>
  );
}

