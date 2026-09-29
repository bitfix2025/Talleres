-- Campos específicos para equipos (iPhone nuevos/usados) en inventario
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS imei text,
  ADD COLUMN IF NOT EXISTS numero_serie text,
  ADD COLUMN IF NOT EXISTS salud_bateria numeric(5,2),
  ADD COLUMN IF NOT EXISTS condicion_equipo text,
  ADD COLUMN IF NOT EXISTS estado_fisico text,
  ADD COLUMN IF NOT EXISTS garantia_dias integer DEFAULT 60;

CREATE INDEX IF NOT EXISTS productos_imei_idx ON public.productos(imei);
CREATE INDEX IF NOT EXISTS productos_numero_serie_idx ON public.productos(numero_serie);
