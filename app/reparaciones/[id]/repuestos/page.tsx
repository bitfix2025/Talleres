"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Home,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase";

const TALLER_ID = 1;

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  sku: string | null;
  costo: number | null;
  precio: number | null;
  stock_actual: number;
  activo: boolean;
};

type Item = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  producto: Producto | null;
};

const dinero = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);

export default function RepuestosReparacionPage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = Number(String(params.id));

  const [productos, setProductos] = useState<Producto[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precioVenta, setPrecioVenta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [manoObra, setManoObra] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");

    const productosRes = await supabase
      .from("productos")
      .select(
        "id,nombre,categoria,marca,modelo,sku,costo,precio,stock_actual,activo"
      )
      .eq("taller_id", TALLER_ID)
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (productosRes.error) {
      setError(`No se pudo cargar el inventario: ${productosRes.error.message}`);
      setProductos([]);
      setCargando(false);
      return;
    }

    const lista = (productosRes.data ?? []) as Producto[];
    setProductos(lista);

    const itemsRes = await supabase
      .from("presupuesto_reparacion_items")
      .select("id,producto_id,cantidad,precio_unitario,costo_unitario")
      .eq("orden_id", ordenId)
      .order("id", { ascending: true });

    if (itemsRes.error) {
      setError(
        `No se pudo cargar el presupuesto. Si es la primera vez que usás esta función, ejecutá la migración de presupuesto en Supabase. Detalle: ${itemsRes.error.message}`
      );
      setItems([]);
    } else {
      setItems(
        ((itemsRes.data ?? []) as Omit<Item, "producto">[]).map((item) => ({
          ...item,
          producto: lista.find((p) => p.id === item.producto_id) ?? null,
        }))
      );
    }

    const ordenRes = await supabase
      .from("ordenes_reparacion")
      .select("presupuesto_mano_obra")
      .eq("id", ordenId)
      .maybeSingle();

    if (!ordenRes.error) {
      setManoObra(
        ordenRes.data?.presupuesto_mano_obra != null
          ? String(ordenRes.data.presupuesto_mano_obra)
          : ""
      );
    }

    setCargando(false);
  };

  useEffect(() => {
    if (!ordenId || Number.isNaN(ordenId)) {
      setError("ID de reparación inválido.");
      setCargando(false);
      return;
    }
    void cargar();
  }, [ordenId]);

  const disponibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((p) => {
      if (p.stock_actual <= 0) return false;
      if (!texto) return true;

      return [p.nombre, p.categoria, p.marca, p.modelo, p.sku]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(texto));
    });
  }, [productos, busqueda]);

  const productoSeleccionado = productos.find(
    (p) => p.id === Number(productoId)
  );

  useEffect(() => {
    if (productoSeleccionado) {
      setPrecioVenta(String(productoSeleccionado.precio ?? 0));
    }
  }, [productoSeleccionado]);

  const agregarRepuesto = async () => {
    setError("");
    setMensaje("");

    const producto = productos.find((p) => p.id === Number(productoId));
    const qty = Number(cantidad);
    const precio = Number(precioVenta);

    if (!producto) {
      setError("Seleccioná un repuesto del inventario.");
      return;
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("La cantidad debe ser un número entero mayor a 0.");
      return;
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setError("Ingresá un precio de venta válido.");
      return;
    }

    const existente = items.find((i) => i.producto_id === producto.id);
    const nuevaCantidad = (existente?.cantidad ?? 0) + qty;

    if (nuevaCantidad > producto.stock_actual) {
      setError(
        `Stock insuficiente. ${producto.nombre} tiene ${producto.stock_actual} unidad(es) disponibles.`
      );
      return;
    }

    setGuardando(true);

    if (existente) {
      const { error: e } = await supabase
        .from("presupuesto_reparacion_items")
        .update({
          cantidad: nuevaCantidad,
          precio_unitario: precio,
        })
        .eq("id", existente.id);

      if (e) {
        setError(`No se pudo actualizar el repuesto: ${e.message}`);
        setGuardando(false);
        return;
      }
    } else {
      const { error: e } = await supabase
        .from("presupuesto_reparacion_items")
        .insert({
          taller_id: TALLER_ID,
          orden_id: ordenId,
          producto_id: producto.id,
          cantidad: qty,
          costo_unitario: Number(producto.costo ?? 0),
          precio_unitario: precio,
        });

      if (e) {
        setError(`No se pudo agregar el repuesto: ${e.message}`);
        setGuardando(false);
        return;
      }
    }

    setProductoId("");
    setCantidad("1");
    setPrecioVenta("");
    setBusqueda("");
    setMensaje(`${producto.nombre} agregado al presupuesto.`);
    setGuardando(false);
    await cargar();
  };

  const eliminarRepuesto = async (id: number) => {
    setGuardando(true);
    setError("");

    const { error: e } = await supabase
      .from("presupuesto_reparacion_items")
      .delete()
      .eq("id", id);

    if (e) setError(`No se pudo eliminar el repuesto: ${e.message}`);
    else setMensaje("Repuesto eliminado del presupuesto.");

    setGuardando(false);
    await cargar();
  };

  const guardarManoObra = async () => {
    const valor = Math.max(0, Number(manoObra) || 0);

    setGuardando(true);
    setError("");

    const { error: e } = await supabase
      .from("ordenes_reparacion")
      .update({ presupuesto_mano_obra: valor })
      .eq("id", ordenId);

    if (e) setError(`No se pudo guardar la mano de obra: ${e.message}`);
    else setMensaje("Mano de obra guardada.");

    setGuardando(false);
  };

  const guardarPresupuesto = async () => {
    if (items.length === 0 && Number(manoObra) <= 0) {
      setError("Agregá al menos un repuesto o una mano de obra.");
      return;
    }

    setGuardando(true);
    setError("");

    const mano = Math.max(0, Number(manoObra) || 0);

    const { error: e } = await supabase
      .from("ordenes_reparacion")
      .update({
        presupuesto_mano_obra: mano,
        estado: "PRESUPUESTADO",
      })
      .eq("id", ordenId);

    if (e) {
      setError(`No se pudo guardar el presupuesto: ${e.message}`);
      setGuardando(false);
      return;
    }

    setMensaje("Presupuesto guardado correctamente.");
    setGuardando(false);
  };

  const enviarAprobacion = async () => {
    if (items.length === 0 && Number(manoObra) <= 0) {
      setError("El presupuesto está vacío. Agregá repuestos o mano de obra.");
      return;
    }

    setGuardando(true);
    setError("");

    const mano = Math.max(0, Number(manoObra) || 0);

    const { error: e } = await supabase
      .from("ordenes_reparacion")
      .update({
        presupuesto_mano_obra: mano,
        estado: "ESPERANDO APROBACIÓN",
      })
      .eq("id", ordenId);

    if (e) {
      setError(`No se pudo enviar el presupuesto: ${e.message}`);
      setGuardando(false);
      return;
    }

    setMensaje("Presupuesto enviado a aprobación.");
    setGuardando(false);

    setTimeout(() => {
      router.push(`/reparaciones/${ordenId}`);
    }, 700);
  };

  const totalRepuestos = items.reduce(
    (total, item) =>
      total + Number(item.cantidad || 0) * Number(item.precio_unitario || 0),
    0
  );

  const total = totalRepuestos + (Number(manoObra) || 0);

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
      <div className="mx-auto max-w-6xl p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
              Reparación #{ordenId}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">
              Presupuesto y repuestos
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Cargá los repuestos del inventario, cantidad, precio y mano de obra.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-gray-50"
            >
              <Home size={17} /> Inicio
            </button>
            <button
              type="button"
              onClick={() => router.push(`/reparaciones/${ordenId}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft size={17} /> Volver
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            <CheckCircle2 size={18} />
            {mensaje}
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-gray-100 p-3">
              <Boxes size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Agregar repuesto</h2>
              <p className="text-xs text-gray-500">
                El stock se reserva en el presupuesto y se descontará cuando corresponda en la reparación.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_120px_160px_auto]">
            <div>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar repuesto por nombre, modelo, marca o SKU..."
                className="mb-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-black focus:bg-white"
              />
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-black"
              >
                <option value="">Seleccionar repuesto del inventario</option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — stock {p.stock_actual} — {dinero(Number(p.precio ?? 0))}
                  </option>
                ))}
              </select>
              {!cargando && disponibles.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  No hay repuestos con stock disponible que coincidan con la búsqueda.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-400">Cantidad</label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-400">Precio de venta</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-black"
                placeholder="0.00"
              />
            </div>

            <button
              type="button"
              onClick={agregarRepuesto}
              disabled={guardando || cargando}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 lg:mt-5"
            >
              {guardando ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
              Agregar
            </button>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Repuestos del presupuesto</h2>
                <p className="text-xs text-gray-500">Podés agregar varios repuestos a la misma reparación.</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                {items.length} ítem{items.length === 1 ? "" : "s"}
              </span>
            </div>

            {cargando ? (
              <div className="flex min-h-40 items-center justify-center text-sm text-gray-500">
                <Loader2 className="mr-2 animate-spin" size={20} /> Cargando presupuesto...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-5 py-12 text-center">
                <Boxes className="mx-auto text-gray-300" size={32} />
                <p className="mt-3 text-sm font-semibold text-gray-600">Todavía no hay repuestos.</p>
                <p className="mt-1 text-xs text-gray-400">Seleccioná uno arriba para agregarlo al presupuesto.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-950">
                        {item.producto?.nombre ?? `Producto #${item.producto_id}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Cantidad: {item.cantidad} · Precio unitario: {dinero(item.precio_unitario)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <p className="font-bold">{dinero(item.cantidad * item.precio_unitario)}</p>
                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() => eliminarRepuesto(item.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Resumen</p>

            <div className="mt-5 space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-4 text-sm">
                <span className="text-gray-500">Repuestos</span>
                <span className="font-bold">{dinero(totalRepuestos)}</span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Mano de obra
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manoObra}
                    onChange={(e) => setManoObra(e.target.value)}
                    placeholder="0.00"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={guardarManoObra}
                    disabled={guardando}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 hover:bg-gray-50 disabled:opacity-50"
                    title="Guardar mano de obra"
                  >
                    <Save size={17} />
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-gray-950 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Total</p>
                <p className="mt-2 text-3xl font-bold">{dinero(total)}</p>
              </div>

              <button
                type="button"
                onClick={guardarPresupuesto}
                disabled={guardando || cargando}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
              >
                {guardando ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                Guardar presupuesto
              </button>

              <button
                type="button"
                onClick={enviarAprobacion}
                disabled={guardando || cargando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {guardando ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                Enviar a aprobación
              </button>

              <p className="text-center text-[11px] leading-5 text-gray-400">
                El repuesto no se descuenta del inventario al presupuestar. El descuento se hará en la etapa de reparación.
              </p>
            </div>
          </section>
        </div>

        <div className="py-8 text-center text-[11px] font-semibold tracking-wide text-gray-400">
          BITFIX TALLER · Presupuesto de reparación
        </div>
      </div>
    </main>
  );
}
