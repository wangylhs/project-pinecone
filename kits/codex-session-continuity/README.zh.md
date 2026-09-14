# Codex 会话连续性套件

[English](./README.md) · [网页版](https://wangylhs.github.io/project-pinecone/docs/session-continuity.zh.html) · [为什么这样设计](../../docs/assistant-memory-workflow.zh.md#检索之前先对齐时间和对话状态)

Agent 没有时间感，新 Session 也总是从零开始。离开一夜回来说一句"早上好"，它会当作一分钟前的延续来回答。开一个新 Session，刚才的梗、情绪、说好明天继续的事，都要重新讲一遍才接得上。

这个套件给 [Codex](https://github.com/openai/codex) 加两个需要手动触发的命令：

| 命令 | 什么时候用 | Agent 得到什么 |
| --- | --- | --- |
| `$time-sync` | 回来的时候 | 本地时间，以及宿主测出的距离你上一条消息过了多久 |
| `$handoff` | 离开一个 Session 之前 | 暂时什么都不注入：它为下一个 Session 写一份小包 |

两层互相补位。同一个 Session 里，时间差从 transcript 算；全新的 Session 没有上一条消息，`$time-sync` 就改为带上最近一次 handoff，并附上它写于多久之前。

不输入命令就什么都不会运行。没有数据库，没有后台进程，除了 Python 3.9+ 没有其他依赖。

## Agent 看到什么

新 Session 里的第一次 `$time-sync`，前一晚留过 handoff：

```text
TemporalSync error=no preceding user message. Do not infer elapsed time.
SessionHandoff source_session=0a0a0a0a-0000-4000-8000-000000000001; written_at=2030-01-02T22:41:07+01:00; age=9h 12m. Host-read packet from a previous Session's $handoff: recorded observations, not verified current state.
## Mood
Tired after the ridge survey, but in good spirits

## Unfinished
- Recalibrate the snow gauge before the next storm

## Phrases
- velvet teapot protocol — the crew's name for boiling water twice at altitude

## Last topic
Where to pitch camp two; ended with good night
```

Skill 会要求 agent 把这些当作带日期的观察，在合适的时候自然接上，不要复述整份内容。同一个 Session 里之后再发 `$time-sync`，只多两行：`TemporalSync local=…; previous_user=…; gap=…` 和 `SessionHandoff omitted: already provided earlier in this Session.`

## 安装

1. 把这个目录下的 `.codex/` 和 `.agents/` 复制到你的 Git 仓库根目录。如果已经有 `.codex/hooks.json`，把两个 `UserPromptSubmit` handler 合并进去。
2. **信任这两个 hook。** Codex 不会运行新增或被修改过的 hook，直到你审核通过；而且没被信任的 hook 不会报错，agent 只会发现 context 缺失。在仓库里打开 Codex CLI，接受 *Hooks need review* 提示，或者运行 `/hooks`。以后每次改 `hooks.json` 都要重新做一遍——哪怕只改了 `additionalContextLimit`，信任也会失效。
3. 开一个新 Session，让 skill 生效。

小包写在 `.session-continuity/handoff.md`。这个目录第一次写入时会自动生成 `.gitignore`，情绪笔记不会被意外提交。想换位置的话，设置 `SESSION_HANDOFF_PATH`。

在这个目录下运行测试：

```sh
python3 -m unittest discover -s tests
```

## 使用

- 离开时：`$handoff 晚安`。Agent 通过唯一一个带校验的写入命令保存小包，并简单说一句已保存。
- 回来时：`$time-sync 早上好`。放在新 Session 的第一条消息里，也可以在 Session 中途随时用。

## 每种状态都显式说明

一片空白只意味着 hook 没有运行，所以其他每种结果都会说清楚发生了什么：

| 注入内容 | 含义 |
| --- | --- |
| `TemporalSync local=…; gap=…` | 距离本 Session 上一条消息测出的时间差 |
| `TemporalSync error=no preceding user message` | 新 Session；改用 handoff 的 `age` |
| `SessionHandoff source_session=…; age=…` | 后面跟着小包内容 |
| `SessionHandoff later_activity=…` | handoff 写完之后，这个仓库里还有 Codex 对话在进行 |
| `SessionHandoff long_gap` | 超过 7 天：继续跟进未完成的事，不接上次的语气 |
| `SessionHandoff omitted: …` | 小包就是在本 Session 写的，或者本 Session 已经注入过 |
| `SessionHandoff unavailable` / `error=…` | 没有可用的 handoff；agent 不能猜 |
| `HandoffTarget source_session=…` | agent 写入小包时使用的 id |

## 设计要点

- **宿主测量，agent 不推断。** 时间差来自 transcript 的时间戳。测量失败就直接说，不估算。
- **跳过宿主自己注入的内容。** 找"上一条用户消息"时，要忽略客户端自己加进去的 user 角色内容：指令、环境信息、skill 内容、中断标记。否则第一轮测出的时间差永远是 0。
- **两种 mention 格式都识别。** CLI 把 `$time-sync` 作为纯文本发送，Desktop 发送的是 Markdown 链接。
- **模型负责写，宿主负责身份。** 只有模型能做总结，只有宿主知道 Session id。一个小 hook 提供 id；唯一的写入命令先校验固定模板再覆盖，被拒绝的小包永远不会替换掉好的那份。
- **只有一份，每次覆盖。** 不做版本、不进索引、不当归档。它只是热上下文，不会慢慢长成第二套记忆。
- **情绪是观察，不是指令。** 新 Session 里用户当下的状态为准；隔得太久就不接上次的语气。
- **前一个 rollout 不等于上一次对话。** Codex 的 session 目录里混着其他仓库、subagent 和审核线程。只统计工作目录就是本仓库的用户线程，并且报告"之后还有活动"，而不是断言"没有更新的对话"。来源 Session 有 10 分钟宽限，留给 `$handoff` 之后的道别。
- **每个 Session 只注入一次。** 小包在一个 Session 的第一次 `$time-sync` 注入，之后只占一行。
- **有预算。** 小包最多 800 字符，每行最多 160 字符。Codex 没有写明上限的单位，所以最坏情况按 UTF-8 字节计算，也在 hook 的 4000 上限以内。

## 局限

- 依赖 Codex 的具体实现：hook 事件里的 `transcript_path`、以 Session id 结尾的 rollout 文件名，以及 `session_meta` 里的 `cwd` 和 `thread_source` 字段。在 macOS 上基于 Codex 0.154（CLI 与 Desktop）开发；其他版本和平台未测试。
- 必须是 Git 仓库；hook 命令用 `git rev-parse` 定位路径。
- `later_activity` 比较的是 rollout 文件的修改时间，同一仓库里无关的工作也可能被标出来。它只说 handoff *可能*没覆盖到，不会说得更重。
- Handoff 只装一个 Session 的热上下文，不能替代持久记忆，也不代表任何事情现在仍然成立。
- 这套机制可以迁移到其他 agent 宿主，但 transcript 解析和 hook 约定不能照搬。目前还没有移植。
