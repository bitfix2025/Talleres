"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, TrendingUp, Wrench, ShoppingCart, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TALLER_ID = 1;

const money = (n:number) => new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0);
const day = (d:Date) => new Date(d.getFullYear(),d.getMonth(),d.getDate());
const sameDay = (a:string,d:Date) => day(new Date(a)).getTime()===day(d).getTime();

type Orden={id:number;estado:string|null;created_at:string;presupuesto_mano_obra:number|null};
type Item={orden_id:number;cantidad:number;precio_unitario:number;costo_unitario:number};
type Venta={id:number;total:number;ganancia:number;created_at:string;estado:string};

export default function FacturacionPage(){
 const router=useRouter();
 const [ordenes,setOrdenes]=useState<Orden[]>([]);
 const [items,setItems]=useState<Item[]>([]);
 const [ventas,setVentas]=useState<Venta[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const cargar=async()=>{
  setLoading(true);setError("");
  const [o,i,v]=await Promise.all([
   supabase.from("ordenes_reparacion").select("id,estado,created_at,presupuesto_mano_obra").eq("taller_id",TALLER_ID).order("created_at",{ascending:false}),
   supabase.from("presupuesto_reparacion_items").select("orden_id,cantidad,precio_unitario,costo_unitario").eq("taller_id",TALLER_ID),
   supabase.from("ventas").select("id,total,ganancia,created_at,estado").eq("taller_id",TALLER_ID).eq("estado","COMPLETADA").order("created_at",{ascending:false})
  ]);
  if(o.error||i.error||v.error) setError(o.error?.message||i.error?.message||v.error?.message||"No se pudieron cargar los datos.");
  else {setOrdenes((o.data||[]) as Orden[]);setItems((i.data||[]) as Item[]);setVentas((v.data||[]) as Venta[]);}
  setLoading(false);
 };
 useEffect(()=>{cargar()},[]);
 const reparacionesFacturadas=useMemo(()=>ordenes.filter(o=>o.estado==="ENTREGADO"),[ordenes]);
 const repTotal=(o:Orden)=>Number(o.presupuesto_mano_obra||0)+items.filter(i=>i.orden_id===o.id).reduce((s,i)=>s+Number(i.cantidad)*Number(i.precio_unitario),0);
 const repGanancia=(o:Orden)=>Number(o.presupuesto_mano_obra||0)+items.filter(i=>i.orden_id===o.id).reduce((s,i)=>s+Number(i.cantidad)*(Number(i.precio_unitario)-Number(i.costo_unitario)),0);
 const hoy=new Date();
 const repsHoy=reparacionesFacturadas.filter(o=>sameDay(o.created_at,hoy));
 const ventasHoy=ventas.filter(v=>sameDay(v.created_at,hoy));
 const factHoy=repsHoy.reduce((s,o)=>s+repTotal(o),0)+ventasHoy.reduce((s,v)=>s+Number(v.total),0);
 const ganHoy=repsHoy.reduce((s,o)=>s+repGanancia(o),0)+ventasHoy.reduce((s,v)=>s+Number(v.ganancia),0);
 const factMes=[...reparacionesFacturadas.filter(o=>{const d=new Date(o.created_at);return d.getMonth()===hoy.getMonth()&&d.getFullYear()===hoy.getFullYear()}),...[]].reduce((s,o)=>s+repTotal(o),0)+ventas.filter(v=>{const d=new Date(v.created_at);return d.getMonth()===hoy.getMonth()&&d.getFullYear()===hoy.getFullYear()}).reduce((s,v)=>s+Number(v.total),0);
 const ganMes=reparacionesFacturadas.filter(o=>{const d=new Date(o.created_at);return d.getMonth()===hoy.getMonth()&&d.getFullYear()===hoy.getFullYear()}).reduce((s,o)=>s+repGanancia(o),0)+ventas.filter(v=>{const d=new Date(v.created_at);return d.getMonth()===hoy.getMonth()&&d.getFullYear()===hoy.getFullYear()}).reduce((s,v)=>s+Number(v.ganancia),0);
 if(loading)return <main className="min-h-screen bg-[#f4f7f5] p-8 text-sm font-semibold text-gray-500">Cargando facturación...</main>;
 return <main className="min-h-screen bg-[#f4f7f5] p-4 text-[#17201b] md:p-8"><div className="mx-auto max-w-7xl">
  <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.2em] text-green-700">Administración</p><h1 className="text-3xl font-black">Facturación</h1><p className="mt-1 text-sm text-gray-500">Lo facturado y la ganancia real de reparaciones y ventas.</p></div><div className="flex gap-2"><button onClick={()=>router.push("/")} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold"><ArrowLeft size={16} className="mr-2 inline"/>Volver</button><button onClick={cargar} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold"><RefreshCw size={16} className="mr-2 inline"/>Actualizar</button></div></header>
  {error&&<div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
   {[[DollarSign,"Facturado hoy",factHoy],[TrendingUp,"Ganancia hoy",ganHoy],[DollarSign,"Facturado este mes",factMes],[TrendingUp,"Ganancia este mes",ganMes]].map(([Icon,label,value]:any)=><div className="rounded-2xl border bg-white p-5 shadow-sm" key={label}><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700"><Icon size={19}/></div><p className="text-sm font-semibold text-gray-500">{label}</p><p className="mt-1 text-2xl font-black">{money(value)}</p></div>)}
  </div>
  <div className="mt-6 grid gap-6 lg:grid-cols-2">
   <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-black"><Wrench size={19}/> Reparaciones facturadas</h2><p className="mt-1 text-sm text-gray-500">Se consideran facturadas al pasar a ENTREGADO.</p><div className="mt-4 space-y-2">{reparacionesFacturadas.slice(0,10).map(o=><div key={o.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3"><span className="text-sm font-bold">Orden #{o.id}</span><span className="text-sm font-black">{money(repTotal(o))}</span></div>)}{!reparacionesFacturadas.length&&<p className="py-8 text-center text-sm text-gray-400">Todavía no hay reparaciones entregadas.</p>}</div></section>
   <section className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-black"><ShoppingCart size={19}/> Ventas facturadas</h2><p className="mt-1 text-sm text-gray-500">Ventas con estado COMPLETADA.</p><div className="mt-4 space-y-2">{ventas.slice(0,10).map(v=><div key={v.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3"><span className="text-sm font-bold">Venta #{v.id}</span><div className="text-right"><div className="text-sm font-black">{money(v.total)}</div><div className="text-xs text-green-700">Ganancia {money(v.ganancia)}</div></div></div>)}{!ventas.length&&<p className="py-8 text-center text-sm text-gray-400">Todavía no hay ventas.</p>}</div></section>
  </div>
 </div></main>;
}