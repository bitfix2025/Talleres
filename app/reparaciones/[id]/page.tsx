"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Home,
  ImageIcon,
  Loader2,
  Package,
  Save,
  Smartphone,
  User,
  Wrench,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Cliente = {
  nombre: string | null;
  telefono: string | null;
};

type Equipo = {
  marca: string | null;
  modelo: string | null;
  imei: string | null;
  numero_serie: string | null;
  color: string | null;
  capacidad: string | null;
  bateria_porcentaje: number | null;
};

type Orden = {
  id: number;
  taller_id: number | null;
  cliente_id: number | null;
  equipo_id: number | null;
  estado: string | null;
  falla_reportada: string | null;
  observaciones: string | null;
  created_at: string | null;
  cliente: Cliente | null;
  equipo: Equipo | null;
};

type Foto = {
  id: number;
  tipo: string;
  url: string;
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

const FLUJO = [
  "RECIBIDO",
  "DIAGNOSTICO",
  "PRESUPUESTO",
  "ESPERANDO REPUESTO",
  "EN REPARACION",
  "REPARADO",
  "ENTREGADO",
];

const normalizar = (valor: string | null | undefined) =>
  (valor || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const estadoTexto = (estado: string | null | undefined) => {
  if (!estado) return "Sin estado";

  return estado
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
};

const estadoClase = (estado: string | null | undefined) => {
  switch (normalizar(estado)) {
    case "RECIBIDO":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "DIAGNOSTICO":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "PRESUPUESTO":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "ESPERANDO REPUESTO":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "EN REPARACION":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "REPARADO":
      return "border-green-200 bg-green-50 text-green-700";
    case "ENTREGADO":
      return "border-gray-200 bg-gray-100 text-gray-600";
    case "CANCELADO":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-100 text-gray-600";
  }
};

const formatearFecha = (fecha: string | null) => {
  if (!fecha) return "-";

  try {
    return new Date(fecha).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

export default function ReparacionDetallePage() {
  const params = useParams();
  const router = useRouter();

  const ordenId = Number(params.id);

  const [orden, setOrden] = useState<Orden | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [diagnostico, setDiagnostico] = useState("");
  const [notasTecnicas, setNotasTecnicas] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarOrden = async () => {
    if (!Number.isFinite(ordenId) || ordenId <= 0) {
      setError("ID de reparación inválido.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const { data, error: errorOrden } = await supabase
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
        .eq("id", ordenId)
        .maybeSingle();

      if (errorOrden) throw errorOrden;

      if (!data) {
        setOrden(null);
        setError("La orden no existe.");
        return;
      }

      const cliente = Array.isArray(data.clientes)
        ? data.clientes[0] || null
        : data.clientes || null;

      const equipo = Array.isArray(data.equipos)
        ? data.equipos[0] || null
        : data.equipos || null;

      const ordenFormateada: Orden = {
        id: data.id,
        taller_id: data.taller_id,
        cliente_id: data.cliente_id,
        equipo_id: data.equipo_id,
        estado: data.estado,
        falla_reportada: data.falla_reportada,
        observaciones: data.observaciones,
        created_at: data.created_at,
        cliente,
        equipo,
      };

      setOrden(ordenFormateada);

      const observaciones = data.observaciones || "";
      const diagnosticoGuardado = observaciones.match(
        /Diagnóstico:\s*([\s\S]*?)(?:\n\nNotas técnicas:|$)/i
      );
      const notasGuardadas = observaciones.match(
        /Notas técnicas:\s*([\s\S]*)$/i
      );

      setDiagnostico(
        diagnosticoGuardado?.[1]?.trim() || ""
      );
      setNotasTecnicas(
        notasGuardadas?.[1]?.trim() ||
          (diagnosticoGuardado ? "" : observaciones)
      );

      await cargarFotos();
    } catch (err: any) {
      console.error("ERROR CARGANDO REPARACIÓN:", err);
      setError(
        err?.message || "No se pudo cargar la reparación."
      );
      setOrden(null);
    } finally {
      setCargando(false);
    }
  };

  const cargarFotos = async () => {
    if (!Number.isFinite(ordenId) || ordenId <= 0) return;

    try {
      const { data, error: errorFotos } = await supabase
        .from("fotos_recepcion")
        .select("id, tipo, url")
        .eq("orden_id", ordenId)
        .order("id", { ascending: true });

      if (errorFotos) {
        console.error("ERROR CARGANDO FOTOS:", errorFotos);
        setFotos([]);
        return;
      }

      setFotos((data || []) as Foto[]);
    } catch (err) {
      console.error("ERROR CARGANDO FOTOS:", err);
      setFotos([]);
    }
  };

  useEffect(() => {
    cargarOrden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenId]);

  const posicionActual = useMemo(() => {
    const posicion = FLUJO.indexOf(
      normalizar(orden?.estado)
    );

    return posicion;
  }, [orden?.estado]);

  const siguienteEstado = useMemo(() => {
    if (posicionActual < 0) return null;
    if (posicionActual >= FLUJO.length - 1) return null;
    return FLUJO[posicionActual + 1];
  }, [posicionActual]);

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!orden || cambiandoEstado) return;

    if (!ESTADOS.includes(nuevoEstado)) {
      setError("Estado no válido.");
      return;
    }

    try {
      setCambiandoEstado(true);
      setMensaje("");
      setError("");

      const { error: errorUpdate } = await supabase
        .from("ordenes_reparacion")
        .update({ estado: nuevoEstado })
        .eq("id", orden.id);

      if (errorUpdate) throw errorUpdate;

      setOrden((actual) =>
        actual
          ? { ...actual, estado: nuevoEstado }
          : actual
      );

      setMensaje(
        `La orden pasó a ${estadoTexto(nuevoEstado)}.`
      );
    } catch (err: any) {
      console.error("ERROR CAMBIANDO ESTADO:", err);
      setError(
        err?.message || "No se pudo cambiar el estado."
      );
    } finally {
      setCambiandoEstado(false);
    }
  };

  const avanzarReparacion = async () => {
    if (!siguienteEstado) return;
    await cambiarEstado(siguienteEstado);
  };

  const guardarNotas = async () => {
    if (!orden || guardando) return;

    try {
      setGuardando(true);
      setMensaje("");
      setError("");

      const diagnosticoLimpio = diagnostico.trim();
      const notasLimpias = notasTecnicas.trim();

      let observaciones = "";

      if (diagnosticoLimpio) {
        observaciones += `Diagnóstico:\n${diagnosticoLimpio}`;
      }

      if (notasLimpias) {
        if (observaciones) observaciones += "\n\n";
        observaciones += `Notas técnicas:\n${notasLimpias}`;
      }

      const { error: errorUpdate } = await supabase
        .from("ordenes_reparacion")
        .update({ observaciones })
        .eq("id", orden.id);

      if (errorUpdate) throw errorUpdate;

      setOrden((actual) =>
        actual
          ? { ...actual, observaciones }
          : actual
      );

      setMensaje("Diagnóstico y notas guardados correctamente.");
    } catch (err: any) {
      console.error("ERROR GUARDANDO NOTAS:", err);
      setError(
        err?.message || "No se pudieron guardar las notas."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="text-center">
            <Loader2
              size={32}
              className="mx-auto animate-spin text-gray-700"
            />
            <p className="mt-4 text-sm font-semibold text-gray-600">
              Cargando reparación...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!orden) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
        <div className="mx-auto max-w-[1200px] p-5 md:p-8">
          <button
            type="button"
            onClick={() => router.push("/reparaciones")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-black"
          >
            <ArrowLeft size={17} />
            Volver a reparaciones
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-xl font-bold text-red-800">
              No se pudo cargar la reparación
            </h1>
            <p className="mt-2 text-sm text-red-700">
              {error || "La orden no existe."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-gray-900">
      <div className="mx-auto max-w-[1500px] p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/reparaciones")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <ArrowLeft size={17} />
              Volver
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Home size={17} />
              Inicio
            </button>
          </div>

          <div className="text-xs font-semibold text-gray-400">
            Orden #{orden.id}
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    ORDEN #{orden.id}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClase(
                      orden.estado
                    )}`}
                  >
                    {estadoTexto(orden.estado)}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                  Gestión de reparación
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Administra el diagnóstico, avance y finalización del equipo.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/reparaciones/${orden.id}/checklist`)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <ClipboardCheck size={18} />
                  Checklist
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/reparaciones/${orden.id}/fotos`)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <ImageIcon size={18} />
                  Fotos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/reparaciones/${orden.id}/repuestos`)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Package size={18} />
                  Repuestos
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-6 md:px-8">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  Flujo de reparación
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Actualiza el estado a medida que avanza el trabajo.
                </p>
              </div>

              {siguienteEstado && (
                <button
                  type="button"
                  disabled={cambiandoEstado}
                  onClick={avanzarReparacion}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cambiandoEstado ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  Avanzar a {estadoTexto(siguienteEstado)}
                </button>
              )}
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[900px] items-center">
                {FLUJO.map((estado, index) => {
                  const activo = index === posicionActual;
                  const completado =
                    posicionActual >= 0 && posicionActual > index;

                  return (
                    <div
                      key={estado}
                      className="flex flex-1 items-center"
                    >
                      <button
                        type="button"
                        disabled={cambiandoEstado}
                        onClick={() => cambiarEstado(estado)}
                        className="group flex min-w-0 flex-col items-center text-center"
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                            activo
                              ? "border-black bg-black text-white"
                              : completado
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300 bg-white text-gray-400 group-hover:border-gray-500"
                          }`}
                        >
                          {completado ? (
                            <Check size={17} />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <span
                          className={`mt-2 max-w-[110px] text-[10px] font-bold uppercase leading-4 ${
                            activo
                              ? "text-gray-950"
                              : completado
                              ? "text-green-700"
                              : "text-gray-400"
                          }`}
                        >
                          {estadoTexto(estado)}
                        </span>
                      </button>

                      {index < FLUJO.length - 1 && (
                        <div
                          className={`mx-2 h-[2px] flex-1 ${
                            completado ? "bg-green-400" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {mensaje && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Smartphone size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-950">
                      Cliente y equipo
                    </h2>
                    <p className="text-xs text-gray-400">
                      Información de la orden
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center gap-2">
                    <User size={17} className="text-gray-500" />
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Cliente
                    </p>
                  </div>

                  <p className="mt-3 text-lg font-bold text-gray-950">
                    {orden.cliente?.nombre || "Sin nombre"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {orden.cliente?.telefono || "Sin teléfono"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center gap-2">
                    <Smartphone size={17} className="text-gray-500" />
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Equipo
                    </p>
                  </div>

                  <p className="mt-3 text-lg font-bold text-gray-950">
                    {[orden.equipo?.marca, orden.equipo?.modelo]
                      .filter(Boolean)
                      .join(" ") || "Sin equipo"}
                  </p>

                  <div className="mt-3 grid gap-2 text-xs text-gray-500">
                    <p>
                      <span className="font-semibold text-gray-700">IMEI:</span>{" "}
                      {orden.equipo?.imei || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Serie:</span>{" "}
                      {orden.equipo?.numero_serie || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Color:</span>{" "}
                      {orden.equipo?.color || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Capacidad:</span>{" "}
                      {orden.equipo?.capacidad || "-"}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Batería:</span>{" "}
                      {orden.equipo?.bateria_porcentaje != null
                        ? `${orden.equipo.bateria_porcentaje}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <Wrench size={20} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-950">
                    Falla reportada
                  </h2>
                  <p className="text-xs text-gray-400">
                    Problema informado por el cliente
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {orden.falla_reportada ||
                    "No se registró una falla reportada."}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-950">
                      Diagnóstico y notas técnicas
                    </h2>
                    <p className="text-xs text-gray-400">
                      Información interna del técnico
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Diagnóstico
                </label>
                <textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  rows={5}
                  placeholder="Ej.: Se verifica falla de carga. Se realizan mediciones y pruebas sobre el módulo..."
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black focus:bg-white"
                />

                <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-gray-400">
                  Notas técnicas
                </label>
                <textarea
                  value={notasTecnicas}
                  onChange={(e) => setNotasTecnicas(e.target.value)}
                  rows={6}
                  placeholder="Mediciones, observaciones internas, piezas que se deben revisar, etc."
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black focus:bg-white"
                />

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={guardarNotas}
                    className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guardando ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Save size={17} />
                    )}
                    Guardar notas
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                Resumen
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <span className="text-sm text-gray-500">Estado</span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${estadoClase(
                      orden.estado
                    )}`}
                  >
                    {estadoTexto(orden.estado)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <span className="text-sm text-gray-500">Ingreso</span>
                  <span className="text-right text-xs font-semibold text-gray-700">
                    {formatearFecha(orden.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <span className="text-sm text-gray-500">Fotos</span>
                  <span className="text-sm font-bold text-gray-950">
                    {fotos.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Orden</span>
                  <span className="text-sm font-bold text-gray-950">
                    #{orden.id}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                Acciones
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/reparaciones/${orden.id}/checklist`)
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardCheck size={17} />
                    Ver checklist
                  </span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/reparaciones/${orden.id}/fotos`)
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon size={17} />
                    Ver fotografías
                  </span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/reparaciones/${orden.id}/repuestos`)
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <Package size={17} />
                    Gestionar repuestos
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>

            {fotos.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-950">
                      Fotografías
                    </h2>
                    <p className="mt-1 text-xs text-gray-400">
                      Fotos de recepción
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    {fotos.length}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {fotos.slice(0, 6).map((foto) => (
                    <div
                      key={foto.id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={foto.url}
                        alt={`Foto ${foto.tipo}`}
                        className="aspect-square w-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {fotos.length > 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/reparaciones/${orden.id}/fotos`)
                    }
                    className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
                  >
                    Ver todas las fotografías
                  </button>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-gray-200 bg-gray-950 p-6 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                Próximo paso
              </p>

              {siguienteEstado ? (
                <>
                  <h2 className="mt-3 text-xl font-bold">
                    {estadoTexto(siguienteEstado)}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Cuando completes la tarea actual, avanza la orden al siguiente estado.
                  </p>
                  <button
                    type="button"
                    disabled={cambiandoEstado}
                    onClick={avanzarReparacion}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cambiandoEstado ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <ArrowRight size={17} />
                    )}
                    Avanzar reparación
                  </button>
                </>
              ) : normalizar(orden.estado) === "ENTREGADO" ? (
                <>
                  <h2 className="mt-3 text-xl font-bold">
                    Reparación finalizada
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Esta orden fue marcada como entregada.
                  </p>
                  <CheckCircle2 className="mt-5 text-green-400" size={28} />
                </>
              ) : normalizar(orden.estado) === "CANCELADO" ? (
                <>
                  <h2 className="mt-3 text-xl font-bold">Orden cancelada</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    La orden está cancelada y no forma parte del flujo activo.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-xl font-bold">Estado actual</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Selecciona un estado en el flujo superior para continuar.
                  </p>
                </>
              )}
            </section>
          </div>
        </div>

        <div className="py-8 text-center">
          <p className="text-[11px] font-semibold tracking-wide text-gray-400">
            BITFIX TALLER · Gestión de reparación
          </p>
        </div>
      </div>
    </main>
  );
}
