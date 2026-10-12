# PRD — Tostones Zenú (App de pedidos, producción y contabilidad)

> Versión 0.1 · 2026-10-12 · Estado: **Diseño + prototipo funcional con datos de prueba**
> Marca, decisiones y pendientes viven en [`../context.md`](../context.md).

---

## 1. Resumen

PWA *mobile-first* para que los clientes (regulares y mayoristas) de Tostones Zenú hagan su **pedido semanal** desde el celular, y para que el dueño administre **pedidos, producción, inventario, finanzas y el reparto de ganancias con inversionistas** desde un solo panel.

### Objetivos
| # | Objetivo | Métrica de éxito |
|---|---|---|
| O1 | Que el 80 % de los clientes pida por la app (no por WhatsApp) | % pedidos creados en app / semana |
| O2 | Saber el lunes cuánto producir en la semana | Consolidado disponible al cierre del corte |
| O3 | Conocer la ganancia neta real cada semana/mes | Dashboard financiero sin hojas de cálculo |
| O4 | Transparencia con el inversionista | Vista de solo lectura con su parte calculada |

### Fuera de alcance (v1)
Pagos en línea, facturación electrónica DIAN, ruteo de domicilios con mapa, multi-sucursal.

---

## 2. Roles y permisos

| Capacidad | Admin | Mayorista | Regular | Inversionista |
|---|:-:|:-:|:-:|:-:|
| Ver landing / solicitar cuenta | ✓ | ✓ | ✓ | ✓ |
| Hacer / editar pedido semanal (antes del corte) | ✓ | ✓ | ✓ | — |
| “Esta semana no pido” | — | ✓ | ✓ | — |
| Ver historial propio | — | ✓ | ✓ | — |
| Precio mayorista | — | ✓ | — | — |
| Aprobar / editar / eliminar usuarios | ✓ | — | — | — |
| Consolidado semanal / estados de pedido | ✓ | — | — | — |
| Producción e inventario | ✓ | — | — | — |
| Ingresos / egresos / categorías | ✓ | — | — | — |
| Configurar % inversionista | ✓ | — | — | — |
| Ver ganancia neta y su parte | ✓ | — | — | ✓ (solo lectura) |

```mermaid
flowchart LR
  V[Visitante] -->|Solicita cuenta| P[Usuario pendiente]
  P -->|Admin aprueba + asigna rol| R{Rol}
  R --> A[Admin]
  R --> M[Cliente mayorista]
  R --> C[Cliente regular]
  R --> I[Inversionista]
  M & C --> APP[/Portal /app/]
  A --> ADM[/Panel /admin/]
  I --> INV[/Vista /inversor/]
```

---

## 3. Mapa de pantallas

```mermaid
flowchart TB
  subgraph Público
    L[/ Landing/] --> SOL[/Formulario: quiero ser cliente/]
    L --> LOGIN[/login/]
  end
  subgraph Cliente["Portal cliente (móvil)"]
    H[/app · Inicio + pedido semana/] --> PED[/app/pedido/]
    H --> HIS[/app/historial/]
    H --> PER[/app/perfil · notificaciones/]
  end
  subgraph Admin["Panel admin"]
    D[/admin · Resumen/] --> AP[/admin/pedidos · consolidado/]
    D --> PR[/admin/produccion/]
    D --> IN[/admin/inventario/]
    D --> FI[/admin/finanzas · ingresos y egresos/]
    D --> IV[/admin/inversionistas/]
    D --> US[/admin/usuarios/]
    D --> AG[/admin/programacion · semana/]
    D --> AJ[/admin/ajustes/]
  end
  subgraph Inversor
    IR[/inversor · ganancias/]
  end
  LOGIN --> H & D & IR
```

---

## 4. Requerimientos funcionales

### 4.1 Autenticación y sesión
- **RF-01** Login con celular + contraseña (email sintético en Supabase Auth). *(pendiente confirmar)*
- **RF-02** Sesión persistente: el usuario no vuelve a loguearse salvo que cierre sesión (refresh token sin vencimiento).
- **RF-03** Al loguear, redirección por rol: admin → `/admin`, cliente → `/app`, inversionista → `/inversor`.
- **RF-04** Usuario recién registrado queda `pendiente` hasta que el admin lo apruebe.

