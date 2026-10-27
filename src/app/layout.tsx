import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoSpace",
  description: "Plataforma de gestión de Coworking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <I18nProvider>
          <Navbar />
          {/* El contenido de todas tus páginas (Home, Spaces, Dashboard) irá aquí dentro */}
          <main className="min-h-screen bg-white text-slate-900">
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}