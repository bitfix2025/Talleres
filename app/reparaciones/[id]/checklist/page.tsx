
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Opcion = {
  texto: string;
  estado: EstadoPermitido;
};

type ItemChecklist = {
  id: string;
  categoria: string;
  prueba: string;
  opciones: Opcion[];
};

/*
 * ============================================================
 * ESTADOS PERMITIDOS POR SUPABASE
 * ============================================================
 */

const ESTADOS_PERMITIDOS = [
  "FUNCIONA",
  "NO_FUNCIONA",
  "NO_PROBADO",
  "NO_APLICA",
  "SIN_DANOS",
  "RAYADA",
  "ROTA",
  "MANCHAS",
  "RAYADO",
  "GOLPES",
  "RAYONES",
  "DOBLADO",
  "SIN_DANOS_VISIBLES",
  "VIDRIO_ROTO",
  "LENTE_RAYADO",
  "FALLA",
] as const;

type EstadoPermitido =
  (typeof ESTADOS_PERMITIDOS)[number];

/*
 * ============================================================
 * NORMALIZAR ESTADO
 * ============================================================
 */

const normalizarEstado = (
  estado: string | null | undefined
): EstadoPermitido => {
  const valor = String(estado ?? "")
    .trim()
    .toUpperCase();

  if (
    (ESTADOS_PERMITIDOS as readonly string[]).includes(
      valor
    )
  ) {
    return valor as EstadoPermitido;
  }

  return "NO_PROBADO";
};

/*
 * ============================================================
 * ITEMS DEL CHECKLIST
 * ============================================================
 */

const ITEMS: ItemChecklist[] = [
  {
    id: "pantalla",
    categoria: "Estado físico",
    prueba: "Pantalla",
    opciones: [
      {
        texto: "Sin daños",
        estado: "SIN_DANOS",
      },
      {
        texto: "Rayada",
        estado: "RAYADA",
      },
      {
        texto: "Rota",
        estado: "ROTA",
      },
      {
        texto: "Manchas",
        estado: "MANCHAS",
      },
      {
        texto: "No enciende",
        estado: "NO_FUNCIONA",
      },
    ],
  },

  {
    id: "vidrio_trasero",
    categoria: "Estado físico",
    prueba: "Vidrio trasero",
    opciones: [
      {
        texto: "Sin daños",
        estado: "SIN_DANOS",
      },
      {
        texto: "Rayado",
        estado: "RAYADO",
      },
      {
        texto: "Roto",
        estado: "ROTA",
      },
    ],
  },

  {
    id: "marco_chasis",
    categoria: "Estado físico",
    prueba: "Marco / chasis",
    opciones: [
      {
        texto: "Sin daños",
        estado: "SIN_DANOS",
      },
      {
        texto: "Golpes",
        estado: "GOLPES",
      },
      {
        texto: "Rayones",
        estado: "RAYONES",
      },
      {
        texto: "Doblado",
        estado: "DOBLADO",
      },
    ],
  },

  {
    id: "camaras",
    categoria: "Estado físico",
    prueba: "Cámaras",
    opciones: [
      {
        texto: "Sin daños visibles",
        estado: "SIN_DANOS_VISIBLES",
      },
      {
        texto: "Vidrio roto",
        estado: "VIDRIO_ROTO",
      },
      {
        texto: "Lente rayado",
        estado: "LENTE_RAYADO",
      },
    ],
  },

  {
    id: "encendido",
    categoria: "Pruebas funcionales",
    prueba: "Encendido",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "No funciona",
        estado: "NO_FUNCIONA",
      },
    ],
  },

  {
    id: "face_id",
    categoria: "Pruebas funcionales",
    prueba: "Face ID",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "No funciona",
        estado: "NO_FUNCIONA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "touch",
    categoria: "Pruebas funcionales",
    prueba: "Touch / táctil",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "carga",
    categoria: "Pruebas funcionales",
    prueba: "Carga",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "camara_trasera",
    categoria: "Pruebas funcionales",
    prueba: "Cámara trasera",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "camara_frontal",
    categoria: "Pruebas funcionales",
    prueba: "Cámara frontal",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "microfono",
    categoria: "Pruebas funcionales",
    prueba: "Micrófono",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "altavoz",
    categoria: "Pruebas funcionales",
    prueba: "Altavoz",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "auricular",
    categoria: "Pruebas funcionales",
    prueba: "Auricular",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "vibracion",
    categoria: "Pruebas funcionales",
    prueba: "Vibración",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "wifi",
    categoria: "Conectividad",
    prueba: "Wi-Fi",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "bluetooth",
    categoria: "Conectividad",
    prueba: "Bluetooth",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "red_movil",
    categoria: "Conectividad",
    prueba: "Red móvil",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },

  {
    id: "gps",
    categoria: "Conectividad",
    prueba: "GPS",
    opciones: [
      {
        texto: "Funciona",
        estado: "FUNCIONA",
      },
      {
        texto: "Falla",
        estado: "FALLA",
      },
      {
        texto: "No probado",
        estado: "NO_PROBADO",
      },
    ],
  },
];

