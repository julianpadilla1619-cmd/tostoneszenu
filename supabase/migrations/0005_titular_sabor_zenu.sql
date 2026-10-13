-- 0005 — Titular de la página principal (pedido del dueño). Se puede cambiar desde Admin → Ajustes.
update public.settings set headline = 'El sabor original del Zenú.';
alter table public.settings alter column headline set default 'El sabor original del Zenú.';
