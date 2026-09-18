"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, TrendingUp, Wrench, ShoppingCart, DollarSign, CalendarDays, ReceiptText } from "lucide-react";
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
   supabase.from("presupuesto_reparacion_items").select("orden_id,cantidad,precio_unitario,costo_unitario"),
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
 return <main className="min-h-screen bg-[#f6f8f7] p-4 text-[#17201b] md:p-8">
  <div className="mx-auto max-w-7xl">
   <header className="mb-6 rounded-3xl bg-[#123c2b] p-6 text-white shadow-xl">
    <div className="flex flex-wrap items-center justify-between gap-5">
     <div><div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-200"><ReceiptText size={17}/> CONTROL FINANCIERO</div><h1 className="text-3xl font-black tracking-tight">Facturación</h1><p className="mt-1 max-w-xl text-sm text-emerald-50/75">Controlá ingresos y ganancias de reparaciones y ventas desde un solo lugar.</p></div>
     <div className="flex gap-2"><button onClick={()=>router.push("/")} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold backdrop-blur hover:bg-white/20"><ArrowLeft size={16} className="mr-2 inline"/>Volver</button><button onClick={cargar} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#123c2b] hover:bg-emerald-50"><RefreshCw size={16} className="mr-2 inline"/>Actualizar</button></div>
    </div>
   </header>
   {error&&<div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
   <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><span className="text-sm font-bold text-gray-500">Facturado hoy</span><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><DollarSign size={19}/></span></div><p className="text-3xl font-black">{money(factHoy)}</p><p className="mt-1 text-xs font-semibold text-gray-400">Ingresos del día</p></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><span className="text-sm font-bold text-gray-500">Ganancia hoy</span><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><TrendingUp size={19}/></span></div><p className="text-3xl font-black">{money(ganHoy)}</p><p className="mt-1 text-xs font-semibold text-gray-400">Resultado del día</p></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><span className="text-sm font-bold text-gray-500">Facturado este mes</span><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><CalendarDays size={19}/></span></div><p className="text-3xl font-black">{money(factMes)}</p><p className="mt-1 text-xs font-semibold text-gray-400">Acumulado mensual</p></div>
    <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><span className="text-sm font-bold text-gray-500">Ganancia este mes</span><span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><TrendingUp size={19}/></span></div><p className="text-3xl font-black">{money(ganMes)}</p><p className="mt-1 text-xs font-semibold text-gray-400">Resultado mensual</p></div>
   </div>
   <div className="grid gap-5 lg:grid-cols-2">
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="flex items-center gap-2 font-black"><Wrench size={18} className="text-emerald-600"/>Reparaciones facturadas</h2><p className="mt-1 text-xs text-gray-500">Órdenes que ya fueron entregadas.</p></div><div className="divide-y">{reparacionesFacturadas.slice(0,10).map(o=><div key={o.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"><div><p className="text-sm font-bold">Orden #{o.id}</p><p className="text-xs text-gray-400">Reparación entregada</p></div><span className="font-black">{money(repTotal(o))}</span></div>)}{!reparacionesFacturadas.length&&<p className="py-10 text-center text-sm text-gray-400">Todavía no hay reparaciones entregadas.</p>}</div></section>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-4"><h2 className="flex items-center gap-2 font-black"><ShoppingCart size={18} className="text-blue-600"/>Ventas facturadas</h2><p className="mt-1 text-xs text-gray-500">Ventas con estado completada.</p></div><div className="divide-y">{ventas.slice(0,10).map(v=><div key={v.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"><div><p className="text-sm font-bold">Venta #{v.id}</p><p className="text-xs text-emerald-600">Ganancia {money(v.ganancia)}</p></div><span className="font-black">{money(v.total)}</span></div>)}{!ventas.length&&<p className="py-10 text-center text-sm text-gray-400">Todavía no hay ventas.</p>}</div></section>
   </div>
  </div>
 </main>;
}