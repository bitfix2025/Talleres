import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
function tokenFor(ordenId:number){ return crypto.createHmac("sha256", secret || "bitfix-fotos").update(String(ordenId)).digest("hex"); }
export async function GET(req:NextRequest){
 const id=Number(req.nextUrl.searchParams.get("ordenId"));
 if(!id) return NextResponse.json({error:"Orden inválida"},{status:400});
 if(!secret) return NextResponse.json({error:"Falta SUPABASE_SERVICE_ROLE_KEY en Vercel"},{status:500});
 return NextResponse.json({token:tokenFor(id)});
}