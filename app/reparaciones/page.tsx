
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Plus,
  Search,
  Smartphone,
  User,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Home,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Orden = {
  id: number;
  taller_id: number | null;
  cliente_id: number | null;
  equipo_id: number | null;
  estado: string | null;
  falla_reportada: string | null;
  observaciones: string | null;
  created_at: string | null;

  cliente?: {
    nombre: string | null;
    telefono: string | null;
  } | null;

  equipo?: {
    marca: string | null;
    modelo: string | null;
    imei: string | null;
    numero_serie: string | null;
    color: string | null;
    capacidad: string | null;
    bateria_porcentaje: number | null;
  } | null;
};

const ESTADOS = [
  "RECIBIDO",
  "DIAGNÓSTICO",
  "PRESUPUESTADO",
  "ESPERANDO APROBACIÓN",
  "APROBADO",
  "EN REPARACIÓN",
  "LISTO PARA ENTREGAR",
  "ENTREGADO",
  "CANCELADO",
];

export default function ReparacionesPage() {
  const router = useRouter();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
  const [modeloFiltro, setModeloFiltro] = useState("TODOS");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarOrdenes = async () => {
    try {
      setCargando(true);
      setError("");

      const { data, error } = await supabase
        .from("ordenes_reparacion")
        .select(`
          id,
          taller_id,
          cliente_id,
          equipo_id,
          estado,
          falla_reportada,
          observaciones,
          created_at,
          clientes (
            nombre,
            telefono
          ),
          equipos (
            marca,
            modelo,
            imei,
            numero_serie,
            color,
            capacidad,
            bateria_porcentaje
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("ERROR CARGANDO REPARACIONES:", error);

        setError(
          error.message ||
            "No se pudieron cargar las reparaciones."
        );

        return;
      }

      const ordenesFormateadas: Orden[] =
        (data || []).map((orden: any) => ({
          id: orden.id,
          taller_id: orden.taller_id,
          cliente_id: orden.cliente_id,
          equipo_id: orden.equipo_id,
          estado: orden.estado,
          falla_reportada: orden.falla_reportada,
          observaciones: orden.observaciones,
          created_at: orden.created_at,

          cliente: Array.isArray(orden.clientes)
            ? orden.clientes[0] || null
            : orden.clientes || null,

          equipo: Array.isArray(orden.equipos)
            ? orden.equipos[0] || null
            : orden.equipos || null,
        }));

      setOrdenes(ordenesFormateadas);
    } catch (error: any) {
      console.error("ERROR CARGANDO REPARACIONES:", error);

      setError(
        error?.message ||
          "No se pudieron cargar las reparaciones."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, []);

  /* =========================================
     MODELOS DISPONIBLES
  ========================================== */

  const modelos = useMemo(() => {
    const lista = ordenes
      .map((orden) =>
        orden.equipo?.modelo?.trim()
      )
      .filter(Boolean) as string[];

    return Array.from(new Set(lista)).sort();
  }, [ordenes]);

  /* =========================================
     NORMALIZAR TEXTO
  ========================================== */

  const normalizar = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  /* =========================================
     FILTRAR
  ========================================== */

  const ordenesFiltradas = useMemo(() => {
    const texto = normalizar(busqueda);

    return ordenes.filter((orden) => {
      const nombreCliente =
        orden.cliente?.nombre || "";

      const telefono =
        orden.cliente?.telefono || "";

      const modelo =
        orden.equipo?.modelo || "";

      const imei =
        orden.equipo?.imei || "";

      const numeroSerie =
        orden.equipo?.numero_serie || "";

      const falla =
        orden.falla_reportada || "";

      const idOrden = String(orden.id);

      const coincideBusqueda =
        !texto ||
        normalizar(nombreCliente).includes(texto) ||
        normalizar(telefono).includes(texto) ||
        normalizar(modelo).includes(texto) ||
        normalizar(imei).includes(texto) ||
        normalizar(numeroSerie).includes(texto) ||
        normalizar(falla).includes(texto) ||
        idOrden.includes(texto);

      const estado = normalizar(
        orden.estado || ""
      );

      const coincideEstado =
        estadoFiltro === "TODOS" ||
        estado === normalizar(estadoFiltro);

      const coincideModelo =
        modeloFiltro === "TODOS" ||
        modelo === modeloFiltro;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideModelo
      );
    });
  }, [
    ordenes,
    busqueda,
    estadoFiltro,
    modeloFiltro,
  ]);

  /* =========================================
     CONTADORES
  ========================================== */

  const recibidos = ordenes.filter(
    (orden) =>
      normalizar(orden.estado || "") ===
      "recibido"
  ).length;

  const enReparacion = ordenes.filter(
    (orden) =>
      normalizar(orden.estado || "") ===
      "en reparacion"
  ).length;

  const reparados = ordenes.filter((orden) => {
    const estado = normalizar(orden.estado || "");
    return estado === "listo para entregar" || estado === "reparado";
  }).length;

  /* =========================================
     FECHA
  ========================================== */

  const formatearFecha = (
    fecha: string | null
  ) => {
    if (!fecha) return "-";

    try {
      return new Date(fecha).toLocaleDateString(
        "es-AR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );
    } catch {
      return "-";
    }
  };

  /* =========================================
     ESTADO VISUAL
  ========================================== */

  const estadoTexto = (
    estado: string | null
  ) => {
    if (!estado) return "Sin estado";

    return estado
      .toLowerCase()
      .replace(/\b\w/g, (letra) =>
        letra.toUpperCase()
      );
  };

  const estadoClase = (
    estado: string | null
  ) => {
    switch (normalizar(estado || "")) {
      case "recibido":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "diagnostico":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "presupuestado":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";

      case "esperando aprobacion":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "aprobado":
        return "bg-green-50 text-green-700 border-green-200";

      case "en reparacion":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";

      case "listo para entregar":
      case "reparado":
        return "bg-green-50 text-green-700 border-green-200";

      case "entregado":
        return "bg-gray-100 text-gray-600 border-gray-200";

      case "cancelado":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  /* =========================================
     NAVEGACIÓN
  ========================================== */

  const abrirOrden = (id: number) => {
    router.push(`/reparaciones/${id}`);
  };

  const irInicio = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#f7f8f7] text-gray-900">
      <div className="mx-auto max-w-[1480px] p-4 md:p-7">

        {/* =====================================
            ENCABEZADO
        ====================================== */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
              Gestión del taller
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              Órdenes de reparación
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Gestiona todos los iPhone que ingresan al taller.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* ÚNICO BOTÓN DE NAVEGACIÓN */}

            <button
              type="button"
              onClick={irInicio}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <Home size={17} />
              Inicio
            </button>

            <button
              type="button"
              onClick={cargarOrdenes}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  cargando
                    ? "animate-spin"
                    : ""
                }
              />

              Actualizar
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/reparaciones/nueva"
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d] active:scale-[0.98]"
            >
              <Plus size={18} />
              Nueva reparación
            </button>

          </div>
        </div>

        {/* =====================================
            MÉTRICAS
        ====================================== */}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard titulo="Recibidos" valor={recibidos} descripcion="Esperando diagnóstico" icon={<Clock3 size={19} />} clase="blue" />
          <MetricCard titulo="En reparación" valor={enReparacion} descripcion="Trabajos activos" icon={<Wrench size={19} />} clase="purple" />
          <MetricCard titulo="Listos para entregar" valor={reparados} descripcion="Reparaciones terminadas" icon={<CheckCircle2 size={19} />} clase="green" />
          <MetricCard titulo="Total" valor={ordenes.length} descripcion="Órdenes registradas" icon={<Smartphone size={19} />} clase="orange" />
        </div>

        {/* =====================================
            FILTROS
        ====================================== */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-sm font-bold text-gray-950">
                Buscar reparaciones
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Filtra por cliente, equipo, IMEI o estado.
              </p>
            </div>

            {(busqueda ||
              estadoFiltro !== "TODOS" ||
              modeloFiltro !== "TODOS") && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setEstadoFiltro("TODOS");
                  setModeloFiltro("TODOS");
                }}
                className="text-xs font-semibold text-gray-500 hover:text-black"
              >
                Limpiar filtros
              </button>
            )}

          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
                placeholder="Buscar cliente, IMEI, modelo, número de orden..."
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#16a34a] focus:bg-white focus:ring-2 focus:ring-green-100"
              />

            </div>

            <select
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(e.target.value)
              }
              className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-[#16a34a] focus:bg-white"
            >
              <option value="TODOS">
                Todos los estados
              </option>

              {ESTADOS.map((estado) => (
                <option
                  key={estado}
                  value={estado}
                >
                  {estadoTexto(estado)}
                </option>
              ))}
            </select>

            <select
              value={modeloFiltro}
              onChange={(e) =>
                setModeloFiltro(e.target.value)
              }
              className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-[#16a34a] focus:bg-white"
            >
              <option value="TODOS">
                Todos los modelos
              </option>

              {modelos.map((modelo) => (
                <option
                  key={modelo}
                  value={modelo}
                >
                  {modelo}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* =====================================
            ERROR
        ====================================== */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-bold text-red-800">
                No se pudieron cargar las reparaciones
              </p>

              <p className="mt-1 text-xs text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={cargarOrdenes}
                className="mt-3 text-xs font-bold text-red-800 underline"
              >
                Intentar nuevamente
              </button>
            </div>

          </div>
        )}

        {/* =====================================
            LISTADO
        ====================================== */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-base font-bold text-gray-950">
                Reparaciones
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {cargando
                  ? "Cargando órdenes..."
                  : `${ordenesFiltradas.length} ${
                      ordenesFiltradas.length === 1
                        ? "orden encontrada"
                        : "órdenes encontradas"
                    }`}
              </p>
            </div>

            {!cargando &&
              ordenes.length > 0 && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
                  Total:{" "}
                  <span className="text-gray-900">
                    {ordenes.length}
                  </span>
                </div>
              )}

          </div>

          {/* CARGANDO */}

          {cargando && (
            <div className="flex min-h-[350px] flex-col items-center justify-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <RefreshCw
                  size={24}
                  className="animate-spin text-gray-500"
                />
              </div>

              <p className="mt-4 text-sm font-semibold text-gray-800">
                Cargando reparaciones...
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Estamos consultando las órdenes del taller.
              </p>

            </div>
          )}

          {/* SIN RESULTADOS */}

          {!cargando &&
            ordenesFiltradas.length === 0 && (
              <div className="flex min-h-[400px] flex-col items-center justify-center px-5 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">

                  {ordenes.length === 0 ? (
                    <Wrench
                      size={28}
                      className="text-gray-400"
                    />
                  ) : (
                    <Search
                      size={27}
                      className="text-gray-400"
                    />
                  )}

                </div>

                <h3 className="mt-5 text-base font-bold text-gray-900">
                  {ordenes.length === 0
                    ? "No hay reparaciones todavía"
                    : "No encontramos reparaciones"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                  {ordenes.length === 0
                    ? "Cuando recibas un iPhone, la orden aparecerá automáticamente en este listado."
                    : "Prueba modificando la búsqueda o limpiando los filtros."}
                </p>

                {ordenes.length === 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/reparaciones/nueva"
                      )
                    }
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    <Plus size={17} />
                    Crear primera reparación
                  </button>
                )}

                {ordenes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda("");
                      setEstadoFiltro("TODOS");
                      setModeloFiltro("TODOS");
                    }}
                    className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                )}

              </div>
            )}

          {/* REPARACIONES */}
          {!cargando && ordenesFiltradas.length > 0 && (
            <div className="p-4 md:p-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ordenesFiltradas.map((orden) => (
                  <button
                    key={orden.id}
                    type="button"
                    onClick={() => abrirOrden(orden.id)}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 to-emerald-300 opacity-0 transition group-hover:opacity-100" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                          <Smartphone size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-950">
                            {orden.equipo?.modelo || "iPhone"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Orden #{String(orden.id).padStart(4, "0")}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${estadoClase(orden.estado)}`}>
                        {estadoTexto(orden.estado)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-gray-400" />
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {orden.cliente?.nombre || "Sin cliente"}
                        </p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">
                        {orden.falla_reportada || "Sin problema indicado"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock3 size={14} />
                        {formatearFecha(orden.created_at)}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
                        Ver reparación
                        <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* =====================================
            FOOTER
        ====================================== */}

        <div className="py-8 text-center">

          <p className="text-[11px] text-gray-400">
            BITFIX TALLER · Gestión de reparaciones
          </p>

        </div>

      </div>
    </main>
  );
}

/* =====================================================
   METRIC CARD
===================================================== */

function MetricCard({
  titulo,
  valor,
  descripcion,
  icon,
  clase,
}: {
  titulo: string;
  valor: number;
  descripcion: string;
  icon: React.ReactNode;
  clase: "blue" | "purple" | "green" | "orange";
}) {
  const estilos = {
    blue: {
      fondo: "bg-blue-50",
      icono: "text-blue-600",
    },
    purple: {
      fondo: "bg-purple-50",
      icono: "text-purple-600",
    },
    green: {
      fondo: "bg-green-50",
      icono: "text-green-600",
    },
    orange: {
      fondo: "bg-orange-50",
      icono: "text-orange-600",
    },
  };

  const estilo = estilos[clase];

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-semibold text-gray-400">
            {titulo}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {valor}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {descripcion}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${estilo.fondo} ${estilo.icono}`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}
