"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";
import { puedeAcceder, RolUsuario } from "../lib/roles";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState(pathname === "/login");
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setOk(true);
      return;
    }

    let vivo = true;

    async function validar() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (vivo) setOk(false);
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("perfiles")
        .select("rol,activo")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        if (vivo) setOk(true);
        return;
      }

      if (!data?.activo) {
        if (vivo) setOk(false);
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (!puedeAcceder(data.rol as RolUsuario, pathname)) {
        router.replace("/");
        return;
      }

      if (vivo) setOk(true);
    }

    void validar();

    const { data } = supabase.auth.onAuthStateChange(() => {
      void validar();
    });

    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const cerrarSesion = async () => {
    if (saliendo) return;
    setSaliendo(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (!ok) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f7f5]">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-[#18a66b]" />
          <p className="mt-3 text-xs text-gray-400">Cargando Talleres...</p>
        </div>
      </main>
    );
  }

  if (pathname === "/login") return <>{children}</>;

  return (
    <>
      {children}
      <button
        type="button"
        onClick={cerrarSesion}
        disabled={saliendo}
        title="Cerrar sesión"
        className="fixed bottom-4 right-4 z-[200] inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 shadow-lg transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
      >
        <LogOut size={15} />
        {saliendo ? "Saliendo..." : "Cerrar sesión"}
      </button>
    </>
  );
}
