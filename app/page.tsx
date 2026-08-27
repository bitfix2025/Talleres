"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Smartphone,
  Package,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  ClipboardCheck,
  WalletCards,
  UserRound,
  Boxes,
  Receipt,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const router = useRouter();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [notificacionesAbiertas, setNotificacionesAbiertas] =
    useState(false);

  const irA = (ruta: string) => {
    setMenuAbierto(false);
    router.push(ruta);
  };

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#17201b]">

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white px-4 shadow-sm lg:hidden">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18a66b] text-xs font-black text-white shadow-sm">
            BF
          </div>

          <div>
            <p className="text-sm font-black tracking-tight text-gray-950">
              BITFIX
            </p>

            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">
              Taller
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="rounded-xl p-2.5 text-gray-700 transition hover:bg-gray-100 active:scale-95"
        >
          {menuAbierto ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>

      </header>

      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[260px]
            bg-[#101815] text-white
            shadow-2xl shadow-black/10
            transition-transform duration-200
            lg:sticky lg:top-0 lg:block lg:h-screen lg:translate-x-0
            ${
              menuAbierto
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >

          {/* LOGO */}

          <div className="flex h-20 items-center border-b border-white/10 px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18a66b] text-xs font-black text-white shadow-lg shadow-[#18a66b]/20">
                BF
              </div>

              <div>
                <p className="text-lg font-black tracking-tight">
                  BITFIX
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/40">
                  Sistema Taller
                </p>
              </div>

            </div>

          </div>

          <div className="flex h-[calc(100vh-80px)] flex-col">

            {/* MENU */}

            <nav className="flex-1 overflow-y-auto px-4 py-6">

              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                Principal
              </p>

              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                activo
                onClick={() => irA("/")}
              />

              <SidebarItem
                icon={<Wrench size={18} />}
                label="Reparaciones"
                onClick={() => irA("/reparaciones")}
              />

              <SidebarItem
                icon={<Users size={18} />}
                label="Clientes"
              />

              <SidebarItem
                icon={<Smartphone size={18} />}
                label="Equipos"
              />

              <div className="my-6 border-t border-white/10" />

              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                Gestión
              </p>

              <SidebarItem
                icon={<Package size={18} />}
                label="Inventario"
              />

              <SidebarItem
                icon={<DollarSign size={18} />}
                label="Ventas"
              />

              <SidebarItem
                icon={<FileText size={18} />}
                label="Presupuestos"
              />

              <SidebarItem
                icon={<BarChart3 size={18} />}
                label="Reportes"
              />

              <div className="my-6 border-t border-white/10" />

              <SidebarItem
                icon={<Settings size={18} />}
                label="Configuración"
              />

            </nav>

            {/* USUARIO */}

            <div className="border-t border-white/10 p-4">

              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#18a66b] text-xs font-bold text-white">
                  T
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-semibold text-white">
                    Técnico
                  </p>

                  <p className="truncate text-xs text-white/40">
                    Administrador
                  </p>

                </div>

                <Settings
                  size={16}
                  className="text-white/30"
                />

              </div>

            </div>

          </div>

        </aside>

        {/* OVERLAY MOBILE */}

        {menuAbierto && (
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* =====================================================
            CONTENIDO
        ====================================================== */}

        <section className="min-w-0 flex-1">

          {/* TOP BAR */}

          <header className="hidden h-20 items-center justify-between border-b border-gray-200/80 bg-white px-8 lg:flex">

            <div>
              <p className="text-sm font-bold text-gray-950">
                Dashboard
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                Resumen general del taller
              </p>
            </div>

            <div className="flex items-center gap-3">

              {/* BUSCADOR */}

              <div className="flex h-10 w-80 items-center gap-2 rounded-xl border border-gray-200 bg-[#f7f9f8] px-3 transition focus-within:border-[#18a66b] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#18a66b]/10">

                <Search
                  size={17}
                  className="shrink-0 text-gray-400"
                />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      busqueda.trim()
                    ) {
                      irA("/reparaciones");
                    }
                  }}
                  placeholder="Buscar orden, cliente..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />

                <span className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  ⌘ K
                </span>

              </div>

              {/* NOTIFICACIONES */}

              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setNotificacionesAbiertas(
                      !notificacionesAbiertas
                    )
                  }
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:border-gray-300 hover:bg-gray-50 active:scale-95"
                >

                  <Bell size={18} />

                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#18a66b]" />

                </button>

                {notificacionesAbiertas && (
                  <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

                    <div className="border-b border-gray-100 p-4">

                      <p className="text-sm font-bold">
                        Notificaciones
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Avisos del taller
                      </p>

                    </div>

                    <div className="p-5 text-center">

                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <Bell
                          size={18}
                          className="text-gray-400"
                        />
                      </div>

                      <p className="mt-3 text-xs font-semibold text-gray-700">
                        No tienes notificaciones
                      </p>

                    </div>

                  </div>
                )}

              </div>

              {/* USUARIO */}

              <div className="ml-2 flex items-center gap-3 border-l border-gray-200 pl-5">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101815] text-xs font-bold text-white">
                  T
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Técnico
                  </p>

                  <p className="text-[11px] text-gray-400">
                    Administrador
                  </p>
                </div>

              </div>

            </div>

          </header>

          {/* =====================================================
              DASHBOARD
          ====================================================== */}

          <div className="mx-auto max-w-[1500px] p-5 md:p-8">

            {/* CABECERA */}

            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

              <div>

                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#18a66b]">
                  Mi taller
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                  Buenos días
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Aquí tienes el resumen de la actividad de hoy.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  irA("/reparaciones/nueva")
                }
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#18a66b]/20 transition hover:bg-[#148f5c] hover:shadow-xl hover:shadow-[#18a66b]/20 active:scale-[0.98]"
              >

                <Plus
                  size={18}
                  className="transition group-hover:rotate-90"
                />

                Nueva reparación

              </button>

            </div>

            {/* =====================================================
                METRICAS
            ====================================================== */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                titulo="Recibidos"
                valor="0"
                descripcion="Esperando diagnóstico"
                icon={<ClipboardCheck size={20} />}
                iconClass="bg-blue-50 text-blue-600"
                onClick={() => irA("/reparaciones")}
              />

              <MetricCard
                titulo="En reparación"
                valor="0"
                descripcion="Trabajos activos"
                icon={<Wrench size={20} />}
                iconClass="bg-purple-50 text-purple-600"
                onClick={() => irA("/reparaciones")}
              />

              <MetricCard
                titulo="Listos"
                valor="0"
                descripcion="Esperando entrega"
                icon={<CheckCircle2 size={20} />}
                iconClass="bg-emerald-50 text-emerald-600"
                onClick={() => irA("/reparaciones")}
              />

              <MetricCard
                titulo="Entregas"
                valor="0"
                descripcion="Para entregar hoy"
                icon={<WalletCards size={20} />}
                iconClass="bg-orange-50 text-orange-600"
                onClick={() => irA("/reparaciones")}
              />

            </div>

            {/* =====================================================
                PRINCIPAL
            ====================================================== */}

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">

              {/* REPARACIONES */}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <h2 className="text-base font-bold text-gray-950">
                        Reparaciones recientes
                      </h2>

                      <span className="rounded-full bg-[#e9f8f1] px-2 py-0.5 text-[10px] font-bold text-[#148f5c]">
                        0
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                      Últimas órdenes registradas
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      irA("/reparaciones")
                    }
                    className="group inline-flex items-center gap-1 text-sm font-semibold text-gray-600 transition hover:text-[#18a66b]"
                  >

                    Ver todas

                    <ChevronRight
                      size={16}
                      className="transition group-hover:translate-x-0.5"
                    />

                  </button>

                </div>

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[720px]">

                    <thead>

                      <tr className="border-b border-gray-100 bg-[#fafbfb] text-left">

                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Orden
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

                      </tr>

                    </thead>

                    <tbody>

                      <tr>

                        <td
                          colSpan={5}
                          className="px-5 py-16"
                        >

                          <div className="flex flex-col items-center justify-center text-center">

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f8f1]">
                              <Wrench
                                size={24}
                                className="text-[#18a66b]"
                              />
                            </div>

                            <h3 className="mt-4 text-sm font-bold text-gray-900">
                              No hay reparaciones todavía
                            </h3>

                            <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                              Cuando recibas un iPhone, la orden aparecerá automáticamente en este listado.
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                irA("/reparaciones/nueva")
                              }
                              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#18a66b] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#148f5c] active:scale-95"
                            >

                              <Plus size={15} />

                              Crear reparación

                            </button>

                          </div>

                        </td>

                      </tr>

                    </tbody>

                  </table>

                </div>

              </div>

              {/* ACTIVIDAD */}

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-100 p-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <h2 className="text-base font-bold text-gray-950">
                        Actividad reciente
                      </h2>

                      <p className="mt-1 text-xs text-gray-400">
                        Últimos movimientos
                      </p>

                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                      <Clock3
                        size={17}
                        className="text-gray-500"
                      />
                    </div>

                  </div>

                </div>

                <div className="p-5">

                  <div className="flex flex-col items-center justify-center py-12 text-center">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                      <Clock3
                        size={21}
                        className="text-gray-400"
                      />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-gray-800">
                      Sin actividad
                    </p>

                    <p className="mt-1 max-w-[240px] text-xs leading-5 text-gray-400">
                      Los movimientos del taller aparecerán aquí automáticamente.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* =====================================================
                ACCIONES RAPIDAS
            ====================================================== */}

            <div className="mt-8">

              <div className="mb-4">

                <h2 className="text-base font-bold text-gray-950">
                  Acciones rápidas
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Accede rápidamente a las funciones más utilizadas.
                </p>

              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <QuickAction
                  icon={<Wrench size={20} />}
                  titulo="Nueva reparación"
                  descripcion="Recibir un iPhone"
                  onClick={() =>
                    irA("/reparaciones/nueva")
                  }
                />

                <QuickAction
                  icon={<UserRound size={20} />}
                  titulo="Nuevo cliente"
                  descripcion="Registrar cliente"
                />

                <QuickAction
                  icon={<Boxes size={20} />}
                  titulo="Agregar repuesto"
                  descripcion="Actualizar inventario"
                />

                <QuickAction
                  icon={<Receipt size={20} />}
                  titulo="Nuevo presupuesto"
                  descripcion="Crear presupuesto"
                />

              </div>

            </div>

            {/* =====================================================
                RESUMEN
            ====================================================== */}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">

              {/* ESTADOS */}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-base font-bold text-gray-950">
                      Estado de reparaciones
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Distribución de órdenes
                    </p>

                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e9f8f1]">
                    <BarChart3
                      size={18}
                      className="text-[#18a66b]"
                    />
                  </div>

                </div>

                <div className="mt-6 space-y-5">

                  <StatusBar
                    nombre="Recibidos"
                    cantidad="0"
                    icon={<ClipboardCheck size={14} />}
                    className="bg-blue-500"
                  />

                  <StatusBar
                    nombre="Diagnóstico"
                    cantidad="0"
                    icon={<Search size={14} />}
                    className="bg-yellow-500"
                  />

                  <StatusBar
                    nombre="En reparación"
                    cantidad="0"
                    icon={<Wrench size={14} />}
                    className="bg-purple-500"
                  />

                  <StatusBar
                    nombre="Listos"
                    cantidad="0"
                    icon={<CheckCircle2 size={14} />}
                    className="bg-[#18a66b]"
                  />

                </div>

              </div>

              {/* RESUMEN */}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-base font-bold text-gray-950">
                      Resumen del taller
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      Información general
                    </p>

                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                    <SlidersHorizontal
                      size={18}
                      className="text-gray-500"
                    />
                  </div>

                </div>

                <div className="mt-5 divide-y divide-gray-100">

                  <SummaryItem
                    titulo="Clientes registrados"
                    valor="0"
                    icon={<Users size={16} />}
                  />

                  <SummaryItem
                    titulo="Equipos registrados"
                    valor="0"
                    icon={<Smartphone size={16} />}
                  />

                  <SummaryItem
                    titulo="Reparaciones este mes"
                    valor="0"
                    icon={<Wrench size={16} />}
                  />

                  <SummaryItem
                    titulo="Ingresos del mes"
                    valor="$0"
                    icon={<DollarSign size={16} />}
                  />

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="py-8 text-center">

              <p className="text-[11px] font-medium text-gray-400">
                BITFIX TALLER
              </p>

              <p className="mt-1 text-[10px] text-gray-300">
                Sistema de gestión de reparaciones
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =====================================================
   SIDEBAR ITEM
