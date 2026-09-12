/* Project Pinecone · Memory Graph Explorer — synthetic fixture.
 *
 * Every person, record and joke below is fictional. The fixture dramatizes the
 * sixth candidate evaluation in DRAFT.md — a named phrase against a chatty
 * distractor — and does not mirror any private memory workspace.
 *
 * Share the method. Protect the memory.
 */

window.PINECONE_GRAPH = {
  meta: {
    asOf: "2030-01-14",
    budget: 1200,
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
      en: "Ready. 11 fictional records, 16 relations, one question.",
      zh: "准备就绪：11 条虚构记录、16 条关系、一个问题。"
    },
    kbd: {
      en: "Space play / pause · → step · R reset · F fit · C cinema",
      zh: "空格 播放/暂停 · → 单步 · R 重置 · F 适配 · C 演示模式"
    },
    footer: {
      en: "Fictional data throughout. Share the method. Protect the memory.",
      zh: "全部为虚构数据。Share the method. Protect the memory."
    },
    demoDisclosure: {
      en: "Scripted synthetic walkthrough · not live engine telemetry",
      zh: "脚本化合成演示 · 非实时引擎数据"
    },
    back: { en: "← Project Pinecone", zh: "← 返回 Project Pinecone" }
  },

  /* ------------------------------------------------------------- types --- */

  nodeTypes: {
    query:   { name: { en: "query",   zh: "query · 提问" },   shape: "diamond" },
    person:  { name: { en: "person",  zh: "person · 人物" },  shape: "circle" },
    topic:   { name: { en: "topic",   zh: "topic · 主题" },   shape: "hexagon" },
    session: { name: { en: "record",  zh: "record · 记录" },  shape: "card" }
  },

  edgeTypes: {
    related:  { name: { en: "related",  zh: "related · 相关" }, hint: { en: "topic or field overlap", zh: "topic / 字段重叠" } },
    source:   { name: { en: "source",   zh: "source · 溯源" },  hint: { en: "provenance back to a canonical record", zh: "回到 canonical 记录的 provenance" } },
    mentions: { name: { en: "mentions", zh: "mentions · 提及" }, hint: { en: "a name used by a record", zh: "记录里提到的名字" } }
  },

  labels: {
    rare_phrase: {
      en: "holds the query words contiguously, and almost nothing else does",
      zh: "按原顺序连续包含查询中的词，而几乎没有别的记录做到"
    },
    derived_view_rare_phrase: {
      en: "restates the phrase beside the record it came from — half weight",
      zh: "在原始记录旁转述了这个短语 —— 只给一半权重"
    },
    provenance_supported: {
      en: "selected through an explicit source link",
      zh: "通过显式 source link 选中"
    },
    structured_context: {
      en: "supported by topic, entity, state or decision fields",
      zh: "有 topic / entity / state / decision 字段支撑"
    },
    lexical_only: {
      en: "wording overlaps, nothing stronger supports it",
      zh: "只有字面重叠，没有更强的上下文支撑"
    }
  },

  statuses: {
    candidate: { en: "recalled as a candidate", zh: "已作为候选召回" },
    kept:      { en: "kept after the phrase signal", zh: "短语信号生效后保留" },
    held:      { en: "held back — weaker copy of the evidence", zh: "暂时挡下 — 证据的较弱副本" },
    rejected:  { en: "rejected", zh: "被拒绝" },
    packed:    { en: "packed into the context packet", zh: "已打进 context packet" }
  },

  /* ------------------------------------------------------------- nodes --- */

  nodes: [
    {
      id: "query.velvet_teapot",
      type: "query",
      name: { en: "Our velvet teapot protocol?", zh: "我们那个 velvet teapot protocol？" },
      title: {
        en: "克劳德, remember our velvet teapot protocol?",
        zh: "克劳德，还记得我们那个 velvet teapot protocol 吗？"
      },
      body: {
        en: "Almost entirely filler. It names the companion — a name that appears in nearly every record and therefore separates nothing — and it carries one three-word anchor that means everything. Both are real signals; only one of them can answer the question, and an unordered bag of tokens cannot tell which.",
        zh: "几乎全是寒暄。它点了同伴的名字 —— 一个几乎每条记录里都有、因此毫无区分力的名字 —— 同时带着一个三词锚点，全部含义都在那三个词上。两者都是真实信号，但只有一个能回答这个问题，而无序 token 集合分不出是哪一个。"
      },
      fields: [
        { k: "resolver", v: "RETRIEVE" },
        { k: "as_of", v: "2030-01-14" },
        { k: "hints", v: "topic:camp_jokes · person:克劳德" },
        { k: "ascii_run", v: "velvet teapot protocol" },
        { k: "spans_tested", v: "velvet teapot · teapot protocol · velvet teapot protocol" }
      ]
    },

    {
      id: "person.claude",
      type: "person",
      name: "克劳德",
      title: { en: "克劳德 · expedition companion", zh: "克劳德 · 远征队的同伴" },
      body: {
        en: "Named in the question and in nearly every camp record, which is exactly why the name cannot answer it: a token that appears everywhere separates nothing. A real hint and a useless one at the same time.",
        zh: "问题里点了这个名字，而几乎每条营地记录里也都有它 —— 这正是它回答不了这个问题的原因：一个到处都出现的 token，区分不了任何东西。它同时是一个真实的线索，和一个没用的线索。"
      },
      fields: [
        { k: "canonical_id", v: "claude" },
        { k: "appears_in", v: "most records" }
      ]
    },

    {
      id: "topic.camp_jokes",
      type: "topic",
      name: "camp_jokes",
      title: { en: "topic · camp_jokes", zh: "topic · camp_jokes" },
      body: {
        en: "Running jokes that the crew named and kept reusing. The query hint lands here, so recall starts from this node.",
        zh: "队员们起过名字、后来一直复用的玩笑。query hint 落在这里，所以召回从这个节点开始扩散。"
      },
      fields: [{ k: "canonical_id", v: "camp_jokes" }]
    },
    {
      id: "topic.field_test",
      type: "topic",
      name: "field_test",
      title: { en: "topic · field_test", zh: "topic · field_test" },
      body: {
        en: "The expedition scope. Adjacent to camp_jokes, which is how a supply list and a desk note get close enough to be considered at all.",
        zh: "远征的范围标签。它和 camp_jokes 相邻 —— 这正是采购清单和一张便签得以进入候选的原因。"
      },
      fields: [{ k: "canonical_id", v: "field_test" }]
    },

    {
      id: "session.week12_review",
      type: "session",
      name: { en: "Week 12 review", zh: "第 12 周复盘" },
      title: {
        en: "Week 12 review · “Velvet Teapot Protocol”",
        zh: "第 12 周复盘 · 「Velvet Teapot Protocol」"
      },
      body: {
        en: "The only record that actually holds the phrase, in order and adjacent. Note its fidelity: this is a summary, the weakest evidence tier here. It wins the ranking on the phrase and still gets reported as a summary — winning a rank never upgrades what kind of evidence something is.",
        zh: "唯一真正按顺序、相邻地包含这个短语的记录。注意它的 fidelity：这是一份摘要，在这里属于最弱的证据等级。它靠短语赢下排名，但报告出来仍然是摘要 —— 赢得排名从不改变证据的身份。"
      },
      fields: [
        { k: "archive_format", v: "structured-session-summary" },
        { k: "source_fidelity", v: "summary-only" },
        { k: "holds_span", v: "velvet teapot protocol" },
        { k: "date", v: "2030-01-08" }
      ]
    },
    {
      id: "session.storm_night",
      type: "session",
      name: { en: "Storm night chat", zh: "暴风雪夜闲聊" },
      title: { en: "Storm night · a long, warm conversation", zh: "暴风雪那晚 · 一段很长的闲聊" },
      body: {
        en: "Shares no phrase with the question — only filler: laughter, agreement, the companion's name, the shape of a friendly exchange. Under plain token overlap this record leads, because a segmented language contributes several overlapping units per generic word while a three-word anchor contributes three.",
        zh: "它和问题没有任何短语重合，只有寒暄：笑、附和、同伴的名字、一段友好对话的形状。在纯 token 重合下它会排第一，因为按 n-gram 切分的语言，一个通用词就贡献好几个重叠单位，而三个词的锚点只贡献三个。"
      },
      fields: [
        { k: "archive_format", v: "full-transcript" },
        { k: "source_fidelity", v: "chronological-visible-dialogue" },
        { k: "holds_span", v: "none" },
        { k: "length", v: "long" }
      ]
    },
    {
      id: "view.favorites",
      type: "session",
      name: { en: "Favorites view", zh: "Favorites 派生视图" },
      title: { en: "Favorites · a derived view", zh: "Favorites · 派生视图" },
      body: {
        en: "Restates the phrase next to the record it came from. A match here points at the evidence rather than being it, so it earns a fraction of the weight: the canonical record leads, and the view can still reach the packet behind it.",
        zh: "它在原始记录旁边转述了这个短语。命中这里，指向的是证据本身，而不是证据本体，所以只给一部分权重：canonical 记录排在前面，派生视图仍然可以跟在后面进入 packet。"
      },
      fields: [
        { k: "document_type", v: "derived_view" },
        { k: "archive_format", v: "null" },
        { k: "holds_span", v: "velvet teapot protocol" },
        { k: "weight", v: "half" }
      ]
    },
    {
      id: "session.supply_list",
      type: "session",
      name: { en: "Supply list", zh: "采购清单" },
      title: { en: "Supply list · every word, none adjacent", zh: "采购清单 · 词都在，但都不相邻" },
      body: {
        en: "“The protocol page lists velvet curtains and a teapot.” Every word of the anchor is present and the record is scored for it — but no contiguous span of two or more survives, so it earns no phrase credit at all.",
        zh: "「protocol 那一页写着 velvet 窗帘和 teapot 的采购清单。」锚点里的每个词都在，这条记录也因此被打了分 —— 但里面没有任何两个词是连续的，所以完全拿不到短语加分。"
      },
      fields: [
        { k: "holds_words", v: "velvet · teapot · protocol" },
        { k: "holds_span", v: "none" },
        { k: "why", v: "not adjacent, not in query order" }
      ]
    },
    {
      id: "session.old_notes",
      type: "session",
      name: { en: "Old notes", zh: "旧笔记" },
      title: { en: "Old notes · adjacent, but past a word boundary", zh: "旧笔记 · 相邻，但越过了词边界" },
      body: {
        en: "“Only velvet teapots and teapot-protocol appear in the old notes.” Adjacency alone is not the rule: spans must match on whole words, so a plural and a hyphenated join both fall outside it.",
        zh: "「旧笔记里只有 velvet teapots 和 teapot-protocol 这两个写法。」光相邻并不够：span 必须按完整词匹配，所以复数形式和连字符连写都落在规则之外。"
      },
      fields: [
        { k: "holds_span", v: "none" },
        { k: "near_forms", v: "velvet teapots · teapot-protocol" },
        { k: "why", v: "word boundary" }
      ]
    },
    {
      id: "session.desk_note",
      type: "session",
      name: { en: "Desk note", zh: "桌上的便签" },
      title: { en: "Desk note · “left it on the desk”", zh: "桌上的便签 ·「left it on the desk」" },
      body: {
        en: "Contains “on the desk”, a span rare enough to qualify on frequency alone. The edge rule is the only thing keeping it out: a function word may neither open nor close a span, because in a mostly-Chinese corpus “on the” is rare only because English is. Interior function words still count — “left it on the desk” would qualify.",
        zh: "它包含 “on the desk”，单看频次完全够格。真正把它挡在外面的只有边缘规则：虚词不能作为 span 的开头或结尾 —— 在以中文为主的语料里，“on the” 之所以稀有，只是因为英文稀有。而 span 内部的虚词仍然算数：“left it on the desk” 就能命中。"
      },
      fields: [
        { k: "holds_span", v: "on the desk" },
        { k: "edge_stopwords", v: "on · the" },
        { k: "why", v: "function word at the edge" }
      ]
    },
    {
      id: "session.joke_archive",
      type: "session",
      name: { en: "9 archived fragments", zh: "9 条归档碎片" },
      title: { en: "Daily fragments · “shared joke” ×9", zh: "每日碎片 ·「shared joke」×9" },
      body: {
        en: "Nine short records that each contain the span “shared joke”. The ceiling is 8, so this span appears in too many records to be anybody's anchor — it is a recurring term. The rule is proven by counting, not by an exception list.",
        zh: "九条短记录，每条都包含 “shared joke” 这个 span。上限是 8，所以这个 span 出现在太多记录里，不可能成为任何人的锚点 —— 它只是一个常用说法。这条规则是用数量证出来的，不是靠例外清单。"
      },
      fields: [
        { k: "records", v: "9" },
        { k: "span", v: "shared joke" },
        { k: "max_chunk_frequency", v: "8" },
        { k: "why", v: "above the frequency ceiling" }
      ]
    }
  ],

  /* ------------------------------------------------------------- edges --- */

  edges: [
    { id: "e01", from: "query.velvet_teapot", to: "topic.camp_jokes", kind: "mentions" },
    { id: "e02", from: "query.velvet_teapot", to: "person.claude", kind: "mentions" },

    { id: "e03", from: "topic.camp_jokes", to: "topic.field_test", kind: "related" },

    { id: "e04", from: "session.week12_review", to: "topic.camp_jokes", kind: "related" },
    { id: "e05", from: "session.storm_night", to: "topic.camp_jokes", kind: "related" },
    { id: "e06", from: "view.favorites", to: "topic.camp_jokes", kind: "related" },
    { id: "e07", from: "session.old_notes", to: "topic.camp_jokes", kind: "related" },
    { id: "e08", from: "session.joke_archive", to: "topic.camp_jokes", kind: "related" },
    { id: "e09", from: "session.supply_list", to: "topic.field_test", kind: "related" },
    { id: "e10", from: "session.desk_note", to: "topic.field_test", kind: "related" },

    { id: "e11", from: "session.week12_review", to: "person.claude", kind: "mentions" },
    { id: "e12", from: "session.storm_night", to: "person.claude", kind: "mentions" },
    { id: "e13", from: "view.favorites", to: "person.claude", kind: "mentions" },
    { id: "e14", from: "session.joke_archive", to: "person.claude", kind: "mentions" },

    { id: "e15", from: "view.favorites", to: "session.week12_review", kind: "source" },
    { id: "e16", from: "session.week12_review", to: "topic.field_test", kind: "related" }
  ],

  /* ------------------------------------------------------------ stages --- */

  stages: [
    {
      id: "parse",
      name: { en: "Find the anchor", zh: "找出锚点" },
      note: {
        en: "The resolver answers RETRIEVE and keeps the rare wording verbatim. One run of three adjacent ASCII words yields three candidate spans — generalize it to “our old joke” here and the anchor is gone before ranking starts.",
        zh: "Resolver 判定 RETRIEVE，并把稀有措辞逐字保留。一段三个相邻的 ASCII 词产生三个候选 span —— 如果在这一步把它概括成「我们以前的梗」，锚点在排序开始前就已经没了。"
      },
      stat: { en: "RETRIEVE · 3 candidate spans", zh: "RETRIEVE · 3 个候选 span" },
      keep: ["query.velvet_teapot", "topic.camp_jokes", "person.claude"],
      pulse: ["e01", "e02"]
    },
    {
      id: "recall",
      name: { en: "Bag of tokens", zh: "词袋打分" },
      note: {
        en: "Score by shared tokens alone and the wrong record leads. The storm-night chat shares the companion's name and a great deal of filler; the anchor contributes three units in total. Rarity weighting would not save it either — in a corpus that is mostly Chinese, the filler is about as rare as the English.",
        zh: "只按共享 token 打分，领先的就是错的那条。暴风雪夜那段共享了同伴的名字和大量寒暄；而锚点总共只贡献三个单位。稀有度加权也救不了它 —— 在以中文为主的语料里，寒暄和英文一样稀有。"
      },
      stat: { en: "7 candidates · the distractor leads", zh: "7 个候选 · 干扰项领先" },
      candidate: [
        "session.storm_night", "session.week12_review", "view.favorites",
        "session.supply_list", "session.old_notes", "session.desk_note",
        "session.joke_archive"
      ],
      pulse: ["e03", "e04", "e05", "e06", "e07", "e08", "e09", "e10"]
    },
    {
      id: "phrase",
      name: { en: "Contiguity", zh: "连续性" },
      note: {
        en: "Word order is the evidence the token set threw away. One record holds “velvet teapot protocol” in order and adjacent, and the bounded bonus — worth roughly a dozen scattered token overlaps — is enough to overtake a much longer record. Bounded, not a filter: something sharing far more of the query could still win.",
        zh: "词序正是 token 集合丢掉的那份证据。只有一条记录按原顺序、相邻地包含 “velvet teapot protocol”，而这个有界加分 —— 大约相当于十几个零散 token 重合 —— 足以反超一条长得多的记录。它是有界的，不是过滤器：共享了更多查询内容的记录仍然可能赢。"
      },
      stat: { en: "anchor overtakes the distractor", zh: "锚点反超干扰项" },
      keep: ["session.week12_review"],
      badge: [{ id: "session.week12_review", label: "rare_phrase" }],
      reject: [
        { id: "session.storm_night", label: "lexical_only",
          why: { en: "filler only · holds no span of the anchor", zh: "只有寒暄 · 不包含锚点的任何 span" } }
      ],
      pulse: ["e04"]
    },
    {
      id: "guards",
      name: { en: "Negative controls", zh: "反例" },
      note: {
        en: "The guards are what make the signal narrow rather than a second source of noise. Every record here shares words with the question and is scored for them; none earns phrase credit, and each is refused for a different, nameable reason.",
        zh: "真正让这个信号「窄」而不是变成第二个噪声源的，是这些约束。这里每条记录都与问题共享词汇、也确实被打了分；但没有一条拿到短语加分，而且每条被拒的理由都不同、都能说清楚。"
      },
      stat: { en: "3 refused · 3 different reasons", zh: "拒绝 3 条 · 3 个不同理由" },
      reject: [
        { id: "session.supply_list", label: "lexical_only",
          why: { en: "every word, none adjacent", zh: "词都在，但没有一对相邻" } },
        { id: "session.old_notes", label: "lexical_only",
          why: { en: "adjacent, but “teapots” and “teapot-protocol” cross a word boundary", zh: "相邻，但 “teapots” 和 “teapot-protocol” 越过了词边界" } },
        { id: "session.desk_note", label: "lexical_only",
          why: { en: "a function word may not open or close a span", zh: "虚词不能作为 span 的开头或结尾" } }
      ]
    },
    {
      id: "ceiling",
      name: { en: "Frequency ceiling", zh: "频次上限" },
      note: {
        en: "A span that turns up everywhere is a common expression, not somebody's anchor. “shared joke” appears in nine records against a ceiling of eight, so it is disqualified by counting rather than by anyone adding it to a stop list.",
        zh: "到处都出现的 span 是常用说法，不是谁的锚点。“shared joke” 出现在九条记录里，而上限是八 —— 它是被数量取消资格的，不是靠谁把它加进停用词表。"
      },
      stat: { en: "9 records > ceiling 8", zh: "9 条记录 > 上限 8" },
      reject: [
        { id: "session.joke_archive", label: "lexical_only",
          why: { en: "“shared joke” is a recurring term, not an anchor", zh: "“shared joke” 是常用说法，不是锚点" } }
      ],
      pulse: ["e08"]
    },
    {
      id: "provenance",
      name: { en: "Canonical first", zh: "正本优先" },
      note: {
        en: "The derived view holds the same phrase, so it is recalled too — at half weight, and behind the record it points at. A match in a view indicates where the evidence lives; it is not the evidence. Provenance is what keeps that ordering honest.",
        zh: "派生视图也包含同一个短语，所以它同样被召回 —— 但只有一半权重，而且排在它所指向的记录后面。命中视图说明的是「证据在哪」，它本身不是证据。保证这个顺序诚实的，就是 provenance。"
      },
      stat: { en: "canonical record → derived view", zh: "canonical 记录 → 派生视图" },
      keep: ["view.favorites"],
      badge: [
        { id: "session.week12_review", label: "provenance_supported" },
        { id: "view.favorites", label: "derived_view_rare_phrase" },
        { id: "topic.camp_jokes", label: "structured_context" }
      ],
      pulse: ["e15"]
    },
    {
      id: "pack",
      name: { en: "Context Packet", zh: "打包 Context Packet" },
      note: {
        en: "The packet is small, and the guards are why. Seven records were recalled and five were refused for stated reasons, leaving the canonical record, the view that points at it, and the scope. A small packet you can read beats a large one you have to trust.",
        zh: "这个 packet 很小，而正是那些约束让它变小的。召回了七条记录、按明确理由拒掉五条，最后只剩 canonical 记录、指向它的视图，以及范围标签。一个你读得完的小 packet，好过一个你只能选择相信的大 packet。"
      },
      stat: { en: "630 / 1,200 tokens", zh: "630 / 1,200 tokens" },
      pack: [
        { id: "session.week12_review", cost: 380, tag: { en: "canonical record · holds the phrase", zh: "canonical 记录 · 包含该短语" } },
        { id: "view.favorites", cost: 160, tag: { en: "derived view · follows the canonical record", zh: "派生视图 · 跟在 canonical 记录之后" } },
        { id: "topic.camp_jokes", cost: 90, tag: { en: "scope", zh: "范围" } }
      ]
    }
  ]
};
