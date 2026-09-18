"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { LockKeyhole, Loader2, Eye, EyeOff } from "lucide-react";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const preparar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCargando(false);
        return;
      }

      const hash = window.location.hash;
      if (hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) setError(error.message);
        }
      }
      setCargando(false);
    };
    preparar();
  }, []);

  async function guardar() {
    setError("");
    setOk("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setOk("Contraseña actualizada correctamente.");
      setTimeout(() => router.push("/login"), 1200);
    }
    setGuardando(false);
  }

  if (cargando) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f7f5]"><Loader2 className="animate-spin text-[#18a66b]" /></main>;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f5] px-5">
      <section className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f8f1] text-[#18a66b]">
            <LockKeyhole size={25} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-gray-900">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-gray-500">Creá una nueva contraseña para acceder a Talleres.</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        {ok && <div className="mb-4 rounded-xl bg-[#e9f8f1] p-3 text-sm font-semibold text-[#148f5c]">{ok}</div>}

        <div className="space-y-3">
          <input
            type={mostrar ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-[#18a66b]"
          />
          <div className="flex h-12 rounded-xl border border-gray-200 px-4 focus-within:border-[#18a66b]">
            <input
              type={mostrar ? "text" : "password"}
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="Repetir contraseña"
              className="w-full text-sm outline-none"
            />
            <button type="button" onClick={() => setMostrar(!mostrar)} className="text-gray-400">
              {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            onClick={guardar}
            disabled={guardando}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#18a66b] text-sm font-bold text-white hover:bg-[#148f5c] disabled:opacity-60"
          >
            {guardando && <Loader2 size={17} className="animate-spin" />}
            Guardar nueva contraseña
          </button>
        </div>
      </section>
    </main>
  );
}
