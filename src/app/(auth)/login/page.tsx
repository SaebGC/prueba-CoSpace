"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Redirigir según el rol del usuario
      if (data.role === "ADMIN") {
        router.push("/admin/spaces");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h2>
      <p className="text-sm text-slate-500 mt-1">Ingresa a tu cuenta de CoSpace</p>
      
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        
        <div>
          <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
            placeholder="admin@cospace.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-slate-900 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}