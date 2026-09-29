-- Fix RLS para movimientos de stock
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

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
