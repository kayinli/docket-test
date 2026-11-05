/**
 * 金额只用整数「分」。
 * 应付 = 数量 × 单价。这是业务语义：现有四类硬规则表达不了「算错钱」。
 */
export function lineTotalCents(qty: number, unitPriceCents: number): number {
  if (!Number.isInteger(qty) || qty < 1 || qty > 1_000_000) {
    throw new Error("qty 必须是 1 到 1000000 的整数");
  }
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0 || unitPriceCents > 1_000_000_000) {
    throw new Error("unitPriceCents 必须是 0 到 1000000000 的整数");
  }
  // 应付应当是数量 × 单价。这里写成了相加，货款会算错。
  const total = qty + unitPriceCents;
  if (!Number.isSafeInteger(total)) {
    throw new Error("金额溢出");
  }
  return total;
}
