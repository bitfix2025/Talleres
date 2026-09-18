-- La app registra pagos usando la columna monto.
-- Ejecutar una sola vez en Supabase SQL Editor.

ALTER TABLE public.pagos_reparacion
ADD COLUMN IF NOT EXISTS monto numeric(12,2);

-- Si la tabla ya existía con otra estructura, completar montos faltantes
-- con 0 para permitir que el esquema se actualice. Luego los nuevos pagos
-- exigirán un monto positivo desde la aplicación.
UPDATE public.pagos_reparacion
SET monto = 0
WHERE monto IS NULL;

ALTER TABLE public.pagos_reparacion
ALTER COLUMN monto SET NOT NULL;

SELECT pg_notify('pgrst', 'reload schema');
