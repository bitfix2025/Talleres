import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
function tokenFor(ordenId:number){ return crypto.createHmac("sha256", secret || "bitfix-fotos").update(String(ordenId)).digest("hex"); }
export async function POST(req:NextRequest){
 if(!secret) return NextResponse.json({error:"Falta SUPABASE_SERVICE_ROLE_KEY en Vercel"},{status:500});
 const form=await req.formData(); const ordenId=Number(form.get("ordenId")); const token=String(form.get("token")||""); const tipo=String(form.get("tipo")||"otros"); const archivo=form.get("archivo");
 if(!ordenId || token!==tokenFor(ordenId) || !(archivo instanceof File)) return NextResponse.json({error:"Enlace de fotos inválido."},{status:403});
 if(!archivo.type.startsWith("image/")) return NextResponse.json({error:"Solo se permiten imágenes."},{status:400});
 if(archivo.size>10*1024*1024) return NextResponse.json({error:"La foto supera 10 MB."},{status:400});
 const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
 const bytes=Buffer.from(await archivo.arrayBuffer()); const ext=(archivo.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
 const ruta="orden-"+ordenId+"/"+ordenId+"_movil_"+tipo+"_"+Date.now()+"."+ext;
 const {error:up}=await supabase.storage.from("recepcion-fotos").upload(ruta,bytes,{contentType:archivo.type,upsert:false});
 if(up) return NextResponse.json({error:up.message},{status:500});
 const {data:url}=supabase.storage.from("recepcion-fotos").getPublicUrl(ruta);
 const {error:ins}=await supabase.from("fotos_recepcion").insert({orden_id:ordenId,tipo,url:url.publicUrl});
 if(ins) return NextResponse.json({error:ins.message},{status:500});
 return NextResponse.json({ok:true,url:url.publicUrl});
}