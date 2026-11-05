import { lineTotalCents } from "./billing.ts";

export type Order = {
  id: string;
  sku: string;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
};

const orders = new Map<string, Order>();
let seq = 0;

export function resetOrders(): void {
  orders.clear();
  seq = 0;
}

export function createOrder(input: { sku: string; qty: number; unitPriceCents: number }): Order {
  const sku = input.sku.trim();
  if (!sku || sku.length > 64) {
    throw new Error("sku 不能为空且不超过 64 字符");
  }
  const totalCents = lineTotalCents(input.qty, input.unitPriceCents);
  seq += 1;
  const order: Order = {
    id: String(seq),
    sku,
    qty: input.qty,
    unitPriceCents: input.unitPriceCents,
    totalCents,
  };
  orders.set(order.id, order);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return orders.get(id);
}