### 4.2 Landing pública
- **RF-05** Secciones: héroe con logo, productos, “Cómo ser cliente” (3 pasos), beneficios mayorista, preguntas frecuentes, formulario de solicitud, botón de WhatsApp.
- **RF-06** Formulario: nombre, celular, municipio, tipo (regular/mayorista), nombre del negocio (opcional), paquetes estimados por semana. Crea una `solicitud` para revisión del admin.

### 4.3 Portal cliente
- **RF-07** Inicio muestra: semana actual, cuenta regresiva al corte, estado del pedido (sin pedido / borrador / confirmado / no pide / en camino / entregado).
- **RF-08** Pedido: selector de cantidad por producto (+/−, botones ≥ 48 px), total en vivo con precio según rol, nota opcional, botón “Confirmar pedido”.
- **RF-09** “Esta semana no pido” en un toque (con deshacer).
- **RF-10** Editar/cancelar pedido hasta el corte; después queda bloqueado.
- **RF-11** Mayorista: validar pedido mínimo.
- **RF-12** Opción “Repetir pedido de la semana pasada”.
- **RF-13** Historial de pedidos con estado y total.
- **RF-14** Perfil: datos, dirección de entrega, activar notificaciones, instalar app.

### 4.4 Notificaciones (PWA)
- **RF-15** Instalable (manifest, íconos, service worker, modo `standalone`).
- **RF-16** Push “Recuerda tu pedido” el día de corte (ej. jueves 10 a. m.) a quien no ha pedido ni marcado “no pido”.
- **RF-17** Push “Tu pedido va en camino” al cambiar estado a `en_camino`.

### 4.5 Admin — Pedidos y programación
- **RF-18** Consolidado semanal: total por producto, número de clientes que pidieron / no pidieron / no respondieron, valor total.
- **RF-19** Lista de pedidos con filtros por estado y tipo de cliente; cambiar estado (confirmado → en producción → en camino → entregado; pagado sí/no).
- **RF-20** Programación semanal: tablero por día (producción, empaque, entrega) con lo que toca cada día.
- **RF-21** Crear pedido manual en nombre de un cliente (ej. cliente que llamó).

### 4.6 Admin — Producción e inventario
- **RF-22** Registrar lote de producción: fecha, producto, unidades producidas, merma, materia prima usada (opcional).
- **RF-23** Inventario por producto: producido, vendido (entregado), merma, stock actual; alerta de stock bajo.
- **RF-24** Comparativo semanal: pedido vs. producido vs. vendido.

### 4.7 Admin — Finanzas
- **RF-25** Ingresos automáticos al marcar pedido como entregado/pagado + ingresos manuales (concepto, monto, fecha, método).
- **RF-26** Egresos con categorías predefinidas y personalizables:
  - Materia prima (plátano, papa)
  - Insumos (aceite, gas, empaques, sal, saborizantes)
  - Mano de obra (pago a trabajadores)
  - Gastos varios (transporte, servicios, otros)
- **RF-27** Cada egreso: fecha, categoría, subcategoría, descripción, cantidad + unidad (opcional), monto, método de pago, proveedor (opcional), soporte (foto, opcional).
- **RF-28** Dashboard: ingresos, egresos, ganancia neta y margen por periodo (semana / mes / rango); gráfica de barras ingresos vs. egresos; gastos por categoría.
- **RF-29** Cuentas por cobrar: pedidos entregados sin pagar.

### 4.8 Inversionistas
- **RF-30** Admin configura uno o varios inversionistas con su %.
- **RF-31** Calculadora: `Ganancia neta × %` = parte inversionista; resto = negocio/dueño. Si la ganancia es ≤ 0 no hay reparto.
- **RF-32** Registro de pagos hechos al inversionista y saldo pendiente.
- **RF-33** Vista `/inversor` de solo lectura con su periodo, ganancia neta, su parte y pagos recibidos.

