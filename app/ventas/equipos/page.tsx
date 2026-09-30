"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Search, Smartphone, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TALLER_ID = 1;
const money = (n:number) => new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0);

type Producto = {
 id:number; nombre:string; categoria:string|null; marca:string|null; modelo:string|null;
 descripcion:string|null; costo:number; precio:number; stock_actual:number; activo:boolean;
 imei:string|null; numero_serie:string|null; salud_bateria:number|null;
 condicion_equipo:string|null; estado_fisico:string|null; garantia_dias:number|null;
};
type Cliente={id:number;nombre:string;telefono:string|null};

export default function VentasEquiposPage(){
 const router=useRouter();
 const [productos,setProductos]=useState<Producto[]>([]);
 const [clientes,setClientes]=useState<Cliente[]>([]);
 const [q,setQ]=useState("");
 const [seleccionados,setSeleccionados]=useState<number[]>([]);
 const [clienteId,setClienteId]=useState("");
 const [metodoPago,setMetodoPago]=useState("EFECTIVO");
 const [observaciones,setObservaciones]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [ok,setOk]=useState("");

 useEffect(()=>{(async()=>{
  const [p,c]=await Promise.all([
   supabase.from("productos").select("id,nombre,categoria,marca,modelo,descripcion,costo,precio,stock_actual,activo,imei,numero_serie,salud_bateria,condicion_equipo,estado_fisico,garantia_dias").eq("taller_id",TALLER_ID).eq("activo",true).eq("categoria","Equipos").gt("stock_actual",0).order("nombre"),
   supabase.from("clientes").select("id,nombre,telefono").eq("taller_id",TALLER_ID).order("nombre")
  ]);
  if(p.error||c.error)setError(p.error?.message||c.error?.message||"No se pudieron cargar los datos.");
  setProductos((p.data||[]) as Producto[]); setClientes((c.data||[]) as Cliente[]); setLoading(false);
 })()},[]);

 const filtrados=useMemo(()=>{const x=q.trim().toLowerCase();return productos.filter(p=>!x||(p.nombre+" "+(p.marca||"")+" "+(p.modelo||"")+" "+(p.imei||"")+" "+(p.numero_serie||"")).toLowerCase().includes(x))},[productos,q]);
 const carrito=productos.filter(p=>seleccionados.includes(p.id));
 const total=carrito.reduce((s,p)=>s+Number(p.precio||0),0);
 const costoTotal=carrito.reduce((s,p)=>s+Number(p.costo||0),0);
 const ganancia=total-costoTotal;

 const toggle=(id:number)=>setSeleccionados(xs=>xs.includes(id)?xs.filter(x=>x!==id):[...xs,id]);
 const quitar=(id:number)=>setSeleccionados(xs=>xs.filter(x=>x!==id));

 const vender=async(e:React.FormEvent)=>{
  e.preventDefault();setError("");setOk("");
  if(!carrito.length){setError("Seleccioná al menos un equipo.");return}
  setSaving(true);
  try{
   const {data:venta,error:ve}=await supabase.from("ventas").insert({
    taller_id:TALLER_ID,cliente_id:clienteId?Number(clienteId):null,subtotal:total,descuento:0,total,
    ganancia,metodo_pago:metodoPago,estado:"COMPLETADA",observaciones:observaciones.trim()||null
   }).select("id").single();
   if(ve)throw new Error(ve.message);
   const detalles=carrito.map(p=>({venta_id:venta.id,producto_id:p.id,producto_nombre:p.nombre,cantidad:1,costo_unitario:p.costo,precio_unitario:p.precio,subtotal:p.precio,ganancia:Number(p.precio)-Number(p.costo)}));
   const {error:de}=await supabase.from("venta_detalles").insert(detalles);
   if(de)throw new Error(de.message);
   const equipos=carrito.map(p=>({taller_id:TALLER_ID,venta_id:venta.id,producto_id:p.id,cliente_id:clienteId?Number(clienteId):null,marca:p.marca||"Apple",modelo:p.modelo||p.nombre,capacidad:null,color:null,imei:p.imei,numero_serie:p.numero_serie,salud_bateria:p.salud_bateria,condicion:p.condicion_equipo||"USADO",estado_fisico:p.estado_fisico,garantia_dias:p.garantia_dias||0,costo_usd:p.costo,precio_usd:p.precio,ganancia_usd:Number(p.precio)-Number(p.costo),observaciones:observaciones.trim()||null}));
   const {error:ee}=await supabase.from("ventas_equipos").insert(equipos);
   if(ee)throw new Error(ee.message);

   const {error:cajaError}=await supabase.from("movimientos_caja").insert({taller_id:TALLER_ID,tipo:"INGRESO",medio:metodoPago==="TRANSFERENCIA"?"BANCO":metodoPago==="MERCADO PAGO"?"MERCADO_PAGO":metodoPago==="TARJETA"?"OTRO":"EFECTIVO",monto:total,concepto:"Venta de equipos #"+venta.id,cliente_id:clienteId?Number(clienteId):null,venta_id:venta.id});
   if(cajaError)throw new Error("La venta se guardó, pero no se pudo registrar en caja: "+cajaError.message);
   for(const p of carrito){
    const {error:se}=await supabase.from("productos").update({stock_actual:p.stock_actual-1}).eq("id",p.id).eq("taller_id",TALLER_ID);
    if(se)throw new Error(se.message);
    const {error:me}=await supabase.from("movimientos_stock").insert({taller_id:TALLER_ID,producto_id:p.id,tipo:"SALIDA",cantidad:1,motivo:"Venta de equipo",referencia_tipo:"VENTA",referencia_id:venta.id,costo_unitario:p.costo});
    if(me)console.warn("No se pudo registrar movimiento de stock:",me.message);
   }
   setProductos(ps=>ps.map(p=>seleccionados.includes(p.id)?{...p,stock_actual:p.stock_actual-1}:p).filter(p=>p.stock_actual>0));
   setSeleccionados([]);setObservaciones("");
   setOk("Venta #"+venta.id+" registrada. Se vendieron "+carrito.length+" equipo"+(carrito.length===1?"":"s")+" y se actualizó el stock.");
  }catch(err){setError(err instanceof Error?err.message:"No se pudo registrar la venta.");}
  finally{setSaving(false)}
 };

 return <main className="min-h-screen bg-[#f5f8f6] p-4 md:p-7"><div className="mx-auto max-w-6xl">
  <button onClick={()=>router.push("/ventas")} className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft size={17}/> Ventas</button>
  <div className="mb-6 rounded-3xl bg-[#101815] p-6 text-white"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#18a66b]"><Smartphone size={22}/></div><div><p className="text-xs font-black uppercase tracking-[.18em] text-white/50">Ventas de equipos</p><h1 className="text-2xl font-black">Vender equipos</h1></div></div><p className="mt-3 text-sm text-white/60">Podés seleccionar uno o varios equipos del inventario. El costo, precio y ganancia salen automáticamente de cada equipo.</p></div>
  {error&&<div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
  {ok&&<div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle2 size={18}/>{ok}</div>}
  {loading?<div className="rounded-3xl bg-white p-8 text-center">Cargando equipos...</div>:<form onSubmit={vender} className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
   <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-7">
    <div className="flex items-center justify-between"><h2 className="text-lg font-black">1. Seleccionar equipos</h2><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">{carrito.length} seleccionados</span></div>
    <div className="relative mt-4"><Search className="absolute left-3 top-3 text-gray-400" size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Modelo, IMEI o número de serie..." className="h-11 w-full rounded-xl border pl-10 pr-3"/></div>
    <div className="mt-3 grid gap-2">{filtrados.map(p=><button type="button" key={p.id} onClick={()=>toggle(p.id)} className={"rounded-2xl border p-4 text-left transition "+(seleccionados.includes(p.id)?"border-[#18a66b] bg-[#e9f8f1]":"border-gray-200 bg-white hover:border-green-200")}><div className="flex items-center gap-3"><span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-black "+(seleccionados.includes(p.id)?"border-[#18a66b] bg-[#18a66b] text-white":"border-gray-300")}>{seleccionados.includes(p.id)?"✓":""}</span><div className="min-w-0 flex-1"><p className="font-black">{p.marca||"Apple"} {p.modelo||p.nombre}</p><p className="mt-1 text-xs text-gray-500">{p.nombre} · IMEI {p.imei||"—"} · Stock {p.stock_actual}</p></div><p className="font-black text-[#148f5c]">{money(p.precio)}</p></div></button>)}</div>
    {carrito.length>0&&<div className="mt-5 rounded-2xl border border-green-200 bg-[#f8fcfa] p-4"><p className="text-xs font-black uppercase tracking-wider text-gray-400">Equipos seleccionados</p>{carrito.map(p=><div key={p.id} className="mt-3 flex items-center justify-between gap-3 border-b border-green-100 pb-3 last:border-0 last:pb-0"><div><p className="font-bold">{p.marca||"Apple"} {p.modelo||p.nombre}</p><p className="text-xs text-gray-500">IMEI: {p.imei||"—"} · {p.descripcion||"Sin capacidad"}</p></div><button type="button" onClick={()=>quitar(p.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div>)}</div>}
   </section>
   <aside className="h-fit rounded-3xl border bg-white p-5 shadow-sm md:p-7"><h2 className="text-lg font-black">2. Confirmar venta</h2>
    {carrito.length?<><div className="mt-4 rounded-2xl bg-gray-50 p-4"><div className="flex justify-between text-sm"><span className="text-gray-500">Equipos</span><b>{carrito.length}</b></div><div className="mt-2 flex justify-between text-sm"><span className="text-gray-500">Costo total</span><b>{money(costoTotal)}</b></div><div className="mt-2 flex justify-between text-sm"><span className="text-gray-500">Venta total</span><b>{money(total)}</b></div><div className="mt-3 border-t pt-3 flex justify-between"><span className="font-bold">Ganancia total</span><b className="text-xl text-[#148f5c]">{money(ganancia)}</b></div></div>
    <label className="mt-4 block text-sm font-bold">Cliente<select value={clienteId} onChange={e=>setClienteId(e.target.value)} className="mt-1 h-11 w-full rounded-xl border px-3 font-normal"><option value="">Consumidor final</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.telefono?" — "+c.telefono:""}</option>)}</select></label>
    <label className="mt-3 block text-sm font-bold">Forma de pago<select value={metodoPago} onChange={e=>setMetodoPago(e.target.value)} className="mt-1 h-11 w-full rounded-xl border px-3 font-normal"><option>EFECTIVO</option><option>TRANSFERENCIA</option><option>TARJETA</option><option>MERCADO PAGO</option></select></label>
    <label className="mt-3 block text-sm font-bold">Observaciones<textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"/></label>
    <button disabled={saving} className="mt-4 h-12 w-full rounded-xl bg-[#18a66b] text-sm font-black text-white disabled:opacity-60">{saving?"Registrando...":"Confirmar venta"}</button></>:<div className="mt-6 rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">Seleccioná uno o varios equipos para ver costo, precio y ganancia.</div>}
   </aside>
  </form>}
 </div></main>
}