const CATEGORIAS = [
  "Estado físico",
  "Pruebas funcionales",
  "Conectividad",
];

const ACCESORIOS = [
  "Cargador",
  "Cable",
  "Funda",
  "Caja",
];

/*
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();

  const ordenId = String(params.id);
  const ordenIdNumero = Number(ordenId);

  const [respuestas, setRespuestas] =
    useState<Record<string, string>>({});

  const [accesorios, setAccesorios] =
    useState<string[]>([]);

  const [observaciones, setObservaciones] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState("");

  const [bloqueado, setBloqueado] =
    useState(false);

  /*
   * ============================================================
   * CAMBIAR RESPUESTA
   * ============================================================
   */

  const cambiarRespuesta = (
    itemId: string,
    valor: string
  ) => {
    if (bloqueado || guardando) return;

    setRespuestas((actual) => ({
      ...actual,
      [itemId]: valor,
    }));
  };

  /*
   * ============================================================
   * CAMBIAR ACCESORIO
   * ============================================================
   */

  const cambiarAccesorio = (
    accesorio: string
  ) => {
    if (bloqueado || guardando) return;

    setAccesorios((actual) => {
      if (actual.includes(accesorio)) {
        return actual.filter(
          (item) => item !== accesorio
        );
      }

      return [...actual, accesorio];
    });
  };

  /*
   * ============================================================
   * CARGAR CHECKLIST
   * ============================================================
   */

  const cargarChecklist = async () => {
    try {
      setCargando(true);
      setMensaje("");

      if (
        !ordenIdNumero ||
        Number.isNaN(ordenIdNumero)
      ) {
        setMensaje("ID de orden inválido.");
        return;
      }

      /*
       * --------------------------------------------------------
       * ESTADO DE LA ORDEN
       * --------------------------------------------------------
       */

      const {
        data: orden,
        error: errorOrden,
      } = await supabase
        .from("ordenes_reparacion")
        .select(
          "checklist_completado, checklist_fecha"
        )
        .eq(
          "id",
          ordenIdNumero
        )
        .maybeSingle();

      if (errorOrden) {
        console.error(
          "ERROR CARGANDO ESTADO DE LA ORDEN:",
          errorOrden
        );

        setMensaje(
          `Error cargando orden: ${
            errorOrden.message ||
            "Error desconocido"
          }`
        );

        return;
      }

      setBloqueado(
        orden?.checklist_completado === true
      );

      /*
       * --------------------------------------------------------
       * CHECKLIST
       * --------------------------------------------------------
       */

      const {
        data,
        error,
      } = await supabase
        .from("checklist_reparacion")
        .select(
          `
            id,
            orden_id,
            momento,
            categoria,
            prueba,
            estado,
            observacion,
            created_at,
            updated_at,
            checklist_item_id,
            usuario_id,
            orden_prueba
          `
        )
        .eq(
          "orden_id",
          ordenIdNumero
        )
        .eq(
          "momento",
          "ENTRADA"
        )
        .order(
          "orden_prueba",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "ERROR CARGANDO CHECKLIST:",
          error
        );

        setMensaje(
          `Error cargando checklist: ${
            error.message ||
            "Error desconocido"
          }`
        );

        return;
      }

      setRespuestas({});
      setAccesorios([]);
      setObservaciones("");

      if (!data || data.length === 0) {
        return;
      }

      const nuevasRespuestas: Record<
        string,
        string
      > = {};

      const accesoriosEncontrados: string[] =
        [];

      let nuevaObservacion = "";

      /*
       * --------------------------------------------------------
       * RECONSTRUIR DATOS
       * --------------------------------------------------------
       */

      data.forEach((fila: any) => {
        /*
         * ACCESORIOS
         */

        if (
          fila.categoria ===
          "Accesorios"
        ) {
          if (
            ACCESORIOS.includes(
              fila.prueba
            ) &&
            !accesoriosEncontrados.includes(
              fila.prueba
            )
          ) {
            accesoriosEncontrados.push(
              fila.prueba
            );
          }

          if (
            fila.observacion &&
            !nuevaObservacion
          ) {
            nuevaObservacion =
              fila.observacion;
          }

          return;
        }

        /*
         * PRUEBAS
         */

        const item = ITEMS.find(
          (item) =>
            item.prueba ===
            fila.prueba
        );

        if (!item) {
          return;
        }

        const estadoFila =
          normalizarEstado(
            fila.estado
          );

        const opcion =
          item.opciones.find(
            (opcion) =>
              normalizarEstado(
                opcion.estado
              ) === estadoFila
          );

        if (opcion) {
          nuevasRespuestas[
            item.id
          ] = opcion.texto;
        }

        if (
          fila.observacion &&
          !nuevaObservacion
        ) {
          nuevaObservacion =
            fila.observacion;
        }
      });

      setRespuestas(
        nuevasRespuestas
      );

      setAccesorios(
        accesoriosEncontrados
      );

      setObservaciones(
        nuevaObservacion
      );
    } catch (error: any) {
      console.error(
        "ERROR CARGANDO CHECKLIST:",
        error
      );

      setMensaje(
        `Error cargando checklist: ${
          error?.message ||
          "Error desconocido"
        }`
      );
    } finally {
      setCargando(false);
    }
  };

  /*
   * ============================================================
   * CARGAR AL ENTRAR
   * ============================================================
   */

  useEffect(() => {
    cargarChecklist();
  }, [ordenId]);

  /*
   * ============================================================
   * GUARDAR CHECKLIST
   * ============================================================
   */

  const guardarChecklist = async () => {
    if (bloqueado) {
      setMensaje(
        "Este checklist ya está cerrado y no se puede modificar."
      );

      return;
    }

    if (guardando) return;

    try {
      setGuardando(true);
      setMensaje("");

      /*
       * --------------------------------------------------------
       * VALIDAR ID
       * --------------------------------------------------------
       */

      if (
        !ordenIdNumero ||
        Number.isNaN(ordenIdNumero)
      ) {
        setMensaje(
          "ID de orden inválido."
        );

        return;
      }

      /*
       * --------------------------------------------------------
       * VALIDAR QUE HAYA INFORMACIÓN
       * --------------------------------------------------------
       */

      const seleccionados =
        ITEMS.filter(
          (item) =>
            respuestas[item.id]
        );

      if (
        seleccionados.length === 0 &&
        accesorios.length === 0 &&
        !observaciones.trim()
      ) {
        setMensaje(
          "Seleccioná al menos una prueba, accesorio u observación antes de guardar."
        );

        return;
      }

      /*
       * --------------------------------------------------------
       * VERIFICAR ESTADO REAL
       * --------------------------------------------------------
       */

      const {
        data: ordenActual,
        error: errorEstado,
      } = await supabase
        .from("ordenes_reparacion")
        .select(
          "checklist_completado"
        )
        .eq(
          "id",
          ordenIdNumero
        )
        .maybeSingle();

      if (errorEstado) {
        console.error(
          "ERROR COMPROBANDO ESTADO:",
          errorEstado
        );

        setMensaje(
          `No se pudo comprobar la orden: ${
            errorEstado.message ||
            "Error desconocido"
          }`
        );

        return;
      }

      if (
        ordenActual?.checklist_completado ===
        true
      ) {
        setBloqueado(true);

        setMensaje(
          "Este checklist ya estaba cerrado."
        );

        return;
      }

      /*
       * --------------------------------------------------------
       * CONSTRUIR FILAS DE PRUEBAS
       * --------------------------------------------------------
       */

      const filas = seleccionados.map(
        (item, index) => {
          const opcion =
            item.opciones.find(
              (opcion) =>
                opcion.texto ===
                respuestas[item.id]
            );

          const estadoSeguro =
            normalizarEstado(
              opcion?.estado
            );

          return {
            orden_id:
              ordenIdNumero,

            momento:
              "ENTRADA",

            categoria:
              item.categoria,

            prueba:
              item.prueba,

            estado:
              estadoSeguro,

            observacion:
              observaciones.trim() ||
              null,

            orden_prueba:
              index + 1,
          };
        }
      );

      /*
       * --------------------------------------------------------
       * CONSTRUIR FILAS DE ACCESORIOS
       * --------------------------------------------------------
       *
       * La base de datos NO acepta "RECIBIDO".
       *
       * Guardamos "FUNCIONA" porque está permitido
       * por el CHECK constraint.
       *
       * La categoría "Accesorios" permite saber que
       * esa fila corresponde a un accesorio.
       */

      const filasAccesorios =
        accesorios.map(
          (accesorio, index) => ({
            orden_id:
              ordenIdNumero,

            momento:
              "ENTRADA",

            categoria:
              "Accesorios",

            prueba:
              accesorio,

            estado:
              "FUNCIONA" as EstadoPermitido,

            observacion:
              observaciones.trim() ||
              null,

            orden_prueba:
              filas.length +
              index +
              1,
          })
        );

      const filasFinales = [
        ...filas,
        ...filasAccesorios,
      ];

      /*
       * --------------------------------------------------------
       * SEGURIDAD
       * --------------------------------------------------------
       */

      const estadoInvalido =
        filasFinales.find(
          (fila) =>
            !(
              ESTADOS_PERMITIDOS as readonly string[]
            ).includes(
              String(
                fila.estado
              )
            )
        );

      if (estadoInvalido) {
        console.error(
          "ESTADO INVÁLIDO:",
          estadoInvalido
        );

        setMensaje(
          `Estado inválido en "${estadoInvalido.prueba}": ${estadoInvalido.estado}`
        );

        return;
      }

      console.log(
        "CHECKLIST A INSERTAR:",
        JSON.stringify(
          filasFinales,
          null,
          2
        )
      );

      /*
       * --------------------------------------------------------
       * INSERTAR CHECKLIST
       * --------------------------------------------------------
       */

      const {
        data: insertados,
        error: errorInsert,
      } = await supabase
        .from(
          "checklist_reparacion"
        )
        .insert(
          filasFinales
        )
        .select();

      if (errorInsert) {
        console.error(
          "ERROR INSERTANDO CHECKLIST:",
          {
            code:
              errorInsert.code,

            message:
              errorInsert.message,

            details:
              errorInsert.details,

            hint:
              errorInsert.hint,

            filas:
              filasFinales,
          }
        );

        setMensaje(
          `Error guardando checklist: ${
            errorInsert.message ||
            errorInsert.details ||
            errorInsert.hint ||
            errorInsert.code ||
            "Error desconocido"
          }`
        );

        return;
      }

      console.log(
        "CHECKLIST INSERTADO:",
        insertados
      );

      /*
       * --------------------------------------------------------
       * CERRAR CHECKLIST
       * --------------------------------------------------------
       */

      const fechaCierre =
        new Date().toISOString();

      const {
        data:
          ordenActualizada,
        error: errorCerrar,
      } = await supabase
        .from(
          "ordenes_reparacion"
        )
        .update({
          checklist_completado:
            true,

          checklist_fecha:
            fechaCierre,
        })
        .eq(
          "id",
          ordenIdNumero
        )
        .eq(
          "checklist_completado",
          false
        )
        .select(
          "checklist_completado, checklist_fecha"
        )
        .maybeSingle();

      if (errorCerrar) {
        console.error(
          "ERROR CERRANDO CHECKLIST:",
          errorCerrar
        );

        setMensaje(
          `El checklist se guardó, pero no se pudo cerrar: ${
            errorCerrar.message ||
            errorCerrar.details ||
            errorCerrar.hint ||
            errorCerrar.code ||
            "Error desconocido"
          }`
        );

        return;
      }

      /*
       * --------------------------------------------------------
       * VERIFICAR CIERRE
       * --------------------------------------------------------
       */

      if (!ordenActualizada) {
        const {
          data:
            ordenVerificada,
          error:
            errorVerificacion,
        } = await supabase
          .from(
            "ordenes_reparacion"
          )
          .select(
            "checklist_completado, checklist_fecha"
          )
          .eq(
            "id",
            ordenIdNumero
          )
          .maybeSingle();

        if (
          errorVerificacion
        ) {
          console.error(
            "ERROR VERIFICANDO CIERRE:",
            errorVerificacion
          );

          setMensaje(
            `El checklist se guardó, pero no se pudo confirmar el cierre: ${
              errorVerificacion.message ||
              errorVerificacion.details ||
              errorVerificacion.hint ||
              errorVerificacion.code ||
              "Error desconocido"
            }`
          );

          return;
        }

        if (
          ordenVerificada?.checklist_completado !==
          true
        ) {
          setMensaje(
            "El checklist se guardó, pero la orden no pudo cerrarse."
          );

          return;
        }
      }

      /*
       * --------------------------------------------------------
       * TODO CORRECTO
       * --------------------------------------------------------
       */

      setBloqueado(true);

      setMensaje(
        "Checklist guardado y cerrado correctamente."
      );

      /*
       * No hace falta volver a guardar.
       * Solo recargamos para mostrar los datos.
       */

      await cargarChecklist();
    } catch (error: any) {
      console.error(
        "ERROR GUARDANDO CHECKLIST:",
        error
      );

      setMensaje(
        `Error guardando: ${
          error?.message ||
          "Error desconocido"
        }`
      );
    } finally {
      setGuardando(false);
    }
  };

  /*
   * ============================================================
   * INTERFAZ
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-gray-900">

      <div className="mx-auto max-w-[1200px] p-5 md:p-8">

        {/* VOLVER */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/reparaciones/${ordenId}`
            )
          }
          className="mb-6 text-sm font-semibold text-gray-500 transition hover:text-black"
        >
          ← Volver a la orden
        </button>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* ==================================================
              ENCABEZADO
          ================================================== */}

          <div className="border-b border-gray-100 p-6 md:p-8">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                  Orden #{ordenId}
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                  Checklist de recepción
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Comprueba el estado físico y funcional del equipo antes de comenzar la reparación.
                </p>

              </div>

              {bloqueado ? (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
                  🔒 CHECKLIST CERRADO
                </span>
              ) : (
                <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                  RECIBIDO
                </span>
              )}

            </div>

          </div>

          <div className="p-6 md:p-8">

            {/* ==================================================
                AVISO CHECKLIST CERRADO
            ================================================== */}

            {bloqueado && (
              <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">

                <p className="text-sm font-bold text-amber-800">
                  Checklist de recepción cerrado
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Este registro representa el estado del equipo al momento de recibirlo. El técnico puede consultarlo, pero no modificarlo.
                </p>

              </div>
            )}

            {cargando ? (

              <div className="flex min-h-[300px] items-center justify-center">

                <p className="text-sm font-semibold text-gray-500">
                  Cargando checklist...
                </p>

              </div>

            ) : (

              <>

                {/* ==================================================
                    CATEGORÍAS
                ================================================== */}

                {CATEGORIAS.map(
                  (categoria) => {

                    const items =
                      ITEMS.filter(
                        (item) =>
                          item.categoria ===
                          categoria
                      );

                    return (

                      <section
                        key={categoria}
                        className="mb-8 border-b border-gray-100 pb-8"
                      >

                        <div className="mb-5">

                          <h2 className="text-xl font-bold text-gray-950">
                            {categoria}
                          </h2>

                          <p className="mt-1 text-xs text-gray-400">
                            {bloqueado
                              ? "Estado registrado al recibir el equipo."
                              : "Registra el estado del equipo."}
                          </p>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2">

                          {items.map(
                            (item) => (

                              <div
                                key={
                                  item.id
                                }
                                className={`rounded-xl border p-4 transition ${
                                  bloqueado
                                    ? "border-gray-200 bg-gray-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >

                                <label className="block text-sm font-bold text-gray-900">
                                  {
                                    item.prueba
                                  }
                                </label>

                                <select
                                  value={
                                    respuestas[
                                      item.id
                                    ] ||
                                    ""
                                  }
                                  disabled={
                                    bloqueado ||
                                    guardando
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    cambiarRespuesta(
                                      item.id,
                                      e.target
                                        .value
                                    )
                                  }
                                  className={`mt-3 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition ${
                                    bloqueado
                                      ? "cursor-not-allowed bg-gray-100 text-gray-600"
                                      : "bg-gray-50 focus:border-black focus:bg-white"
                                  }`}
                                >

                                  <option value="">
                                    {bloqueado
                                      ? "Sin registro"
                                      : "Seleccionar"}
                                  </option>

                                  {item.opciones.map(
                                    (
                                      opcion
                                    ) => (

                                      <option
                                        key={
                                          opcion.texto
                                        }
                                        value={
                                          opcion.texto
                                        }
                                      >
                                        {
                                          opcion.texto
                                        }
                                      </option>

                                    )
                                  )}

                                </select>

                              </div>

                            )
                          )}

                        </div>

                      </section>

                    );
                  }
                )}

                {/* ==================================================
                    ACCESORIOS
                ================================================== */}

                <section className="mb-8 border-b border-gray-100 pb-8">

                  <div className="mb-5">

                    <h2 className="text-xl font-bold text-gray-950">
                      Accesorios recibidos
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      {bloqueado
                        ? "Accesorios registrados al recibir el equipo."
                        : "Marca los accesorios que quedaron en el taller."}
                    </p>

                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    {ACCESORIOS.map(
                      (accesorio) => {

                        const seleccionado =
                          accesorios.includes(
                            accesorio
                          );

                        return (

                          <label
                            key={
                              accesorio
                            }
                            className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                              bloqueado
                                ? "cursor-not-allowed border-gray-200 bg-gray-50"
                                : seleccionado
                                ? "cursor-pointer border-black bg-gray-50"
                                : "cursor-pointer border-gray-200 hover:bg-gray-50"
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={
                                seleccionado
                              }
                              disabled={
                                bloqueado ||
                                guardando
                              }
                              onChange={() =>
                                cambiarAccesorio(
                                  accesorio
                                )
                              }
                              className="h-4 w-4"
                            />

                            <span className="text-sm font-semibold text-gray-800">
                              {
                                accesorio
                              }
                            </span>

                          </label>

                        );
                      }
                    )}

                  </div>

                  {accesorios.length >
                    0 && (

                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                      <p className="text-xs font-semibold text-green-700">
                        Accesorios registrados:{" "}
                        {
                          accesorios.join(
                            ", "
                          )
                        }
                      </p>

                    </div>

                  )}

                </section>

                {/* ==================================================
                    OBSERVACIONES
                ================================================== */}

                <section>

                  <div className="mb-5">

                    <h2 className="text-xl font-bold text-gray-950">
                      Observaciones
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      {bloqueado
                        ? "Observaciones registradas al recibir el equipo."
                        : "Registra cualquier detalle adicional del equipo."}
                    </p>

                  </div>

                  <textarea
                    value={
                      observaciones
                    }
                    disabled={
                      bloqueado ||
                      guardando
                    }
                    onChange={(e) =>
                      setObservaciones(
                        e.target.value
                      )
                    }
                    rows={6}
                    placeholder="Ej.: Equipo recibido con golpes en el marco..."
                    className={`w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition ${
                      bloqueado
                        ? "cursor-not-allowed bg-gray-100 text-gray-600"
                        : "bg-gray-50 focus:border-black focus:bg-white"
                    }`}
                  />

                </section>

                {/* ==================================================
                    RESUMEN
                ================================================== */}

                <div className="mt-8 grid gap-4 sm:grid-cols-3">

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                    <p className="text-xs font-semibold text-gray-400">
                      Pruebas registradas
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {
                        Object.keys(
                          respuestas
                        ).length
                      }
                    </p>

                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                    <p className="text-xs font-semibold text-gray-400">
                      Accesorios
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {
                        accesorios.length
                      }
                    </p>

                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">

                    <p className="text-xs font-semibold text-gray-400">
                      Estado
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-950">
                      {bloqueado
                        ? "CERRADO"
                        : "PENDIENTE"}
                    </p>

                  </div>

                </div>

                {/* ==================================================
                    MENSAJE
                ================================================== */}

                {mensaje && (

                  <div
                    className={`mt-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      mensaje.includes(
                        "correctamente"
                      )
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {mensaje}
                  </div>

                )}

                {/* ==================================================
                    BOTONES
                ================================================== */}

                <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/reparaciones/${ordenId}`
                      )
                    }
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Volver a la orden
                  </button>

                  {!bloqueado && (

                    <button
                      type="button"
                      onClick={
                        guardarChecklist
                      }
                      disabled={
                        guardando
                      }
                      className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {guardando
                        ? "Guardando..."
                        : "Guardar y cerrar checklist"}
                    </button>

                  )}

                </div>

              </>

            )}

          </div>

        </div>

        {/* ==================================================
            PIE
        ================================================== */}

        <div className="py-8 text-center">

          <p className="text-[11px] text-gray-400">
            BITFIX TALLER · Checklist de recepción
          </p>

        </div>

      </div>

    </main>
  );
}
