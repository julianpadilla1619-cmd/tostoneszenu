// Convierte filas de Supabase (snake_case) a tipos de dominio (camelCase).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { mergeLanding } from "./landing";
import type {
  AppNotification,
  Expense,
  ExpenseCategory,
  Faq,
  Income,
  Investor,
  InvestorPayout,
  Order,
  ProductionBatch,
  Product,
  Profile,
  ScheduleTask,
  Settings,
  SignupRequest,
} from "./types";

type Row = Record<string, any>;

export const toProfile = (r: Row): Profile => ({
  id: r.id,
  fullName: r.full_name,
  phone: r.phone,
  email: r.email,
  businessName: r.business_name,
  role: r.role,
  status: r.status,
  address: r.address,
  municipality: r.municipality,
  notes: r.notes,
  notifyEmail: r.notify_email ?? true,
  notifyPush: r.notify_push ?? true,
  createdAt: r.created_at,
});

export const toProduct = (r: Row): Product => ({
  id: r.id,
  name: r.name,
  category: r.category,
  weightGrams: r.weight_grams,
  description: r.description ?? "",
  price: r.price,
  unitCost: r.unit_cost,
  lowStockThreshold: r.low_stock_threshold,
  active: r.active,
  featured: r.featured,
  sort: r.sort,
  imageUrl: r.image_url,
});

export const toSettings = (r: Row): Settings => ({
  deliveryWeekdays: r.delivery_weekdays ?? [2, 4],
  cutoffDaysBefore: r.cutoff_days_before ?? 2,
  cutoffTime: String(r.cutoff_time ?? "18:00").slice(0, 5),
  wholesaleMinPacks: r.wholesale_min_packs,
  reminderWeekday: r.reminder_weekday,
  reminderTime: String(r.reminder_time ?? "10:00").slice(0, 5),
  whatsapp: r.whatsapp,
  headline: r.headline,
  zones: r.zones,
  contactEmail: r.contact_email,
  landing: mergeLanding(r.landing),
});

export const toFaq = (r: Row): Faq => ({ id: r.id, question: r.question, answer: r.answer, sort: r.sort, active: r.active });

export const toOrder = (r: Row): Order => ({
  id: r.id,
  customerId: r.customer_id,
  weekStart: r.week_start,
  deliveryOn: r.delivery_on,
  status: r.status,
  paid: r.paid,
  paymentMethod: r.payment_method,
  total: r.total,
  note: r.note,
  items: (r.order_items ?? []).map((i: Row) => ({ productId: i.product_id, qty: i.qty, unitPrice: i.unit_price })),
  updatedAt: r.updated_at,
});

export const toBatch = (r: Row): ProductionBatch => ({
  id: r.id,
  producedOn: r.produced_on,
  productId: r.product_id,
  unitsProduced: r.units_produced,
  unitsWaste: r.units_waste,
  notes: r.notes,
});

export const toCategory = (r: Row): ExpenseCategory => ({
  id: r.id,
  name: r.name,
  parentId: r.parent_id,
  color: r.color,
  isDefault: r.is_default,
});

export const toExpense = (r: Row): Expense => ({
  id: r.id,
  spentOn: r.spent_on,
  categoryId: r.category_id,
  description: r.description,
  quantity: r.quantity === null ? null : Number(r.quantity),
  unit: r.unit,
  amount: r.amount,
  paymentMethod: r.payment_method,
  supplier: r.supplier,
});

export const toIncome = (r: Row): Income => ({
  id: r.id,
  receivedOn: r.received_on,
  orderId: r.order_id,
  concept: r.concept,
  amount: r.amount,
  paymentMethod: r.payment_method,
});

export const toInvestor = (r: Row): Investor => ({
  id: r.id,
  profileId: r.profile_id,
  name: r.name,
  percentage: Number(r.percentage),
  active: r.active,
});

export const toPayout = (r: Row): InvestorPayout => ({
  id: r.id,
  investorId: r.investor_id,
  periodStart: r.period_start,
  periodEnd: r.period_end,
  amount: r.amount,
  paidOn: r.paid_on,
});

export const toRequest = (r: Row): SignupRequest => ({
  id: r.id,
  fullName: r.full_name,
  phone: r.phone,
  email: r.email ?? null,
  municipality: r.municipality,
  businessName: r.business_name,
  estWeeklyPacks: r.est_weekly_packs,
  message: r.message,
  status: r.status,
  createdAt: r.created_at,
});

export const toTask = (r: Row): ScheduleTask => ({ id: r.id, day: r.day, kind: r.kind, title: r.title, done: r.done });

export const toNotification = (r: Row): AppNotification => ({
  id: r.id,
  title: r.title,
  body: r.body,
  url: r.url,
  readAt: r.read_at,
  createdAt: r.created_at,
});
