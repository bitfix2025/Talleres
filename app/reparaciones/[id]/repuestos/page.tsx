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
import { supabase } from "../../../../../lib/supabase";

const TALLER_ID = 1;

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  modelo: string | null;
  sku: string | null;
  stock_actual: number;
  costo: number | null;
  precio: number | null;
};

type Item = {
  id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  producto?: Producto | null;
};

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
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");

    const [productosRes, itemsRes, ordenRes] = await Promise.all([
      supabase
        .from("productos")
        .select("id,nombre,categoria,modelo,sku,stock_actual,costo,precio")
        .eq("taller_id", TALLER_ID)
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      supabase
        .from("presupuesto_reparacion_items")
        .select("id,producto_id,cantidad,precio_unitario,costo_unitario")
        .eq("orden_id", ordenId)
        .order("id", { ascending: true }),
      supabase
        .from("ordenes_reparacion")
        .select("presupuesto_mano_obra")
        .eq("id", ordenId)
        .maybeSingle(),
    ]);

    if (productosRes.error) {
      setError(productosRes.error.message);
      setCargando(false);
      return;
    }
    if (itemsRes.error) {
      setError(itemsRes.error.message);
      setCargando(false);
      return;
    }
    if (ordenRes.error) {
      setError(ordenRes.error.message);
      setCargando(false);
      return;
    }

    const lista = (productosRes.data ?? []) as Producto[];
    const guardados = (itemsRes.data ?? []) as Item[];
    setProductos(lista);
    setItems(
      guardados.map((i) => ({
        ...i,
        producto: lista.find((p) => p.id === i.producto_id) ?? null,
      }))
    );
    setManoObra(
      ordenRes.data?.presupuesto_mano_obra != null
        ? String(ordenRes.data.presupuesto_mano_obra)
        : ""
    );
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
      return [p.nombre, p.categoria, p.modelo, p.sku]
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

  const agregar = async () => {
    const id = Number(productoId);
    const qty = Number(cantidad);
    const precio = Number(precioVenta);
    const producto = productos.find((p) => p.id === id);

    setMensaje("");
    setError("");

    if (!id || !producto) {
      setError("Seleccioná un repuesto.");
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("La cantidad debe ser un número entero mayor a 0.");
      return;
    }

    const existente = items.find((i) => i.producto_id === id);
    const cantidadFinal = (existente?.cantidad ?? 0) + qty;
    if (cantidadFinal > producto.stock_actual) {
      setError(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}.`
      );
      return;
    }
    if (!Number.isFinite(precio) || precio < 0) {
      setError("Ingresá un precio válido.");
      return;
    }

    setGuardando(true);

    if (existente) {
      const { error: updateError } = await supabase
        .from("presupuesto_reparacion_items")
        .update({
          cantidad: cantidadFinal,
          precio_unitario: precio,
        })
        .eq("id", existente.id);

      if (updateError) {
        setError(updateError.message);
        setGuardando(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("presupuesto_reparacion_items")
        .insert({
          orden_id: ordenId,
          taller_id: TALLER_ID,
          producto_id: id,
          cantidad: qty,
          costo_unitario: producto.costo ?? 0,
          precio_unitario: precio,
        });

      if (insertError) {
        setError(insertError.message);
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

  const eliminar = async (id: number) => {
    setGuardando(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("presupuesto_reparacion_items")
      .delete()
      .eq("id", id);
    if (deleteError) setError(deleteError.message);
    else setMensaje("Repuesto eliminado del presupuesto.");
    setGuardando(false);
    await cargar();
  };

  const guardarManoObra = async () => {
    const valor = Math.max(0, Number(manoObra) || 0);
    setGuardando(true);
    setError("");
    const { error: updateError } = await supabase
      .from("ordenes_reparacion")
      .update({ presupuesto_mano_obra: valor })
      .eq("id", ordenId);
    if (updateError) setError(updateError.message);
    else setMensaje("Mano de obra guardada.");
    setGuardando(false);
  };

  const enviarAprobacion = async () => {
    const mano = Math.max(0, Number(manoObra) || 0);
    if (items.length === 0 && mano <= 0) {
      setError(
        "Agregá al menos un repuesto o una mano de obra antes de enviar el presupuesto."
      );
      return;
    }

    setGuardando(true);
    setError("");

    const { error: manoError } = await supabase
      .from("ordenes_reparacion")
      .update({
        presupuesto_mano_obra: mano,
        estado: "ESPERANDO APROBACIÓN",
      })
      .eq("id", ordenId);

    if (manoError) {
      setError(manoError.message);
      setGuardando(false);
      return;
    }

    setMensaje("Presupuesto guardado. La orden pasó a Esperando aprobación.");
    setGuardando(false);
    setTimeout(() => router.push(`/reparaciones/${ordenId}`), 700);
  };

  const totalRepuestos = items.reduce(
    (t, i) => t + i.cantidad * Number(i.precio_unitario || 0),
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
              Seleccioná repuestos del inventario, agregá mano de obra y enviá el presupuesto a aprobación.
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
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {mensaje && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            <CheckCircle2 size={18} /> {mensaje}
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-gray-100 p-3"><Boxes size={20} /></div>
            <div>
              <h2 className="font-bold">Agregar repuesto</h2>
              <p className="text-xs text-gray-500">
                El stock se consulta, pero no se descuenta al presupuestar.
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_110px_150px_auto]">
            <div>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, modelo o SKU..."
                className="mb-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-black"
              />
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-black"
              >
                <option value="">Seleccionar repuesto</option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · stock {p.stock_actual} · USD {Number(p.precio ?? 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-black"
              placeholder="Cantidad"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-black"
              placeholder="Precio venta"
            />
            <button
              type="button"
              onClick={agregar}
              disabled={guardando || cargando}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {guardando ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
              Agregar
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-bold">Repuestos del presupuesto</h2>
              <p className="text-xs text-gray-500">
                Se descuentan del inventario recién cuando la reparación pasa a En reparación.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Repuestos</p>
              <p className="font-bold">USD {totalRepuestos.toFixed(2)}</p>
            </div>
          </div>

          {cargando ? (
            <div className="py-10 text-center text-sm text-gray-500">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
              Todavía no agregaste repuestos.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-3 py-3">Repuesto</th>
                    <th className="px-3 py-3">Cant.</th>
                    <th className="px-3 py-3">Precio</th>
                    <th className="px-3 py-3">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-b border-gray-50">
                      <td className="px-3 py-4 font-semibold">
                        {i.producto?.nombre ?? `Producto #${i.producto_id}`}
                      </td>
                      <td className="px-3 py-4">{i.cantidad}</td>
                      <td className="px-3 py-4">USD {Number(i.precio_unitario).toFixed(2)}</td>
                      <td className="px-3 py-4 font-semibold">
                        USD {(i.cantidad * Number(i.precio_unitario)).toFixed(2)}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => eliminar(i.id)}
                          disabled={guardando}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-bold">Mano de obra</h2>
              <p className="text-xs text-gray-500">Ingresá el valor de la reparación.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={manoObra}
                onChange={(e) => setManoObra(e.target.value)}
                placeholder="USD"
                className="h-11 w-40 rounded-xl border border-gray-200 px-4 text-sm"
              />
              <button
                type="button"
                onClick={guardarManoObra}
                disabled={guardando}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                <Save size={16} /> Guardar
              </button>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-gray-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">Total del presupuesto</p>
              <p className="mt-2 text-3xl font-bold">USD {total.toFixed(2)}</p>
              <p className="mt-1 text-xs text-gray-400">
                El inventario no se descuenta hasta iniciar la reparación.
              </p>
            </div>
            <button
              type="button"
              onClick={enviarAprobacion}
              disabled={guardando || cargando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-950 hover:bg-gray-100 disabled:opacity-50"
            >
              {guardando ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
              Enviar a aprobación
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
