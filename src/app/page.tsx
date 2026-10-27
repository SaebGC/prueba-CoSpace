import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-white">
      <h1 className="text-5xl font-bold mb-4 text-slate-900">
        El mejor lugar para trabajar
      </h1>
      <p className="text-xl text-slate-600 mb-8 max-w-2xl">
        Conecta, crea y crece en nuestros espacios premium equipados para tu productividad.
      </p>
      <Link 
        href="/spaces" 
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Ver espacios disponibles
      </Link>
    </div>
  );
}