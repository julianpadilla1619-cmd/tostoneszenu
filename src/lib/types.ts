// Tipos de dominio. Reflejan las tablas de supabase/migrations (0001 + 0002) en camelCase.
// Fechas de negocio como ISO "YYYY-MM-DD" (hora Colombia); montos en COP enteros.

export type Role = "admin" | "mayorista" | "inversionista";
export type UserStatus = "pendiente" | "activo" | "inactivo";
export type OrderStatus =
  | "borrador"
  | "confirmado"
  | "no_pide"
  | "cancelado"
  | "en_produccion"
  | "en_camino"
  | "entregado";
export type PaymentMethod = "efectivo" | "nequi" | "daviplata" | "transferencia" | "otro";
export type ProductCategory = "platano" | "papa" | "name" | "yuca" | "otro";

export interface Profile {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  businessName: string | null;
  role: Role;
  status: UserStatus;
  address: string | null;
  municipality: string | null;
  notes: string | null;
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  weightGrams: number;
  description: string;
  price: number; // precio mayorista por paquete
  unitCost: number;
  lowStockThreshold: number;
  active: boolean;
  featured: boolean;
  sort: number;
  imageUrl: string | null;
}

export interface Settings {
  deliveryWeekdays: number[]; // ISO 1=lun … 7=dom
  cutoffTime: string; // "18:00" del día anterior a cada entrega
  wholesaleMinPacks: number;
  reminderWeekday: number;
  reminderTime: string;
  whatsapp: string | null;
  headline: string;
  zones: string;
  contactEmail: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort: number;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  weekStart: string; // lunes
  deliveryOn: string | null;
  status: OrderStatus;
  paid: boolean;
  paymentMethod: PaymentMethod | null;
  total: number;
  note: string | null;
  items: OrderItem[];
  updatedAt: string;
}

export interface ProductionBatch {
  id: string;
  producedOn: string;
  productId: string;
  unitsProduced: number;
  unitsWaste: number;
  notes: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  spentOn: string;
  categoryId: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  supplier: string | null;
}

export interface Income {
  id: string;
  receivedOn: string;
  orderId: string | null; // presente = ingreso automático por pedido
  concept: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface Investor {
  id: string;
  profileId: string | null;
  name: string;
  percentage: number;
  active: boolean;
}

export interface InvestorPayout {
  id: string;
  investorId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  paidOn: string | null;
}

export interface SignupRequest {
  id: string;
  fullName: string;
  phone: string;
  municipality: string | null;
  businessName: string | null;
  estWeeklyPacks: number | null;
  message: string | null;
  status: "nueva" | "aprobada" | "rechazada";
  createdAt: string;
}

export type TaskKind = "compra" | "produccion" | "empaque" | "entrega" | "pago" | "otro";
export interface ScheduleTask {
  id: string;
  day: string;
  kind: TaskKind;
  title: string;
  done: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

/** Resultado estándar de una Server Action. */
export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