### 4.9 Usuarios
- **RF-34** Bandeja de solicitudes: aprobar (asignar rol) / rechazar.
- **RF-35** Lista de usuarios: editar rol, precio especial, desactivar, eliminar.

---

## 5. Requerimientos no funcionales
- **Mobile-first**: diseñado para 360–430 px; touch targets ≥ 44 px; sin scroll horizontal.
- **Rendimiento**: LCP < 2.5 s en 4G; imágenes optimizadas (`next/image`).
- **Accesibilidad**: contraste AA, etiquetas en formularios, foco visible, `prefers-reduced-motion`.
- **Seguridad**: RLS en todas las tablas; el cliente solo ve sus pedidos; service role solo en servidor; validación en servidor (Server Actions); cabeceras de seguridad.
- **Offline básico**: la app abre sin red y muestra el último estado conocido.
- **Idioma**: español (Colombia), formato `$ 1.234.567`, fechas `lun 12 oct`.

---

## 6. Flujos clave

### 6.1 Pedido semanal del cliente
```mermaid
sequenceDiagram
  autonumber
  participant C as Cliente (PWA)
  participant S as Next.js (Server Actions)
  participant DB as Supabase
  participant P as Push (Edge Fn)
  P-->>C: Jueves 10am "¿Cuántos te mandamos esta semana?"
  C->>S: Abre /app (sesión persistente)
  S->>DB: semana actual + pedido del cliente
  DB-->>S: estado (sin pedido)
  C->>S: Confirmar pedido (cantidades)
  S->>S: Validar corte, mínimo mayorista, precios del rol
  S->>DB: upsert pedido + items (estado=confirmado)
  DB-->>C: OK → "Listo, tu pedido quedó montado"
  Note over C,DB: Alternativa: "Esta semana no pido" → estado=no_pide
```

### 6.2 Ciclo de vida del pedido
```mermaid
stateDiagram-v2
  [*] --> borrador
  borrador --> confirmado: cliente confirma
  [*] --> no_pide: "esta semana no"
  no_pide --> confirmado: cambia de opinión (antes del corte)
  confirmado --> cancelado: cliente/admin cancela
  confirmado --> en_produccion: cierre de corte
  en_produccion --> en_camino: despacho (push al cliente)
  en_camino --> entregado
  entregado --> [*]
  note right of entregado: Genera ingreso.\nSi no está pagado → cuentas por cobrar
```

### 6.3 Semana de operación
```mermaid
gantt
  dateFormat YYYY-MM-DD
  title Semana tipo (lun–dom)
  section Clientes
  Pedidos abiertos        :a1, 2026-10-12, 4d
  Corte jueves 6pm        :milestone, 2026-10-15, 0d
  section Planta
  Compra materia prima    :b1, 2026-10-16, 1d
  Producción y empaque    :b2, 2026-10-16, 2d
  section Entrega
  Despacho y entrega      :c1, 2026-10-17, 1d
  section Finanzas
  Cierre semanal y reparto :d1, 2026-10-18, 1d
```

### 6.4 Cálculo financiero
```mermaid
flowchart LR
  PE[Pedidos entregados] --> ING[Ingresos]
  IM[Ingresos manuales] --> ING
  MP[Materia prima] --> EG[Egresos]
  INS[Insumos] --> EG
  MO[Mano de obra] --> EG
  GV[Gastos varios] --> EG
  ING --> GN["Ganancia neta = Ingresos − Egresos"]
  EG --> GN
  GN -->|"× % inversionista"| PI[Parte inversionista]
  GN -->|"× (100% − %)"| PD[Parte negocio / dueño]
```

---

## 7. Modelo de datos

