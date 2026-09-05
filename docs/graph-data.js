/* Project Pinecone · Memory Graph Explorer — synthetic fixture.
 *
 * Every person, Session, decision and state below is fictional. The fixture
 * dramatizes the candidate evaluations written down in DRAFT.md; it does not
 * mirror any private memory workspace.
 *
 * Share the method. Protect the memory.
 */

window.PINECONE_GRAPH = {
  meta: {
    asOf: "2030-01-14",
    budget: 1600,
    world: { en: "Aurora Ridge expedition · synthetic fixture", zh: "Aurora Ridge 远征 · 合成数据" }
  },

  /* ---------------------------------------------------------------- ui --- */

  ui: {
    title: { en: "Memory Graph Explorer", zh: "Memory Graph Explorer" },
    subtitle: {
      en: "Watch one question walk a memory graph and leave with a context packet.",
      zh: "看一个问题在 memory graph 里走一遍，然后带走一个 context packet。"
    },
    play: { en: "Start retrieval", zh: "开始检索" },
    pause: { en: "Pause", zh: "暂停" },
    replay: { en: "Replay", zh: "重播" },
    step: { en: "Step", zh: "单步" },
    reset: { en: "Reset", zh: "重置" },
    relayout: { en: "Re-layout", zh: "重新布局" },
    fit: { en: "Fit", zh: "适配" },
    zoomIn: { en: "Zoom in", zh: "放大" },
    zoomOut: { en: "Zoom out", zh: "缩小" },
    cinema: { en: "Cinema", zh: "全屏演示" },
    exitCinema: { en: "Exit cinema", zh: "退出演示" },
    theme: { en: "Theme", zh: "主题" },
    speed: { en: "Speed", zh: "速度" },
    stagesTitle: { en: "Retrieval stages", zh: "检索阶段" },
    legendTitle: { en: "Legend", zh: "图例" },
    nodesLegend: { en: "Nodes", zh: "节点" },
    edgesLegend: { en: "Edges", zh: "关系" },
    inspectorTitle: { en: "Inspector", zh: "节点详情" },
    packetTitle: { en: "Context Packet", zh: "Context Packet" },
    inspectorEmpty: {
      en: "Click any node to read it. Drag to move nodes, drag the background to pan, scroll to zoom.",
      zh: "点任意节点查看内容。拖动节点可以移动，拖背景可以平移，滚轮缩放。"
    },
    packetEmpty: {
      en: "Empty. Run the retrieval and the surviving nodes gather here, in packing order.",
      zh: "还是空的。跑一次检索，存活下来的节点会按打包顺序聚到这里。"
    },
    budgetLabel: { en: "Context budget", zh: "Context budget" },
    packetJson: { en: "packet.json", zh: "packet.json" },
    showJson: { en: "Show packet.json", zh: "查看 packet.json" },
    hideJson: { en: "Hide packet.json", zh: "收起 packet.json" },
    connections: { en: "Connections", zh: "关系" },
    labelsHeading: { en: "Evidence labels", zh: "证据标签" },
    fieldsHeading: { en: "Fields", zh: "字段" },
    statusHeading: { en: "In this run", zh: "本次检索中" },
    idle: { en: "Not evaluated yet", zh: "尚未参与本次检索" },
    pinned: { en: "pinned · double-click to release", zh: "已固定 · 双击解除" },
    asOf: { en: "as_of", zh: "as_of" },
    ready: {
      en: "Ready. 19 fictional nodes, 32 relations, one question.",
      zh: "准备就绪：19 个虚构节点、32 条关系、一个问题。"
    },
    kbd: {
      en: "Space play / pause · → step · R reset · F fit · C cinema",
      zh: "空格 播放/暂停 · → 单步 · R 重置 · F 适配 · C 演示模式"
    },
    footer: {
      en: "Fictional data throughout. Share the method. Protect the memory.",
      zh: "全部为虚构数据。Share the method. Protect the memory."
    },
    back: { en: "← Project Pinecone", zh: "← 返回 Project Pinecone" }
  },

  /* ------------------------------------------------------------- types --- */

  nodeTypes: {
    query:    { name: { en: "query",    zh: "query · 提问" },     shape: "diamond" },
    person:   { name: { en: "person",   zh: "person · 人物" },    shape: "circle" },
    topic:    { name: { en: "topic",    zh: "topic · 主题" },     shape: "hexagon" },
    state:    { name: { en: "state",    zh: "state · 当前状态" }, shape: "squircle" },
    decision: { name: { en: "decision", zh: "decision · 决策" },  shape: "pentagon" },
    session:  { name: { en: "Session",  zh: "Session · 来源" },   shape: "card" }
  },

  edgeTypes: {
    related:    { name: { en: "related",    zh: "related · 相关" },     hint: { en: "topic or field overlap", zh: "topic / 字段重叠" } },
    source:     { name: { en: "source",     zh: "source · 溯源" },      hint: { en: "provenance back to a canonical Session", zh: "回到 canonical Session 的 provenance" } },
    supersedes: { name: { en: "supersedes", zh: "supersedes · 取代" },  hint: { en: "the successor of a changed choice", zh: "被改掉的选择及其后继" } },
    mentions:   { name: { en: "mentions",   zh: "mentions · 提及" },    hint: { en: "an entity named by a record", zh: "记录里提到的 entity" } }
  },

  labels: {
    provenance_supported:    { en: "selected through an explicit source link", zh: "通过显式 source link 选中" },
    structured_context:      { en: "supported by topic, entity, state or decision fields", zh: "有 topic / entity / state / decision 字段支撑" },
    lexical_only:            { en: "wording overlaps, nothing stronger supports it", zh: "只有字面重叠，没有更强的上下文支撑" },
    checkpoint_passed:       { en: "a review date passed with no later confirmation", zh: "已过复核检查点且没有更新的确认" },
    conflicting_or_superseded: { en: "useful as history, unsafe as current state", zh: "作为历史有用，作为当前状态不安全" }
  },

  statuses: {
    candidate: { en: "recalled as a candidate", zh: "已作为候选召回" },
    kept:      { en: "kept after structured filtering", zh: "通过结构化过滤，保留" },
    held:      { en: "held back — history only", zh: "暂时挡下 — 只能作为历史" },
    rejected:  { en: "rejected", zh: "被拒绝" },
    packed:    { en: "packed into the context packet", zh: "已打进 context packet" }
  },

  /* ------------------------------------------------------------- nodes --- */

  nodes: [
    {
      id: "query.why_paper",
      type: "query",
      name: { en: "Why paper logs?", zh: "当初为什么用纸质日志？" },
      title: {
        en: "Why did the expedition originally choose paper logs?",
        zh: "远征队当初为什么选择纸质日志？"
      },
      body: {
        en: "A history question about a choice that has since changed. It needs the current decision, the one it replaced, and the old rationale — not a fresh recommendation to go back to paper.",
        zh: "这是一个关于「后来已经被改掉的选择」的历史问题。它需要当前 decision、被取代的旧 decision 和当年的理由，而不是把纸质日志重新推荐成现在的做法。"
      },
      fields: [
        { k: "resolver", v: "RETRIEVE" },
        { k: "as_of", v: "2030-01-14" },
        { k: "hints", v: "topic:logbook · entity:observatory_captain" }
      ]
    },

    {
      id: "person.observatory_captain",
      type: "person",
      name: "observatory_captain",
      title: { en: "Ivo Lund · observatory captain", zh: "Ivo Lund · observatory captain" },
      body: {
        en: "A canonical entity ID. The alias “observatory captain” is accepted as a query hint; the bare word “captain” is never enough to bind a mention to this entity.",
        zh: "canonical entity ID。别名 “observatory captain” 可以作为 query hint；但只写 “captain” 永远不足以把一条 mention 绑到这个 entity 上。"
      },
      fields: [
        { k: "canonical_id", v: "observatory_captain" },
        { k: "alias", v: "“observatory captain”" },
        { k: "scope", v: "field_test" }
      ]
    },
    {
      id: "person.harbor_captain",
      type: "person",
      name: "harbor_captain",
      title: { en: "Mira Sol · harbor captain", zh: "Mira Sol · harbor captain" },
      body: {
        en: "A second fictional project with its own captain. It exists so the graph can demonstrate that “captain” alone never resolves to the observatory entity.",
        zh: "另一个虚构项目里的 captain。它存在的意义就是证明：单独一个 “captain” 不会被解析成 observatory 的那个 entity。"
      },
      fields: [
        { k: "canonical_id", v: "harbor_captain" },
        { k: "scope", v: "harbor_ops" }
      ]
    },
    {
      id: "person.field_engineer",
      type: "person",
      name: "field_engineer",
      title: { en: "Tam Oyelaran · field engineer", zh: "Tam Oyelaran · field engineer" },
      body: {
        en: "Keeps the power log and the provisions list. Being adjacent to a kept state does not make every record about this person relevant.",
        zh: "负责电力记录和补给清单。和一条被保留的 state 相邻，并不代表关于这个人的每条记录都相关。"
      },
      fields: [{ k: "canonical_id", v: "field_engineer" }, { k: "scope", v: "field_test" }]
    },

    {
      id: "topic.logbook",
      type: "topic",
      name: "logbook",
      title: { en: "topic · logbook", zh: "topic · logbook" },
      body: {
        en: "How observations are recorded. The query hint lands here first, which is why recall starts from this node.",
        zh: "记录观测的方式。query hint 首先落在这里，所以召回从这个节点开始扩散。"
      },
      fields: [{ k: "canonical_id", v: "logbook" }, { k: "records", v: "5" }]
    },
    {
      id: "topic.field_test",
      type: "topic",
      name: "field_test",
      title: { en: "topic · field_test", zh: "topic · field_test" },
      body: {
        en: "The expedition scope. A record once carried the typo “feild_test”; strict label validation rejected the build, named the record and the field, and kept the previous index in place until it was fixed.",
        zh: "远征的范围标签。曾经有条记录写成 “feild_test”；严格的 label validation 直接让这次构建失败、点名记录与字段，并保留上一版索引，直到拼写被改正。"
      },
      fields: [{ k: "canonical_id", v: "field_test" }, { k: "rejected_typo", v: "feild_test" }]
    },
    {
      id: "topic.provisions",
      type: "topic",
      name: "provisions",
      title: { en: "topic · provisions", zh: "topic · provisions" },
      body: {
        en: "Food and supply preferences. Adjacent to field_test, and that adjacency alone is what drags a milk sentence into a logbook question.",
        zh: "食物与补给偏好。它和 field_test 相邻，而正是这种相邻，把一句关于牛奶的话拖进了关于日志的问题里。"
      },
      fields: [{ k: "canonical_id", v: "provisions" }]
    },
    {
      id: "topic.harbor_ops",
      type: "topic",
      name: "harbor_ops",
      title: { en: "topic · harbor_ops", zh: "topic · harbor_ops" },
      body: {
        en: "The other project's scope. Same vocabulary, different world.",
        zh: "另一个项目的范围。词汇一样，世界不一样。"
      },
      fields: [{ k: "canonical_id", v: "harbor_ops" }]
    },

    {
      id: "state.logging_medium",
      type: "state",
      name: "state.logging_medium",
      title: {
        en: "Observations are recorded on the offline tablet.",
        zh: "观测记录写在离线平板上。"
      },
      body: {
        en: "A time-aware state with no TTL. expected_resolution_at is a checkpoint, not an expiry date: past it with no later confirmation, the state keeps its rank and gains a visible review note.",
        zh: "带时间信息但没有 TTL 的 state。expected_resolution_at 是复核检查点，不是失效日期：过了这个点又没有更新确认，它不会消失，而是保留原有排序、附上一条可见的复核提示。"
      },
      fields: [
        { k: "observed_at", v: "2030-01-02" },
        { k: "valid_from", v: "2030-01-02" },
        { k: "valid_to", v: "null" },
        { k: "last_confirmed_at", v: "2030-01-05" },
        { k: "expected_resolution_at", v: "2030-01-10" },
        { k: "status", v: "active" }
      ]
    },
    {
      id: "state.paper_stock",
      type: "state",
      name: "state.paper_stock",
      title: { en: "Paper logs are the primary medium.", zh: "纸质日志是主要记录介质。" },
      body: {
        en: "A superseded state value. It stays readable as history and stays out of current state — a superseded state is never admitted as an answer about now.",
        zh: "已经被取代的 state 值。它作为历史仍可读，但不会进入 current state —— 被 supersede 的状态永远不会被当成「现在」的答案。"
      },
      fields: [
        { k: "valid_from", v: "2029-12-20" },
        { k: "valid_to", v: "2030-01-02" },
        { k: "status", v: "superseded" },
        { k: "superseded_by", v: "state.logging_medium" }
      ]
    },
    {
      id: "state.power_budget",
      type: "state",
      name: "state.power_budget",
      title: { en: "The solar bank holds a 40% reserve.", zh: "太阳能电池组保持 40% 余量。" },
      body: {
        en: "Why an offline tablet is affordable at all. Structured context, freshly confirmed, cheap to carry.",
        zh: "离线平板之所以「用得起」的原因。结构化上下文，刚刚确认过，携带成本也低。"
      },
      fields: [
        { k: "observed_at", v: "2030-01-11" },
        { k: "last_confirmed_at", v: "2030-01-11" },
        { k: "status", v: "active" }
      ]
    },
    {
      id: "state.milk_dislike",
      type: "state",
      name: "state.milk_dislike",
      title: { en: "The crew does not like powdered milk.", zh: "队员不喜欢奶粉冲的牛奶。" },
      body: {
        en: "Similar wording, different context: a negative preference sentence that an embedding happily returns for a negative-preference question. Topic provisions and a stable-constraint shape are what put it back out.",
        zh: "措辞相似、语境不同：一句「不喜欢」的话，embedding 很乐意把它返回给另一个「不喜欢」的问题。真正把它拦下来的，是 topic=provisions 和「稳定约束」这个形状。"
      },
      fields: [
        { k: "observed_at", v: "2029-12-30" },
        { k: "shape", v: "stable preference / constraint" },
        { k: "status", v: "active" }
      ]
    },

    {
      id: "decision.paper",
      type: "decision",
      name: "decision.paper",
      title: { en: "Chose a paper log, for simplicity.", zh: "当初选择纸质日志，因为够简单。" },
      body: {
        en: "The answer to the question asked — and the reason it must arrive labelled. Nothing to charge, nothing to crash, and a night shift can write with gloves on.",
        zh: "这正是问题要的答案 —— 也正因为如此，它必须带着「历史」的标签出现。不用充电、不会崩，夜班戴着手套也能写。"
      },
      fields: [
        { k: "status", v: "superseded" },
        { k: "decided_at", v: "2030-01-02" },
        { k: "superseded_by", v: "decision.tablet" }
      ]
    },
    {
      id: "decision.tablet",
      type: "decision",
      name: "decision.tablet",
      title: {
        en: "Chose an offline tablet, for searchable observations.",
        zh: "改用离线平板，为了观测记录可检索。"
      },
      body: {
        en: "The active decision and the anchor of the packet. Its direct predecessor is attached to it — one predecessor per selected successor, adjacent in the final packet.",
        zh: "当前生效的 decision，也是这个 packet 的锚点。它的直接前身会被挂在它后面 —— 每个被选中的后继只带一个前身，并且在最终 packet 里紧邻。"
      },
      fields: [
        { k: "status", v: "active" },
        { k: "decided_at", v: "2030-01-05" },
        { k: "supersedes", v: "decision.paper" }
      ]
    },
    {
      id: "decision.harbor_logbook",
      type: "decision",
      name: "decision.harbor_logbook",
      title: { en: "The harbor crew keeps a bound paper logbook.", zh: "港口班组沿用装订的纸质航海日志。" },
      body: {
        en: "Almost the same sentence, a different entity and topic. Retrieval has to be tested on results, not on whether an alias exists in config.",
        zh: "几乎是同一句话，但 entity 和 topic 都不同。要测的是真实检索结果，而不是「config 里有没有这个别名」。"
      },
      fields: [
        { k: "status", v: "active" },
        { k: "decided_at", v: "2029-12-18" },
        { k: "entity", v: "harbor_captain" }
      ]
    },

    {
      id: "session.014",
      type: "session",
      name: "Session 014",
      title: { en: "Session 014 · ridge camp setup", zh: "Session 014 · 山脊营地搭建" },
      body: {
        en: "Where the paper log was chosen and written down with its reason. Canonical, dated, quotable.",
        zh: "纸质日志在这里被选定，并连同理由一起写下。canonical、有日期、可引用。"
      },
      fields: [{ k: "date", v: "2030-01-02" }, { k: "fidelity", v: "verbatim" }]
    },
    {
      id: "session.019",
      type: "session",
      name: "Session 019",
      title: { en: "Session 019 · tablet trial", zh: "Session 019 · 平板试用" },
      body: {
        en: "The switch, and the last explicit confirmation of the logging state on 2030-01-05.",
        zh: "改用平板的那一次，也是 logging state 在 2030-01-05 最后一次被明确确认的地方。"
      },
      fields: [{ k: "date", v: "2030-01-05" }, { k: "fidelity", v: "verbatim" }]
    },
    {
      id: "session.023",
      type: "session",
      name: "Session 023",
      title: { en: "Session 023 · weekly review", zh: "Session 023 · 每周复盘" },
      body: {
        en: "Power reserve and provisions were reviewed here. Notice what is missing: nobody re-confirmed the logging medium, which is exactly why a checkpoint note appears later.",
        zh: "这里复盘了电力余量和补给。注意「没有发生的事」：没人再确认过记录介质，这正是后面会冒出复核提示的原因。"
      },
      fields: [{ k: "date", v: "2030-01-11" }, { k: "fidelity", v: "summary" }]
    },
    {
      id: "session.006",
      type: "session",
      name: "Session 006",
      title: { en: "Session 006 · harbor handover", zh: "Session 006 · 港口交接" },
      body: {
        en: "The other project's source. Reachable in two hops, and never in this answer.",
        zh: "另一个项目的来源。两跳就能走到，但永远不该出现在这个回答里。"
      },
      fields: [{ k: "date", v: "2029-12-18" }, { k: "fidelity", v: "verbatim" }]
    }
  ],

  /* ------------------------------------------------------------- edges --- */

  edges: [
    { id: "e01", from: "query.why_paper", to: "topic.logbook", kind: "mentions" },
    { id: "e02", from: "query.why_paper", to: "person.observatory_captain", kind: "mentions" },

    { id: "e03", from: "topic.logbook", to: "topic.field_test", kind: "related" },
    { id: "e04", from: "topic.logbook", to: "topic.harbor_ops", kind: "related" },
    { id: "e05", from: "topic.field_test", to: "topic.provisions", kind: "related" },

    { id: "e06", from: "decision.tablet", to: "topic.logbook", kind: "related" },
    { id: "e07", from: "decision.tablet", to: "topic.field_test", kind: "related" },
    { id: "e08", from: "decision.paper", to: "topic.logbook", kind: "related" },
    { id: "e09", from: "decision.harbor_logbook", to: "topic.harbor_ops", kind: "related" },
    { id: "e10", from: "state.logging_medium", to: "topic.logbook", kind: "related" },
    { id: "e11", from: "state.paper_stock", to: "topic.logbook", kind: "related" },
    { id: "e12", from: "state.power_budget", to: "topic.field_test", kind: "related" },
    { id: "e13", from: "state.milk_dislike", to: "topic.provisions", kind: "related" },

    { id: "e14", from: "decision.tablet", to: "person.observatory_captain", kind: "mentions" },
    { id: "e15", from: "decision.paper", to: "person.observatory_captain", kind: "mentions" },
    { id: "e16", from: "decision.harbor_logbook", to: "person.harbor_captain", kind: "mentions" },
    { id: "e17", from: "state.logging_medium", to: "person.observatory_captain", kind: "mentions" },
    { id: "e18", from: "state.power_budget", to: "person.field_engineer", kind: "mentions" },
    { id: "e19", from: "state.milk_dislike", to: "person.field_engineer", kind: "mentions" },

    { id: "e20", from: "decision.tablet", to: "decision.paper", kind: "supersedes" },
    { id: "e21", from: "state.logging_medium", to: "state.paper_stock", kind: "supersedes" },

    { id: "e22", from: "decision.paper", to: "session.014", kind: "source" },
    { id: "e23", from: "decision.tablet", to: "session.019", kind: "source" },
    { id: "e24", from: "state.logging_medium", to: "session.019", kind: "source" },
    { id: "e25", from: "state.paper_stock", to: "session.014", kind: "source" },
    { id: "e26", from: "state.power_budget", to: "session.023", kind: "source" },
    { id: "e27", from: "state.milk_dislike", to: "session.023", kind: "source" },
    { id: "e28", from: "decision.harbor_logbook", to: "session.006", kind: "source" },

    { id: "e29", from: "session.014", to: "person.observatory_captain", kind: "mentions" },
    { id: "e30", from: "session.019", to: "person.observatory_captain", kind: "mentions" },
    { id: "e31", from: "session.023", to: "person.field_engineer", kind: "mentions" },
    { id: "e32", from: "session.006", to: "person.harbor_captain", kind: "mentions" }
  ],

  /* ------------------------------------------------------------ stages --- */

  stages: [
    {
      id: "parse",
      name: { en: "Parse the question", zh: "解析问题" },
      note: {
        en: "The resolver answers RETRIEVE — not ASK, not SKIP — and pulls two permissive hints out of the wording.",
        zh: "Resolver 判定为 RETRIEVE —— 不是 ASK，也不是 SKIP —— 并从措辞里抽出两个宽松 hints。"
      },
      stat: { en: "RETRIEVE · 2 hints", zh: "RETRIEVE · 2 条 hints" },
      keep: ["query.why_paper", "topic.logbook", "person.observatory_captain"],
      pulse: ["e01", "e02"]
    },
    {
      id: "recall",
      name: { en: "Broad recall", zh: "广召回" },
      note: {
        en: "Similarity is allowed to over-reach here. “Paper logbook” drags in a second expedition; a sentence about not liking something drags in powdered milk.",
        zh: "这一步故意让相似度「捞过界」。“paper logbook” 顺带把另一支远征队拉了进来；一句「不喜欢」把奶粉牛奶也拉了进来。"
      },
      stat: { en: "10 candidates", zh: "10 个候选" },
      candidate: [
        "decision.tablet", "decision.paper", "decision.harbor_logbook",
        "state.logging_medium", "state.paper_stock", "state.power_budget", "state.milk_dislike",
        "topic.field_test", "topic.harbor_ops", "topic.provisions"
      ],
      pulse: ["e03", "e04", "e05", "e06", "e08", "e09", "e10", "e11", "e12", "e13"]
    },
    {
      id: "filter",
      name: { en: "Structured filter", zh: "结构化过滤" },
      note: {
        en: "Metadata restores the boundary that similarity blurred. Wrong entity, wrong topic, and a superseded state value all leave — and the old decision is held back rather than deleted.",
        zh: "相似度模糊掉的边界，由结构化 metadata 重新划回来。entity 不对、topic 不对、已被取代的 state 值，全部离场 —— 而那条旧 decision 是被「挡下」，不是被删掉。"
      },
      stat: { en: "3 kept · 1 held · 6 rejected", zh: "保留 3 · 挡下 1 · 拒绝 6" },
      keep: ["decision.tablet", "state.logging_medium", "state.power_budget"],
      hold: [
        { id: "decision.paper", label: "conflicting_or_superseded",
          why: { en: "superseded — history only, until a successor pulls it in", zh: "已被取代 —— 只能作为历史，等后继来带它进场" } }
      ],
      reject: [
        { id: "decision.harbor_logbook", label: "lexical_only",
          why: { en: "entity is harbor_captain · “captain” alone binds nothing", zh: "entity 是 harbor_captain · 单独一个 “captain” 绑不了任何人" } },
        { id: "topic.harbor_ops", why: { en: "out of scope", zh: "不在范围内" } },
        { id: "person.harbor_captain", why: { en: "other project", zh: "另一个项目" } },
        { id: "session.006", why: { en: "source of a rejected record", zh: "被拒记录的来源" } },
        { id: "state.milk_dislike", label: "lexical_only",
          why: { en: "topic is provisions · a stable preference, not this question", zh: "topic 是 provisions · 稳定偏好，与这个问题无关" } },
        { id: "topic.provisions", why: { en: "not on the path", zh: "不在这条路径上" } },
        { id: "state.paper_stock", label: "conflicting_or_superseded",
          why: { en: "superseded state value · never current state", zh: "已被取代的 state 值 · 不可当作当前状态" } }
      ],
      pulse: ["e21"]
    },
    {
      id: "time",
      name: { en: "Temporal check", zh: "时间检查" },
      note: {
        en: "as_of 2030-01-14 is past expected_resolution_at 2030-01-10 and nobody re-confirmed. The state does not expire: it keeps its rank and carries a visible review note.",
        zh: "as_of 2030-01-14 已越过 expected_resolution_at 2030-01-10，而且没人再确认过。这条 state 不会因此失效：排序不变，只是带上一条可见的复核提示。"
      },
      stat: { en: "advisory attached · ranking unchanged", zh: "附加提示 · 排序不变" },
      badge: [{ id: "state.logging_medium", label: "checkpoint_passed" }],
      pulse: ["e24"]
    },
    {
      id: "history",
      name: { en: "Decision history", zh: "决策历史" },
      note: {
        en: "One predecessor per selected successor. The old rationale comes back explicitly marked historical — preserved, never revived as current advice.",
        zh: "每个被选中的后继，只带一个前身。旧的理由带着「历史」标记回来 —— 被保留，但不会被重新当成现在的建议。"
      },
      stat: { en: "decision.tablet → decision.paper", zh: "decision.tablet → decision.paper" },
      keep: ["decision.paper"],
      badge: [{ id: "decision.paper", label: "conflicting_or_superseded" }],
      pulse: ["e20"]
    },
    {
      id: "provenance",
      name: { en: "Provenance", zh: "溯源" },
      note: {
        en: "Every surviving claim keeps a path back to a canonical Session. What cannot be traced does not get to speak.",
        zh: "每一条存活下来的说法，都保留一条回到 canonical Session 的路径。追不回来的，就没有发言权。"
      },
      stat: { en: "3 Sessions linked", zh: "关联 3 个 Session" },
      keep: ["session.019", "session.014", "session.023"],
      badge: [
        { id: "decision.tablet", label: "provenance_supported" },
        { id: "decision.paper", label: "provenance_supported" },
        { id: "state.logging_medium", label: "provenance_supported" },
        { id: "state.power_budget", label: "structured_context" }
      ],
      pulse: ["e23", "e22", "e24", "e26"]
    },
    {
      id: "pack",
      name: { en: "Context Packet", zh: "打包 Context Packet" },
      note: {
        en: "Adjacency is verified on the finished packet, not on candidate order: the historical decision sits directly behind the successor that admitted it.",
        zh: "相邻关系要在「成品 packet」上验证，而不是在候选排序上：那条历史 decision 必须紧挨着带它进来的后继。"
      },
      stat: { en: "1,220 / 1,600 tokens", zh: "1,220 / 1,600 tokens" },
      pack: [
        { id: "decision.tablet", cost: 340, tag: { en: "active decision", zh: "当前 decision" } },
        { id: "decision.paper", cost: 280, tag: { en: "historical · direct predecessor", zh: "历史 · 直接前身" } },
        { id: "state.logging_medium", cost: 250, tag: { en: "current state · review note", zh: "当前 state · 附复核提示" } },
        { id: "state.power_budget", cost: 170, tag: { en: "supporting state", zh: "支撑性 state" } },
        { id: "session.019", cost: 60, tag: { en: "source", zh: "来源" } },
        { id: "session.014", cost: 60, tag: { en: "source", zh: "来源" } },
        { id: "session.023", cost: 60, tag: { en: "source", zh: "来源" } }
      ]
    }
  ]
};
