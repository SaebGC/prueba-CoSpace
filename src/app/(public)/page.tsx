import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 text-center">
      <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
        Encuentra tu espacio de trabajo ideal
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Reserva puestos de coworking, oficinas privadas y salas de juntas por hora.
      </p>
      <div className="mt-8">
        <Link
          href="/spaces"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
        >
          Explorar Espacios
        </Link>
      </div>
    </section>
  );
}