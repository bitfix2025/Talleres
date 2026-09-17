"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Home, Loader2, Package, Pencil, Send, Smartphone, User, Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Item={id:number;producto_id:number;nombre_producto:string;cantidad:number;precio_unitario:number};
const dinero=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0);

export default function RevisionPresupuestoPage(){
  const params=useParams();const router=useRouter();const ordenId=Number(String(params.id));
  const [items,setItems]=useState<Item[]>([]),[manoObra,setManoObra]=useState(0),[cliente,setCliente]=useState(""),[equipo,setEquipo]=useState("");
  const [cargando,setCargando]=useState(true),[guardando,setGuardando]=useState(false),[error,setError]=useState(""),[mensaje,setMensaje]=useState("");

  const cargar=async()=>{
    setCargando(true);setError("");
    const o=await supabase.from("ordenes_reparacion").select("presupuesto_mano_obra,clientes(nombre),equipos(marca,modelo)").eq("id",ordenId).maybeSingle();
    if(o.error||!o.data){setError(o.error?.message||"No se encontró la reparación.");setCargando(false);return;}
    const cl=Array.isArray(o.data.clientes)?o.data.clientes[0]:o.data.clientes;
    const eq=Array.isArray(o.data.equipos)?o.data.equipos[0]:o.data.equipos;
    setCliente(cl?.nombre||"Sin nombre");setEquipo([eq?.marca,eq?.modelo].filter(Boolean).join(" ")||"Sin equipo");setManoObra(Number(o.data.presupuesto_mano_obra)||0);
    const i=await supabase.from("presupuesto_reparacion_items").select("id,producto_id,nombre_producto,cantidad,precio_unitario").eq("orden_id",ordenId).order("id");
    if(i.error)setError(i.error.message);else setItems((i.data||[]) as Item[]);
    setCargando(false);
  };
  useEffect(()=>{if(ordenId>0)void cargar();},[ordenId]);

  const enviar=async()=>{
    setGuardando(true);setError("");setMensaje("");
    if(items.length===0&&manoObra<=0){setError("El presupuesto debe tener al menos un repuesto o mano de obra.");setGuardando(false);return;}
    const r=await supabase.from("ordenes_reparacion").update({estado:"ESPERANDO APROBACIÓN",presupuesto_mano_obra:manoObra}).eq("id",ordenId);
    if(r.error)setError(`No se pudo enviar el presupuesto: ${r.error.message}`);
    else setMensaje("Presupuesto enviado a aprobación.");
    setGuardando(false);
  };

  const totalRepuestos=items.reduce((s,i)=>s+Number(i.cantidad||0)*Number(i.precio_unitario||0),0);
  const total=totalRepuestos+manoObra;

  if(cargando)return <main className="min-h-screen bg-[#f5f6f8] flex items-center justify-center"><Loader2 size={32} className="animate-spin"/></main>;

  return <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
    <div className="mx-auto max-w-5xl p-5 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={()=>router.push(`/reparaciones/${ordenId}/repuestos`)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"><ArrowLeft size={17}/> Repuestos</button>
          <button onClick={()=>router.push("/")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"><Home size={17}/> Inicio</button>
        </div>
        <span className="text-xs font-semibold text-gray-400">Orden #{ordenId}</span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gray-950 p-7 text-white md:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gray-400">Etapa 3 · Revisión</p>
          <h1 className="mt-2 text-3xl font-bold">Revisar presupuesto</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">Acá se muestra el presupuesto completo antes de enviarlo al cliente para su aprobación.</p>
        </div>

        <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400"><User size={16}/> Cliente</div><p className="mt-2 font-bold">{cliente}</p></div>
          <div className="rounded-xl bg-white p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400"><Smartphone size={16}/> Equipo</div><p className="mt-2 font-bold">{equipo}</p></div>
        </div>

        {error&&<div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {mensaje&&<div className="m-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle2 size={18}/>{mensaje}</div>}

        <div className="p-6 md:p-8">
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="border-b border-gray-100 bg-gray-50 p-5"><h2 className="font-bold">Detalle del presupuesto</h2></div>
            <div className="divide-y divide-gray-100">
              {items.map(i=><div key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-bold">{i.nombre_producto}</p><p className="text-xs text-gray-500">{i.cantidad} × {dinero(i.precio_unitario)}</p></div><p className="font-bold">{dinero(Number(i.cantidad)*Number(i.precio_unitario))}</p></div>)}
              <div className="flex items-center justify-between p-5"><div className="flex items-center gap-2"><Wrench size={17}/><span className="font-bold">Mano de obra</span></div><span className="font-bold">{dinero(manoObra)}</span></div>
              {items.length===0&&<div className="p-5 text-sm text-gray-500">No hay repuestos agregados.</div>}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-950 p-6 text-white">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.15em] text-gray-400">Total</p><p className="mt-2 text-4xl font-bold">{dinero(total)}</p></div>
              <Package size={34} className="text-gray-500"/>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <div className="flex gap-3">
              <button onClick={()=>router.push(`/reparaciones/${ordenId}/presupuesto`)} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold"><Pencil size={17}/> Editar presupuesto</button>
              <button onClick={()=>router.push(`/reparaciones/${ordenId}/repuestos`)} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold"><Pencil size={17}/> Editar repuestos</button>
            </div>
            <button disabled={guardando} onClick={enviar} className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-bold text-white">{guardando?<Loader2 size={17} className="animate-spin"/>:<Send size={17}/>} Enviar a aprobación <ArrowRight size={17}/></button>
          </div>
        </div>
      </section>

      <div className="mt-5 text-center text-xs text-gray-400">Paso 3 de 3 · Presupuesto → Repuestos → Revisión</div>
    </div>
  </main>;
}
