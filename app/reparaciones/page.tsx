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
  "DIAGNOSTICO",
  "PRESUPUESTO",
  "ESPERANDO REPUESTO",
  "EN REPARACION",
  "REPARADO",
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
        console.error(
          "ERROR CARGANDO REPARACIONES:",
          error
        );

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
          falla_reportada:
            orden.falla_reportada,
          observaciones:
            orden.observaciones,
          created_at:
            orden.created_at,

          cliente: Array.isArray(
            orden.clientes
          )
            ? orden.clientes[0] || null
            : orden.clientes || null,

          equipo: Array.isArray(
            orden.equipos
          )
            ? orden.equipos[0] || null
            : orden.equipos || null,
        }));

      setOrdenes(ordenesFormateadas);
    } catch (error: any) {
      console.error(
        "ERROR CARGANDO REPARACIONES:",
        error
      );

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

    return Array.from(
      new Set(lista)
    ).sort();
  }, [ordenes]);

  /* =========================================
     NORMALIZAR TEXTO
  ========================================== */

  const normalizar = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .trim();
  };

  /* =========================================
     FILTRAR
  ========================================== */

  const ordenesFiltradas = useMemo(() => {
    const texto = normalizar(
      busqueda
    );

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

      const idOrden =
        String(orden.id);

      const coincideBusqueda =
        !texto ||
        normalizar(
          nombreCliente
        ).includes(texto) ||
        normalizar(
          telefono
        ).includes(texto) ||
        normalizar(
          modelo
        ).includes(texto) ||
        normalizar(
          imei
        ).includes(texto) ||
        normalizar(
          numeroSerie
        ).includes(texto) ||
        normalizar(
          falla
        ).includes(texto) ||
        idOrden.includes(texto);

      const estado =
        normalizar(
          orden.estado || ""
        );

      const coincideEstado =
        estadoFiltro === "TODOS" ||
        estado ===
          normalizar(
            estadoFiltro
          );

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
      normalizar(
        orden.estado || ""
      ) === "recibido"
  ).length;

  const enReparacion = ordenes.filter(
    (orden) =>
      normalizar(
        orden.estado || ""
      ) === "en reparacion"
  ).length;

  const reparados = ordenes.filter(
    (orden) =>
      normalizar(
        orden.estado || ""
      ) === "reparado"
  ).length;

  const pendientesEntrega =
    ordenes.filter((orden) => {
      const estado = normalizar(
        orden.estado || ""
      );

      return (
        estado === "reparado"
      );
    }).length;

  /* =========================================
     FECHA
  ========================================== */

  const formatearFecha = (
    fecha: string | null
  ) => {
    if (!fecha) return "-";

    try {
      return new Date(
        fecha
      ).toLocaleDateString(
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
      .replace(
        /\b\w/g,
        (letra) =>
          letra.toUpperCase()
      );
  };

  const estadoClase = (
    estado: string | null
  ) => {
    switch (
      normalizar(
        estado || ""
      )
    ) {
      case "recibido":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "diagnostico":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "presupuesto":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";

      case "esperando repuesto":
        return "bg-orange-50 text-orange-700 border-orange-200";

      case "en reparacion":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";

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
     ABRIR ORDEN
  ========================================== */

  const abrirOrden = (
    id: number
  ) => {
    router.push(
      `/reparaciones/${id}`
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-gray-900">

      {/* =====================================
          CONTENIDO
      ====================================== */}

      <div className="mx-auto max-w-[1500px] p-5 md:p-8">

        {/* =====================================
            ENCABEZADO
        ====================================== */}

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
              Gestión del taller
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
              Órdenes de reparación
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Gestiona todos los iPhone que ingresan al taller.
            </p>
          </div>

          <div className="flex gap-3">

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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.98]"
            >
              <Plus size={18} />

              Nueva reparación
            </button>

          </div>

        </div>

        {/* =====================================
            MÉTRICAS
        ====================================== */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            titulo="Recibidos"
            valor={recibidos}
            descripcion="Esperando diagnóstico"
            icon={
              <Clock3 size={20} />
            }
            clase="blue"
          />

          <MetricCard
            titulo="En reparación"
            valor={enReparacion}
            descripcion="Trabajos activos"
            icon={
              <Wrench size={20} />
            }
            clase="purple"
          />

          <MetricCard
            titulo="Reparados"
            valor={reparados}
            descripcion="Listos para entregar"
            icon={
              <CheckCircle2 size={20} />
            }
            clase="green"
          />

          <MetricCard
            titulo="Pendientes de entrega"
            valor={pendientesEntrega}
            descripcion="Esperando al cliente"
            icon={
              <Smartphone size={20} />
            }
            clase="orange"
          />

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
                  setEstadoFiltro(
                    "TODOS"
                  );
                  setModeloFiltro(
                    "TODOS"
                  );
                }}
                className="text-xs font-semibold text-gray-500 hover:text-black"
              >
                Limpiar filtros
              </button>
            )}

          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">

            {/* BUSCADOR */}

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Buscar cliente, IMEI, modelo, número de orden..."
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
              />

            </div>

            {/* ESTADO */}

            <select
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(
                  e.target.value
                )
              }
              className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white"
            >
              <option value="TODOS">
                Todos los estados
              </option>

              {ESTADOS.map(
                (estado) => (
                  <option
                    key={estado}
                    value={estado}
                  >
                    {estadoTexto(
                      estado
                    )}
                  </option>
                )
              )}
            </select>

            {/* MODELO */}

            <select
              value={modeloFiltro}
              onChange={(e) =>
                setModeloFiltro(
                  e.target.value
                )
              }
              className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white"
            >
              <option value="TODOS">
                Todos los modelos
              </option>

              {modelos.map(
                (modelo) => (
                  <option
                    key={modelo}
                    value={modelo}
                  >
                    {modelo}
                  </option>
                )
              )}
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

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* HEADER */}

          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-base font-bold text-gray-950">
                Reparaciones
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {cargando
                  ? "Cargando órdenes..."
                  : `${ordenesFiltradas.length} ${
                      ordenesFiltradas.length ===
                      1
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
            ordenesFiltradas.length ===
              0 && (
              <div className="flex min-h-[400px] flex-col items-center justify-center px-5 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                  {ordenes.length ===
                  0 ? (
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
                  {ordenes.length ===
                  0
                    ? "No hay reparaciones todavía"
                    : "No encontramos reparaciones"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
                  {ordenes.length ===
                  0
                    ? "Cuando recibas un iPhone, la orden aparecerá automáticamente en este listado."
                    : "Prueba modificando la búsqueda o limpiando los filtros."}
                </p>

                {ordenes.length ===
                  0 && (
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

                {ordenes.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda("");
                      setEstadoFiltro(
                        "TODOS"
                      );
                      setModeloFiltro(
                        "TODOS"
                      );
                    }}
                    className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                )}

              </div>
            )}

          {/* TABLA */}

          {!cargando &&
            ordenesFiltradas.length >
              0 && (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[950px]">

                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-left">

                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Orden
                      </th>

                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Cliente
                      </th>

                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Equipo
                      </th>

                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Problema
                      </th>

                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Estado
                      </th>

                      <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Fecha
                      </th>

                      <th className="px-5 py-3"></th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {ordenesFiltradas.map(
                      (orden) => (
                        <tr
                          key={orden.id}
                          onClick={() =>
                            abrirOrden(
                              orden.id
                            )
                          }
                          className="group cursor-pointer transition hover:bg-gray-50"
                        >

                          {/* ORDEN */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition group-hover:bg-black group-hover:text-white">
                                <Wrench
                                  size={18}
                                />
                              </div>

                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  #
                                  {String(
                                    orden.id
                                  ).padStart(
                                    4,
                                    "0"
                                  )}
                                </p>

                                <p className="mt-0.5 text-[11px] text-gray-400">
                                  Orden de reparación
                                </p>
                              </div>

                            </div>

                          </td>

                          {/* CLIENTE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                <User
                                  size={15}
                                  className="text-gray-500"
                                />
                              </div>

                              <div>

                                <p className="text-sm font-semibold text-gray-900">
                                  {orden.cliente
                                    ?.nombre ||
                                    "Sin nombre"}
                                </p>

                                {orden
                                  .cliente
                                  ?.telefono && (
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    {
                                      orden
                                        .cliente
                                        .telefono
                                    }
                                  </p>
                                )}

                              </div>

                            </div>

                          </td>

                          {/* EQUIPO */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <Smartphone
                                size={19}
                                className="text-gray-400"
                              />

                              <div>

                                <p className="text-sm font-semibold text-gray-900">
                                  {orden.equipo
                                    ?.modelo ||
                                    "iPhone"}
                                </p>

                                <div className="mt-0.5 flex items-center gap-2">

                                  {orden
                                    .equipo
                                    ?.capacidad && (
                                    <span className="text-xs text-gray-400">
                                      {
                                        orden
                                          .equipo
                                          .capacidad
                                      }
                                    </span>
                                  )}

                                  {orden
                                    .equipo
                                    ?.imei && (
                                    <>
                                      <span className="text-gray-300">
                                        •
                                      </span>

                                      <span className="text-xs text-gray-400">
                                        IMEI:{" "}
                                        {
                                          orden
                                            .equipo
                                            .imei
                                        }
                                      </span>
                                    </>
                                  )}

                                </div>

                              </div>

                            </div>

                          </td>

                          {/* PROBLEMA */}

                          <td className="max-w-[250px] px-5 py-4">

                            <p className="truncate text-sm text-gray-600">
                              {orden
                                .falla_reportada ||
                                "Sin problema indicado"}
                            </p>

                          </td>

                          {/* ESTADO */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${estadoClase(
                                orden.estado
                              )}`}
                            >
                              {estadoTexto(
                                orden.estado
                              )}
                            </span>

                          </td>

                          {/* FECHA */}

                          <td className="whitespace-nowrap px-5 py-4">

                            <p className="text-xs font-medium text-gray-600">
                              {formatearFecha(
                                orden.created_at
                              )}
                            </p>

                          </td>

                          {/* ACCIÓN */}

                          <td className="px-5 py-4 text-right">

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition group-hover:bg-gray-100 group-hover:text-gray-700">

                              <ChevronRight
                                size={18}
                              />

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

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