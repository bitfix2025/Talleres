"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Search, Smartphone } from "lucide-react";
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
 const [productoId,setProductoId]=useState("");
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

 const filtrados=useMemo(()=>{const x=q.trim().toLowerCase();return productos.filter(p=>(!x||(p.nombre+" "+(p.marca||"")+" "+(p.modelo||"")+" "+(p.imei||"")+" "+(p.numero_serie||"")).toLowerCase().includes(x)))},[productos,q]);
 const producto=productos.find(p=>p.id===Number(productoId));
 const ganancia=producto ? Number(producto.precio)-Number(producto.costo) : 0;

 const vender=async(e:React.FormEvent)=>{
  e.preventDefault();setError("");setOk("");
  if(!producto){setError("Seleccioná un equipo disponible.");return}
  if(producto.stock_actual<1){setError("El equipo ya no tiene stock disponible.");return}
  setSaving(true);
  try{
   const {data:venta,error:ve}=await supabase.from("ventas").insert({
    taller_id:TALLER_ID,cliente_id:clienteId?Number(clienteId):null,subtotal:producto.precio,descuento:0,total:producto.precio,
    ganancia:ganancia,metodo_pago:metodoPago,estado:"COMPLETADA",observaciones:observaciones.trim()||null
   }).select("id").single();
   if(ve)throw new Error(ve.message);
   const {error:de}=await supabase.from("venta_detalles").insert({
    venta_id:venta.id,producto_id:producto.id,producto_nombre:producto.nombre,cantidad:1,
    costo_unitario:producto.costo,precio_unitario:producto.precio,subtotal:producto.precio,ganancia:ganancia
   });
   if(de)throw new Error(de.message);
   const {error:ee}=await supabase.from("ventas_equipos").insert({
    taller_id:TALLER_ID,venta_id:venta.id,producto_id:producto.id,cliente_id:clienteId?Number(clienteId):null,
    marca:producto.marca||"Apple",modelo:producto.modelo||producto.nombre,capacidad:null,color:null,
    imei:producto.imei,numero_serie:producto.numero_serie,salud_bateria:producto.salud_bateria,
    condicion:producto.condicion_equipo||"USADO",estado_fisico:producto.estado_fisico,
    garantia_dias:producto.garantia_dias||0,costo_usd:producto.costo,precio_usd:producto.precio,
    ganancia_usd:ganancia,observaciones:observaciones.trim()||null
   });
   if(ee)throw new Error(ee.message);
   const {error:se}=await supabase.from("productos").update({stock_actual:producto.stock_actual-1}).eq("id",producto.id).eq("taller_id",TALLER_ID);
   if(se)throw new Error(se.message);
   const {error:me}=await supabase.from("movimientos_stock").insert({
    taller_id:TALLER_ID,producto_id:producto.id,tipo:"SALIDA",cantidad:1,motivo:"Venta de equipo",
    referencia_tipo:"VENTA",referencia_id:venta.id,costo_unitario:producto.costo
   });
   if(me)console.warn("No se pudo registrar movimiento de stock:",me.message);
   setProductos(ps=>ps.map(p=>p.id===producto.id?{...p,stock_actual:p.stock_actual-1}:p).filter(p=>p.stock_actual>0));
   setProductoId("");setObservaciones("");setOk("Venta #"+venta.id+" registrada. El equipo salió del stock y la ganancia quedó registrada.");
  }catch(err){setError(err instanceof Error?err.message:"No se pudo registrar la venta.");}
  finally{setSaving(false)}
 };

 return <main className="min-h-screen bg-[#f5f8f6] p-4 md:p-7"><div className="mx-auto max-w-6xl">
  <button onClick={()=>router.push("/ventas")} className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft size={17}/> Ventas</button>
  <div className="mb-6 rounded-3xl bg-[#101815] p-6 text-white"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#18a66b]"><Smartphone size={22}/></div><div><p className="text-xs font-black uppercase tracking-[.18em] text-white/50">Ventas de equipos</p><h1 className="text-2xl font-black">Vender equipo</h1></div></div><p className="mt-3 text-sm text-white/60">Buscá un equipo que ya esté cargado en Inventario. Sus datos, costo y precio se completan automáticamente.</p></div>
  {error&&<div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
  {ok&&<div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle2 size={18}/>{ok}</div>}
  {loading?<div className="rounded-3xl bg-white p-8 text-center">Cargando equipos...</div>:<form onSubmit={vender} className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
   <section className="rounded-3xl border bg-white p-5 shadow-sm md:p-7">
    <h2 className="text-lg font-black">1. Buscar equipo disponible</h2>
    <div className="relative mt-4"><Search className="absolute left-3 top-3 text-gray-400" size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Modelo, IMEI o número de serie..." className="h-11 w-full rounded-xl border pl-10 pr-3"/></div>
    <div className="mt-3 grid gap-2">{filtrados.map(p=><button type="button" key={p.id} onClick={()=>setProductoId(String(p.id))} className={"rounded-2xl border p-4 text-left transition "+(productoId===String(p.id)?"border-[#18a66b] bg-[#e9f8f1]":"border-gray-200 bg-white hover:border-green-200")}><div className="flex items-center justify-between gap-3"><div><p className="font-black">{p.marca||""} {p.modelo||p.nombre}</p><p className="mt-1 text-xs text-gray-500">{p.nombre} · Stock {p.stock_actual}</p></div><p className="font-black text-[#148f5c]">{money(p.precio)}</p></div></button>)}</div>
    {producto&&<div className="mt-5 rounded-2xl border border-green-200 bg-[#f8fcfa] p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Ficha del equipo</p><h3 className="mt-1 text-xl font-black">{producto.marca||""} {producto.modelo||producto.nombre}</h3></div><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">Stock {producto.stock_actual}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Info label="IMEI" value={producto.imei}/><Info label="Número de serie" value={producto.numero_serie}/><Info label="Salud de batería" value={producto.salud_bateria!=null?producto.salud_bateria+"%":null}/><Info label="Condición" value={producto.condicion_equipo}/><Info label="Estado físico" value={producto.estado_fisico}/><Info label="Garantía" value={producto.garantia_dias!=null?producto.garantia_dias+" días":null}/><Info label="Descripción" value={producto.descripcion}/><Info label="Categoría" value={producto.categoria}/>
    </div></div>}
   </section>
   <aside className="h-fit rounded-3xl border bg-white p-5 shadow-sm md:p-7"><h2 className="text-lg font-black">2. Confirmar venta</h2>
    {producto?<><div className="mt-4 rounded-2xl bg-gray-50 p-4"><div className="flex justify-between text-sm"><span className="text-gray-500">Costo</span><b>{money(producto.costo)}</b></div><div className="mt-2 flex justify-between text-sm"><span className="text-gray-500">Precio de venta</span><b>{money(producto.precio)}</b></div><div className="mt-3 border-t pt-3 flex justify-between"><span className="font-bold">Ganancia</span><b className="text-xl text-[#148f5c]">{money(ganancia)}</b></div></div>
    <label className="mt-4 block text-sm font-bold">Cliente<select value={clienteId} onChange={e=>setClienteId(e.target.value)} className="mt-1 h-11 w-full rounded-xl border px-3 font-normal"><option value="">Consumidor final</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.telefono?" — "+c.telefono:""}</option>)}</select></label>
    <label className="mt-3 block text-sm font-bold">Forma de pago<select value={metodoPago} onChange={e=>setMetodoPago(e.target.value)} className="mt-1 h-11 w-full rounded-xl border px-3 font-normal"><option>EFECTIVO</option><option>TRANSFERENCIA</option><option>TARJETA</option><option>MERCADO PAGO</option></select></label>
    <label className="mt-3 block text-sm font-bold">Observaciones<textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"/></label>
    <button disabled={saving} className="mt-4 h-12 w-full rounded-xl bg-[#18a66b] text-sm font-black text-white disabled:opacity-60">{saving?"Registrando...":"Confirmar venta"}</button></>:<div className="mt-6 rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">Seleccioná un equipo para ver costo, precio y ganancia.</div>}
   </aside>
  </form>}
 </div></main>
}
function Info({label,value}:{label:string;value:string|number|null|undefined}){return <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 text-sm font-semibold">{value||"No cargado"}</p></div>}
