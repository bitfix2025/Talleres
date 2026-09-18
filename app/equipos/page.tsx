"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Smartphone, UserRound, Wrench, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Equipo = { id: string; marca?: string | null; modelo?: string | null; imei?: string | null; cliente_id: string };
type Cliente = { id: string; nombre: string; telefono?: string | null };
type Orden = { id: string; cliente_id: string; equipo_id?: string | null; created_at: string; estado?: string | null; falla_reportada?: string | null };

const marcaVisible = (marca?: string | null) => {
  const valor = (marca || "").trim().toLowerCase();
  if (valor === "apple" || valor === "manzana") return "Apple";
  return marca || "";
};

export default function EquiposPage() {
  const router = useRouter();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const [e, c, o] = await Promise.all([
        supabase.from("equipos").select("id,marca,modelo,imei,cliente_id").order("modelo"),
        supabase.from("clientes").select("id,nombre,telefono"),
        supabase.from("ordenes_reparacion").select("id,cliente_id,equipo_id,created_at,estado,falla_reportada").order("created_at", { ascending: false }),
      ]);
      if (e.error || c.error || o.error) setError(e.error?.message || c.error?.message || o.error?.message || "No se pudieron cargar los equipos.");
      else {
        setEquipos((e.data || []) as Equipo[]);
        setClientes((c.data || []) as Cliente[]);
        setOrdenes((o.data || []) as Orden[]);
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const equiposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return equipos;
    return equipos.filter(e => {
      const cliente = clientes.find(c => c.id === e.cliente_id);
      return [e.marca, e.modelo, e.imei, cliente?.nombre, cliente?.telefono].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [equipos, clientes, busqueda]);

  const ordenesEquipo = (id: string) => ordenes.filter(o => o.equipo_id === id);

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-5 text-gray-900 md:px-7 md:py-7"><button type="button" onClick={()=>router.back()} className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><ArrowLeft size={16}/> Volver</button>
      <div className="mx-auto max-w-[1480px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#16a34a]">Gestión</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Equipos</h1>
            <p className="mt-2 text-sm text-gray-500">Cada equipo queda asociado a su cliente y conserva su historial.</p>
          </div>
          <button onClick={() => router.push("/reparaciones/nueva")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#15803d]">
            <Plus size={18}/> Nueva reparación
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"><Smartphone className="text-green-700" size={20}/><p className="mt-3 text-2xl font-black">{equipos.length}</p><p className="text-xs text-gray-500">Equipos registrados</p></div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"><UserRound className="text-green-700" size={20}/><p className="mt-3 text-2xl font-black">{new Set(equipos.map(e => e.cliente_id)).size}</p><p className="text-xs text-gray-500">Clientes con equipos</p></div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"><Wrench className="text-green-700" size={20}/><p className="mt-3 text-2xl font-black">{ordenes.length}</p><p className="text-xs text-gray-500">Reparaciones registradas</p></div>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por modelo, IMEI, cliente o teléfono..." className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-[#16a34a] focus:bg-white focus:ring-2 focus:ring-green-100"/></div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="mt-5">
          {cargando ? <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Cargando equipos...</div> :
          equiposFiltrados.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"><Smartphone className="mx-auto text-gray-300" size={38}/><h2 className="mt-3 font-bold">No hay equipos</h2><p className="mt-1 text-sm text-gray-500">{busqueda ? "No encontramos coincidencias." : "Los equipos aparecerán aquí al registrar clientes y reparaciones."}</p></div> :
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{equiposFiltrados.map(e => {
            const cliente = clientes.find(c => c.id === e.cliente_id);
            const historial = ordenesEquipo(e.id);
            const ultima = historial[0];
            return <button key={e.id} onClick={() => router.push("/equipos/" + e.id)} className="group rounded-2xl border border-gray-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700"><Smartphone size={20}/></div><div className="min-w-0"><h2 className="truncate font-bold text-gray-950">{e.marca || e.modelo ? ((marcaVisible(e.marca) ? marcaVisible(e.marca) + " " : "") + (e.modelo || "")) : "Equipo"}</h2><p className="mt-0.5 text-xs text-gray-500">{e.imei ? "IMEI: " + e.imei : "IMEI no registrado"}</p></div></div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-green-700"/>
              </div>
              <div className="mt-4 rounded-xl bg-gray-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cliente</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold"><UserRound size={14} className="text-gray-400"/>{cliente?.nombre || "Sin cliente"}</p><p className="mt-1 text-xs text-gray-500">{cliente?.telefono || "Sin teléfono"}</p></div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3"><span className="text-xs text-gray-500">{historial.length} {historial.length === 1 ? "reparación" : "reparaciones"}</span><span className="text-xs font-bold text-green-700">{ultima ? "Última: " + new Date(ultima.created_at).toLocaleDateString("es-AR") : "Sin historial"}</span></div>
            </button>;
          })}</div>}
        </section>
      </div>
    </main>
  );
}
