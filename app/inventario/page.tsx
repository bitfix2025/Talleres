"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  DollarSign,
  Edit3,
  History,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
  Eye,
} from "lucide-react";

const TALLER_ID = 1;

const CATEGORIAS = [
  "Pantallas",
  "Baterías",
  "Flex / Conectores",
  "Repuestos",
  "Componentes",
  "Accesorios",
  "Herramientas",
  "Otros",
] as const;

type Producto = {
  id: number;
  nombre: string;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  sku: string | null;
  descripcion: string | null;
  image_url: string | null;
  costo: number;
  precio: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
};

type AccionStock = "ENTRADA" | "SALIDA" | null;

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor);

const selectProducto =
  "id,nombre,categoria,marca,modelo,sku,descripcion,image_url,costo,precio,stock_actual,stock_minimo,activo,created_at";

export default function InventarioPage() {
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<
    "TODOS" | "BAJO" | "AGOTADO"
  >("TODOS");

  const [categoriaActiva, setCategoriaActiva] =
    useState<string>("Todas");

  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);

  const [mostrarGestion, setMostrarGestion] = useState(false);
  const [mostrarVer, setMostrarVer] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);

  const [accionStock, setAccionStock] =
    useState<AccionStock>(null);

  const [cantidadStock, setCantidadStock] = useState("");
  const [motivoStock, setMotivoStock] = useState("");

  const [guardandoProducto, setGuardandoProducto] =
    useState(false);

  const [guardandoStock, setGuardandoStock] =
    useState(false);

  /* FOTO NUEVO PRODUCTO */
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState("");

  /* FOTO EDICIÓN */
  const [fotoEdicion, setFotoEdicion] =
    useState<File | null>(null);
  const [vistaPreviaEdicion, setVistaPreviaEdicion] =
    useState("");

  const [nuevo, setNuevo] = useState({
    nombre: "",
    categoria: "",
    marca: "",
    modelo: "",
    sku: "",
    costo: "",
    precio: "",
    stock: "0",
    stockMinimo: "0",
    descripcion: "",
  });

  const [editado, setEditado] = useState({
    nombre: "",
    categoria: "",
    marca: "",
    modelo: "",
    sku: "",
    costo: "",
    precio: "",
    stockMinimo: "",
    descripcion: "",
  });

  const cargarProductos = async () => {
    setCargando(true);
    setError("");

    const { data, error: errorProductos } =
      await supabase
        .from("productos")
        .select(selectProducto)
        .eq("taller_id", TALLER_ID)
        .eq("activo", true)
        .order("nombre", { ascending: true });

    if (errorProductos) {
      setError(
        `No se pudo cargar el inventario: ${errorProductos.message}`
      );
      setProductos([]);
    } else {
      setProductos((data ?? []) as Producto[]);
    }

    setCargando(false);
  };

  useEffect(() => {
    void cargarProductos();
  }, []);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideTexto =
        !texto ||
        [
          producto.nombre,
          producto.categoria,
          producto.marca,
          producto.modelo,
          producto.sku,
        ]
          .filter(Boolean)
          .some((valor) =>
            String(valor).toLowerCase().includes(texto)
          );

      const coincideFiltro =
        filtro === "TODOS" ||
        (filtro === "AGOTADO" &&
          producto.stock_actual <= 0) ||
        (filtro === "BAJO" &&
          producto.stock_actual > 0 &&
          producto.stock_actual <= producto.stock_minimo);

      const coincideCategoria =
        categoriaActiva === "Todas" ||
        producto.categoria === categoriaActiva;

      return (
        coincideTexto &&
        coincideFiltro &&
        coincideCategoria
      );
    });
  }, [
    productos,
    busqueda,
    filtro,
    categoriaActiva,
  ]);

  const estadisticas = useMemo(() => {
    const unidades = productos.reduce(
      (total, producto) =>
        total + producto.stock_actual,
      0
    );

    const bajos = productos.filter(
      (producto) =>
        producto.stock_actual > 0 &&
        producto.stock_actual <=
          producto.stock_minimo
    ).length;

    const agotados = productos.filter(
      (producto) =>
        producto.stock_actual <= 0
    ).length;

    const valor = productos.reduce(
      (total, producto) =>
        total +
        producto.stock_actual *
          producto.costo,
      0
    );

    return {
      productos: productos.length,
      unidades,
      bajos,
      agotados,
      valor,
    };
  }, [productos]);

  /* =====================================================
     FOTO NUEVO PRODUCTO
  ===================================================== */

  const seleccionarFoto = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const archivo =
      event.target.files?.[0] ?? null;

    setFoto(archivo);

    setVistaPrevia(
      archivo
        ? URL.createObjectURL(archivo)
        : ""
    );
  };

  /* =====================================================
     FOTO EDICIÓN
  ===================================================== */

  const seleccionarFotoEdicion = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const archivo =
      event.target.files?.[0] ?? null;

    setFotoEdicion(archivo);

    setVistaPreviaEdicion(
      archivo
        ? URL.createObjectURL(archivo)
        : ""
    );
  };

  const cerrarNuevo = () => {
    setMostrarNuevo(false);
    setFoto(null);
    setVistaPrevia("");
  };

  const cerrarEditar = () => {
    setMostrarEditar(false);
    setFotoEdicion(null);
    setVistaPreviaEdicion("");
  };

  const abrirVer = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarVer(true);
  };

  const abrirGestionar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarGestion(true);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);

    setEditado({
      nombre: producto.nombre,
      categoria: producto.categoria ?? "",
      marca: producto.marca ?? "",
      modelo: producto.modelo ?? "",
      sku: producto.sku ?? "",
      costo: String(producto.costo),
      precio: String(producto.precio),
      stockMinimo: String(
        producto.stock_minimo
      ),
      descripcion:
        producto.descripcion ?? "",
    });

    /* IMPORTANTE:
       Si el producto ya tiene foto,
       mostramos esa foto.
    */
    setFotoEdicion(null);
    setVistaPreviaEdicion(
      producto.image_url ?? ""
    );

    setMostrarGestion(false);
    setMostrarEditar(true);
  };

  const abrirStock = (
    producto: Producto,
    tipo: AccionStock
  ) => {
    setProductoSeleccionado(producto);
    setAccionStock(tipo);
    setCantidadStock("");
    setMotivoStock("");

    setMostrarGestion(false);
  };

  /* =====================================================
     CREAR PRODUCTO
  ===================================================== */

  const guardarProducto = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!nuevo.nombre.trim()) {
      setError(
        "El nombre del producto es obligatorio."
      );
      return;
    }

    const stock = Math.max(
      0,
      Number(nuevo.stock) || 0
    );

    const stockMinimo = Math.max(
      0,
      Number(nuevo.stockMinimo) || 0
    );

    const costo = Math.max(
      0,
      Number(nuevo.costo) || 0
    );

    const precio = Math.max(
      0,
      Number(nuevo.precio) || 0
    );

    setGuardandoProducto(true);
    setError("");

    let imageUrl: string | null = null;

    if (foto) {
      const extension =
        foto.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const nombreArchivo = `${TALLER_ID}/${crypto.randomUUID()}.${extension}`;

      const { error: errorUpload } =
        await supabase.storage
          .from("recepcion-fotos")
          .upload(
            nombreArchivo,
            foto,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: foto.type,
            }
          );

      if (errorUpload) {
        setError(
          `No se pudo subir la foto: ${errorUpload.message}`
        );
        setGuardandoProducto(false);
        return;
      }

      imageUrl =
        supabase.storage
          .from("recepcion-fotos")
          .getPublicUrl(nombreArchivo)
          .data.publicUrl;
    }

    const { data, error: errorProducto } =
      await supabase
        .from("productos")
        .insert({
          taller_id: TALLER_ID,
          nombre: nuevo.nombre.trim(),
          categoria:
            nuevo.categoria.trim() || null,
          marca:
            nuevo.marca.trim() || null,
          modelo:
            nuevo.modelo.trim() || null,
          sku:
            nuevo.sku.trim() || null,
          descripcion:
            nuevo.descripcion.trim() || null,
          image_url: imageUrl,
          costo,
          precio,
          stock_actual: stock,
          stock_minimo: stockMinimo,
          activo: true,
        })
        .select(selectProducto)
        .single();

    if (errorProducto) {
      setError(
        `No se pudo crear el producto: ${errorProducto.message}`
      );
      setGuardandoProducto(false);
      return;
    }

    if (stock > 0) {
      const {
        error: errorMovimiento,
      } = await supabase
        .from("movimientos_stock")
        .insert({
          taller_id: TALLER_ID,
          producto_id: data.id,
          tipo: "ENTRADA",
          cantidad: stock,
          motivo: "Stock inicial",
          referencia_tipo: "PRODUCTO",
          referencia_id: data.id,
          costo_unitario: costo,
        });

      if (errorMovimiento) {
        setError(
          `Producto creado, pero no se pudo guardar el movimiento inicial: ${errorMovimiento.message}`
        );
      }
    }

    setProductos((actuales) =>
      [...actuales, data as Producto].sort(
        (a, b) =>
          a.nombre.localeCompare(
            b.nombre
          )
      )
    );

    cerrarNuevo();

    setNuevo({
      nombre: "",
      categoria: "",
      marca: "",
      modelo: "",
      sku: "",
      costo: "",
      precio: "",
      stock: "0",
      stockMinimo: "0",
      descripcion: "",
    });

    setGuardandoProducto(false);

    mostrarMensaje(
      "Producto creado correctamente."
    );
  };

  /* =====================================================
     EDITAR PRODUCTO
     INCLUYE CAMBIO DE FOTO
  ===================================================== */

  const guardarEdicion = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !productoSeleccionado ||
      !editado.nombre.trim()
    ) {
      return;
    }

    setGuardandoProducto(true);
    setError("");

    const costo = Math.max(
      0,
      Number(editado.costo) || 0
    );

    const precio = Math.max(
      0,
      Number(editado.precio) || 0
    );

    const stockMinimo = Math.max(
      0,
      Number(editado.stockMinimo) || 0
    );

    /*
      Solo subimos una foto si el usuario
      seleccionó una nueva.
    */
    let imageUrl =
      productoSeleccionado.image_url;

    if (fotoEdicion) {
      const extension =
        fotoEdicion.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const nombreArchivo = `${TALLER_ID}/${crypto.randomUUID()}.${extension}`;

      const { error: errorUpload } =
        await supabase.storage
          .from("recepcion-fotos")
          .upload(
            nombreArchivo,
            fotoEdicion,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                fotoEdicion.type,
            }
          );

      if (errorUpload) {
        setError(
          `No se pudo subir la foto: ${errorUpload.message}`
        );
        setGuardandoProducto(false);
        return;
      }

      imageUrl =
        supabase.storage
          .from("recepcion-fotos")
          .getPublicUrl(nombreArchivo)
          .data.publicUrl;
    }

    const { data, error } =
      await supabase
        .from("productos")
        .update({
          nombre:
            editado.nombre.trim(),
          categoria:
            editado.categoria.trim() ||
            null,
          marca:
            editado.marca.trim() ||
            null,
          modelo:
            editado.modelo.trim() ||
            null,
          sku:
            editado.sku.trim() ||
            null,
          costo,
          precio,
          stock_minimo: stockMinimo,
          descripcion:
            editado.descripcion.trim() ||
            null,

          /*
            ESTE ES EL ÚNICO CAMPO NUEVO
            relacionado con la foto.
          */
          image_url: imageUrl,
        })
        .eq(
          "id",
          productoSeleccionado.id
        )
        .eq("taller_id", TALLER_ID)
        .select(selectProducto)
        .single();

    if (error) {
      setError(
        `No se pudo actualizar el producto: ${error.message}`
      );
      setGuardandoProducto(false);
      return;
    }

    setProductos((actuales) =>
      actuales
        .map((producto) =>
          producto.id === data.id
            ? (data as Producto)
            : producto
        )
        .sort((a, b) =>
          a.nombre.localeCompare(
            b.nombre
          )
        )
    );

    setProductoSeleccionado(
      data as Producto
    );

    setFotoEdicion(null);
    setVistaPreviaEdicion(
      data.image_url ?? ""
    );

    setMostrarEditar(false);
    setGuardandoProducto(false);

    mostrarMensaje(
      "Producto actualizado correctamente."
    );
  };

  /* =====================================================
     STOCK
  ===================================================== */

  const guardarMovimientoStock = async () => {
    if (
      !productoSeleccionado ||
      !accionStock
    ) {
      return;
    }

    const cantidad = Math.floor(
      Number(cantidadStock) || 0
    );

    if (cantidad <= 0) {
      setError(
        "Ingresá una cantidad válida."
      );
      return;
    }

    if (
      accionStock === "SALIDA" &&
      cantidad >
        productoSeleccionado.stock_actual
    ) {
      setError(
        "No hay suficiente stock disponible para realizar esta salida."
      );
      return;
    }

    setGuardandoStock(true);
    setError("");

    const nuevoStock =
      accionStock === "ENTRADA"
        ? productoSeleccionado.stock_actual +
          cantidad
        : productoSeleccionado.stock_actual -
          cantidad;

    const {
      error: errorMovimiento,
    } = await supabase
      .from("movimientos_stock")
      .insert({
        taller_id: TALLER_ID,
        producto_id:
          productoSeleccionado.id,
        tipo: accionStock,
        cantidad,
        motivo:
          motivoStock.trim() ||
          (accionStock ===
          "ENTRADA"
            ? "Entrada manual"
            : "Salida manual"),
        referencia_tipo:
          "AJUSTE_MANUAL",
        referencia_id:
          productoSeleccionado.id,
        costo_unitario:
          productoSeleccionado.costo,
      });

    if (errorMovimiento) {
      setError(
        `No se pudo registrar el movimiento: ${errorMovimiento.message}`
      );
      setGuardandoStock(false);
      return;
    }

    const {
      data: productoActualizado,
      error: errorProducto,
    } = await supabase
      .from("productos")
      .update({
        stock_actual: nuevoStock,
      })
      .eq(
        "id",
        productoSeleccionado.id
      )
      .eq("taller_id", TALLER_ID)
      .select(selectProducto)
      .single();

    if (errorProducto) {
      setError(
        `El movimiento fue registrado, pero no se pudo actualizar el stock: ${errorProducto.message}`
      );
      setGuardandoStock(false);
      return;
    }

    setProductos((actuales) =>
      actuales.map((producto) =>
        producto.id ===
        productoActualizado.id
          ? (productoActualizado as Producto)
          : producto
      )
    );

    setProductoSeleccionado(
      productoActualizado as Producto
    );

    setAccionStock(null);
    setCantidadStock("");
    setMotivoStock("");
    setGuardandoStock(false);

    mostrarMensaje(
      accionStock === "ENTRADA"
        ? "Entrada registrada correctamente."
        : "Salida registrada correctamente."
    );
  };

  /* =====================================================
     DESACTIVAR
  ===================================================== */

  const desactivarProducto = async () => {
    if (!productoSeleccionado) {
      return;
    }

    const confirmar = window.confirm(
      `¿Querés desactivar "${productoSeleccionado.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    setError("");

    const { error } = await supabase
      .from("productos")
      .update({
        activo: false,
      })
      .eq(
        "id",
        productoSeleccionado.id
      )
      .eq("taller_id", TALLER_ID);

    if (error) {
      setError(
        `No se pudo desactivar el producto: ${error.message}`
      );
      return;
    }

    setProductos((actuales) =>
      actuales.filter(
        (producto) =>
          producto.id !==
          productoSeleccionado.id
      )
    );

    setMostrarGestion(false);
    setProductoSeleccionado(null);

    mostrarMensaje(
      "Producto desactivado."
    );
  };

  const mostrarMensaje = (
    texto: string
  ) => {
    setMensaje(texto);

    setTimeout(() => {
      setMensaje("");
    }, 3000);
  };

  const estadoStock = (
    producto: Producto
  ) => {
    if (
      producto.stock_actual <= 0
    ) {
      return {
        texto: "Agotado",
        clase:
          "bg-red-50 text-red-700",
        punto: "bg-red-500",
      };
    }

    if (
      producto.stock_actual <=
      producto.stock_minimo
    ) {
      return {
        texto: "Stock bajo",
        clase:
          "bg-yellow-50 text-yellow-700",
        punto: "bg-yellow-500",
      };
    }

    return {
      texto: "Disponible",
      clase:
        "bg-green-50 text-green-700",
      punto: "bg-green-500",
    };
  };

  const margenProducto = (
    producto: Producto
  ) => {
    if (producto.precio <= 0) {
      return 0;
    }

    return (
      ((producto.precio -
        producto.costo) /
        producto.precio) *
      100
    );
  };

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#17201b]">

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">

        {/* NAVEGACIÓN */}

        <div className="mb-5 flex items-center justify-between">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-600 shadow-sm transition hover:border-[#bcebd5] hover:text-[#148f5c]"
          >
            <ArrowLeft size={16} />
            Inicio
          </button>

          <div className="hidden items-center gap-2 text-xs text-gray-400 sm:flex">
            <span>Gestión</span>
            <span>/</span>
            <span className="font-semibold text-gray-700">
              Inventario
            </span>
          </div>

        </div>

        {/* ENCABEZADO */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#18a66b]">
              Gestión
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
              Inventario
            </h1>

            <p className="mt-2 max-w-xl text-sm text-gray-500">
              Controlá repuestos, componentes,
              accesorios y stock del taller desde
              un solo lugar.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarNuevo(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#18a66b]/15 transition hover:bg-[#148f5c] active:scale-[0.98]"
          >
            <Plus size={17} />
            Agregar producto
          </button>

        </div>

        {/* MENSAJE */}

        {mensaje && (
          <div className="fixed right-4 top-5 z-[100] flex items-center gap-2 rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-xl">
            <CheckCircle2 size={17} />
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={<Package size={19} />}
            label="Productos"
            value={String(
              estadisticas.productos
            )}
          />

          <StatCard
            icon={<Boxes size={19} />}
            label="Unidades"
            value={String(
              estadisticas.unidades
            )}
          />

          <StatCard
            icon={
              <AlertTriangle
                size={19}
              />
            }
            label="Stock bajo"
            value={String(
              estadisticas.bajos
            )}
          />

          <StatCard
            icon={
              <DollarSign size={19} />
            }
            label="Valor del inventario"
            value={moneda(
              estadisticas.valor
            )}
          />

        </div>

        {/* INVENTARIO */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* FILTROS */}

          <div className="border-b border-gray-100 p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="relative w-full lg:max-w-md">

                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value
                    )
                  }
                  placeholder="Buscar producto, modelo o SKU..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] pl-10 pr-4 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
                />

              </div>

              <div className="flex gap-2 overflow-x-auto">

                {[
                  ["TODOS", "Todos"],
                  ["BAJO", "Stock bajo"],
                  ["AGOTADO", "Agotados"],
                ].map(
                  ([valor, etiqueta]) => (
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
                  )
                )}

              </div>

            </div>

            {/* CATEGORÍAS */}

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">

              {[
                "Todas",
                ...CATEGORIAS,
              ].map(
                (categoria) => (
                  <button
                    key={categoria}
                    type="button"
                    onClick={() =>
                      setCategoriaActiva(
                        categoria
                      )
                    }
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
                      categoriaActiva ===
                      categoria
                        ? "border-[#18a66b] bg-[#18a66b] text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-[#bcebd5] hover:text-[#148f5c]"
                    }`}
                  >
                    {categoria}
                  </button>
                )
              )}

            </div>

          </div>

          {/* CONTENIDO */}

          {cargando ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">

                <Loader2
                  size={20}
                  className="animate-spin text-[#18a66b]"
                />

                Cargando inventario...

              </div>

            </div>
          ) : productosFiltrados.length ===
            0 ? (

            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8f1]">
                <Package
                  size={24}
                  className="text-[#18a66b]"
                />
              </div>

              <h2 className="mt-4 text-sm font-bold text-gray-900">
                No hay productos
              </h2>

              <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                No encontramos productos con
                los filtros seleccionados.
              </p>

              <button
                type="button"
                onClick={() =>
                  setMostrarNuevo(true)
                }
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#18a66b] px-4 py-2.5 text-xs font-bold text-white"
              >
                <Plus size={15} />
                Agregar producto
              </button>

            </div>

          ) : (

            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {productosFiltrados.map(
                (producto) => {
                  const estado =
                    estadoStock(
                      producto
                    );

                  const margen =
                    margenProducto(
                      producto
                    );

                  return (
                    <article
                      key={producto.id}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-[#bcebd5] hover:shadow-lg"
                    >

                      {/* FOTO */}

                      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#f6f9f7]">

                        {producto.image_url ? (
                          <img
                            src={
                              producto.image_url
                            }
                            alt={
                              producto.nombre
                            }
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e9f8f1] text-[#18a66b]">
                            <Package
                              size={34}
                            />
                          </div>
                        )}

                        {producto.categoria && (
                          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-gray-600 shadow-sm">
                            {
                              producto.categoria
                            }
                          </span>
                        )}

                        <span
                          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${estado.clase}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${estado.punto}`}
                          />
                          {
                            estado.texto
                          }
                        </span>

                      </div>

                      {/* INFORMACIÓN */}

                      <div className="p-4">

                        <div className="min-h-[66px]">

                          <h3 className="line-clamp-2 text-base font-black text-gray-950">
                            {
                              producto.nombre
                            }
                          </h3>

                          <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                            {[
                              producto.marca,
                              producto.modelo,
                              producto.sku
                                ? `SKU ${producto.sku}`
                                : null,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " · "
                              ) ||
                              "Sin datos adicionales"}
                          </p>

                        </div>

                        {/* COSTO / PRECIO */}

                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#f8faf9] p-3">

                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                              Costo
                            </p>

                            <p className="mt-0.5 text-sm font-black text-gray-700">
                              {moneda(
                                producto.costo
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                              Precio
                            </p>

                            <p className="mt-0.5 text-sm font-black text-gray-950">
                              {moneda(
                                producto.precio
                              )}
                            </p>
                          </div>

                        </div>

                        {/* MARGEN */}

                        <div className="mt-2 flex items-center justify-between rounded-xl bg-[#f8faf9] px-3 py-2">

                          <span className="text-[10px] font-bold uppercase text-gray-400">
                            Margen
                          </span>

                          <span className="text-xs font-black text-[#148f5c]">
                            {moneda(
                              producto.precio -
                                producto.costo
                            )}{" "}
                            ·{" "}
                            {margen.toFixed(
                              1
                            )}
                            %
                          </span>

                        </div>

                        {/* STOCK */}

                        <div className="mt-3 flex items-center justify-between">

                          <div>
                            <span className="text-xl font-black text-gray-950">
                              {
                                producto.stock_actual
                              }
                            </span>

                            <span className="ml-1 text-xs text-gray-400">
                              unidades
                            </span>
                          </div>

                          <span className="text-[10px] font-semibold text-gray-400">
                            Mín.{" "}
                            {
                              producto.stock_minimo
                            }
                          </span>

                        </div>

                        {/* ACCIONES */}

                        <div className="mt-4 grid grid-cols-2 gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              abrirVer(
                                producto
                              )
                            }
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                          >
                            <Eye size={14} />
                            Ver
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              abrirGestionar(
                                producto
                              )
                            }
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#18a66b] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#148f5c]"
                          >
                            <Settings2
                              size={14}
                            />
                            Gestionar
                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>

      {/* =====================================================
          MODAL VER
      ===================================================== */}

      {mostrarVer &&
        productoSeleccionado && (
          <Modal
            title="Información del producto"
            onClose={() => {
              setMostrarVer(false);
              setProductoSeleccionado(
                null
              );
            }}
          >

            <div className="space-y-5">

              <div className="overflow-hidden rounded-2xl bg-[#f6f9f7]">

                <div className="flex h-56 items-center justify-center">

                  {productoSeleccionado.image_url ? (
                    <img
                      src={
                        productoSeleccionado.image_url
                      }
                      alt={
                        productoSeleccionado.nombre
                      }
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e9f8f1] text-[#18a66b]">
                      <Package
                        size={35}
                      />
                    </div>
                  )}

                </div>

              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-[#18a66b]">
                  Producto
                </p>

                <h2 className="mt-1 text-2xl font-black text-gray-950">
                  {
                    productoSeleccionado.nombre
                  }
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {[
                    productoSeleccionado.marca,
                    productoSeleccionado.modelo,
                  ]
                    .filter(Boolean)
                    .join(" · ") ||
                    "Sin marca o modelo"}
                </p>

              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <InfoBox
                  label="Categoría"
                  value={
                    productoSeleccionado.categoria ||
                    "Sin categoría"
                  }
                />

                <InfoBox
                  label="SKU"
                  value={
                    productoSeleccionado.sku ||
                    "Sin SKU"
                  }
                />

                <InfoBox
                  label="Costo"
                  value={moneda(
                    productoSeleccionado.costo
                  )}
                />

                <InfoBox
                  label="Precio"
                  value={moneda(
                    productoSeleccionado.precio
                  )}
                />

                <InfoBox
                  label="Stock actual"
                  value={`${productoSeleccionado.stock_actual} unidades`}
                />

                <InfoBox
                  label="Stock mínimo"
                  value={`${productoSeleccionado.stock_minimo} unidades`}
                />

              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

                <p className="text-xs font-bold text-gray-500">
                  Margen estimado
                </p>

                <p className="mt-1 text-xl font-black text-[#148f5c]">
                  {moneda(
                    productoSeleccionado.precio -
                      productoSeleccionado.costo
                  )}

                  <span className="ml-2 text-sm">
                    (
                    {margenProducto(
                      productoSeleccionado
                    ).toFixed(1)}
                    %)
                  </span>
                </p>

              </div>

              {productoSeleccionado.descripcion && (
                <div>

                  <p className="text-xs font-bold text-gray-500">
                    Descripción
                  </p>

                  <p className="mt-2 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    {
                      productoSeleccionado.descripcion
                    }
                  </p>

                </div>
              )}

            </div>

          </Modal>
        )}

      {/* =====================================================
          MODAL GESTIONAR
      ===================================================== */}

      {mostrarGestion &&
        productoSeleccionado && (
          <Modal
            title="Gestionar producto"
            onClose={() => {
              setMostrarGestion(false);
              setProductoSeleccionado(
                null
              );
            }}
          >

            <div className="space-y-5">

              <div className="rounded-2xl border border-gray-100 bg-[#f8faf9] p-4">

                <p className="text-xs font-bold uppercase tracking-wider text-[#18a66b]">
                  Producto
                </p>

                <h2 className="mt-1 text-lg font-black text-gray-950">
                  {
                    productoSeleccionado.nombre
                  }
                </h2>

                <div className="mt-3 flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Stock actual
                  </span>

                  <span className="text-xl font-black text-gray-950">
                    {
                      productoSeleccionado.stock_actual
                    }
                  </span>

                </div>

              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() =>
                    abrirStock(
                      productoSeleccionado,
                      "ENTRADA"
                    )
                  }
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#bcebd5] hover:bg-[#f8fffb]"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
                    <ArrowDownToLine
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      Entrada
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Agregar unidades al stock
                    </p>
                  </div>

                </button>

                <button
                  type="button"
                  onClick={() =>
                    abrirStock(
                      productoSeleccionado,
                      "SALIDA"
                    )
                  }
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/30"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <ArrowUpFromLine
                      size={20}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      Salida
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Retirar unidades del stock
                    </p>
                  </div>

                </button>

                <button
                  type="button"
                  onClick={() =>
                    abrirEditar(
                      productoSeleccionado
                    )
                  }
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:bg-gray-50"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                    <Edit3 size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      Editar producto
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Datos, precios y stock mínimo
                    </p>
                  </div>

                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarGestion(false);
                    setMostrarVer(true);
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:bg-gray-50"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                    <Eye size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      Ver ficha
                    </p>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Consultar información
                    </p>
                  </div>

                </button>

              </div>

              <div className="border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    mostrarMensaje(
                      "El historial de movimientos se conectará con la vista de movimientos."
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                >

                  <History
                    size={18}
                    className="text-gray-500"
                  />

                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      Historial de movimientos
                    </p>

                    <p className="text-xs text-gray-400">
                      Ver entradas y salidas del producto
                    </p>
                  </div>

                </button>

                <button
                  type="button"
                  onClick={
                    desactivarProducto
                  }
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-red-600 transition hover:bg-red-50"
                >

                  <Trash2 size={18} />

                  <div>
                    <p className="text-sm font-bold">
                      Desactivar producto
                    </p>

                    <p className="text-xs text-red-400">
                      El producto dejará de aparecer en inventario
                    </p>
                  </div>

                </button>

              </div>

            </div>

          </Modal>
        )}

      {/* =====================================================
          MODAL STOCK
      ===================================================== */}

      {accionStock &&
        productoSeleccionado && (
          <Modal
            title={
              accionStock ===
              "ENTRADA"
                ? "Entrada de stock"
                : "Salida de stock"
            }
            onClose={() => {
              setAccionStock(null);
              setCantidadStock("");
              setMotivoStock("");
            }}
          >

            <div className="space-y-5">

              <div className="rounded-2xl bg-[#f8faf9] p-4">

                <p className="text-xs font-bold text-gray-400">
                  Producto
                </p>

                <p className="mt-1 text-base font-black text-gray-950">
                  {
                    productoSeleccionado.nombre
                  }
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">

                  <span className="text-xs text-gray-500">
                    Stock actual
                  </span>

                  <span className="text-lg font-black">
                    {
                      productoSeleccionado.stock_actual
                    }
                  </span>

                </div>

              </div>

              <Field
                label="Cantidad *"
                type="number"
                min="1"
                step="1"
                value={
                  cantidadStock
                }
                onChange={
                  setCantidadStock
                }
                placeholder="Ej. 5"
              />

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">
                  Motivo
                </label>

                <input
                  value={motivoStock}
                  onChange={(event) =>
                    setMotivoStock(
                      event.target.value
                    )
                  }
                  placeholder={
                    accionStock ===
                    "ENTRADA"
                      ? "Ej. Compra de mercadería"
                      : "Ej. Uso en reparación"
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
                />
              </div>

              <div
                className={`rounded-xl p-4 ${
                  accionStock ===
                  "ENTRADA"
                    ? "bg-[#e9f8f1] text-[#148f5c]"
                    : "bg-orange-50 text-orange-700"
                }`}
              >

                <p className="text-xs font-bold">
                  Nuevo stock
                </p>

                <p className="mt-1 text-2xl font-black">

                  {accionStock ===
                  "ENTRADA"
                    ? productoSeleccionado.stock_actual +
                      (Number(
                        cantidadStock
                      ) || 0)
                    : Math.max(
                        0,
                        productoSeleccionado.stock_actual -
                          (Number(
                            cantidadStock
                          ) || 0)
                      )}

                  <span className="ml-1 text-xs font-bold">
                    unidades
                  </span>

                </p>

              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setAccionStock(
                      null
                    )
                  }
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={
                    guardandoStock
                  }
                  onClick={
                    guardarMovimientoStock
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >

                  {guardandoStock && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Confirmar{" "}
                  {accionStock ===
                  "ENTRADA"
                    ? "entrada"
                    : "salida"}

                </button>

              </div>

            </div>

          </Modal>
        )}

      {/* =====================================================
          MODAL EDITAR
      ===================================================== */}

      {mostrarEditar &&
        productoSeleccionado && (
          <Modal
            title="Editar producto"
            onClose={
              cerrarEditar
            }
          >

            <form
              onSubmit={
                guardarEdicion
              }
              className="space-y-4"
            >

              {/* FOTO DEL PRODUCTO */}

              <div className="rounded-2xl border border-gray-200 bg-[#f8faf9] p-4">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                  <label className="group relative flex h-28 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">

                    {vistaPreviaEdicion ? (
                      <img
                        src={
                          vistaPreviaEdicion
                        }
                        alt={
                          productoSeleccionado.nombre
                        }
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-gray-300">
                        <ImagePlus
                          size={28}
                        />
                        <span className="text-[9px] font-bold">
                          Sin foto
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">

                      <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-black text-gray-700">
                        <ImagePlus size={13} />
                        Cambiar
                      </div>

                    </div>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        seleccionarFotoEdicion
                      }
                      className="sr-only"
                    />

                  </label>

                  <div className="min-w-0">

                    <p className="text-xs font-black uppercase tracking-wider text-[#18a66b]">
                      Foto del producto
                    </p>

                    <p className="mt-1 text-sm font-black text-gray-800">
                      {fotoEdicion
                        ? "Nueva foto seleccionada"
                        : productoSeleccionado.image_url
                        ? "Foto actual"
                        : "Este producto no tiene foto"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      Hacé clic en la imagen para
                      agregar o cambiar la foto.
                      JPG, PNG o WEBP.
                    </p>

                    {fotoEdicion && (
                      <button
                        type="button"
                        onClick={() => {
                          setFotoEdicion(null);
                          setVistaPreviaEdicion(
                            productoSeleccionado.image_url ??
                              ""
                          );
                        }}
                        className="mt-2 text-xs font-bold text-red-500 hover:text-red-600"
                      >
                        Cancelar nueva foto
                      </button>
                    )}

                  </div>

                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <Field
                  label="Nombre *"
                  value={
                    editado.nombre
                  }
                  onChange={(value) =>
                    setEditado({
                      ...editado,
                      nombre: value,
                    })
                  }
                />

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">
                    Categoría
                  </label>

                  <select
                    value={
                      editado.categoria
                    }
                    onChange={(event) =>
                      setEditado({
                        ...editado,
                        categoria:
                          event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
                  >
                    <option value="">
                      Sin categoría
                    </option>

                    {CATEGORIAS.map(
                      (categoria) => (
                        <option
                          key={
                            categoria
                          }
                          value={
                            categoria
                          }
                        >
                          {categoria}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <Field
                  label="Marca"
                  value={
                    editado.marca
                  }
                  onChange={(value) =>
                    setEditado({
                      ...editado,
                      marca: value,
                    })
                  }
                />

                <Field
                  label="Modelo"
                  value={
                    editado.modelo
                  }
                  onChange={(value) =>
                    setEditado({
                      ...editado,
                      modelo: value,
                    })
                  }
                />

                <Field
                  label="SKU"
                  value={
                    editado.sku
                  }
                  onChange={(value) =>
                    setEditado({
                      ...editado,
                      sku: value,
                    })
                  }
                />

                <Field
                  label="Costo (USD)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    editado.costo
                  }
                  onChange={(value) =>
                    setEditado({
                      ...editado,
                      costo: value,
                    })
                  }
                />

                <Field
                  label="Precio (USD)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    editado.precio
                  }
                  onChange={(value) =>
                    setEditado({
                      ...editado,
                      precio: value,
                    })
                  }
                />

                <Field
                  label="Stock mínimo"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    editado.stockMinimo
                  }
                  onChange={(value) =>
                    setEditado({
                      ...editado,
                      stockMinimo:
                        value,
                    })
                  }
                />

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-bold text-gray-600">
                  Descripción
                </label>

                <textarea
                  value={
                    editado.descripcion
                  }
                  onChange={(event) =>
                    setEditado({
                      ...editado,
                      descripcion:
                        event.target.value,
                    })
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-[#f8faf9] px-3 py-2.5 text-sm outline-none focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
                />

              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={
                    cerrarEditar
                  }
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancelar
                </button>

                <button
                  disabled={
                    guardandoProducto
                  }
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >

                  {guardandoProducto && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Guardar cambios

                </button>

              </div>

            </form>

          </Modal>
        )}

      {/* =====================================================
          MODAL NUEVO PRODUCTO
      ===================================================== */}

      {mostrarNuevo && (
        <Modal
          title="Agregar producto"
          onClose={
            cerrarNuevo
          }
        >

          <form
            onSubmit={
              guardarProducto
            }
            className="space-y-4"
          >

            {/* FOTO */}

            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-[#f8faf9] p-4 transition hover:border-[#18a66b]">

              <div className="flex items-center gap-4">

                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">

                  {vistaPrevia ? (
                    <img
                      src={
                        vistaPrevia
                      }
                      alt="Vista previa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus
                      size={30}
                      className="text-gray-300"
                    />
                  )}

                </div>

                <div>

                  <p className="text-sm font-black text-gray-800">
                    Agregar foto
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    JPG, PNG o WEBP.
                    Recomendado: foto
                    clara del repuesto.
                  </p>

                </div>

              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  seleccionarFoto
                }
                className="sr-only"
              />

            </label>

            {/* CAMPOS */}

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                label="Nombre *"
                value={
                  nuevo.nombre
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    nombre: value,
                  })
                }
                placeholder="Ej. Pantalla iPhone 13"
              />

              <div>

                <label className="mb-1.5 block text-xs font-bold text-gray-600">
                  Categoría
                </label>

                <select
                  value={
                    nuevo.categoria
                  }
                  onChange={(event) =>
                    setNuevo({
                      ...nuevo,
                      categoria:
                        event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"
                >

                  <option value="">
                    Seleccionar categoría
                  </option>

                  {CATEGORIAS.map(
                    (categoria) => (
                      <option
                        key={
                          categoria
                        }
                        value={
                          categoria
                        }
                      >
                        {categoria}
                      </option>
                    )
                  )}

                </select>

              </div>

              <Field
                label="Marca"
                value={
                  nuevo.marca
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    marca: value,
                  })
                }
                placeholder="Ej. JK"
              />

              <Field
                label="Modelo"
                value={
                  nuevo.modelo
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    modelo: value,
                  })
                }
                placeholder="iPhone 13"
              />

              <Field
                label="SKU"
                value={
                  nuevo.sku
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    sku: value,
                  })
                }
                placeholder="IP13-OLED-01"
              />

              <Field
                label="Costo (USD)"
                type="number"
                min="0"
                step="0.01"
                value={
                  nuevo.costo
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    costo: value,
                  })
                }
                placeholder="0.00"
              />

              <Field
                label="Precio (USD)"
                type="number"
                min="0"
                step="0.01"
                value={
                  nuevo.precio
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    precio: value,
                  })
                }
                placeholder="0.00"
              />

              <Field
                label="Stock inicial"
                type="number"
                min="0"
                step="1"
                value={
                  nuevo.stock
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    stock: value,
                  })
                }
                placeholder="0"
              />

              <Field
                label="Stock mínimo"
                type="number"
                min="0"
                step="1"
                value={
                  nuevo.stockMinimo
                }
                onChange={(value) =>
                  setNuevo({
                    ...nuevo,
                    stockMinimo:
                      value,
                  })
                }
                placeholder="0"
              />

            </div>

            {/* DESCRIPCIÓN */}

            <div>

              <label className="mb-1.5 block text-xs font-bold text-gray-600">
                Descripción
              </label>

              <textarea
                value={
                  nuevo.descripcion
                }
                onChange={(event) =>
                  setNuevo({
                    ...nuevo,
                    descripcion:
                      event.target.value,
                  })
                }
                rows={3}
                placeholder="Información adicional del repuesto..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-[#f8faf9] px-3 py-2.5 text-sm outline-none focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
              />

            </div>

            {/* BOTONES */}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

              <button
                type="button"
                onClick={
                  cerrarNuevo
                }
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
                disabled={
                  guardandoProducto
                }
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >

                {guardandoProducto && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                Guardar producto

              </button>

            </div>

          </form>

        </Modal>
      )}

    </main>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">
          {icon}
        </div>

        <Boxes
          size={16}
          className="text-gray-200"
        />

      </div>

      <p className="mt-4 text-xs font-semibold text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-gray-950">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   INFO BOX
===================================================== */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">

      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-gray-900">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   FIELD
===================================================== */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-bold text-gray-600">
        {label}
      </label>

      <input
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10"
      />

    </div>
  );
}

/* =====================================================
   MODAL
===================================================== */

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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">

          <h2 className="text-lg font-black text-gray-950">
            {title}
          </h2>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={19} />
          </button>

        </div>

        <div className="p-5 sm:p-6">
          {children}
        </div>

      </div>

    </div>
  );
}