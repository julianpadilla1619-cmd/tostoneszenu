# CONTEXT — Tostones Zenú · Sabor Tuchinero

> Documento vivo. Es la fuente de verdad del proyecto: negocio, marca, arquitectura, base de datos, decisiones y pendientes.
> **Regla:** todo cambio relevante se anota aquí, en la *Bitácora* (§10).

---

## 0. Si eres otra IA (o persona) retomando el proyecto
1. Lee este archivo completo. Después revisa `supabase/migrations/` en orden (0001 → 0004); la base está explicada en **§5**.
2. El proyecto usa **Next.js 16** con `cacheComponents`. Sus APIs cambiaron: antes de usar una, lee su guía en `node_modules/next/dist/docs/` (ver `AGENTS.md`). Reglas que ya nos costaron errores:
   - Leer la sesión (cookies) **siempre dentro de `<Suspense>`**. `getProfile()` llama `connection()` antes de tocar Supabase.
   - No usar `new Date()` / `Date.now()` en Server Components sin un acceso dinámico previo.
   - Los datos públicos (catálogo) usan `"use cache"` + `cacheTag("catalogo")`. Quien los modifique debe llamar `updateTag(CATALOG_TAG)`.
3. **Seguridad en tres capas, sin excepciones:** `src/proxy.ts` (ruta) → `requirePage()` / `requireAction()` en cada página y Server Action → **RLS** en Postgres. Nunca uses el cliente de service role (`createAdminClient`) sin haber llamado antes `requireAction()`.
4. Respeta la marca (§2) y los componentes de `src/components/ui/ui.tsx`. Textos en español de Colombia, con tuteo y tildes correctas.
5. Antes de entregar corre `npm run typecheck`, `npx eslint src`, `npm test` y `npx next build`, y anota el cambio en la Bitácora.

---

## 1. El negocio

| Campo | Valor |
|---|---|
| Nombre | **Tostones Zenú** · eslogan **Sabor Tuchinero** |
| Origen | Tuchín, Córdoba (Colombia), cuna del sombrero vueltiao y del pueblo Zenú |
| Producto | **Tajadas** de plátano y de papa empacadas (de vez en cuando ñame o yuca). La marca se llama "tostones", pero el producto son tajadas. |
| Modelo | **Solo al por mayor**: tiendas, cafeterías, kioscos y revendedores. **No se vende al detal.** |
| Pedido mínimo | **10 paquetes por pedido** (se pueden combinar productos). Configurable. |
| Entregas | **Martes y jueves** (configurable). Hora límite: **6 p. m. del día anterior** a la entrega. |
| Pago | Contra entrega: efectivo, Nequi, Daviplata o transferencia. Se puede fiar: queda en "Por cobrar". |
| Moneda / zona | COP sin decimales · `America/Bogota` (UTC−5, sin horario de verano) |
| Roles | **Admin** (dueño) · **Cliente mayorista** · **Inversionista** (solo ve sus ganancias). El rol "regular" ya no existe. |

**Qué resuelve:**
- El cliente pide desde el celular: elige cantidades y día de entrega, o marca "esta semana no pido".
- El dueño ve cuánto fritar por producto y por día de entrega.
- La app lleva producción, inventario, ingresos, gastos y ganancia neta, y calcula la parte de cada inversionista.

---

## 2. Marca y diseño

### 2.1 Logo
- **Original:** `docs/brand/logo-original.png` (2016×2118 px).
- **Versiones web:** `public/brand/logo-640.webp` (85 KB) y `logo-256.webp` (27 KB).
- **Íconos PWA:** `public/icons/*.png`, optimizados a 128 colores, unos 170 KB en total.
- **Uso:** siempre sobre fondo oscuro o crema. No deformar ni recolorear. Tamaño mínimo 36 px.

