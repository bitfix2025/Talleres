"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Home,
  ImageIcon,
  Loader2,
  Package,
  Save,
  Smartphone,
  User,
  Wrench,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Cliente = { nombre: string | null; telefono: string | null };
type Equipo = {
  marca: string | null; modelo: string | null; imei: string | null;
  numero_serie: string | null; color: string | null; capacidad: string | null;
  bateria_porcentaje: number | null;
};
type Orden = {
  id: number; taller_id: number | null; cliente_id: number | null; equipo_id: number | null;
  estado: string | null; falla_reportada: string | null; observaciones: string | null;
  created_at: string | null; presupuesto_mano_obra?: number | null;
  cliente: Cliente | null; equipo: Equipo | null;
};
type Foto = { id: number; tipo: string; url: string };

type Paso = { db: string; key: string; label: string };
const FLUJO: Paso[] = [
  { db: "RECIBIDO", key: "RECIBIDO", label: "Recibido" },
  { db: "DIAGNÓSTICO", key: "DIAGNOSTICO", label: "Diagnóstico" },
  { db: "PRESUPUESTADO", key: "PRESUPUESTADO", label: "Presupuestado" },
  { db: "ESPERANDO APROBACIÓN", key: "ESPERANDO APROBACION", label: "Esperando aprobación" },
  { db: "APROBADO", key: "APROBADO", label: "Aprobado" },
  { db: "EN REPARACIÓN", key: "EN REPARACION", label: "En reparación" },
  { db: "LISTO PARA ENTREGAR", key: "LISTO PARA ENTREGAR", label: "Listo para entregar" },
  { db: "ENTREGADO", key: "ENTREGADO", label: "Entregado" },
];

