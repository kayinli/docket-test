import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { request } from "node:http";
import { after, before, beforeEach, test } from "node:test";
import { resetOrders } from "../src/orders.ts";
import { createApp } from "../src/server.ts";

type JsonResponse = { status: number; json: unknown };

const server = createApp();

before(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
});

after(async () => {
  server.close();
  await once(server, "close");
});

beforeEach(() => {
  resetOrders();
  delete process.env.DOCKET_API_KEY;
});

function call(method: string, path: string, options?: { headers?: Record<string, string>; body?: string }): Promise<JsonResponse> {
  const addr = server.address() as AddressInfo;
  return new Promise((resolve, reject) => {
    const headers = { ...(options?.headers ?? {}) };
    if (options?.body != null) {
      headers["content-type"] = "application/json";
      headers["content-length"] = String(Buffer.byteLength(options.body));
    }
    const req = request(
      { hostname: "127.0.0.1", port: addr.port, method, path, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode ?? 0, json: text ? JSON.parse(text) : null });
        });
      },
    );
    req.on("error", reject);
    if (options?.body != null) req.write(options.body);
    req.end();
  });
}

test("GET /health 与 GET /ready 不需要密钥", async () => {
  process.env.DOCKET_API_KEY = "secret";
  const health = await call("GET", "/health");
  const ready = await call("GET", "/ready");
  assert.equal(health.status, 200);
  assert.deepEqual(health.json, { status: "ok" });
  assert.equal(ready.status, 200);
  assert.deepEqual(ready.json, { ready: true });
});

test("未配置密钥时可以下单并查询", async () => {
  const created = await call("POST", "/orders", {
    body: JSON.stringify({ sku: "mug", qty: 2, unitPriceCents: 500 }),
  });
  assert.equal(created.status, 201);
  assert.deepEqual(created.json, {
    id: "1",
    sku: "mug",
    qty: 2,
    unitPriceCents: 500,
    totalCents: 1000,
  });
  const fetched = await call("GET", "/orders/1");
  assert.equal(fetched.status, 200);
  assert.deepEqual(fetched.json, created.json);
});

test("配置密钥后，订单接口校验 x-api-key", async () => {
  process.env.DOCKET_API_KEY = "secret";
  const missing = await call("POST", "/orders", {
    body: JSON.stringify({ sku: "mug", qty: 1, unitPriceCents: 100 }),
  });
  const wrong = await call("POST", "/orders", {
    headers: { "x-api-key": "nope" },
    body: JSON.stringify({ sku: "mug", qty: 1, unitPriceCents: 100 }),
  });
  const ok = await call("POST", "/orders", {
    headers: { "x-api-key": "secret" },
    body: JSON.stringify({ sku: "mug", qty: 1, unitPriceCents: 100 }),
  });
  assert.equal(missing.status, 401);
  assert.equal(wrong.status, 401);
  assert.equal(ok.status, 201);
  const deniedRead = await call("GET", "/orders/1");
  const allowedRead = await call("GET", "/orders/1", { headers: { "x-api-key": "secret" } });
  assert.equal(deniedRead.status, 401);
  assert.equal(allowedRead.status, 200);
});

test("坏请求与未知订单返回 4xx", async () => {
  const badJson = await call("POST", "/orders", { body: "{nope" });
  const badQty = await call("POST", "/orders", {
    body: JSON.stringify({ sku: "mug", qty: 0, unitPriceCents: 100 }),
  });
  const missing = await call("GET", "/orders/404");
  const nowhere = await call("GET", "/nope");
  assert.equal(badJson.status, 400);
  assert.equal(badQty.status, 400);
  assert.equal(missing.status, 404);
  assert.equal(nowhere.status, 404);
});