### 2.2 Paleta
| Token | Hex | Uso |
|---|---|---|
| `noche` | `#15110C` | Fondo oscuro, texto sobre claro |
| `tierra` | `#211810` | Superficies del admin |
| `cafe` | `#6B4220` | Detalles, "pintas" Zenú |
| `canela` | `#8A5F30` | Texto secundario decorativo |
| `oro` | `#D9A93A` | **Color de marca**. Botones primarios, siempre con texto oscuro |
| `oro-claro` | `#F0D58C` | Brillos y acentos sobre oscuro |
| `cana` | `#F4EAD2` | Crema caña flecha: fondo claro |

**Superficies semánticas:** las clases `.tema-claro` (público y cliente) y `.tema-oscuro` (admin, login e inversor) redefinen `fondo`, `card`, `card-2`, `tinta`, `tinta-2`, `linea`, `acento`, `ok` y `mal`. Los componentes usan **solo** estos tokens.

**Gráficas:** paleta validada para daltonismo sobre `#211810`: `serie-1 #BF881E` · `serie-2 #AC4430` · `serie-3 #5B8DC9` · `serie-4 #4FA37A`. Toda gráfica lleva leyenda, tooltip y vista de tabla.

### 2.3 Tipografía
- `Fraunces` para títulos (800–900).
- `Hanken Grotesk` para el texto.
- Números con `tabular-nums`.
- Los inputs miden **16 px** para que el iPhone no haga zoom.

### 2.4 Estilo "caña flecha" y reglas UI/UX
- Zigzag del vueltiao como separador (`.trenza`), rombos sutiles de fondo (`.rombos`), grano cálido (`.grano`).
- **Checklist aplicado** (skill UI/UX Pro Max):
  - Áreas táctiles de 44 px o más.
  - Contraste AA.
  - Etiqueta visible en cada campo y errores junto al formulario (`role="alert"`).
  - Botones con estado de carga.
  - Esqueletos mientras carga.
  - Enlace "Saltar al contenido".
  - Íconos Lucide; nunca emojis como íconos.
  - `prefers-reduced-motion`, `touch-action: manipulation` y `min-h-dvh`.
  - Navegación inferior de máximo 5 ítems en celular; barra lateral en computador.
- **Voz:** cercana y costeña, con tuteo. ✅ "¿Cuántos paquetes te mandamos?" ❌ "Su solicitud ha sido procesada".

---

## 3. Producto (pantallas)

| Ruta | Quién | Qué hace |
|---|---|---|
| `/` | Público | Titular editable, productos (los destacados primero) con precio por paquete, cómo funciona, días de entrega, hora límite, zonas, preguntas frecuentes, formulario **"Enviar solicitud"** y botón de WhatsApp |
| `/login` | Todos | Celular (clientes) o correo (admin/inversionista) + contraseña. "Olvidé mi contraseña" por correo |
| `/cambiar-clave` | Con sesión | Nueva contraseña (también llega aquí el enlace de recuperación) |
| `/app` | Cliente | Estado del pedido de la semana, tiempo para la hora límite, "Esta semana no pido" |
| `/app/pedido` | Cliente | Cantidades por producto (+10/+20/+50), día de entrega, nota, "Copiar mi pedido anterior", validación del mínimo |
| `/app/historial` · `/app/perfil` · `/app/avisos` | Cliente | Historial y deuda · correo, dirección, avisos push/correo, instalar app, cambiar clave · bandeja de avisos |
| `/admin` | Admin | Resumen: quién pidió, qué fritar (pendiente por entregar − bodega), por cobrar, ingresos vs. gastos |
| `/admin/pedidos` | Admin | Semana por semana, filtro por día de entrega, cambio de estado individual o por grupo (avisa al cliente), pagos, crear o editar pedidos |
| `/admin/clientes` | Admin | Solicitudes → **crear cuenta** con contraseña temporal (se muestra una sola vez, con botón para enviarla por WhatsApp), editar, nueva contraseña, desactivar o eliminar, equipo/inversionistas |
| `/admin/productos` | Admin | Crear y editar: tipo (plátano, papa, ñame, yuca, otro), peso, precio, costo, destacado, disponible, orden |
| `/admin/produccion` | Admin | Inventario por producto + registro de lotes |
| `/admin/finanzas` | Admin | Periodos, ingresos (automáticos y manuales), gastos con categorías y subcategorías, ganancia neta, margen |
| `/admin/inversionistas` | Admin | Porcentaje, reparto por periodo, registrar pagos |
| `/admin/programacion` | Admin | Semana con horas límite, entregas y tareas |
| `/admin/ajustes` | Admin | Días de entrega, hora límite, mínimo, WhatsApp, correo, titular, zonas, preguntas frecuentes, categorías de gasto |
| `/inversor` | Inversionista | Solo lectura: neta del periodo y su parte (vía RPC, sin detalle de gastos) |

