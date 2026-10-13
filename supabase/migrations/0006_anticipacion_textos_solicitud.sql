-- 0006 — Hora límite con días de anticipación, textos de la página editables,
--        correo en las solicitudes y zonas simplificadas.

-- Días de anticipación para la hora límite (1 = el día anterior, 2 = dos días antes…)
alter table public.settings add column if not exists cutoff_days_before int not null default 2
  check (cutoff_days_before between 1 and 7);
comment on column public.settings.cutoff_days_before is 'Con cuántos días de anticipación a la entrega se cierra el pedido.';
comment on column public.settings.cutoff_time is 'Hora del cierre, el día de cierre (entrega − cutoff_days_before).';

-- Textos de la página principal editables desde Admin → Ajustes (se fusionan con los valores por defecto del código)
alter table public.settings add column if not exists landing jsonb not null default '{}'::jsonb;

update public.settings set zones = 'Tuchín y municipios cercanos.', cutoff_days_before = 2;
alter table public.settings alter column zones set default 'Tuchín y municipios cercanos.';

-- Correo opcional en la solicitud
alter table public.signup_requests add column if not exists email text;

-- Hora límite de una entrega según los ajustes
create or replace function public.order_cutoff(p_delivery date)
returns timestamptz language sql stable set search_path = public as $$
  select ((p_delivery - s.cutoff_days_before) + s.cutoff_time) at time zone 'America/Bogota' from settings s limit 1;
$$;

-- Pregunta frecuente coherente con la nueva hora límite
update public.faqs
  set answer = 'Cuando tu cuenta esté activa, entras desde el celular, eliges cuántos paquetes quieres y el día de entrega. Puedes cambiarlo hasta la hora límite, que ves en el calendario de la semana.'
  where question = '¿Cómo hago un pedido?';
