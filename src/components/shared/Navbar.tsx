import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
        CoSpace
      </Link>
      <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
        <Link href="/spaces" className="hover:text-slate-900">Espacios</Link>
        <Link href="/login" className="hover:text-slate-900">Iniciar Sesión</Link>
        <Link
          href="/register"
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          Registrarse
        </Link>
      </nav>
    </header>
  );
}