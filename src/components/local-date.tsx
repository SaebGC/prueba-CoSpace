"use client";

import { useState, useEffect } from "react";

export function LocalDate({ date }: { date: string | Date }) {
  const [isMounted, setIsMounted] = useState(false);

  // Bandera de montaje para evitar error de hidratación (discrepancia Servidor/Cliente)
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <span className="opacity-0">Cargando fecha...</span>;

  return <span>{new Date(date).toLocaleString()}</span>;
}