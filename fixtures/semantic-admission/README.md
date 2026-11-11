# Deployment 探针语义验收

生效对象只有一份：`deploy/semantic-acceptance/deployment.yaml`。它是范围内的合格健康基线。`govern.mode` 为 `all_non_draft` 时，非草稿 PR 都会跑 `deployment-health-probes`，不是只有 diff 改到范围才跑。范围内零文件时 `coverage=gap`（范围内没有文件，不能当成不适用），会把这些 PR 留在无法判断。基线用来避免零材料。

本目录三份清单是这同一个文件的三种改法，对照用，不放进范围，也不另加第二份 Deployment。不要把三份一起放进 `deploy/semantic-acceptance/`。真实模型还没有跑过。不要执行这些文件，也不要 `kubectl apply` 或 `helm template`。

`github.com/kayinli/docket` 的 `src/semantic-context.ts` 这次仍然 404。`coverage=gap` 与 `missingProbe` 的行为按已说明的生产实现处理，没有从源文件核对正则。

基线和三份对照都只有一个常规容器，没有 `initContainers`。`initContainers` 可能触发程序基于正则的 `missingProbe` 保守校验。init 例外留作后续独立边界验收，这次不声称可用。

| 对照 | 相对基线 | 同意齐备且模型真跑之后才适用的预期 |
| --- | --- | --- |
| `pass/deployment.yaml` | 只把 `replicas` 从 1 改为 2，两项探针保留 | 通过 |
| `violation/deployment.yaml` | 去掉常规容器的 readinessProbe 和 livenessProbe | 违规，`effect: block` 应让 `docket/gate` 失败 |
| `unexpanded/deployment.yaml` | 整份换成未展开的 Helm 模板，探针仍在 `{{ }}` 条件里 | 无法判断。无法判断不是通过 |

等本策略合入 `main` 之后，从当时的 `main` 分别开三个 PR。每个 PR 只改 `deploy/semantic-acceptance/deployment.yaml`，改成上表对应的那一版。三个 PR 互相独立，都以含基线的 `main` 为 base，不要叠在一起。

去掉探针或换成未展开模板时，diff 会删掉含 `readinessProbe`、`/ready`、`/health` 的行，既有 `drop-healthcheck` 也会命中。这次不改那条规则。

每个后续 PR 都不改 `.github/workflows/**`，正文要有「回滚预案」。不要改现有的其他 open PR。策略未合入前不要开它们。单独语义同意仍然缺失；同意缺失时范围内变更应停在待人工，不能记成通过、违规已测或无法判断已测。
