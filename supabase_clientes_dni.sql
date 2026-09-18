-- BITFIX TALLERES: agregar DNI a clientes
-- Ejecutar una sola vez en Supabase SQL Editor.
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS dni text;

CREATE INDEX IF NOT EXISTS clientes_taller_dni_idx
ON public.clientes (taller_id, dni);

COMMENT ON COLUMN public.clientes.dni IS 'Número de documento / DNI del cliente';

ALTER TABLE public.ordenes_reparacion
ADD COLUMN IF NOT EXISTS contraseña_equipo text;

COMMENT ON COLUMN public.ordenes_reparacion.contraseña_equipo IS 'Contraseña del equipo. Uso interno para reparación y etiqueta técnica.';
