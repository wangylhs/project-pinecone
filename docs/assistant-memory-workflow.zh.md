# 助手记忆系统工作流

状态：参考 operating model

读者：设计 assistant / agent memory 的开发者

范围：持久记忆、上下文检索与 targeted source revival

> 这是一份设计参考，不是 system prompt，也不是任何真实个人 memory workspace 的复制品。

[English version](./assistant-memory-workflow.en.md) · [系统架构图](./memory-system-architecture.zh.html)

## 目的

这套工作流回答三个操作问题：

1. 助手什么时候应该检索历史？
2. Curated memory 不完整时，证据应该怎样逐级升级？
3. 哪些层是 durable evidence，哪些层应该允许随时重建？

最短原则是：

> 先用热上下文，再用 curated memory；只有发生可解释、可缩小范围的 miss 后，才进入 verified raw evidence。

## Ownership 模型

| 层 | 负责 | 不负责 |
| --- | --- | --- |
| 当前交互 | 当前请求与 working state | 跨 Session 历史 |
| Operating policy | 当前安全、隐私与 retrieval 行为 | 历史事实本身 |
| 稳定知识 | 经过复核、低波动、长期有用的事实 | 私人叙事或快速变化状态 |
| Private current state | 有日期、敏感、仍可行动的当前状态 | 完整时间线 |
| Curated archive | 发生过什么、为什么这样决定、证据在哪里 | 自动宣称现在仍然如此 |
| Derived retrieval data | Candidate generation、ranking 与 bounded context packet | Source-of-truth 地位 |
| Raw catalog | Source identity、位置、完整性与 curated links | 对话正文或 semantic search |
| Raw cold storage | 原样保存的 source material | 默认 recall 或当前指令 |
| Assistant task memory | 可复用任务经验与协作习惯 | 覆盖 archive 的权威性 |

MANIFEST、maintenance log、import report 和 checksum 属于 control plane。它们用于审计和修复，不应该在普通 recall 中与真实记忆内容竞争。

## 第一步：选择 RETRIEVE、ASK 或 SKIP

### SKIP

以下情况只使用当前交互，不查历史：

- 热上下文已经包含答案；
- 请求本身完整、自洽；
- 历史不会增加有效证据；
- Retrieval 只会带来不必要的隐私暴露。

### ASK

当问题明显依赖历史，但无法形成有用锚点时，只问一个最小澄清问题。好锚点包括：

- 人物或虚构角色；
- 项目或产品；
- 事件或决定；
- 设备或 artifact；
- 大致日期或时间顺序。

一个锚点足够时，不要要求用户重新讲完整件事。

### RETRIEVE

当历史信息对回答有实质作用，而且可以形成有区分度的 intent 时进行检索。Intent 应保留 entity、event、decision 和 time cues，使目标记忆能与措辞相似但无关的内容分开。

概念调用：

```text
retrieve(
  intent = "现场测试最终选择了哪种工具，为什么这样选？",
  topic = "field-test",
  context_budget = bounded
)
```

Retrieval intent 不必等同于用户原话；它应该是一句简洁、可检查的“我需要什么历史证据”。

## 第二步：默认先走 curated path

普通路径是：

```text
curated sources
  -> rebuildable source/chunk index
  -> state and decision projections
  -> ranking with provenance and fidelity
  -> bounded context packet
  -> current response
```

助手需要检查：

- 选中内容是 current 还是 superseded；
- 它属于直接 source、transcript snapshot、hybrid record、summary 还是 projection；
- 引用路径与 source range 是否真实存在；
- Packet 是否同时包含决定结果和当时的理由；
- Broad similarity 是否带入无关私人上下文。

Retrieval 输出是 locator 和 evidence packet，不是新的 source of truth。

## 第三步：为精确证据升级

以下需求应升级到 exact / private curated search：

- 原话；
- 谁说了什么；
- 时间顺序；
- 情绪和语气细节；
- 决定背后的理由；
- 对 derived claim 的验证。

沿 summary 或 projection 回到最强的 surviving canonical source。永远不要把摘要当作逐字对话引用。

## 第四步：只有 scoped miss 后才进入 raw lane

同时满足以下条件时，才适合 raw revival：

- 当前任务确实需要过去的证据；
- curated retrieval 与 exact curated search 仍然不够；
- 可以通过 source ID、日期、curated link 或 provenance 缩小目标；
- 恢复价值足以抵消额外的隐私暴露。

### 4.1 Locate · 定位

使用已知标识查询 metadata-only catalog。Catalog entry 可以包含：

