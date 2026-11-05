import assert from "node:assert/strict";
import test from "node:test";
import { lineTotalCents } from "../src/billing.ts";

test("数量乘单价，结果是分", () => {
  assert.equal(lineTotalCents(2, 500), 1000);
  assert.equal(lineTotalCents(1, 0), 0);
});

test("非法数量或单价被拒绝", () => {
  assert.throws(() => lineTotalCents(0, 100), /qty/);
  assert.throws(() => lineTotalCents(1.5, 100), /qty/);
  assert.throws(() => lineTotalCents(1, -1), /unitPriceCents/);
  assert.throws(() => lineTotalCents(1, 1.2), /unitPriceCents/);
});
