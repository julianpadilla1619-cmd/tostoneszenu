// Datos de prueba deterministas. Se reemplazan por Supabase en la fase F1 (ver context.md §4).
import { addDays } from "./format";
import type {
  Expense,
  ExpenseCategory,
  Income,
  Investor,
  InvestorPayout,
  Order,
  OrderStatus,
  ProductionBatch,
  Product,
  Profile,
  ScheduleTask,
  Settings,
  SignupRequest,
  Week,
} from "./types";

/** "Hoy" fijo del prototipo: lunes de la semana en curso. */
export const DEMO_TODAY = "2026-10-12";
export const DEMO_NOW = "2026-10-12T14:00:00-05:00";

// PRNG con semilla para que los datos no cambien entre renders.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(1619);
const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export const settings: Settings = {
  cutoffWeekday: 4,
  cutoffTime: "18:00",
  deliveryWeekday: 6,
  wholesaleMinPacks: 20,
  reminderWeekday: 4,
  reminderTime: "10:00",
  whatsapp: "573000000000",
};

export const products: Product[] = [
  {
    id: "p-toston",
    name: "Tostones de plátano",
    presentation: "Paquete 150 g",
    priceRegular: 3500,
    priceWholesale: 2800,
    unitCost: 1500,
    lowStockThreshold: 60,
    active: true,
    kind: "toston",
  },
  {
    id: "p-papa",
    name: "Papas fritas",
    presentation: "Paquete 120 g",
    priceRegular: 3000,
    priceWholesale: 2400,
    unitCost: 1300,
    lowStockThreshold: 40,
    active: true,
    kind: "papa",
  },
];

export const profiles: Profile[] = [
  { id: "u-admin", fullName: "Administración Tostones Zenú", phone: "3000000000", role: "admin", status: "activo", municipality: "Tuchín", createdAt: "2026-08-01" },
  { id: "u-inv", fullName: "Carmen Arrieta", phone: "3011112233", role: "inversionista", status: "activo", municipality: "Montería", createdAt: "2026-08-01" },
  { id: "c1", fullName: "Rosa Montes", businessName: "Tienda La Esquina", phone: "3104567890", role: "mayorista", status: "activo", municipality: "Tuchín", address: "Cra 5 # 8-12, barrio Centro", createdAt: "2026-08-03" },
  { id: "c2", fullName: "Jorge Pérez", businessName: "Distribuidora El Sinú", phone: "3005554411", role: "mayorista", status: "activo", municipality: "Lorica", address: "Calle 3 # 12-40", createdAt: "2026-08-03" },
  { id: "c3", fullName: "Edith Suárez", businessName: "Minimarket Doña Edith", phone: "3127788990", role: "mayorista", status: "activo", municipality: "Sahagún", address: "Av. Las Américas # 9-15", createdAt: "2026-08-05" },
  { id: "c4", fullName: "Luis Polo", businessName: "Granero El Vueltiao", phone: "3149988776", role: "mayorista", status: "activo", municipality: "San Andrés de Sotavento", address: "Calle Principal # 4-02", createdAt: "2026-08-06" },
  { id: "c5", fullName: "Marelvis Díaz", businessName: "Surtitodo Chinú", phone: "3013344556", role: "mayorista", status: "activo", municipality: "Chinú", address: "Cra 7 # 15-30", createdAt: "2026-08-10" },
  { id: "c10", fullName: "Liliana Petro", businessName: "Tienda Colegio San José", phone: "3162223344", role: "mayorista", status: "activo", municipality: "Ciénaga de Oro", address: "Colegio San José, sede A", createdAt: "2026-08-20" },
  { id: "c6", fullName: "Andrés Banda", businessName: "Kiosko El Parque", phone: "3201234567", role: "regular", status: "activo", municipality: "Tuchín", address: "Parque principal", createdAt: "2026-08-08" },
  { id: "c7", fullName: "Yuranis Martínez", phone: "3116667788", role: "regular", status: "activo", municipality: "Tuchín", address: "Barrio San Martín", createdAt: "2026-08-12" },
  { id: "c8", fullName: "Over Rojas", businessName: "Cafetería La 21", phone: "3045556677", role: "regular", status: "activo", municipality: "Montería", address: "Calle 21 # 6-44", createdAt: "2026-08-15" },
  { id: "c9", fullName: "Dairo Hernández", phone: "3158889900", role: "regular", status: "activo", municipality: "Momil", createdAt: "2026-08-18" },
  { id: "c11", fullName: "Rafael Mendoza", businessName: "Estadero Los Compadres", phone: "3173332211", role: "regular", status: "activo", municipality: "Sahagún", createdAt: "2026-09-01" },
  { id: "c12", fullName: "Keila Ortega", phone: "3189990011", role: "regular", status: "pendiente", municipality: "Tuchín", createdAt: "2026-10-10" },
];

