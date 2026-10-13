import type { OrderStatus, PaymentMethod, ProductCategory, Role, TaskKind } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  borrador: "Borrador",
  confirmado: "Confirmado",
  no_pide: "No pide",
  cancelado: "Cancelado",
  en_produccion: "En producción",
  en_camino: "En camino",
  entregado: "Entregado",
};

/** Flujo operativo que el admin avanza paso a paso. */
export const STATUS_FLOW: OrderStatus[] = ["confirmado", "en_produccion", "en_camino", "entregado"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  mayorista: "Cliente mayorista",
  inversionista: "Inversionista",
};

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  platano: "Plátano",
  papa: "Papa",
  name: "Ñame",
  yuca: "Yuca",
  otro: "Otro",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi",
  daviplata: "Daviplata",
  transferencia: "Transferencia",
  otro: "Otro",
};

export const TASK_LABEL: Record<TaskKind, string> = {
  compra: "Compra",
  produccion: "Producción",
  empaque: "Empaque",
  entrega: "Entrega",
  pago: "Pagos",
  otro: "General",
};

export const MUNICIPIOS = [
  "Tuchín",
  "San Andrés de Sotavento",
  "Chinú",
  "Sahagún",
  "Lorica",
  "Momil",
  "Ciénaga de Oro",
  "Montería",
  "Planeta Rica",
  "San Antonio de Palmito",
  "Sampués",
  "Sincelejo",
  "Otro",
];
