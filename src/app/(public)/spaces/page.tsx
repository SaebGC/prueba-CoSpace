import Link from "next/link";
import { db } from "@/lib/db";
import { connection } from "next/server";

export default async function SpacesCatalog() {
  // Garantiza Server-Side Rendering (SSR) en tiempo real en Next.js 16
  await connection();

  const spaces = await db.space.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Catálogo de Espacios</h2>
        <p className="text-slate-600 mt-1">
          Espacios de trabajo disponibles en tiempo real (SSR).
        </p>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12 border border-slate-200 rounded-xl bg-slate-50 text-slate-500">
          No hay espacios disponibles en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="flex flex-col justify-between border border-slate-200 rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-4">
                  {space.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{space.name}</h3>
                <p className="text-slate-600 text-sm mt-2 line-clamp-3">
                  {space.description || "Espacio de trabajo equipado y listo para reservar."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Tarifa</span>
                  <span className="text-lg font-bold text-slate-900">
                    ${space.pricePerHour.toString()} / h
                  </span>
                </div>

                <Link
                  href={`/spaces/${space.id}`}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}