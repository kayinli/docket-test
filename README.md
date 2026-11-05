# docket-test

这是 Docket（底账）的客户侧冒烟仓库，同时也是一个可以在本地跑起来的微型订单 HTTP 服务。它不是 Docket 产品仓库。

## 硬门禁和软分析

硬门禁只看 `.docket/policy.yaml` 里的规则，加上 `.docket/evals/`。本仓库当前三条规则的 id 不变，模式都是 `warn`：

| id | 类型 | 会在什么时候出警告 |
| --- | --- | --- |
| `protect-workflows` | `path_match` | PR 改了 `.github/workflows/**` |
| `rollback-section` | `pr_section` | PR 正文没有「回滚预案」这一节 |
| `drop-healthcheck` | `diff_signal` | diff 删掉了匹配 `health\|ready` 的行 |

`warn_check: success` 表示命中之后 Check `docket/gate` 仍然成功，只是带警告。软分析不是第五类规则，也不会写入 `hits[]`，更不会改 policy 或 gate。它是旁注：`POST /console/analyze` 拿本 PR 的 diff 和规则列表，把发现归到例如 `protected_path`、`deleted_line`、`missing_section`、`known_pattern`、`already_covered`、`not_expressible`。

## 怎么跑

需要 Node.js 22.18 或更新版本。没有第三方依赖。

```bash
npm test
npm start
```

服务监听 `0.0.0.0:$PORT`，没设 `PORT` 时用 `3000`。

```bash
curl -s localhost:3000/health
curl -s localhost:3000/ready
curl -s -X POST localhost:3000/orders \
  -H 'content-type: application/json' \
  -d '{"sku":"mug","qty":2,"unitPriceCents":500}'
curl -s localhost:3000/orders/1
```

订单存在进程内存里，重启即丢。金额单位是整数「分」，总价 = 数量 × 单价。

没设置 `DOCKET_API_KEY` 时，订单接口为了本地冒烟会放行。设置之后，`POST /orders` 和 `GET /orders/:id` 必须带匹配的 `x-api-key`。`/health` 和 `/ready` 始终公开。不要把真实密钥写进仓库。

## 规则种子刻意留着

- `src/probe.ts` 里保留匹配 `health|ready` 的导出行。删掉或注释掉它，`drop-healthcheck` 会警告。活的探针是 `GET /health` 和 `GET /ready`。
- `.github/workflows/ci.yml` 在 pull request 上跑 `npm test`。改这个文件会让 `protect-workflows` 警告。
- 希望 `rollback-section` 不响时，PR 正文要有「回滚预案」一节。

进程内订单在重启后清空。这只是演示服务，不是生产账本。