### Reglas de negocio implementadas
- **Semana de pedido:** es la de la próxima entrega cuya hora límite no ha pasado. Ejemplo: lunes 7 p. m. ya cerró el martes, así que queda el jueves; el miércoles 7 p. m. pasa a la semana siguiente (ver `src/lib/time.ts`).
- **Un pedido por cliente por semana**, con un día de entrega elegido. "No pido" es un pedido con `status = no_pide` y sin productos.
- El cliente puede cambiar su pedido hasta la hora límite y mientras esté `confirmado`. Desde `en_produccion` solo lo cambia el admin. El admin puede crear o editar pedidos sin restricción de hora ni de mínimo.
- Los precios se **congelan** al guardar el pedido y los pone el servidor, nunca el navegador.
- Un pedido `entregado` y `pagado` genera **solo** su ingreso (trigger).
- **Inventario** = producido − merma − entregado + ajustes. Lo "por fritar" usa solo pedidos **pendientes por entregar**.
- Al **eliminar** un cliente con ventas, se desactiva en vez de borrarse; los productos con historial se ocultan.

### Notificaciones (3 canales, `src/lib/notify.ts`)
| Evento | A quién | Canal |
|---|---|---|
| Nueva solicitud en la página | Admins | App + push + correo |
| Pedido nuevo o modificado | Admins | App + push + correo |
| En producción / en camino / entregado | Cliente | App + push + correo |
| Admin le monta un pedido | Cliente | App + push + correo |
| **Día antes de cada entrega, 10 a. m.** (Vercel Cron → `/api/cron/recordatorio`) | Clientes sin pedido esa semana | App + push + correo |

