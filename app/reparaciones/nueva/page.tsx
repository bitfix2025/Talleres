"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function NuevaReparacionPage() {
  const router = useRouter();

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");

  const [modelo, setModelo] = useState("");
  const [imei, setImei] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [color, setColor] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [bateria, setBateria] = useState("");

  const [fallaReportada, setFallaReportada] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [guardando, setGuardando] = useState(false);

  const continuar = async () => {
    if (!clienteNombre.trim()) {
      alert("Ingresa el nombre del cliente");
      return;
    }

    if (!modelo.trim()) {
      alert("Ingresa el modelo del iPhone");
      return;
    }

    if (!fallaReportada.trim()) {
      alert("Indica el problema reportado");
      return;
    }

    try {
      setGuardando(true);

      // Por ahora utilizamos el primer taller.
      // Más adelante esto saldrá del usuario que inició sesión.
      const tallerId = 1;

      // ==========================================
      // 1. CREAR CLIENTE
      // ==========================================

      const { data: cliente, error: errorCliente } =
        await supabase
          .from("clientes")
          .insert({
            taller_id: tallerId,
            nombre: clienteNombre.trim(),
            telefono:
              clienteTelefono.trim() || null,
          })
          .select()
          .single();

      if (errorCliente) {
        console.error(
          "ERROR CREANDO CLIENTE:",
          errorCliente
        );

        throw new Error(
          `No se pudo crear el cliente: ${errorCliente.message}`
        );
      }

      // ==========================================
      // 2. CREAR EQUIPO
      // ==========================================

      const bateriaNumero =
        bateria.trim() !== ""
          ? Number(bateria)
          : null;

      const { data: equipo, error: errorEquipo } =
        await supabase
          .from("equipos")
          .insert({
            taller_id: tallerId,
            cliente_id: cliente.id,
            tipo: "CELULAR",
            marca: "Apple",
            modelo: modelo.trim(),
            imei: imei.trim() || null,
            numero_serie:
              numeroSerie.trim() || null,
            color: color.trim() || null,
            capacidad: capacidad || null,
            bateria_porcentaje:
              bateriaNumero,
            observaciones:
              observaciones.trim() || null,
          })
          .select()
          .single();

      if (errorEquipo) {
        console.error(
          "ERROR CREANDO EQUIPO:",
          errorEquipo
        );

        throw new Error(
          `No se pudo crear el equipo: ${errorEquipo.message}`
        );
      }

      // ==========================================
      // 3. CREAR ORDEN DE REPARACIÓN
      // ==========================================

      const { data: orden, error: errorOrden } =
        await supabase
          .from("ordenes_reparacion")
          .insert({
            taller_id: tallerId,
            cliente_id: cliente.id,
            equipo_id: equipo.id,
            estado: "RECIBIDO",
            falla_reportada:
              fallaReportada.trim(),
            observaciones:
              observaciones.trim() || null,
          })
          .select()
          .single();

      if (errorOrden) {
        console.error(
          "ERROR CREANDO ORDEN:",
          errorOrden
        );

        throw new Error(
          `No se pudo crear la orden: ${errorOrden.message}`
        );
      }

      // ==========================================
      // 4. REGISTRAR HISTORIAL
      // ==========================================

      const { error: errorHistorial } =
        await supabase
          .from("historial_reparacion")
          .insert({
            orden_id: orden.id,
            tipo: "CREACION",
            estado_anterior: null,
            estado_nuevo: "RECIBIDO",
            descripcion:
              "Orden de reparación creada.",
          });

      if (errorHistorial) {
        console.error(
          "ERROR CREANDO HISTORIAL:",
          errorHistorial
        );

        // La orden ya existe.
        // No vamos a borrar la reparación por un
        // problema del historial.
        console.warn(
          "La orden fue creada correctamente, pero no se pudo registrar el historial."
        );
      }

      // ==========================================
      // 5. IR AL CHECKLIST
      // ==========================================

      router.push(
        `/reparaciones/${orden.id}/checklist`
      );
    } catch (error: any) {
      console.error(
        "ERROR GUARDANDO REPARACION:",
        error
      );

      alert(
        error?.message ||
          "No se pudo guardar la reparación."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">

        {/* VOLVER */}
        <button
          type="button"
          onClick={() =>
            router.push("/reparaciones")
          }
          className="mb-6 text-sm font-medium text-gray-600 hover:text-black"
        >
          ← Volver a reparaciones
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

          {/* ENCABEZADO */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Nueva reparación
            </h1>

            <p className="mt-2 text-gray-600">
              Registra los datos del cliente y del
              equipo que ingresa al taller.
            </p>
          </div>

          {/* =====================================
              CLIENTE
          ====================================== */}

          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900">
              👤 Datos del cliente
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nombre completo *
                </label>

                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) =>
                    setClienteNombre(
                      e.target.value
                    )
                  }
                  placeholder="Nombre del cliente"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Teléfono
                </label>

                <input
                  type="tel"
                  value={clienteTelefono}
                  onChange={(e) =>
                    setClienteTelefono(
                      e.target.value
                    )
                  }
                  placeholder="Ej: +54 11..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

            </div>
          </section>

          {/* =====================================
              EQUIPO
          ====================================== */}

          <section className="mt-10 border-t border-gray-200 pt-8">

            <h2 className="text-xl font-bold text-gray-900">
              📱 Datos del iPhone
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Modelo *
                </label>

                <input
                  type="text"
                  value={modelo}
                  onChange={(e) =>
                    setModelo(e.target.value)
                  }
                  placeholder="Ej: iPhone 15 Pro Max"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  IMEI
                </label>

                <input
                  type="text"
                  value={imei}
                  onChange={(e) =>
                    setImei(e.target.value)
                  }
                  placeholder="Número IMEI"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Número de serie
                </label>

                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) =>
                    setNumeroSerie(
                      e.target.value
                    )
                  }
                  placeholder="Número de serie"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Color
                </label>

                <input
                  type="text"
                  value={color}
                  onChange={(e) =>
                    setColor(e.target.value)
                  }
                  placeholder="Ej: Negro"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Capacidad
                </label>

                <select
                  value={capacidad}
                  onChange={(e) =>
                    setCapacidad(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none"
                >
                  <option value="">
                    Seleccionar
                  </option>

                  <option>64 GB</option>
                  <option>128 GB</option>
                  <option>256 GB</option>
                  <option>512 GB</option>
                  <option>1 TB</option>
                  <option>2 TB</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Salud de batería (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bateria}
                  onChange={(e) =>
                    setBateria(e.target.value)
                  }
                  placeholder="Ej: 85"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

            </div>
          </section>

          {/* =====================================
              PROBLEMA
          ====================================== */}

          <section className="mt-10 border-t border-gray-200 pt-8">

            <h2 className="text-xl font-bold text-gray-900">
              🔧 Motivo del ingreso
            </h2>

            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">
                Problema reportado por el cliente *
              </label>

              <textarea
                value={fallaReportada}
                onChange={(e) =>
                  setFallaReportada(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Describe el problema informado por el cliente..."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

            </div>

            <div className="mt-4">

              <label className="mb-2 block text-sm font-medium">
                Observaciones adicionales
              </label>

              <textarea
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Golpes, rayones, accesorios entregados, etc."
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

            </div>

          </section>

          {/* =====================================
              BOTONES
          ====================================== */}

          <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push("/reparaciones")
              }
              disabled={guardando}
              className="rounded-lg border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={continuar}
              disabled={guardando}
              className="rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : "Continuar al checklist →"}
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}