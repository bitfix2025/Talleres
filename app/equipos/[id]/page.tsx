"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronRight, Clock3, Smartphone, UserRound, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Equipo = { id: string; marca?: string | null; modelo?: string | null; imei?: string | null; cliente_id: string };
type Cliente = { id: string; nombre: string; telefono?: string | null };
type Orden = { id: string; cliente_id: string; equipo_id?: string | null; created_at: string; estado?: string | null; falla_reportada?: string | null };

export default function EquipoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const cargar = async () => {
      setCargando(true);
      const { data: e, error: ee } = await supabase.from("equipos").select("id,marca,modelo,imei,cliente_id").eq("id", id).single();
      if (ee || !e) { setError(ee?.message || "Equipo no encontrado."); setCargando(false); return; }
      const [c, o] = await Promise.all([
        supabase.from("clientes").select("id,nombre,telefono").eq("id", e.cliente_id).single(),
        supabase.from("ordenes_reparacion").select("id,cliente_id,equipo_id,created_at,estado,falla_reportada").eq("equipo_id", id).order("created_at", { ascending: false }),
      ]);
      setEquipo(e as Equipo);
      setCliente(c.data as Cliente);
      setOrdenes((o.data || []) as Orden[]);
      setError(c.error?.message || o.error?.message || "");
      setCargando(false);
    };
    cargar();
  }, [id]);

  if (cargando) return <main className="min-h-screen bg-[#f7f8f7] p-8 text-center text-sm text-gray-500">Cargando equipo...</main>;
  if (error || !equipo) return <main className="min-h-screen bg-[#f7f8f7] p-8"><button onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm font-bold text-green-700"><ArrowLeft size={17}/> Volver</button><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Equipo no encontrado."}</div></main>;

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-5 md:px-7 md:py-7">
      <div className="mx-auto max-w-[1150px]">
        <button onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-green-700"><ArrowLeft size={17}/> Equipos</button>
        <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-green-50 to-white p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700"><Smartphone size={30}/></div><div><p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Equipo</p><h1 className="mt-1 text-3xl font-black">{equipo.marca ? equipo.marca + " " : ""}{equipo.modelo || "Equipo"}</h1><p className="mt-1 text-sm text-gray-500">{equipo.imei ? "IMEI: " + equipo.imei : "IMEI no registrado"}</p></div></div>
              <div className="rounded-2xl bg-white px-5 py-3 shadow-sm"><p className="text-xl font-black">{ordenes.length}</p><p className="text-[11px] text-gray-500">Reparaciones</p></div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h2 className="font-black">Propietario</h2>
            <div className="mt-4 rounded-2xl bg-gray-50 p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-white p-2 text-green-700"><UserRound size={18}/></div><div><p className="font-bold">{cliente?.nombre || "Sin cliente"}</p><p className="mt-1 text-xs text-gray-500">{cliente?.telefono || "Sin teléfono"}</p></div></div></div>
            {cliente && <button onClick={() => router.push("/clientes/" + cliente.id)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-green-700 hover:bg-green-50">Ver cliente <ChevronRight size={17}/></button>}
          </section>

          <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="font-black">Historial del equipo</h2><p className="mt-1 text-xs text-gray-500">Todas las reparaciones de este dispositivo</p></div><Wrench size={20} className="text-green-700"/></div>
            <div className="mt-4 space-y-3">
              {ordenes.length === 0 ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Este equipo todavía no tiene reparaciones.</p> :
                ordenes.map(o => <button key={o.id} onClick={() => router.push("/reparaciones/" + o.id)} className="group flex w-full items-center gap-4 rounded-2xl border border-gray-100 p-4 text-left transition hover:border-green-200 hover:bg-green-50/40"><div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 sm:flex"><CalendarDays size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">Orden #{String(o.id).padStart(4, "0")}</p><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600">{o.estado || "SIN ESTADO"}</span></div><p className="mt-1 truncate text-xs text-gray-500">{o.falla_reportada || "Sin problema indicado"}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400"><Clock3 size={12}/>{new Date(o.created_at).toLocaleDateString("es-AR")}</p></div><ChevronRight size={18} className="text-gray-300 transition group-hover:text-green-700"/></button>)
              }
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}