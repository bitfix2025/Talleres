-- Ejecutar en Supabase SQL Editor
-- La columna anterior tenía ñ y rompe el parser de select de Supabase.
ALTER TABLE public.ordenes_reparacion
RENAME COLUMN "contraseña_equipo" TO contrasena_equipo;