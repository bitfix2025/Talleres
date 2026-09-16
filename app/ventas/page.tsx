"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  Plus,
  Search,
  Loader2,
  X,
  Check,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Trash2,
  CheckCircle2,
  Package,
  ScanLine,
  Camera,
  CameraOff,
  Barcode,
} from "lucide-react";

const TALLER_ID = 1;

type Cliente = {
  id: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
};

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  sku: string | null;
  codigo_barras: string | null;
  costo: number;
  precio: number;
  stock_actual: number;
  activo: boolean;
};

type DetalleVenta = {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  subtotal: number;
  ganancia: number;
};

type VentaDetalle = {
  id: number;
  venta_id: number;
  producto_id: number | null;
  producto_nombre: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  subtotal: number;
  ganancia: number;
};

type Venta = {
  id: number;
  taller_id: number;
  cliente_id: number | null;
  subtotal: number;
  descuento: number;
  total: number;
  ganancia: number;
  metodo_pago: string | null;
  estado: string;
  observaciones: string | null;
  created_at: string;
  cliente?: Cliente | null;
  detalles?: VentaDetalle[];
};

const numero = (valor: unknown): number => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numero(valor));

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [mostrarNuevaVenta, setMostrarNuevaVenta] =
    useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<number | null>(null);

  const [metodoPago, setMetodoPago] =
    useState("EFECTIVO");

  const [descuento, setDescuento] = useState(0);

  const [observaciones, setObservaciones] =
    useState("");

  const [detalles, setDetalles] =
    useState<DetalleVenta[]>([]);

  const [guardandoVenta, setGuardandoVenta] =
    useState(false);

  const [ventaSeleccionada, setVentaSeleccionada] =
    useState<Venta | null>(null);

  const [productoSeleccionado, setProductoSeleccionado] =
    useState("");

  const [cantidadProducto, setCantidadProducto] =
    useState("1");

  const [codigoBarras, setCodigoBarras] =
    useState("");

  const [escaneando, setEscaneando] =
    useState(false);

  const [scannerDisponible, setScannerDisponible] =
    useState(false);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const animationRef =
    useRef<number | null>(null);

  useEffect(() => {
    cargarDatos();

    return () => {
      detenerScanner();
    };
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const {
        data: ventasData,
        error: errorVentas,
      } = await supabase
        .from("ventas")
        .select(`
          *,
          cliente:cliente_id(
            id,
            nombre,
            telefono,
            email
          ),
          detalles:venta_detalles(
            id,
            venta_id,
            producto_id,
            producto_nombre,
            cantidad,
            costo_unitario,
            precio_unitario,
            subtotal,
            ganancia
          )
        `)
        .eq("taller_id", TALLER_ID)
        .order("created_at", {
          ascending: false,
        });

      if (errorVentas) {
        throw new Error(
          `Error cargando ventas: ${errorVentas.message}`
        );
      }

      setVentas((ventasData as Venta[]) || []);

      const {
        data: productosData,
        error: errorProductos,
      } = await supabase
        .from("productos")
        .select(`
          id,
          nombre,
          categoria,
          marca,
          modelo,
          sku,
          codigo_barras,
          costo,
          precio,
          stock_actual,
          activo
        `)
        .eq("taller_id", TALLER_ID)
        .eq("activo", true)
        .order("nombre", {
          ascending: true,
        });

      if (errorProductos) {
        throw new Error(
          `Error cargando productos: ${errorProductos.message}`
        );
      }

      setProductos(
        (productosData || []).map(
          (producto: any) => ({
            id: Number(producto.id),
            nombre: producto.nombre || "",
            categoria: producto.categoria ?? null,
            marca: producto.marca ?? null,
            modelo: producto.modelo ?? null,
            sku: producto.sku ?? null,
            codigo_barras:
              producto.codigo_barras ?? null,
            costo: numero(producto.costo),
            precio: numero(producto.precio),
            stock_actual:
              numero(producto.stock_actual),
            activo: Boolean(producto.activo),
          })
        )
      );

      const {
        data: clientesData,
        error: errorClientes,
      } = await supabase
        .from("clientes")
        .select(`
          id,
          nombre,
          telefono,
          email
        `)
        .eq("taller_id", TALLER_ID)
        .order("nombre", {
          ascending: true,
        });

      if (errorClientes) {
        throw new Error(
          `Error cargando clientes: ${errorClientes.message}`
        );
      }

      setClientes(
        (clientesData as Cliente[]) || []
      );

      if (
        typeof window !== "undefined" &&
        "BarcodeDetector" in window
      ) {
        setScannerDisponible(true);
      } else {
        setScannerDisponible(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar datos."
      );
    } finally {
      setCargando(false);
    }
  };

  const productoActual = useMemo(() => {
    if (!productoSeleccionado) {
      return null;
    }

    return (
      productos.find(
        (producto) =>
          producto.id ===
          Number(productoSeleccionado)
      ) || null
    );
  }, [
    productoSeleccionado,
    productos,
  ]);

  const subtotalVenta = useMemo(() => {
    return detalles.reduce(
      (total, detalle) =>
        total + numero(detalle.subtotal),
      0
    );
  }, [detalles]);

  const descuentoNumero = useMemo(() => {
    return Math.max(numero(descuento), 0);
  }, [descuento]);

  const totalVenta = useMemo(() => {
    return Math.max(
      subtotalVenta - descuentoNumero,
      0
    );
  }, [
    subtotalVenta,
    descuentoNumero,
  ]);

  const costoTotalVenta = useMemo(() => {
    return detalles.reduce(
      (total, detalle) =>
        total +
        numero(detalle.costo_unitario) *
          numero(detalle.cantidad),
      0
    );
  }, [detalles]);

  const gananciaVenta = useMemo(() => {
    return Math.max(
      totalVenta - costoTotalVenta,
      0
    );
  }, [
    totalVenta,
    costoTotalVenta,
  ]);

  const estadisticas = useMemo(() => {
    const completadas =
      ventas.filter(
        (venta) =>
          venta.estado === "COMPLETADA"
      );

    return {
      cantidad: completadas.length,

      total: completadas.reduce(
        (sum, venta) =>
          sum + numero(venta.total),
        0
      ),

      ganancia: completadas.reduce(
        (sum, venta) =>
          sum + numero(venta.ganancia),
        0
      ),
    };
  }, [ventas]);

  const ventasFiltradas = useMemo(() => {
    const texto =
      busqueda.trim().toLowerCase();

    if (!texto) {
      return ventas;
    }

    return ventas.filter((venta) => {
      const numeroVenta =
        String(venta.id);

      const cliente =
        venta.cliente?.nombre?.toLowerCase() ||
        "";

      const metodo =
        venta.metodo_pago?.toLowerCase() ||
        "";

      return (
        numeroVenta.includes(texto) ||
        cliente.includes(texto) ||
        metodo.includes(texto)
      );
    });
  }, [ventas, busqueda]);

  const agregarProductoPorObjeto = (
    producto: Producto,
    cantidad: number
  ) => {
    setError("");

    if (!producto) {
      setError("No se encontró el producto.");
      return false;
    }

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      setError(
        "Ingresa una cantidad válida."
      );
      return false;
    }

    const precio = numero(producto.precio);
    const costo = numero(producto.costo);
    const stock = numero(producto.stock_actual);

    if (stock <= 0) {
      setError(
        `El producto ${producto.nombre} no tiene stock disponible.`
      );
      return false;
    }

    const existente =
      detalles.find(
        (detalle) =>
          detalle.producto_id ===
          producto.id
      );

    const cantidadFinal =
      (existente?.cantidad || 0) +
      cantidad;

    if (cantidadFinal > stock) {
      setError(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${stock}.`
      );
      return false;
    }

    if (existente) {
      setDetalles((prev) =>
        prev.map((detalle) => {
          if (
            detalle.producto_id !==
            producto.id
          ) {
            return detalle;
          }

          return {
            ...detalle,
            cantidad: cantidadFinal,
            costo_unitario: costo,
            precio_unitario: precio,
            subtotal:
              cantidadFinal * precio,
            ganancia:
              cantidadFinal *
              (precio - costo),
          };
        })
      );
    } else {
      setDetalles((prev) => [
        ...prev,
        {
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          cantidad,
          costo_unitario: costo,
          precio_unitario: precio,
          subtotal: cantidad * precio,
          ganancia:
            cantidad * (precio - costo),
        },
      ]);
    }

    return true;
  };

  const agregarProducto = () => {
    setError("");

    if (!productoSeleccionado) {
      setError(
        "Selecciona un producto."
      );
      return;
    }

    const cantidad =
      numero(cantidadProducto);

    const producto =
      productos.find(
        (p) =>
          p.id ===
          Number(productoSeleccionado)
      );

    if (!producto) {
      setError(
        "No se encontró el producto."
      );
      return;
    }

    if (
      agregarProductoPorObjeto(
        producto,
        cantidad
      )
    ) {
      setProductoSeleccionado("");
      setCantidadProducto("1");
    }
  };

  const buscarCodigoBarras = (
    codigo?: string
  ) => {
    const codigoFinal =
      (
        codigo ??
        codigoBarras
      ).trim();

    if (!codigoFinal) {
      setError(
        "Ingresa o escanea un código de barras."
      );
      return;
    }

    setError("");

    const producto =
      productos.find(
        (p) =>
          String(
            p.codigo_barras ?? ""
          ).trim() === codigoFinal
      );

    if (!producto) {
      setError(
        `No se encontró ningún producto con el código ${codigoFinal}.`
      );
      return;
    }

    if (
      numero(producto.stock_actual) <=
      0
    ) {
      setError(
        `El producto ${producto.nombre} no tiene stock disponible.`
      );
      return;
    }

    const cantidad = Math.max(
      numero(cantidadProducto),
      1
    );

    if (
      agregarProductoPorObjeto(
        producto,
        cantidad
      )
    ) {
      setCodigoBarras("");
      setCantidadProducto("1");

      setMensaje(
        `${producto.nombre} agregado.`
      );

      setTimeout(
        () => setMensaje(""),
        1800
      );
    }
  };

  const eliminarProducto = (
    productoId: number
  ) => {
    setDetalles((prev) =>
      prev.filter(
        (detalle) =>
          detalle.producto_id !==
          productoId
      )
    );
  };

  const cambiarCantidad = (
    productoId: number,
    nuevaCantidad: number
  ) => {
    const producto =
      productos.find(
        (p) =>
          p.id === productoId
      );

    if (!producto) {
      return;
    }

    if (
      !Number.isInteger(
        nuevaCantidad
      ) ||
      nuevaCantidad <= 0
    ) {
      return;
    }

    const stock =
      numero(producto.stock_actual);

    if (nuevaCantidad > stock) {
      setError(
        `Stock insuficiente. Disponible: ${stock}.`
      );
      return;
    }

    setDetalles((prev) =>
      prev.map((detalle) => {
        if (
          detalle.producto_id !==
          productoId
        ) {
          return detalle;
        }

        const precio =
          numero(
            detalle.precio_unitario
          );

        const costo =
          numero(
            detalle.costo_unitario
          );

        return {
          ...detalle,
          cantidad: nuevaCantidad,
          subtotal:
            nuevaCantidad * precio,
          ganancia:
            nuevaCantidad *
            (precio - costo),
        };
      })
    );
  };

  const limpiarFormulario = () => {
    detenerScanner();

    setClienteSeleccionado(null);
    setMetodoPago("EFECTIVO");
    setDescuento(0);
    setObservaciones("");
    setDetalles([]);
    setProductoSeleccionado("");
    setCantidadProducto("1");
    setCodigoBarras("");
  };

  const cerrarNuevaVenta = () => {
    if (guardandoVenta) {
      return;
    }

    detenerScanner();
    setMostrarNuevaVenta(false);
    limpiarFormulario();
    setError("");
  };

  const crearVenta = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (detalles.length === 0) {
      setError(
        "Agrega al menos un producto."
      );
      return;
    }

    if (totalVenta <= 0) {
      setError(
        "El total de la venta debe ser mayor a 0."
      );
      return;
    }

    for (const detalle of detalles) {
      const producto =
        productos.find(
          (p) =>
            p.id ===
            detalle.producto_id
        );

      if (!producto) {
        setError(
          `No se encontró el producto ${detalle.producto_nombre}.`
        );
        return;
      }

      if (
        detalle.cantidad >
        numero(producto.stock_actual)
      ) {
        setError(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}.`
        );
        return;
      }

      if (
        numero(
          detalle.precio_unitario
        ) <= 0
      ) {
        setError(
          `El producto ${producto.nombre} tiene precio de venta 0.`
        );
        return;
      }
    }

    setGuardandoVenta(true);

    try {
      const {
        data: venta,
        error: errorVenta,
      } = await supabase
        .from("ventas")
        .insert({
          taller_id: TALLER_ID,
          cliente_id:
            clienteSeleccionado,
          subtotal: subtotalVenta,
          descuento: descuentoNumero,
          total: totalVenta,
          ganancia: gananciaVenta,
          metodo_pago: metodoPago,
          estado: "COMPLETADA",
          observaciones:
            observaciones.trim() ||
            null,
        })
        .select()
        .single();

      if (errorVenta) {
        throw new Error(
          `No se pudo crear la venta: ${errorVenta.message}`
        );
      }

      if (!venta) {
        throw new Error(
          "No se pudo crear la venta."
        );
      }

      const filasDetalles =
        detalles.map((detalle) => ({
          venta_id: Number(
            venta.id
          ),
          producto_id: Number(
            detalle.producto_id
          ),
          producto_nombre:
            detalle.producto_nombre,
          cantidad: Number(
            detalle.cantidad
          ),
          costo_unitario: Number(
            detalle.costo_unitario
          ),
          precio_unitario: Number(
            detalle.precio_unitario
          ),
          subtotal: Number(
            detalle.subtotal
          ),
          ganancia: Number(
            detalle.ganancia
          ),
        }));

      const {
        error: errorDetalles,
      } = await supabase
        .from("venta_detalles")
        .insert(filasDetalles);

      if (errorDetalles) {
        await supabase
          .from("ventas")
          .delete()
          .eq("id", venta.id);

        throw new Error(
          `No se pudieron guardar los productos de la venta: ${errorDetalles.message}`
        );
      }

      for (const detalle of detalles) {
        const producto =
          productos.find(
            (p) =>
              p.id ===
              detalle.producto_id
          );

        if (!producto) {
          throw new Error(
            `Producto no encontrado: ${detalle.producto_nombre}`
          );
        }

        const nuevoStock =
          numero(
            producto.stock_actual
          ) -
          numero(
            detalle.cantidad
          );

        const {
          error: errorStock,
        } = await supabase
          .from("productos")
          .update({
            stock_actual:
              nuevoStock,
          })
          .eq(
            "id",
            detalle.producto_id
          )
          .eq(
            "taller_id",
            TALLER_ID
          );

        if (errorStock) {
          throw new Error(
            `La venta fue creada, pero no se pudo actualizar el stock de ${detalle.producto_nombre}: ${errorStock.message}`
          );
        }
      }

      await cargarDatos();

      detenerScanner();

      setMostrarNuevaVenta(false);
      limpiarFormulario();

      setMensaje(
        `Venta #${venta.id} creada correctamente.`
      );

      setTimeout(
        () => setMensaje(""),
        3000
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar la venta."
      );
    } finally {
      setGuardandoVenta(false);
    }
  };

  const iniciarScanner =
    async () => {
      setError("");

      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      if (
        !("BarcodeDetector" in window)
      ) {
        setError(
          "Este navegador no permite lectura de código de barras con cámara. Puedes utilizar el campo de código manual."
        );
        return;
      }

      try {
        detenerScanner();

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: {
                  ideal: "environment",
                },
              },
              audio: false,
            }
          );

        streamRef.current =
          stream;

        setEscaneando(true);

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }

        escanearFrame();
      } catch (err) {
        console.error(err);

        setError(
          "No se pudo acceder a la cámara. Verifica los permisos del navegador."
        );

        setEscaneando(false);
      }
    };

  const detenerScanner = () => {
    if (animationRef.current) {
      cancelAnimationFrame(
        animationRef.current
      );

      animationRef.current =
        null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setEscaneando(false);
  };

  const escanearFrame =
    async () => {
      if (
        !videoRef.current ||
        !escaneando
      ) {
        return;
      }

      try {
        const BarcodeDetectorClass =
          (window as any)
            .BarcodeDetector;

        const detector =
          new BarcodeDetectorClass({
            formats: [
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "codabar",
              "itf",
            ],
          });

        const resultados =
          await detector.detect(
            videoRef.current
          );

        if (
          resultados &&
          resultados.length > 0
        ) {
          const codigo =
            resultados[0].rawValue;

          if (codigo) {
            setCodigoBarras(codigo);
            detenerScanner();
            buscarCodigoBarras(codigo);
            return;
          }
        }
      } catch (err) {
        console.error(
          "Error leyendo código:",
          err
        );
      }

      animationRef.current =
        requestAnimationFrame(
          escanearFrame
        );
    };

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#f4f7f5]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
            <Loader2
              size={20}
              className="animate-spin text-[#18a66b]"
            />
            Cargando ventas...
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
              Ventas
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Registra ventas rápidamente y descuenta automáticamente el inventario.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setMostrarNuevaVenta(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-[0.98]"
          >
            <Plus size={17} />
            Nueva venta
          </button>
        </div>

        {/* MENSAJE */}

        {mensaje && (
          <div className="fixed right-4 top-5 z-[100] rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-xl">
            {mensaje}
          </div>
        )}

        {/* ERROR */}

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
              onClick={() =>
                setError("")
              }
              aria-label="Cerrar error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ESTADÍSTICAS */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ShoppingCart size={17} />
            </div>

            <p className="mt-4 text-xs font-semibold text-gray-400">
              Ventas completadas
            </p>

            <p className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              {estadisticas.cantidad}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <DollarSign size={17} />
            </div>

            <p className="mt-4 text-xs font-semibold text-gray-400">
              Total vendido
            </p>

            <p className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              {moneda(
                estadisticas.total
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
              <CheckCircle2 size={17} />
            </div>

            <p className="mt-4 text-xs font-semibold text-gray-400">
              Ganancia
            </p>

            <p className="mt-1 text-2xl font-black tracking-tight text-gray-950">
              {moneda(
                estadisticas.ganancia
              )}
            </p>
          </div>
        </div>

        {/* LISTADO */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar venta o cliente..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] pl-10 pr-4 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
              />
            </div>
          </div>

          {ventasFiltradas.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8f1]">
                <ShoppingCart
                  size={24}
                  className="text-[#18a66b]"
                />
              </div>

              <h2 className="mt-4 text-sm font-bold text-gray-900">
                No hay ventas
              </h2>

              <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                Registra la primera venta para comenzar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ventasFiltradas.map(
                (venta) => (
                  <button
                    type="button"
                    key={venta.id}
                    onClick={() =>
                      setVentaSeleccionada(
                        venta
                      )
                    }
                    className="w-full p-4 text-left transition hover:bg-[#f8faf9]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-950">
                            Venta #
                            {venta.id}
                          </h3>

                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                            <CheckCircle2
                              size={11}
                            />
                            {venta.estado}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          {venta.cliente
                            ?.nombre ||
                            "Consumidor final"}

                          {" • "}

                          {new Date(
                            venta.created_at
                          ).toLocaleString(
                            "es-AR"
                          )}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {moneda(
                            numero(
                              venta.total
                            )
                          )}

                          {" • "}

                          {venta.detalles
                            ?.length ||
                            0}

                          {" producto(s)"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          Ganancia
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#18a66b]">
                          {moneda(
                            numero(
                              venta.ganancia
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          NUEVA VENTA
      ====================================================== */}

      {mostrarNuevaVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5">

          <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* HEADER GRANDE */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-4 lg:px-7">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#18a66b]">
                  Punto de venta
                </p>

                <h2 className="mt-1 text-xl font-black text-gray-950">
                  Nueva venta
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  cerrarNuevaVenta
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={crearVenta}
              className="min-h-0 overflow-y-auto"
            >
              <div className="grid lg:grid-cols-[1fr_360px]">

                {/* =================================================
                    COLUMNA IZQUIERDA
                ================================================== */}

                <div className="space-y-5 border-b border-gray-100 p-5 lg:border-b-0 lg:border-r lg:p-6">

                  {/* CLIENTE */}

                  <div>
                    <label className="mb-2 block text-xs font-bold text-gray-600">
                      Cliente
                    </label>

                    <select
                      value={
                        clienteSeleccionado ??
                        ""
                      }
                      onChange={(e) =>
                        setClienteSeleccionado(
                          e.target
                            .value
                            ? Number(
                                e.target
                                  .value
                              )
                            : null
                        )
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
                    >
                      <option value="">
                        Consumidor final
                      </option>

                      {clientes.map(
                        (cliente) => (
                          <option
                            key={
                              cliente.id
                            }
                            value={
                              cliente.id
                            }
                          >
                            {
                              cliente.nombre
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* SCANNER */}

                  <div className="rounded-2xl border border-[#dceee5] bg-[#f7fbf9] p-4">

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e1f6eb] text-[#18a66b]">
                          <Barcode
                            size={20}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-black text-gray-900">
                            Código de barras
                          </p>

                          <p className="text-[11px] text-gray-500">
                            Escanea o escribe el código
                          </p>
                        </div>
                      </div>

                      {scannerDisponible && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              escaneando
                            ) {
                              detenerScanner();
                            } else {
                              iniciarScanner();
                            }
                          }}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#18a66b] px-3 text-xs font-bold text-white hover:bg-[#148f5c]"
                        >
                          {escaneando ? (
                            <>
                              <CameraOff
                                size={
                                  16
                                }
                              />
                              Cerrar
                            </>
                          ) : (
                            <>
                              <Camera
                                size={
                                  16
                                }
                              />
                              Escanear
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {escaneando && (
                      <div className="relative mt-3 overflow-hidden rounded-2xl bg-black">
                        <video
                          ref={
                            videoRef
                          }
                          muted
                          playsInline
                          className="h-52 w-full object-cover"
                        />

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="h-24 w-[80%] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
                        </div>

                        <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-white">
                          Apunta al código de barras
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <ScanLine
                          size={17}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          value={
                            codigoBarras
                          }
                          onChange={(e) =>
                            setCodigoBarras(
                              e.target
                                .value
                            )
                          }
                          onKeyDown={(
                            e
                          ) => {
                            if (
                              e.key ===
                              "Enter"
                            ) {
                              e.preventDefault();
                              buscarCodigoBarras();
                            }
                          }}
                          placeholder="Código de barras"
                          inputMode="numeric"
                          autoComplete="off"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#18a66b] focus:ring-2 focus:ring-[#18a66b]/10"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          buscarCodigoBarras()
                        }
                        className="h-11 rounded-xl border border-[#18a66b] bg-white px-4 text-sm font-bold text-[#18a66b] hover:bg-[#e9f8f1]"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  {/* PRODUCTOS */}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-600">
                        Productos de la venta
                      </label>

                      <span className="text-[11px] font-semibold text-gray-400">
                        {detalles.length} producto(s)
                      </span>
                    </div>

                    {detalles.length ===
                    0 ? (
                      <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#f8faf9] p-5 text-center">
                        <Package
                          size={25}
                          className="text-gray-400"
                        />

                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          Escanea un código o agrega un producto
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                        {detalles.map(
                          (detalle) => (
                            <div
                              key={
                                detalle.producto_id
                              }
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-gray-900">
                                    {
                                      detalle.producto_nombre
                                    }
                                  </p>

                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        cambiarCantidad(
                                          detalle.producto_id,
                                          detalle.cantidad -
                                            1
                                        )
                                      }
                                      disabled={
                                        detalle.cantidad <=
                                        1
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-sm font-black disabled:opacity-30"
                                    >
                                      −
                                    </button>

                                    <input
                                      type="number"
                                      min="1"
                                      value={
                                        detalle.cantidad
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        cambiarCantidad(
                                          detalle.producto_id,
                                          Number(
                                            e.target
                                              .value
                                          )
                                        )
                                      }
                                      className="h-8 w-14 rounded-lg border border-gray-200 text-center text-xs font-bold outline-none focus:border-[#18a66b]"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        cambiarCantidad(
                                          detalle.producto_id,
                                          detalle.cantidad +
                                            1
                                        )
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-sm font-black"
                                    >
                                      +
                                    </button>

                                    <span className="text-[11px] text-gray-400">
                                      ×{" "}
                                      {moneda(
                                        detalle.precio_unitario
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-black text-gray-900">
                                    {moneda(
                                      detalle.subtotal
                                    )}
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      eliminarProducto(
                                        detalle.producto_id
                                      )
                                    }
                                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-red-500"
                                  >
                                    <Trash2
                                      size={
                                        13
                                      }
                                    />
                                    Quitar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* AGREGAR MANUAL */}

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-600">
                        Agregar manualmente
                      </p>

                      <span className="text-[10px] font-semibold text-gray-400">
                        Opcional
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_90px_auto]">
                      <select
                        value={
                          productoSeleccionado
                        }
                        onChange={(e) =>
                          setProductoSeleccionado(
                            e.target
                              .value
                          )
                        }
                        className="h-11 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#18a66b]"
                      >
                        <option value="">
                          Seleccionar producto
                        </option>

                        {productos.map(
                          (producto) => (
                            <option
                              key={
                                producto.id
                              }
                              value={
                                producto.id
                              }
                              disabled={
                                producto.stock_actual <=
                                0
                              }
                            >
                              {
                                producto.nombre
                              }{" "}
                              — stock{" "}
                              {
                                producto.stock_actual
                              }{" "}
                              —{" "}
                              {moneda(
                                producto.precio
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          cantidadProducto
                        }
                        onChange={(e) =>
                          setCantidadProducto(
                            e.target
                              .value
                          )
                        }
                        placeholder="Cant."
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-center text-sm font-bold outline-none focus:border-[#18a66b]"
                      />

                      <button
                        type="button"
                        onClick={
                          agregarProducto
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 text-sm font-bold text-white hover:bg-[#148f5c]"
                      >
                        <Plus size={16} />
                        Agregar
                      </button>
                    </div>

                    {productoActual && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-white p-2">
                          <p className="text-[10px] text-gray-400">
                            Precio venta
                          </p>

                          <p className="mt-1 text-sm font-black text-gray-900">
                            {moneda(
                              productoActual.precio
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-2">
                          <p className="text-[10px] text-gray-400">
                            Stock
                          </p>

                          <p className="mt-1 text-sm font-black text-gray-900">
                            {
                              productoActual.stock_actual
                            }
                          </p>
                        </div>

                        <div className="rounded-lg bg-white p-2">
                          <p className="text-[10px] text-gray-400">
                            Costo
                          </p>

                          <p className="mt-1 text-sm font-black text-gray-900">
                            {moneda(
                              productoActual.costo
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* =================================================
                    COLUMNA DERECHA — RESUMEN
                ================================================== */}

                <div className="flex flex-col bg-[#fbfcfb] p-5 lg:p-6">

                  <div className="flex-1 space-y-5">

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
                        Resumen
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-900">
                        Detalle de la venta
                      </p>
                    </div>

                    {/* PAGO */}

                    <div className="grid gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-600">
                          Método de pago
                        </label>

                        <select
                          value={
                            metodoPago
                          }
                          onChange={(e) =>
                            setMetodoPago(
                              e.target
                                .value
                            )
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#18a66b]"
                        >
                          <option value="EFECTIVO">
                            Efectivo
                          </option>

                          <option value="TRANSFERENCIA">
                            Transferencia
                          </option>

                          <option value="TARJETA">
                            Tarjeta
                          </option>

                          <option value="MERCADO_PAGO">
                            Mercado Pago
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-gray-600">
                          Descuento
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            descuento
                          }
                          onChange={(e) =>
                            setDescuento(
                              Math.max(
                                numero(
                                  e.target
                                    .value
                                ),
                                0
                              )
                            )
                          }
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#18a66b]"
                        />
                      </div>
                    </div>

                    {/* OBSERVACIONES */}

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-600">
                        Observaciones
                      </label>

                      <textarea
                        value={
                          observaciones
                        }
                        onChange={(e) =>
                          setObservaciones(
                            e.target
                              .value
                          )
                        }
                        rows={3}
                        placeholder="Opcional..."
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#18a66b]"
                      />
                    </div>

                    {/* RESUMEN ÚNICO */}

                    <div className="rounded-2xl border border-[#bcebd5] bg-[#e9f8f1] p-5">

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Subtotal
                        </span>

                        <span className="font-bold text-gray-900">
                          {moneda(
                            subtotalVenta
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Descuento
                        </span>

                        <span className="font-bold text-gray-900">
                          -{" "}
                          {moneda(
                            descuentoNumero
                          )}
                        </span>
                      </div>

                      <div className="mt-4 border-t border-[#bcebd5] pt-4">

                        <div className="flex items-end justify-between gap-3">
                          <span className="text-sm font-black text-[#148f5c]">
                            TOTAL
                          </span>

                          <span className="text-3xl font-black tracking-tight text-[#148f5c]">
                            {moneda(
                              totalVenta
                            )}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Ganancia
                          </span>

                          <span className="font-bold text-[#18a66b]">
                            {moneda(
                              gananciaVenta
                            )}
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* BOTONES */}

                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-3">

                      <button
                        type="button"
                        disabled={
                          guardandoVenta
                        }
                        onClick={
                          cerrarNuevaVenta
                        }
                        className="h-12 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Cancelar
                      </button>

                      <button
                        disabled={
                          guardandoVenta ||
                          detalles.length ===
                            0 ||
                          totalVenta <= 0
                        }
                        type="submit"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#18a66b] text-sm font-bold text-white shadow-sm hover:bg-[#148f5c] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {guardandoVenta ? (
                          <>
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Check
                              size={17}
                            />
                            Confirmar venta
                          </>
                        )}
                      </button>

                    </div>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          DETALLE VENTA
      ====================================================== */}

      {ventaSeleccionada && (
        <Modal
          title={`Venta #${ventaSeleccionada.id}`}
          onClose={() =>
            setVentaSeleccionada(null)
          }
        >
          <div className="space-y-4">

            <div className="rounded-xl bg-[#f6f9f7] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {ventaSeleccionada
                      .cliente?.nombre ||
                      "Consumidor final"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(
                      ventaSeleccionada.created_at
                    ).toLocaleString(
                      "es-AR"
                    )}
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                  {
                    ventaSeleccionada.estado
                  }
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {ventaSeleccionada.detalles?.map(
                (detalle) => (
                  <div
                    key={
                      detalle.id
                    }
                    className="flex items-center justify-between rounded-xl border border-gray-200 p-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {
                          detalle.producto_nombre
                        }
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {
                          detalle.cantidad
                        }{" "}
                        ×{" "}
                        {moneda(
                          numero(
                            detalle.precio_unitario
                          )
                        )}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-gray-900">
                      {moneda(
                        numero(
                          detalle.subtotal
                        )
                      )}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-4">

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-semibold">
                  {moneda(
                    numero(
                      ventaSeleccionada.subtotal
                    )
                  )}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">
                  Descuento
                </span>

                <span className="font-semibold">
                  -{" "}
                  {moneda(
                    numero(
                      ventaSeleccionada.descuento
                    )
                  )}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
                <span className="font-black">
                  Total
                </span>

                <span className="text-lg font-black text-[#18a66b]">
                  {moneda(
                    numero(
                      ventaSeleccionada.total
                    )
                  )}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xs">
                <span className="text-gray-500">
                  Ganancia
                </span>

                <span className="font-bold text-[#18a66b]">
                  {moneda(
                    numero(
                      ventaSeleccionada.ganancia
                    )
                  )}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xs">
                <span className="text-gray-500">
                  Pago
                </span>

                <span className="font-semibold text-gray-800">
                  {ventaSeleccionada.metodo_pago ||
                    "-"}
                </span>
              </div>

            </div>

            {ventaSeleccionada.observaciones && (
              <div className="rounded-xl bg-[#f6f9f7] p-3 text-xs text-gray-600">
                <strong>
                  Observaciones:
                </strong>{" "}
                {
                  ventaSeleccionada.observaciones
                }
              </div>
            )}

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setVentaSeleccionada(
                    null
                  )
                }
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>

          </div>
        </Modal>
      )}
    </main>
  );
}

/* ==========================================================
   MODAL DETALLE
========================================================== */

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3 sm:p-4">

      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-gray-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          {children}
        </div>

      </div>
    </div>
  );
}