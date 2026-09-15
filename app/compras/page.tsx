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
            telefono
          ),
          detalles:ordenes_compra_detalles(
            id,
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
      /*
       * =========================================================
       * 1. GENERAR NÚMERO DE ORDEN
       * =========================================================
       */

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

      /*
       * =========================================================
       * 2. CALCULAR TOTAL
       * =========================================================
       */

      const total = detalles.reduce(
        (sum, detalle) =>
          sum +
          detalle.cantidad * detalle.precio_unitario,
        0
      );

      /*
       * =========================================================
       * 3. CREAR ORDEN
       * =========================================================
       */

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

      /*
       * =========================================================
       * 4. RESOLVER PRODUCTOS
       *
       * Si existe -> usamos su ID.
       *
       * Si es nuevo -> lo creamos en productos.
       *
       * IMPORTANTE:
       * productoId queda convertido explícitamente a number
       * antes de insertarlo en ordenes_compra_detalles.
       * =========================================================
       */

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

        /*
         * PRODUCTO NUEVO
         */
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

        /*
         * SEGURIDAD EXTRA:
         * En este punto productoId tiene que ser un número.
         */

        const productoIdFinal = Number(productoId);

        if (!Number.isFinite(productoIdFinal) || productoIdFinal <= 0) {
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

      /*
       * =========================================================
       * 5. CREAR DETALLES
       * =========================================================
       */

      const {
        error: errorDetalles,
      } = await supabase
        .from("ordenes_compra_detalles")
        .insert(filasDetalles);

      if (errorDetalles) {
        throw new Error(
          `Error creando detalles de la orden: ${errorDetalles.message}`
        );
      }

      /*
       * =========================================================
       * 6. RECARGAR TODO
       * =========================================================
       */

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
        (sum, o) => sum + o.total,
        0
      );

    return {
      pendientes,
      recibidas,
      totalGastado,
    };
  }, [ordenes]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#f4f7f5]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
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

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#18a66b]">
              Gestión
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
              Compras
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Órdenes de compra y gestión de proveedores.
            </p>
          </div>

          {tab === "ordenes" && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setMostrarNuevaOrden(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Nueva orden
            </button>
          )}

          {tab === "proveedores" && (
            <button
              type="button"
              onClick={() =>
                setMostrarNuevoProveedor(true)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-[0.98]"
            >
              <Plus size={17} />
              Nuevo proveedor
            </button>
          )}
        </div>

        {mensaje && (
          <div className="fixed right-4 top-5 z-[100] rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-xl">
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
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* TABS */}

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("ordenes")}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === "ordenes"
                ? "border-[#18a66b] text-[#18a66b]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShoppingCart
              size={16}
              className="mr-2 inline"
            />
            Órdenes de compra
          </button>

          <button
            type="button"
            onClick={() => setTab("proveedores")}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === "proveedores"
                ? "border-[#18a66b] text-[#18a66b]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <User
              size={16}
              className="mr-2 inline"
            />
            Proveedores
          </button>
        </div>

        {/* ORDENES */}

        {tab === "ordenes" && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                  <Clock size={16} />
                </div>

                <p className="mt-4 text-xs font-semibold text-gray-400">
                  Pendientes
                </p>

                <p className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                  {estadisticas.pendientes}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <CheckCircle2 size={16} />
                </div>

                <p className="mt-4 text-xs font-semibold text-gray-400">
                  Recibidas
                </p>

                <p className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                  {estadisticas.recibidas}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <DollarSign size={16} />
                </div>

                <p className="mt-4 text-xs font-semibold text-gray-400">
                  Total gastado
                </p>

                <p className="mt-1 text-2xl font-black tracking-tight text-gray-950">
                  {moneda(
                    estadisticas.totalGastado
                  )}
                </p>
              </div>

            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="border-b border-gray-100 p-5">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div className="relative w-full lg:max-w-md">
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

                  <div className="flex gap-2">
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
                            ? "bg-[#e9f8f1] text-[#148f5c]"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {etiqueta}
                      </button>
                    ))}
                  </div>

                </div>
              </div>

              {ordenesFiltradas.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8f1]">
                    <ShoppingCart
                      size={24}
                      className="text-[#18a66b]"
                    />
                  </div>

                  <h2 className="mt-4 text-sm font-bold text-gray-900">
                    No hay órdenes
                  </h2>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                    Crea la primera orden de compra.
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-gray-100">

                  {ordenesFiltradas.map((orden) => (
                    <div
                      key={orden.id}
                      className="p-4 transition hover:bg-[#f8faf9]"
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">

                            <h3 className="text-sm font-bold text-gray-950">
                              {orden.numero}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                                orden.estado ===
                                "PENDIENTE"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {orden.estado ===
                              "PENDIENTE" ? (
                                <Clock size={12} />
                              ) : (
                                <CheckCircle2
                                  size={12}
                                />
                              )}

                              {orden.estado}
                            </span>

                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            {orden.proveedor?.nombre} •{" "}
                            {new Date(
                              orden.fecha
                            ).toLocaleDateString(
                              "es-AR"
                            )}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-gray-900">
                            {moneda(orden.total)} •{" "}
                            {orden.detalles?.length ||
                              0}{" "}
                            producto(s)
                          </p>

                        </div>

                        {orden.estado ===
                          "PENDIENTE" && (
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
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#18a66b] px-3 py-2 text-xs font-bold text-white hover:bg-[#148f5c]"
                          >
                            <Eye size={14} />
                            Recibir
                          </button>
                        )}

                      </div>
                    </div>
                  ))}

                </div>
              )}

            </section>
          </>
        )}

        {/* PROVEEDORES */}

        {tab === "proveedores" && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-100 p-5">

              <div className="relative w-full">
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

            {proveedores.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8f1]">
                  <User
                    size={24}
                    className="text-[#18a66b]"
                  />
                </div>

                <h2 className="mt-4 text-sm font-bold text-gray-900">
                  No hay proveedores
                </h2>

                <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                  Agrega el primer proveedor para
                  crear órdenes de compra.
                </p>

              </div>
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">

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
                      className="rounded-xl border border-gray-200 bg-[#f8faf9] p-4 transition hover:border-[#18a66b]"
                    >

                      <h3 className="text-sm font-bold text-gray-950">
                        {proveedor.nombre}
                      </h3>

                      {proveedor.email && (
                        <p className="mt-2 break-all text-xs text-gray-500">
                          {proveedor.email}
                        </p>
                      )}

                      {proveedor.telefono && (
                        <p className="mt-1 text-xs text-gray-500">
                          {proveedor.telefono}
                        </p>
                      )}

                      {proveedor.ciudad && (
                        <p className="mt-1 text-xs text-gray-500">
                          {proveedor.ciudad}
                        </p>
                      )}

                    </div>
                  ))}

              </div>
            )}

          </section>
        )}
      </div>

      {/* ===================================================== */}
      {/* MODAL NUEVA ORDEN */}
      {/* ===================================================== */}

      {mostrarNuevaOrden && (
        <Modal
          title="Nueva orden de compra"
          onClose={() => {
            setMostrarNuevaOrden(false);
            setProveedorSeleccionado(null);
            setDetalles([]);
            setError("");
          }}
        >
          <form
            onSubmit={crearOrden}
            className="space-y-4"
          >

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">
                Proveedor *
              </label>

              <select
                value={proveedorSeleccionado || ""}
                onChange={(e) =>
                  setProveedorSeleccionado(
                    Number(e.target.value)
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
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

            {/* DETALLES */}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">
                Productos
              </label>

              <div className="max-h-64 space-y-2 overflow-y-auto">

                {detalles.map(
                  (detalle, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-[#f8faf9] p-2"
                    >

                      <div className="min-w-0 flex-1">

                        <p className="text-xs font-semibold text-gray-900">
                          {detalle.producto_nombre}
                        </p>

                        <p className="text-xs text-gray-500">
                          {detalle.cantidad} x{" "}
                          {moneda(
                            detalle.precio_unitario
                          )}{" "}
                          ={" "}
                          {moneda(
                            detalle.cantidad *
                              detalle.precio_unitario
                          )}
                        </p>

                        {!detalle.producto_id && (
                          <p className="mt-1 text-[10px] font-bold text-[#18a66b]">
                            Producto nuevo •{" "}
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
                        className="rounded p-1 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>
                  )
                )}

              </div>
            </div>

            {/* AGREGAR PRODUCTO */}

            <div className="grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">

              <select
                id="producto-select"
                className="h-11 rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
              >
                <option value="">
                  Producto inventario
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

              <input
                type="text"
                id="producto-nombre"
                placeholder="O nombre nuevo"
                className="h-11 rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
              />

              <select
                id="producto-categoria"
                className="h-11 rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
              >
                <option value="">
                  Sector
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

              <input
                type="number"
                id="cantidad-input"
                placeholder="Cantidad"
                min="1"
                step="1"
                className="h-11 rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
              />

              <input
                type="number"
                id="precio-input"
                placeholder="Precio unit."
                min="0"
                step="0.01"
                className="h-11 rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
              />

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

                  if (!cantidad || cantidad <= 0) {
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
                        categoria || "OTROS",
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
                className="rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#148f5c] sm:col-span-2"
              >
                Agregar producto
              </button>

            </div>

            {detalles.length > 0 && (
              <div className="rounded-lg border border-[#bcebd5] bg-[#e9f8f1] p-3">
                <p className="text-right text-sm font-bold text-[#148f5c]">
                  Total:{" "}
                  {moneda(
                    detalles.reduce(
                      (sum, detalle) =>
                        sum +
                        detalle.cantidad *
                          detalle.precio_unitario,
                      0
                    )
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

              <button
                type="button"
                onClick={() => {
                  setMostrarNuevaOrden(false);
                  setProveedorSeleccionado(null);
                  setDetalles([]);
                  setError("");
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100"
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
                className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {guardandoOrden && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                Crear orden
              </button>

            </div>
          </form>
        </Modal>
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

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

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
                className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {guardandoProveedor && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

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
          title={`Recibir orden: ${ordenSeleccionada.numero}`}
          onClose={() => {
            setOrdenSeleccionada(null);
            setCantidadesRecibidas({});
          }}
        >
          <div className="space-y-4">

            <div className="rounded-lg bg-[#f6f9f7] p-3">
              <p className="text-sm font-bold text-gray-900">
                {ordenSeleccionada.proveedor?.nombre}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {new Date(
                  ordenSeleccionada.fecha
                ).toLocaleDateString("es-AR")}
              </p>
            </div>

            <div className="max-h-64 space-y-3 overflow-y-auto">

              {ordenSeleccionada.detalles?.map(
                (detalle) => (
                  <div
                    key={detalle.id}
                    className="rounded-lg border border-gray-200 p-3"
                  >

                    <p className="text-sm font-semibold text-gray-900">
                      {detalle.producto?.nombre}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Precio:{" "}
                      {moneda(
                        detalle.precio_unitario
                      )}
                    </p>

                    <div className="mt-2 grid grid-cols-2 gap-2">

                      <div>
                        <label className="text-[10px] font-bold text-gray-600">
                          Solicitado
                        </label>

                        <p className="mt-1 text-sm font-bold text-gray-900">
                          {detalle.cantidad}
                        </p>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-600">
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
                            ] || 0
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
                          className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-[#f8faf9] px-2 text-sm outline-none focus:border-[#18a66b]"
                        />
                      </div>

                    </div>
                  </div>
                )
              )}

            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

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
                className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {guardandoRecepcion && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                <Check size={16} />

                Confirmar recepción
              </button>

            </div>
          </div>
        </Modal>
      )}

    </main>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-lg">

        <div className="flex items-center justify-between border-b border-gray-100 p-5">

          <h2 className="text-lg font-bold text-gray-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

        </div>

        <div className="p-5">
          {children}
        </div>

      </div>
    </div>
  );
}

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