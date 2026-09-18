-- Correcciones operativas para el flujo de reparaciones.
-- Ejecutar una sola vez en Supabase SQL Editor.

ALTER TABLE public.presupuesto_reparacion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS presupuesto_reparacion_items_authenticated_select ON public.presupuesto_reparacion_items;
DROP POLICY IF EXISTS presupuesto_reparacion_items_authenticated_insert ON public.presupuesto_reparacion_items;
DROP POLICY IF EXISTS presupuesto_reparacion_items_authenticated_update ON public.presupuesto_reparacion_items;
DROP POLICY IF EXISTS presupuesto_reparacion_items_authenticated_delete ON public.presupuesto_reparacion_items;

CREATE POLICY presupuesto_reparacion_items_authenticated_select
ON public.presupuesto_reparacion_items FOR SELECT TO authenticated USING (true);

CREATE POLICY presupuesto_reparacion_items_authenticated_insert
ON public.presupuesto_reparacion_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY presupuesto_reparacion_items_authenticated_update
ON public.presupuesto_reparacion_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY presupuesto_reparacion_items_authenticated_delete
ON public.presupuesto_reparacion_items FOR DELETE TO authenticated USING (true);

ALTER TABLE public.pagos_reparacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pagos_reparacion_authenticated_all ON public.pagos_reparacion;

CREATE POLICY pagos_reparacion_authenticated_all
ON public.pagos_reparacion FOR ALL TO authenticated
USING (true) WITH CHECK (true);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS perfiles_authenticated_select_tecnicos ON public.perfiles;

CREATE POLICY perfiles_authenticated_select_tecnicos
ON public.perfiles FOR SELECT TO authenticated
USING (activo = true AND UPPER(COALESCE(rol,'')) = 'TECNICO');

SELECT 'Correcciones operativas de reparaciones listas' AS estado;
