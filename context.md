# CONTEXT — Tostones Zenú · Sabor Tuchinero

> Documento vivo. Fuente de verdad del proyecto: marca, decisiones, proceso y pendientes.
> **Regla:** cada cambio relevante (decisión, pantalla nueva, dato de negocio) se registra aquí, en la sección *Bitácora*.

---

## 1. El negocio

| Campo | Valor |
|---|---|
| Nombre | **Tostones Zenú** |
| Eslogan | **Sabor Tuchinero** |
| Origen | Tuchín, Córdoba (Colombia) — cuna del sombrero vueltiao y la caña flecha, pueblo Zenú |
| Producto | Tostones de plátano y papas fritas empacadas |
| Modelo | Venta **al por mayor** con pedidos semanales (tiendas, revendedores, clientes regulares) |
| Moneda / zona | COP (sin decimales) · `America/Bogota` |
| Usuarios | Admin (dueño), Cliente regular, Cliente mayorista, Inversionista (solo lectura) |

### Problema que resuelve la app
Hoy los pedidos, la producción y las cuentas se llevan "de cabeza", por WhatsApp o en cuaderno. La app:
1. Deja que cada cliente marque **su pedido de la semana** desde el celular (o diga "esta semana no").
2. Le da al dueño el **consolidado semanal** para planear cuánto producir.
3. Lleva **inventario, producción, ingresos, egresos y ganancia neta**, y reparte automáticamente la parte del **inversionista**.

---

## 2. Branding

### 2.1 Logo
- Archivo original: `docs/brand/logo-original.png` (2016×2118, fondo transparente).
- Copia de trabajo: `public/brand/logo.png`. Íconos PWA derivados en `public/icons/`.
- Elementos: sello circular dorado · sombrero vueltiao (negro/crema, patrón de caña flecha) · rodajas de tostón amarillas · rombos/“pintas” Zenú a los lados · tipografía serif negra gruesa.
- **Uso:** siempre sobre fondo oscuro (tierra/noche) o crema. No deformar, no recolorear, no poner sobre fotos ruidosas. Tamaño mínimo 40 px.

### 2.2 Paleta (extraída del logo)

| Token | Hex | Uso |
|---|---|---|
| `noche` | `#15110C` | Fondo oscuro principal, texto sobre claro |
| `tierra` | `#2A1E13` | Superficies oscuras (cards admin) |
| `cafe` | `#6B4220` | Bordes, detalles, “pintas” Zenú |
| `canela` | `#9A6A35` | Texto secundario sobre claro |
| `oro` | `#D9A93A` | **Color de marca**. Botones primarios, acentos |
| `oro-claro` | `#F0D58C` | Brillos, hover, fondos suaves |
| `toston` | `#F5B82E` | Acento “producto” (cantidades, CTA de pedido) |
| `cana` | `#F4EAD2` | Crema caña flecha: fondo claro principal |
| `cana-2` | `#EADBB6` | Superficie clara secundaria |
| `verde` | `#3F7D4E` | Éxito / ingresos |
| `rojo` | `#B5432F` | Error / egresos |

Contraste: texto `noche` sobre `cana` ≈ 16:1 · `noche` sobre `oro` ≈ 9:1 (los botones dorados llevan texto **oscuro**, nunca blanco).

**Superficies semánticas** (en `globals.css`): las clases `.tema-claro` (cliente/landing) y `.tema-oscuro` (admin/inversor/login) redefinen `fondo, card, card-2, tinta, tinta-2, linea, acento, ok, mal`. Los componentes usan solo esos tokens, así sirven en ambos ambientes.

**Paleta de gráficas** (validada para daltonismo sobre `tierra #211810`, en orden fijo):
`serie-1 #BF881E` (ingresos / materia prima) · `serie-2 #AC4430` (egresos / insumos) · `serie-3 #5B8DC9` (mano de obra) · `serie-4 #4FA37A` (gastos varios). Toda gráfica lleva leyenda, tooltip y vista de tabla.

### 2.3 Tipografía
- **Display:** `Fraunces` (Google Fonts, peso 700–900, eje `SOFT` alto). Serif con carácter artesanal, eco de las letras del sello.
- **Texto / UI:** `Hanken Grotesk` (400–700). Legible en pantallas pequeñas, cálida, no genérica.
- **Números:** `Hanken Grotesk` con `font-variant-numeric: tabular-nums` (montos y cantidades alineados).
- Escala móvil: 12 / 14 / 16 (base) / 20 / 24 / 32 / 44.

### 2.4 Estilo visual — “Caña flecha”
- **Concepto:** la app se siente tejida a mano. El patrón geométrico del vueltiao (rombos, zigzag, franjas negro/crema) es el sistema decorativo: separadores en zigzag, bordes de “trenza”, fondos con rombos muy sutiles.
- **Dos ambientes:**
  - *Cliente / público* → claro y cálido (`cana` + `oro` + `noche`). Mucho aire, botones grandes.
  - *Admin* → oscuro (“noche/tierra”) con datos en `oro`. Densidad controlada, lectura rápida.
