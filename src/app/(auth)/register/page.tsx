import Link from "next/link";

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Crear Cuenta</h2>
      <p className="text-sm text-slate-500 mt-1">Únete a la comunidad de CoSpace</p>
      <p className="mt-6 text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}