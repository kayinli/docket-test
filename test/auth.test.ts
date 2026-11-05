import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorized } from "../src/auth.ts";

test("未配置密钥时放行", () => {
  assert.equal(isAuthorized({}, undefined), true);
  assert.equal(isAuthorized({}, ""), true);
});

test("配置密钥后，缺少或错误的 header 拒绝", () => {
  assert.equal(isAuthorized({}, "secret"), false);
  assert.equal(isAuthorized({ "x-api-key": "" }, "secret"), false);
  assert.equal(isAuthorized({ "x-api-key": "nope" }, "secret"), false);
});

test("配置密钥且 header 匹配时放行", () => {
  assert.equal(isAuthorized({ "x-api-key": "secret" }, "secret"), true);
});
