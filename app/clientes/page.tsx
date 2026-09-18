"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Users, Phone, Smartphone, ChevronRight, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Cliente = { id: string; nombre: string; telefono?: string | null };
type Equipo = { id: string; marca?: string | null; modelo?: string | null; cliente_id: string };
type Orden = { id: string; cliente_id: string; equipo_id?: string | null; created_at: string; estado?: string | null };

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError("");
      const [c, e, o] = await Promise.all([
        supabase.from("clientes").select("id,nombre,telefono").order("nombre"),
        supabase.from("equipos").select("id,marca,modelo,cliente_id"),
        supabase.from("ordenes_reparacion").select("id,cliente_id,equipo_id,created_at,estado").order("created_at", { ascending: false }),
      ]);
      if (c.error || e.error || o.error) setError(c.error?.message || e.error?.message || o.error?.message || "No se pudieron cargar los clientes.");
      else {
        setClientes((c.data || []) as Cliente[]);
        setEquipos((e.data || []) as Equipo[]);
        setOrdenes((o.data || []) as Orden[]);
      }
      setCargando(false);
    };
    cargar();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? clientes.filter(c => `${c.nombre} ${c.telefono || ""}`.toLowerCase().includes(q)) : clientes;
  }, [clientes, busqueda]);

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-5 text-gray-900 md:px-7 md:py-7">
      <div className="mx-auto max-w-[1480px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#16a34a]">Gestión</p><h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Clientes</h1><p className="mt-2 text-sm text-gray-500">Clientes, equipos e historial de reparaciones en un solo lugar.</p></div>
          <button onClick={() => router.push("/reparaciones/nueva")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#15803d]"><Plus size={18}/> Nueva reparación</button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[[Users, clientes.length, "Clientes registrados"], [Smartphone, equipos.length, "Equipos registrados"], [Phone, ordenes.length, "Reparaciones"]].map(([Icon, value, label]: any) => <div key={label} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"><Icon className="text-green-700" size={20}/><p className="mt-3 text-2xl font-black">{value}</p><p className="text-xs text-gray-500">{label}</p></div>)}
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cliente por nombre o teléfono..." className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-[#16a34a] focus:bg-white focus:ring-2 focus:ring-green-100"/></div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="mt-5">
          {cargando ? <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Cargando clientes...</div> :
          clientesFiltrados.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"><UserRound className="mx-auto text-gray-300" size={38}/><h2 className="mt-3 font-bold">No hay clientes</h2><p className="mt-1 text-sm text-gray-500">{busqueda ? "No encontramos coincidencias." : "Los clientes aparecerán aquí al registrar reparaciones."}</p></div> :
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{clientesFiltrados.map(cliente => {
            const eqs = equipos.filter(e => e.cliente_id === cliente.id);
            const ords = ordenes.filter(o => o.cliente_id === cliente.id);
            const ultima = ords[0];
            return <div key={cliente.id} className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700"><UserRound size={20}/></div><div className="min-w-0"><h2 className="truncate font-bold text-gray-950">{cliente.nombre || "Sin nombre"}</h2><p className="mt-0.5 text-xs text-gray-500">{cliente.telefono || "Sin teléfono"}</p></div></div><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600">{ords.length} {ords.length === 1 ? "reparación" : "reparaciones"}</span></div>
              <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Equipos</p><p className="mt-1 text-sm font-bold">{eqs.length}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Última visita</p><p className="mt-1 text-sm font-bold">{ultima ? new Date(ultima.created_at).toLocaleDateString("es-AR") : "—"}</p></div></div>
              {eqs.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{eqs.slice(0,3).map(e => <span key={e.id} className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600">{e.marca ? e.marca + " " : ""}{e.modelo || "Equipo"}</span>)}{eqs.length > 3 && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-500">+{eqs.length-3}</span>}</div>}
              <button onClick={() => router.push("/clientes/" + cliente.id)} className="mt-4 flex w-full items-center justify-between border-t border-gray-100 pt-4 text-sm font-bold text-green-700">Ver cliente <ChevronRight size={17} className="transition group-hover:translate-x-0.5"/></button>
            </div>;
          })}</div>}
        </section>
      </div>
    </main>
  );
}