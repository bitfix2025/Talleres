// Vercel sync: código corregido en main
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, ClipboardCheck, FileText, Home, Printer, CreditCard,
  ImageIcon, Loader2, Package, Plus, Save, Smartphone, Trash2, User, Wrench,
  ChevronUp, ChevronDown
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Cliente = { nombre: string | null; dni: string | null; telefono: string | null };
type Equipo = { marca:string|null; modelo:string|null; imei:string|null; numero_serie:string|null; color:string|null; capacidad:string|null; bateria_porcentaje:number|null };
type Orden = { contrasena_equipo?: string | null; id:number; tecnico_id?:string|null; taller_id:number|null; cliente_id:number|null; equipo_id:number|null; estado:string|null; falla_reportada:string|null; observaciones:string|null; created_at:string|null; presupuesto_mano_obra:number|null; cliente:Cliente|null; equipo:Equipo|null };
type Foto = { id:number; tipo:string; url:string };
type Tecnico = { id:string; nombre:string|null; email:string|null; rol:string|null; activo:boolean };
type Producto = { id:number; nombre:string; categoria:string|null; marca:string|null; modelo:string|null; sku:string|null; costo:number|null; precio:number|null; stock_actual:number; activo:boolean };
type Item = { id:number; producto_id:number; cantidad:number; precio_unitario:number; costo_unitario:number; producto:Producto|null };
type Pago = { id:number; monto:number; metodo_pago:string; observaciones:string|null; created_at:string };
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
  const [tecnicos,setTecnicos]=useState<Tecnico[]>([]),[tecnicoId,setTecnicoId]=useState("");
  const [contrasenaEquipo,setContrasenaEquipo]=useState("");
  const [productos,setProductos]=useState<Producto[]>([]),[items,setItems]=useState<Item[]>([]);
   const [pagos,setPagos]=useState<Pago[]>([]),[montoPago,setMontoPago]=useState(""),[metodoPago,setMetodoPago]=useState("EFECTIVO"),[notasPago,setNotasPago]=useState("");
  const [productoId,setProductoId]=useState(""),[cantidad,setCantidad]=useState("1"),[precioVenta,setPrecioVenta]=useState(""),[busqueda,setBusqueda]=useState("");
  const [manoObra,setManoObra]=useState(""),[seccion,setSeccion]=useState<"diagnostico"|"presupuesto"|"reparacion">("diagnostico"),[cargando,setCargando]=useState(true),[guardando,setGuardando]=useState(false),[error,setError]=useState(""),[mensaje,setMensaje]=useState("");

  const cargar=async()=>{
    setCargando(true);setError("");
    const {data,error:e}=await supabase.from("ordenes_reparacion").select(`id,tecnico_id,taller_id,cliente_id,equipo_id,estado,falla_reportada,observaciones,created_at,presupuesto_mano_obra,contrasena_equipo,clientes(nombre,dni,telefono),equipos(marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje)`).eq("id",ordenId).maybeSingle();
    if(e||!data){setError(e?.message||"La orden no existe.");setOrden(null);setCargando(false);return;}
    const cliente=Array.isArray(data.clientes)?data.clientes[0]||null:data.clientes||null; const equipo=Array.isArray(data.equipos)?data.equipos[0]||null:data.equipos||null;
    setOrden({...data,cliente,equipo} as Orden);
     const obs=data.observaciones||"";
     const marcador="Notas técnicas:";
     const posNotas=obs.indexOf(marcador);
     const textoDiagnostico=obs.startsWith("Diagnóstico:") ? obs.slice("Diagnóstico:".length, posNotas>=0 ? posNotas : obs.length).trim() : "";
     const textoNotas=posNotas>=0 ? obs.slice(posNotas+marcador.length).trim() : (textoDiagnostico ? "" : obs);
     setDiagnostico(textoDiagnostico);
     setNotas(textoNotas);
     setManoObra(data.presupuesto_mano_obra!=null?String(data.presupuesto_mano_obra):""); setContrasenaEquipo(data.contrasena_equipo||"");
    const {data:td,error:te}=await supabase.from("perfiles").select("id,nombre,rol,activo").eq("activo",true).in("rol",["TECNICO","tecnico"]);
     if(te) setError(`No se pudieron cargar los técnicos: ${te.message}`);
     setTecnicos((td||[]) as Tecnico[]);
    setTecnicoId((data as any).tecnico_id||"");
    const {data:fd}=await supabase.from("fotos_recepcion").select("id,tipo,url").eq("orden_id",ordenId).order("id");setFotos((fd||[]) as Foto[]);
    const {data:pd,error:pe}=await supabase.from("productos").select("id,nombre,categoria,marca,modelo,sku,costo,precio,stock_actual,activo").eq("taller_id",data.taller_id||1).eq("activo",true).order("nombre");
    if(!pe)setProductos((pd||[]) as Producto[]);
    const {data:pg,error:pge}=await supabase.from("pagos_reparacion").select("id,monto,metodo_pago,observaciones,created_at").eq("orden_id",ordenId).order("created_at",{ascending:false});
    if(!pge)setPagos((pg||[]) as Pago[]);
    const {data:id,error:ie}=await supabase.from("presupuesto_reparacion_items").select("id,producto_id,cantidad,precio_unitario,costo_unitario").eq("orden_id",ordenId).order("id");
    if(!ie){const lista=(id||[]) as Omit<Item,"producto">[];setItems(lista.map(x=>({...x,producto:(pd||[]).find((p:any)=>p.id===x.producto_id)||null})));}else if(!ie.message.includes("does not exist")){setError(`No se pudieron cargar los repuestos: ${ie.message}`);}
    setCargando(false);
  };
  useEffect(()=>{if(ordenId>0)void cargar();},[ordenId]);

  const posicion=useMemo(()=>{const k=normalizar(orden?.estado);const a:Record<string,string>={PRESUPUESTO:"PRESUPUESTADO","ESPERANDO REPUESTO":"ESPERANDO APROBACION",REPARADO:"LISTO PARA ENTREGAR"};return FLUJO.findIndex(p=>p.key===(a[k]||k));},[orden?.estado]);
  const siguiente=posicion>=0&&posicion<FLUJO.length-1?FLUJO[posicion+1]:null;
  const estadoActual=normalizar(orden?.estado);
  const puedeAprobar=estadoActual==="ESPERANDO APROBACION";
  const puedeRechazar=estadoActual==="ESPERANDO APROBACION";
  const puedeConsumir=estadoActual==="APROBADO";
  const esPresupuesto=normalizar(orden?.estado)==="PRESUPUESTADO";
  const disponibles=useMemo(()=>{const q=busqueda.toLowerCase().trim();return productos.filter(p=>p.stock_actual>0&&(!q||[p.nombre,p.marca,p.modelo,p.categoria,p.sku].filter(Boolean).some(v=>String(v).toLowerCase().includes(q))));},[productos,busqueda]);
  const seleccionado=productos.find(p=>p.id===Number(productoId));
  useEffect(()=>{if(seleccionado)setPrecioVenta(String(seleccionado.precio??0));},[seleccionado]);

  const cambiarEstado=async(db:string)=>{if(!orden||guardando)return;
    const permitidos:Record<string,string|undefined>={"RECIBIDO":"DIAGNÓSTICO","DIAGNOSTICO":"PRESUPUESTADO","PRESUPUESTADO":"ESPERANDO APROBACIÓN","ESPERANDO APROBACION":"APROBADO","APROBADO":"EN REPARACIÓN","EN REPARACION":"LISTO PARA ENTREGAR","LISTO PARA ENTREGAR":"ENTREGADO"};
    const esperado=permitidos[normalizar(orden.estado)];
    if(normalizar(db)!==normalizar(esperado)){setError(`No se puede pasar de ${orden.estado||"-"} a ${db} desde esta acción.`);return;}
    setGuardando(true);setError("");setMensaje("");const anterior=orden.estado||null;const payload:any={estado:db};if(db==="ENTREGADO")payload.entregado_at=new Date().toISOString();const{error:e}=await supabase.from("ordenes_reparacion").update(payload).eq("id",orden.id);if(e){setError(e.message);}else{await supabase.rpc("registrar_historial_reparacion",{p_orden_id:orden.id,p_tipo:"ESTADO",p_estado_anterior:anterior,p_estado_nuevo:db,p_descripcion:`Estado cambiado de ${anterior||"-"} a ${db}.`});setOrden({...orden,estado:db});setMensaje(`Estado actualizado a ${db}.`);}setGuardando(false);};
  const avanzar=async()=>{if(!siguiente||!orden)return;await cambiarEstado(siguiente.db);};
   const guardarNotas=async()=>{
     if(!orden)return;
     setGuardando(true); setError("");
     let observaciones="";
     if(diagnostico.trim()) observaciones=`Diagnóstico:\n${diagnostico.trim()}`;
     if(notas.trim()) observaciones+=(observaciones?"\n\n":"")+`Notas técnicas:\n${notas.trim()}`;
     const{error:e}=await supabase.from("ordenes_reparacion").update({observaciones,contrasena_equipo:contrasenaEquipo.trim()||null}).eq("id",orden.id);
     if(e)setError(e.message); else { setOrden({...orden,observaciones,contrasena_equipo:contrasenaEquipo.trim()||null}); await supabase.rpc("registrar_historial_reparacion",{p_orden_id:orden.id,p_tipo:"NOTA",p_estado_anterior:orden.estado,p_estado_nuevo:orden.estado,p_descripcion:"Se actualizaron diagnóstico, notas técnicas o contraseña del equipo."}); setMensaje("Diagnóstico, notas y contraseña guardados."); }
     setGuardando(false);
   };

  const agregarRepuesto=async()=>{if(!orden)return;setError("");setMensaje("");const p=productos.find(x=>x.id===Number(productoId));const q=Number(cantidad);const precio=Number(precioVenta);if(!p)return setError("Seleccioná un repuesto del inventario.");if(!Number.isInteger(q)||q<=0)return setError("La cantidad debe ser mayor a 0.");if(!Number.isFinite(precio)||precio<0)return setError("Ingresá un precio válido.");const existente=items.find(x=>x.producto_id===p.id);const nueva=(existente?.cantidad||0)+q;if(nueva>p.stock_actual)return setError(`Stock insuficiente. ${p.nombre}: ${p.stock_actual} disponible(s).`);setGuardando(true);let e;if(existente){e=(await supabase.from("presupuesto_reparacion_items").update({cantidad:nueva,precio_unitario:precio}).eq("id",existente.id)).error;}else{e=(await supabase.from("presupuesto_reparacion_items").insert({taller_id:orden.taller_id,orden_id:ordenId,producto_id:p.id,cantidad:q,costo_unitario:Number(p.costo||0),precio_unitario:precio})).error;}if(e)setError(`No se pudo guardar el repuesto: ${e.message}`);else{setMensaje(`${p.nombre} agregado al presupuesto.`);setProductoId("");setCantidad("1");setPrecioVenta("");setBusqueda("");await cargar();}setGuardando(false);};
  const eliminarRepuesto=async(id:number)=>{setGuardando(true);setError("");const{error:e}=await supabase.from("presupuesto_reparacion_items").delete().eq("id",id);if(e)setError(e.message);else setMensaje("Repuesto eliminado.");await cargar();setGuardando(false);};
  const guardarPresupuesto=async(enviar:boolean)=>{if(!orden)return;const mano=Math.max(0,Number(manoObra)||0);if(items.length===0&&mano<=0)return setError("Agregá al menos un repuesto o una mano de obra.");setGuardando(true);setError("");const{error:e}=await supabase.from("ordenes_reparacion").update({presupuesto_mano_obra:mano,estado:enviar?"ESPERANDO APROBACIÓN":"PRESUPUESTADO"}).eq("id",orden.id);if(e)setError(`No se pudo guardar el presupuesto: ${e.message}`);else{setOrden({...orden,presupuesto_mano_obra:mano,estado:enviar?"ESPERANDO APROBACIÓN":"PRESUPUESTADO"});setMensaje(enviar?"Presupuesto enviado a aprobación.":"Presupuesto guardado correctamente.");}setGuardando(false);};

  const consumirRepuestosYComenzar=async()=>{if(!orden||guardando)return;setGuardando(true);setError("");setMensaje("");try{
    const{error:ue}=await supabase.rpc("iniciar_reparacion",{p_orden_id:orden.id});
    if(ue)throw new Error(ue.message);
    setOrden({...orden,estado:"EN REPARACIÓN"});setMensaje("Repuestos registrados y descontados del inventario. La reparación comenzó.");await cargar();
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setGuardando(false);}};

  const totalRepuestos=items.reduce((s,i)=>s+Number(i.cantidad||0)*Number(i.precio_unitario||0),0),total=totalRepuestos+(Number(manoObra)||0);
  const totalPagado=pagos.reduce((s,p)=>s+Number(p.monto||0),0),saldo=Math.max(0,total-totalPagado);
  const estadoPago=saldo<=0&&total>0?"PAGADO":totalPagado>0?"PAGO PARCIAL":"PENDIENTE";
  const registrarPago=async()=>{if(!orden)return;const monto=Number(montoPago);if(!Number.isFinite(monto)||monto<=0)return setError("Ingresá un monto de pago válido.");if(monto>saldo+0.01)return setError(`El pago supera el saldo pendiente de ${dinero(saldo)}.`);setGuardando(true);setError("");const{error:e}=await supabase.from("pagos_reparacion").insert({taller_id:orden.taller_id,orden_id:orden.id,monto,metodo_pago:metodoPago,observaciones:notasPago.trim()||null});if(e)setError(`No se pudo registrar el pago: ${e.message}`);else{setMontoPago("");setNotasPago("");setMensaje(`Pago registrado: ${dinero(monto)}.`);await cargar();}setGuardando(false);};
  if(cargando) return <main className="min-h-screen bg-[#f5f6f8] flex items-center justify-center"><Loader2 size={32} className="animate-spin"/></main>;
  if(!orden) return <main className="min-h-screen bg-[#f5f6f8] p-8"><button onClick={()=>router.push("/reparaciones")} className="inline-flex items-center gap-2"><ArrowLeft size={17}/> Volver</button><div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error||"No se pudo cargar la reparación."}</div></main>;

  return <main className="min-h-screen bg-[#f3f7f5] text-gray-900"><div className="mx-auto max-w-[1200px] p-4 md:p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button onClick={()=>router.push("/reparaciones")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:border-[#16a34a] hover:text-[#15803d]"><ArrowLeft size={17}/> Volver</button><button onClick={()=>router.push("/")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:border-[#16a34a] hover:text-[#15803d]"><Home size={17}/> Inicio</button></div><span className="text-xs font-semibold text-gray-400">Orden #{orden.id}</span></div>

    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md"><div className="flex flex-col gap-5 p-6 md:p-8 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">ORDEN #{orden.id}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClase(orden.estado)}`}>{FLUJO.find(p=>p.key===({PRESUPUESTO:"PRESUPUESTADO","ESPERANDO REPUESTO":"ESPERANDO APROBACION",REPARADO:"LISTO PARA ENTREGAR",DIAGNOSTICO:"DIAGNOSTICO"} as Record<string,string>)[normalizar(orden.estado)]||normalizar(orden.estado))?.label||orden.estado}</span></div><h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">Gestión de reparación</h1><p className="mt-2 text-sm text-gray-500">Diagnóstico, presupuesto, reparación y entrega.</p></div><div className="mt-6 border-t border-gray-100 pt-6"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Acciones</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"><button onClick={()=>router.push(`/reparaciones/${orden.id}/checklist`)} className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-[#16a34a] hover:text-[#15803d]"><ClipboardCheck size={18}/> Checklist</button><button onClick={()=>router.push(`/reparaciones/${orden.id}/comprobante`)} className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-[#16a34a] hover:text-[#15803d]"><Printer size={18}/> Imprimir recepción</button><button onClick={()=>router.push(`/reparaciones/${orden.id}/etiqueta`)} className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-[#16a34a] hover:text-[#15803d]"><Printer size={18}/> Etiqueta técnico</button><button onClick={()=>router.push(`/reparaciones/${orden.id}/fotos`)} className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:border-[#16a34a] hover:text-[#15803d]"><ImageIcon size={18}/> Fotos</button><button onClick={()=>document.getElementById("presupuesto")?.scrollIntoView({behavior:"smooth"})} className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"><Package size={18}/> Presupuesto</button></div></div></div>
      <div className="border-t border-green-100 bg-gradient-to-r from-green-50/80 via-white to-green-50/40 p-6 md:p-8"><div className="overflow-x-auto"><div className="flex min-w-[950px] items-center">{FLUJO.map((p,i)=>{const activo=i===posicion,done=posicion>i;return <div key={p.key} className="flex flex-1 items-center"><button disabled={guardando} onClick={()=>{if(p.db===normalizar(orden.estado))return;if(p.db!==siguiente?.db){setError("Usá Avanzar reparación para continuar el flujo.");return;}void cambiarEstado(p.db);}} className="group flex min-w-0 flex-col items-center text-center"><div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${activo?"border-[#16a34a] bg-[#16a34a] text-white":done?"border-[#16a34a] bg-[#16a34a] text-white":"border-gray-300 bg-white text-gray-400"}`}>{done?<Check size={16}/>:i+1}</div><span className={`mt-2 max-w-[115px] text-[10px] font-bold uppercase ${activo?"text-[#15803d]":done?"text-[#15803d]":"text-gray-400"}`}>{p.label}</span></button>{i<FLUJO.length-1&&<div className={`mx-2 h-[2px] flex-1 ${done?"bg-[#86efac]":"bg-gray-200"}`}/>}</div>})}</div></div><div className="mt-5 flex flex-wrap gap-3">{siguiente&&<button disabled={guardando} onClick={avanzar} className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#15803d]">{guardando?<Loader2 size={17} className="animate-spin"/>:<ArrowRight size={17}/>} Avanzar a {siguiente.label}</button>}{(esPresupuesto||normalizar(orden.estado)==="DIAGNOSTICO"||normalizar(orden.estado)==="RECIBIDO")&&<button onClick={()=>document.getElementById("presupuesto")?.scrollIntoView({behavior:"smooth"})} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold"><Package size={17}/> Cargar presupuesto</button>}</div><div className="mt-5 flex flex-wrap gap-3">{normalizar(orden.estado)==="APROBADO"&&<button disabled={guardando} onClick={consumirRepuestosYComenzar} className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white">{guardando?<Loader2 size={17} className="animate-spin"/>:<Wrench size={17}/>} Consumir repuestos y comenzar reparación</button>}{puedeAprobar&&<><button disabled={guardando} onClick={()=>cambiarEstado("APROBADO")} className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"><Check size={17}/> Aprobar presupuesto</button><button disabled={guardando} onClick={async()=>{if(!orden)return;setGuardando(true);setError("");const{error:e}=await supabase.from("ordenes_reparacion").update({estado:"PRESUPUESTADO"}).eq("id",orden.id).eq("estado","ESPERANDO APROBACIÓN");if(e)setError(e.message);else{await supabase.rpc("registrar_historial_reparacion",{p_orden_id:orden.id,p_tipo:"APROBACION",p_estado_anterior:"ESPERANDO APROBACIÓN",p_estado_nuevo:"PRESUPUESTADO",p_descripcion:"Presupuesto rechazado. Requiere revisión."});setOrden({...orden,estado:"PRESUPUESTADO"});setMensaje("Presupuesto rechazado. Podés modificarlo y volver a enviarlo.");}setGuardando(false);}} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700"><Trash2 size={17}/> Rechazar presupuesto</button></>}</div></div></section>

    {normalizar(orden.estado)==="EN REPARACION"&&<div className="mt-5"><button disabled={guardando} onClick={()=>cambiarEstado("LISTO PARA ENTREGAR")} className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-bold text-white"><Check size={17}/> Marcar listo para entregar</button></div>}

    {mensaje&&<div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{mensaje}</div>}{error&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

    <div className="mt-6 space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Responsable</p><h2 className="mt-1 text-xl font-black">Técnico asignado</h2><p className="text-sm text-gray-500">Asigná quién realizará la reparación de esta orden.</p></div>
          <Wrench className="text-[#16a34a]" size={22}/>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select value={tecnicoId} onChange={e=>setTecnicoId(e.target.value)} className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold outline-none focus:border-[#16a34a]">
            <option value="">Sin técnico asignado</option>
             {tecnicos.length===0&&<option value="" disabled>No hay técnicos cargados</option>}
            {tecnicos.map(t=><option key={t.id} value={t.id}>{t.nombre||t.email||"Técnico"}{t.email&&t.nombre ? " · "+t.email : ""}</option>)}
          </select>
          <button disabled={guardando} onClick={async()=>{if(!orden)return;setGuardando(true);setError("");const{error:e}=await supabase.from("ordenes_reparacion").update({tecnico_id:tecnicoId||null}).eq("id",orden.id);if(e)setError(e.message);else{setMensaje(tecnicoId?"Técnico asignado correctamente.":"Técnico desasignado.");await supabase.rpc("registrar_historial_reparacion",{p_orden_id:orden.id,p_tipo:"TECNICO",p_estado_anterior:orden.estado,p_estado_nuevo:orden.estado,p_descripcion:tecnicoId?"Técnico asignado: "+(tecnicos.find(t=>t.id===tecnicoId)?.nombre||tecnicoId):"Técnico desasignado."});}setGuardando(false);}} className="h-11 rounded-xl bg-[#16a34a] px-5 text-sm font-bold text-white hover:bg-[#15803d]">Guardar técnico</button>
        </div>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div><p className="text-xs font-bold uppercase text-gray-400">Cliente</p><p className="mt-1 text-lg font-bold">{orden.cliente?.nombre||"Sin nombre"}</p><p className="text-sm text-gray-500">{orden.cliente?.telefono||"Sin teléfono"}</p></div>
          <div><p className="text-xs font-bold uppercase text-gray-400">Equipo</p><p className="mt-1 text-lg font-bold">{[orden.equipo?.marca,orden.equipo?.modelo].filter(Boolean).join(" ")||"Sin equipo"}</p><p className="text-sm text-gray-500">IMEI: {orden.equipo?.imei||"-"} · Batería: {orden.equipo?.bateria_porcentaje!=null?orden.equipo.bateria_porcentaje+"%":"-"}</p></div>
        </div>
        <div className="mt-4 rounded-xl border border-green-100 bg-green-50/50 p-4"><p className="text-xs font-bold uppercase text-gray-400">Falla reportada</p><p className="mt-1 whitespace-pre-wrap text-sm">{orden.falla_reportada||"Sin falla registrada."}</p></div>
      </section>
      <section id="diagnostico" className="scroll-mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button onClick={()=>setSeccion(seccion==="diagnostico"?"reparacion":"diagnostico")} className="flex w-full items-center justify-between p-6 text-left"><div><div className="mb-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#15803d]">Paso 1</div><h2 className="text-xl font-black">Diagnóstico</h2><p className="text-sm text-gray-500">Registrá qué encontraste y las notas técnicas.</p></div>{seccion==="diagnostico"?<ChevronUp/>:<ChevronDown/>}</button>
        {seccion==="diagnostico"&&<div className="border-t p-6"><textarea value={diagnostico} onChange={e=>setDiagnostico(e.target.value)} rows={4} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-green-100" placeholder="Qué se encontró..."/><textarea value={notas} onChange={e=>setNotas(e.target.value)} rows={3} className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-green-100" placeholder="Notas técnicas..."/><div className="mt-4 flex justify-end"><button disabled={guardando} onClick={guardarNotas} className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">Guardar diagnóstico</button></div></div>}
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4"><label className="text-xs font-black uppercase tracking-wide text-gray-600">Contraseña del equipo <span className="font-normal normal-case text-gray-400">(uso interno)</span></label><input type="text" value={contrasenaEquipo} onChange={e=>setContrasenaEquipo(e.target.value)} placeholder="Ingresá la contraseña o código del equipo" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-[#16a34a]"/><p className="mt-1 text-[11px] text-gray-500">Se guarda en la orden y aparecerá únicamente en la etiqueta del técnico.</p></div></section>
      <section id="presupuesto" className="scroll-mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button onClick={()=>setSeccion(seccion==="presupuesto"?"reparacion":"presupuesto")} className="flex w-full items-center justify-between p-6 text-left"><div><div className="mb-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#15803d]">Paso 2</div><h2 className="text-xl font-black">Presupuesto</h2><p className="text-sm text-gray-500">Agregá repuestos y mano de obra.</p></div>{seccion==="presupuesto"?<ChevronUp/>:<ChevronDown/>}</button>
        {seccion==="presupuesto"&&<div className="border-t p-6 space-y-5">
          <div className="grid gap-3 md:grid-cols-[1fr_110px_140px_auto]"><div><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar repuesto..." className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-green-100"/><select value={productoId} onChange={e=>setProductoId(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#16a34a]"><option value="">Seleccionar repuesto</option>{disponibles.map(p=><option key={p.id} value={p.id}>{p.nombre} · stock {p.stock_actual}</option>)}</select></div><input type="number" min="1" value={cantidad} onChange={e=>setCantidad(e.target.value)} className="h-11 rounded-xl border px-4"/><input type="number" min="0" step=".01" value={precioVenta} onChange={e=>setPrecioVenta(e.target.value)} className="h-11 rounded-xl border px-4"/><button disabled={guardando} onClick={agregarRepuesto} className="h-11 rounded-xl bg-black px-5 text-sm font-bold text-white"><Plus size={17} className="inline mr-1"/>Agregar</button></div>
          {items.length>0&&<div className="divide-y rounded-xl border">{items.map(i=><div key={i.id} className="flex items-center justify-between p-4"><div><p className="font-bold">{i.producto?.nombre||"Repuesto"}</p><p className="text-xs text-gray-500">{i.cantidad} × {dinero(i.precio_unitario)}</p></div><div className="flex items-center gap-3"><b>{dinero(i.cantidad*i.precio_unitario)}</b><button onClick={()=>eliminarRepuesto(i.id)}><Trash2 size={17} className="text-red-600"/></button></div></div>)}</div>}
          <div className="grid gap-4 md:grid-cols-[1fr_250px]"><div><label className="text-xs font-bold uppercase text-gray-400">Mano de obra</label><input type="number" min="0" step=".01" value={manoObra} onChange={e=>setManoObra(e.target.value)} className="mt-2 h-11 w-full rounded-xl border px-4"/></div><div className="rounded-2xl bg-gradient-to-br from-[#14532d] to-[#16a34a] p-5 text-white shadow-sm"><p className="text-xs text-gray-400">TOTAL</p><p className="text-3xl font-bold">{dinero(total)}</p></div></div>
          <div className="flex justify-end"><button disabled={guardando} onClick={()=>guardarPresupuesto(true)} className="rounded-xl bg-[#16a34a] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#15803d]">Guardar y enviar aprobación <ArrowRight size={16} className="inline ml-1"/></button></div>
        </div>}
      </section>
      <section id="cobros" className="scroll-mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6"><div><div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">Paso 3</div><h2 className="text-xl font-black">Cobro de la reparación</h2><p className="text-sm text-gray-500">Registrá señas, pagos parciales o el pago total.</p></div><CreditCard className="text-blue-600" size={25}/></div>
        <div className="border-t p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs font-bold uppercase text-gray-400">Total</p><p className="mt-1 text-2xl font-black">{dinero(total)}</p></div>
            <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-700">Abonado</p><p className="mt-1 text-2xl font-black text-emerald-700">{dinero(totalPagado)}</p></div>
            <div className={"rounded-2xl p-4 "+(saldo>0?"bg-amber-50":"bg-green-50")}><p className="text-xs font-bold uppercase text-gray-500">Saldo</p><p className={"mt-1 text-2xl font-black "+(saldo>0?"text-amber-700":"text-green-700")}>{dinero(saldo)}</p></div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2"><span className={"rounded-full px-3 py-1 text-xs font-black "+(estadoPago==="PAGADO"?"bg-green-100 text-green-700":estadoPago==="PAGO PARCIAL"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700")}>{estadoPago}</span></div>
          {saldo>0&&<div className="mt-5 grid gap-3 md:grid-cols-[180px_180px_1fr_auto]">
            <input type="number" min="0.01" step="0.01" max={saldo} value={montoPago} onChange={e=>setMontoPago(e.target.value)} placeholder="Monto" className="h-11 rounded-xl border px-4"/>
            <select value={metodoPago} onChange={e=>setMetodoPago(e.target.value)} className="h-11 rounded-xl border px-4"><option>EFECTIVO</option><option>TRANSFERENCIA</option><option>MERCADO PAGO</option><option>TARJETA</option><option>OTRO</option></select>
            <input value={notasPago} onChange={e=>setNotasPago(e.target.value)} placeholder="Nota del pago (opcional)" className="h-11 rounded-xl border px-4"/>
            <button disabled={guardando} onClick={registrarPago} className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"><CreditCard size={16} className="mr-1 inline"/>Registrar pago</button>
          </div>}
          {pagos.length>0&&<div className="mt-5 overflow-hidden rounded-xl border"><div className="grid grid-cols-[1fr_130px_130px] bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-400"><span>Fecha</span><span>Método</span><span className="text-right">Monto</span></div>{pagos.map(p=><div key={p.id} className="grid grid-cols-[1fr_130px_130px] border-t px-4 py-3 text-sm"><span>{fecha(p.created_at)}</span><span className="font-semibold">{p.metodo_pago}</span><span className="text-right font-black">{dinero(p.monto)}</span></div>)}</div>}
        </div>
      </section>

      <section id="reparacion" className="scroll-mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button onClick={()=>setSeccion(seccion==="reparacion"?"diagnostico":"reparacion")} className="flex w-full items-center justify-between p-6 text-left"><div><div className="mb-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#15803d]">Paso 3</div><h2 className="text-xl font-black">Reparación y entrega</h2><p className="text-sm text-gray-500">Cuando el presupuesto esté aprobado, continuás desde acá.</p></div>{seccion==="reparacion"?<ChevronUp/>:<ChevronDown/>}</button>
        {seccion==="reparacion"&&<div className="border-t p-6"><div className="grid gap-3 md:grid-cols-3"><button onClick={()=>router.push(`/reparaciones/${orden.id}/checklist`)} className="rounded-xl border border-gray-200 bg-white p-4 text-left font-bold shadow-sm hover:border-[#16a34a] hover:bg-green-50/40">Checklist</button><button onClick={()=>router.push(`/reparaciones/${orden.id}/fotos`)} className="rounded-xl border p-4 text-left font-bold">Fotos</button><button onClick={avanzar} disabled={!siguiente||guardando} className="rounded-xl bg-[#16a34a] p-4 text-left font-bold text-white shadow-sm hover:bg-[#15803d]">Avanzar reparación</button></div></div>}
      </section>
    </div>
    <div className="py-8 text-center text-[11px] font-semibold tracking-wide text-gray-400">BITFIX TALLER · Gestión de reparación</div>
  </div></main>;
}
