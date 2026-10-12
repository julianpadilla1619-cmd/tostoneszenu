-- =============================================================
-- Tostones Zenú — esquema inicial
-- Montos en COP enteros (sin decimales). Zona: America/Bogota.
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type user_role    as enum ('admin', 'mayorista', 'regular', 'inversionista');
create type user_status  as enum ('pendiente', 'activo', 'inactivo');
create type order_status as enum ('borrador', 'confirmado', 'no_pide', 'cancelado', 'en_produccion', 'en_camino', 'entregado');
create type payment_method as enum ('efectivo', 'nequi', 'daviplata', 'transferencia', 'otro');
create type request_status as enum ('nueva', 'aprobada', 'rechazada');

-- ---------- Perfiles ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text unique,
  business_name text,
  role          user_role   not null default 'regular',
  status        user_status not null default 'pendiente',
  address       text,
  municipality  text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Helpers de rol (security definer para usarlos en RLS sin recursión)
create or replace function public.current_role_is(r user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r and status = 'activo');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_is('admin');
$$;

-- Rol/estado actuales (evita recursión de RLS al impedir que un usuario se cambie el rol)
create or replace function public.my_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;
create or replace function public.my_status()
returns user_status language sql stable security definer set search_path = public as $$
  select status from profiles where id = auth.uid();
$$;

-- Crea el perfil al registrarse (datos desde raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone, business_name, municipality, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Sin nombre'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'municipality',
    case when new.raw_user_meta_data->>'requested_role' = 'mayorista' then 'mayorista'::user_role else 'regular'::user_role end
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Solicitudes desde la landing (sin cuenta) ----------
create table public.signup_requests (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  phone            text not null,
  municipality     text,
  business_name    text,
  requested_role   user_role not null default 'regular' check (requested_role in ('regular','mayorista')),
  est_weekly_packs int check (est_weekly_packs >= 0),
  message          text,
  status           request_status not null default 'nueva',
  created_at       timestamptz not null default now()
);

-- ---------- Configuración del negocio (fila única) ----------
create table public.settings (
  id                    boolean primary key default true check (id),
  cutoff_weekday        int  not null default 4 check (cutoff_weekday between 1 and 7), -- 1=lun … 7=dom
  cutoff_time           time not null default '18:00',
  delivery_weekday      int  not null default 6 check (delivery_weekday between 1 and 7),
  wholesale_min_packs   int  not null default 20,
  reminder_weekday      int  not null default 4,
  reminder_time         time not null default '10:00',
  whatsapp              text
);
insert into public.settings default values;

-- ---------- Productos ----------
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  presentation        text not null,            -- ej. "Paquete 150 g"
  price_regular       int  not null check (price_regular >= 0),
  price_wholesale     int  not null check (price_wholesale >= 0),
  unit_cost           int  not null default 0,  -- costo estimado por paquete
  low_stock_threshold int  not null default 20,
  active              boolean not null default true,
  sort                int  not null default 0,
  created_at          timestamptz not null default now()
);

-- ---------- Semanas ----------
create table public.weeks (
  id          uuid primary key default gen_random_uuid(),
  starts_on   date not null unique check (extract(isodow from starts_on) = 1), -- lunes
  cutoff_at   timestamptz not null,
  delivery_on date not null,
  closed      boolean not null default false
);

-- ---------- Pedidos ----------
create table public.orders (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  week_id     uuid not null references public.weeks(id) on delete restrict,
  status      order_status not null default 'borrador',
  paid        boolean not null default false,
  payment_method payment_method,
  total       int not null default 0,
  note        text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (customer_id, week_id)
);
create index on public.orders (week_id, status);

create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty        int  not null check (qty > 0),
  unit_price int  not null check (unit_price >= 0),
  unique (order_id, product_id)
);

-- Recalcula total del pedido
create or replace function public.recalc_order_total()
returns trigger language plpgsql as $$
declare oid uuid := coalesce(new.order_id, old.order_id);
begin
  update orders set total = coalesce((select sum(qty * unit_price) from order_items where order_id = oid), 0),
                    updated_at = now()
  where id = oid;
  return null;
end $$;
create trigger order_items_total after insert or update or delete on public.order_items
  for each row execute function public.recalc_order_total();

-- ---------- Producción ----------
create table public.production_batches (
  id             uuid primary key default gen_random_uuid(),
  produced_on    date not null default current_date,
  product_id     uuid not null references public.products(id),
  units_produced int  not null check (units_produced >= 0),
  units_waste    int  not null default 0 check (units_waste >= 0),
  notes          text,
  created_at     timestamptz not null default now()
);

