
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Search,
  Loader2,
  X,
  Check,
  AlertTriangle,
  ShoppingCart,
  User,
  DollarSign,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  Building2,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";

const TALLER_ID = 1;

type Proveedor = {
  id: number;
  taller_id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  activo: boolean;
  created_at: string;
};

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock_actual: number;
};

type DetalleForm = {
  producto_id: number | null;
  producto_nombre: string;
  categoria: string;
  cantidad: number;
  precio_unitario: number;
};

type OrdenCompraDetalle = {
  id: number;
  orden_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  cantidad_recibida: number;
  producto?: Producto;
};

type OrdenCompra = {
  id: number;
  taller_id: number;
  numero: string;
  proveedor_id: number;
  estado: "PENDIENTE" | "RECIBIDA" | "CANCELADA";
  fecha: string;
  total: number;
  created_at: string;
  proveedor?: Proveedor;
  detalles?: OrdenCompraDetalle[];
};

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor);

export default function ComprasPage() {
  const [tab, setTab] = useState<"ordenes" | "proveedores">("ordenes");

  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<
    "TODAS" | "PENDIENTE" | "RECIBIDA"
  >("TODAS");

  const [mostrarNuevaOrden, setMostrarNuevaOrden] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] =
    useState<number | null>(null);

  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [guardandoOrden, setGuardandoOrden] = useState(false);

  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false);

  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
  });

  const [guardandoProveedor, setGuardandoProveedor] = useState(false);

  const [ordenSeleccionada, setOrdenSeleccionada] =
    useState<OrdenCompra | null>(null);

  const [cantidadesRecibidas, setCantidadesRecibidas] = useState<
    Record<number, number>
  >({});

  const [guardandoRecepcion, setGuardandoRecepcion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const { data: ordenesData, error: errorOrdenes } = await supabase
        .from("ordenes_compra")
        .select(
          `
          *,
          proveedor:proveedor_id(
            id,
            nombre,
            email,
            telefono,
            direccion,
            ciudad,
            activo,
            created_at,
            taller_id
          ),
          detalles:ordenes_compra_detalles(
            id,
            orden_id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            cantidad_recibida,
            producto:producto_id(
              id,
              nombre,
              precio,
              stock_actual
            )
          )
        `
        )
        .eq("taller_id", TALLER_ID)
        .order("created_at", { ascending: false });

      if (errorOrdenes) {
        throw new Error(
          `Error cargando órdenes: ${errorOrdenes.message}`
        );
      }

      setOrdenes((ordenesData as OrdenCompra[]) || []);

      const { data: proveedoresData, error: errorProveedores } =
        await supabase
          .from("proveedores")
          .select("*")
          .eq("taller_id", TALLER_ID)
          .eq("activo", true)
          .order("nombre", { ascending: true });

      if (errorProveedores) {
        throw new Error(
          `Error cargando proveedores: ${errorProveedores.message}`
        );
      }

      setProveedores((proveedoresData as Proveedor[]) || []);

      const { data: productosData, error: errorProductos } =
        await supabase
          .from("productos")
          .select("id, nombre, precio, stock_actual")
          .eq("taller_id", TALLER_ID)
          .eq("activo", true)
          .order("nombre", { ascending: true });

      if (errorProductos) {
        throw new Error(
          `Error cargando productos: ${errorProductos.message}`
        );
      }

      setProductos((productosData as Producto[]) || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar datos"
      );
    } finally {
      setCargando(false);
    }
  };

  const crearProveedor = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!nuevoProveedor.nombre.trim()) {
      setError("El nombre del proveedor es obligatorio");
      return;
    }

    setGuardandoProveedor(true);
    setError("");

    try {
      const { data, error: errorInsert } = await supabase
        .from("proveedores")
        .insert({
          taller_id: TALLER_ID,
          nombre: nuevoProveedor.nombre.trim(),
          email: nuevoProveedor.email.trim() || null,
          telefono: nuevoProveedor.telefono.trim() || null,
          direccion: nuevoProveedor.direccion.trim() || null,
          ciudad: nuevoProveedor.ciudad.trim() || null,
          activo: true,
        })
        .select()
        .single();

      if (errorInsert) {
        throw errorInsert;
      }

      setProveedores((prev) =>
        [...prev, data as Proveedor].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        )
      );

      setMostrarNuevoProveedor(false);

      setNuevoProveedor({
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
      });

      setMensaje("Proveedor creado correctamente");

      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al crear proveedor"
      );
    } finally {
      setGuardandoProveedor(false);
    }
  };

  const crearOrden = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!proveedorSeleccionado) {
      setError("Selecciona un proveedor");
      return;
    }

    if (detalles.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }

    setGuardandoOrden(true);
    setError("");

    try {
      const { data: ultimaOrden, error: errorUltimaOrden } =
        await supabase
          .from("ordenes_compra")
          .select("numero")
          .eq("taller_id", TALLER_ID)
          .order("numero", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (errorUltimaOrden) {
        throw errorUltimaOrden;
      }

      const numeroActual = ultimaOrden?.numero
        ? parseInt(
            ultimaOrden.numero.split("-")[1] || "0",
            10
          )
        : 0;

      const nuevoNumero = `OC-${String(
        numeroActual + 1
      ).padStart(5, "0")}`;

      const total = detalles.reduce(
        (sum, detalle) =>
          sum +
          detalle.cantidad * detalle.precio_unitario,
        0
      );

      const { data: orden, error: errorOrden } =
        await supabase
          .from("ordenes_compra")
          .insert({
            taller_id: TALLER_ID,
            numero: nuevoNumero,
            proveedor_id: proveedorSeleccionado,
            estado: "PENDIENTE",
            fecha: new Date()
              .toISOString()
              .split("T")[0],
            total,
          })
          .select()
          .single();

      if (errorOrden) {
        throw new Error(
          `Error creando orden: ${errorOrden.message}`
        );
      }

      if (!orden) {
        throw new Error(
          "La orden se creó pero Supabase no devolvió el registro."
        );
      }

      const filasDetalles: {
        orden_id: number;
        producto_id: number;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
        cantidad_recibida: number;
      }[] = [];

      for (const detalle of detalles) {
        let productoId: number | null =
          detalle.producto_id;

        if (productoId === null) {
          const nombreNuevo =
            detalle.producto_nombre.trim();

          if (!nombreNuevo) {
            throw new Error(
              "El producto nuevo no tiene nombre."
            );
          }

          const { data: nuevoProducto, error: errorProducto } =
            await supabase
              .from("productos")
              .insert({
                taller_id: TALLER_ID,
                nombre: nombreNuevo,
                categoria:
                  detalle.categoria || "OTROS",
                marca: null,
                modelo: null,
                sku: null,
                descripcion: null,
                costo: detalle.precio_unitario,
                precio: detalle.precio_unitario,
                stock_actual: 0,
                stock_minimo: 0,
                activo: true,
              })
              .select()
              .single();

          if (errorProducto) {
            throw new Error(
              `Error creando producto "${nombreNuevo}": ${errorProducto.message}`
            );
          }

          if (!nuevoProducto?.id) {
            throw new Error(
              `No se pudo obtener el ID del producto "${nombreNuevo}".`
            );
          }

          productoId = Number(nuevoProducto.id);

          setProductos((prev) =>
            [...prev, nuevoProducto as Producto].sort(
              (a, b) =>
                a.nombre.localeCompare(b.nombre)
            )
          );
        }

        const productoIdFinal = Number(productoId);

        if (
          !Number.isFinite(productoIdFinal) ||
          productoIdFinal <= 0
        ) {
          throw new Error(
            `ID de producto inválido para "${detalle.producto_nombre}".`
          );
        }

        filasDetalles.push({
          orden_id: Number(orden.id),
          producto_id: productoIdFinal,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal:
            detalle.cantidad *
            detalle.precio_unitario,
          cantidad_recibida: 0,
        });
      }

      const { error: errorDetalles } =
        await supabase
          .from("ordenes_compra_detalles")
          .insert(filasDetalles);

      if (errorDetalles) {
        throw new Error(
          `Error creando detalles de la orden: ${errorDetalles.message}`
        );
      }

      await cargarDatos();

      setMostrarNuevaOrden(false);
      setProveedorSeleccionado(null);
      setDetalles([]);

      setMensaje(
        "Orden de compra creada: " + nuevoNumero
      );

      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al crear orden"
      );
    } finally {
      setGuardandoOrden(false);
    }
  };

  const recibirOrden = async () => {
    if (!ordenSeleccionada) return;

    setGuardandoRecepcion(true);
    setError("");

    try {
      const {
        error: errorRecepcion,
      } = await supabase.rpc(
        "recibir_orden_compra",
        {
          p_orden_id: ordenSeleccionada.id,
        }
      );

      if (errorRecepcion) {
        throw errorRecepcion;
      }

      await cargarDatos();

      setOrdenSeleccionada(null);
      setCantidadesRecibidas({});

      setMensaje(
        "Orden recibida correctamente"
      );

      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al recibir orden"
      );
    } finally {
      setGuardandoRecepcion(false);
    }
  };

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((orden) => {
      const texto = busqueda
        .trim()
        .toLowerCase();

      const coincideBusqueda =
        !texto ||
        orden.numero
          .toLowerCase()
          .includes(texto) ||
        (orden.proveedor?.nombre || "")
          .toLowerCase()
          .includes(texto);

      const coincideFiltro =
        filtro === "TODAS" ||
        orden.estado === filtro;

      return (
        coincideBusqueda &&
        coincideFiltro
      );
    });
  }, [ordenes, busqueda, filtro]);

  const estadisticas = useMemo(() => {
    const pendientes = ordenes.filter(
      (o) => o.estado === "PENDIENTE"
    ).length;

    const recibidas = ordenes.filter(
      (o) => o.estado === "RECIBIDA"
    ).length;

    const totalGastado = ordenes
      .filter((o) => o.estado === "RECIBIDA")
      .reduce(
        (sum, o) => sum + Number(o.total || 0),
        0
      );

    const totalOrdenes = ordenes.length;

    return {
      pendientes,
      recibidas,
      totalGastado,
      totalOrdenes,
    };
  }, [ordenes]);

  const totalNuevaOrden = detalles.reduce(
    (sum, detalle) =>
      sum +
      detalle.cantidad *
        detalle.precio_unitario,
    0
  );

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#f4f7f5]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-500 shadow-sm">
            <Loader2
              size={20}
              className="animate-spin text-[#18a66b]"
            />
            Cargando compras...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#17201b]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#18a66b]">
              <ShoppingCart size={14} />
              Gestión de compras
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Compras
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Administra órdenes de compra, recepción de mercadería
              y proveedores desde un solo lugar.
            </p>
          </div>

          {tab === "ordenes" && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setMostrarNuevaOrden(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Nueva orden
            </button>
          )}

          {tab === "proveedores" && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setMostrarNuevoProveedor(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Nuevo proveedor
            </button>
          )}
        </div>

        {mensaje && (
          <div className="fixed right-4 top-5 z-[100] flex items-center gap-2 rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-xl">
            <CheckCircle2 size={17} />
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Cerrar error"
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="mt-7 flex gap-1 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("ordenes")}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition ${
              tab === "ordenes"
                ? "text-[#18a66b]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <ShoppingCart size={16} />
            Órdenes de compra

            {tab === "ordenes" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full bg-[#18a66b]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("proveedores")}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition ${
              tab === "proveedores"
                ? "text-[#18a66b]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <User size={16} />
            Proveedores

            {tab === "proveedores" && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full bg-[#18a66b]" />
            )}
          </button>
        </div>

        {tab === "ordenes" && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<ShoppingCart size={18} />}
                label="Total de órdenes"
                value={String(estadisticas.totalOrdenes)}
                helper="Órdenes registradas"
                iconClass="bg-[#e9f8f1] text-[#18a66b]"
              />

              <StatCard
                icon={<Clock size={18} />}
                label="Pendientes"
                value={String(estadisticas.pendientes)}
                helper="Esperando recepción"
                iconClass="bg-amber-50 text-amber-600"
              />

              <StatCard
                icon={<CheckCircle2 size={18} />}
                label="Recibidas"
                value={String(estadisticas.recibidas)}
                helper="Órdenes completadas"
                iconClass="bg-green-50 text-green-600"
              />

              <StatCard
                icon={<DollarSign size={18} />}
                label="Total gastado"
                value={moneda(estadisticas.totalGastado)}
                helper="Compras recibidas"
                iconClass="bg-blue-50 text-blue-600"
              />
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-black text-gray-950">
                      Órdenes de compra
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Consulta y controla el estado de tus compras.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative w-full sm:w-72">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        value={busqueda}
                        onChange={(e) =>
                          setBusqueda(e.target.value)
                        }
                        placeholder="Buscar orden o proveedor..."
                        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] pl-10 pr-4 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
                      />
                    </div>

                    <div className="flex rounded-xl bg-[#f4f7f5] p-1">
                      {[
                        ["TODAS", "Todas"],
                        ["PENDIENTE", "Pendientes"],
                        ["RECIBIDA", "Recibidas"],
                      ].map(([valor, etiqueta]) => (
                        <button
                          key={valor}
                          type="button"
                          onClick={() =>
                            setFiltro(
                              valor as typeof filtro
                            )
                          }
                          className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${
                            filtro === valor
                              ? "bg-white text-[#148f5c] shadow-sm"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {ordenesFiltradas.length === 0 ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e9f8f1]">
                    <ShoppingCart
                      size={28}
                      className="text-[#18a66b]"
                    />
                  </div>

                  <h2 className="mt-5 text-base font-black text-gray-900">
                    No hay órdenes para mostrar
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">
                    {busqueda
                      ? "No encontramos órdenes que coincidan con tu búsqueda."
                      : "Crea tu primera orden de compra para comenzar a gestionar tus compras."}
                  </p>

                  {!busqueda && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setMostrarNuevaOrden(true);
                      }}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#148f5c]"
                    >
                      <Plus size={15} />
                      Nueva orden
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ordenesFiltradas.map((orden) => {
                    const productosOrden =
                      orden.detalles?.length || 0;

                    const pendiente =
                      orden.estado === "PENDIENTE";

                    return (
                      <div
                        key={orden.id}
                        className="group p-5 transition hover:bg-[#fbfdfc]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                pendiente
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-[#e9f8f1] text-[#18a66b]"
                              }`}
                            >
                              {pendiente ? (
                                <Clock size={20} />
                              ) : (
                                <CheckCircle2 size={20} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-black text-gray-950">
                                  {orden.numero}
                                </h3>

                                <StatusBadge
                                  estado={orden.estado}
                                />
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <Building2 size={13} />
                                  {orden.proveedor?.nombre ||
                                    "Sin proveedor"}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays size={13} />
                                  {new Date(
                                    orden.fecha
                                  ).toLocaleDateString(
                                    "es-AR"
                                  )}
                                </span>

                                <span className="inline-flex items-center gap-1.5">
                                  <Package size={13} />
                                  {productosOrden}{" "}
                                  {productosOrden === 1
                                    ? "producto"
                                    : "productos"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-5 border-t border-gray-100 pt-4 lg:min-w-[280px] lg:border-t-0 lg:pt-0">
                            <div className="text-left lg:text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Total
                              </p>

                              <p className="mt-1 text-lg font-black text-gray-950">
                                {moneda(orden.total)}
                              </p>
                            </div>

                            {pendiente ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrdenSeleccionada(
                                    orden
                                  );

                                  const inicial: Record<
                                    number,
                                    number
                                  > = {};

                                  orden.detalles?.forEach(
                                    (detalle) => {
                                      inicial[
                                        detalle.id
                                      ] =
                                        detalle.cantidad;
                                    }
                                  );

                                  setCantidadesRecibidas(
                                    inicial
                                  );
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#148f5c]"
                              >
                                <Eye size={15} />
                                Recibir
                              </button>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f7f5] text-gray-400">
                                <ArrowUpRight size={17} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {tab === "proveedores" && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-black text-gray-950">
                    Proveedores
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    Gestiona los proveedores utilizados en tus compras.
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={busqueda}
                    onChange={(e) =>
                      setBusqueda(e.target.value)
                    }
                    placeholder="Buscar proveedor..."
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] pl-10 pr-4 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
                  />
                </div>
              </div>
            </div>

            {proveedores.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e9f8f1]">
                  <User
                    size={28}
                    className="text-[#18a66b]"
                  />
                </div>

                <h2 className="mt-5 text-base font-black text-gray-900">
                  No hay proveedores
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">
                  Agrega el primer proveedor para comenzar
                  a crear órdenes de compra.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarNuevoProveedor(true)
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#148f5c]"
                >
                  <Plus size={15} />
                  Nuevo proveedor
                </button>
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {proveedores
                  .filter(
                    (proveedor) =>
                      !busqueda.trim() ||
                      proveedor.nombre
                        .toLowerCase()
                        .includes(
                          busqueda.toLowerCase()
                        )
                  )
                  .map((proveedor) => (
                    <div
                      key={proveedor.id}
                      className="group rounded-2xl border border-gray-200 bg-[#fbfdfc] p-5 transition hover:border-[#18a66b] hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
                          <Building2 size={19} />
                        </div>

                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-600">
                          ACTIVO
                        </span>
                      </div>

                      <h3 className="mt-4 text-sm font-black text-gray-950">
                        {proveedor.nombre}
                      </h3>

                      <div className="mt-4 space-y-2">
                        {proveedor.email && (
                          <p className="flex items-start gap-2 break-all text-xs text-gray-500">
                            <span className="mt-0.5 text-gray-400">
                              ✉
                            </span>
                            {proveedor.email}
                          </p>
                        )}

                        {proveedor.telefono && (
                          <p className="flex items-start gap-2 text-xs text-gray-500">
                            <span className="mt-0.5 text-gray-400">
                              ☎
                            </span>
                            {proveedor.telefono}
                          </p>
                        )}

                        {proveedor.ciudad && (
                          <p className="flex items-start gap-2 text-xs text-gray-500">
                            <span className="mt-0.5 text-gray-400">
                              ●
                            </span>
                            {proveedor.ciudad}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ===================================================== */}
      {/* MODAL NUEVA ORDEN — SOLO DISEÑO MODIFICADO */}
      {/* ===================================================== */}

      {mostrarNuevaOrden && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-[#f8faf9] shadow-2xl">

            {/* HEADER */}

            <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f8f1] text-[#18a66b]">
                    <ShoppingCart size={22} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
                        Nueva orden de compra
                      </h2>

                      <span className="rounded-full bg-[#e9f8f1] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#148f5c]">
                        Nueva
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                      Crea una orden, agrega los productos y define las cantidades que deseas solicitar.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarNuevaOrden(false);
                    setProveedorSeleccionado(null);
                    setDetalles([]);
                    setError("");
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                  aria-label="Cerrar"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* CONTENIDO */}

            <div className="min-h-0 flex-1 overflow-y-auto">
              <form
                onSubmit={crearOrden}
                className="p-5 sm:p-7"
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">

                  {/* COLUMNA PRINCIPAL */}

                  <div className="space-y-6">

                    {/* PROVEEDOR */}

                    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-100 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
                            <Building2 size={17} />
                          </div>

                          <div>
                            <h3 className="text-sm font-black text-gray-950">
                              Proveedor
                            </h3>

                            <p className="mt-0.5 text-xs text-gray-400">
                              Selecciona quién suministra esta compra.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <label className="mb-2 block text-xs font-bold text-gray-600">
                          Proveedor de la orden
                        </label>

                        <select
                          value={proveedorSeleccionado || ""}
                          onChange={(e) =>
                            setProveedorSeleccionado(
                              Number(e.target.value)
                            )
                          }
                          className="h-12 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-4 focus:ring-[#18a66b]/10"
                        >
                          <option value="">
                            Selecciona un proveedor
                          </option>

                          {proveedores.map((proveedor) => (
                            <option
                              key={proveedor.id}
                              value={proveedor.id}
                            >
                              {proveedor.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </section>

                    {/* PRODUCTOS */}

                    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                        <div>
                          <h3 className="text-sm font-black text-gray-950">
                            Productos de la orden
                          </h3>

                          <p className="mt-0.5 text-xs text-gray-400">
                            Productos y cantidades solicitadas.
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-[#f4f7f5] px-3 py-1.5 text-[10px] font-black text-gray-500">
                          {detalles.length}{" "}
                          {detalles.length === 1
                            ? "producto"
                            : "productos"}
                        </span>
                      </div>

                      <div className="p-5">
                        {detalles.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-gray-300 bg-[#fafcfb] px-5 py-10 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f3f1] text-gray-400">
                              <Package size={24} />
                            </div>

                            <p className="mt-4 text-sm font-black text-gray-700">
                              Aún no hay productos
                            </p>

                            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-gray-400">
                              Agrega productos utilizando el formulario que aparece debajo.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {detalles.map(
                              (detalle, index) => (
                                <div
                                  key={index}
                                  className="group rounded-2xl border border-gray-200 bg-[#fbfdfc] p-4 transition hover:border-[#ccebdd] hover:bg-white"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
                                      <Package size={17} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-black text-gray-950">
                                            {detalle.producto_nombre}
                                          </p>

                                          {detalle.producto_id ? (
                                            <p className="mt-1 text-[11px] text-gray-400">
                                              Producto del inventario
                                            </p>
                                          ) : (
                                            <p className="mt-1 text-[11px] font-bold text-[#18a66b]">
                                              Producto nuevo ·{" "}
                                              {detalle.categoria}
                                            </p>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDetalles(
                                              detalles.filter(
                                                (_, i) =>
                                                  i !== index
                                              )
                                            )
                                          }
                                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                          aria-label="Eliminar producto"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>

                                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 font-bold">
                                            {detalle.cantidad} unidades
                                          </span>

                                          <span>×</span>

                                          <span className="font-semibold">
                                            {moneda(
                                              detalle.precio_unitario
                                            )}
                                          </span>
                                        </div>

                                        <p className="text-sm font-black text-gray-950">
                                          {moneda(
                                            detalle.cantidad *
                                              detalle.precio_unitario
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* AGREGAR PRODUCTO */}

                    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-100 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f7f5] text-gray-600">
                            <Plus size={17} />
                          </div>

                          <div>
                            <h3 className="text-sm font-black text-gray-950">
                              Agregar producto
                            </h3>

                            <p className="mt-0.5 text-xs text-gray-400">
                              Selecciona un producto existente o crea uno nuevo.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">

                          <div className="sm:col-span-2">
                            <label className="mb-2 block text-xs font-bold text-gray-600">
                              Producto del inventario
                            </label>

                            <select
                              id="producto-select"
                              className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-4 focus:ring-[#18a66b]/10"
                            >
                              <option value="">
                                Seleccionar producto existente
                              </option>

                              {productos.map((producto) => (
                                <option
                                  key={producto.id}
                                  value={producto.id}
                                >
                                  {producto.nombre}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-600">
                                O crear producto nuevo
                              </span>

                              <span className="h-px flex-1 bg-gray-100" />
                            </div>

                            <input
                              type="text"
                              id="producto-nombre"
                              placeholder="Nombre del producto nuevo"
                              className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#18a66b] focus:bg-white focus:ring-4 focus:ring-[#18a66b]/10"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-bold text-gray-600">
                              Categoría
                            </label>

                            <select
                              id="producto-categoria"
                              className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-4 focus:ring-[#18a66b]/10"
                            >
                              <option value="">
                                Categoría / sector
                              </option>
                              <option value="Baterías">
                                Baterías
                              </option>
                              <option value="Pantallas">
                                Pantallas
                              </option>
                              <option value="Módulos">
                                Módulos
                              </option>
                              <option value="Flex">
                                Flex
                              </option>
                              <option value="Cámaras">
                                Cámaras
                              </option>
                              <option value="Chasis">
                                Chasis
                              </option>
                              <option value="Tapas traseras">
                                Tapas traseras
                              </option>
                              <option value="Conectores">
                                Conectores
                              </option>
                              <option value="IC / Componentes">
                                IC / Componentes
                              </option>
                              <option value="Accesorios">
                                Accesorios
                              </option>
                              <option value="Otros">
                                Otros
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-bold text-gray-600">
                              Cantidad
                            </label>

                            <input
                              type="number"
                              id="cantidad-input"
                              placeholder="Ej. 5"
                              min="1"
                              step="1"
                              className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#18a66b] focus:bg-white focus:ring-4 focus:ring-[#18a66b]/10"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-bold text-gray-600">
                              Precio unitario
                            </label>

                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                USD
                              </span>

                              <input
                                type="number"
                                id="precio-input"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] pl-12 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#18a66b] focus:bg-white focus:ring-4 focus:ring-[#18a66b]/10"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const productoId =
                                Number(
                                  (
                                    document.getElementById(
                                      "producto-select"
                                    ) as HTMLSelectElement
                                  )?.value
                                ) || null;

                              const productoNombre =
                                (
                                  document.getElementById(
                                    "producto-nombre"
                                  ) as HTMLInputElement
                                )?.value || "";

                              const categoria =
                                (
                                  document.getElementById(
                                    "producto-categoria"
                                  ) as HTMLSelectElement
                                )?.value || "";

                              const cantidad =
                                Number(
                                  (
                                    document.getElementById(
                                      "cantidad-input"
                                    ) as HTMLInputElement
                                  )?.value
                                );

                              const precio =
                                Number(
                                  (
                                    document.getElementById(
                                      "precio-input"
                                    ) as HTMLInputElement
                                  )?.value
                                );

                              if (
                                !cantidad ||
                                cantidad <= 0
                              ) {
                                setError(
                                  "Completa una cantidad válida"
                                );
                                return;
                              }

                              if (
                                precio < 0 ||
                                !Number.isFinite(precio)
                              ) {
                                setError(
                                  "Completa un precio válido"
                                );
                                return;
                              }

                              if (
                                !productoId &&
                                !productoNombre.trim()
                              ) {
                                setError(
                                  "Selecciona un producto o ingresa un nombre"
                                );
                                return;
                              }

                              if (
                                productoId &&
                                detalles.some(
                                  (detalle) =>
                                    detalle.producto_id ===
                                    productoId
                                )
                              ) {
                                setError(
                                  "Este producto ya está en la orden"
                                );
                                return;
                              }

                              const nombre =
                                productoNombre.trim() ||
                                productos.find(
                                  (producto) =>
                                    producto.id ===
                                    productoId
                                )?.nombre ||
                                "";

                              setDetalles((prev) => [
                                ...prev,
                                {
                                  producto_id:
                                    productoId,
                                  producto_nombre:
                                    nombre,
                                  categoria:
                                    categoria ||
                                    "OTROS",
                                  cantidad,
                                  precio_unitario:
                                    precio,
                                },
                              ]);

                              (
                                document.getElementById(
                                  "producto-select"
                                ) as HTMLSelectElement
                              ).value = "";

                              (
                                document.getElementById(
                                  "producto-nombre"
                                ) as HTMLInputElement
                              ).value = "";

                              (
                                document.getElementById(
                                  "producto-categoria"
                                ) as HTMLSelectElement
                              ).value = "";

                              (
                                document.getElementById(
                                  "cantidad-input"
                                ) as HTMLInputElement
                              ).value = "";

                              (
                                document.getElementById(
                                  "precio-input"
                                ) as HTMLInputElement
                              ).value = "";

                              setError("");
                            }}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 text-sm font-bold text-white transition hover:bg-gray-800 sm:mt-[25px]"
                          >
                            <Plus size={16} />
                            Agregar producto
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* RESUMEN LATERAL */}

                  <aside className="lg:sticky lg:top-0 lg:self-start">
                    <div className="overflow-hidden rounded-2xl border border-[#bcebd5] bg-white shadow-sm">

                      <div className="bg-[#e9f8f1] px-5 py-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#148f5c]">
                          Resumen de compra
                        </p>

                        <p className="mt-2 text-3xl font-black tracking-tight text-[#148f5c]">
                          {moneda(totalNuevaOrden)}
                        </p>

                        <p className="mt-1 text-xs text-[#4a8f72]">
                          Total estimado de la orden
                        </p>
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-500">
                            Productos
                          </span>

                          <span className="text-sm font-black text-gray-950">
                            {detalles.length}
                          </span>
                        </div>

                        <div className="h-px bg-gray-100" />

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-500">
                            Unidades
                          </span>

                          <span className="text-sm font-black text-gray-950">
                            {detalles.reduce(
                              (sum, detalle) =>
                                sum + detalle.cantidad,
                              0
                            )}
                          </span>
                        </div>

                        <div className="h-px bg-gray-100" />

                        <div className="rounded-xl bg-[#f8faf9] p-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle2
                              size={15}
                              className="mt-0.5 shrink-0 text-[#18a66b]"
                            />

                            <p className="text-[11px] leading-5 text-gray-500">
                              La orden quedará como{" "}
                              <span className="font-bold text-gray-700">
                                pendiente
                              </span>{" "}
                              hasta que registres la recepción.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>

                {/* FOOTER */}

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarNuevaOrden(false);
                      setProveedorSeleccionado(null);
                      setDetalles([]);
                      setError("");
                    }}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    Cancelar
                  </button>

                  <button
                    disabled={
                      guardandoOrden ||
                      detalles.length === 0 ||
                      !proveedorSeleccionado
                    }
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guardandoOrden && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    Crear orden de compra
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL PROVEEDOR */}
      {/* ===================================================== */}

      {mostrarNuevoProveedor && (
        <Modal
          title="Nuevo proveedor"
          onClose={() => {
            setMostrarNuevoProveedor(false);

            setNuevoProveedor({
              nombre: "",
              email: "",
              telefono: "",
              direccion: "",
              ciudad: "",
            });
          }}
        >
          <form
            onSubmit={crearProveedor}
            className="space-y-4"
          >
            <div className="rounded-2xl bg-[#f7fcf9] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
                  <Building2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-black text-gray-950">
                    Información del proveedor
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Guarda los datos para utilizarlos en futuras compras.
                  </p>
                </div>
              </div>
            </div>

            <Field
              label="Nombre *"
              value={nuevoProveedor.nombre}
              onChange={(value) =>
                setNuevoProveedor({
                  ...nuevoProveedor,
                  nombre: value,
                })
              }
              placeholder="Ej. Distribuidor XYZ"
            />

            <Field
              label="Email"
              type="email"
              value={nuevoProveedor.email}
              onChange={(value) =>
                setNuevoProveedor({
                  ...nuevoProveedor,
                  email: value,
                })
              }
              placeholder="contacto@distribuidor.com"
            />

            <Field
              label="Teléfono"
              value={nuevoProveedor.telefono}
              onChange={(value) =>
                setNuevoProveedor({
                  ...nuevoProveedor,
                  telefono: value,
                })
              }
              placeholder="+54 11 1234-5678"
            />

            <Field
              label="Dirección"
              value={nuevoProveedor.direccion}
              onChange={(value) =>
                setNuevoProveedor({
                  ...nuevoProveedor,
                  direccion: value,
                })
              }
              placeholder="Calle 123"
            />

            <Field
              label="Ciudad"
              value={nuevoProveedor.ciudad}
              onChange={(value) =>
                setNuevoProveedor({
                  ...nuevoProveedor,
                  ciudad: value,
                })
              }
              placeholder="Buenos Aires"
            />

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setMostrarNuevoProveedor(false);

                  setNuevoProveedor({
                    nombre: "",
                    email: "",
                    telefono: "",
                    direccion: "",
                    ciudad: "",
                  });
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                disabled={guardandoProveedor}
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {guardandoProveedor && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                <Check size={16} />
                Crear proveedor
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================== */}
      {/* MODAL RECIBIR ORDEN */}
      {/* ===================================================== */}

      {ordenSeleccionada && (
        <Modal
          title={`Recibir ${ordenSeleccionada.numero}`}
          onClose={() => {
            setOrdenSeleccionada(null);
            setCantidadesRecibidas({});
          }}
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#dcefe5] bg-[#f7fcf9] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
                  <Package size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-950">
                    {ordenSeleccionada.proveedor?.nombre}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {new Date(
                        ordenSeleccionada.fecha
                      ).toLocaleDateString("es-AR")}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <DollarSign size={13} />
                      {moneda(
                        ordenSeleccionada.total
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3">
                <h3 className="text-sm font-black text-gray-950">
                  Confirmar recepción
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Revisa las cantidades antes de confirmar el ingreso.
                </p>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {ordenSeleccionada.detalles?.map(
                  (detalle) => (
                    <div
                      key={detalle.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-950">
                            {detalle.producto?.nombre ||
                              "Producto"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Precio unitario:{" "}
                            {moneda(
                              detalle.precio_unitario
                            )}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-black text-gray-900">
                          {moneda(
                            detalle.subtotal
                          )}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#f4f7f5] p-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Solicitado
                          </label>

                          <p className="mt-1 text-lg font-black text-gray-950">
                            {detalle.cantidad}
                          </p>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Recibido
                          </label>

                          <input
                            type="number"
                            min="0"
                            max={detalle.cantidad}
                            step="1"
                            value={
                              cantidadesRecibidas[
                                detalle.id
                              ] ?? 0
                            }
                            onChange={(e) =>
                              setCantidadesRecibidas(
                                {
                                  ...cantidadesRecibidas,
                                  [detalle.id]:
                                    Math.min(
                                      Number(
                                        e.target.value
                                      ),
                                      detalle.cantidad
                                    ),
                                }
                              )
                            }
                            className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#18a66b] focus:ring-2 focus:ring-[#18a66b]/10"
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setOrdenSeleccionada(null);
                  setCantidadesRecibidas({});
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                disabled={guardandoRecepcion}
                type="button"
                onClick={recibirOrden}
                className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] disabled:opacity-60"
              >
                {guardandoRecepcion ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={16} />
                )}

                Confirmar recepción
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ========================================================= */
/* COMPONENTE STAT CARD */
/* ========================================================= */

function StatCard({
  icon,
  label,
  value,
  helper,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <ArrowUpRight
          size={15}
          className="text-gray-300"
        />
      </div>

      <p className="mt-4 text-xs font-bold text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-2xl font-black tracking-tight text-gray-950">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-gray-400">
        {helper}
      </p>
    </div>
  );
}

/* ========================================================= */
/* STATUS BADGE */
/* ========================================================= */

function StatusBadge({
  estado,
}: {
  estado: OrdenCompra["estado"];
}) {
  if (estado === "PENDIENTE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
        <Clock size={11} />
        PENDIENTE
      </span>
    );
  }

  if (estado === "RECIBIDA") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-700">
        <CheckCircle2 size={11} />
        RECIBIDA
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700">
      <X size={11} />
      CANCELADA
    </span>
  );
}

/* ========================================================= */
/* MODAL */
/* ========================================================= */

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#18a66b]">
              Gestión
            </p>

            <h2 className="mt-1 text-lg font-black text-gray-950">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-90px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* FIELD */
/* ========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
      />
    </div>
  );
}