```mermaid
erDiagram
  PROFILES ||--o{ ORDERS : hace
  PROFILES ||--o{ PUSH_SUBSCRIPTIONS : tiene
  WEEKS ||--o{ ORDERS : agrupa
  ORDERS ||--|{ ORDER_ITEMS : contiene
  PRODUCTS ||--o{ ORDER_ITEMS : en
  PRODUCTS ||--o{ PRODUCTION_BATCHES : produce
  WEEKS ||--o{ PRODUCTION_BATCHES : en
  EXPENSE_CATEGORIES ||--o{ EXPENSES : clasifica
  EXPENSE_CATEGORIES ||--o{ EXPENSE_CATEGORIES : subcategoria
  ORDERS ||--o| INCOMES : genera
  INVESTORS ||--o{ INVESTOR_PAYOUTS : recibe
  PROFILES ||--o| INVESTORS : es

  PROFILES {
    uuid id PK "= auth.users.id"
    text full_name
    text phone
    text business_name
    user_role role "admin|mayorista|regular|inversionista"
    user_status status "pendiente|activo|inactivo"
    text address
    text municipality
  }
  SIGNUP_REQUESTS {
    uuid id PK
    text full_name
    text phone
    text municipality
    user_role requested_role
    int est_weekly_packs
    text status
  }
  PRODUCTS {
    uuid id PK
    text name
    text presentation
    int price_regular
    int price_wholesale
    int unit_cost
    int low_stock_threshold
    bool active
  }
  WEEKS {
    uuid id PK
    date starts_on
    timestamptz cutoff_at
    date delivery_on
    bool closed
  }
  ORDERS {
    uuid id PK
    uuid customer_id FK
    uuid week_id FK
    order_status status
    bool paid
    int total
    text note
  }
  ORDER_ITEMS {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    int qty
    int unit_price
  }
  PRODUCTION_BATCHES {
    uuid id PK
    date produced_on
    uuid product_id FK
    int units_produced
    int units_waste
  }
  EXPENSE_CATEGORIES {
    uuid id PK
    text name
    uuid parent_id FK
    bool is_default
  }
  EXPENSES {
    uuid id PK
    date spent_on
    uuid category_id FK
    text description
    numeric quantity
    text unit
    int amount
    text payment_method
    text supplier
    text receipt_url
  }
  INCOMES {
    uuid id PK
    date received_on
    uuid order_id FK "null = manual"
    text concept
    int amount
    text payment_method
  }
  INVESTORS {
    uuid id PK
    uuid profile_id FK
    numeric percentage
    bool active
  }
  INVESTOR_PAYOUTS {
    uuid id PK
    uuid investor_id FK
    date period_start
    date period_end
    int amount
    date paid_on
  }
  PUSH_SUBSCRIPTIONS {
    uuid id PK
    uuid profile_id FK
    jsonb subscription
  }
```

SQL completo con enums, vistas (`v_weekly_consolidated`, `v_inventory`, `v_finance_by_period`) y políticas RLS: [`../supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).

---

## 8. Arquitectura

```mermaid
flowchart LR
  subgraph Dispositivo
    PWA[PWA Next.js<br/>Service Worker]
  end
  subgraph Vercel
    RSC[Server Components<br/>+ Server Actions]
  end
  subgraph Supabase
    AUTH[Auth]
    PG[(Postgres + RLS)]
    ST[Storage<br/>soportes de gastos]
    EF[Edge Function<br/>send-push]
    CRON[pg_cron<br/>recordatorio jueves]
  end
  PWA <--> RSC
  RSC <--> AUTH
  RSC <--> PG
  RSC --> ST
  CRON --> EF
  PG -- trigger estado=en_camino --> EF
  EF -- Web Push VAPID --> PWA
```

---

## 9. Plan de entregas

| Fase | Contenido | Estado |
|---|---|---|
| F0 | Marca, PRD, esquema SQL, prototipo navegable con datos de prueba | ✅ en curso |
| F1 | Supabase: migración, Auth, RLS, capa de datos real | ⏳ esperando credenciales |
| F2 | Pedidos reales + consolidado + estados | ⏳ |
| F3 | Producción, inventario, finanzas, inversionistas | ⏳ |
| F4 | PWA offline + push (VAPID, cron) | ⏳ |
| F5 | Piloto con clientes, ajustes, deploy | ⏳ |
