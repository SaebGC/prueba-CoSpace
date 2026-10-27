"use client";

import { useEffect, useState } from "react";
import { LocalDate } from "@/components/local-date";
import { useI18n } from "@/components/i18n-provider";

export default function DashboardPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/reservations")
      .then((res) => res.json())
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("¿Seguro que deseas cancelar esta reserva?")) return;
    
    const res = await fetch(`/api/reservations/${id}/cancel`, { method: "PATCH" });
    if (res.ok) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "CANCELLED" } : r));
    } else {
      const error = await res.json();
      alert(error.error || "No se pudo cancelar");
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando reservas...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">{t.dashboard}</h2>
      
      {reservations.length === 0 ? (
        <p>No tienes reservas activas.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reservations.map((res) => (
            <div key={res.id} className="border p-4 rounded flex justify-between items-center shadow-sm">
              <div>
                <p className="font-semibold">{res.space.name}</p>
                <p className="text-sm text-slate-600">
                  Inicio: <LocalDate date={res.startTime} /> <br />
                  Fin: <LocalDate date={res.endTime} />
                </p>
                <p className="font-bold mt-1 text-blue-600">
                  Estado: {res.status} | Total: ${res.totalPrice}
                </p>
              </div>
              
              {res.status === "CONFIRMED" && (
                <button 
                  onClick={() => handleCancel(res.id)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100"
                >
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}