# Deployment 探针语义验收标本

这三份文件在 `deployment-health-probes` 的范围之外。范围只有 `deploy/semantic-acceptance/**`。本目录不会因为合入策略而变成生效清单，也不表示真实模型已经跑过。

`github.com/kayinli/docket` 的 `docs/semantic-admission.md` 和 `fixtures/semantic/policy.example.yaml` 从这里读不到（仓库 404）。策略字段只使用公开控制台写入 `semantic_admission` 的那一组，并经 `POST /draft/validate` 确认加载器收下、`ignored_keys` 为空。没有另造字段。

标本只供对照，不要执行，也不要 `kubectl apply` 或 `helm template`。

| 目录 | 清单形状 | 合入后、同意齐备且模型真跑时的预期 |
| --- | --- | --- |
| `pass/` | 已展开的 Deployment。常规容器同时有 readinessProbe 和 livenessProbe。init 容器没有探针。 | 通过 |
| `violation/` | 已展开的 Deployment。常规容器两项探针都没有。init 容器也没有探针。 | 违规，`effect: block` 应让 `docket/gate` 失败 |
| `unexpanded/` | Helm 模板，探针包在未展开的 `{{ }}` 条件里。 | 无法判断。无法判断不是通过 |

当前部署上的语义准入开关是开的，单独语义同意缺失。同意缺失时，范围内变更应停在待人工，不会出站，也不能记成通过、违规已测或无法判断已测。本标本没有填补这个缺口。

后续三个真实用例要等本策略合入 `main` 之后，从当时的 `main` 各开一个 PR。每个 PR 只新增对应文件，把上表里的那一份原样放到范围路径下：

1. `deploy/semantic-acceptance/pass/deployment.yaml`
2. `deploy/semantic-acceptance/violation/deployment.yaml`
3. `deploy/semantic-acceptance/unexpanded/deployment.yaml`

这三个 PR 都不要改 `.github/workflows/**`，不要删除已有的、匹配 `health` 或 `ready` 的行，正文要有「回滚预案」。不要改现有的其他 open PR。策略未合入前不要开它们，也不要把本目录的标本说成模型结果。
