export type RolUsuario = "administrador" | "tecnico" | "recepcion";

export function puedeAcceder(rol: RolUsuario, pathname: string) {
  if (rol === "administrador") return true;
  if (pathname === "/") return true;
  if (rol === "tecnico") return ["/reparaciones","/clientes","/equipos"].some(r => pathname === r || pathname.startsWith(r + "/"));
  return ["/reparaciones","/clientes","/equipos","/presupuestos"].some(r => pathname === r || pathname.startsWith(r + "/"));
}

export const MENU_POR_ROL: Record<RolUsuario,string[]> = {
  administrador:["/","/reparaciones","/clientes","/equipos","/inventario","/compras","/ventas","/presupuestos","/reportes","/configuracion"],
  tecnico:["/","/reparaciones","/clientes","/equipos"],
  recepcion:["/","/reparaciones","/clientes","/equipos","/presupuestos"],
};