- **App:** tabla `notifications` y la campana con contador.
- **Push:** Web Push con llaves VAPID. Cada persona lo activa en su perfil, en cada celular. En iPhone primero hay que instalar la app en la pantalla de inicio.
- **Correo:** [Resend](https://resend.com) vía `RESEND_API_KEY`. Si la variable no existe, no se envían correos y no falla nada. Las cuentas de clientes usan un correo interno (`57XXXXXXXXXX@clientes.tostoneszenu.app`) que nunca recibe correos; el correo real va en `profiles.email`.

---

## 4. Arquitectura

| Capa | Elección |
|---|---|
| App | **Next.js 16** (App Router, Cache Components, Partial Prefetching) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + tokens |
| Datos y Auth | **Supabase** (Postgres + RLS + Auth). La sesión vive en cookies (`@supabase/ssr`), dura 400 días y se refresca en `src/proxy.ts`: "la cuenta queda abierta" |
| Mutaciones | **Server Actions** (`src/app/actions/{auth,public,cliente,admin}.ts`), cada una con `requireAction()` y validación (`src/lib/validate.ts`) |
| Lecturas | Server Components dentro de `<Suspense>` → `src/lib/data.ts` (cliente con sesión, respeta RLS) |
| PWA | `src/app/manifest.ts` + `public/sw.js`, que solo cachea páginas públicas, nunca datos de una cuenta |
| Push / correo / cron | `web-push` + Resend + `vercel.json` (cron 15:00 UTC = 10 a. m. Colombia) |
| Pruebas | `vitest` → `tests/negocio.test.ts` (18 pruebas de fechas, ventanas de pedido, finanzas y validaciones) |
| Deploy | Vercel (front) + Supabase (proyecto `mnsjklwanempdrxahffy`, us-east-2) |

### Variables de entorno (Vercel → Settings → Environment Variables)
| Variable | Obligatoria | Nota |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Públicas |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | **Secreta**, solo servidor |
| `NEXT_PUBLIC_SITE_URL` | Sí | URL de producción (enlaces de correos, recuperación de clave, mensaje de WhatsApp) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Para push | Ya generadas en `.env.local`; copiarlas iguales a Vercel |
| `CRON_SECRET` | Para el recordatorio | Vercel la envía sola al cron |
| `RESEND_API_KEY`, `EMAIL_FROM` | Opcional | Correo. Requiere verificar el dominio en Resend |

### Configuración en Supabase (panel)
- **Auth → URL Configuration:** *Site URL* = URL de Vercel. En *Redirect URLs* agregar `https://<tu-dominio>/auth/confirm` y `http://localhost:3000/auth/confirm`.
- **Auth → Providers → Email:** desactivar *"Allow new users to sign up"*. Las cuentas solo las crea el admin.
- **Auth → Password security:** activar *Leaked password protection* (aviso del Security Advisor).

### ⚠️ Problema de red del computador de desarrollo (2026-10-12)
Los DNS de Windows de este PC son `148.251.75.242` y `79.137.248.21`. Resuelven `*.supabase.co` a `147.45.69.3`, que **no es de Supabase**, con un certificado falso ("localhost", emisor "ospanel"). Por eso el login local no funcionaba. **Hay que revisarlo:** puede ser una VPN o "desbloqueador", o malware que cambió el DNS. Se recomienda poner DNS automáticos o `1.1.1.1` / `8.8.8.8` y pasar un antivirus. En Vercel no ocurre.

---

## 5. Base de datos (Supabase / Postgres)

Migraciones en orden: `0001_init` → `0002_mayoristas_entregas_notificaciones` → `0003_fk_created_by` → `0004_rendimiento_rls`.
**Si cambias el SQL, crea una migración nueva, actualiza esta sección y `src/lib/types.ts`/`mappers.ts`.**

**Convenciones:**
- Tablas en `snake_case`; en TypeScript, `camelCase`.
- Las llaves son `uuid`; `profiles.id` es el mismo `auth.users.id`.
- Dinero en COP como `int`.
- Fechas de negocio como `date` en hora de Colombia.
- Días ISO: 1 = lunes … 7 = domingo.

**Enums:**
- `user_role`: admin · mayorista · inversionista (`regular` existe en el enum pero un CHECK lo prohíbe).
- `user_status`: pendiente · activo · inactivo.
- `order_status`: borrador · confirmado · no_pide · cancelado · en_produccion · en_camino · entregado.
- `payment_method`: efectivo · nequi · daviplata · transferencia · otro.
- `request_status`: nueva · aprobada · rechazada.

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | full_name, phone (único), email, business_name, role, status, address, municipality, notes, notify_email, notify_push | La crea el trigger `on_auth_user_created`, **siempre** como mayorista pendiente: nunca confía en lo que mande el navegador. El admin la activa. |
| `signup_requests` | full_name, business_name, phone, municipality, est_weekly_packs, message, status | El anónimo solo puede insertar. |
| `settings` (fila única) | delivery_weekdays int[] `{2,4}`, cutoff_time `18:00`, wholesale_min_packs `10`, whatsapp, headline, zones, contact_email, reminder_* | La lectura es pública. |
| `products` | name, category (platano/papa/name/yuca/otro), weight_grams, description, **price**, unit_cost, low_stock_threshold, active, featured, sort, image_url | La lectura pública es solo de los activos. |
| `faqs` | question, answer, sort, active | Preguntas frecuentes editables desde Ajustes. |
| `orders` | customer_id, **week_start** (lunes), **delivery_on**, status, paid, payment_method, total, note, created_by | Único por (customer_id, week_start). Valida que la entrega caiga en esa semana. El cliente solo LEE; escribe el servidor. |
| `order_items` | order_id, product_id, qty, unit_price | `total` lo recalcula un trigger. |
| `production_batches` | produced_on, product_id, units_produced, units_waste, notes | |
| `inventory_adjustments` | product_id, qty ±, reason | Falta la pantalla. |
| `expense_categories` / `expenses` | dos niveles / spent_on, category_id, amount, quantity, unit, supplier… | Incluye las subcategorías Ñame y Yuca. |
| `incomes` | received_on, order_id (null = manual), concept, amount | Las filas de pedidos las maneja el trigger. |
| `investors` / `investor_payouts` | name, percentage, profile_id / periodo, amount, paid_on | |
| `notifications` | profile_id, title, body, url, read_at | Cada uno ve y marca solo las suyas. |
| `push_subscriptions` | profile_id, endpoint, subscription | |
| `schedule_tasks` | day, kind, title, done | |

**Triggers y funciones:**
- `recalc_order_total` (SECURITY DEFINER, para que Supabase Auth pueda borrar cuentas).
- `order_to_income`: si el pedido queda entregado y pagado, crea o actualiza el ingreso; si deja de estarlo, lo borra.
- `handle_new_user`.
- `order_cutoff(fecha)`.
- `finance_summary(desde, hasta)`: solo para admin o inversionista.
- Helpers de RLS: `is_admin`, `current_role_is`, `my_role`, `my_status`.

**Vistas:**
- `v_weekly_consolidated`: por semana, día y producto.
- `v_inventory`.
- `v_finance_daily`.

**RLS, verificado con pruebas el 2026-10-12:**
- **Cliente:** ve 1 perfil (el suyo) y solo sus pedidos. Ve 0 gastos, 0 ingresos, 0 solicitudes y 0 avisos ajenos. No puede modificar pedidos, precios ni su propio rol: el intento de hacerse admin fue rechazado por la política.
- **Anónimo:** ve solo productos activos y preguntas frecuentes.

**Security Advisor:**
- De 18 advertencias quedan 6.
- 5 son los helpers que RLS necesita: solo devuelven datos de quien consulta, y `finance_summary` valida el rol por dentro.
- La sexta es *Leaked password protection*, que se activa en el panel.
- Las advertencias de rendimiento por "múltiples políticas permisivas" se aceptan a esta escala.

---

## 6. Estructura de carpetas

```
src/
├─ proxy.ts                    ← sesión + protección por rol
├─ app/
│  ├─ page.tsx                 ← landing (catálogo cacheado)
│  ├─ login/ cambiar-clave/ auth/confirm/ (recuperación)
│  ├─ app/                     ← cliente: inicio, pedido, historial, perfil, avisos
│  ├─ admin/                   ← resumen, pedidos, clientes, finanzas, produccion,
│  │                              productos, programacion, inversionistas, ajustes, avisos
│  ├─ inversor/
│  ├─ api/cron/recordatorio/   ← Vercel Cron
│  └─ actions/                 ← Server Actions: auth, public, cliente, admin
├─ components/ (ui, brand, charts, admin, cliente, shared, auth, pwa)
└─ lib/
   ├─ auth.ts (getProfile, requirePage, requireAction)  data.ts (consultas)
   ├─ notify.ts (app + push + correo)  validate.ts  action.ts (manejo de errores)
   ├─ time.ts (hora Colombia, ventanas de pedido)  selectors.ts (cálculos puros)
   └─ supabase/ (server, admin, public)
tests/negocio.test.ts           supabase/migrations/0001…0004
```

---

## 7. Proceso

1. Diseño y prototipo con datos de prueba ✅
2. Supabase conectado, con auth real, RLS y roles ✅
3. Modelo **solo mayoristas**, entregas configurables, catálogo editable, notificaciones ✅
4. Pruebas de punta a punta contra Supabase ✅ (2026-10-12)
5. **Siguiente:** desplegar en Vercel con las variables completas, configurar Auth en Supabase y hacer un piloto con 2–3 clientes reales.
6. Después: fotos reales, dominio, correo con Resend.

---

## 8. Pendientes

### Para el dueño
- [ ] Confirmar que los **martes y jueves** son los días de entrega. Antigravity puso "del SENA": ¿entregan en el SENA? Si es así, se agrega en "Zonas" desde Ajustes.
- [ ] Revisar **precios, pesos y costos** de los 3 productos en Admin → Productos.
- [ ] Poner el **WhatsApp del negocio** en Ajustes (hoy está vacío y el botón no aparece).
- [ ] **Revisar los DNS del computador** (§4).
- [ ] En Vercel: agregar las variables nuevas (§4) y `NEXT_PUBLIC_SITE_URL`.
- [ ] En Supabase: *Site URL*, *Redirect URLs*, desactivar el registro público y activar *Leaked password protection*.
- [ ] Opcional: cuenta en Resend y dominio, para los correos.
- [ ] Fotos reales de los productos (hoy son ilustraciones SVG).

### Técnicos
- [ ] Subir fotos de productos (columna `image_url`) y soportes de gastos a Supabase Storage.
- [ ] Pantalla de ajustes manuales de inventario.
- [ ] Exportar finanzas a Excel.
- [ ] Pruebas E2E automatizadas (Playwright) del flujo de pedido. Hoy se prueban a mano y con `vitest`.
- [ ] Varios pedidos por semana (uno por cada día de entrega), si el negocio lo necesita.

---

## 9. Cómo correr y probar
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 18 pruebas de lógica
npm run typecheck
npx next build
```

---

## 10. Bitácora

| Fecha | Cambio |
|---|---|
| 2026-10-12 | Inicio: marca (paleta, tipografía, estilo "caña flecha"), PRD, scaffold Next.js 16 + Tailwind v4, esquema SQL, íconos PWA. |
| 2026-10-12 | Prototipo completo con datos de prueba (cliente, admin, inversionista). |
| 2026-10-12 | (Antigravity) Supabase conectado, clientes Supabase, `proxy.ts`, admin creado, pivote a mayoristas, CRUD de productos y ajustes. |
| 2026-10-12 | **Revisión y reconstrucción con Claude.**<br>**Seguridad:**<br>• Las acciones de admin de Antigravity usaban la llave maestra sin verificar el rol. Reescritas todas con `requireAction` + validación.<br>• `handle_new_user` ya no confía en el rol que mande el navegador.<br>• Funciones internas fuera del API público.<br>• El service worker ya no cachea datos de cuentas.<br>**Datos:**<br>• Migraciones 0002–0004: solo mayoristas, mínimo 10, `products.price` / `category` / `featured` / `weight_grams` coherentes.<br>• `settings.delivery_weekdays`, tabla `faqs`, `notifications`, `orders.week_start` + `delivery_on` (adiós `weeks`).<br>• FK `created_by` con `set null`, trigger de total como SECURITY DEFINER, índices y `(select auth.uid())` en RLS.<br>**App:**<br>• Todas las pantallas conectadas a Supabase (se eliminó el estado simulado en el navegador).<br>• Admin crea cuentas con contraseña temporal + WhatsApp.<br>• Pedido con día de entrega y hora límite.<br>• Notificaciones por app, push y correo, más cron de recordatorio.<br>• Login con celular o correo + recuperación de contraseña.<br>**Rendimiento:** imágenes a WebP (logo de 839 KB a 85 KB).<br>**Pruebas:**<br>• 18 de lógica (`vitest`).<br>• De punta a punta: solicitud → crear cuenta → login del cliente → pedido (mínimo validado) → producción → en camino → entregado → pago → ingreso automático + avisos.<br>• Pruebas de RLS.<br>• Corregidos 4 errores encontrados en las pruebas: ciclo de redirección en `proxy`, doble conteo de lo entregado en producción, borrado de cuentas bloqueado y fecha UTC en solicitudes.<br>**Login:** la causa de que no funcionara fue que lo publicado era el prototipo sin Supabase y que el DNS del PC desvía Supabase. |
