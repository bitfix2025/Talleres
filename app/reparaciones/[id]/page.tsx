"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ClipboardCheck, FileText, Home,
  ImageIcon, Loader2, Package, Plus, Save, Smartphone, Trash2, User, Wrench,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Cliente = { nombre: string | null; telefono: string | null };
type Equipo = { marca:string|null; modelo:string|null; imei:string|null; numero_serie:string|null; color:string|null; capacidad:string|null; bateria_porcentaje:number|null };
type Orden = { id:number; taller_id:number|null; cliente_id:number|null; equipo_id:number|null; estado:string|null; falla_reportada:string|null; observaciones:string|null; created_at:string|null; presupuesto_mano_obra:number|null; cliente:Cliente|null; equipo:Equipo|null };
type Foto = { id:number; tipo:string; url:string };
type Producto = { id:number; nombre:string; categoria:string|null; marca:string|null; modelo:string|null; sku:string|null; costo:number|null; precio:number|null; stock_actual:number; activo:boolean };
type Item = { id:number; producto_id:number; cantidad:number; precio_unitario:number; costo_unitario:number; producto:Producto|null };
type Paso = { db:string; key:string; label:string };

const FLUJO:Paso[] = [
  {db:"RECIBIDO",key:"RECIBIDO",label:"Recibido"},
  {db:"DIAGNÓSTICO",key:"DIAGNOSTICO",label:"Diagnóstico"},
  {db:"PRESUPUESTADO",key:"PRESUPUESTADO",label:"Presupuesto"},
  {db:"ESPERANDO APROBACIÓN",key:"ESPERANDO APROBACION",label:"Esperando aprobación"},
  {db:"APROBADO",key:"APROBADO",label:"Aprobado"},
  {db:"EN REPARACIÓN",key:"EN REPARACION",label:"En reparación"},
  {db:"LISTO PARA ENTREGAR",key:"LISTO PARA ENTREGAR",label:"Listo para entregar"},
  {db:"ENTREGADO",key:"ENTREGADO",label:"Entregado"},
];

const normalizar=(v:string|null|undefined)=>(v||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
const dinero=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0);
const estadoClase=(v:string|null|undefined)=>{switch(normalizar(v)){case"RECIBIDO":return"border-blue-200 bg-blue-50 text-blue-700";case"DIAGNOSTICO":return"border-purple-200 bg-purple-50 text-purple-700";case"PRESUPUESTADO":return"border-yellow-200 bg-yellow-50 text-yellow-700";case"ESPERANDO APROBACION":return"border-orange-200 bg-orange-50 text-orange-700";case"APROBADO":return"border-green-200 bg-green-50 text-green-700";case"EN REPARACION":return"border-indigo-200 bg-indigo-50 text-indigo-700";case"LISTO PARA ENTREGAR":return"border-emerald-200 bg-emerald-50 text-emerald-700";default:return"border-gray-200 bg-gray-100 text-gray-600";}};
const fecha=(v:string|null)=>v?new Date(v).toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"}):"-";

