import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createOrder, getOrder, resetOrders } from "../src/orders.ts";

beforeEach(() => {
  resetOrders();
});

test("创建订单并按 id 读回", () => {
  const order = createOrder({ sku: " mug ", qty: 2, unitPriceCents: 500 });
  assert.deepEqual(order, {
    id: "1",
    sku: "mug",
    qty: 2,
    unitPriceCents: 500,
    totalCents: 1000,
  });
  assert.deepEqual(getOrder("1"), order);
  assert.equal(getOrder("404"), undefined);
});

test("空 sku 被拒绝", () => {
  assert.throws(() => createOrder({ sku: "  ", qty: 1, unitPriceCents: 100 }), /sku/);
});
