"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Wallet, Landmark, CreditCard, TrendingUp, TrendingDown, Users, Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TALLER_ID=1;
const money=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0);
type Cliente={id:number;nombre:string;telefono:string|null};
type Movimiento={id:number;tipo:"INGRESO"|"EGRESO";medio:string;monto:number;concepto:string;created_at:string};
type Cuenta={id:number;cliente_id:number;tipo:"CARGO"|"PAGO";monto:number;concepto:string;medio:string|null;created_at:string;cliente?:{nombre:string}|{nombre:string}[]|null};

export default function FacturacionPage(){
 const router=useRouter();
 const [mov,setMov]=useState<Movimiento[]>([]);
 const [cuentas,setCuentas]=useState<Cuenta[]>([]);
 const [clientes,setClientes]=useState<Cliente[]>([]);
 const [ventas,setVentas]=useState<any[]>([]);
 const [ordenes,setOrdenes]=useState<any[]>([]);
 const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const [modal,setModal]=useState<"mov"|"cuenta"|null>(null);
 const [form,setForm]=useState({tipo:"INGRESO",medio:"EFECTIVO",monto:"",concepto:"",clienteId:""});
 const cargar=async()=>{
  setLoading(true);setError("");
  const [m,c,cl,v,o]=await Promise.all([
   supabase.from("movimientos_caja").select("*").eq("taller_id",TALLER_ID).order("created_at",{ascending:false}),
   supabase.from("cuentas_corrientes").select("id,cliente_id,tipo,monto,concepto,medio,created_at,cliente:clientes(nombre)").eq("taller_id",TALLER_ID).order("created_at",{ascending:false}),
   supabase.from("clientes").select("id,nombre,telefono").eq("taller_id",TALLER_ID).order("nombre"),
   supabase.from("ventas").select("id,total,ganancia,created_at,estado,metodo_pago").eq("taller_id",TALLER_ID).order("created_at",{ascending:false}),
   supabase.from("ordenes_reparacion").select("id,estado,created_at,presupuesto_mano_obra").eq("taller_id",TALLER_ID)
  ]);
  const e=m.error||c.error||cl.error||v.error||o.error;
  if(e)setError(e.message); else {setMov((m.data||[]) as Movimiento[]);setCuentas((c.data||[]) as Cuenta[]);setClientes((cl.data||[]) as Cliente[]);setVentas(v.data||[]);setOrdenes(o.data||[]);}
  setLoading(false);
 };
 useEffect(()=>{cargar()},[]);
 const caja=useMemo(()=>({ef:mov.filter(x=>x.medio==="EFECTIVO").reduce((s,x)=>s+(x.tipo==="INGRESO"?1:-1)*Number(x.monto),0), banco:mov.filter(x=>x.medio==="BANCO").reduce((s,x)=>s+(x.tipo==="INGRESO"?1:-1)*Number(x.monto),0), mp:mov.filter(x=>x.medio==="MERCADO_PAGO").reduce((s,x)=>s+(x.tipo==="INGRESO"?1:-1)*Number(x.monto),0)}),[mov]);
 const usdt=mov.filter(x=>x.medio==="USDT").reduce((s,x)=>s+(x.tipo==="INGRESO"?1:-1)*Number(x.monto),0); const disponible=caja.ef+caja.banco+caja.mp;
 const deudas=useMemo(()=>{const m=new Map<number,{nombre:string;debe:number}>();cuentas.forEach(x=>{const id=x.cliente_id;const nombre=Array.isArray(x.cliente)?(x.cliente[0]?.nombre||"Cliente"):(x.cliente?.nombre||"Cliente");const z=m.get(id)||{nombre,debe:0};z.debe+=x.tipo==="CARGO"?Number(x.monto):-Number(x.monto);m.set(id,z)});return [...m.entries()].map(([id,v])=>({id,...v})).filter(x=>x.debe>0.009).sort((a,b)=>b.debe-a.debe)},[cuentas]);
 const guardarMov=async()=>{const monto=Number(form.monto);if(!monto||!form.concepto.trim()){setError("Completá monto y concepto.");return}const {error:e}=await supabase.from("movimientos_caja").insert({taller_id:TALLER_ID,tipo:form.tipo,medio:form.medio,monto,concepto:form.concepto.trim(),cliente_id:form.clienteId?Number(form.clienteId):null});if(e){setError(e.message);return}setModal(null);setForm({tipo:"INGRESO",medio:"EFECTIVO",monto:"",concepto:"",clienteId:""});cargar()};
 const guardarCuenta=async()=>{const monto=Number(form.monto);if(!form.clienteId||!monto||!form.concepto.trim()){setError("Seleccioná cliente y completá monto y concepto.");return}const {error:e}=await supabase.from("cuentas_corrientes").insert({taller_id:TALLER_ID,cliente_id:Number(form.clienteId),tipo:form.tipo==="INGRESO"?"PAGO":"CARGO",monto,concepto:form.concepto.trim(),medio:form.tipo==="INGRESO"?form.medio:null});if(e){setError(e.message);return}if(form.tipo==="INGRESO"){const ce=await supabase.from("movimientos_caja").insert({taller_id:TALLER_ID,tipo:"INGRESO",medio:form.medio,monto,concepto:"Pago cuenta corriente: "+form.concepto.trim(),cliente_id:Number(form.clienteId)});if(ce.error){setError(ce.error.message);return}}setModal(null);setForm({tipo:"INGRESO",medio:"EFECTIVO",monto:"",concepto:"",clienteId:""});cargar()};
 if(loading)return <main className="min-h-screen bg-[#f5f8f6] p-8 text-sm font-semibold text-gray-500">Cargando control financiero...</main>;
 return <main className="min-h-screen bg-[#f5f8f6] p-3 text-[#17201b] md:p-5"><div className="mx-auto max-w-6xl">
  <header className="mb-4 rounded-2xl bg-[#123c2b] p-4 text-white shadow-xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-200">Control financiero</p><h1 className="mt-1 text-2xl font-black">Caja y facturación</h1><p className="mt-1 text-sm text-emerald-50/70">Efectivo, banco, movimientos y cuenta corriente en un solo lugar.</p></div><div className="flex gap-2"><button onClick={()=>router.push("/")} className="rounded-xl bg-white/10 px-4 py-2.5 font-bold"><ArrowLeft size={16} className="mr-2 inline"/>Volver</button><button onClick={cargar} className="rounded-xl bg-white px-4 py-2.5 font-bold text-[#123c2b]"><RefreshCw size={16} className="mr-2 inline"/>Actualizar</button></div></div></header>
  {error&&<div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
  <section className="mb-4 overflow-hidden rounded-xl border bg-white shadow-sm">
   <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-5 sm:divide-y-0">
    {[[Wallet,"Efectivo",caja.ef],[Landmark,"Banco",caja.banco],[CreditCard,"Mercado Pago",caja.mp],[Wallet,"USDT",usdt],[TrendingUp,"Disponible",disponible]].map(([Icon,label,value]:any)=>
      <div key={label} className="flex min-h-[68px] items-center gap-2.5 px-3 py-2.5">
       <Icon size={16} className="shrink-0 text-emerald-700"/>
       <div className="min-w-0"><p className="truncate text-[11px] font-bold text-gray-500">{label}</p><p className={`text-base font-black ${label==="Disponible"?"text-[#18a66b]":"text-gray-900"}`}>{money(value)}</p></div>
      </div>
    )}
   </div>
  </section>
  <div className="mt-5 flex flex-wrap gap-3"><button onClick={()=>{setForm({...form,tipo:"INGRESO"});setModal("mov")}} className="rounded-xl bg-[#18a66b] px-5 py-3 font-black text-white"><Plus size={17} className="mr-2 inline"/>Registrar ingreso</button><button onClick={()=>{setForm({...form,tipo:"EGRESO"});setModal("mov")}} className="rounded-xl border bg-white px-5 py-3 font-black text-gray-700"><TrendingDown size={17} className="mr-2 inline"/>Registrar egreso</button><button onClick={()=>{setForm({...form,tipo:"EGRESO"});setModal("cuenta")}} className="rounded-xl border bg-white px-5 py-3 font-black text-gray-700"><Users size={17} className="mr-2 inline"/>Cargar deuda</button><button onClick={()=>{setForm({...form,tipo:"INGRESO"});setModal("cuenta")}} className="rounded-xl border bg-white px-5 py-3 font-black text-gray-700"><Wallet size={17} className="mr-2 inline"/>Registrar pago</button></div>
  <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
   <section className="rounded-2xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-black">Cuenta corriente — quién debe</h2><p className="mt-1 text-xs text-gray-500">Saldo pendiente por cliente.</p></div><div className="divide-y">{deudas.length?deudas.slice(0,15).map(d=><div key={d.id} className="flex items-center justify-between p-5"><div><p className="font-bold">{d.nombre}</p><p className="text-xs text-gray-400">Saldo pendiente</p></div><b className="text-lg text-red-600">{money(d.debe)}</b></div>):<p className="py-12 text-center text-sm text-gray-400">No hay saldos pendientes.</p>}</div></section>
   <section className="rounded-2xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-black">Últimos movimientos</h2></div><div className="divide-y">{mov.slice(0,12).map(x=><div key={x.id} className="flex items-center justify-between p-4"><div><p className="text-sm font-bold">{x.concepto}</p><p className="text-xs text-gray-400">{x.medio} · {new Date(x.created_at).toLocaleDateString("es-AR")}</p></div><b className={x.tipo==="INGRESO"?"text-green-600":"text-red-600"}>{x.tipo==="INGRESO"?"+":"-"}{money(x.monto)}</b></div>)}{!mov.length&&<p className="py-12 text-center text-sm text-gray-400">Todavía no hay movimientos.</p>}</div></section>
  </div>
  <section className="mt-5 rounded-2xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-black">Ventas registradas</h2><p className="mt-1 text-xs text-gray-500">Acá aparecen también las ventas anteriores que ya estaban guardadas.</p></div><div className="divide-y">{ventas.length?ventas.slice(0,30).map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-bold">Venta #{v.id}</p><p className="text-xs text-gray-500">{v.metodo_pago||"Medio no informado"} · {v.estado||"Sin estado"} · {v.created_at?new Date(v.created_at).toLocaleDateString("es-AR"):""}</p></div><div className="text-right"><p className="text-lg font-black">{money(v.total)}</p>{v.ganancia!=null&&<p className="text-xs font-bold text-emerald-600">Ganancia {money(v.ganancia)}</p>}</div></div>):<p className="py-12 text-center text-sm text-gray-400">No hay ventas registradas.</p>}</div></section>
  <section className="mt-5 rounded-2xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-black">Resumen</h2></div><div className="grid gap-4 p-5 md:grid-cols-3"><div><p className="text-xs font-bold text-gray-400">Ventas registradas</p><p className="text-2xl font-black">{ventas.length}</p></div><div><p className="text-xs font-bold text-gray-400">Reparaciones entregadas</p><p className="text-2xl font-black">{ordenes.filter(o=>o.estado==="ENTREGADO").length}</p></div><div><p className="text-xs font-bold text-gray-400">Clientes con deuda</p><p className="text-2xl font-black">{deudas.length}</p></div></div></section>
  {modal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black">{modal==="mov"?(form.tipo==="INGRESO"?"Registrar ingreso":"Registrar egreso"):(form.tipo==="INGRESO"?"Registrar pago":"Cargar deuda")}</h2><button onClick={()=>setModal(null)} className="rounded-xl p-2 hover:bg-gray-100"><X size={20}/></button></div><div className="mt-5 grid gap-4">
   {modal==="cuenta"&&<select value={form.clienteId} onChange={e=>setForm({...form,clienteId:e.target.value})} className="h-12 rounded-xl border px-4"><option value="">Seleccionar cliente *</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.telefono?" — "+c.telefono:""}</option>)}</select>}
   <select value={form.medio} onChange={e=>setForm({...form,medio:e.target.value})} className="h-12 rounded-xl border px-4"><option>EFECTIVO</option><option>BANCO</option><option>MERCADO_PAGO</option><option>OTRO</option></select>
   <input type="number" min="0.01" step="0.01" value={form.monto} onChange={e=>setForm({...form,monto:e.target.value})} placeholder="Monto USD *" className="h-12 rounded-xl border px-4"/>
   <input value={form.concepto} onChange={e=>setForm({...form,concepto:e.target.value})} placeholder="Concepto *" className="h-12 rounded-xl border px-4"/>
  </div><div className="mt-6 flex justify-end gap-2"><button onClick={()=>setModal(null)} className="rounded-xl px-4 py-3 font-bold text-gray-500">Cancelar</button><button onClick={modal==="mov"?guardarMov:guardarCuenta} className="rounded-xl bg-[#18a66b] px-5 py-3 font-black text-white">Guardar</button></div></div></div>}
 </div></main>;
}