-- Ajustes manuales de inventario (conteos, muestras, regalos)
create table public.inventory_adjustments (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id),
  qty         int  not null,          -- + entra / − sale
  reason      text not null,
  created_at  timestamptz not null default now()
);

-- ---------- Finanzas ----------
create table public.expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  parent_id  uuid references public.expense_categories(id) on delete cascade,
  is_default boolean not null default false,
  color      text,
  unique (parent_id, name)
);

create table public.expenses (
  id             uuid primary key default gen_random_uuid(),
  spent_on       date not null default current_date,
  category_id    uuid not null references public.expense_categories(id),
  description    text,
  quantity       numeric(12,2),
  unit           text,                -- kg, racimo, galón, cilindro, día…
  amount         int not null check (amount > 0),
  payment_method payment_method not null default 'efectivo',
  supplier       text,
  receipt_url    text,
  created_at     timestamptz not null default now()
);
create index on public.expenses (spent_on);

create table public.incomes (
  id             uuid primary key default gen_random_uuid(),
  received_on    date not null default current_date,
  order_id       uuid unique references public.orders(id) on delete set null, -- null = manual
  concept        text not null,
  amount         int not null check (amount > 0),
  payment_method payment_method not null default 'efectivo',
  created_at     timestamptz not null default now()
);
create index on public.incomes (received_on);

-- Ingreso automático al marcar pedido entregado + pagado
create or replace function public.order_to_income()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'entregado' and new.paid and not exists (select 1 from incomes where order_id = new.id) then
    insert into incomes (received_on, order_id, concept, amount, payment_method)
    values ((now() at time zone 'America/Bogota')::date, new.id, 'Pedido semanal', new.total, coalesce(new.payment_method, 'efectivo'));
  elsif (new.status <> 'entregado' or not new.paid) then
    delete from incomes where order_id = new.id;
  end if;
  return new;
end $$;
create trigger orders_income after update of status, paid, total on public.orders
  for each row execute function public.order_to_income();

