"use client";
import { ReactNode,useEffect,useState } from "react";
import { usePathname,useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { puedeAcceder,RolUsuario } from "../lib/roles";
import { Loader2 } from "lucide-react";

export default function AuthGuard({children}:{children:ReactNode}){
 const pathname=usePathname(),router=useRouter();
 const [ok,setOk]=useState(pathname==="/login");
 useEffect(()=>{if(pathname==="/login"){setOk(true);return} let vivo=true;
  async function validar(){
   const {data:{session}}=await supabase.auth.getSession();
   if(!session){router.replace("/login");return}
   const {data,error}=await supabase.from("perfiles").select("rol,activo").eq("id",session.user.id).maybeSingle();
   if(error){if(vivo)setOk(true);return}
   if(!data?.activo){router.replace("/login");return}
   if(!puedeAcceder(data.rol as RolUsuario,pathname)){router.replace("/");return}
   if(vivo)setOk(true);
  }
  validar();
  const {data}=supabase.auth.onAuthStateChange(()=>validar());
  return()=>{vivo=false;data.subscription.unsubscribe()};
 },[pathname,router]);
 if(!ok)return <main className="min-h-screen bg-[#f4f7f5] grid place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#18a66b]"/><p className="mt-3 text-xs text-gray-400">Cargando Talleres...</p></div></main>;
 return <>{children}</>;
}