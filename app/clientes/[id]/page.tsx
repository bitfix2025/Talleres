"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronRight, Clock3, Phone, Smartphone, UserRound, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Cliente = { id: string; nombre: string; telefono?: string | null };
type Equipo = { id: string; marca?: string | null; modelo?: string | null; imei?: string | null; cliente_id: string };
type Orden = { id: string; cliente_id: string; equipo_id?: string | null; created_at: string; estado?: string | null; falla_reportada?: string | null };

const estado = (v?: string | null) => {
  const x = (v || "").toUpperCase();
  if (x.includes("ENTREG")) return "bg-gray-100 text-gray-600";
  if (x.includes("LISTO")) return "bg-green-100 text-green-700";
  if (x.includes("REPAR")) return "bg-blue-100 text-blue-700";
  if (x.includes("APRO")) return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
};

export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const cargar = async () => {
      setCargando(true);
      const [c, e, o] = await Promise.all([
        supabase.from("clientes").select("id,nombre,telefono").eq("id", id).single(),
        supabase.from("equipos").select("id,marca,modelo,imei,cliente_id").eq("cliente_id", id),
        supabase.from("ordenes_reparacion").select("id,cliente_id,equipo_id,created_at,estado,falla_reportada").eq("cliente_id", id).order("created_at", { ascending: false }),
      ]);
      if (c.error) setError(c.error.message);
      else {
        setCliente(c.data as Cliente);
        setEquipos((e.data || []) as Equipo[]);
        setOrdenes((o.data || []) as Orden[]);
        if (e.error || o.error) setError(e.error?.message || o.error?.message || "");
      }
      setCargando(false);
    };
    cargar();
  }, [id]);

  if (cargando) return <main className="min-h-screen bg-[#f7f8f7] p-8 text-center text-sm text-gray-500">Cargando cliente...</main>;
  if (error || !cliente) return <main className="min-h-screen bg-[#f7f8f7] p-8"><button onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm font-bold text-green-700"><ArrowLeft size={17}/> Volver</button><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Cliente no encontrado."}</div></main>;

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-5 md:px-7 md:py-7">
      <div className="mx-auto max-w-[1250px]">
        <button onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-green-700"><ArrowLeft size={17}/> Clientes</button>

        <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-green-50 to-white p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700"><UserRound size={28}/></div>
                <div><p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Cliente</p><h1 className="mt-1 text-3xl font-black">{cliente.nombre || "Sin nombre"}</h1><p className="mt-1 flex items-center gap-2 text-sm text-gray-500"><Phone size={14}/> {cliente.telefono || "Sin teléfono"}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><p className="text-xl font-black">{equipos.length}</p><p className="text-[11px] text-gray-500">Equipos</p></div>
                <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><p className="text-xl font-black">{ordenes.length}</p><p className="text-[11px] text-gray-500">Reparaciones</p></div>
                <div className="hidden rounded-2xl bg-white px-5 py-3 shadow-sm sm:block"><p className="text-xl font-black">{ordenes.filter(o => !String(o.estado || "").toUpperCase().includes("ENTREG")).length}</p><p className="text-[11px] text-gray-500">Abiertas</p></div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="font-black">Equipos</h2><p className="mt-1 text-xs text-gray-500">Equipos asociados a este cliente</p></div><Smartphone size={20} className="text-green-700"/></div>
            <div className="mt-4 space-y-2">
              {equipos.length === 0 ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No hay equipos registrados.</p> :
                equipos.map(e => <div key={e.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-white p-2 text-green-700"><Smartphone size={17}/></div><div><p className="font-bold">{e.marca ? e.marca + " " : ""}{e.modelo || "Equipo"}</p><p className="mt-1 text-xs text-gray-500">{e.imei ? "IMEI: " + e.imei : "IMEI no registrado"}</p></div></div></div>)
              }
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="font-black">Historial de reparaciones</h2><p className="mt-1 text-xs text-gray-500">Todas las órdenes de este cliente</p></div><Wrench size={20} className="text-green-700"/></div>
            <div className="mt-4 space-y-3">
              {ordenes.length === 0 ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Todavía no hay reparaciones.</p> :
                ordenes.map(o => <button key={o.id} onClick={() => router.push("/reparaciones/" + o.id)} className="group flex w-full items-center gap-4 rounded-2xl border border-gray-100 p-4 text-left transition hover:border-green-200 hover:bg-green-50/40">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 sm:flex"><CalendarDays size={18}/></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">Orden #{String(o.id).padStart(4, "0")}</p><span className={"rounded-full px-2.5 py-1 text-[10px] font-bold " + estado(o.estado)}>{o.estado || "SIN ESTADO"}</span></div><p className="mt-1 truncate text-xs text-gray-500">{o.falla_reportada || "Sin problema indicado"}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400"><Clock3 size={12}/>{new Date(o.created_at).toLocaleDateString("es-AR")}</p></div><ChevronRight size={18} className="text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-green-700"/>
                </button>)
              }
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}