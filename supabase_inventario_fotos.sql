-- Inventario Talleres: fotos de productos
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS image_url text;

-- Bucket público para mostrar las fotos en las tarjetas del inventario.
insert into storage.buckets (id, name, public)
values ('recepcion-fotos', 'recepcion-fotos', true)
on conflict (id) do update set public = true;

-- Mientras Inventario funciona con anon, permitimos operar con este bucket.
-- Estas políticas deberán reemplazarse cuando implementemos autenticación por taller.
DROP POLICY IF EXISTS "recepcion_fotos_storage_anon_select" ON storage.objects;
DROP POLICY IF EXISTS "recepcion_fotos_storage_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "recepcion_fotos_storage_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "recepcion_fotos_storage_anon_delete" ON storage.objects;

CREATE POLICY "recepcion_fotos_storage_anon_select"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'recepcion-fotos');

CREATE POLICY "recepcion_fotos_storage_anon_insert"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'recepcion-fotos');

CREATE POLICY "recepcion_fotos_storage_anon_update"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'recepcion-fotos')
WITH CHECK (bucket_id = 'recepcion-fotos');

CREATE POLICY "recepcion_fotos_storage_anon_delete"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'recepcion-fotos');
