export type RolUsuario = "ADMIN" | "ENCARGADO" | "TECNICO";

export function puedeAcceder(rol: RolUsuario | string, pathname: string) {
  const r = String(rol || "").toUpperCase();
  if (r === "ADMIN") return true;
  if (r === "TECNICO") return ["/","/reparaciones","/clientes","/equipos"].some(p => pathname === p || pathname.startsWith(p + "/"));
  if (r === "ENCARGADO") return ["/","/reparaciones","/clientes","/equipos","/presupuestos","/inventario","/compras","/ventas"].some(p => pathname === p || pathname.startsWith(p + "/"));
  return pathname === "/";
}

export const MENU_POR_ROL: Record<RolUsuario,string[]> = {
  ADMIN:["/","/reparaciones","/clientes","/equipos","/inventario","/compras","/ventas","/presupuestos","/reportes","/configuracion"],
  ENCARGADO:["/","/reparaciones","/clientes","/equipos","/presupuestos","/inventario","/compras","/ventas"],
  TECNICO:["/","/reparaciones","/clientes","/equipos"],
};
