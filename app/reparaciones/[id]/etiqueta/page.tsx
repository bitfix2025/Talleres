"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Orden = {
  id: number;
  falla_reportada: string | null;
  contrasena_equipo: string | null;
  created_at: string | null;
  cliente: { nombre: string | null } | null;
  equipo: { marca: string | null; modelo: string | null; imei: string | null } | null;
};

export default function EtiquetaTecnico() {
  const params = useParams();
  const ordenId = String(params.id);
  const [orden, setOrden] = useState<Orden | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase
        .from("ordenes_reparacion")
        .select("id,falla_reportada,contrasena_equipo,created_at,cliente_id,equipo_id")
        .eq("id", ordenId)
        .maybeSingle();

      if (error || !data) return;

      const [{ data: cliente }, { data: equipo }] = await Promise.all([
        supabase.from("clientes").select("nombre").eq("id", data.cliente_id).maybeSingle(),
        supabase.from("equipos").select("marca,modelo,imei").eq("id", data.equipo_id).maybeSingle(),
      ]);

      setOrden({
        id: data.id,
        falla_reportada: data.falla_reportada,
        contrasena_equipo: data.contrasena_equipo,
        created_at: data.created_at,
        cliente: cliente || null,
        equipo: equipo || null,
      });
    };
    cargar();
  }, [ordenId]);

  useEffect(() => {
    if (orden) setTimeout(() => window.print(), 300);
  }, [orden]);

  if (!orden) return <div className="p-4 text-sm">Cargando etiqueta...</div>;

  return (
    <>
      <style jsx global>{`
        @page { size: 90mm 65mm; margin: 0; }
        @media print {
          html, body { width: 90mm; height: 65mm; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
      <main className="w-[90mm] min-h-[65mm] bg-white p-3 text-black">
        <div className="border-2 border-black p-3">
          <div className="text-center text-xl font-black tracking-wide">BITFIX</div>
          <div className="mt-1 border-y border-black py-1 text-center text-lg font-black">
            ORDEN #{String(orden.id).padStart(5, "0")}
          </div>
          <div className="mt-2 space-y-0.5 text-[10px] leading-4">
            <div><b>CLIENTE:</b> {orden.cliente?.nombre || "-"}</div>
            <div><b>EQUIPO:</b> {[orden.equipo?.marca, orden.equipo?.modelo].filter(Boolean).join(" ") || "-"}</div>
            <div><b>IMEI:</b> {orden.equipo?.imei || "-"}</div>
            <div><b>CLAVE:</b> {orden.contrasena_equipo || "-"}</div>
          </div>
          <div className="mt-2 border-t border-black pt-2 text-[10px] leading-4">
            <b>PROBLEMA / TRABAJO:</b>
            <div className="mt-1 whitespace-pre-wrap">{orden.falla_reportada || "-"}</div>
          </div>
        </div>
      </main>
    </>
  );
}
