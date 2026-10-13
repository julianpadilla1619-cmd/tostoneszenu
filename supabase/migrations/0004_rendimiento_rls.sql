-- 0004 — Rendimiento (recomendaciones del Performance Advisor de Supabase).

-- Índices para llaves foráneas
create index if not exists expenses_category_idx on public.expenses (category_id);
create index if not exists inventory_adjustments_product_idx on public.inventory_adjustments (product_id);
create index if not exists investor_payouts_investor_idx on public.investor_payouts (investor_id);
create index if not exists order_items_product_idx on public.order_items (product_id);
create index if not exists orders_created_by_idx on public.orders (created_by);
create index if not exists production_batches_product_idx on public.production_batches (product_id);
create index if not exists push_subscriptions_profile_idx on public.push_subscriptions (profile_id);

-- auth.uid() evaluado una sola vez por consulta: (select auth.uid())
alter policy own_profile_read on public.profiles using (id = (select auth.uid()));
alter policy own_profile_update on public.profiles using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = public.my_role() and status = public.my_status());
alter policy own_orders_read on public.orders using (customer_id = (select auth.uid()));
alter policy own_items_read on public.order_items
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid())));
alter policy own_push on public.push_subscriptions using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
alter policy investor_self on public.investors using (profile_id = (select auth.uid()));
alter policy investor_payouts_self on public.investor_payouts
  using (exists (select 1 from public.investors i where i.id = investor_id and i.profile_id = (select auth.uid())));
alter policy own_notifications_read on public.notifications using (profile_id = (select auth.uid()));
alter policy own_notifications_update on public.notifications using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
