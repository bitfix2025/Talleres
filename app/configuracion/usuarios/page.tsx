"use client";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {RolUsuario} from "../../../lib/roles";
import {ShieldCheck,UserCog,Save,Loader2,ArrowLeft} from "lucide-react";
import {useRouter} from "next/navigation";

type Perfil={id:string;nombre:string|null;email:string|null;rol:RolUsuario;activo:boolean};

export default function UsuariosPage(){
 const router=useRouter(); const [items,setItems]=useState<Perfil[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [ok,setOk]=useState("");
 async function cargar(){const {data,error}=await supabase.from("perfiles").select("id,nombre,email,rol,activo").order("nombre");if(error)setError(error.message);else setItems((data||[]) as Perfil[])}
 useEffect(()=>{cargar()},[]);
 async function guardar(p:Perfil){setBusy(true);setError("");setOk("");const {error}=await supabase.from("perfiles").update({nombre:p.nombre,rol:p.rol,activo:p.activo,updated_at:new Date().toISOString()}).eq("id",p.id);if(error)setError(error.message);else setOk("Cambios guardados.");setBusy(false)}
 return <main className="min-h-screen bg-[#f4f7f5] p-5 md:p-8"><div className="mx-auto max-w-5xl">
  <button onClick={()=>router.back()} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#18a66b]"><ArrowLeft size={17}/> Volver</button>
  <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#18a66b]">Sistema</p><h1 className="mt-2 text-3xl font-black">Usuarios y permisos</h1><p className="mt-1 text-sm text-gray-500">Define qué puede hacer cada persona dentro del taller.</p></div>
  {error&&<div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}{ok&&<div className="mb-4 rounded-xl bg-[#e9f8f1] p-3 text-sm font-semibold text-[#148f5c]">{ok}</div>}
  <div className="grid gap-4">{items.map(p=><div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center">
   <div className="flex min-w-0 flex-1 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9f8f1] text-[#18a66b]"><UserCog size={20}/></div><div className="min-w-0"><p className="truncate font-bold text-gray-900">{p.nombre||"Sin nombre"}</p><p className="truncate text-xs text-gray-400">{p.email||"Sin correo"}</p></div></div>
   <select value={p.rol} onChange={e=>setItems(xs=>xs.map(x=>x.id===p.id?{...x,rol:e.target.value as RolUsuario}:x))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#18a66b]"><option value="administrador">Administrador</option><option value="tecnico">Técnico</option><option value="recepcion">Recepción</option></select>
   <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={p.activo} onChange={e=>setItems(xs=>xs.map(x=>x.id===p.id?{...x,activo:e.target.checked}:x))} className="h-4 w-4 accent-[#18a66b]"/> Activo</label>
   <button disabled={busy} onClick={()=>guardar(p)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#18a66b] px-4 text-sm font-bold text-white hover:bg-[#148f5c] disabled:opacity-60"><Save size={16}/> Guardar</button>
  </div></div>)}</div>
  {!items.length&&!error&&<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"><ShieldCheck className="mx-auto text-gray-300" size={30}/><p className="mt-3 text-sm font-semibold text-gray-600">No hay usuarios registrados.</p></div>}
 </div></main>
