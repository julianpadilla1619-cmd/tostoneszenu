-- =============================================================
-- 0002 — Solo mayoristas, entregas configurables, catálogo ajustable,
--        preguntas frecuentes, notificaciones y endurecimiento de seguridad.
-- Reemplaza el modelo de `weeks` por `orders.week_start` + `orders.delivery_on`.
-- =============================================================

-- ---------- Productos ----------
alter table public.products add column if not exists category text not null default 'platano';
alter table public.products add constraint products_category_check
  check (category in ('platano', 'papa', 'name', 'yuca', 'otro'));
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists image_url text;
alter table public.products rename column price_wholesale to price;

-- Datos coherentes para lo que ya existe
update public.products set name = 'Tajadas de plátano', category = 'platano', weight_grams = 150, featured = true, sort = 1,
  description = 'Plátano verde hartón de la región, cortado delgado y frito al punto. Crocantes y con su sal justa.'
  where name = 'Tostones de plátano';
update public.products set name = 'Tajadas de papa', category = 'papa', weight_grams = 120, featured = true, sort = 2,
  description = 'Papa en tajadas finas, doradas y crocantes. Listas para la vitrina de tu negocio.'
  where name = 'Papas fritas';
update public.products set name = 'Tajadas de plátano grande', category = 'platano', weight_grams = 250, featured = false, sort = 3,
  description = 'La presentación grande, para compartir o para cafeterías.'
  where name = 'Tajadas de Plátano Grande';

update public.products set weight_grams = 150 where weight_grams is null;
alter table public.products alter column weight_grams set not null;
alter table public.products add constraint products_weight_check check (weight_grams > 0);
alter table public.products alter column description set default '';
update public.products set description = '' where description is null;
alter table public.products alter column description set not null;
alter table public.products drop column if exists price_regular;
alter table public.products drop column if exists presentation;
alter table public.products drop column if exists size_variant;

-- ---------- Configuración ----------
alter table public.settings add column if not exists delivery_weekdays int[] not null default '{2,4}';
alter table public.settings add column if not exists zones text not null default 'Tuchín y municipios cercanos de Córdoba y Sucre.';
alter table public.settings add column if not exists contact_email text;
alter table public.settings add constraint settings_delivery_weekdays_check
  check (cardinality(delivery_weekdays) > 0 and delivery_weekdays <@ '{1,2,3,4,5,6,7}'::int[]);
update public.settings set
  headline = 'Tostones artesanales de Tuchín, Córdoba.',
  zones = 'Tuchín y municipios cercanos de Córdoba y Sucre.',
  delivery_weekdays = '{2,4}',
  wholesale_min_packs = 10;
alter table public.settings alter column headline set default 'Tostones artesanales de Tuchín, Córdoba.';
update public.settings set headline = 'Tostones artesanales de Tuchín, Córdoba.' where headline is null;
alter table public.settings alter column headline set not null;
alter table public.settings drop column if exists cutoff_weekday;
alter table public.settings drop column if exists delivery_weekday;
alter table public.settings drop column if exists delivery_days;
alter table public.settings drop column if exists delivery_days_list;
alter table public.settings drop column if exists working_days;
alter table public.settings drop column if exists faq_min_packs;
alter table public.settings drop column if exists faq_cutoff;
alter table public.settings drop column if exists faq_zones;
comment on column public.settings.cutoff_time is 'Hora límite del día ANTERIOR a cada entrega para pedir o cambiar el pedido.';
comment on column public.settings.delivery_weekdays is 'Días de entrega ISO (1 = lunes … 7 = domingo).';

-- ---------- Preguntas frecuentes ----------
create table public.faqs (
  id       uuid primary key default gen_random_uuid(),
  question text not null,
  answer   text not null,
  sort     int not null default 0,
  active   boolean not null default true
);
alter table public.faqs enable row level security;
create policy admin_all on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy public_read_faqs on public.faqs for select to anon, authenticated using (active);
insert into public.faqs (question, answer, sort) values
  ('¿Venden al detal?', 'No. Tostones Zenú vende solo al por mayor: tiendas, cafeterías, kioscos y revendedores. El pedido mínimo es de 10 paquetes.', 1),
  ('¿Cómo hago un pedido?', 'Cuando tu cuenta esté activa, entras desde el celular, eliges cuántos paquetes quieres y el día de entrega. Puedes cambiarlo hasta la hora límite del día anterior.', 2),
  ('¿Qué días entregan?', 'Entregamos los días que aparecen en la sección de entregas. Si necesitas otro día, escríbenos por WhatsApp.', 3),
  ('¿Cómo pago?', 'Efectivo contra entrega, Nequi, Daviplata o transferencia.', 4),
  ('¿Tengo que instalar algo?', 'No es obligatorio. La app abre desde el navegador, pero puedes agregarla a la pantalla de inicio para recibir avisos en el celular.', 5);

