
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Opcion = {
  texto: string;
  estado: string;
};

type ItemChecklist = {
  id: string;
  categoria: string;
  prueba: string;
  opciones: Opcion[];
};

type FotoRecepcion = {
  id: number;
  tipo: string;
  url: string;
};

const ITEMS: ItemChecklist[] = [
  {
    id: "pantalla",
    categoria: "Estado físico",
    prueba: "Pantalla",
    opciones: [
      { texto: "Sin daños", estado: "FUNCIONA" },
      { texto: "Rayada", estado: "NO_FUNCIONA" },
      { texto: "Rota", estado: "NO_FUNCIONA" },
      { texto: "Manchas", estado: "NO_FUNCIONA" },
      { texto: "No enciende", estado: "NO_FUNCIONA" },
    ],
  },
  {
    id: "vidrio_trasero",
    categoria: "Estado físico",
    prueba: "Vidrio trasero",
    opciones: [
      { texto: "Sin daños", estado: "FUNCIONA" },
      { texto: "Rayado", estado: "NO_FUNCIONA" },
      { texto: "Roto", estado: "NO_FUNCIONA" },
    ],
  },
  {
    id: "marco_chasis",
    categoria: "Estado físico",
    prueba: "Marco / chasis",
    opciones: [
      { texto: "Sin daños", estado: "FUNCIONA" },
      { texto: "Golpes", estado: "NO_FUNCIONA" },
      { texto: "Rayones", estado: "NO_FUNCIONA" },
      { texto: "Doblado", estado: "NO_FUNCIONA" },
    ],
  },
  {
    id: "camaras",
    categoria: "Estado físico",
    prueba: "Cámaras",
    opciones: [
      { texto: "Sin daños visibles", estado: "FUNCIONA" },
      { texto: "Vidrio roto", estado: "NO_FUNCIONA" },
      { texto: "Lente rayado", estado: "NO_FUNCIONA" },
    ],
  },
  {
    id: "encendido",
    categoria: "Pruebas funcionales",
    prueba: "Encendido",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "No funciona", estado: "NO_FUNCIONA" },
    ],
  },
  {
    id: "face_id",
    categoria: "Pruebas funcionales",
    prueba: "Face ID",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "No funciona", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "touch",
    categoria: "Pruebas funcionales",
    prueba: "Touch / táctil",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "carga",
    categoria: "Pruebas funcionales",
    prueba: "Carga",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "camara_trasera",
    categoria: "Pruebas funcionales",
    prueba: "Cámara trasera",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "camara_frontal",
    categoria: "Pruebas funcionales",
    prueba: "Cámara frontal",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "microfono",
    categoria: "Pruebas funcionales",
    prueba: "Micrófono",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "altavoz",
    categoria: "Pruebas funcionales",
    prueba: "Altavoz",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "auricular",
    categoria: "Pruebas funcionales",
    prueba: "Auricular",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "vibracion",
    categoria: "Pruebas funcionales",
    prueba: "Vibración",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "wifi",
    categoria: "Conectividad",
    prueba: "Wi-Fi",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "bluetooth",
    categoria: "Conectividad",
    prueba: "Bluetooth",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "red_movil",
    categoria: "Conectividad",
    prueba: "Red móvil",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
    ],
  },
  {
    id: "gps",
    categoria: "Conectividad",
    prueba: "GPS",
    opciones: [
      { texto: "Funciona", estado: "FUNCIONA" },
      { texto: "Falla", estado: "NO_FUNCIONA" },
      { texto: "No probado", estado: "NO_PROBADO" },
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

const TIPOS_FOTO = [
  {
    id: "frente",
    nombre: "Frente",
    icono: "📱",
  },
  {
    id: "trasera",
    nombre: "Trasera",
    icono: "🔄",
  },
  {
    id: "lateral_izquierdo",
    nombre: "Lateral izquierdo",
    icono: "↔️",
  },
  {
    id: "lateral_derecho",
    nombre: "Lateral derecho",
    icono: "↔️",
  },
  {
    id: "danos",
    nombre: "Daños",
    icono: "⚠️",
  },
];

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();

  const ordenId = String(params.id);
  const ordenIdNumero = Number(ordenId);

  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [accesorios, setAccesorios] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");

  const [fotos, setFotos] = useState<Record<string, File | null>>({
    frente: null,
    trasera: null,
    lateral_izquierdo: null,
    lateral_derecho: null,
    danos: null,
  });

  const [previsualizaciones, setPrevisualizaciones] = useState<
    Record<string, string>
  >({});

  const [fotosGuardadas, setFotosGuardadas] = useState<FotoRecepcion[]>([]);

  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [bloqueado, setBloqueado] = useState(false);

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

  const cambiarFoto = (
    tipo: string,
    archivo: File | null
  ) => {
    if (bloqueado || guardando) return;

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setMensaje("Solo se pueden seleccionar imágenes.");
      return;
    }

    const maximoMB = 10;

    if (archivo.size > maximoMB * 1024 * 1024) {
      setMensaje(
        `La foto "${tipo}" supera el límite de ${maximoMB} MB.`
      );
      return;
    }

    const url = URL.createObjectURL(archivo);

    setFotos((actual) => ({
      ...actual,
      [tipo]: archivo,
    }));

    setPrevisualizaciones((actual) => {
      if (actual[tipo]) {
        URL.revokeObjectURL(actual[tipo]);
      }

      return {
        ...actual,
        [tipo]: url,
      };
    });

    setMensaje("");
  };

  const eliminarFotoSeleccionada = (
    tipo: string
  ) => {
    if (bloqueado || guardando) return;

    if (previsualizaciones[tipo]) {
      URL.revokeObjectURL(previsualizaciones[tipo]);
    }

    setFotos((actual) => ({
      ...actual,
      [tipo]: null,
    }));

    setPrevisualizaciones((actual) => {
      const copia = { ...actual };
      delete copia[tipo];
      return copia;
    });
  };

  const cargarFotos = async () => {
    const {
      data,
      error,
    } = await supabase
      .from("fotos_recepcion")
      .select("id, tipo, url")
      .eq("orden_id", ordenIdNumero)
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "ERROR CARGANDO FOTOS DE RECEPCIÓN:",
        error
      );
      return;
    }

    setFotosGuardadas(
      (data || []) as FotoRecepcion[]
    );
  };

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

      const estaCerrado =
        orden?.checklist_completado === true;

      setBloqueado(estaCerrado);

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

      await cargarFotos();

      if (
        !data ||
        data.length === 0
      ) {
        return;
      }

      const nuevasRespuestas: Record<
        string,
        string
      > = {};

      let nuevaObservacion = "";

      const accesoriosEncontrados: string[] = [];

      data.forEach((fila: any) => {
        if (
          fila.categoria === "Accesorios"
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

        const item = ITEMS.find(
          (item) =>
            item.prueba ===
            fila.prueba
        );

        if (item) {
          const opcion =
            item.opciones.find(
              (opcion) =>
                opcion.estado ===
                fila.estado
            );

          if (opcion) {
            nuevasRespuestas[item.id] =
              opcion.texto;
          }
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

  useEffect(() => {
    cargarChecklist();

    return () => {
      Object.values(previsualizaciones).forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );
    };
  }, [ordenId]);

  const subirFoto = async (
    tipo: string,
    archivo: File
  ) => {
    const extension =
      archivo.name.split(".").pop()?.toLowerCase() ||
      "jpg";

    const nombreArchivo =
      `${ordenIdNumero}_${tipo}_${Date.now()}.${extension}`;

    const ruta =
      `orden-${ordenIdNumero}/${nombreArchivo}`;

    const {
      error: errorUpload,
    } = await supabase.storage
      .from("recepcion-fotos")
      .upload(
        ruta,
        archivo,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: archivo.type,
        }
      );

    if (errorUpload) {
      throw new Error(
        `No se pudo subir la foto de ${tipo}: ${
          errorUpload.message ||
          "Error desconocido"
        }`
      );
    }

    const {
      data: urlData,
    } = supabase.storage
      .from("recepcion-fotos")
      .getPublicUrl(ruta);

    if (!urlData?.publicUrl) {
      throw new Error(
        `No se pudo obtener la URL de la foto de ${tipo}.`
      );
    }

    const {
      error: errorRegistro,
    } = await supabase
      .from("fotos_recepcion")
      .insert({
        orden_id: ordenIdNumero,
        tipo,
        url: urlData.publicUrl,
      });

    if (errorRegistro) {
      throw new Error(
        `La foto de ${tipo} se subió, pero no pudo registrarse: ${
          errorRegistro.message ||
          "Error desconocido"
        }`
      );
    }

    return urlData.publicUrl;
  };

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

      if (
        !ordenIdNumero ||
        Number.isNaN(ordenIdNumero)
      ) {
        setMensaje(
          "ID de orden inválido."
        );
        return;
      }

      const seleccionados =
        ITEMS.filter(
          (item) =>
            respuestas[item.id]
        );

      const fotosSeleccionadas =
        Object.entries(fotos).filter(
          ([, archivo]) => archivo !== null
        );

      if (
        seleccionados.length === 0 &&
        accesorios.length === 0 &&
        !observaciones.trim() &&
        fotosSeleccionadas.length === 0
      ) {
        setMensaje(
          "Seleccioná al menos una prueba, accesorio, foto u observación antes de guardar."
        );

        return;
      }

      /*
       * ==================================================
       * VERIFICAR NUEVAMENTE QUE LA ORDEN NO ESTÉ CERRADA
       * ==================================================
       */

      const {
        data: ordenSeguridad,
        error: errorOrdenSeguridad,
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

      if (errorOrdenSeguridad) {
        console.error(
          "ERROR VERIFICANDO ORDEN:",
          errorOrdenSeguridad
        );

        setMensaje(
          `No se pudo verificar la orden: ${
            errorOrdenSeguridad.message ||
            "Error desconocido"
          }`
        );

        return;
      }

      if (
        ordenSeguridad?.checklist_completado ===
        true
      ) {
        setBloqueado(true);

        setMensaje(
          "Este checklist ya fue cerrado y no puede modificarse."
        );

        return;
      }

      /*
       * ==================================================
       * PASO 1
       * SUBIR FOTOS
       * ==================================================
       */

      for (
        const [tipo, archivo]
        of fotosSeleccionadas
      ) {
        if (archivo) {
          await subirFoto(
            tipo,
            archivo
          );
        }
      }

      /*
       * ==================================================
       * PASO 2
       * ELIMINAR CHECKLIST DE ENTRADA ANTERIOR
       * ==================================================
       */

      const {
        error: errorDelete,
      } = await supabase
        .from(
          "checklist_reparacion"
        )
        .delete()
        .eq(
          "orden_id",
          ordenIdNumero
        )
        .eq(
          "momento",
          "ENTRADA"
        );

      if (errorDelete) {
        console.error(
          "ERROR ELIMINANDO CHECKLIST ANTERIOR:",
          JSON.stringify(
            errorDelete,
            null,
            2
          )
        );

        setMensaje(
          `No se pudo preparar el checklist: ${
            errorDelete.message ||
            errorDelete.details ||
            errorDelete.hint ||
            errorDelete.code ||
            "Error desconocido"
          }`
        );

        return;
      }

      /*
       * ==================================================
       * PASO 3
       * CREAR FILAS DE PRUEBAS
       * ==================================================
       */

      const filas =
        seleccionados.map(
          (item, index) => {
            const opcion =
              item.opciones.find(
                (opcion) =>
                  opcion.texto ===
                  respuestas[item.id]
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
                opcion?.estado ||
                "NO_PROBADO",

              observacion:
                observaciones.trim() ||
                null,

              orden_prueba:
                index + 1,
            };
          }
        );

      /*
       * ==================================================
       * PASO 4
       * CREAR FILAS DE ACCESORIOS
       * ==================================================
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
              "FUNCIONA",

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

      console.log(
        "FILAS CHECKLIST A INSERTAR:",
        JSON.stringify(
          filasFinales,
          null,
          2
        )
      );

      /*
       * ==================================================
       * PASO 5
       * INSERTAR CHECKLIST
       * ==================================================
       */

      if (filasFinales.length > 0) {
        const {
          data: datosInsertados,
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
            JSON.stringify(
              errorInsert,
              null,
              2
            )
          );

          console.error(
            "FILAS QUE SE INTENTARON INSERTAR:",
            JSON.stringify(
              filasFinales,
              null,
              2
            )
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
          "CHECKLIST INSERTADO CORRECTAMENTE:",
          datosInsertados
        );
      }

      /*
       * ==================================================
       * PASO 6
       * CERRAR CHECKLIST
       * ==================================================
       */

      const fechaCierre =
        new Date().toISOString();

      const {
        data: ordenActualizada,
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
          JSON.stringify(
            errorCerrar,
            null,
            2
          )
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
       * ==================================================
       * PASO 7
       * VERIFICAR QUE REALMENTE QUEDÓ CERRADO
       * ==================================================
       */

      if (
        !ordenActualizada
      ) {
        const {
          data: ordenVerificada,
          error: errorVerificacion,
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

        if (errorVerificacion) {
          console.error(
            "ERROR VERIFICANDO CIERRE:",
            JSON.stringify(
              errorVerificacion,
              null,
              2
            )
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
       * ==================================================
       * PASO 8
       * RECARGAR FOTOS
       * ==================================================
       */

      await cargarFotos();

      /*
       * ==================================================
       * PASO 9
       * BLOQUEAR INTERFAZ
       * ==================================================
       */

      setBloqueado(true);

      setMensaje(
        "Checklist guardado y cerrado correctamente."
      );

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

  const fotosActualesPorTipo = (
    tipo: string
  ) => {
    return fotosGuardadas.filter(
      (foto) =>
        foto.tipo === tipo
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-gray-900">

      <div className="mx-auto max-w-[1200px] p-5 md:p-8">

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

                {/* =====================================================
                    FOTOS DE RECEPCIÓN
                   ===================================================== */}

                <section className="mb-10 border-b border-gray-100 pb-10">

                  <div className="mb-5">

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                      <div>

                        <h2 className="text-xl font-bold text-gray-950">
                          Fotografías de recepción
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                          {bloqueado
                            ? "Fotos registradas al momento de recibir el equipo."
                            : "Documenta el estado físico del equipo antes de comenzar la reparación."}
                        </p>

                      </div>

                      {!bloqueado && (
                        <span className="text-xs font-semibold text-gray-400">
                          Máximo 10 MB por foto
                        </span>
                      )}

                    </div>

                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    {TIPOS_FOTO.map(
                      (tipo) => {

                        const fotoSeleccionada =
                          fotos[tipo.id];

                        const preview =
                          previsualizaciones[
                            tipo.id
                          ];

                        const fotosExistentes =
                          fotosActualesPorTipo(
                            tipo.id
                          );

                        return (
                          <div
                            key={tipo.id}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                          >

                            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">

                              <div className="flex items-center gap-2">

                                <span className="text-lg">
                                  {tipo.icono}
                                </span>

                                <span className="text-sm font-bold text-gray-900">
                                  {tipo.nombre}
                                </span>

                              </div>

                              {fotosExistentes.length > 0 && (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                                  GUARDADA
                                </span>
                              )}

                            </div>

                            {preview ? (
                              <div className="relative aspect-[4/3] bg-gray-100">

                                <img
                                  src={preview}
                                  alt={`Vista previa ${tipo.nombre}`}
                                  className="h-full w-full object-cover"
                                />

                                {!bloqueado && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      eliminarFotoSeleccionada(
                                        tipo.id
                                      )
                                    }
                                    className="absolute right-3 top-3 rounded-full bg-black/75 px-3 py-2 text-xs font-bold text-white transition hover:bg-black"
                                  >
                                    Eliminar
                                  </button>
                                )}

                              </div>
                            ) : fotosExistentes.length > 0 ? (
                              <div className="space-y-2 p-3">

                                {fotosExistentes.map(
                                  (foto) => (
                                    <div
                                      key={
                                        foto.id
                                      }
                                      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                                    >

                                      <img
                                        src={
                                          foto.url
                                        }
                                        alt={`Foto ${tipo.nombre}`}
                                        className="aspect-[4/3] w-full object-cover"
                                      />

                                    </div>
                                  )
                                )}

                              </div>
                            ) : (
                              <div className="flex aspect-[4/3] items-center justify-center p-5">

                                <label
                                  className={`flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white transition ${
                                    bloqueado
                                      ? "cursor-not-allowed opacity-60"
                                      : "hover:border-gray-500 hover:bg-gray-50"
                                  }`}
                                >

                                  <span className="text-3xl">
                                    📷
                                  </span>

                                  <span className="mt-3 text-sm font-bold text-gray-800">
                                    Agregar foto
                                  </span>

                                  <span className="mt-1 text-xs text-gray-400">
                                    Tomar o seleccionar
                                  </span>

                                  {!bloqueado && (
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      disabled={
                                        guardando
                                      }
                                      onChange={(
                                        e
                                      ) => {
                                        const archivo =
                                          e.target.files?.[0] ||
                                          null;

                                        cambiarFoto(
                                          tipo.id,
                                          archivo
                                        );

                                        e.target.value =
                                          "";
                                      }}
                                    />
                                  )}

                                </label>

                              </div>
                            )}

                            {preview && !bloqueado && (
                              <div className="border-t border-gray-200 bg-white p-3">

                                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100">

                                  Cambiar foto

                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    disabled={
                                      guardando
                                    }
                                    onChange={(
                                      e
                                    ) => {
                                      const archivo =
                                        e.target.files?.[0] ||
                                        null;

                                      cambiarFoto(
                                        tipo.id,
                                        archivo
                                      );

                                      e.target.value =
                                        "";
                                    }}
                                  />

                                </label>

                              </div>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                  {!bloqueado && (
                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

                      <p className="text-xs leading-5 text-blue-700">
                        <strong>Recomendación:</strong>{" "}
                        fotografiá el equipo desde todos los ángulos y documentá cualquier daño visible. Estas imágenes quedarán asociadas permanentemente a la orden de recepción.
                      </p>

                    </div>
                  )}

                </section>

                {/* =====================================================
                    CHECKLIST
                   ===================================================== */}

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
                                key={item.id}
                                className={`rounded-xl border p-4 transition ${
                                  bloqueado
                                    ? "border-gray-200 bg-gray-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >

                                <label className="block text-sm font-bold text-gray-900">
                                  {item.prueba}
                                </label>

                                <select
                                  value={
                                    respuestas[
                                      item.id
                                    ] || ""
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
                                      e.target.value
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

                {/* =====================================================
                    ACCESORIOS
                   ===================================================== */}

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
                              {accesorio}
                            </span>

                          </label>

                        );
                      }
                    )}

                  </div>

                  {accesorios.length > 0 && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                      <p className="text-xs font-semibold text-green-700">
                        Accesorios registrados:{" "}
                        {accesorios.join(", ")}
                      </p>

                    </div>
                  )}

                </section>

                {/* =====================================================
                    OBSERVACIONES
                   ===================================================== */}

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

                {/* =====================================================
                    RESUMEN
                   ===================================================== */}

                <div className="mt-8 grid gap-4 sm:grid-cols-4">

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
                      Fotografías
                    </p>

                    <p className="mt-1 text-2xl font-bold text-gray-950">
                      {
                        fotosGuardadas.length +
                        fotosSeleccionadasCount(
                          fotos
                        )
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

                {/* =====================================================
                    MENSAJE
                   ===================================================== */}

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

                {/* =====================================================
                    BOTONES
                   ===================================================== */}

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
                        ? "Guardando recepción..."
                        : "Guardar y cerrar recepción"}
                    </button>
                  )}

                </div>

              </>
            )}

          </div>

        </div>

        <div className="py-8 text-center">

          <p className="text-[11px] text-gray-400">
            BITFIX TALLER · Recepción de equipos
          </p>

        </div>

      </div>

    </main>
  );
}

function fotosSeleccionadasCount(
  fotos: Record<string, File | null>
) {
  return Object.values(fotos).filter(
    (foto) => foto !== null
  ).length;
}

