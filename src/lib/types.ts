// Tipos de dominio. Reflejan 1:1 las tablas de supabase/migrations/0001_init.sql
// (en camelCase). Fechas como ISO "YYYY-MM-DD"; montos en COP enteros.

export type Role = "admin" | "mayorista" | "regular" | "inversionista";
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

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  businessName?: string;
  role: Role;
  status: UserStatus;
  address?: string;
  municipality: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  presentation: string;
  priceRegular: number;
  priceWholesale: number;
  unitCost: number;
  lowStockThreshold: number;
  active: boolean;
  kind: "toston" | "papa";
}

export interface Week {
  id: string;
  startsOn: string; // lunes
  cutoffAt: string; // ISO datetime
  deliveryOn: string;
  closed: boolean;
}

export interface OrderItem {
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  weekId: string;
  status: OrderStatus;
  paid: boolean;
  paymentMethod?: PaymentMethod;
  items: OrderItem[];
  note?: string;
  updatedAt: string;
}

export interface ProductionBatch {
  id: string;
  producedOn: string;
  productId: string;
  unitsProduced: number;
  unitsWaste: number;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  spentOn: string;
  categoryId: string; // subcategoría (o categoría raíz)
  description: string;
  quantity?: number;
  unit?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  supplier?: string;
}

export interface Income {
  id: string;
  receivedOn: string;
  orderId?: string; // presente = ingreso automático por pedido
  concept: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface Investor {
  id: string;
  profileId?: string;
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
  paidOn?: string;
}

export interface SignupRequest {
  id: string;
  fullName: string;
  phone: string;
  municipality: string;
  businessName?: string;
  requestedRole: "regular" | "mayorista";
  estWeeklyPacks?: number;
  message?: string;
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

export interface Settings {
  cutoffWeekday: number; // 1=lun … 7=dom
  cutoffTime: string; // "18:00"
  deliveryWeekday: number;
  wholesaleMinPacks: number;
  reminderWeekday: number;
  reminderTime: string;
  whatsapp: string;
}