// ---------- Semanas (lun–dom). Corte jueves 6 p. m., entrega sábado ----------
const weekStarts = ["2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"];
export const weeks: Week[] = weekStarts.map((s) => ({
  id: `w-${s}`,
  startsOn: s,
  cutoffAt: `${addDays(s, 3)}T18:00:00-05:00`,
  deliveryOn: addDays(s, 5),
  closed: s !== DEMO_TODAY,
}));
export const CURRENT_WEEK_ID = `w-${DEMO_TODAY}`;

// ---------- Pedidos ----------
const customers = profiles.filter((p) => p.role === "mayorista" || p.role === "regular").filter((p) => p.status === "activo");
const methods = ["efectivo", "nequi", "efectivo", "daviplata", "transferencia"] as const;

function itemsFor(c: Profile) {
  const w = c.role === "mayorista";
  const t = w ? roundTo(between(50, 140), 10) : roundTo(between(6, 30), 2);
  const p = w ? roundTo(between(20, 80), 10) : roundTo(between(0, 16), 2);
  const price = (pr: Product) => (w ? pr.priceWholesale : pr.priceRegular);
  return [
    { productId: "p-toston", qty: t, unitPrice: price(products[0]) },
    ...(p > 0 ? [{ productId: "p-papa", qty: p, unitPrice: price(products[1]) }] : []),
  ];
}

export const orders: Order[] = [];
for (const wk of weeks.slice(0, -1)) {
  for (const c of customers) {
    if (rnd() < 0.12) {
      orders.push({ id: `o-${wk.startsOn}-${c.id}`, customerId: c.id, weekId: wk.id, status: "no_pide", paid: false, items: [], updatedAt: wk.startsOn });
      continue;
    }
    const lastWeek = wk.startsOn === "2026-10-05";
    const unpaid = lastWeek && (c.id === "c5" || c.id === "c11");
    orders.push({
      id: `o-${wk.startsOn}-${c.id}`,
      customerId: c.id,
      weekId: wk.id,
      status: "entregado",
      paid: !unpaid,
      paymentMethod: unpaid ? undefined : methods[between(0, methods.length - 1)],
      items: itemsFor(c),
      updatedAt: wk.deliveryOn,
    });
  }
}

// Semana en curso: mezcla de estados para ver el tablero vivo.
const currentPlan: Record<string, OrderStatus | null> = {
  c1: "confirmado", c2: "confirmado", c3: "no_pide", c4: "confirmado", c5: null,
  c10: "confirmado", c6: "confirmado", c7: null, c8: "borrador", c9: "no_pide", c11: null,
};
for (const c of customers) {
  const st = currentPlan[c.id];
  if (!st) continue;
  orders.push({
    id: `o-${DEMO_TODAY}-${c.id}`,
    customerId: c.id,
    weekId: CURRENT_WEEK_ID,
    status: st,
    paid: false,
    items: st === "no_pide" ? [] : itemsFor(c),
    note: c.id === "c2" ? "Mandar la mitad de papas el viernes si se puede" : undefined,
    updatedAt: DEMO_TODAY,
  });
}

// ---------- Producción (viernes de cada semana cerrada) ----------
export const production: ProductionBatch[] = [];
for (const wk of weeks.slice(0, -1)) {
  for (const pr of products) {
    const ordered = orders
      .filter((o) => o.weekId === wk.id && o.status === "entregado")
      .flatMap((o) => o.items)
      .filter((i) => i.productId === pr.id)
      .reduce((s, i) => s + i.qty, 0);
    const produced = roundTo(ordered * (1.04 + rnd() * 0.06), 10);
    production.push({
      id: `b-${wk.startsOn}-${pr.id}`,
      producedOn: addDays(wk.startsOn, 4),
      productId: pr.id,
      unitsProduced: produced,
      unitsWaste: Math.round(produced * (0.01 + rnd() * 0.02)),
    });
  }
}

