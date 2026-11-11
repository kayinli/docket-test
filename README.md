# docket-test

这是 Docket（底账）的客户侧冒烟仓库，同时也是一个可以在本地跑起来的微型订单 HTTP 服务。它不是 Docket 产品仓库。

## 硬门禁和软分析

硬门禁只看 `.docket/policy.yaml` 里的规则，加上 `.docket/evals/`。本仓库当前三条规则的 id 不变。`protect-workflows` 与第三条 diff_signal 规则的 mode 是 `block`（命中后 Check `docket/gate` 失败），`rollback-section` 仍是 `warn`：

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

## 自然语言语义准入

上面三条规则的 id、类型和 mode 不变，`govern.mode` 仍是 `all_non_draft`。策略另有并列块 `semantic_admission`，不嵌在 `govern` 或 `rules` 里。规则 id 是 `deployment-health-probes`，`effect` 是 `block`，范围只有 `deploy/semantic-acceptance/**`。

非草稿 PR 都会跑这条规则，不是只有 diff 改到范围才跑。范围内零文件时覆盖是 gap，不能当成不适用。`deploy/semantic-acceptance/deployment.yaml` 是范围内的合格基线：一个常规容器，同时有 readinessProbe 和 livenessProbe，没有 initContainers。

未展开、因而判断不了的清单不能当作通过。init 例外不在这次验收里，先不声称可用。后续三种真实用例都是改这一份基线，说明在 `fixtures/semantic-admission/README.md`。真实模型还没有跑过。单独的语义准入同意缺失时，不能把待人工写成通过。
