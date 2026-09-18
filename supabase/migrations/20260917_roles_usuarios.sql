create type public.rol_usuario as enum ('administrador','tecnico','recepcion');

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  email text,
  rol public.rol_usuario not null default 'tecnico',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create or replace function public.mi_rol()
returns public.rol_usuario language sql stable security definer set search_path=public
as $$ select rol from public.perfiles where id=auth.uid() and activo=true limit 1; $$;

create or replace function public.crear_perfil_usuario()
returns trigger language plpgsql security definer set search_path=public
as $$ begin
insert into public.perfiles(id,nombre,email,rol)
values(new.id,coalesce(new.raw_user_meta_data->>'nombre',split_part(coalesce(new.email,''),'@',1)),new.email,'tecnico')
on conflict(id) do nothing;
return new; end; $$;

drop trigger if exists on_auth_user_created_perfil on auth.users;
create trigger on_auth_user_created_perfil after insert on auth.users
for each row execute function public.crear_perfil_usuario();

drop policy if exists "usuarios ven su perfil" on public.perfiles;
create policy "usuarios ven su perfil" on public.perfiles for select to authenticated
using(id=auth.uid() or public.mi_rol()='administrador');

drop policy if exists "administrador gestiona perfiles" on public.perfiles;
create policy "administrador gestiona perfiles" on public.perfiles for all to authenticated
using(public.mi_rol()='administrador') with check(public.mi_rol()='administrador');

grant select on public.perfiles to authenticated;
grant execute on function public.mi_rol() to authenticated;

-- Después de crear el primer usuario, convertirlo en administrador:
-- update public.perfiles set rol='administrador' where id='UUID_DEL_USUARIO';