===================================================== */

function SidebarItem({
  icon,
  label,
  activo = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  activo?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150
        ${
          activo
            ? "bg-[#18a66b] font-semibold text-white shadow-lg shadow-[#18a66b]/10"
            : "font-medium text-white/55 hover:bg-white/5 hover:text-white"
        }
      `}
    >

      <span
        className={`
          transition-transform duration-150
          ${
            !activo
              ? "group-hover:scale-110"
              : ""
          }
        `}
      >
        {icon}
      </span>

      <span>{label}</span>

      {!activo && (
        <ChevronRight
          size={14}
          className="ml-auto opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-50"
        />
      )}

    </button>
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
  iconClass,
  onClick,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  icon: React.ReactNode;
  iconClass: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
    >

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
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass} transition-transform duration-200 group-hover:scale-105`}
        >
          {icon}
        </div>

      </div>

      <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-gray-300 transition group-hover:text-[#18a66b]">

        Ver reparaciones

        <ArrowUpRight
          size={12}
          className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />

      </div>

    </button>
  );
}

/* =====================================================
   QUICK ACTION
===================================================== */

function QuickAction({
  icon,
  titulo,
  descripcion,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bcebd5] hover:shadow-md active:scale-[0.99]"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9f8f1] text-[#18a66b] transition-all duration-200 group-hover:bg-[#18a66b] group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-sm font-bold text-gray-900">
          {titulo}
        </p>

        <p className="mt-0.5 text-xs text-gray-400">
          {descripcion}
        </p>

      </div>

      <ChevronRight
        size={16}
        className="ml-auto text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#18a66b]"
      />

    </button>
  );
}

/* =====================================================
   STATUS BAR
===================================================== */

function StatusBar({
  nombre,
  cantidad,
  icon,
  className,
}: {
  nombre: string;
  cantidad: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <span
            className={`flex h-6 w-6 items-center justify-center rounded-lg text-white ${className}`}
          >
            {icon}
          </span>

          <span className="text-xs font-medium text-gray-600">
            {nombre}
          </span>

        </div>

        <span className="text-xs font-bold text-gray-900">
          {cantidad}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">

        <div
          className={`h-full w-0 rounded-full ${className}`}
        />

      </div>

    </div>
  );
}

/* =====================================================
   SUMMARY ITEM
===================================================== */

function SummaryItem({
  titulo,
  valor,
  icon,
}: {
  titulo: string;
  valor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4">

      <div className="flex items-center gap-3">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          {icon}
        </div>

        <span className="text-sm text-gray-500">
          {titulo}
        </span>

      </div>

      <span className="text-sm font-bold text-gray-950">
        {valor}
      </span>

    </div>
  );
}