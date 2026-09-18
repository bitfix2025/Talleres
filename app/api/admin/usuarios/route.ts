import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
    const { data: perfil, error: perfilError } = await supabase.from("perfiles").select("rol,activo").eq("id", user.id).maybeSingle();
    if (perfilError || !perfil || String(perfil.rol || "").toUpperCase() !== "ADMIN" || !perfil.activo) return NextResponse.json({ error: "Solo un administrador activo puede crear usuarios." }, { status: 403 });
    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rolRecibido = String(body.rol ?? "");
    const rol = rolRecibido.toUpperCase() === "RECEPCION" ? "ENCARGADO" : rolRecibido.toUpperCase();
    if (!nombre || !email || !password || !["TECNICO","ENCARGADO"].includes(rol)) return NextResponse.json({ error: "Completá nombre, correo, contraseña y rol." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel." }, { status: 500 });
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre, rol } });
    if (createError || !created.user) return NextResponse.json({ error: createError?.message || "No se pudo crear el usuario." }, { status: 400 });
    const { error: insertError } = await admin.from("perfiles").insert({ id: created.user.id, nombre, rol, activo: true });
    if (insertError) { await admin.auth.admin.deleteUser(created.user.id); return NextResponse.json({ error: "No se pudo crear el perfil: " + insertError.message }, { status: 400 }); }
    return NextResponse.json({ ok: true, message: "Usuario creado correctamente." });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado." }, { status: 500 }); }
}