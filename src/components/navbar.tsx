"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "./i18n-provider";

export function Navbar() {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-slate-900 text-white">
      <div className="flex gap-4">
        <Link href="/" className="font-bold">CoSpace</Link>
        <Link href="/spaces">{t.spaces}</Link>
        <Link href="/dashboard">{t.dashboard}</Link>
      </div>
      <div className="flex gap-4 items-center">
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value as "es" | "en")}
          className="bg-slate-800 text-white border-none rounded p-1"
        >
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>
        <button onClick={handleLogout} className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700">
          {t.logout}
        </button>
      </div>
    </nav>
  );
}