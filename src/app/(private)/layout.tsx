import Link from "next/link";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-slate-900">
          CoSpace Dashboard
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">Mi Cuenta</span>
          <button className="text-red-600 hover:text-red-700 font-medium">
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}