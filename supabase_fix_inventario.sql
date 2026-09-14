-- TALLERES - FIX INVENTARIO
-- El proyecto actual no tiene login/autenticación en el frontend.
-- Por eso las consultas llegan a Supabase como anon.
-- Estas políticas permiten operar Inventario mientras se incorpora autenticación.
-- IMPORTANTE: cuando agreguemos login por taller, reemplazar estas políticas
-- por políticas que filtren por taller_id y auth.uid().

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "productos_anon_select" ON public.productos;
DROP POLICY IF EXISTS "productos_anon_insert" ON public.productos;
DROP POLICY IF EXISTS "productos_anon_update" ON public.productos;
DROP POLICY IF EXISTS "productos_anon_delete" ON public.productos;

CREATE POLICY "productos_anon_select"
ON public.productos
FOR SELECT
TO anon
USING (true);

CREATE POLICY "productos_anon_insert"
ON public.productos
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "productos_anon_update"
ON public.productos
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "productos_anon_delete"
ON public.productos
FOR DELETE
TO anon
USING (true);

DROP POLICY IF EXISTS "movimientos_stock_anon_select" ON public.movimientos_stock;
DROP POLICY IF EXISTS "movimientos_stock_anon_insert" ON public.movimientos_stock;

CREATE POLICY "movimientos_stock_anon_select"
ON public.movimientos_stock
FOR SELECT
TO anon
USING (true);

CREATE POLICY "movimientos_stock_anon_insert"
ON public.movimientos_stock
FOR INSERT
TO anon
WITH CHECK (true);

-- Verificación
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('productos', 'movimientos_stock')
ORDER BY tablename, policyname;