-- Lectura pública del catálogo y la configuración (la landing es pública)
create policy public_read_products on public.products for select to anon using (active);
create policy public_read_settings on public.settings for select to anon using (true);

-- ---------- Pedidos: semana + día de entrega (sin tabla weeks) ----------
drop view if exists public.v_weekly_consolidated;
drop policy if exists own_orders_write on public.orders;
drop policy if exists own_orders_update on public.orders;
alter table public.orders drop column week_id cascade;
drop function if exists public.get_or_create_week(date);
drop table if exists public.weeks cascade;

alter table public.orders add column week_start date not null;
alter table public.orders add column delivery_on date;
alter table public.orders add constraint orders_week_start_monday check (extract(isodow from week_start) = 1);
alter table public.orders add constraint orders_delivery_in_week
  check (delivery_on is null or delivery_on between week_start and week_start + 6);
alter table public.orders add constraint orders_delivery_required
  check (status in ('no_pide', 'cancelado') or delivery_on is not null);
alter table public.orders add constraint orders_customer_week_key unique (customer_id, week_start);
create index orders_week_status_idx on public.orders (week_start, status);
-- Los clientes solo LEEN sus pedidos. Crear/editar pasa por Server Actions
-- (service role) que validan hora límite, mínimo y precio.

create or replace function public.order_cutoff(p_delivery date)
returns timestamptz language sql stable set search_path = public as $$
  select ((p_delivery - 1) + s.cutoff_time) at time zone 'America/Bogota' from settings s limit 1;
$$;

create view public.v_weekly_consolidated with (security_invoker = true) as
select o.week_start, o.delivery_on, oi.product_id, p.name as product_name,
       sum(oi.qty)::int as total_qty,
       sum(oi.qty * oi.unit_price)::int as total_value,
       count(distinct o.id)::int as orders
from orders o
join order_items oi on oi.order_id = o.id
join products p on p.id = oi.product_id
where o.status in ('confirmado', 'en_produccion', 'en_camino', 'entregado')
group by o.week_start, o.delivery_on, oi.product_id, p.name;

-- ---------- Perfiles: solo mayoristas + datos de contacto ----------
update public.profiles set role = 'mayorista' where role = 'regular';
alter table public.profiles add constraint profiles_role_no_regular check (role <> 'regular');
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists notify_email boolean not null default true;
alter table public.profiles add column if not exists notify_push boolean not null default true;
update public.profiles p set email = u.email from auth.users u
  where u.id = p.id and p.email is null and u.email not like '%@clientes.tostoneszenu.app';

-- El registro nunca confía en el rol/estado que mande el navegador.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone, business_name, municipality, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'municipality',
    'mayorista',
    'pendiente'
  );
  return new;
end $$;

alter table public.signup_requests alter column requested_role set default 'mayorista';

-- ---------- Notificaciones dentro de la app ----------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text not null,
  url        text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications (profile_id, created_at desc);
alter table public.notifications enable row level security;
create policy admin_all on public.notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy own_notifications_read on public.notifications for select to authenticated using (profile_id = auth.uid());
create policy own_notifications_update on public.notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------- Colores de categorías (paleta de gráficas validada) ----------
update public.expense_categories set color = '#BF881E' where parent_id is null and name = 'Materia prima';
update public.expense_categories set color = '#AC4430' where parent_id is null and name = 'Insumos';
update public.expense_categories set color = '#5B8DC9' where parent_id is null and name = 'Mano de obra';
update public.expense_categories set color = '#4FA37A' where parent_id is null and name = 'Gastos varios';
insert into public.expense_categories (name, parent_id, is_default)
select n, c.id, true from public.expense_categories c, unnest(array['Ñame', 'Yuca']) n
where c.parent_id is null and c.name = 'Materia prima'
on conflict do nothing;

-- ---------- Seguridad: funciones internas fuera del API público ----------
alter function public.recalc_order_total() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.order_to_income() from public, anon, authenticated;
revoke execute on function public.recalc_order_total() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.current_role_is(public.user_role) from public, anon;
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.my_status() from public, anon;
revoke execute on function public.finance_summary(date, date) from public, anon;
revoke execute on function public.order_cutoff(date) from public, anon;
grant execute on function public.is_admin(), public.my_role(), public.my_status(), public.order_cutoff(date),
  public.current_role_is(public.user_role), public.finance_summary(date, date) to authenticated;
