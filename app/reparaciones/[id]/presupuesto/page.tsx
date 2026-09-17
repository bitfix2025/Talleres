"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Home, Loader2, Package, Save, Smartphone, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const dinero=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0);

export default function PresupuestoReparacionPage(){
  const params=useParams(); const router=useRouter(); const ordenId=Number(String(params.id));
  const [manoObra,setManoObra]=useState("");
  const [cliente,setCliente]=useState("");
  const [equipo,setEquipo]=useState("");
  const [estado,setEstado]=useState("");
  const [cargando,setCargando]=useState(true);
  const [guardando,setGuardando]=useState(false);
  const [error,setError]=useState("");
  const [mensaje,setMensaje]=useState("");

  const cargar=async()=>{
    setCargando(true);setError("");
    const r=await supabase.from("ordenes_reparacion").select("estado,presupuesto_mano_obra,clientes(nombre),equipos(marca,modelo)").eq("id",ordenId).maybeSingle();
    if(r.error||!r.data){setError(r.error?.message||"No se encontró la reparación.");setCargando(false);return;}
    const c=Array.isArray(r.data.clientes)?r.data.clientes[0]:r.data.clientes;
    const e=Array.isArray(r.data.equipos)?r.data.equipos[0]:r.data.equipos;
    setCliente(c?.nombre||"Sin nombre");
    setEquipo([e?.marca,e?.modelo].filter(Boolean).join(" ")||"Sin equipo");
    setEstado(r.data.estado||"");
    setManoObra(r.data.presupuesto_mano_obra!=null?String(r.data.presupuesto_mano_obra):"");
    setCargando(false);
  };

  useEffect(()=>{if(ordenId>0)void cargar();else{setError("ID de reparación inválido.");setCargando(false);}},[ordenId]);

  const guardar=async(continuar:boolean)=>{
    const valor=Math.max(0,Number(manoObra)||0);
    setGuardando(true);setError("");setMensaje("");
    const r=await supabase.from("ordenes_reparacion").update({presupuesto_mano_obra:valor,...(continuar?{estado:"PRESUPUESTADO"}:{})}).eq("id",ordenId);
    if(r.error){setError(`No se pudo guardar el presupuesto: ${r.error.message}`);setGuardando(false);return;}
    if(continuar) router.push(`/reparaciones/${ordenId}/repuestos`);
    else setMensaje("Presupuesto guardado correctamente.");
    setGuardando(false);
  };

  if(cargando)return <main className="min-h-screen bg-[#f5f6f8] flex items-center justify-center"><Loader2 size={32} className="animate-spin"/></main>;

  return <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
    <div className="mx-auto max-w-5xl p-5 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={()=>router.push(`/reparaciones/${ordenId}`)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"><ArrowLeft size={17}/> Volver</button>
          <button onClick={()=>router.push("/")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"><Home size={17}/> Inicio</button>
        </div>
        <span className="text-xs font-semibold text-gray-400">Orden #{ordenId}</span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gray-950 p-7 text-white md:p-9">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gray-400">Etapa 1 · Presupuesto</p>
          <h1 className="mt-2 text-3xl font-bold">Preparar presupuesto</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">En esta pantalla cargá solamente la mano de obra. Los repuestos se agregan en la siguiente etapa.</p>
        </div>

        <div className="grid gap-4 border-b border-gray-100 bg-gray-50 p-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400"><User size={16}/> Cliente</div>
            <p className="mt-2 font-bold">{cliente}</p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400"><Smartphone size={16}/> Equipo</div>
            <p className="mt-2 font-bold">{equipo}</p>
          </div>
        </div>

        {error&&<div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {mensaje&&<div className="m-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle2 size={18}/>{mensaje}</div>}

        <div className="p-6 md:p-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-100 p-3"><Package size={21}/></div>
              <div><h2 className="text-xl font-bold">Mano de obra</h2><p className="text-sm text-gray-500">Importe correspondiente al trabajo técnico.</p></div>
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">Valor de mano de obra</label>
              <input type="number" min="0" step="0.01" value={manoObra} onChange={e=>setManoObra(e.target.value)} placeholder="0.00" className="h-14 w-full rounded-xl border border-gray-200 bg-white px-4 text-lg font-semibold outline-none focus:border-black"/>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-gray-50 p-5">
              <span className="text-sm font-semibold text-gray-500">Mano de obra</span>
              <span className="text-2xl font-bold">{dinero(Number(manoObra)||0)}</span>
            </div>
            <button disabled={guardando} onClick={()=>guardar(false)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-bold"><Save size={17}/> Guardar presupuesto</button>
            <button disabled={guardando} onClick={()=>guardar(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-sm font-bold text-white">{guardando?<Loader2 size={17} className="animate-spin"/>:<ArrowRight size={17}/>} Guardar y continuar a repuestos</button>
          </div>
        </div>
      </section>

      <div className="mt-5 text-center text-xs text-gray-400">Paso 1 de 3 · Presupuesto → Repuestos → Revisión</div>
    </div>
  </main>;
}
