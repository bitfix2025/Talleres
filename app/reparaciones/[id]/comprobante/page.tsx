"use client";

import { useEffect,useState } from "react";
import { useParams,useRouter } from "next/navigation";
import { ArrowLeft,Home,Printer } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

type Cliente={nombre:string|null;dni:string|null;telefono:string|null};
type Equipo={marca:string|null;modelo:string|null;imei:string|null;numero_serie:string|null;color:string|null;capacidad:string|null;bateria_porcentaje:number|null};
type Orden={id:number;estado:string|null;falla_reportada:string|null;observaciones:string|null;created_at:string|null;cliente:Cliente|null;equipo:Equipo|null};
type Fila={categoria:string;prueba:string;estado:string;observacion:string|null};

const normal=(v:string|null|undefined)=>(v||"").toUpperCase().replaceAll("_"," ");
const estadoTexto=(v:string)=>{const x=normal(v);if(x==="FUNCIONA")return"OK";if(x==="NO FUNCIONA")return"NO FUNCIONA";if(x==="NO PROBADO")return"NO PROBADO";return v};
const fecha=(v:string|null)=>v?new Date(v).toLocaleString("es-AR",{dateStyle:"medium",timeStyle:"short"}):"-";

export default function ComprobanteRecepcion(){
 const params=useParams();const router=useRouter();const id=Number(params.id);
 const[orden,setOrden]=useState<Orden|null>(null),[check,setCheck]=useState<Fila[]>([]),[cargando,setCargando]=useState(true),[error,setError]=useState("");
 useEffect(()=>{(async()=>{const r=await supabase.from("ordenes_reparacion").select("id,estado,falla_reportada,observaciones,created_at,clientes(nombre,dni,telefono),equipos(marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje)").eq("id",id).maybeSingle();if(r.error||!r.data){setError(r.error?.message||"No se encontró la orden.");setCargando(false);return}const o=r.data as any;setOrden({...o,cliente:Array.isArray(o.clientes)?o.clientes[0]||null:o.clientes||null,equipo:Array.isArray(o.equipos)?o.equipos[0]||null:o.equipos||null});const c=await supabase.from("checklist_reparacion").select("categoria,prueba,estado,observacion").eq("orden_id",id).eq("momento","ENTRADA").order("orden_prueba");if(!c.error)setCheck((c.data||[]) as Fila[]);setCargando(false)})()},[id]);
 if(cargando)return <main className="min-h-screen grid place-items-center text-sm text-gray-500">Cargando comprobante...</main>;
 if(!orden)return <main className="p-8"><p className="text-red-600">{error}</p></main>;
 const fisico=check.filter(x=>x.categoria==="Estado físico"),func=check.filter(x=>x.categoria==="Pruebas funcionales"),con=check.filter(x=>x.categoria==="Conectividad"),acc=check.filter(x=>x.categoria==="Accesorios");
 return <main className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0"><div className="mx-auto mb-4 flex max-w-[850px] gap-2 print:hidden"><button onClick={()=>router.push("/reparaciones/"+id)} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold"><ArrowLeft size={16} className="mr-2 inline"/>Volver</button><button onClick={()=>router.push("/")} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold"><Home size={16} className="mr-2 inline"/>Inicio</button><button onClick={()=>window.print()} className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"><Printer size={16} className="mr-2 inline"/>Imprimir</button></div>
 <article className="mx-auto max-w-[850px] bg-white p-7 text-[11px] leading-4 text-gray-900 shadow-sm print:max-w-none print:p-6 print:shadow-none">
  <header className="border-b-2 border-black pb-4"><div className="flex items-start justify-between gap-5"><div><div className="text-3xl font-black tracking-tight text-black">BITFIX</div><p className="mt-1 font-bold uppercase tracking-widest">Orden de reparación</p><p className="text-gray-500">Comprobante de recepción</p></div><div className="text-right"><p className="text-[10px] uppercase text-gray-500">N° de orden</p><p className="text-2xl font-black">#{String(orden.id).padStart(5,"0")}</p><p>{fecha(orden.created_at)}</p></div></div></header>
  <section className="mt-4 grid grid-cols-2 gap-4"><Box title="CLIENTE"><b>{orden.cliente?.nombre||"-"}</b><br/>DNI: {orden.cliente?.dni||"-"}<br/>Teléfono: {orden.cliente?.telefono||"-"}</Box><Box title="EQUIPO"><b>{[orden.equipo?.marca,orden.equipo?.modelo].filter(Boolean).join(" ")||"-"}</b><br/>IMEI: {orden.equipo?.imei||"-"}<br/>Serie: {orden.equipo?.numero_serie||"-"}<br/>Color: {orden.equipo?.color||"-"} · {orden.equipo?.capacidad||"-"} · Batería: {orden.equipo?.bateria_porcentaje!=null?orden.equipo.bateria_porcentaje+"%":"-"}</Box></section>
  <section className="mt-4 rounded-lg border p-3"><b>PROBLEMA INFORMADO POR EL CLIENTE</b><p className="mt-1 whitespace-pre-wrap">{orden.falla_reportada||"-"}</p></section>
  {fisico.length>0&&<Checklist title="ESTADO FÍSICO" rows={fisico}/>}
  {func.length>0&&<Checklist title="PRUEBAS FUNCIONALES" rows={func}/>}
  {con.length>0&&<Checklist title="CONECTIVIDAD" rows={con}/>}
  {acc.length>0&&<Checklist title="ACCESORIOS RECIBIDOS" rows={acc}/>}
  <section className="mt-4 rounded-lg border p-3"><b>OBSERVACIONES</b><p className="mt-1 min-h-10 whitespace-pre-wrap">{orden.observaciones||"Sin observaciones."}</p></section>
  <section className="mt-5"><h2 className="border-b pb-1 text-xs font-black text-green-700">TÉRMINOS Y CONDICIONES DE RECEPCIÓN</h2><div className="mt-2 space-y-1 text-[9.5px] leading-[1.35]"><p>• El presente documento acredita la recepción del equipo identificado en esta orden.</p><p>• El cliente declara haber informado el problema indicado y debe retirar el equipo presentando este comprobante o identificando el número de orden.</p><p>• Los equipos que ingresen apagados, sin imagen o que no permitan comprobar sus funciones serán registrados según lo observado al momento de la recepción.</p><p>• BITFIX no se responsabiliza por pérdida de información, fotografías, contactos, cuentas o datos almacenados en el dispositivo. Se recomienda realizar una copia de seguridad.</p><p>• En equipos mojados, golpeados, con daños previos o reparaciones de placa, pueden existir riesgos adicionales durante el diagnóstico o la intervención.</p><p>• La garantía, cuando corresponda, se aplicará según el trabajo realizado, el repuesto instalado y las condiciones informadas al momento de la entrega.</p><p>• El cliente acepta las condiciones de recepción al entregar el equipo y firmar este documento.</p></div></section>
  <div className="mt-7 grid grid-cols-2 gap-10 border-t pt-7"><div><div className="h-10 border-b border-gray-500"></div><p className="mt-1 text-center">Firma del cliente</p></div><div><div className="h-10 border-b border-gray-500"></div><p className="mt-1 text-center">BITFIX</p></div></div>
  <footer className="mt-5 border-t pt-3 text-center text-[9px] text-gray-400">BITFIX · Comprobante de recepción · Orden #{String(orden.id).padStart(5,"0")}</footer>
 </article></main>;
}
function Box({title,children}:{title:string;children:any}){return <div className="rounded-lg border p-3"><p className="mb-1 text-[9px] font-black tracking-widest text-green-700">{title}</p>{children}</div>}
function Checklist({title,rows}:{title:string;rows:Fila[]}){return <section className="mt-4"><h2 className="mb-2 text-[10px] font-black tracking-widest text-green-700">{title}</h2><div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border p-3 sm:grid-cols-3">{rows.map((r,i)=><div key={i} className="flex justify-between gap-2 border-b border-gray-100 pb-1"><span>{r.prueba}</span><b>{estadoTexto(r.estado)}</b></div>)}</div></section>}
