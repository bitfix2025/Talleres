"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronRight, FileText, RefreshCw, Search, Smartphone, UserRound, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Orden = { id:number; cliente_id:number|null; equipo_id:number|null; estado:string|null; created_at:string|null; presupuesto_mano_obra:number|null; cliente?:any; equipo?:any };
type Item = { orden_id:number; cantidad:number; precio_unitario:number; nombre_producto?:string|null };

const dinero=(n:number)=>n.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});
const estadoClase=(e:string|null)=>{const x=(e||"").toUpperCase(); if(x.includes("APROB"))return "bg-green-50 text-green-700"; if(x.includes("ESPERANDO"))return "bg-amber-50 text-amber-700"; if(x.includes("PRESUPUEST"))return "bg-blue-50 text-blue-700"; return "bg-gray-100 text-gray-600";};

export default function PresupuestosPage(){
 const router=useRouter(); const [ordenes,setOrdenes]=useState<Orden[]>([]); const [items,setItems]=useState<Item[]>([]); const [q,setQ]=useState(""); const [filtro,setFiltro]=useState("TODOS"); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const cargar=async()=>{setLoading(true);setError("");
  const [o,i]=await Promise.all([
   supabase.from("ordenes_reparacion").select("id,cliente_id,equipo_id,estado,created_at,presupuesto_mano_obra,clientes(nombre,telefono),equipos(marca,modelo,imei)").in("estado",["PRESUPUESTADO","ESPERANDO APROBACIÓN","APROBADO","RECHAZADO"]).order("created_at",{ascending:false}),
   supabase.from("presupuesto_reparacion_items").select("orden_id,cantidad,precio_unitario,nombre_producto")
  ]);
  if(o.error||i.error)setError(o.error?.message||i.error?.message||"No se pudieron cargar los presupuestos."); else {setOrdenes((o.data||[]) as any);setItems((i.data||[]) as any);}
  setLoading(false);
 };
 useEffect(()=>{cargar()},[]);
 const total=(id:number,mano:number|null)=>items.filter(i=>i.orden_id===id).reduce((s,i)=>s+Number(i.cantidad)*Number(i.precio_unitario),0)+Number(mano||0);
 const lista=useMemo(()=>ordenes.filter(o=>{const cliente=Array.isArray(o.cliente)?o.cliente[0]:o.cliente;const equipo=Array.isArray(o.equipo)?o.equipo[0]:o.equipo;const text=[o.id,cliente?.nombre,cliente?.telefono,equipo?.modelo,equipo?.imei].join(" ").toLowerCase();return(!q||text.includes(q.toLowerCase()))&&(filtro==="TODOS"||o.estado===filtro)}),[ordenes,q,filtro]);
 return <main className="min-h-screen bg-[#f7f8f7] px-4 py-5 md:px-7 md:py-7"><div className="mx-auto max-w-[1400px]">
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-green-700">Administración</p><h1 className="mt-1 text-3xl font-black">Presupuestos</h1><p className="mt-2 text-sm text-gray-500">Todos los presupuestos generados desde las reparaciones.</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>router.push("/presupuestos/nuevo")} className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white"><Plus size={16} className="mr-2 inline"/>Nuevo presupuesto</button><button onClick={()=>router.push("/")} className="rounded-xl border bg-white px-4 py-3 text-sm font-bold"><ArrowLeft size={16} className="mr-2 inline"/>Inicio</button><button onClick={cargar} className="rounded-xl border bg-white px-4 py-3 text-sm font-bold"><RefreshCw size={16} className="mr-2 inline"/>Actualizar</button></div></div>
  <div className="mt-6 grid gap-3 sm:grid-cols-3"><Stat t="Total" v={lista.length}/><Stat t="Esperando aprobación" v={ordenes.filter(o=>o.estado==="ESPERANDO APROBACIÓN").length}/><Stat t="Aprobados" v={ordenes.filter(o=>o.estado==="APROBADO").length}/></div>
  <div className="mt-5 rounded-2xl border bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar cliente, modelo, IMEI u orden..." className="h-11 w-full rounded-xl border bg-gray-50 pl-10 pr-3 text-sm"/></div><select value={filtro} onChange={e=>setFiltro(e.target.value)} className="h-11 rounded-xl border bg-gray-50 px-3 text-sm"><option value="TODOS">Todos los estados</option><option>PRESUPUESTADO</option><option>ESPERANDO APROBACIÓN</option><option>APROBADO</option><option>RECHAZADO</option></select></div></div>
  {error&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
  <section className="mt-5 rounded-2xl border bg-white shadow-sm">{loading?<div className="p-12 text-center text-sm text-gray-500">Cargando presupuestos...</div>:lista.length===0?<div className="p-14 text-center text-sm text-gray-500"><FileText className="mx-auto mb-3 text-gray-300" size={36}/>No hay presupuestos para mostrar.</div>:<div className="divide-y">{lista.map(o=>{const c=Array.isArray(o.cliente)?o.cliente[0]:o.cliente;const e=Array.isArray(o.equipo)?o.equipo[0]:o.equipo;return <button key={o.id} onClick={()=>router.push("/reparaciones/"+o.id+"/revision-presupuesto")} className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-green-50/30 md:flex-row md:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700"><FileText size={20}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><b>Orden #{String(o.id).padStart(4,"0")}</b><span className={"rounded-full px-2.5 py-1 text-[10px] font-bold "+estadoClase(o.estado)}>{o.estado}</span></div><p className="mt-1 text-sm text-gray-700"><UserRound size={14} className="mr-1 inline"/> {c?.nombre||"Sin cliente"} · <Smartphone size={14} className="mx-1 inline"/>{[e?.marca,e?.modelo].filter(Boolean).join(" ")||"Sin equipo"}</p><p className="mt-1 text-xs text-gray-400"><CalendarDays size={12} className="mr-1 inline"/>{o.created_at?new Date(o.created_at).toLocaleDateString("es-AR"):"-"}</p></div><div className="text-right"><p className="text-lg font-black">{dinero(total(o.id,o.presupuesto_mano_obra))}</p><p className="text-xs text-green-700">Ver presupuesto <ChevronRight size={14} className="inline"/></p></div></button>})}</div>}</section>
 </div></main>;
}
function Stat({t,v}:{t:string;v:number}){return <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-xs text-gray-500">{t}</p><p className="mt-2 text-2xl font-black">{v}</p></div>}