export default function ReparacionDetallePage(){
  const params=useParams(); const router=useRouter(); const ordenId=Number(params.id);
  const [orden,setOrden]=useState<Orden|null>(null),[fotos,setFotos]=useState<Foto[]>([]);
  const [diagnostico,setDiagnostico]=useState(""),[notas,setNotas]=useState("");
  const [productos,setProductos]=useState<Producto[]>([]),[items,setItems]=useState<Item[]>([]);
  const [productoId,setProductoId]=useState(""),[cantidad,setCantidad]=useState("1"),[precioVenta,setPrecioVenta]=useState(""),[busqueda,setBusqueda]=useState("");
  const [manoObra,setManoObra]=useState(""),[cargando,setCargando]=useState(true),[guardando,setGuardando]=useState(false),[error,setError]=useState(""),[mensaje,setMensaje]=useState("");
  const [seccionAbierta,setSeccionAbierta]=useState<string>("estado");

  const cargar=async()=>{
    setCargando(true);setError("");
    const {data,error:e}=await supabase.from("ordenes_reparacion").select(`id,taller_id,cliente_id,equipo_id,estado,falla_reportada,observaciones,created_at,presupuesto_mano_obra,clientes(nombre,telefono),equipos(marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje)`).eq("id",ordenId).maybeSingle();
    if(e||!data){setError(e?.message||"La orden no existe.");setOrden(null);setCargando(false);return;}
    const cliente=Array.isArray(data.clientes)?data.clientes[0]||null:data.clientes||null; const equipo=Array.isArray(data.equipos)?data.equipos[0]||null:data.equipos||null;
    setOrden({...data,cliente,equipo} as Orden);
    const obs=data.observaciones||""; const dm=obs.match(/Diagnóstico:\s*([\s\S]*?)(?:\n\nNotas técnicas:|$)/i);const nm=obs.match(/Notas técnicas:\s*([\s\S]*)$/i);setDiagnostico(dm?.[1]?.trim()||"");setNotas(nm?.[1]?.trim()||(dm?"":obs));setManoObra(data.presupuesto_mano_obra!=null?String(data.presupuesto_mano_obra):"");
    const {data:fd}=await supabase.from("fotos_recepcion").select("id,tipo,url").eq("orden_id",ordenId).order("id");setFotos((fd||[]) as Foto[]);
    const {data:pd,error:pe}=await supabase.from("productos").select("id,nombre,categoria,marca,modelo,sku,costo,precio,stock_actual,activo").eq("taller_id",data.taller_id||1).eq("activo",true).order("nombre");
    if(!pe)setProductos((pd||[]) as Producto[]);
    const {data:id,error:ie}=await supabase.from("presupuesto_reparacion_items").select("id,producto_id,cantidad,precio_unitario,costo_unitario").eq("orden_id",ordenId).order("id");
    if(!ie){const lista=(id||[]) as Omit<Item,"producto">[];setItems(lista.map(x=>({...x,producto:(pd||[]).find((p:any)=>p.id===x.producto_id)||null})));}else if(!ie.message.includes("does not exist")){setError(`No se pudieron cargar los repuestos: ${ie.message}`);}
    setCargando(false);
  };
  useEffect(()=>{if(ordenId>0)void cargar();},[ordenId]);

  const posicion=useMemo(()=>{const k=normalizar(orden?.estado);const a:Record<string,string>={PRESUPUESTO:"PRESUPUESTADO","ESPERANDO REPUESTO":"ESPERANDO APROBACION",REPARADO:"LISTO PARA ENTREGAR"};return FLUJO.findIndex(p=>p.key===(a[k]||k));},[orden?.estado]);
  const siguiente=posicion>=0&&posicion<FLUJO.length-1?FLUJO[posicion+1]:null;
  const esPresupuesto=normalizar(orden?.estado)==="PRESUPUESTADO";
  const disponibles=useMemo(()=>{const q=busqueda.toLowerCase().trim();return productos.filter(p=>p.stock_actual>0&&(!q||[p.nombre,p.marca,p.modelo,p.categoria,p.sku].filter(Boolean).some(v=>String(v).toLowerCase().includes(q))));},[productos,busqueda]);
  const seleccionado=productos.find(p=>p.id===Number(productoId));
  useEffect(()=>{if(seleccionado)setPrecioVenta(String(seleccionado.precio??0));},[seleccionado]);

  const cambiarEstado=async(db:string)=>{if(!orden||guardando)return;setGuardando(true);setError("");setMensaje("");const{error:e}=await supabase.from("ordenes_reparacion").update({estado:db}).eq("id",orden.id);if(e)setError(e.message);else{setOrden({...orden,estado:db});setMensaje(`Estado actualizado a ${db}.`);}setGuardando(false);};
  const avanzar=async()=>{if(!siguiente||!orden)return;await cambiarEstado(siguiente.db);};
  const guardarNotas=async()=>{if(!orden)return;setGuardando(true);setError("");let observaciones=diagnostico.trim()?`Diagnóstico:\n${diagnostico.trim()}`:"";if(notas.trim())observaciones+=`${observaciones?"\n\n":""}Notas técnicas:\n${notas.trim()}`;const{error:e}=await supabase.from("ordenes_reparacion").update({observaciones}).eq("id",orden.id);if(e)setError(e.message);else{setOrden({...orden,observaciones});setMensaje("Diagnóstico y notas guardados.");}setGuardando(false);};

  const agregarRepuesto=async()=>{
    setError("");setMensaje("");
    const p=productos.find(x=>x.id===Number(productoId));const q=Number(cantidad);const precio=Number(precioVenta);
    if(!p)return setError("Seleccioná un repuesto del inventario.");
    if(!Number.isInteger(q)||q<=0)return setError("La cantidad debe ser mayor a 0.");
    if(!Number.isFinite(precio)||precio<0)return setError("Ingresá un precio válido.");
    const existente=items.find(x=>x.producto_id===p.id);const nueva=(existente?.cantidad||0)+q;
    if(nueva>p.stock_actual)return setError(`Stock insuficiente. ${p.nombre}: ${p.stock_actual} disponible(s).`);
    setGuardando(true);
    let e;
    if(existente)e=(await supabase.from("presupuesto_reparacion_items").update({cantidad:nueva,precio_unitario:precio,nombre_producto:p.nombre}).eq("id",existente.id)).error;
    else e=(await supabase.from("presupuesto_reparacion_items").insert({orden_id:ordenId,producto_id:p.id,nombre_producto:p.nombre,cantidad:q,costo_unitario:Number(p.costo||0),precio_unitario:precio})).error;
    if(e)setError(`No se pudo guardar el repuesto: ${e.message}`);
    else{setMensaje(`${p.nombre} agregado al presupuesto.`);setProductoId("");setCantidad("1");setPrecioVenta("");setBusqueda("");await cargar();}
    setGuardando(false);
  };
  const eliminarRepuesto=async(id:number)=>{setGuardando(true);setError("");const{error:e}=await supabase.from("presupuesto_reparacion_items").delete().eq("id",id);if(e)setError(e.message);else setMensaje("Repuesto eliminado.");await cargar();setGuardando(false);};
  const guardarPresupuesto=async(enviar:boolean)=>{if(!orden)return;const mano=Math.max(0,Number(manoObra)||0);if(items.length===0&&mano<=0)return setError("Agregá al menos un repuesto o una mano de obra.");setGuardando(true);setError("");const{error:e}=await supabase.from("ordenes_reparacion").update({presupuesto_mano_obra:mano,estado:enviar?"ESPERANDO APROBACIÓN":"PRESUPUESTADO"}).eq("id",orden.id);if(e)setError(`No se pudo guardar el presupuesto: ${e.message}`);else{setOrden({...orden,presupuesto_mano_obra:mano,estado:enviar?"ESPERANDO APROBACIÓN":"PRESUPUESTADO"});setMensaje(enviar?"Presupuesto enviado a aprobación.":"Presupuesto guardado correctamente.");}setGuardando(false);};

  const totalRepuestos=items.reduce((s,i)=>s+Number(i.cantidad||0)*Number(i.precio_unitario||0),0),total=totalRepuestos+(Number(manoObra)||0);
  if(cargando)return <main className="min-h-screen bg-[#f5f6f8] flex items-center justify-center"><Loader2 size={32} className="animate-spin"/></main>;
  if(!orden)return <main className="min-h-screen bg-[#f5f6f8] p-8"><button onClick={()=>router.push("/reparaciones")} className="inline-flex items-center gap-2"><ArrowLeft size={17}/> Volver</button><div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error||"No se pudo cargar la reparación."}</div></main>;

  const posicion=useMemo(()=>{const k=normalizar(orden?.estado);const a:Record<string,string>={PRESUPUESTO:"PRESUPUESTADO","ESPERANDO REPUESTO":"ESPERANDO APROBACION",REPARADO:"LISTO PARA ENTREGAR"};return FLUJO.findIndex(p=>p.key===(a[k]||k));},[orden?.estado]);
  const etapa=FLUJO[posicion>=0?posicion:0];
  const siguiente=posicion>=0&&posicion<FLUJO.length-1?FLUJO[posicion+1]:null;
  const avanzar=async()=>{if(siguiente)await cambiarEstado(siguiente.db);};
  if(cargando)return <main className="min-h-screen bg-[#f5f6f8] flex items-center justify-center"><Loader2 size={32} className="animate-spin"/></main>;
  if(!orden)return <main className="min-h-screen bg-[#f5f6f8] p-8"><button onClick={()=>router.push("/reparaciones")} className="inline-flex items-center gap-2"><ArrowLeft size={17}/> Volver</button><div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error||"No se pudo cargar la reparación."}</div></main>;
  const estado=normalizar(orden.estado);
  const presupuestoActivo=estado==="PRESUPUESTADO"||estado==="ESPERANDO APROBACION";
  return <main className="min-h-screen bg-[#f5f6f8] text-gray-900"><div className="mx-auto max-w-6xl p-4 md:p-8">
    <div className="mb-5 flex items-center justify-between"><div className="flex gap-2"><button onClick={()=>router.push("/reparaciones")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"><ArrowLeft size={17}/> Volver</button><button onClick={()=>router.push("/")} className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"><Home size={17}/> Inicio</button></div><span className="text-xs font-bold text-gray-400">ORDEN #{orden.id}</span></div>
    <section className="rounded-3xl border border-gray-200 bg-white shadow-sm"><div className="p-5 md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClase(orden.estado)}`}>{etapa.label}</span>{siguiente&&<span className="text-xs text-gray-400">Siguiente: {siguiente.label}</span>}</div><h1 className="mt-3 text-2xl font-bold md:text-3xl">{[orden.equipo?.marca,orden.equipo?.modelo].filter(Boolean).join(" ")||"Reparación"} <span className="font-normal text-gray-400">· {orden.cliente?.nombre||"Cliente"}</span></h1><p className="mt-1 text-sm text-gray-500">{orden.falla_reportada||"Sin falla reportada"}</p></div><div className="flex gap-2"><button onClick={()=>router.push(`/reparaciones/${orden.id}/checklist`)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"><ClipboardCheck size={17}/> Checklist</button><button onClick={()=>router.push(`/reparaciones/${orden.id}/fotos`)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"><ImageIcon size={17}/> Fotos</button></div></div>
      <div className="mt-7 overflow-x-auto pb-1"><div className="flex min-w-[700px] items-center">{FLUJO.map((p,i)=>{const done=posicion>i,active=posicion===i;return <div key={p.key} className="flex flex-1 items-center"><button disabled={guardando} onClick={()=>cambiarEstado(p.db)} className="flex flex-col items-center"><span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold ${active?"border-black bg-black text-white":done?"border-green-500 bg-green-500 text-white":"border-gray-300 bg-white text-gray-400"}`}>{done?<Check size={14}/>:i+1}</span><span className={`mt-2 text-[9px] font-bold uppercase ${active?"text-gray-950":done?"text-green-700":"text-gray-400"}`}>{p.label}</span></button>{i<FLUJO.length-1&&<div className={`mx-1 h-[2px] flex-1 ${done?"bg-green-400":"bg-gray-200"}`}/>}</div>})}</div></div>
    </div></section>
    {mensaje&&<div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm font-semibold text-green-700">{mensaje}</div>}{error&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700">{error}</div>}
    <div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Cliente</p><p className="mt-2 font-bold">{orden.cliente?.nombre||"Sin nombre"}</p><p className="text-sm text-gray-500">{orden.cliente?.telefono||"Sin teléfono"}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Equipo</p><p className="mt-2 font-bold">{[orden.equipo?.marca,orden.equipo?.modelo].filter(Boolean).join(" ")||"Sin equipo"}</p><p className="text-sm text-gray-500">IMEI: {orden.equipo?.imei||"-"}</p></div><div className="rounded-2xl bg-gray-950 p-5 text-white"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total</p><p className="mt-2 text-2xl font-bold">{dinero(total)}</p><p className="text-xs text-gray-400">{items.length} repuesto(s)</p></div></div>
    <section className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"><div className="border-b p-5 md:p-7"><p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">TRABAJO ACTUAL</p><h2 className="mt-1 text-2xl font-bold">{etapa.label}</h2></div><div className="p-5 md:p-7">
      {estado==="RECIBIDO"&&<div><div className="rounded-2xl bg-gray-50 p-5"><p className="text-xs font-bold uppercase text-gray-400">Falla reportada</p><p className="mt-2 whitespace-pre-wrap text-sm">{orden.falla_reportada||"No registrada."}</p></div><button disabled={guardando} onClick={avanzar} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">Comenzar diagnóstico <ArrowRight size={17}/></button></div>}
      {estado==="DIAGNOSTICO"&&<div><label className="text-xs font-bold uppercase text-gray-400">Diagnóstico técnico</label><textarea value={diagnostico} onChange={e=>setDiagnostico(e.target.value)} rows={6} className="mt-2 w-full resize-none rounded-2xl border bg-gray-50 px-4 py-3 text-sm" placeholder="Qué encontraste, mediciones, componentes afectados..."/><label className="mt-5 block text-xs font-bold uppercase text-gray-400">Notas técnicas</label><textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-2xl border bg-gray-50 px-4 py-3 text-sm" placeholder="Trabajo recomendado, observaciones..."/><div className="mt-5 flex flex-wrap gap-3"><button disabled={guardando} onClick={guardarNotas} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold"><Save size={17}/> Guardar diagnóstico</button><button disabled={guardando} onClick={avanzar} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">Continuar a presupuesto <ArrowRight size={17}/></button></div></div>}
      {presupuestoActivo&&<div><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="text-lg font-bold">Presupuesto</h3><p className="text-sm text-gray-500">{items.length} repuesto(s) · Total {dinero(total)}</p></div><button onClick={()=>router.push(`/reparaciones/${orden.id}/repuestos`)} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">Gestionar presupuesto <ArrowRight size={16}/></button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Repuestos</p><p className="mt-1 font-bold">{dinero(totalRepuestos)}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">Mano de obra</p><p className="mt-1 font-bold">{dinero(Number(manoObra)||0)}</p></div><div className="rounded-xl bg-gray-950 p-4 text-white"><p className="text-xs text-gray-400">Total</p><p className="mt-1 font-bold">{dinero(total)}</p></div></div>{estado==="ESPERANDO APROBACION"&&<div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">El presupuesto está esperando la aprobación del cliente.</div>}</div>}
      {estado==="APROBADO"&&<div><div className="rounded-2xl border border-green-200 bg-green-50 p-5"><p className="font-bold text-green-800">Presupuesto aprobado</p><p className="mt-1 text-sm text-green-700">Listo para comenzar la reparación.</p></div><button disabled={guardando} onClick={avanzar} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">Comenzar reparación <ArrowRight size={17}/></button></div>}
      {estado==="EN REPARACION"&&<div><div className="rounded-2xl bg-gray-50 p-5"><p className="text-sm text-gray-500">Realizá el trabajo técnico y verificá el funcionamiento.</p><div className="mt-4 flex gap-3"><button onClick={()=>router.push(`/reparaciones/${orden.id}/checklist`)} className="rounded-xl border px-4 py-3 text-sm font-semibold"><ClipboardCheck size={16} className="inline mr-2"/>Checklist</button><button onClick={()=>router.push(`/reparaciones/${orden.id}/fotos`)} className="rounded-xl border px-4 py-3 text-sm font-semibold"><ImageIcon size={16} className="inline mr-2"/>Fotos</button></div></div><button disabled={guardando} onClick={avanzar} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">Marcar listo para entregar <ArrowRight size={17}/></button></div>}
      {estado==="LISTO PARA ENTREGAR"&&<div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-bold text-emerald-800">Reparación finalizada</p><p className="mt-1 text-sm text-emerald-700">El equipo está listo para entregar.</p><p className="mt-4 text-2xl font-bold text-emerald-900">{dinero(total)}</p></div><button disabled={guardando} onClick={avanzar} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"><Check size={17}/> Marcar como entregado</button></div>}
      {estado==="ENTREGADO"&&<div className="rounded-2xl bg-gray-50 p-6 text-center"><Check size={32} className="mx-auto"/><p className="mt-3 text-lg font-bold">Reparación entregada</p><p className="mt-1 text-sm text-gray-500">Orden finalizada.</p></div>}
    </div></section>
    <div className="mt-5 flex justify-between text-xs text-gray-400"><span>Gestión por etapas</span><span>BITFIX TALLER · #{orden.id}</span></div>
  </div></main>;
}
