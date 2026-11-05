import type { IncomingHttpHeaders } from "node:http";

export const API_KEY_HEADER = "x-api-key";

/**
 * 软点：未配置 DOCKET_API_KEY 时全部放行，方便本地冒烟。
 * 一旦配置了密钥，缺少或错误的 x-api-key 必须拒绝。
 * 后续演示可以把「请求没带 header」恶化成同样放行。
 */
export function isAuthorized(headers: IncomingHttpHeaders, expectedKey: string | undefined): boolean {
  if (expectedKey == null || expectedKey === "") {
    return true;
  }
  const presented = headers[API_KEY_HEADER];
  const value = Array.isArray(presented) ? presented[0] : presented;
  return typeof value === "string" && value.length > 0 && value === expectedKey;
}