// ---------- Categorías de gasto ----------
export const categories: ExpenseCategory[] = [
  { id: "cat-mp", name: "Materia prima", parentId: null, color: "var(--color-serie-1)", isDefault: true },
  { id: "cat-ins", name: "Insumos", parentId: null, color: "var(--color-serie-2)", isDefault: true },
  { id: "cat-mo", name: "Mano de obra", parentId: null, color: "var(--color-serie-3)", isDefault: true },
  { id: "cat-gv", name: "Gastos varios", parentId: null, color: "var(--color-serie-4)", isDefault: true },
  { id: "sub-platano", name: "Plátano", parentId: "cat-mp", isDefault: true },
  { id: "sub-papa", name: "Papa", parentId: "cat-mp", isDefault: true },
  { id: "sub-aceite", name: "Aceite", parentId: "cat-ins", isDefault: true },
  { id: "sub-gas", name: "Gas", parentId: "cat-ins", isDefault: true },
  { id: "sub-empaques", name: "Empaques", parentId: "cat-ins", isDefault: true },
  { id: "sub-sal", name: "Sal", parentId: "cat-ins", isDefault: true },
  { id: "sub-sabor", name: "Saborizantes", parentId: "cat-ins", isDefault: true },
  { id: "sub-trabajadores", name: "Pago a trabajadores", parentId: "cat-mo", isDefault: true },
  { id: "sub-transporte", name: "Transporte", parentId: "cat-gv", isDefault: true },
  { id: "sub-servicios", name: "Servicios", parentId: "cat-gv", isDefault: true },
  { id: "sub-otros", name: "Otros", parentId: "cat-gv", isDefault: true },
];

// ---------- Gastos por semana ----------
export const expenses: Expense[] = [];
let ex = 0;
const addExp = (e: Omit<Expense, "id">) => expenses.push({ id: `e-${++ex}`, ...e });
for (const wk of weeks) {
  const s = wk.startsOn;
  const current = s === DEMO_TODAY;
  addExp({ spentOn: addDays(s, current ? 0 : 3), categoryId: "sub-platano", description: "Racimos de plátano hartón", quantity: between(10, 14), unit: "racimo", amount: 0, paymentMethod: "efectivo", supplier: "Finca Los Mangos" });
  if (current) {
    expenses[expenses.length - 1].amount = expenses[expenses.length - 1].quantity! * 26000;
    addExp({ spentOn: s, categoryId: "sub-gas", description: "Cilindro 40 lb", quantity: 1, unit: "cilindro", amount: 82000, paymentMethod: "efectivo", supplier: "Gas del Sinú" });
    continue;
  }
  expenses[expenses.length - 1].amount = expenses[expenses.length - 1].quantity! * roundTo(between(24000, 27000), 500);
  addExp({ spentOn: addDays(s, 3), categoryId: "sub-papa", description: "Bulto de papa criolla 50 kg", quantity: 2, unit: "bulto", amount: roundTo(2 * between(85000, 98000), 1000), paymentMethod: "efectivo", supplier: "Plaza de Sahagún" });
  addExp({ spentOn: addDays(s, 3), categoryId: "sub-aceite", description: "Aceite de palma bidón 18 L", quantity: 2, unit: "bidón", amount: roundTo(2 * between(135000, 148000), 1000), paymentMethod: "nequi", supplier: "Distribuidora Costa" });
  addExp({ spentOn: addDays(s, 4), categoryId: "sub-gas", description: "Cilindro 40 lb", quantity: 1, unit: "cilindro", amount: 82000, paymentMethod: "efectivo", supplier: "Gas del Sinú" });
  addExp({ spentOn: addDays(s, 2), categoryId: "sub-empaques", description: "Bolsas metalizadas con logo", quantity: 1000, unit: "und", amount: 118000, paymentMethod: "transferencia", supplier: "Empaques Montería" });
  addExp({ spentOn: addDays(s, 3), categoryId: "sub-sal", description: "Sal refinada", quantity: 5, unit: "kg", amount: 9500, paymentMethod: "efectivo" });
  if (rnd() > 0.4) addExp({ spentOn: addDays(s, 3), categoryId: "sub-sabor", description: "Sazonador limón y ajo", quantity: 2, unit: "kg", amount: 36000, paymentMethod: "efectivo" });
  addExp({ spentOn: addDays(s, 5), categoryId: "sub-trabajadores", description: "Pago semanal 2 ayudantes (3 días)", quantity: 6, unit: "jornal", amount: 300000, paymentMethod: "efectivo" });
  addExp({ spentOn: addDays(s, 5), categoryId: "sub-transporte", description: "Moto-carga ruta de entregas", quantity: 1, unit: "ruta", amount: roundTo(between(70000, 95000), 1000), paymentMethod: "efectivo" });
  if (s === "2026-09-28") addExp({ spentOn: addDays(s, 1), categoryId: "sub-servicios", description: "Luz y agua del local", amount: 96000, paymentMethod: "transferencia" });
}

