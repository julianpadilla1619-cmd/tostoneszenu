# Tostones Zenú · Sabor Tuchinero

PWA *mobile-first* para pedidos semanales al por mayor, producción, inventario y contabilidad de Tostones Zenú (Tuchín, Córdoba).

- **Contexto del proyecto (marca, decisiones, pendientes):** [`context.md`](context.md)
- **Requerimientos y diagramas (PRD):** [`docs/PRD.md`](docs/PRD.md)
- **Esquema de base de datos (Supabase):** [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)

## Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. En `/login` hay **cuentas de prueba** (mayorista, regular, admin, inversionista).
El prototipo usa datos de prueba guardados en el navegador; se reinician desde *Perfil* o *Ajustes*.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + RLS) · PWA + Web Push.

## Rutas

| Ruta | Quién | Qué |
|---|---|---|
| `/` | Público | Landing, cómo ser cliente, solicitud |
| `/login` | Todos | Entrada (celular + contraseña) |
| `/app` | Clientes | Pedido de la semana, historial, perfil |
| `/admin` | Admin | Resumen, pedidos, programación, producción, inventario, finanzas, inversionistas, usuarios, ajustes |
| `/inversor` | Inversionista | Ganancia neta y su parte (solo lectura) |