- Bordes redondeados 14–22 px, sombras cálidas (no grises), grano/ruido sutil en fondos.
- Iconos: `lucide-react`, trazo 1.75.
- Movimiento: entradas escalonadas suaves, feedback táctil en botones (`active:scale-[.97]`). Respeta `prefers-reduced-motion`.

### 2.5 Voz y tono
Cercano, costeño, claro. Tuteo. Frases cortas.
- ✅ “¿Cuántos paquetes te mandamos esta semana?”
- ✅ “Listo, tu pedido quedó montado.”
- ❌ “Su solicitud ha sido procesada exitosamente.”

---

## 3. Producto (resumen — detalle en `docs/PRD.md`)

### 3.1 Áreas
1. **Público** — landing: qué vendemos, cómo ser cliente/mayorista, formulario de solicitud.
2. **Portal cliente** (`/app`) — pedido de la semana, “esta semana no pido”, historial, perfil, notificaciones.
3. **Admin** (`/admin`) — resumen, pedidos/consolidado, producción, inventario, finanzas (ingresos/egresos), inversionistas, usuarios, programación semanal, ajustes.
4. **Inversionista** (`/inversor`) — solo lectura: ganancia neta y su parte.

### 3.2 Reglas de negocio (supuestos actuales — confirmar ✅/❌)
- Semana = **lunes a domingo**. Pedidos abiertos hasta el **jueves 6:00 p. m.** (configurable). Entrega **sábado**.
- Unidad de venta = **paquete**. Cada producto tiene precio **regular** y precio **mayorista**.
- Un mayorista tiene pedido mínimo (ej. 20 paquetes) — configurable.
- El pedido se vuelve **ingreso** automáticamente cuando el admin lo marca **Entregado/Pagado**.
- Ganancia neta = Ingresos − Egresos del periodo. Parte inversionista = Ganancia neta × % configurado (si la ganancia es negativa, se muestra la pérdida, no se reparte).
- Inventario: `stock = producido − vendido − merma` por producto.

---

## 4. Arquitectura técnica

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSR + rutas por rol + un solo repo |
| Estilos | **Tailwind CSS v4** + tokens CSS | Rápido, consistente con la paleta |
| Backend | **Supabase** (Postgres, Auth, RLS, Storage, Edge Functions) | Auth + DB + seguridad por filas sin servidor propio |
| PWA | Manifest + Service Worker | Instalable en el celular |
| Push | Web Push (VAPID) vía Edge Function + `pg_cron` | Recordatorios semanales y “tu pedido va en camino” |
| Gráficas | SVG propio / Recharts | Dashboard financiero |
| Deploy | Vercel (front) + Supabase (back) | Gratis para empezar |

### Sesión “siempre abierta”
Supabase usa *access token* corto (1 h) + *refresh token* que **no expira** mientras se use; con `persistSession: true` y cookies vía `@supabase/ssr` el usuario no vuelve a loguearse. En el panel de Supabase: *Auth → Sessions* sin límite de tiempo ni inactividad.

### Login propuesto
**Celular + contraseña** (internamente se mapea a un email sintético `57XXXXXXXXXX@clientes.tostoneszenu.app`). Evita costos de SMS/OTP. Alternativa: magic link por email. → *Pendiente confirmar.*

### Estado actual del código
- La app corre con **datos de prueba** deterministas (`src/lib/mock-data.ts`, “hoy” fijo = lun 12 oct 2026) en un estado cliente (`src/lib/store.tsx`) que persiste en `localStorage`. Las acciones del store tienen la misma forma que tendrán las Server Actions de Supabase.
- Cálculos de negocio puros en `src/lib/selectors.ts` (consolidado, inventario, finanzas, reparto) — equivalen a las vistas SQL.
- Tipos de dominio en `src/lib/types.ts` = tablas del SQL en camelCase.
- Esquema SQL listo en `supabase/migrations/0001_init.sql` (enums, tablas, triggers de total e ingreso automático, vistas, RLS, semillas).
- **Next.js 16** con `cacheComponents` + `partialPrefetching`. Ojo: no usar `new Date()`/`Math.random()` en Server Components (rompe el prerender). Leer `node_modules/next/dist/docs/` antes de usar APIs nuevas (ver `AGENTS.md`).
- `experimental.instantInsights.validationLevel = "manual-warning"` en `next.config.ts`: las rutas protegidas se pintan en el cliente mientras la sesión viva en el navegador. **Al migrar a Supabase** (sesión en cookies + `proxy.ts` + Server Components) quitar esa línea.