-- ---------- Inversionistas ----------
create table public.investors (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references public.profiles(id) on delete set null,
  name        text not null,
  percentage  numeric(5,2) not null check (percentage > 0 and percentage <= 100),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.investor_payouts (
  id           uuid primary key default gen_random_uuid(),
  investor_id  uuid not null references public.investors(id) on delete cascade,
  period_start date not null,
  period_end   date not null check (period_end >= period_start),
  amount       int not null check (amount >= 0),
  paid_on      date,
  notes        text
);

-- ---------- Push ----------
create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null unique,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

-- ---------- Programación semanal ----------
create table public.schedule_tasks (
  id        uuid primary key default gen_random_uuid(),
  day       date not null,
  kind      text not null check (kind in ('compra','produccion','empaque','entrega','pago','otro')),
  title     text not null,
  done      boolean not null default false
);

-- =============================================================
-- Vistas
-- =============================================================
create or replace view public.v_weekly_consolidated with (security_invoker = true) as
select o.week_id, oi.product_id, p.name as product_name,
       sum(oi.qty)::int as total_qty,
       sum(oi.qty * oi.unit_price)::int as total_value,
       count(distinct o.id)::int as orders
from orders o
join order_items oi on oi.order_id = o.id
join products p on p.id = oi.product_id
where o.status not in ('cancelado','no_pide','borrador')
group by o.week_id, oi.product_id, p.name;

create or replace view public.v_inventory with (security_invoker = true) as
select p.id as product_id, p.name, p.low_stock_threshold,
  coalesce((select sum(units_produced) from production_batches b where b.product_id = p.id), 0)::int as produced,
  coalesce((select sum(units_waste)    from production_batches b where b.product_id = p.id), 0)::int as waste,
  coalesce((select sum(oi.qty) from order_items oi join orders o on o.id = oi.order_id
            where oi.product_id = p.id and o.status = 'entregado'), 0)::int as sold,
  coalesce((select sum(qty) from inventory_adjustments a where a.product_id = p.id), 0)::int as adjustments
from products p;

create or replace view public.v_finance_daily with (security_invoker = true) as
select d::date as day,
  coalesce((select sum(amount) from incomes  where received_on = d::date), 0)::int as income,
  coalesce((select sum(amount) from expenses where spent_on    = d::date), 0)::int as expense
from generate_series((select least(min(received_on), min(spent_on)) from incomes, expenses), current_date, interval '1 day') d;

-- =============================================================
-- RLS
-- =============================================================
alter table public.profiles            enable row level security;
alter table public.signup_requests     enable row level security;
alter table public.settings            enable row level security;
alter table public.products            enable row level security;
alter table public.weeks               enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.production_batches  enable row level security;
alter table public.inventory_adjustments enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.expenses            enable row level security;
alter table public.incomes             enable row level security;
alter table public.investors           enable row level security;
alter table public.investor_payouts    enable row level security;
alter table public.push_subscriptions  enable row level security;
alter table public.schedule_tasks      enable row level security;

-- Admin: todo
do $$ declare t text; begin
  foreach t in array array['profiles','signup_requests','settings','products','weeks','orders','order_items',
    'production_batches','inventory_adjustments','expense_categories','expenses','incomes','investors',
    'investor_payouts','push_subscriptions','schedule_tasks'] loop
    execute format('create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Perfil propio
create policy own_profile_read   on public.profiles for select to authenticated using (id = auth.uid());
create policy own_profile_update on public.profiles for update to authenticated using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role() and status = public.my_status());

-- Solicitudes: cualquiera (anónimo) puede crear
create policy anyone_insert_request on public.signup_requests for insert to anon, authenticated with check (status = 'nueva');

-- Catálogo y semanas: lectura para usuarios autenticados
create policy read_settings on public.settings for select to authenticated using (true);
create policy read_products on public.products for select to authenticated using (active);
create policy read_weeks    on public.weeks    for select to authenticated using (true);

-- Pedidos: el cliente activo ve y gestiona los suyos antes del corte
create policy own_orders_read on public.orders for select to authenticated using (customer_id = auth.uid());
create policy own_orders_write on public.orders for insert to authenticated
  with check (customer_id = auth.uid() and status in ('borrador','confirmado','no_pide')
              and exists (select 1 from weeks w where w.id = week_id and now() < w.cutoff_at and not w.closed));
create policy own_orders_update on public.orders for update to authenticated
  using (customer_id = auth.uid() and status in ('borrador','confirmado','no_pide','cancelado')
         and exists (select 1 from weeks w where w.id = week_id and now() < w.cutoff_at and not w.closed))
  with check (customer_id = auth.uid() and status in ('borrador','confirmado','no_pide','cancelado') and paid = false);

create policy own_items_read on public.order_items for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
-- Los ítems se escriben vía Server Action (service role) para aplicar el precio del rol en servidor.

-- Push propio
create policy own_push on public.push_subscriptions for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Inversionista: su registro y sus pagos (las cifras agregadas se sirven por RPC)
create policy investor_self on public.investors for select to authenticated using (profile_id = auth.uid());
create policy investor_payouts_self on public.investor_payouts for select to authenticated
  using (exists (select 1 from investors i where i.id = investor_id and i.profile_id = auth.uid()));

-- Resumen financiero para inversionista (solo totales, nunca detalle)
create or replace function public.finance_summary(p_from date, p_to date)
returns table (income int, expense int, net int) language sql stable security definer set search_path = public as $$
  select i.s, e.s, i.s - e.s from
    (select coalesce(sum(amount),0)::int s from incomes  where received_on between p_from and p_to) i,
    (select coalesce(sum(amount),0)::int s from expenses where spent_on    between p_from and p_to) e
  where public.is_admin() or public.current_role_is('inversionista');
$$;

-- =============================================================
-- Datos semilla
-- =============================================================
insert into public.products (name, presentation, price_regular, price_wholesale, unit_cost, sort) values
  ('Tostones de plátano', 'Paquete 150 g', 3500, 2800, 1500, 1),
  ('Papas fritas',        'Paquete 120 g', 3000, 2400, 1300, 2);

with mp as (insert into public.expense_categories (name, is_default, color) values ('Materia prima', true, '#D9A93A') returning id),
     ins as (insert into public.expense_categories (name, is_default, color) values ('Insumos', true, '#9A6A35') returning id),
     mo as (insert into public.expense_categories (name, is_default, color) values ('Mano de obra', true, '#6B4220') returning id),
     gv as (insert into public.expense_categories (name, is_default, color) values ('Gastos varios', true, '#3F7D4E') returning id)
insert into public.expense_categories (name, parent_id, is_default)
select n, mp.id, true from mp, unnest(array['Plátano','Papa']) n
union all select n, ins.id, true from ins, unnest(array['Aceite','Gas','Empaques','Sal','Saborizantes']) n
union all select n, mo.id, true from mo, unnest(array['Pago a trabajadores']) n
union all select n, gv.id, true from gv, unnest(array['Transporte','Servicios','Otros']) n;
