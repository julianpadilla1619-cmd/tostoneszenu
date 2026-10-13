-- 0003 — Permite eliminar cuentas que crearon pedidos (antes lo bloqueaba la FK).
-- Detectado en las pruebas de punta a punta: "Database error deleting user".
alter table public.orders drop constraint orders_created_by_fkey;
alter table public.orders add constraint orders_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- El borrado de cuentas lo hace Supabase Auth con su propio rol; el trigger que
-- recalcula totales debe correr con permisos del dueño para no bloquear el borrado.
create or replace function public.recalc_order_total()
returns trigger language plpgsql security definer set search_path = public as $$
declare oid uuid := coalesce(new.order_id, old.order_id);
begin
  update orders set total = coalesce((select sum(qty * unit_price) from order_items where order_id = oid), 0),
                    updated_at = now()
  where id = oid;
  return null;
end $$;
revoke execute on function public.recalc_order_total() from public, anon, authenticated;
