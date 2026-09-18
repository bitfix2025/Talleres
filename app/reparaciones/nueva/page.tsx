"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound, Smartphone, Plus, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Cliente = { id: string; nombre: string; dni: string | null; telefono: string | null };
type Equipo = { id: string; marca: string | null; modelo: string | null; imei: string | null; numero_serie: string | null; color: string | null; capacidad: string | null; bateria_porcentaje: number | null; cliente_id: string };

export default function NuevaReparacionPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null);
  const [buscarCliente, setBuscarCliente] = useState("");
  const [mostrarClientes, setMostrarClientes] = useState(false);
  const [modoNuevoCliente, setModoNuevoCliente] = useState(false);
  const [modoNuevoEquipo, setModoNuevoEquipo] = useState(false);

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDni, setClienteDni] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [tipoEquipo, setTipoEquipo] = useState<"APPLE"|"OTRA">("APPLE");
  const [marcaOtra, setMarcaOtra] = useState("");
  const [modelo, setModelo] = useState("");
  const [imei, setImei] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [color, setColor] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [bateria, setBateria] = useState("");
  const [contrasenaEquipo, setContrasenaEquipo] = useState("");
  const [fallaReportada, setFallaReportada] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarClientes = async () => {
      const { data, error } = await supabase.from("clientes").select("id,nombre,dni,telefono").order("nombre");
      if (!error) setClientes((data || []) as Cliente[]);
    };
    cargarClientes();
  }, []);

  useEffect(() => {
    if (!clienteSeleccionado) {
      setEquipos([]);
      return;
    }
    const cargarEquipos = async () => {
      const { data } = await supabase.from("equipos").select("id,marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje,cliente_id").eq("cliente_id", clienteSeleccionado.id).order("modelo");
      setEquipos((data || []) as Equipo[]);
    };
    cargarEquipos();
  }, [clienteSeleccionado]);

  const clientesFiltrados = useMemo(() => {
    const q = buscarCliente.trim().toLowerCase();
    if (!q) return clientes.slice(0, 8);
    return clientes.filter(c => `${c.nombre} ${c.dni || ""} ${c.telefono || ""}`.toLowerCase().includes(q)).slice(0, 8);
  }, [clientes, buscarCliente]);

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setClienteNombre(cliente.nombre);
    setClienteDni(cliente.dni || "");
    setClienteTelefono(cliente.telefono || "");
    setBuscarCliente("");
    setMostrarClientes(false);
    setModoNuevoCliente(false);
    setEquipoSeleccionado(null);
    setModoNuevoEquipo(false);
    setError("");
  };

  const prepararNuevoCliente = () => {
    setClienteSeleccionado(null);
    setEquipoSeleccionado(null);
    setEquipos([]);
    setClienteNombre("");
    setClienteDni("");
    setClienteTelefono("");
    setBuscarCliente("");
    setMostrarClientes(false);
    setModoNuevoCliente(true);
    setModoNuevoEquipo(true);
  };

  const prepararNuevoEquipo = () => {
    setEquipoSeleccionado(null);
    setModelo("");
    setImei("");
    setNumeroSerie("");
    setColor("");
    setCapacidad("");
    setBateria("");
    setModoNuevoEquipo(true);
  };

  const seleccionarEquipo = (equipo: Equipo) => {
    setEquipoSeleccionado(equipo);
    setTipoEquipo((equipo.marca || "").toLowerCase() === "apple" ? "APPLE" : "OTRA");
    setMarcaOtra((equipo.marca || "").toLowerCase() === "apple" ? "" : (equipo.marca || ""));
    setModelo(equipo.modelo || "");
    setImei(equipo.imei || "");
    setNumeroSerie(equipo.numero_serie || "");
    setColor(equipo.color || "");
    setCapacidad(equipo.capacidad || "");
    setBateria(equipo.bateria_porcentaje?.toString() || "");
    setModoNuevoEquipo(false);
  };

  const continuar = async () => {
    setError("");
    if (!clienteSeleccionado && !modoNuevoCliente && !clienteNombre.trim()) {
      setError("Seleccioná un cliente existente o creá uno nuevo.");
      return;
    }
    if (!clienteNombre.trim()) { setError("Ingresá el nombre del cliente."); return; }
    if (!modelo.trim()) { setError("Ingresá el modelo del equipo."); return; }
    if (tipoEquipo === "OTRA" && !marcaOtra.trim()) { setError("Ingresá la marca del equipo."); return; }
    if (!fallaReportada.trim()) { setError("Indicá el problema reportado."); return; }

    try {
      setGuardando(true);
      const tallerId = 1;
      let cliente = clienteSeleccionado;

      if (!cliente) {
        let query = supabase.from("clientes").select("id,nombre,dni,telefono").eq("taller_id", tallerId).limit(1);
        if (clienteDni.trim()) query = query.eq("dni", clienteDni.trim());
        else query = query.eq("nombre", clienteNombre.trim());
        const existente = await query.maybeSingle();
        if (existente.error) throw new Error(`No se pudo buscar el cliente: ${existente.error.message}`);

        if (existente.data) {
          cliente = existente.data as Cliente;
          setClienteSeleccionado(cliente);
        } else {
          const creado = await supabase.from("clientes").insert({ taller_id: tallerId, nombre: clienteNombre.trim(), dni: clienteDni.trim(), telefono: clienteTelefono.trim() || null }).select("id,nombre,dni,telefono").single();
          if (creado.error) throw new Error(`No se pudo crear el cliente: ${creado.error.message}`);
          cliente = creado.data as Cliente;
        }
      }

      let equipo = equipoSeleccionado;

      if (!equipo || modoNuevoEquipo) {
        if (imei.trim() || numeroSerie.trim()) {
          let encontrado: any = null;
          if (imei.trim()) {
            const r = await supabase.from("equipos").select("id,marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje,cliente_id").eq("cliente_id", cliente.id).eq("imei", imei.trim()).maybeSingle();
            if (r.error) throw new Error(`No se pudo buscar el equipo: ${r.error.message}`);
            encontrado = r.data;
          }
          if (!encontrado && numeroSerie.trim()) {
            const r = await supabase.from("equipos").select("id,marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje,cliente_id").eq("cliente_id", cliente.id).eq("numero_serie", numeroSerie.trim()).maybeSingle();
            if (r.error) throw new Error(`No se pudo buscar el equipo: ${r.error.message}`);
            encontrado = r.data;
          }
          if (encontrado) equipo = encontrado as Equipo;
        }

        if (!equipo) {
          const bateriaNumero = bateria.trim() ? Number(bateria) : null;
          const creado = await supabase.from("equipos").insert({
            taller_id: tallerId, cliente_id: cliente.id, tipo: "CELULAR", marca: tipoEquipo === "APPLE" ? "Apple" : marcaOtra.trim(),
            modelo: modelo.trim(), imei: imei.trim() || null, numero_serie: numeroSerie.trim() || null,
            color: color.trim() || null, capacidad: capacidad || null, bateria_porcentaje: bateriaNumero,
            observaciones: observaciones.trim() || null,
          }).select("id,marca,modelo,imei,numero_serie,color,capacidad,bateria_porcentaje,cliente_id").single();
          if (creado.error) throw new Error(`No se pudo crear el equipo: ${creado.error.message}`);
          equipo = creado.data as Equipo;
        }
      }

      const orden = await supabase.from("ordenes_reparacion").insert({
        taller_id: tallerId, cliente_id: cliente.id, equipo_id: equipo.id, estado: "RECIBIDO",
        falla_reportada: fallaReportada.trim(), observaciones: observaciones.trim() || null, contrasena_equipo: contrasenaEquipo.trim() || null,
      }).select().single();

      if (orden.error) throw new Error(`No se pudo crear la orden: ${orden.error.message}`);

      const historial = await supabase.from("historial_reparacion").insert({
        orden_id: orden.data.id, tipo: "CREACION", estado_anterior: null, estado_nuevo: "RECIBIDO", descripcion: "Orden de reparación creada.",
      });
      if (historial.error) console.warn("Orden creada, pero no se pudo registrar el historial.", historial.error);

      router.push(`/reparaciones/${orden.data.id}/checklist`);
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la reparación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-5 md:px-7 md:py-7">
      <div className="mx-auto max-w-[1050px]">
        <button onClick={() => router.push("/reparaciones")} className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-green-700"><ArrowLeft size={17}/> Volver a reparaciones</button>

        <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-green-50 to-white p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Recepción</p>
            <h1 className="mt-1 text-3xl font-black">Nueva reparación</h1>
            <p className="mt-2 text-sm text-gray-500">Buscá al cliente y reutilizá su equipo antes de crear registros nuevos.</p>
          </div>

          <div className="p-5 md:p-8">
            <section>
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-black">1. Cliente</h2><p className="mt-1 text-xs text-gray-500">Primero buscá si ya existe.</p></div><UserRound className="text-green-700" size={21}/></div>

              {!clienteSeleccionado && !modoNuevoCliente ? (
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    <input value={buscarCliente} onChange={e => {setBuscarCliente(e.target.value);setMostrarClientes(true)}} onFocus={() => setMostrarClientes(true)} placeholder="Buscar por nombre, DNI o teléfono..." className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"/>
                    {mostrarClientes && clientesFiltrados.length > 0 && <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">{clientesFiltrados.map(c => <button key={c.id} onClick={() => seleccionarCliente(c)} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-green-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700"><UserRound size={16}/></span><span><b className="block text-sm">{c.nombre}</b><small className="text-gray-500">DNI: {c.dni || "Sin DNI"} · {c.telefono || "Sin teléfono"}</small></span></button>)}</div>}
                  </div>
                  <button onClick={prepararNuevoCliente} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-green-700 hover:text-green-800"><Plus size={16}/> Crear nuevo cliente</button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50/50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-green-700"><UserRound size={19}/></div><div><p className="font-bold">{clienteSeleccionado?.nombre || "Nuevo cliente"}</p><p className="text-xs text-gray-500">DNI: {clienteSeleccionado?.dni || clienteDni || "Sin DNI"} · {clienteSeleccionado?.telefono || clienteTelefono || "Sin teléfono"}</p></div></div><button onClick={() => {setClienteSeleccionado(null);setModoNuevoCliente(false);setModoNuevoEquipo(false);setEquipoSeleccionado(null);setEquipos([])}} className="text-xs font-bold text-gray-500 hover:text-green-700">Cambiar</button></div>
                  {modoNuevoCliente && <div className="mt-4 grid gap-3 md:grid-cols-3"><input value={clienteNombre} onChange={e=>setClienteNombre(e.target.value)} placeholder="Nombre completo *" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"/><input value={clienteDni} onChange={e=>setClienteDni(e.target.value)} placeholder="DNI *" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"/><input value={clienteTelefono} onChange={e=>setClienteTelefono(e.target.value)} placeholder="Teléfono *" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"/><input value={contrasenaEquipo} onChange={e=>setContrasenaEquipo(e.target.value)} placeholder="Clave / contraseña del equipo" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"/></div>}
                </div>
              )}
            </section>

            <section className="mt-8 border-t border-gray-100 pt-8">
              <div className="flex items-center justify-between"><div><h2 className="text-lg font-black">2. Equipo</h2><p className="mt-1 text-xs text-gray-500">{clienteSeleccionado ? "Seleccioná uno de sus equipos o agregá uno nuevo." : "Completá los datos del equipo."}</p></div><Smartphone className="text-green-700" size={21}/></div>

              {clienteSeleccionado && !modoNuevoEquipo && equipos.length > 0 && !equipoSeleccionado ? (
                <div className="mt-4 space-y-2">{equipos.map(e => <button key={e.id} onClick={() => seleccionarEquipo(e)} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 p-4 text-left hover:border-green-300 hover:bg-green-50/40"><div><p className="font-bold">{e.marca ? e.marca + " " : ""}{e.modelo}</p><p className="mt-1 text-xs text-gray-500">{e.imei ? "IMEI: " + e.imei : "IMEI no registrado"}{e.bateria_porcentaje != null ? " · Batería " + e.bateria_porcentaje + "%" : ""}</p></div><span className="text-xs font-bold text-green-700">Usar equipo →</span></button>)}<button onClick={prepararNuevoEquipo} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-green-300 p-4 text-sm font-bold text-green-700 hover:bg-green-50"><Plus size={17}/> Agregar otro equipo</button></div>
              ) : (
                <div className="mt-4">
                  {equipoSeleccionado && !modoNuevoEquipo && <div className="mb-4 flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 p-4"><div><p className="font-bold">{equipoSeleccionado.marca} {equipoSeleccionado.modelo}</p><p className="mt-1 text-xs text-gray-500">Equipo existente · su historial quedará asociado</p></div><button onClick={() => setEquipoSeleccionado(null)} className="text-xs font-bold text-gray-500">Cambiar</button></div>}
                  {(modoNuevoEquipo || !equipoSeleccionado) && <div><div className="mb-4 grid gap-3 md:grid-cols-2"><div><label className="mb-2 block text-xs font-bold uppercase text-gray-500">Tipo de equipo</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setTipoEquipo("APPLE")} className={`rounded-xl border px-4 py-3 text-sm font-bold ${tipoEquipo==="APPLE"?"border-green-500 bg-green-50 text-green-700":"border-gray-200 bg-white"}`}>Apple</button><button type="button" onClick={()=>setTipoEquipo("OTRA")} className={`rounded-xl border px-4 py-3 text-sm font-bold ${tipoEquipo==="OTRA"?"border-green-500 bg-green-50 text-green-700":"border-gray-200 bg-white"}`}>Otra marca</button></div></div>{tipoEquipo==="OTRA"&&<input value={marcaOtra} onChange={e=>setMarcaOtra(e.target.value)} placeholder="Marca · Samsung, Xiaomi, Motorola..." className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/></div><div className="grid gap-3 md:grid-cols-2">
                    <input value={modelo} onChange={e=>setModelo(e.target.value)} placeholder="Modelo * · Ej: iPhone 15 Pro Max" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/>
                    <input value={imei} onChange={e=>setImei(e.target.value)} placeholder="IMEI" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/>
                    <input value={numeroSerie} onChange={e=>setNumeroSerie(e.target.value)} placeholder="Número de serie" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/>
                    <input value={color} onChange={e=>setColor(e.target.value)} placeholder="Color" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/>
                    <select value={capacidad} onChange={e=>setCapacidad(e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"><option value="">Capacidad</option><option>64 GB</option><option>128 GB</option><option>256 GB</option><option>512 GB</option><option>1 TB</option><option>2 TB</option></select>
                    <input type="number" min="0" max="100" value={bateria} onChange={e=>setBateria(e.target.value)} placeholder="Salud de batería %" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/>
                  </div>}
                </div>
              )}
            </section>

            <section className="mt-8 border-t border-gray-100 pt-8">
              <div className="flex items-center gap-2"><h2 className="text-lg font-black">3. Motivo del ingreso</h2><AlertTriangle className="text-amber-500" size={19}/></div>
              <div className="mt-4 grid gap-3"><textarea value={fallaReportada} onChange={e=>setFallaReportada(e.target.value)} rows={4} placeholder="Problema reportado por el cliente *" className="resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/><textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} rows={3} placeholder="Observaciones: golpes, rayones, accesorios entregados, etc." className="resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white"/></div>
            </section>

            {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
              <button onClick={() => router.push("/reparaciones")} disabled={guardando} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={continuar} disabled={guardando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-700 disabled:opacity-50">{guardando ? "Guardando..." : <><CheckCircle2 size={17}/> Continuar al checklist</>}</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}