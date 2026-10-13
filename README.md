# Tostones Zenú · Sabor Tuchinero

App web (PWA, pensada para el celular) para la venta **al por mayor** de tajadas de plátano y papa de Tuchín, Córdoba:
- **Clientes:** hacen el pedido de la semana desde el celular.
- **Admin:** maneja clientes, pedidos, producción, inventario, finanzas e inversionistas.
- **Avisos:** llegan en la app, al celular (push) y por correo.

**Todo el contexto del proyecto (negocio, marca, base de datos, decisiones, pendientes) está en [`context.md`](context.md).**

## Correr en local

```bash
npm install
cp .env.example .env.local   # y completa los valores
npm run dev
```

## Calidad

```bash
npm test            # pruebas de lógica (vitest)
npm run typecheck   # tipos
npx eslint src      # lint
npx next build      # build de producción
```

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + RLS) · Web Push · Resend · Vercel.
