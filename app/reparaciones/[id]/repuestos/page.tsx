"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Boxes, CheckCircle2, Home, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const TALLER_ID = 1;

type Producto = { id:number; nombre:string; categoria:string|null; marca:string|null; modelo:string|null; sku:string|null; costo:number|null; precio:number|null; stock_actual:number; activo:boolean };
type Item = { id:number; producto_id:number; cantidad:number; precio_unitario:number; costo_unitario:number; nombre_producto?:string|null; producto:Producto|null };

const dinero=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(Number(n)||0);

export default function RepuestosReparacionPage(){
  const params=useParams(); const router=useRouter(); const ordenId=Number(String(params.id));
  const [productos,setProductos]=useState<Producto[]>([]),[items,setItems]=useState<Item[]>([]);
  const [productoId,setProductoId]=useState(""),[cantidad,setCantidad]=useState("1"),[precioVenta,setPrecioVenta]=useState(""),[busqueda,setBusqueda]=useState("");
  const [cargando,setCargando]=useState(true),[guardando,setGuardando]=useState(false),[error,setError]=useState(""),[mensaje,setMensaje]=useState("");
  const scrollPendiente=useRef<number|null>(null);

  const cargar=async()=>{
    setCargando(true); setError("");
    const orden=await supabase.from("ordenes_reparacion").select("presupuesto_mano_obra,taller_id").eq("id",ordenId).maybeSingle();
    if(orden.error){setError(`No se pudo cargar la orden: ${orden.error.message}`);setCargando(false);return;}
    const tallerId=orden.data?.taller_id||TALLER_ID;
    const pr=await supabase.from("productos").select("id,nombre,categoria,marca,modelo,sku,costo,precio,stock_actual,activo").eq("taller_id",tallerId).eq("activo",true).order("nombre",{ascending:true});
    if(pr.error){setError(`No se pudo cargar el inventario: ${pr.error.message}`);setProductos([]);setCargando(false);return;}
    const lista=(pr.data||[]) as Producto[]; setProductos(lista);
    const ir=await supabase.from("presupuesto_reparacion_items").select("id,orden_id,producto_id,nombre_producto,cantidad,precio_unitario,costo_unitario").eq("orden_id",ordenId).order("id",{ascending:true});
    if(ir.error){setError(`No se pudieron cargar los repuestos: ${ir.error.message}`);setItems([]);}else{
      setItems(((ir.data||[]) as Omit<Item,"producto">[]).map(x=>({...x,producto:lista.find(p=>p.id===x.producto_id)||null})));
    }
    setCargando(false);
  };

  useEffect(()=>{if(ordenId>0)void cargar();else{setError("ID de reparación inválido.");setCargando(false);}},[ordenId]);

  const disponibles=useMemo(()=>{const q=busqueda.trim().toLowerCase();return productos.filter(p=>p.stock_actual>0&&(!q||[p.nombre,p.categoria,p.marca,p.modelo,p.sku].filter(Boolean).some(v=>String(v).toLowerCase().includes(q))));},[productos,busqueda]);
  const seleccionado=productos.find(p=>p.id===Number(productoId));
  useEffect(()=>{if(seleccionado)setPrecioVenta(String(seleccionado.precio??0));},[seleccionado]);

  const agregarRepuesto=async()=>{
    scrollPendiente.current=window.scrollY;
    (document.activeElement as HTMLElement|null)?.blur();
    setError("");setMensaje("");
    const p=productos.find(x=>x.id===Number(productoId)); console.log("PRODUCTO SELECCIONADO:", p); const q=Number(cantidad); const precio=Number(precioVenta);
    if(!p){setError("Seleccioná un repuesto del inventario.");return;}
    if(!Number.isInteger(q)||q<=0){setError("La cantidad debe ser un número entero mayor a 0.");return;}
    if(!Number.isFinite(precio)||precio<0){setError("Ingresá un precio de venta válido.");return;}
    const existente=items.find(x=>x.producto_id===p.id); const nueva=(existente?.cantidad||0)+q;
    if(nueva>p.stock_actual){setError(`Stock insuficiente. ${String(p.nombre||"Repuesto")}: ${p.stock_actual} disponible(s).`);return;}
    setGuardando(true);
    try{
      // Leer el producto directamente desde Supabase justo antes de guardar.
      // Esto evita depender de un objeto de estado que pudiera tener nombre null/undefined.
      const productoBD=await supabase.from("productos").select("id,nombre,costo,precio").eq("id",p.id).maybeSingle();
      if(productoBD.error)throw new Error(`No se pudo obtener el producto del inventario: ${productoBD.error.message}`);
      if(!productoBD.data)throw new Error("No se encontró el producto seleccionado en el inventario.");
      const nombreProducto=String(productoBD.data.nombre??"").trim();
      if(!nombreProducto)throw new Error("El producto seleccionado no tiene nombre en el inventario.");
      const costoProducto=Number(productoBD.data.costo??p.costo??0);
      if(!Number.isFinite(costoProducto))throw new Error("El costo del producto no es válido.");

      if(existente){
        const r=await supabase.from("presupuesto_reparacion_items").update({cantidad:nueva,precio_unitario:precio,nombre_producto:nombreProducto}).eq("id",existente.id).select("id,orden_id,producto_id,nombre_producto,cantidad,precio_unitario,costo_unitario").single();
        if(r.error)throw new Error(r.error.message);
        setItems(prev=>prev.map(x=>x.id===existente.id?{...x,...(r.data as Omit<Item,"producto">),producto:p}:x));
      }else{
        const payload={orden_id:ordenId,producto_id:p.id,nombre_producto:nombreProducto,cantidad:q,costo_unitario:costoProducto,precio_unitario:precio};
        const r=await supabase.from("presupuesto_reparacion_items").insert(payload).select("id,orden_id,producto_id,nombre_producto,cantidad,precio_unitario,costo_unitario").single();
        if(r.error)throw new Error(r.error.message);
        setItems(prev=>[...prev,{...(r.data as Omit<Item,"producto">),producto:p}]);
      }
      setProductoId("");setCantidad("1");setPrecioVenta("");setBusqueda("");
      setTimeout(()=>{
        if(scrollPendiente.current!==null){ window.scrollTo(0,scrollPendiente.current); }
      },100);
    }catch(e){setError(`No se pudo guardar el repuesto: ${e instanceof Error?e.message:String(e)}`);}
    finally{setGuardando(false);}
  };

  const eliminarRepuesto=async(id:number)=>{setGuardando(true);setError("");const r=await supabase.from("presupuesto_reparacion_items").delete().eq("id",id);if(r.error)setError(`No se pudo eliminar el repuesto: ${r.error.message}`);else{setItems(prev=>prev.filter(x=>x.id!==id));setMensaje("Repuesto eliminado del presupuesto.");}setGuardando(false);};
  return <main className="min-h-screen bg-[#f5f6f8] text-gray-900"><div className="mx-auto max-w-6xl p-5 md:p-8">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Reparación #{ordenId}</p><p className="text-xs font-bold uppercase tracking-[.14em] text-gray-400">Etapa 2 · Repuestos</p><h1 className="mt-1 text-3xl font-bold text-gray-950">Agregar repuestos</h1><p className="mt-1 text-sm text-gray-500">Seleccioná los repuestos que se incluirán en la reparación.</p></div><div className="flex gap-2"><button onClick={()=>router.push("/")} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm"><Home size={17}/> Inicio</button><button onClick={()=>router.push(`/reparaciones/${ordenId}`)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm"><ArrowLeft size={17}/> Volver</button></div></div>
    {error&&<div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}{mensaje&&<div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"><CheckCircle2 size={18}/>{mensaje}</div>}
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-gray-100 p-3"><Boxes size={21}/></div><div><h2 className="text-lg font-bold">Agregar repuesto</h2><p className="text-xs text-gray-500">Seleccioná un producto del inventario y agregalo al presupuesto.</p></div></div>
      <div className="grid gap-4 lg:grid-cols-[1fr_120px_160px_auto]"><div><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar repuesto..." className="mb-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-black focus:bg-white"/><select value={productoId} onChange={e=>setProductoId(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-black"><option value="">Seleccionar repuesto del inventario</option>{disponibles.map(p=><option key={p.id} value={p.id}>{p.nombre} — stock {p.stock_actual} — {dinero(Number(p.precio||0))}</option>)}</select></div><div><label className="mb-1 block text-xs font-bold text-gray-400">Cantidad</label><input type="number" min="1" value={cantidad} onChange={e=>setCantidad(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm"/></div><div><label className="mb-1 block text-xs font-bold text-gray-400">Precio venta</label><input type="number" min="0" step="0.01" value={precioVenta} onChange={e=>setPrecioVenta(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm"/></div><button type="button" onClick={agregarRepuesto} disabled={guardando||cargando} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{guardando?<Loader2 size={17} className="animate-spin"/>:<Plus size={17}/>} Agregar</button></div>
    </section>
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="border-b border-gray-100 p-6"><h2 className="text-lg font-bold">Repuestos del presupuesto</h2><p className="text-xs text-gray-500">Estos son los repuestos que se incluirán en la reparación.</p></div><div className="p-6">{cargando?<div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={17} className="animate-spin"/> Cargando...</div>:items.length===0?<p className="text-sm text-gray-500">Todavía no agregaste repuestos.</p>:<div className="space-y-3">{items.map(i=><div key={i.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-bold">{i.nombre_producto||i.producto?.nombre||`Producto #${i.producto_id}`}</p><p className="text-xs text-gray-500">Cantidad: {i.cantidad} · Precio: {dinero(Number(i.precio_unitario||0))}</p></div><div className="flex items-center gap-4"><p className="font-bold">{dinero(Number(i.cantidad||0)*Number(i.precio_unitario||0))}</p><button onClick={()=>eliminarRepuesto(i.id)} disabled={guardando} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={17}/></button></div></div>)}</div>}</div></section>
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-gray-400">Etapa 2 · Repuestos</p>
          <h2 className="mt-1 text-xl font-bold">Repuestos del presupuesto</h2>
          <p className="mt-2 text-sm text-gray-500">Cuando termines de cargar los repuestos, continuá a la revisión final del presupuesto.</p>
        </div>
        <button onClick={()=>router.push(`/reparaciones/${ordenId}/revision-presupuesto`)} disabled={guardando} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white">
          Continuar a revisión <ArrowLeft size={17} className="rotate-180"/>
        </button>
      </div>
    </section>
  </div></main>;
}