// ---------- Ingresos manuales (los de pedidos se derivan) ----------
export const manualIncomes: Income[] = [
  { id: "i-1", receivedOn: "2026-09-20", concept: "Venta en feria artesanal de Tuchín", amount: 185000, paymentMethod: "efectivo" },
  { id: "i-2", receivedOn: "2026-10-04", concept: "Venta de mostrador", amount: 64000, paymentMethod: "nequi" },
];

// ---------- Inversionistas ----------
export const investors: Investor[] = [{ id: "inv-1", profileId: "u-inv", name: "Carmen Arrieta", percentage: 30, active: true }];
// Sin pagos registrados: el admin los registra desde la calculadora de reparto.
export const payouts: InvestorPayout[] = [];

// ---------- Solicitudes desde la landing ----------
export const requests: SignupRequest[] = [
  { id: "r-1", fullName: "Nelson Ruiz", phone: "3009871234", municipality: "Planeta Rica", businessName: "Supertienda Nelson", requestedRole: "mayorista", estWeeklyPacks: 80, message: "Vi los tostones en Sahagún, quiero distribuir aquí.", status: "nueva", createdAt: "2026-10-11" },
  { id: "r-2", fullName: "Ana Lucía Garcés", phone: "3115550099", municipality: "Tuchín", requestedRole: "regular", estWeeklyPacks: 12, status: "nueva", createdAt: "2026-10-12" },
  { id: "r-3", fullName: "Hotel Brisas del Sinú", phone: "3124443322", municipality: "Lorica", businessName: "Hotel Brisas del Sinú", requestedRole: "mayorista", estWeeklyPacks: 40, message: "Para el minibar y el restaurante.", status: "nueva", createdAt: "2026-10-09" },
];

// ---------- Programación de la semana en curso ----------
const d = (n: number) => addDays(DEMO_TODAY, n);
export const tasks: ScheduleTask[] = [
  { id: "t-1", day: d(0), kind: "otro", title: "Revisar pedidos nuevos y solicitudes", done: true },
  { id: "t-2", day: d(0), kind: "compra", title: "Comprar plátano para prueba de sabor", done: true },
  { id: "t-3", day: d(2), kind: "pago", title: "Cobrar a Surtitodo Chinú y Estadero Los Compadres", done: false },
  { id: "t-5", day: d(3), kind: "compra", title: "Comprar plátano, papa, aceite y empaques", done: false },
  { id: "t-6", day: d(4), kind: "produccion", title: "Producción de tostones", done: false },
  { id: "t-7", day: d(4), kind: "produccion", title: "Producción de papas", done: false },
  { id: "t-8", day: d(4), kind: "empaque", title: "Empaque y rotulado por cliente", done: false },
  { id: "t-9", day: d(5), kind: "entrega", title: "Ruta 1: Tuchín – San Andrés – Chinú", done: false },
  { id: "t-10", day: d(5), kind: "entrega", title: "Ruta 2: Sahagún – Ciénaga de Oro – Lorica – Montería", done: false },
  { id: "t-11", day: d(6), kind: "pago", title: "Cierre semanal y reparto a inversionista", done: false },
];