### Cómo migrar a Supabase (F1)
1. Crear proyecto → SQL Editor → correr `0001_init.sql`.
2. Copiar `.env.example` → `.env.local` con URL y anon key.
3. `npm i @supabase/supabase-js @supabase/ssr`; crear `src/lib/supabase/{client,server}.ts` y `src/proxy.ts` (refresca sesión y redirige por rol).
4. Reemplazar `useStore()` por lecturas en Server Components y mutaciones en Server Actions (misma firma: `saveOrder`, `setOrderStatus`, `addExpense`, …).
5. Crear el usuario admin y asignarle `role = 'admin', status = 'activo'` en `profiles`.

---

## 5. Estructura de carpetas

```
tostoneszenu/
├─ context.md                ← este archivo
├─ docs/
│  └─ PRD.md                 ← requerimientos, flujos y diagramas
├─ docs/brand/logo-original.png
├─ supabase/migrations/      ← esquema de base de datos
├─ public/brand, public/icons, public/sw.js (service worker)
└─ src/
   ├─ app/
   │  ├─ page.tsx            ← landing pública + solicitud
   │  ├─ login/              ← entrada + cuentas de prueba
   │  ├─ app/                ← portal cliente: inicio, pedido, historial, perfil
   │  ├─ admin/              ← resumen, pedidos, programacion, produccion, inventario,
   │  │                         finanzas, inversionistas, usuarios, ajustes
   │  ├─ inversor/           ← vista inversionista (solo lectura)
   │  └─ manifest.ts         ← PWA
   ├─ components/
   │  ├─ brand/              ← Logo, Wordmark, Rombo Zenú, ilustraciones de producto
   │  ├─ ui/                 ← Button, Card, Stepper, Sheet, Stat, Segmented, Toast…
   │  ├─ charts/             ← GroupedBars, HBars, SplitBar (SVG propio)
   │  ├─ admin/ cliente/ pwa/
   │  └─ RoleGate.tsx        ← protección por rol (prototipo)
   └─ lib/                   ← types, mock-data, store, selectors, format, labels, periods, week
```

---

## 6. Proceso de trabajo

1. **Diseño + funcionalidad con datos de prueba** ✅ (2026-10-12)
2. Conectar Supabase (crear proyecto, correr migración, variables `.env.local`). ← *siguiente*
3. Auth real + RLS + roles.
4. PWA + Push.
5. Pruebas con 2–3 clientes reales → ajustes.
6. Deploy en Vercel + dominio.

---

## 7. Pendientes / preguntas para el dueño

- [ ] **Productos y presentaciones**: ¿qué tamaños de paquete (g)? ¿hay más sabores/productos?
- [ ] **Precios** regular y mayorista por producto.
- [ ] **Día de corte y día de entrega** (supuesto: jueves 6 p. m. / sábado).
- [ ] **Pedido mínimo mayorista**.
- [ ] **% del inversionista** (supuesto: 30 %) y si hay más de un inversionista.
- [ ] **Métodos de pago** (efectivo, Nequi, Daviplata, transferencia) y si se fía (cuentas por cobrar).
- [ ] **Login**: ¿celular + contraseña está bien?
- [ ] Número de **WhatsApp** del negocio y redes.
- [ ] **Zonas/municipios** de entrega.
- [ ] Credenciales de **Supabase** (URL + anon key; service role solo para servidor).
- [ ] Dominio deseado (ej. `tostoneszenu.com`).

- [ ] Fotos reales del producto (hoy se usan ilustraciones SVG).

### Pendientes técnicos
- [ ] F1 Supabase: Auth real, capa de datos, `proxy.ts`, quitar `instantInsights manual-warning`.
- [ ] F4 Push: claves VAPID, suscripción en `usePwa.enableNotifications`, Edge Function `send-push`, `pg_cron` jueves 10 a. m., trigger `en_camino`.
- [ ] Subir soportes (fotos de facturas) de gastos a Supabase Storage.
- [ ] Exportar finanzas a Excel/PDF.
- [ ] Ajustes manuales de inventario (tabla `inventory_adjustments` ya existe en SQL; falta UI).
- [ ] Pruebas e2e (Playwright) del flujo de pedido.

---

## 8. Bitácora

| Fecha | Cambio |
|---|---|
| 2026-10-12 | Inicio del proyecto. Análisis del logo, definición de marca (paleta, tipografía, estilo “caña flecha”), arquitectura y PRD. Scaffold Next.js 16 + Tailwind v4. Esquema SQL inicial con RLS. Íconos PWA desde el logo. |
| 2026-10-12 | Prototipo funcional completo con datos de prueba: landing + solicitud, login con cuentas demo, portal cliente (pedido semanal, “esta semana no”, repetir pedido, historial, perfil, notificaciones, instalar app), admin (resumen, consolidado y estados de pedido, programación semanal, producción, inventario, finanzas con ingresos/egresos/categorías, calculadora de inversionista, usuarios/solicitudes, ajustes), vista inversionista. Service worker con caché offline + push. Build de producción OK. |
