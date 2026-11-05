import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";
import { isAuthorized } from "./auth.ts";
import { createOrder, getOrder } from "./orders.ts";

// /health 与 /ready 是活路由。src/probe.ts 里另有 health|ready 种子行，
// 删掉种子行就会触发 drop-healthcheck，即使本文件不动。

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const path = url.pathname;

  if (req.method === "GET" && path === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }
  // demo: /ready 已删除。被删掉的原行匹配 ready，供 deleted_line 旁注说明。

  const orderRead = req.method === "GET" ? path.match(/^\/orders\/([^/]+)$/) : null;
  const orderWrite = req.method === "POST" && path === "/orders";
  if (!orderRead && !orderWrite) {
    sendJson(res, 404, { error: "not_found" });
    return;
  }

  if (!isAuthorized(req.headers, process.env.DOCKET_API_KEY)) {
    sendJson(res, 401, { error: "unauthorized" });
    return;
  }

  if (orderRead) {
    const id = decodeURIComponent(orderRead[1] ?? "");
    const order = getOrder(id);
    if (!order) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }
    sendJson(res, 200, order);
    return;
  }

  let payload: unknown;
  try {
    const raw = await readBody(req);
    payload = raw.trim() === "" ? {} : JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: "bad_json" });
    return;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    sendJson(res, 400, { error: "bad_body" });
    return;
  }
  const body = payload as Record<string, unknown>;
  try {
    const order = createOrder({
      sku: typeof body.sku === "string" ? body.sku : "",
      qty: typeof body.qty === "number" ? body.qty : Number.NaN,
      unitPriceCents: typeof body.unitPriceCents === "number" ? body.unitPriceCents : Number.NaN,
    });
    sendJson(res, 201, order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "bad_order";
    sendJson(res, 400, { error: message });
  }
}

export function createApp(): Server {
  return createServer((req, res) => {
    void handle(req, res).catch(() => {
      if (!res.headersSent) {
        sendJson(res, 500, { error: "internal" });
      } else {
        res.end();
      }
    });
  });
}

export function start(port = Number(process.env.PORT) || 3000): Server {
  const server = createApp();
  server.listen(port, "0.0.0.0");
  return server;
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  const server = start();
  server.on("listening", () => {
    const addr = server.address();
    const shown = typeof addr === "object" && addr ? addr.port : process.env.PORT || 3000;
    console.log(`listening on 0.0.0.0:${shown}`);
  });
}
