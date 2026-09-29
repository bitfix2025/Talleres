"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Smartphone, Eye, ShoppingCart, Package, DollarSign, X, CheckCircle2, CalendarDays, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TALLER_ID = 1;
type EquipoVenta = {
  id:number; marca:string; modelo:string; capacidad:string|null; color:string|null;
  tipo:"NUEVO"|"USADO"; imei:string|null; numero_serie:string|null; salud_bateria:number|null;
  estado_estetico:string|null; costo:number; precio:number; garantia_dias:number;
  observaciones:string|null; image_url:string|null; estado:"DISPONIBLE"|"RESERVADO"|"VENDIDO"|"BAJA"; created_at:string;
};
type Cliente = { id:number; nombre:string; telefono:string|null };
const money=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(Number(n)||0);

export default function VentasEquiposPage(){
  const router=useRouter();
  const [equipos,setEquipos]=useState<EquipoVenta[]>([]);
  const [ventas,setVentas]=useState<any[]>([]);
  const [clientes,setClientes]=useState<Cliente[]>([]);
  const [tab,setTab]=useState("equipos");
  const [busqueda,setBusqueda]=useState("");
  const [tipo,setTipo]=useState("TODOS");
  const [estado,setEstado]=useState("TODOS");
  const [marca,setMarca]=useState("TODAS");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [ok,setOk]=useState("");
  const [nuevo,setNuevo]=useState(false);
  const [venta,setVenta]=useState<EquipoVenta|null>(null);
  const [detalle,setDetalle]=useState<EquipoVenta|null>(null);
  const [clienteId,setClienteId]=useState("");
  const [metodo,setMetodo]=useState("EFECTIVO");
  const [descuento,setDescuento]=useState("");
  const [guardando,setGuardando]=useState(false);
  const [form,setForm]=useState({
    marca:"Apple",modelo:"",capacidad:"",color:"",tipo:"USADO",imei:"",numero_serie:"",
    salud_bateria:"",estado_estetico:"A",costo:"",precio:"",garantia_dias:"30",observaciones:"",image_url:""
  });

  const cargar=async()=>{
    setLoading(true); setError("");
    const [e,v,c]=await Promise.all([
      supabase.from("equipos_venta").select("*").eq("taller_id",TALLER_ID).order("created_at",{ascending:false}),
      supabase.from("ventas").select("id,cliente_id,total,ganancia,metodo_pago,estado,tipo_venta,created_at").eq("taller_id",TALLER_ID).eq("tipo_venta","EQUIPO").order("created_at",{ascending:false}),
      supabase.from("clientes").select("id,nombre,telefono").eq("taller_id",TALLER_ID).order("nombre")
    ]);
    const err=e.error||v.error||c.error;
    if(err) setError(err.message);
    setEquipos((e.data||[]) as EquipoVenta[]);
    setVentas(v.data||[]);
    setClientes((c.data||[]) as Cliente[]);
    setLoading(false);
  };
  useEffect(()=>{void cargar()},[]);

  const marcas=useMemo(()=>["TODAS",...Array.from(new Set(equipos.map(e=>e.marca).filter(Boolean)))],[equipos]);
  const filtrados=useMemo(()=>{
    const q=busqueda.trim().toLowerCase();
    return equipos.filter(e=>{
      const texto=[e.marca,e.modelo,e.capacidad,e.color,e.imei,e.numero_serie].filter(Boolean).join(" ").toLowerCase();
      return (!q||texto.includes(q))&&(tipo==="TODOS"||e.tipo===tipo)&&(estado==="TODOS"||e.estado===estado)&&(marca==="TODAS"||e.marca===marca);
    });
  },[equipos,busqueda,tipo,estado,marca]);

  const stats=useMemo(()=>{
    return {
      disponibles:equipos.filter(e=>e.estado==="DISPONIBLE").length,
      reservados:equipos.filter(e=>e.estado==="RESERVADO").length,
      vendidos:ventas.length,
      ingresos:ventas.reduce((s,v)=>s+Number(v.total||0),0),
      ganancia:ventas.reduce((s,v)=>s+Number(v.ganancia||0),0)
    };
  },[equipos,ventas]);

  const limpiar=()=>setForm({marca:"Apple",modelo:"",capacidad:"",color:"",tipo:"USADO",imei:"",numero_serie:"",salud_bateria:"",estado_estetico:"A",costo:"",precio:"",garantia_dias:"30",observaciones:"",image_url:""});

  const guardarEquipo=async(e:React.FormEvent)=>{
    e.preventDefault(); setGuardando(true); setError("");
    if(!form.modelo.trim()||Number(form.precio)<=0){setError("Modelo y precio de venta son obligatorios.");setGuardando(false);return;}
    const r=await supabase.from("equipos_venta").insert({
      taller_id:TALLER_ID,marca:form.marca.trim(),modelo:form.modelo.trim(),capacidad:form.capacidad.trim()||null,
      color:form.color.trim()||null,tipo:form.tipo,imei:form.imei.trim()||null,numero_serie:form.numero_serie.trim()||null,
      salud_bateria:form.salud_bateria?Number(form.salud_bateria):null,estado_estetico:form.estado_estetico||null,
      costo:Number(form.costo)||0,precio:Number(form.precio)||0,garantia_dias:Number(form.garantia_dias)||0,
      observaciones:form.observaciones.trim()||null,image_url:form.image_url.trim()||null
    });
    if(r.error)setError(r.error.message);else{setOk("Equipo agregado al stock.");setNuevo(false);limpiar();void cargar();}
    setGuardando(false);
  };

  const vender=async()=>{
    if(!venta)return; setGuardando(true); setError("");
    const r=await supabase.rpc("registrar_venta_equipo",{
      p_taller_id:TALLER_ID,p_equipo_id:venta.id,p_cliente_id:clienteId?Number(clienteId):null,
      p_metodo_pago:metodo,p_descuento:Number(descuento)||0,p_observaciones:null
    });
    if(r.error)setError(r.error.message);else{setOk("Venta registrada y equipo marcado como vendido.");setVenta(null);setClienteId("");setDescuento("");void cargar();}
    setGuardando(false);
  };

  const cambiarReserva=async(e:EquipoVenta)=>{
    const nuevoEstado=e.estado==="RESERVADO"?"DISPONIBLE":"RESERVADO";
    const r=await supabase.from("equipos_venta").update({estado:nuevoEstado,updated_at:new Date().toISOString()}).eq("id",e.id).eq("taller_id",TALLER_ID);
    if(r.error)setError(r.error.message);else{setOk(nuevoEstado==="RESERVADO"?"Equipo reservado.":"Reserva liberada.");void cargar();}
  };

  const publicar=(e:EquipoVenta)=>{
    const texto="📱 "+e.marca+" "+e.modelo+(e.capacidad?" "+e.capacidad:"")+"\n"+
      (e.tipo==="NUEVO"?"Nuevo":"Usado")+" · "+(e.estado_estetico?"Estado "+e.estado_estetico:"")+
      (e.salud_bateria?" · Batería "+e.salud_bateria+"%":"")+"\n💰 "+money(e.precio)+"\n🛡️ Garantía "+e.garantia_dias+" días";
    window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank");
  };

  return <main className="min-h-screen bg-[#f7f8f7] px-4 py-5 md:px-7 md:py-7 text-gray-900">
    <div className="mx-auto max-w-[1480px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-green-700">Comercial</p><h1 className="mt-1 text-3xl font-black tracking-tight">Ventas de equipos</h1><p className="mt-2 text-sm text-gray-500">Gestioná equipos nuevos y usados, stock, ventas y rentabilidad.</p></div>
        <div className="flex gap-2"><button onClick={()=>router.push("/")} className="rounded-xl border bg-white px-4 py-3 text-sm font-bold"><ArrowLeft size={16} className="mr-2 inline"/>Inicio</button><button onClick={()=>{setError("");setNuevo(true)}} className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-700"><Plus size={18} className="mr-2 inline"/>Nuevo equipo</button></div>
      </div>
      {error&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {ok&&<div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700"><CheckCircle2 size={17} className="mr-2 inline"/>{ok}</div>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Equipos disponibles" value={String(stats.disponibles)} sub={stats.reservados+" reservados"} icon={<Package size={20}/>}/>
        <Metric title="Equipos vendidos" value={String(stats.vendidos)} sub="Ventas completadas" icon={<ShoppingCart size={20}/>}/>
        <Metric title="Ingresos por equipos" value={money(stats.ingresos)} sub="Ventas completadas" icon={<DollarSign size={20}/>}/>
        <Metric title="Ganancia acumulada" value={money(stats.ganancia)} sub="Margen de equipos" icon={<DollarSign size={20}/>}/>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-1 border-b px-4 pt-2">
          <Tab active={tab==="equipos"} onClick={()=>setTab("equipos")} icon={<Smartphone size={16}/>} text="Equipos"/>
          <Tab active={tab==="ventas"} onClick={()=>setTab("ventas")} icon={<ShoppingCart size={16}/>} text="Ventas realizadas"/>
        </div>

        {tab==="equipos" ? <>
          <div className="flex flex-col gap-3 border-b p-4 xl:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-gray-400" size={17}/><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por modelo, IMEI, serie, color..." className="h-11 w-full rounded-xl border bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-green-500"/></div>
            <select value={marca} onChange={e=>setMarca(e.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm">{marcas.map(m=><option key={m}>{m}</option>)}</select>
            <select value={tipo} onChange={e=>setTipo(e.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm"><option value="TODOS">Todos</option><option value="NUEVO">Nuevos</option><option value="USADO">Usados</option></select>
            <select value={estado} onChange={e=>setEstado(e.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm"><option value="TODOS">Todos los estados</option><option value="DISPONIBLE">Disponible</option><option value="RESERVADO">Reservado</option><option value="VENDIDO">Vendido</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead><tr className="border-b bg-gray-50 text-left text-[10px] font-black uppercase tracking-wider text-gray-400"><th className="px-5 py-3">Equipo</th><th>Tipo</th><th>Estado</th><th>Precio</th><th>Stock</th><th>Datos</th><th className="pr-5 text-right">Acciones</th></tr></thead>
              <tbody>
                {loading&&<tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-gray-400">Cargando equipos...</td></tr>}
                {!loading&&filtrados.map(e=><tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-green-700">{e.image_url?<img src={e.image_url} className="h-full w-full object-cover" alt=""/>:<Smartphone size={23}/>}</div><div><p className="font-bold">{e.marca} {e.modelo}</p><p className="text-xs text-gray-500">{[e.capacidad,e.color].filter(Boolean).join(" · ")||"Sin detalle"}</p>{e.imei&&<p className="text-[10px] text-gray-400">IMEI {e.imei}</p>}</div></div></td>
                  <td><span className={"rounded-full px-2.5 py-1 text-[11px] font-bold "+(e.tipo==="NUEVO"?"bg-emerald-50 text-emerald-700":"bg-blue-50 text-blue-700")}>{e.tipo==="NUEVO"?"Nuevo":"Usado"}</span></td>
                  <td><span className={"rounded-full px-2.5 py-1 text-[11px] font-bold "+(e.estado==="DISPONIBLE"?"bg-emerald-50 text-emerald-700":e.estado==="RESERVADO"?"bg-orange-50 text-orange-700":"bg-gray-100 text-gray-600")}>{e.estado==="DISPONIBLE"?"Disponible":e.estado==="RESERVADO"?"Reservado":e.estado==="VENDIDO"?"Vendido":"Baja"}</span></td>
                  <td className="font-black">{money(e.precio)}</td><td>{e.estado==="DISPONIBLE"?"1":"0"}</td>
                  <td className="text-xs text-gray-500">{e.tipo==="USADO"&&e.salud_bateria?<>Batería {e.salud_bateria}%</>:e.numero_serie?<>Serie {e.numero_serie}</>:"-"}</td>
                  <td className="pr-5"><div className="flex justify-end gap-1"><button title="Ver" onClick={()=>setDetalle(e)} className="rounded-lg border p-2 hover:bg-gray-50"><Eye size={16}/></button>{e.estado!=="VENDIDO"&&<button title={e.estado==="RESERVADO"?"Liberar reserva":"Reservar"} onClick={()=>void cambiarReserva(e)} className="rounded-lg border p-2 hover:bg-gray-50"><CalendarDays size={16}/></button>}{e.estado==="DISPONIBLE"&&<button onClick={()=>setVenta(e)} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white">Vender</button>}<button title="Publicar" onClick={()=>publicar(e)} className="rounded-lg border p-2 hover:bg-green-50"><MessageCircle size={16}/></button></div></td>
                </tr>)}
                {!loading&&!filtrados.length&&<tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-gray-400">No hay equipos que coincidan con los filtros.</td></tr>}
              </tbody>
            </table>
          </div>
        </> : <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]"><thead><tr className="border-b bg-gray-50 text-left text-[10px] font-black uppercase tracking-wider text-gray-400"><th className="px-5 py-3">Venta</th><th>Cliente</th><th>Total</th><th>Ganancia</th><th>Pago</th><th>Fecha</th></tr></thead><tbody>
            {ventas.map(v=>{const c=clientes.find(x=>x.id===v.cliente_id);return <tr key={v.id} className="border-b last:border-0"><td className="px-5 py-4 font-bold">#{v.id}</td><td>{c?.nombre||"Consumidor final"}</td><td className="font-black">{money(v.total)}</td><td className="font-bold text-green-700">{money(v.ganancia)}</td><td>{v.metodo_pago||"-"}</td><td className="text-sm text-gray-500">{new Date(v.created_at).toLocaleDateString("es-AR")}</td></tr>})}
            {!ventas.length&&<tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400">Todavía no hay ventas de equipos.</td></tr>}
          </tbody></table>
        </div>}
      </div>
    </div>

    {nuevo&&<Modal title="Agregar equipo al stock" close={()=>setNuevo(false)}>
      <form onSubmit={guardarEquipo} className="grid gap-4 md:grid-cols-2">
        <Field label="Marca"><input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} className="input"/></Field>
        <Field label="Modelo *"><input value={form.modelo} onChange={e=>setForm({...form,modelo:e.target.value})} className="input" placeholder="iPhone 13 Pro Max"/></Field>
        <Field label="Capacidad"><input value={form.capacidad} onChange={e=>setForm({...form,capacidad:e.target.value})} className="input" placeholder="256 GB"/></Field>
        <Field label="Color"><input value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="input" placeholder="Titanio natural"/></Field>
        <Field label="Tipo"><select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} className="input"><option value="NUEVO">Nuevo</option><option value="USADO">Usado</option></select></Field>
        <Field label="Estado estético"><select value={form.estado_estetico} onChange={e=>setForm({...form,estado_estetico:e.target.value})} className="input"><option>A</option><option>B</option><option>C</option></select></Field>
        <Field label="IMEI"><input value={form.imei} onChange={e=>setForm({...form,imei:e.target.value})} className="input"/></Field>
        <Field label="Número de serie"><input value={form.numero_serie} onChange={e=>setForm({...form,numero_serie:e.target.value})} className="input"/></Field>
        <Field label="Salud de batería %"><input type="number" min="0" max="100" value={form.salud_bateria} onChange={e=>setForm({...form,salud_bateria:e.target.value})} className="input"/></Field>
        <Field label="Garantía (días)"><input type="number" min="0" value={form.garantia_dias} onChange={e=>setForm({...form,garantia_dias:e.target.value})} className="input"/></Field>
        <Field label="Costo"><input type="number" min="0" value={form.costo} onChange={e=>setForm({...form,costo:e.target.value})} className="input"/></Field>
        <Field label="Precio de venta *"><input type="number" min="0" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} className="input"/></Field>
        <Field label="Imagen (URL)"><input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} className="input md:col-span-2" placeholder="https://..."/></Field>
        <Field label="Observaciones"><textarea value={form.observaciones} onChange={e=>setForm({...form,observaciones:e.target.value})} className="input min-h-24 md:col-span-2"/></Field>
        <div className="md:col-span-2 flex justify-end gap-2 border-t pt-4"><button type="button" onClick={()=>setNuevo(false)} className="rounded-xl border px-4 py-3 font-bold">Cancelar</button><button disabled={guardando} className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white">{guardando?"Guardando...":"Agregar al stock"}</button></div>
      </form>
    </Modal>}

    {venta&&<Modal title="Registrar venta" close={()=>setVenta(null)}>
      <div className="rounded-2xl bg-gray-50 p-4"><p className="font-black">{venta.marca} {venta.modelo}</p><p className="text-sm text-gray-500">{[venta.capacidad,venta.color].filter(Boolean).join(" · ")}</p><div className="mt-3 flex justify-between"><span>Precio</span><b>{money(venta.precio)}</b></div></div>
      <div className="mt-4 grid gap-4"><Field label="Cliente"><select value={clienteId} onChange={e=>setClienteId(e.target.value)} className="input"><option value="">Consumidor final</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.telefono?" · "+c.telefono:""}</option>)}</select></Field><Field label="Forma de pago"><select value={metodo} onChange={e=>setMetodo(e.target.value)} className="input"><option>EFECTIVO</option><option>TRANSFERENCIA</option><option>TARJETA</option><option>MERCADO_PAGO</option></select></Field><Field label="Descuento"><input type="number" min="0" value={descuento} onChange={e=>setDescuento(e.target.value)} className="input"/></Field></div>
      <div className="mt-5 rounded-2xl border bg-white p-4"><div className="flex justify-between text-sm"><span>Total</span><b>{money(Math.max(venta.precio-(Number(descuento)||0),0))}</b></div></div>
      <div className="mt-5 flex justify-end gap-2 border-t pt-4"><button onClick={()=>setVenta(null)} className="rounded-xl border px-4 py-3 font-bold">Cancelar</button><button disabled={guardando} onClick={()=>void vender()} className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white">{guardando?"Registrando...":"Confirmar venta"}</button></div>
    </Modal>}

    {detalle&&<Modal title="Detalle del equipo" close={()=>setDetalle(null)}>
      <div className="grid gap-5 md:grid-cols-[180px_1fr]"><div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">{detalle.image_url?<img src={detalle.image_url} className="h-full w-full object-cover" alt=""/>:<Smartphone size={55} className="text-green-700"/>}</div><div><h2 className="text-2xl font-black">{detalle.marca} {detalle.modelo}</h2><p className="mt-1 text-sm text-gray-500">{[detalle.capacidad,detalle.color].filter(Boolean).join(" · ")}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><Info l="Tipo" v={detalle.tipo==="NUEVO"?"Nuevo":"Usado"}/><Info l="Estado" v={detalle.estado}/><Info l="Precio" v={money(detalle.precio)}/><Info l="Costo" v={money(detalle.costo)}/><Info l="Ganancia" v={money(detalle.precio-detalle.costo)}/><Info l="Garantía" v={detalle.garantia_dias+" días"}/>{detalle.imei&&<Info l="IMEI" v={detalle.imei}/>} {detalle.salud_bateria!=null&&<Info l="Batería" v={detalle.salud_bateria+"%"}/>}</div></div></div>
      {detalle.observaciones&&<div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">{detalle.observaciones}</div>}
    </Modal>}
  </main>;
}
function Metric({title,value,sub,icon}:{title:string;value:string;sub:string;icon:React.ReactNode}){return <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-gray-400">{title}</p><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-gray-400">{sub}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">{icon}</div></div></div>}
function Tab({active,onClick,icon,text}:{active:boolean;onClick:()=>void;icon:React.ReactNode;text:string}){return <button onClick={onClick} className={"inline-flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold "+(active?"border-green-600 text-green-700":"border-transparent text-gray-500 hover:text-gray-800")}>{icon}{text}</button>}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4"><h2 className="text-xl font-black">{title}</h2><button onClick={close} className="rounded-lg p-2 hover:bg-gray-100"><X size={20}/></button></div><div className="p-6">{children}</div></div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-xs font-bold text-gray-500">{label}</span>{children}</label>}
function Info({l,v}:{l:string;v:string}){return <div className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-400">{l}</p><p className="mt-1 break-all font-bold">{v}</p></div>}

