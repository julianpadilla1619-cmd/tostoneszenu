import { describe, expect, it } from "vitest";
import { addDays, hour12, money } from "@/lib/format";
import { periodRange } from "@/lib/periods";
import { consolidate, finance, investorSplit, orderTotal, pendingDelivery, weeklySeries } from "@/lib/selectors";
import { cutoffFor, deliveriesOfWeek, isEditable, isoWeekday, mondayOf, orderWindow, timeLeft, todayBogota, weekdayList } from "@/lib/time";
import type { Expense, ExpenseCategory, Income, Order, Product } from "@/lib/types";
import { phone, tempPassword, ValidationError } from "@/lib/validate";

const settings = { deliveryWeekdays: [2, 4], cutoffTime: "18:00" };
// Instante en Colombia (UTC−5) expresado en UTC.
const at = (iso: string) => new Date(`${iso}-05:00`);

describe("fechas en Colombia", () => {
  it("usa la fecha de Bogotá aunque en UTC ya sea el día siguiente", () => {
    expect(todayBogota(new Date("2026-10-13T03:00:00Z"))).toBe("2026-10-12"); // 10 p. m. del lunes en Colombia
  });
  it("calcula día de la semana y lunes", () => {
    expect(isoWeekday("2026-10-12")).toBe(1);
    expect(isoWeekday("2026-10-18")).toBe(7);
    expect(mondayOf("2026-10-15")).toBe("2026-10-12");
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("lista entregas martes y jueves", () => {
    expect(deliveriesOfWeek("2026-10-12", settings)).toEqual(["2026-10-13", "2026-10-15"]);
    expect(weekdayList([4, 2])).toBe("martes y jueves");
  });
  it("hora límite = día anterior a la entrega a las 6 p. m.", () => {
    expect(cutoffFor("2026-10-13", "18:00").toISOString()).toBe("2026-10-12T23:00:00.000Z");
  });
});

describe("ventana de pedido", () => {
  it("lunes a mediodía: abiertos martes y jueves", () => {
    const w = orderWindow(settings, at("2026-10-12T12:00:00"));
    expect(w.weekStart).toBe("2026-10-12");
    expect(w.open.map((d) => d.date)).toEqual(["2026-10-13", "2026-10-15"]);
  });
  it("lunes 7 p. m.: ya cerró el martes, queda el jueves", () => {
    const w = orderWindow(settings, at("2026-10-12T19:00:00"));
    expect(w.open.map((d) => d.date)).toEqual(["2026-10-15"]);
  });
  it("miércoles 7 p. m.: pasa a la semana siguiente", () => {
    const w = orderWindow(settings, at("2026-10-14T19:00:00"));
    expect(w.weekStart).toBe("2026-10-19");
    expect(w.open.map((d) => d.date)).toEqual(["2026-10-20", "2026-10-22"]);
  });
  it("un pedido no se puede cambiar después de su hora límite", () => {
    expect(isEditable("2026-10-13", "2026-10-12", settings, at("2026-10-12T17:59:00"))).toBe(true);
    expect(isEditable("2026-10-13", "2026-10-12", settings, at("2026-10-12T18:01:00"))).toBe(false);
  });
  it("texto de tiempo restante", () => {
    expect(timeLeft("2026-10-12T23:00:00.000Z", at("2026-10-12T15:30:00"))).toBe("Faltan 2 h 30 min");
    expect(timeLeft("2026-10-12T23:00:00.000Z", at("2026-10-13T15:30:00"))).toBe("Cerrado");
  });
});

const products: Product[] = [
  { id: "a", name: "Plátano", category: "platano", weightGrams: 150, description: "", price: 2800, unitCost: 1500, lowStockThreshold: 10, active: true, featured: true, sort: 1, imageUrl: null },
  { id: "b", name: "Papa", category: "papa", weightGrams: 120, description: "", price: 2400, unitCost: 1300, lowStockThreshold: 10, active: true, featured: false, sort: 2, imageUrl: null },
];
const order = (status: Order["status"], items: [string, number][], deliveryOn = "2026-10-13"): Order => ({
  id: Math.random().toString(),
  customerId: "c",
  weekStart: "2026-10-12",
  deliveryOn,
  status,
  paid: false,
  paymentMethod: null,
  total: 0,
  note: null,
  items: items.map(([productId, qty]) => ({ productId, qty, unitPrice: products.find((p) => p.id === productId)!.price })),
  updatedAt: "",
});

describe("consolidado y finanzas", () => {
  it("suma solo pedidos activos, por producto y por día", () => {
    const b = consolidate(
      [order("confirmado", [["a", 20], ["b", 10]]), order("no_pide", []), order("cancelado", [["a", 99]]), order("en_camino", [["a", 10]], "2026-10-15")],
      products,
    );
    expect(b.byProduct.find((x) => x.product.id === "a")!.qty).toBe(30);
    expect(b.totalPacks).toBe(40);
    expect(b.totalValue).toBe(30 * 2800 + 10 * 2400);
    expect(b.byDay.map((d) => [d.date, d.packs])).toEqual([
      ["2026-10-13", 30],
      ["2026-10-15", 10],
    ]);
  });
  it("lo entregado no cuenta como pendiente por producir", () => {
    const pend = consolidate(pendingDelivery([order("entregado", [["a", 22]]), order("en_camino", [["a", 5]])]), products);
    expect(pend.totalPacks).toBe(5);
  });
  it("total de un pedido", () => {
    expect(orderTotal(order("confirmado", [["a", 10], ["b", 5]]))).toBe(40000);
  });
  it("ganancia neta, margen y gastos por categoría", () => {
    const cats: ExpenseCategory[] = [
      { id: "mp", name: "Materia prima", parentId: null, color: null, isDefault: true },
      { id: "pl", name: "Plátano", parentId: "mp", color: null, isDefault: true },
    ];
    const incomes: Income[] = [{ id: "1", receivedOn: "2026-10-13", orderId: null, concept: "x", amount: 100000, paymentMethod: "efectivo" }];
    const expenses: Expense[] = [
      { id: "1", spentOn: "2026-10-12", categoryId: "pl", description: null, quantity: null, unit: null, amount: 30000, paymentMethod: "efectivo", supplier: null },
      { id: "2", spentOn: "2026-09-01", categoryId: "pl", description: null, quantity: null, unit: null, amount: 999, paymentMethod: "efectivo", supplier: null },
    ];
    const f = finance(incomes, expenses, cats, "2026-10-01", "2026-10-31");
    expect(f.net).toBe(70000);
    expect(Math.round(f.margin)).toBe(70);
    expect(f.byCategory[0]).toMatchObject({ amount: 30000 });
    expect(weeklySeries(incomes, expenses, "2026-10-12", 2).map((s) => s.net)).toEqual([0, 70000]);
  });
  it("reparto del inversionista: sin ganancia no hay reparto", () => {
    expect(investorSplit(1_000_000, 30)).toEqual({ investor: 300000, owner: 700000 });
    expect(investorSplit(-50_000, 30)).toEqual({ investor: 0, owner: 0 });
  });
  it("periodos", () => {
    expect(periodRange("mes_pasado", "2026-01-15")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(periodRange("semana", "2026-10-15")).toEqual({ from: "2026-10-12", to: "2026-10-18" });
  });
});

describe("validaciones y formato", () => {
  const fd = (v: string) => {
    const f = new FormData();
    f.set("phone", v);
    return f;
  };
  it("acepta celulares colombianos y rechaza otros", () => {
    expect(phone(fd("300 123 4567"))).toBe("3001234567");
    expect(phone(fd("+57 310-456-7890"))).toBe("3104567890");
    expect(() => phone(fd("6041234567"))).toThrow(ValidationError);
    expect(() => phone(fd("300123"))).toThrow(ValidationError);
  });
  it("genera contraseñas temporales de 7 caracteres sin caracteres confusos", () => {
    for (let i = 0; i < 50; i++) expect(tempPassword()).toMatch(/^[A-Z][a-z]{2}\d{4}$/);
  });
  it("formatea dinero y hora", () => {
    expect(money(2800)).toBe("$ 2.800");
    expect(hour12("18:00")).toBe("6 p. m.");
    expect(hour12("09:30")).toBe("9:30 a. m.");
  });
});
