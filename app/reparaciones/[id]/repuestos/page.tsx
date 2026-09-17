"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Boxes, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../../../../lib/supabase";

const TALLER_ID = 1;

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  modelo: string | null;
  sku: string | null;
  stock_actual: number;
  costo: number;
  precio: number;
};

type Repuesto = {
  id: number;
  producto_id: number;
  cantidad: number;
  costo_unitario: number;
  created_at: string;
  producto?: Producto | null;
};

export default function RepuestosReparacionPage() {
  const params = useParams();
  const router = useRouter();
  const ordenId = Number(String(params.id));

  const [productos, setProductos] = useState<Producto[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    setError("");

    const [{ data: productosData, error: productosError }, { data: repuestosData, error: repuestosError }] = await Promise.all([
      supabase
        .from("productos")
        .select("id,nombre,categoria,modelo,sku,stock_actual,costo,precio")
        .eq("taller_id", TALLER_ID)
        .eq("activo", true)
        .order("nombre", { ascending: true }),
      supabase
        .from("reparacion_repuestos")
        .select("id,producto_id,cantidad,costo_unitario,created_at")
        .eq("orden_id", ordenId)
        .order("created_at", { ascending: false }),
    ]);

    if (productosError) setError(productosError.message);
    if (repuestosError) setError(repuestosError.message);

    const listaProductos = (productosData ?? []) as Producto[];
    const listaRepuestos = (repuestosData ?? []) as Repuesto[];

    setProductos(listaProductos);
    setRepuestos(
      listaRepuestos.map((r) => ({
        ...r,
        producto: listaProductos.find((p) => p.id === r.producto_id) ?? null,
      }))
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

  const usarRepuesto = async () => {
    const id = Number(productoId);
    const qty = Number(cantidad);
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
    if (qty > producto.stock_actual) {
      setError(`Stock insuficiente. Disponible: ${producto.stock_actual}.`);
      return;
    }

    setGuardando(true);

    const { error: rpcError } = await supabase.rpc("usar_repuesto_reparacion", {
      p_orden_id: ordenId,
      p_producto_id: id,
      p_cantidad: qty,
    });

    if (rpcError) {
      setError(rpcError.message);
      setGuardando(false);
      return;
    }

    setProductoId("");
    setCantidad("1");
    setBusqueda("");
    setMensaje(`${producto.nombre} agregado y descontado del inventario.`);
    setGuardando(false);
    await cargar();
  };

  const totalCosto = repuestos.reduce(
    (total, r) => total + r.cantidad * Number(r.costo_unitario || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
      <div className="mx-auto max-w-5xl p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Reparación #{ordenId}</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">Repuestos utilizados</h1>
            <p className="mt-1 text-sm text-gray-500">Cada repuesto utilizado se descuenta automáticamente del inventario.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/reparaciones/${ordenId}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft size={17} /> Volver a la reparación
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        {mensaje && <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"><CheckCircle2 size={18} />{mensaje}</div>}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-gray-100 p-3"><Boxes size={20} /></div>
            <div>
              <h2 className="font-bold">Usar un repuesto</h2>
              <p className="text-xs text-gray-500">El stock se descuenta al confirmar.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_110px_auto]">
            <div>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar repuesto..."
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
                    {p.nombre} · stock {p.stock_actual}
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
            <button
              type="button"
              onClick={usarRepuesto}
              disabled={guardando || cargando}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {guardando ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
              Usar repuesto
            </button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-bold">Repuestos de esta reparación</h2>
              <p className="text-xs text-gray-500">Historial de salidas asociadas a la orden.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Costo de repuestos</p>
              <p className="font-bold">USD {totalCosto.toFixed(2)}</p>
            </div>
          </div>

          {cargando ? (
            <div className="py-10 text-center text-sm text-gray-500">Cargando...</div>
          ) : repuestos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">Todavía no se utilizaron repuestos en esta reparación.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-3 py-3">Repuesto</th>
                    <th className="px-3 py-3">Cantidad</th>
                    <th className="px-3 py-3">Costo unitario</th>
                    <th className="px-3 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {repuestos.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-3 py-4 font-semibold">{r.producto?.nombre ?? `Producto #${r.producto_id}`}</td>
                      <td className="px-3 py-4">{r.cantidad}</td>
                      <td className="px-3 py-4">USD {Number(r.costo_unitario).toFixed(2)}</td>
                      <td className="px-3 py-4 font-semibold">USD {(r.cantidad * Number(r.costo_unitario)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