const normalizar = (v: string | null | undefined) =>
  (v || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const estadoClase = (estado: string | null | undefined) => {
  switch (normalizar(estado)) {
    case "RECIBIDO": return "border-blue-200 bg-blue-50 text-blue-700";
    case "DIAGNOSTICO": return "border-purple-200 bg-purple-50 text-purple-700";
    case "PRESUPUESTADO": return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "ESPERANDO APROBACION": return "border-orange-200 bg-orange-50 text-orange-700";
    case "APROBADO": return "border-green-200 bg-green-50 text-green-700";
    case "EN REPARACION": return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "LISTO PARA ENTREGAR": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ENTREGADO": return "border-gray-200 bg-gray-100 text-gray-600";
    default: return "border-gray-200 bg-gray-100 text-gray-600";
  }
};

const fecha = (v: string | null) => v ? new Date(v).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "-";

export default function ReparacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = Number(params.id);

  const [orden, setOrden] = useState<Orden | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [diagnostico, setDiagnostico] = useState("");
  const [notas, setNotas] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setCargando(true); setError("");
    const { data, error: e } = await supabase.from("ordenes_reparacion").select(`
      id,taller_id,cliente_id,equipo_id,estado,falla_reportada,observaciones,created_at,presupuesto_mano_obra,
      clientes(nombre,telefono),
      equipos(marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje)
    `).eq("id", ordenId).maybeSingle();
    if (e) { setError(e.message); setOrden(null); setCargando(false); return; }
    if (!data) { setError("La orden no existe."); setOrden(null); setCargando(false); return; }
    const cliente = Array.isArray(data.clientes) ? data.clientes[0] || null : data.clientes || null;
    const equipo = Array.isArray(data.equipos) ? data.equipos[0] || null : data.equipos || null;
    setOrden({ ...data, cliente, equipo } as Orden);
    const obs = data.observaciones || "";
    const dm = obs.match(/Diagnóstico:\s*([\s\S]*?)(?:\n\nNotas técnicas:|$)/i);
    const nm = obs.match(/Notas técnicas:\s*([\s\S]*)$/i);
    setDiagnostico(dm?.[1]?.trim() || "");
    setNotas(nm?.[1]?.trim() || (dm ? "" : obs));
    const { data: fotosData } = await supabase.from("fotos_recepcion").select("id,tipo,url").eq("orden_id", ordenId).order("id");
    setFotos((fotosData || []) as Foto[]);
    setCargando(false);
  };

  useEffect(() => { if (ordenId > 0) void cargar(); }, [ordenId]);

  const posicion = useMemo(() => {
    const key = normalizar(orden?.estado);
    const aliases: Record<string,string> = { "PRESUPUESTO": "PRESUPUESTADO", "ESPERANDO REPUESTO": "ESPERANDO APROBACION", "REPARADO": "LISTO PARA ENTREGAR" };
    const finalKey = aliases[key] || key;
    return FLUJO.findIndex((p) => p.key === finalKey);
  }, [orden?.estado]);

  const cambiarEstado = async (db: string) => {
    if (!orden || guardando) return;
    setGuardando(true); setError(""); setMensaje("");
    const { error: e } = await supabase.from("ordenes_reparacion").update({ estado: db }).eq("id", orden.id);
    if (e) setError(e.message);
    else { setOrden({ ...orden, estado: db }); setMensaje(`Orden actualizada a ${db}.`); }
    setGuardando(false);
  };

  const siguiente = posicion >= 0 && posicion < FLUJO.length - 1 ? FLUJO[posicion + 1] : null;

  const avanzar = async () => {
    if (!siguiente || !orden) return;
    if (siguiente.key === "PRESUPUESTADO") {
      await cambiarEstado(siguiente.db);
      router.push(`/reparaciones/${orden.id}/repuestos`);
      return;
    }
    await cambiarEstado(siguiente.db);
  };

  const guardarNotas = async () => {
    if (!orden) return;
    setGuardando(true); setError("");
    let observaciones = diagnostico.trim() ? `Diagnóstico:\n${diagnostico.trim()}` : "";
    if (notas.trim()) observaciones += `${observaciones ? "\n\n" : ""}Notas técnicas:\n${notas.trim()}`;
    const { error: e } = await supabase.from("ordenes_reparacion").update({ observaciones }).eq("id", orden.id);
    if (e) setError(e.message); else { setOrden({ ...orden, observaciones }); setMensaje("Diagnóstico y notas guardados."); }
    setGuardando(false);
  };

  if (cargando) return <main className="min-h-screen bg-[#f5f6f8] flex items-center justify-center"><Loader2 className="animate-spin" size={32}/></main>;
  if (!orden) return <main className="min-h-screen bg-[#f5f6f8] p-8"><button onClick={() => router.push("/reparaciones")} className="inline-flex items-center gap-2"><ArrowLeft size={17}/> Volver</button><div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || "No se pudo cargar la reparación."}</div></main>;

  const esPresupuesto = normalizar(orden.estado) === "PRESUPUESTADO";
  const esAprobacion = normalizar(orden.estado) === "ESPERANDO APROBACION";
  const esAprobado = normalizar(orden.estado) === "APROBADO";

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
      <div className="mx-auto max-w-[1500px] p-5 md:p-8">
        <div className="mb-6 flex flex-wrap justify-between gap-3">
          <div className="flex gap-2">
            <button onClick={() => router.push("/reparaciones")} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"><ArrowLeft size={17}/> Volver</button>
            <button onClick={() => router.push("/")} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"><Home size={17}/> Inicio</button>
          </div>
          <span className="text-xs font-semibold text-gray-400">Orden #{orden.id}</span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6 md:p-8 flex flex-col gap-5 lg:flex-row lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">ORDEN #{orden.id}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClase(orden.estado)}`}>{FLUJO.find(p => p.key === normalizar(orden.estado))?.label || orden.estado}</span></div>
              <h1 className="mt-4 text-3xl font-bold">Gestión de reparación</h1>
              <p className="mt-2 text-sm text-gray-500">Diagnóstico, presupuesto, reparación y entrega.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => router.push(`/reparaciones/${orden.id}/checklist`)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"><ClipboardCheck size={17}/> Checklist</button>
              <button onClick={() => router.push(`/reparaciones/${orden.id}/fotos`)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"><ImageIcon size={17}/> Fotos</button>
              <button onClick={() => router.push(`/reparaciones/${orden.id}/repuestos`)} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"><Package size={17}/> Presupuesto</button>
            </div>
          </div>

          <div className="border-t bg-gray-50/70 p-6 md:p-8">
            <div className="overflow-x-auto"><div className="flex min-w-[950px] items-center">
              {FLUJO.map((p, i) => { const activo=i===posicion; const done=posicion>i; return <div key={p.key} className="flex flex-1 items-center"><button disabled={guardando} onClick={() => cambiarEstado(p.db)} className="group flex min-w-0 flex-col items-center"><div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${activo ? "border-black bg-black text-white" : done ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white text-gray-400"}`}>{done ? <Check size={16}/> : i+1}</div><span className={`mt-2 max-w-[115px] text-center text-[10px] font-bold uppercase ${activo ? "text-gray-950" : done ? "text-green-700" : "text-gray-400"}`}>{p.label}</span></button>{i<FLUJO.length-1 && <div className={`mx-2 h-[2px] flex-1 ${done ? "bg-green-400" : "bg-gray-200"}`}/>}</div>; })}
            </div></div>
            <div className="mt-5 flex flex-wrap gap-3">
              {siguiente && <button disabled={guardando} onClick={avanzar} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">{guardando?<Loader2 size={17} className="animate-spin"/>:<ArrowRight size={17}/>} {siguiente.key === "PRESUPUESTADO" ? "Abrir presupuesto" : esAprobacion ? "Marcar aprobado" : esAprobado ? "Iniciar reparación" : `Avanzar a ${siguiente.label}`}</button>}
              {(esPresupuesto || normalizar(orden.estado) === "DIAGNOSTICO") && <button onClick={() => router.push(`/reparaciones/${orden.id}/repuestos`)} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold"><Package size={17}/> Abrir presupuesto y repuestos</button>}
            </div>
          </div>
        </section>

        {mensaje && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{mensaje}</div>}
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400"><User size={16}/> Cliente</div><p className="mt-3 text-lg font-bold">{orden.cliente?.nombre || "Sin nombre"}</p><p className="text-sm text-gray-500">{orden.cliente?.telefono || "Sin teléfono"}</p></div>
                <div className="rounded-xl bg-gray-50 p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400"><Smartphone size={16}/> Equipo</div><p className="mt-3 text-lg font-bold">{[orden.equipo?.marca,orden.equipo?.modelo].filter(Boolean).join(" ") || "Sin equipo"}</p><div className="mt-2 space-y-1 text-xs text-gray-500"><p>IMEI: {orden.equipo?.imei || "-"}</p><p>Serie: {orden.equipo?.numero_serie || "-"}</p><p>Color: {orden.equipo?.color || "-"}</p><p>Capacidad: {orden.equipo?.capacidad || "-"}</p><p>Batería: {orden.equipo?.bateria_porcentaje != null ? `${orden.equipo.bateria_porcentaje}%` : "-"}</p></div></div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-red-50 p-3"><Wrench className="text-red-600" size={20}/></div><div><h2 className="text-lg font-bold">Falla reportada</h2><p className="text-xs text-gray-400">Problema informado por el cliente</p></div></div><div className="mt-5 rounded-xl bg-gray-50 p-5 text-sm leading-6 whitespace-pre-wrap">{orden.falla_reportada || "No se registró una falla reportada."}</div></section>

            <section className="rounded-2xl border bg-white shadow-sm"><div className="border-b p-6"><div className="flex items-center gap-3"><FileText className="text-purple-600" size={21}/><div><h2 className="text-lg font-bold">Diagnóstico y notas técnicas</h2><p className="text-xs text-gray-400">Información interna del técnico</p></div></div></div><div className="p-6"><label className="text-xs font-bold uppercase text-gray-400">Diagnóstico</label><textarea value={diagnostico} onChange={e=>setDiagnostico(e.target.value)} rows={5} className="mt-2 w-full rounded-xl border bg-gray-50 p-4 text-sm outline-none focus:bg-white" placeholder="Qué falla tiene el equipo y qué pruebas realizaste..."/><label className="mt-5 block text-xs font-bold uppercase text-gray-400">Notas técnicas</label><textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={5} className="mt-2 w-full rounded-xl border bg-gray-50 p-4 text-sm outline-none focus:bg-white" placeholder="Mediciones, observaciones, trabajo a realizar..."/><div className="mt-4 flex justify-end"><button disabled={guardando} onClick={guardarNotas} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"><Save size={17}/> Guardar diagnóstico</button></div></div></section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.14em] text-gray-400">Resumen</p><div className="mt-5 space-y-4 text-sm"><div className="flex justify-between border-b pb-4"><span className="text-gray-500">Estado</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClase(orden.estado)}`}>{FLUJO.find(p=>p.key===normalizar(orden.estado))?.label || orden.estado}</span></div><div className="flex justify-between border-b pb-4"><span className="text-gray-500">Ingreso</span><span className="font-semibold">{fecha(orden.created_at)}</span></div><div className="flex justify-between"><span className="text-gray-500">Fotos</span><span className="font-bold">{fotos.length}</span></div></div></section>
            <section className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.14em] text-gray-400">Acciones</p><div className="mt-4 space-y-2"><button onClick={()=>router.push(`/reparaciones/${orden.id}/checklist`)} className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold"><span className="flex items-center gap-2"><ClipboardCheck size={17}/> Checklist</span><ArrowRight size={16}/></button><button onClick={()=>router.push(`/reparaciones/${orden.id}/fotos`)} className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold"><span className="flex items-center gap-2"><ImageIcon size={17}/> Fotografías</span><ArrowRight size={16}/></button><button onClick={()=>router.push(`/reparaciones/${orden.id}/repuestos`)} className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold"><span className="flex items-center gap-2"><Package size={17}/> Presupuesto y repuestos</span><ArrowRight size={16}/></button></div></section>
            {fotos.length > 0 && <section className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex justify-between"><div><h2 className="font-bold">Fotografías</h2><p className="text-xs text-gray-400">Recepción del equipo</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">{fotos.length}</span></div><div className="mt-4 grid grid-cols-2 gap-3">{fotos.slice(0,6).map(f=><img key={f.id} src={f.url} alt={f.tipo} className="aspect-square w-full rounded-xl border object-cover"/>)}</div></section>}
          </div>
        </div>

        <div className="py-8 text-center text-[11px] font-semibold tracking-wide text-gray-400">BITFIX TALLER · Gestión de reparación</div>
      </div>
    </main>
  );
}