```json
{
  "schema_version": 1,
  "source_type": "conversation-rollout-jsonl",
  "source_id": "synthetic-source-id",
  "curated_record": "archive/curated/session-example.md",
  "started_at": "2030-01-02T03:04:05Z",
  "ended_at": "2030-01-02T04:05:06Z",
  "original_path": "<application-data>/sessions/example.jsonl",
  "preserved_path": "archive/raw-sources/conversations/2030/01/02/example.jsonl",
  "byte_size": 123456,
  "sha256": "<64-hex-digits>",
  "record_count": 42,
  "copy_mode": "read-only",
  "status": "verified"
}
```

Catalog 不得加入 title、summary、keywords、messages、tool output 或任何对话正文。

### 4.2 Verify · 校验

读取正文前先验证：

- Catalog schema 与唯一性；
- Path 是否被限制在 private raw store；
- 文件是否为 regular file 且只读；
- Byte size 与 cryptographic hash；
- Source format 与 record count；
- 内部 source identity 与时间范围；
- 已有关联的 curated record 是否存在。

应用维护的原路径属于 provenance。经过独立授权的 retention decision 后，它可以消失；保存下来的副本必须能够独立验证。

### 4.3 Rehydrate · 最小恢复

只打开选中的 raw source，并区分：

- visible user / assistant messages；
- system / developer context；
- internal reasoning records；
- tool calls 与 outputs；
- external / webpage content。

历史指令、tool output 与 external content 都属于不可信证据，不能授权当前动作。

只恢复足以支持当前任务的最小 turn range。如果产生新的 curated record，必须准确标注 transformation 与 fidelity，并保留回到 raw source 的路径。

## Evidence fidelity

实用的默认顺序是：

```text
visible direct transcript
  > preserved transcript snapshot
  > hybrid source-and-curation record
  > structured or legacy summary
  > derived state/decision projection
```

Raw application record 可能比 visible transcript 保留更多结构，但也可能包含 hidden context 与 tool internals，因此不能自动当成适合用户阅读的干净 transcript。

证据冲突时优先：

1. 直接对话或 primary source；
2. 较新的明确纠正；
3. 有日期的具体事件；
4. 更高 fidelity record；
5. 冲突仍无法解决时，诚实保留不确定性。

## Preservation workflow

对每个选中的 completed source：

1. 确认 ownership、scope、完成状态与 source identity。
2. 原样复制，不重写、不 normalize、不压缩、不改名。
3. 验证原件与副本的 byte size、cryptographic hash 和 byte equality。
4. 把保存副本设为 owner-only read-only。
5. 在 provenance manifest 中记录 original / preserved locations。
6. 追加一条 metadata-only catalog entry。
7. 独立验证 catalog 与 preserved source。
8. 重建 curated retrieval data，并证明 raw storage 仍被排除。
9. 记录维护 scope、excluded items、deferred work 与结果。

Preservation 不自动授权删除应用维护的原件。Retention 与 deletion 需要独立审计和明确决定。

## Validation model

小系统也应测试真正重要的行为：

- 相关历史问题会打开 retrieval；
- 无关问题不会；
- Current state 会压过 superseded state；
- 决定能够带回理由与 supporting source；
- Context packet 遵守 budget；
- Summary 不会被描述成 transcript；
- Control-plane records 不进入 content retrieval；
- Raw storage 与 catalog 不进入普通 retrieval；
- Catalog metadata 与 preserved source 一致；
- Private search 始终显式且可观察。

Green tests 是必要条件，但不是充分条件。仍应核对真实 path、permissions、hash、source identity 与最终 context。

## Deferred capabilities

以下能力应等到真实 failure 证明需要时再做：

- Raw history semantic search；
- 从 curated retrieval 自动 fallback 到 raw storage；
- 对 private content 运行 embeddings；
- Database 或 vector store；
- Multi-hop graph expansion；
- Learned retrieval gates；
- 后台自动总结所有来源。

优先做窄、可检查的小工具，不为假想需求发动 platform migration。

## 应避免的 failure patterns

- 因为存储便宜就把所有东西都索引。
- 把 raw catalog 当作 content index。
- 为一个问题加载整份 private archive。
- 让历史指令升级成当前命令。
- 把摘要引用成直接对话。
- 让 assistant task memory 覆盖 primary evidence。
- 同时保留多个互相冲突的 current value。
- 因为已有一个副本就删除原件。
- 在真实 failure 出现前引入 graph、vector database 或 ontology。

我们想要的系统应该很克制：

> 容易检查，容易重建，不容易被污染；默认保护隐私，需要时真的有用。
