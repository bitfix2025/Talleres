"use client";
import {FormEvent,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../../lib/supabase";
import {Loader2,LockKeyhole,Mail} from "lucide-react";

export default function LoginPage(){
 const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{if(data.session)router.replace("/")})},[router]);
 async function entrar(e:FormEvent){e.preventDefault();setError("");setBusy(true);const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error){setError(error.message);setBusy(false);return;}router.replace("/")}
 return <main className="min-h-screen bg-[#f4f7f5] grid place-items-center p-5"><div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-xl"><div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#18a66b] text-white font-black">BF</div><h1 className="mt-4 text-2xl font-black">BITFIX</h1><p className="text-sm text-gray-400">Sistema de gestión del taller</p></div><form onSubmit={entrar} className="mt-7 space-y-4"><label className="block text-xs font-bold">Correo<div className="mt-1 flex items-center gap-2 rounded-xl border px-3"><Mail size={17} className="text-gray-400"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 w-full outline-none"/></div></label><label className="block text-xs font-bold">Contraseña<div className="mt-1 flex items-center gap-2 rounded-xl border px-3"><LockKeyhole size={17} className="text-gray-400"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="h-11 w-full outline-none"/></div></label>{error&&<div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}<button disabled={busy} className="h-12 w-full rounded-xl bg-[#18a66b] font-bold text-white disabled:opacity-60">{busy?<Loader2 className="mx-auto animate-spin"/>:"Entrar"}</button></form></div></main>
}