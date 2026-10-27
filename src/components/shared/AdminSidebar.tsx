import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-slate-950 text-slate-200 p-6 flex flex-col justify-between">
      <div>
        <div className="mb-8 font-bold text-lg text-white tracking-wider">
          COSPACE ADMIN
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link
            href="/admin/spaces"
            className="rounded-md px-3 py-2 bg-slate-800 text-white font-medium"
          >
            Gestión de Espacios
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            Vista Usuario
          </Link>
        </nav>
      </div>
      <Link
        href="/"
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        ← Volver al sitio público
      </Link>
    </aside>
  );
}