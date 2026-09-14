"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  Check,
  DollarSign,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Search,
  X,
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

type Categoria = (typeof CATEGORIAS)[number];
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

type MovimientoTipo = "ENTRADA" | "SALIDA";

const moneda = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor);

const selectProducto =
  "id,nombre,categoria,marca,modelo,sku,descripcion,image_url,costo,precio,stock_actual,stock_minimo,activo,created_at";

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"TODOS" | "BAJO" | "AGOTADO">("TODOS");
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todas");
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [productoMovimiento, setProductoMovimiento] = useState<Producto | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<MovimientoTipo>("ENTRADA");
  const [cantidadMovimiento, setCantidadMovimiento] = useState("1");
  const [motivoMovimiento, setMotivoMovimiento] = useState("");
  const [guardandoMovimiento, setGuardandoMovimiento] = useState(false);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState("");

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

  const cargarProductos = async () => {
    setCargando(true);
    setError("");

    const { data, error: errorProductos } = await supabase
      .from("productos")
      .select(selectProducto)
      .eq("taller_id", TALLER_ID)
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (errorProductos) {
      setError(`No se pudo cargar el inventario: ${errorProductos.message}`);
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
        [producto.nombre, producto.categoria, producto.marca, producto.modelo, producto.sku]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(texto));

      const coincideFiltro =
        filtro === "TODOS" ||
        (filtro === "AGOTADO" && producto.stock_actual <= 0) ||
        (filtro === "BAJO" && producto.stock_actual > 0 && producto.stock_actual <= producto.stock_minimo);

      const coincideCategoria = categoriaActiva === "Todas" || producto.categoria === categoriaActiva;

      return coincideTexto && coincideFiltro && coincideCategoria;
    });
  }, [productos, busqueda, filtro, categoriaActiva]);

  const estadisticas = useMemo(() => {
    const unidades = productos.reduce((total, producto) => total + producto.stock_actual, 0);
    const bajos = productos.filter(
      (producto) => producto.stock_actual > 0 && producto.stock_actual <= producto.stock_minimo
    ).length;
    const agotados = productos.filter((producto) => producto.stock_actual <= 0).length;
    const valor = productos.reduce(
      (total, producto) => total + producto.stock_actual * producto.costo,
      0
    );

    return { productos: productos.length, unidades, bajos, agotados, valor };
  }, [productos]);

  const abrirMovimiento = (producto: Producto, tipo: MovimientoTipo) => {
    setProductoMovimiento(producto);
    setTipoMovimiento(tipo);
    setCantidadMovimiento("1");
    setMotivoMovimiento(tipo === "ENTRADA" ? "Entrada de mercadería" : "Ajuste / salida de stock");
  };

  const seleccionarFoto = (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0] ?? null;
    setFoto(archivo);
    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : "");
  };

  const cerrarNuevo = () => {
    setMostrarNuevo(false);
    setFoto(null);
    setVistaPrevia("");
  };

  const guardarProducto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!nuevo.nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    const stock = Math.max(0, Number(nuevo.stock) || 0);
    const stockMinimo = Math.max(0, Number(nuevo.stockMinimo) || 0);
    const costo = Math.max(0, Number(nuevo.costo) || 0);
    const precio = Math.max(0, Number(nuevo.precio) || 0);

    setGuardandoProducto(true);
    setError("");

    let imageUrl: string | null = null;

    if (foto) {
      const extension = foto.name.split(".").pop()?.toLowerCase() || "jpg";
      const nombreArchivo = `${TALLER_ID}/${crypto.randomUUID()}.${extension}`;
      const { error: errorUpload } = await supabase.storage.from("recepcion-fotos").upload(nombreArchivo, foto, {
        cacheControl: "3600",
        upsert: false,
        contentType: foto.type,
      });

      if (errorUpload) {
        setError(`No se pudo subir la foto: ${errorUpload.message}`);
        setGuardandoProducto(false);
        return;
      }

      imageUrl = supabase.storage.from("recepcion-fotos").getPublicUrl(nombreArchivo).data.publicUrl;
    }

    const { data, error: errorProducto } = await supabase
      .from("productos")
      .insert({
        taller_id: TALLER_ID,
        nombre: nuevo.nombre.trim(),
        categoria: nuevo.categoria.trim() || null,
        marca: nuevo.marca.trim() || null,
        modelo: nuevo.modelo.trim() || null,
        sku: nuevo.sku.trim() || null,
        descripcion: nuevo.descripcion.trim() || null,
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
      setError(`No se pudo crear el producto: ${errorProducto.message}`);
      setGuardandoProducto(false);
      return;
    }

    if (stock > 0) {
      const { error: errorMovimiento } = await supabase.from("movimientos_stock").insert({
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
        setError(`Producto creado, pero no se pudo guardar el movimiento inicial: ${errorMovimiento.message}`);
      }
    }

    setProductos((actuales) => [...actuales, data as Producto].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    cerrarNuevo();
    setNuevo({ nombre: "", categoria: "", marca: "", modelo: "", sku: "", costo: "", precio: "", stock: "0", stockMinimo: "0", descripcion: "" });
    setGuardandoProducto(false);
    setMensaje("Producto creado correctamente.");
    setTimeout(() => setMensaje(""), 3000);
  };

  const guardarMovimiento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productoMovimiento) return;

    const cantidad = Math.floor(Number(cantidadMovimiento));
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }
    if (tipoMovimiento === "SALIDA" && cantidad > productoMovimiento.stock_actual) {
      setError("No hay suficiente stock disponible para realizar esta salida.");
      return;
    }

    const nuevoStock = tipoMovimiento === "ENTRADA" ? productoMovimiento.stock_actual + cantidad : productoMovimiento.stock_actual - cantidad;
    setGuardandoMovimiento(true);
    setError("");

    const { error: errorStock } = await supabase
      .from("productos")
      .update({ stock_actual: nuevoStock, updated_at: new Date().toISOString() })
      .eq("id", productoMovimiento.id)
      .eq("taller_id", TALLER_ID);

    if (errorStock) {
      setError(`No se pudo actualizar el stock: ${errorStock.message}`);
      setGuardandoMovimiento(false);
      return;
    }

    const { error: errorMovimiento } = await supabase.from("movimientos_stock").insert({
      taller_id: TALLER_ID,
      producto_id: productoMovimiento.id,
      tipo: tipoMovimiento,
      cantidad: tipoMovimiento === "ENTRADA" ? cantidad : -cantidad,
      motivo: motivoMovimiento.trim() || (tipoMovimiento === "ENTRADA" ? "Entrada de stock" : "Salida de stock"),
      referencia_tipo: "AJUSTE",
      referencia_id: productoMovimiento.id,
      costo_unitario: productoMovimiento.costo,
    });

    if (errorMovimiento) {
      setError(`El stock se actualizó, pero no se pudo guardar el movimiento: ${errorMovimiento.message}`);
    }

    setProductos((actuales) => actuales.map((producto) => producto.id === productoMovimiento.id ? { ...producto, stock_actual: nuevoStock } : producto));
    setProductoMovimiento(null);
    setGuardandoMovimiento(false);
    setMensaje(`${tipoMovimiento === "ENTRADA" ? "Entrada" : "Salida"} registrada. Stock: ${nuevoStock}`);
    setTimeout(() => setMensaje(""), 3000);
  };

  const estadoStock = (producto: Producto) => {
    if (producto.stock_actual <= 0) return { texto: "Agotado", clase: "bg-red-50 text-red-700", punto: "bg-red-500" };
    if (producto.stock_actual <= producto.stock_minimo) return { texto: "Stock bajo", clase: "bg-yellow-50 text-yellow-700", punto: "bg-yellow-500" };
    return { texto: "Disponible", clase: "bg-green-50 text-green-700", punto: "bg-green-500" };
  };

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#17201b]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#18a66b]">Gestión</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">Inventario</h1>
            <p className="mt-2 text-sm text-gray-500">Repuestos, componentes y accesorios del taller.</p>
          </div>
          <button type="button" onClick={() => setMostrarNuevo(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-[0.98]"><Plus size={17} />Agregar producto</button>
        </div>

        {mensaje && <div className="fixed right-4 top-5 z-[100] rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-xl">{mensaje}</div>}
        {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><div className="min-w-0 flex-1">{error}</div><button type="button" onClick={() => setError("")} aria-label="Cerrar error"><X size={17} /></button></div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Package size={19} />} label="Productos" value={String(estadisticas.productos)} />
          <StatCard icon={<Boxes size={19} />} label="Unidades" value={String(estadisticas.unidades)} />
          <StatCard icon={<AlertTriangle size={19} />} label="Stock bajo" value={String(estadisticas.bajos)} />
          <StatCard icon={<DollarSign size={19} />} label="Valor del inventario" value={moneda(estadisticas.valor)} />
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar producto, modelo o SKU..." className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] pl-10 pr-4 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {[["TODOS", "Todos"], ["BAJO", "Stock bajo"], ["AGOTADO", "Agotados"]].map(([valor, etiqueta]) => (
                  <button key={valor} type="button" onClick={() => setFiltro(valor as typeof filtro)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${filtro === valor ? "bg-[#e9f8f1] text-[#148f5c]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{etiqueta}</button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {["Todas", ...CATEGORIAS].map((categoria) => (
                <button key={categoria} type="button" onClick={() => setCategoriaActiva(categoria)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${categoriaActiva === categoria ? "border-[#18a66b] bg-[#18a66b] text-white" : "border-gray-200 bg-white text-gray-500 hover:border-[#bcebd5] hover:text-[#148f5c]"}`}>{categoria}</button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="flex min-h-[300px] items-center justify-center"><div className="flex items-center gap-3 text-sm font-semibold text-gray-500"><Loader2 size={20} className="animate-spin text-[#18a66b]" />Cargando inventario...</div></div>
          ) : productosFiltrados.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8f1]"><Package size={24} className="text-[#18a66b]" /></div><h2 className="mt-4 text-sm font-bold text-gray-900">No hay productos</h2><p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">Agregá el primer repuesto para comenzar a controlar el stock del taller.</p><button type="button" onClick={() => setMostrarNuevo(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#18a66b] px-4 py-2.5 text-xs font-bold text-white"><Plus size={15} />Agregar producto</button></div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productosFiltrados.map((producto) => {
                const estado = estadoStock(producto);
                return (
                  <article key={producto.id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-[#bcebd5] hover:shadow-lg">
                    <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#f6f9f7]">
                      {producto.image_url ? <img src={producto.image_url} alt={producto.nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e9f8f1] text-[#18a66b]"><Package size={34} /></div>}
                      {producto.categoria && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-gray-600 shadow-sm">{producto.categoria}</span>}
                    </div>
                    <div className="p-4">
                      <div className="min-h-[66px]">
                        <h3 className="line-clamp-2 text-base font-black text-gray-950">{producto.nombre}</h3>
                        <p className="mt-1 line-clamp-1 text-xs text-gray-400">{[producto.marca, producto.modelo, producto.sku ? `SKU ${producto.sku}` : null].filter(Boolean).join(" · ") || "Sin datos adicionales"}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#f8faf9] p-3">
                        <div><p className="text-[10px] font-bold uppercase text-gray-400">Costo</p><p className="mt-0.5 text-sm font-black text-gray-700">{moneda(producto.costo)}</p></div>
                        <div><p className="text-[10px] font-bold uppercase text-gray-400">Precio</p><p className="mt-0.5 text-sm font-black text-gray-950">{moneda(producto.precio)}</p></div>
                      </div>
                      <div className="mt-3 flex items-center justify-between"><div><span className="text-xl font-black text-gray-950">{producto.stock_actual}</span><span className="ml-1 text-xs text-gray-400">unidades</span></div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${estado.clase}`}><span className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />{estado.texto}</span></div>
                      <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => abrirMovimiento(producto, "ENTRADA")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-2 py-2.5 text-xs font-bold text-gray-600 hover:border-[#bcebd5] hover:bg-[#e9f8f1] hover:text-[#148f5c]"><ArrowUp size={14} />Entrada</button><button type="button" onClick={() => abrirMovimiento(producto, "SALIDA")} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-2 py-2.5 text-xs font-bold text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"><ArrowDown size={14} />Salida</button></div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {mostrarNuevo && (
        <Modal title="Agregar producto" onClose={cerrarNuevo}>
          <form onSubmit={guardarProducto} className="space-y-4">
            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 bg-[#f8faf9] p-4 transition hover:border-[#18a66b]">
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
                  {vistaPrevia ? <img src={vistaPrevia} alt="Vista previa" className="h-full w-full object-cover" /> : <ImagePlus size={30} className="text-gray-300" />}
                </div>
                <div><p className="text-sm font-black text-gray-800">Agregar foto</p><p className="mt-1 text-xs text-gray-400">JPG, PNG o WEBP. Recomendado: foto clara del repuesto.</p></div>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={seleccionarFoto} className="sr-only" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre *" value={nuevo.nombre} onChange={(value) => setNuevo({ ...nuevo, nombre: value })} placeholder="Ej. Pantalla iPhone 13" />
              <div><label className="mb-1.5 block text-xs font-bold text-gray-600">Categoría</label><select value={nuevo.categoria} onChange={(event) => setNuevo({ ...nuevo, categoria: event.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none focus:border-[#18a66b] focus:bg-white"><option value="">Seleccionar categoría</option>{CATEGORIAS.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}</select></div>
              <Field label="Marca" value={nuevo.marca} onChange={(value) => setNuevo({ ...nuevo, marca: value })} placeholder="Ej. JK" />
              <Field label="Modelo" value={nuevo.modelo} onChange={(value) => setNuevo({ ...nuevo, modelo: value })} placeholder="iPhone 13" />
              <Field label="SKU" value={nuevo.sku} onChange={(value) => setNuevo({ ...nuevo, sku: value })} placeholder="IP13-OLED-01" />
              <Field label="Costo (USD)" type="number" min="0" step="0.01" value={nuevo.costo} onChange={(value) => setNuevo({ ...nuevo, costo: value })} placeholder="0.00" />
              <Field label="Precio (USD)" type="number" min="0" step="0.01" value={nuevo.precio} onChange={(value) => setNuevo({ ...nuevo, precio: value })} placeholder="0.00" />
              <Field label="Stock inicial" type="number" min="0" step="1" value={nuevo.stock} onChange={(value) => setNuevo({ ...nuevo, stock: value })} placeholder="0" />
              <Field label="Stock mínimo" type="number" min="0" step="1" value={nuevo.stockMinimo} onChange={(value) => setNuevo({ ...nuevo, stockMinimo: value })} placeholder="0" />
            </div>
            <div><label className="mb-1.5 block text-xs font-bold text-gray-600">Descripción</label><textarea value={nuevo.descripcion} onChange={(event) => setNuevo({ ...nuevo, descripcion: event.target.value })} rows={3} placeholder="Información adicional del repuesto..." className="w-full resize-none rounded-xl border border-gray-200 bg-[#f8faf9] px-3 py-2.5 text-sm outline-none focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10" /></div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={cerrarNuevo} className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100">Cancelar</button><button disabled={guardandoProducto} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{guardandoProducto && <Loader2 size={16} className="animate-spin" />}Guardar producto</button></div>
          </form>
        </Modal>
      )}

      {productoMovimiento && <Modal title={tipoMovimiento === "ENTRADA" ? "Entrada de stock" : "Salida de stock"} onClose={() => setProductoMovimiento(null)}><form onSubmit={guardarMovimiento} className="space-y-5"><div className="rounded-xl bg-[#f6f9f7] p-4"><p className="text-sm font-bold text-gray-900">{productoMovimiento.nombre}</p><p className="mt-1 text-xs text-gray-500">Stock actual: <strong>{productoMovimiento.stock_actual}</strong></p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Cantidad" type="number" min="1" step="1" value={cantidadMovimiento} onChange={setCantidadMovimiento} placeholder="1" /><div><label className="mb-1.5 block text-xs font-bold text-gray-600">Tipo</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setTipoMovimiento("ENTRADA")} className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${tipoMovimiento === "ENTRADA" ? "border-[#18a66b] bg-[#e9f8f1] text-[#148f5c]" : "border-gray-200 text-gray-500"}`}>Entrada</button><button type="button" onClick={() => setTipoMovimiento("SALIDA")} className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${tipoMovimiento === "SALIDA" ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 text-gray-500"}`}>Salida</button></div></div></div><Field label="Motivo" value={motivoMovimiento} onChange={setMotivoMovimiento} placeholder="Ej. Compra a proveedor" /><div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={() => setProductoMovimiento(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100">Cancelar</button><button disabled={guardandoMovimiento} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#18a66b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{guardandoMovimiento ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Registrar movimiento</button></div></form></Modal>}
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b]">{icon}</div><Boxes size={16} className="text-gray-200" /></div><p className="mt-4 text-xs font-semibold text-gray-400">{label}</p><p className="mt-1 text-2xl font-black tracking-tight text-gray-950">{value}</p></div>;
}

function Field({ label, value, onChange, placeholder, type = "text", min, step }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; min?: string; step?: string }) {
  return <div><label className="mb-1.5 block text-xs font-bold text-gray-600">{label}</label><input type={type} min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8faf9] px-3 text-sm outline-none transition focus:border-[#18a66b] focus:bg-white focus:ring-2 focus:ring-[#18a66b]/10" /></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6"><h2 className="text-lg font-black text-gray-950">{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Cerrar"><X size={19} /></button></div><div className="p-5 sm:p-6">{children}</div></div></div>;
}
