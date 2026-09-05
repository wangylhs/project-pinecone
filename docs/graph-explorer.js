/* Project Pinecone · Memory Graph Explorer — rendering and playback engine.
 *
 * No dependencies, no build step, no graph database. An SVG scene, a small
 * force-directed layout, and a scripted retrieval run over a synthetic
 * fixture (see graph-data.js). Every human-readable string lives in the
 * fixture; this file only moves things around.
 */

(function () {
  "use strict";

  var G = window.PINECONE_GRAPH;
  var NS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ basics -- */

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  var lang = store.get("pinecone.lang", /^zh/i.test(navigator.language || "") ? "zh" : "en");
  var speed = parseFloat(store.get("pinecone.speed", "1")) || 1;

  function t(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[lang] || v.en || "";
  }
  function el(id) { return document.getElementById(id); }
  function svgEl(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* -------------------------------------------------------------- model -- */

  var RADIUS = { query: 30, decision: 27, state: 26, topic: 23, person: 21, session: 23 };
  var GLYPH = { query: "?", person: "@", topic: "#", state: "=", decision: "!", session: "§" };
  var REST = { related: 190, mentions: 158, source: 124, supersedes: 108 };

  var seed = 20300114;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

  var nodes = G.nodes.map(function (n, i) {
    var ring = { query: 0, topic: 130, decision: 215, state: 235, person: 290, session: 345 }[n.type];
    var a = (i / G.nodes.length) * Math.PI * 2 + rnd() * 0.9;
    return {
      id: n.id, type: n.type, data: n, r: RADIUS[n.type],
      x: 480 + Math.cos(a) * ring + (rnd() - 0.5) * 40,
      y: 360 + Math.sin(a) * ring * 0.82 + (rnd() - 0.5) * 40,
      vx: 0, vy: 0, pinned: false, el: null, labelEls: [], badgeEl: null
    };
  });
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  var edges = G.edges.map(function (e) {
    return { id: e.id, kind: e.kind, a: byId[e.from], b: byId[e.to], el: null };
  });

  var adjacency = {};
  edges.forEach(function (e) {
    (adjacency[e.a.id] = adjacency[e.a.id] || []).push({ edge: e, other: e.b, dir: "out" });
    (adjacency[e.b.id] = adjacency[e.b.id] || []).push({ edge: e, other: e.a, dir: "in" });
  });

  /* ----------------------------------------------------------- run state -- */

  var status = {};     /* node id -> candidate | kept | held | rejected | packed */
  var badges = {};     /* node id -> [label] */
  var reasons = {};    /* node id -> bilingual why */
  var litEdges = {};   /* edge id -> true */
  var packed = [];     /* [{node, cost, tag}] */
  var stageIdx = -1;
  var playing = false;
  var timer = null;
  var selected = null;

  /* --------------------------------------------------------------- scene -- */

  var svg = el("stage");
  var wrap = el("stage-wrap");
  var defs = svgEl("defs");
  svg.appendChild(defs);

  var glow = svgEl("filter", { id: "soft", x: "-60%", y: "-60%", width: "220%", height: "220%" });
  glow.appendChild(svgEl("feGaussianBlur", { stdDeviation: "7" }));
  defs.appendChild(glow);

  [["arrow-supersedes", "var(--purple)"], ["arrow-source", "var(--gold)"]].forEach(function (m) {
    var mk = svgEl("marker", {
      id: m[0], viewBox: "0 0 10 10", refX: "9", refY: "5",
      markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse"
    });
    mk.appendChild(svgEl("path", { d: "M0,0 L10,5 L0,10 z", fill: m[1] }));
    defs.appendChild(mk);
  });

  var viewport = svgEl("g", { id: "viewport" });
  var hull = svgEl("g", { class: "hull", opacity: "0" });
  var hullRing = svgEl("circle", { class: "hull-ring", r: "150" });
  var hullLabel = svgEl("text", { class: "hull-label" });
  hull.appendChild(hullRing);
  hull.appendChild(hullLabel);
  var gEdges = svgEl("g");
  var gPulses = svgEl("g");
  var gNodes = svgEl("g");
  viewport.appendChild(hull);
  viewport.appendChild(gEdges);
  viewport.appendChild(gPulses);
  viewport.appendChild(gNodes);
  svg.appendChild(viewport);

  var view = { x: 0, y: 0, k: 1 };
  var W = 900, H = 640;

  function shapePath(type, r) {
    if (type === "person") {
      return "M " + (-r) + ",0 a " + r + "," + r + " 0 1,0 " + (2 * r) + ",0 a " + r + "," + r + " 0 1,0 " + (-2 * r) + ",0";
    }
    if (type === "state" || type === "session") {
      var w = type === "state" ? r * 2.15 : r * 2.25, h = type === "state" ? r * 1.5 : r * 1.35;
      var rx = type === "state" ? 11 : 5;
      return roundRect(-w / 2, -h / 2, w, h, rx);
    }
    var sides = type === "query" ? 4 : type === "topic" ? 6 : 5;
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var a = -Math.PI / 2 + (i / sides) * Math.PI * 2;
      pts.push((Math.cos(a) * r).toFixed(2) + "," + (Math.sin(a) * r).toFixed(2));
    }
    return "M " + pts.join(" L ") + " Z";
  }
  function roundRect(x, y, w, h, r) {
    return "M " + (x + r) + "," + y + " h " + (w - 2 * r) + " a " + r + "," + r + " 0 0 1 " + r + "," + r +
      " v " + (h - 2 * r) + " a " + r + "," + r + " 0 0 1 " + (-r) + "," + r +
      " h " + (-(w - 2 * r)) + " a " + r + "," + r + " 0 0 1 " + (-r) + "," + (-r) +
      " v " + (-(h - 2 * r)) + " a " + r + "," + r + " 0 0 1 " + r + "," + (-r) + " z";
  }

  function wrapLabel(text) {
    if (text.length <= 15) return [text];
    if (/[一-鿿]/.test(text)) {
      var cut = Math.ceil(text.length / 2);
      return [text.slice(0, cut), text.slice(cut)];
    }
    var dot = text.indexOf(".");
    if (dot > 0 && dot < text.length - 1) return [text.slice(0, dot + 1), text.slice(dot + 1)];
    var words = text.split(" "), a = "", b = "";
    words.forEach(function (w) {
      if (a.length < 14 && !b) a += (a ? " " : "") + w; else b += (b ? " " : "") + w;
    });
    return b ? [a, b] : [a];
  }

  function labelTone(label) {
    if (label === "checkpoint_passed") return "warn";
    if (label === "lexical_only" || label === "conflicting_or_superseded") return "bad";
    return "good";
  }
  var TONE_COLOR = { good: "var(--green)", warn: "var(--gold)", bad: "var(--accent)" };

  function buildNodes() {
    clear(gNodes);
    nodes.forEach(function (n) {
      var g = svgEl("g", { class: "gnode type-" + n.type, tabindex: "0", role: "button" });
      var aria = svgEl("title");
      aria.textContent = n.data.id;
      g.appendChild(aria);
      g.appendChild(svgEl("circle", { class: "halo", r: n.r * 1.25, filter: "url(#soft)" }));
      g.appendChild(svgEl("path", { class: "shape", d: shapePath(n.type, n.r) }));
      var glyph = svgEl("text", { class: "glyph", y: "4" });
      glyph.textContent = GLYPH[n.type];
      g.appendChild(glyph);
      g.appendChild(svgEl("circle", { class: "ring", r: n.r + 7 }));
      n.el = g;
      n.badgeGroup = svgEl("g", { class: "badge", opacity: "0" });
      n.badgeRows = [0, 1].map(function () {
        var row = svgEl("g", { opacity: "0" });
        var bg = svgEl("rect", { class: "badge-bg", rx: "6", height: "13" });
        var tx = svgEl("text", { class: "badge-flag" });
        row.appendChild(bg);
        row.appendChild(tx);
        n.badgeGroup.appendChild(row);
        return { row: row, bg: bg, tx: tx };
      });
      g.appendChild(n.badgeGroup);
      gNodes.appendChild(g);
      setNodeLabel(n);
      wireNode(n);
    });
  }

  function setNodeLabel(n) {
    n.labelEls.forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); });
    n.labelEls = [];
    var lines = wrapLabel(t(n.data.name));
    var top = n.r + 15;
    lines.forEach(function (line, i) {
      var tx = svgEl("text", { class: i === 0 ? "label" : "sub", y: top + i * 12 });
      tx.textContent = line;
      n.el.insertBefore(tx, n.badgeGroup);
      n.labelEls.push(tx);
    });
    n.labelBottom = top + (lines.length - 1) * 12;
    positionBadge(n);
  }

  function positionBadge(n) {
    n.badgeRows.forEach(function (r, i) {
      var txt = r.tx.textContent || "";
      var w = txt.length * 4.9 + 12;
      var top = n.labelBottom + 5 + i * 15;
      r.bg.setAttribute("width", w);
      r.bg.setAttribute("x", -w / 2);
      r.bg.setAttribute("y", top);
      r.tx.setAttribute("y", top + 9.5);
    });
  }

  function buildEdges() {
    clear(gEdges);
    edges.forEach(function (e) {
      var p = svgEl("path", { class: "edge kind-" + e.kind });
      if (e.kind === "supersedes") p.setAttribute("marker-end", "url(#arrow-supersedes)");
      if (e.kind === "source") p.setAttribute("marker-end", "url(#arrow-source)");
      e.el = p;
      gEdges.appendChild(p);
    });
  }

  /* -------------------------------------------------------------- forces -- */

  var alpha = 1;
  var packFocus = false;
  var packAnchor = { x: 0, y: 0 };
  var packRadius = 150;
  var lastHullRadius = 0;

  function simulate() {
    var i, j, a, b, dx, dy, d, f;
    if (alpha >= 0.015) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = b.x - a.x; dy = b.y - a.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 1) { dx = rnd() - 0.5; dy = rnd() - 0.5; d2 = 1; }
          d = Math.sqrt(d2);
          f = Math.min(26000 / d2, 7) * alpha;
          var ux = dx / d, uy = dy / d;
          a.vx -= ux * f; a.vy -= uy * f;
          b.vx += ux * f; b.vy += uy * f;
          var minD = a.r + b.r + 40;
          if (d < minD) {
            var push = (minD - d) * 0.22;
            a.vx -= ux * push; a.vy -= uy * push;
            b.vx += ux * push; b.vy += uy * push;
          }
        }
      }
      edges.forEach(function (e) {
        var ex = e.b.x - e.a.x, ey = e.b.y - e.a.y;
        var ed = Math.sqrt(ex * ex + ey * ey) || 1;
        var ef = (ed - REST[e.kind]) * 0.03 * alpha;
        var ux = ex / ed * ef, uy = ey / ed * ef;
        e.a.vx += ux; e.a.vy += uy;
        e.b.vx -= ux; e.b.vy -= uy;
      });
      var cx = W / 2, cy = H / 2;
      nodes.forEach(function (n) {
        n.vx += (cx - n.x) * 0.005 * alpha;
        n.vy += (cy - n.y) * 0.006 * alpha;
      });
      alpha *= 0.988;
    }

    /* The packet gathers: selected nodes are pulled onto a ring of their own. */
    if (packFocus) {
      nodes.forEach(function (n) {
        if (n.slot) {
          n.vx += (packAnchor.x + n.slot.x - n.x) * 0.055;
          n.vy += (packAnchor.y + n.slot.y - n.y) * 0.055;
          return;
        }
        /* Nothing that was left out gets to sit inside the packet. */
        var ax = n.x - packAnchor.x, ay = n.y - packAnchor.y;
        var ad = Math.sqrt(ax * ax + ay * ay) || 1;
        var keepOut = packRadius + n.r + 46;
        if (ad < keepOut) {
          n.vx += (ax / ad) * (keepOut - ad) * 0.05;
          n.vy += (ay / ad) * (keepOut - ad) * 0.05;
        }
      });
    }

    nodes.forEach(function (n) {
      n.vx *= 0.84; n.vy *= 0.84;
      if (!n.pinned) { n.x += n.vx; n.y += n.vy; }
    });
  }

  function reheat(v) { alpha = Math.max(alpha, v || 0.55); }
  function settle(ticks) {
    alpha = 1;
    for (var i = 0; i < (ticks || 620); i++) simulate();
    alpha = 0;
  }

  /* -------------------------------------------------------------- pulses -- */

  var pulses = [];
  function spawnPulses(edgeIds) {
    if (!edgeIds) return;
    edgeIds.forEach(function (id, i) {
      var e = edges.filter(function (x) { return x.id === id; })[0];
      if (!e) return;
      for (var k = 0; k < 3; k++) {
        pulses.push({ e: e, start: performance.now() + i * 45 + k * 210, dur: 780 / speed, el: null });
      }
    });
  }
  function drawPulses(now) {
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      var pr = (now - p.start) / p.dur;
      if (pr < 0) continue;
      if (pr > 1) {
        if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        pulses.splice(i, 1);
        continue;
      }
      if (!p.el) {
        p.el = svgEl("circle", { class: "pulse", r: 3.6 });
        gPulses.appendChild(p.el);
      }
      var e = p.e;
      p.el.setAttribute("cx", e.a.x + (e.b.x - e.a.x) * pr);
      p.el.setAttribute("cy", e.a.y + (e.b.y - e.a.y) * pr);
      p.el.setAttribute("opacity", Math.sin(pr * Math.PI) * 0.95);
      p.el.setAttribute("fill", e.kind === "source" ? "var(--gold)" :
        e.kind === "supersedes" ? "var(--purple)" :
        e.kind === "mentions" ? "var(--blue)" : "var(--accent)");
    }
  }

  /* --------------------------------------------------------------- draw -- */

  function draw(now) {
    simulate();
    edges.forEach(function (e) {
      var dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / d, uy = dy / d;
      var x1 = e.a.x + ux * (e.a.r + 3), y1 = e.a.y + uy * (e.a.r + 3);
      var pad = e.el.getAttribute("marker-end") ? 11 : 3;
      var x2 = e.b.x - ux * (e.b.r + pad), y2 = e.b.y - uy * (e.b.r + pad);
      var mx = (x1 + x2) / 2 - uy * d * 0.07, my = (y1 + y2) / 2 + ux * d * 0.07;
      e.el.setAttribute("d", "M " + x1 + "," + y1 + " Q " + mx + "," + my + " " + x2 + "," + y2);
    });
    nodes.forEach(function (n) {
      n.el.setAttribute("transform", "translate(" + n.x.toFixed(2) + "," + n.y.toFixed(2) + ")");
    });
    if (packFocus && packed.length) {
      var hx = 0, hy = 0;
      packed.forEach(function (p) { hx += p.node.x; hy += p.node.y; });
      hx /= packed.length; hy /= packed.length;
      var rad = 0;
      packed.forEach(function (p) {
        rad = Math.max(rad, Math.sqrt(Math.pow(p.node.x - hx, 2) + Math.pow(p.node.y - hy, 2)) + p.node.r + 20);
      });
      hull.setAttribute("transform", "translate(" + hx.toFixed(1) + "," + hy.toFixed(1) + ")");
      hullRing.setAttribute("r", rad.toFixed(1));
      lastHullRadius = rad;
      hullLabel.setAttribute("y", (-rad + 27).toFixed(1));
      hull.setAttribute("opacity", "1");
    } else {
      hull.setAttribute("opacity", "0");
    }
    drawPulses(now);
    requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------- view/zoom -- */

  function applyView() {
    viewport.setAttribute("transform", "translate(" + view.x + "," + view.y + ") scale(" + view.k + ")");
  }
  function resize() {
    var b = wrap.getBoundingClientRect();
    W = Math.max(320, b.width); H = Math.max(320, b.height);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  }
  function fit(animate) {
    /* Leave room for the HUD chips on top and the caption + dock below. */
    var padX = 62, padTop = 78, padBottom = 178;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      minX = Math.min(minX, n.x - n.r); maxX = Math.max(maxX, n.x + n.r);
      minY = Math.min(minY, n.y - n.r); maxY = Math.max(maxY, n.y + n.r + 34);
    });
    var bw = maxX - minX, bh = maxY - minY;
    var k = Math.min((W - padX * 2) / bw, (H - padTop - padBottom) / bh, 1.5);
    var target = {
      k: k,
      x: W / 2 - ((minX + maxX) / 2) * k,
      y: padTop + (H - padTop - padBottom) / 2 - ((minY + maxY) / 2) * k
    };
    animateView(target, animate ? 420 : 0);
  }

  var viewAnim = 0;
  function animateView(target, ms) {
    viewAnim++;
    var token = viewAnim;
    if (!ms) { view = { x: target.x, y: target.y, k: target.k }; applyView(); return; }
    var from = { x: view.x, y: view.y, k: view.k }, t0 = performance.now();
    (function ease(now) {
      if (token !== viewAnim) return;
      var p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      view.x = from.x + (target.x - from.x) * e;
      view.y = from.y + (target.y - from.y) * e;
      view.k = from.k + (target.k - from.k) * e;
      applyView();
      if (p < 1) requestAnimationFrame(ease);
    })(performance.now());
    /* Frames can be throttled (background tab, reduced power). Land anyway. */
    setTimeout(function () {
      if (token !== viewAnim) return;
      view = { x: target.x, y: target.y, k: target.k };
      applyView();
    }, ms + 120);
  }

  /* Ease the camera onto the finished packet — the closing shot of a run.
     Framed from the ring geometry, not from positions still in motion. */
  function focusPacket() {
    if (!packFocus || !packed.length) return;
    var rad = Math.max(lastHullRadius, packRadius + 90) * 1.1;
    var free = H - 78 - 178;
    var k = Math.min((W - 160) / (rad * 2), free / (rad * 2), 1.5);
    if (k <= view.k) return;
    animateView({
      k: k,
      x: W / 2 - packAnchor.x * k,
      y: 78 + free / 2 - packAnchor.y * k
    }, 900);
  }
  function zoomAt(cx, cy, factor) {
    userMovedView = true;
    var k2 = Math.max(0.3, Math.min(3, view.k * factor));
    view.x = cx - (cx - view.x) * (k2 / view.k);
    view.y = cy - (cy - view.y) * (k2 / view.k);
    view.k = k2;
    applyView();
  }
  function localPoint(evt) {
    var b = svg.getBoundingClientRect();
    return { x: (evt.clientX - b.left) * (W / b.width), y: (evt.clientY - b.top) * (H / b.height) };
  }
  function worldPoint(evt) {
    var p = localPoint(evt);
    return { x: (p.x - view.x) / view.k, y: (p.y - view.y) / view.k };
  }

  /* --------------------------------------------------------- interaction -- */

  function wireNode(n) {
    var moved = false, sx = 0, sy = 0;
    n.el.addEventListener("pointerdown", function (evt) {
      evt.stopPropagation();
      moved = false;
      var p = worldPoint(evt);
      sx = p.x - n.x; sy = p.y - n.y;
      n.pinned = true;
      n.el.classList.add("dragging");
      try { n.el.setPointerCapture(evt.pointerId); } catch (err) { /* synthetic pointers */ }
      reheat(0.25);
      function move(e2) {
        var q = worldPoint(e2);
        if (Math.abs(q.x - sx - n.x) > 2 || Math.abs(q.y - sy - n.y) > 2) moved = true;
        n.x = q.x - sx; n.y = q.y - sy;
        n.vx = 0; n.vy = 0;
        reheat(0.2);
      }
      function up() {
        n.el.classList.remove("dragging");
        n.el.removeEventListener("pointermove", move);
        n.el.removeEventListener("pointerup", up);
        if (!moved) { n.pinned = false; select(n.id); }
        else { n.el.classList.add("is-pinned"); renderInspector(); }
      }
      n.el.addEventListener("pointermove", move);
      n.el.addEventListener("pointerup", up);
    });
    /* Pointer capture can be refused (touch, synthetic input); a plain click
       still has to select the node. */
    n.el.addEventListener("click", function (evt) {
      evt.stopPropagation();
      if (!moved) select(n.id);
    });
    n.el.addEventListener("dblclick", function (evt) {
      evt.stopPropagation();
      n.pinned = false;
      n.el.classList.remove("is-pinned");
      reheat(0.4);
    });
    n.el.addEventListener("keydown", function (evt) {
      if (evt.key === "Enter" || evt.key === " ") { evt.preventDefault(); evt.stopPropagation(); select(n.id); }
    });
  }

  svg.addEventListener("pointerdown", function (evt) {
    var ox = evt.clientX, oy = evt.clientY, vx = view.x, vy = view.y, moved = false;
    svg.classList.add("panning");
    svg.setPointerCapture(evt.pointerId);
    function move(e2) {
      var b = svg.getBoundingClientRect();
      var scale = W / b.width;
      if (Math.abs(e2.clientX - ox) + Math.abs(e2.clientY - oy) > 3) moved = true;
      userMovedView = true;
      view.x = vx + (e2.clientX - ox) * scale;
      view.y = vy + (e2.clientY - oy) * scale;
      applyView();
    }
    function up() {
      svg.classList.remove("panning");
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);
      if (!moved) select(null);
    }
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
  });

  svg.addEventListener("wheel", function (evt) {
    evt.preventDefault();
    var p = localPoint(evt);
    zoomAt(p.x, p.y, evt.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  /* -------------------------------------------------------- run playback -- */

  function resetRun() {
    status = {}; badges = {}; reasons = {}; litEdges = {}; packed = [];
    if (packFocus) scatter();
    stageIdx = -1;
    pulses.forEach(function (p) { if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el); });
    pulses = [];
  }

  function applyStage(s) {
    (s.candidate || []).forEach(function (id) { if (!status[id]) status[id] = "candidate"; });
    (s.keep || []).forEach(function (id) { status[id] = "kept"; });
    (s.hold || []).forEach(function (h) {
      status[h.id] = "held";
      if (h.label) pushBadge(h.id, h.label);
      if (h.why) reasons[h.id] = h.why;
    });
    (s.reject || []).forEach(function (r) {
      status[r.id] = "rejected";
      if (r.label) pushBadge(r.id, r.label);
      if (r.why) reasons[r.id] = r.why;
    });
    (s.badge || []).forEach(function (b) { pushBadge(b.id, b.label); });
    (s.pulse || []).forEach(function (id) { litEdges[id] = true; });
    if (s.pack && s.pack.length) {
      s.pack.forEach(function (p) {
        status[p.id] = "packed";
        packed.push({ node: byId[p.id], cost: p.cost, tag: p.tag });
      });
      gather();
    }
  }
  /* Give every packed node a slot on a ring around their own centre. */
  function gather() {
    var sx = 0, sy = 0;
    packed.forEach(function (p) { sx += p.node.x; sy += p.node.y; });
    packAnchor.x = sx / packed.length;
    packAnchor.y = sy / packed.length;
    var radius = 78 + packed.length * 12;
    packRadius = radius;
    packed.forEach(function (p, i) {
      var a = -Math.PI / 2 + (i / packed.length) * Math.PI * 2;
      p.node.slot = { x: Math.cos(a) * radius, y: Math.sin(a) * radius * 0.86 };
      p.node.pinned = false;
      p.node.el.classList.remove("is-pinned");
    });
    packFocus = true;
    reheat(0.12);
    setTimeout(function () { if (!userMovedView) focusPacket(); }, 1400);
  }
  function scatter() {
    packFocus = false;
    nodes.forEach(function (n) { n.slot = null; });
    reheat(0.5);
    if (!userMovedView) setTimeout(function () { fit(true); }, 260);
  }

  function pushBadge(id, label) {
    badges[id] = badges[id] || [];
    if (badges[id].indexOf(label) === -1) badges[id].push(label);
  }

  function applyUpTo(i) {
    resetRun();
    for (var k = 0; k <= i; k++) applyStage(G.stages[k]);
    stageIdx = i;
    renderRun();
  }

  function renderRun() {
    svg.classList.toggle("has-run", stageIdx >= 0);
    nodes.forEach(function (n) {
      var st = status[n.id];
      var cls = "gnode type-" + n.type;
      if (st) cls += " st-" + st;
      if (selected === n.id) cls += " is-selected";
      if (n.pinned) cls += " is-pinned";
      n.el.setAttribute("class", cls);
      var list = (badges[n.id] || []).slice(-2);
      n.badgeRows.forEach(function (r, i) {
        var label = list[i];
        r.tx.textContent = label || "";
        if (label) {
          var tone = TONE_COLOR[labelTone(label)];
          r.tx.setAttribute("fill", tone);
          r.bg.setAttribute("fill", "color-mix(in srgb, " + tone + " 18%, var(--bg))");
          r.bg.setAttribute("stroke", "color-mix(in srgb, " + tone + " 35%, transparent)");
        }
        r.row.setAttribute("opacity", label ? "1" : "0");
      });
      positionBadge(n);
      n.badgeGroup.setAttribute("opacity", list.length ? "1" : "0");
    });
    edges.forEach(function (e) {
      var cls = "edge kind-" + e.kind;
      var sa = status[e.a.id], sb = status[e.b.id];
      if (sa === "rejected" || sb === "rejected") cls += " off";
      else if (litEdges[e.id] || (isLive(sa) && isLive(sb))) cls += " on";
      e.el.setAttribute("class", cls);
    });
    renderStageList();
    renderCaption();
    renderPacket();
    renderInspector();
    updateDock();
  }
  function isLive(s) { return s === "kept" || s === "packed" || s === "held"; }

  function step() {
    if (stageIdx >= G.stages.length - 1) return false;
    applyUpTo(stageIdx + 1);
    spawnPulses(G.stages[stageIdx].pulse);
    return true;
  }
  function advance() {
    if (!playing) return;
    if (!step()) { playing = false; updateDock(); return; }
    if (stageIdx >= G.stages.length - 1) { playing = false; updateDock(); return; }
    timer = setTimeout(advance, 3000 / speed);
  }
  function play() {
    if (playing) { playing = false; clearTimeout(timer); updateDock(); return; }
    if (stageIdx >= G.stages.length - 1) applyUpTo(-1);
    playing = true;
    updateDock();
    advance();
  }
  function reset() {
    playing = false; clearTimeout(timer);
    applyUpTo(-1);
  }

  /* -------------------------------------------------------------- panels -- */

  function renderStageList() {
    var box = el("stage-list");
    clear(box);
    G.stages.forEach(function (s, i) {
      var b = document.createElement("button");
      b.className = "stage-item" + (i === stageIdx ? " active" : i < stageIdx ? " done" : "");
      b.innerHTML = '<span class="n">' + String(i + 1).padStart(2, "0") + "</span><span></span>";
      b.lastChild.textContent = t(s.name);
      b.addEventListener("click", function () {
        playing = false; clearTimeout(timer);
        applyUpTo(i);
        spawnPulses(s.pulse);
      });
      box.appendChild(b);
    });
  }

  function renderCaption() {
    var card = el("caption");
    if (stageIdx < 0) {
      card.classList.remove("show");
      el("stat-chip").textContent = t(G.ui.ready);
      return;
    }
    var s = G.stages[stageIdx];
    el("cap-n").textContent = String(stageIdx + 1).padStart(2, "0") + " / " + String(G.stages.length).padStart(2, "0");
    el("cap-name").textContent = t(s.name);
    el("cap-note").textContent = t(s.note);
    el("stat-chip").textContent = t(s.stat);
    card.classList.remove("show");
    void card.offsetWidth;
    card.classList.add("show");
  }

  function renderPacket() {
    var box = el("packet");
    clear(box);
    if (!packed.length) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = t(G.ui.packetEmpty);
      box.appendChild(p);
      return;
    }
    var list = document.createElement("div");
    list.className = "packet-list";
    var used = 0;
    packed.forEach(function (item, i) {
      used += item.cost;
      var c = document.createElement("div");
      c.className = "pchip";
      c.style.setProperty("--pc", "var(--g-" + item.node.type + ")");
      c.style.animationDelay = (i * 90) + "ms";
      var row = document.createElement("div");
      row.className = "row";
      var b = document.createElement("b");
      b.textContent = t(item.node.data.name);
      var cost = document.createElement("span");
      cost.className = "cost";
      cost.textContent = item.cost + " tok";
      row.appendChild(b); row.appendChild(cost);
      var tag = document.createElement("span");
      tag.textContent = t(item.tag);
      c.appendChild(row); c.appendChild(tag);
      c.addEventListener("click", function () { select(item.node.id); });
      list.appendChild(c);
    });
    box.appendChild(list);

    var bar = document.createElement("div");
    bar.className = "bar";
    var fill = document.createElement("i");
    bar.appendChild(fill);
    box.appendChild(bar);
    var note = document.createElement("div");
    note.className = "bar-note";
    note.innerHTML = "<span></span><span></span>";
    note.firstChild.textContent = t(G.ui.budgetLabel);
    note.lastChild.textContent = used + " / " + G.meta.budget;
    box.appendChild(note);
    requestAnimationFrame(function () { fill.style.width = Math.min(100, used / G.meta.budget * 100) + "%"; });

    var btn = document.createElement("button");
    btn.className = "btn ghost";
    btn.style.marginTop = "12px";
    btn.textContent = t(G.ui.showJson);
    var pre = document.createElement("pre");
    pre.className = "json";
    pre.hidden = true;
    pre.textContent = JSON.stringify({
      query: t(byId["query.why_paper"].data.title),
      as_of: G.meta.asOf,
      budget: { used: used, limit: G.meta.budget },
      items: packed.map(function (item) {
        return {
          id: item.node.id,
          type: item.node.type,
          role: t(item.tag),
          labels: badges[item.node.id] || [],
          tokens: item.cost
        };
      })
    }, null, 2);
    btn.addEventListener("click", function () {
      pre.hidden = !pre.hidden;
      btn.textContent = pre.hidden ? t(G.ui.showJson) : t(G.ui.hideJson);
    });
    box.appendChild(btn);
    box.appendChild(pre);
  }

  function select(id) {
    selected = id;
    nodes.forEach(function (n) { n.el.classList.toggle("is-selected", n.id === id); });
    renderInspector();
  }

  function renderInspector() {
    var box = el("inspector");
    clear(box);
    if (!selected || !byId[selected]) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = t(G.ui.inspectorEmpty);
      box.appendChild(p);
      return;
    }
    var n = byId[selected], d = n.data;
    box.style.setProperty("--ic", "var(--g-" + n.type + ")");

    var chip = document.createElement("span");
    chip.className = "insp-type";
    chip.textContent = t(G.nodeTypes[n.type].name);
    box.appendChild(chip);

    if (n.pinned) {
      var pin = document.createElement("span");
      pin.className = "insp-type";
      pin.style.marginLeft = "6px";
      pin.style.setProperty("--ic", "var(--muted)");
      pin.textContent = t(G.ui.pinned);
      box.appendChild(pin);
    }

    var name = document.createElement("div");
    name.className = "insp-name";
    name.textContent = d.id;
    box.appendChild(name);

    var title = document.createElement("h3");
    title.className = "insp-title";
    title.textContent = t(d.title);
    box.appendChild(title);

    var body = document.createElement("p");
    body.className = "insp-body";
    body.textContent = t(d.body);
    box.appendChild(body);

    var st = status[n.id];
    var why = reasons[n.id];
    if (st || why) {
      box.appendChild(head(G.ui.statusHeading));
      var sp = document.createElement("p");
      sp.className = "insp-body";
      sp.textContent = t(G.statuses[st] || G.ui.idle) + (why ? " — " + t(why) : "");
      box.appendChild(sp);
    }

    var list = badges[n.id];
    if (list && list.length) {
      box.appendChild(head(G.ui.labelsHeading));
      var tags = document.createElement("div");
      tags.className = "tags";
      list.forEach(function (label) {
        var s = document.createElement("span");
        s.className = "tag2 " + (labelTone(label) === "good" ? "" : labelTone(label));
        s.textContent = label;
        tags.appendChild(s);
      });
      box.appendChild(tags);
      var note = document.createElement("p");
      note.className = "label-note";
      note.textContent = list.map(function (l) { return t(G.labels[l]); }).join(" · ");
      box.appendChild(note);
    }

    if (d.fields && d.fields.length) {
      box.appendChild(head(G.ui.fieldsHeading));
      var dl = document.createElement("dl");
      dl.className = "fields";
      d.fields.forEach(function (f) {
        var row = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = f.k;
        var dd = document.createElement("dd"); dd.textContent = f.v;
        row.appendChild(dt); row.appendChild(dd);
        dl.appendChild(row);
      });
      box.appendChild(dl);
    }

    var conns = adjacency[n.id] || [];
    if (conns.length) {
      box.appendChild(head(G.ui.connections));
      var cwrap = document.createElement("div");
      cwrap.className = "conn";
      conns.forEach(function (c) {
        var b = document.createElement("button");
        var k = document.createElement("span");
        k.className = "k";
        k.textContent = (c.dir === "out" ? "→ " : "← ") + c.edge.kind;
        var v = document.createElement("span");
        v.textContent = t(c.other.data.name);
        b.appendChild(k); b.appendChild(v);
        b.addEventListener("click", function () { select(c.other.id); });
        cwrap.appendChild(b);
      });
      box.appendChild(cwrap);
    }
  }
  function head(str) {
    var h = document.createElement("div");
    h.className = "sub-head";
    h.textContent = t(str);
    return h;
  }

  function renderLegend() {
    var box = el("legend");
    clear(box);
    var g1 = document.createElement("div");
    g1.className = "legend-group";
    g1.appendChild(legendHead(G.ui.nodesLegend));
    Object.keys(G.nodeTypes).forEach(function (type) {
      var row = document.createElement("div");
      row.className = "legend-row";
      var s = document.createElementNS(NS, "svg");
      s.setAttribute("width", "26"); s.setAttribute("height", "22"); s.setAttribute("viewBox", "-13 -11 26 22");
      var path = svgEl("path", {
        d: shapePath(type, 8),
        fill: "color-mix(in srgb, var(--g-" + type + ") 20%, transparent)",
        stroke: "var(--g-" + type + ")", "stroke-width": "1.6"
      });
      s.appendChild(path);
      row.appendChild(s);
      var lbl = document.createElement("b");
      lbl.textContent = t(G.nodeTypes[type].name);
      row.appendChild(lbl);
      g1.appendChild(row);
    });
    box.appendChild(g1);

    var g2 = document.createElement("div");
    g2.className = "legend-group";
    g2.appendChild(legendHead(G.ui.edgesLegend));
    Object.keys(G.edgeTypes).forEach(function (kind) {
      var row = document.createElement("div");
      row.className = "legend-row";
      var s = document.createElementNS(NS, "svg");
      s.setAttribute("width", "26"); s.setAttribute("height", "22"); s.setAttribute("viewBox", "0 0 26 22");
      var line = svgEl("path", { class: "edge kind-" + kind + " on", d: "M 2,11 L 24,11" });
      s.appendChild(line);
      row.appendChild(s);
      var wrapTxt = document.createElement("span");
      var b = document.createElement("b");
      b.textContent = t(G.edgeTypes[kind].name);
      wrapTxt.appendChild(b);
      row.appendChild(wrapTxt);
      g2.appendChild(row);
    });
    box.appendChild(g2);
  }
  function legendHead(str) {
    var h = document.createElement("div");
    h.className = "legend-head";
    h.textContent = t(str);
    return h;
  }

  /* ----------------------------------------------------------- chrome UI -- */

  function updateDock() {
    var done = stageIdx >= G.stages.length - 1;
    el("ui-play").textContent = playing ? t(G.ui.pause) : done ? t(G.ui.replay) : t(G.ui.play);
    el("step").disabled = done;
  }

  function renderChrome() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = "Project Pinecone · " + t(G.ui.title);
    el("ui-title").textContent = t(G.ui.title);
    el("ui-sub").textContent = t(G.ui.subtitle);
    el("ui-back").textContent = t(G.ui.back);
    el("ui-stages").textContent = t(G.ui.stagesTitle);
    el("ui-legend").textContent = t(G.ui.legendTitle);
    el("ui-inspector").textContent = t(G.ui.inspectorTitle);
    el("ui-packet").textContent = t(G.ui.packetTitle);
    el("ui-kbd").textContent = t(G.ui.kbd);
    el("ui-step").textContent = t(G.ui.step);
    el("ui-reset").textContent = t(G.ui.reset);
    el("ui-cinema").textContent = document.body.classList.contains("cinema") ? t(G.ui.exitCinema) : t(G.ui.cinema);
    el("asof-chip").innerHTML = "as_of <b></b>";
    el("asof-chip").lastChild.textContent = G.meta.asOf;
    el("world-chip").textContent = t(G.meta.world);
    el("footer-note").textContent = t(G.ui.footer);
    hullLabel.textContent = t(G.ui.packetTitle);
    el("fit").title = t(G.ui.fit);
    el("relayout").title = t(G.ui.relayout);
    el("zoom-in").title = t(G.ui.zoomIn);
    el("zoom-out").title = t(G.ui.zoomOut);
    Array.prototype.forEach.call(document.querySelectorAll("#lang-seg button"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
    });
    Array.prototype.forEach.call(document.querySelectorAll("#speed-seg button"), function (b) {
      b.setAttribute("aria-pressed", parseFloat(b.dataset.speed) === speed ? "true" : "false");
    });
    nodes.forEach(setNodeLabel);
    renderLegend();
    renderStageList();
    renderCaption();
    renderPacket();
    renderInspector();
    updateDock();
  }

  function effectiveTheme() {
    var set = document.documentElement.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  el("play").addEventListener("click", play);
  el("step").addEventListener("click", function () {
    playing = false; clearTimeout(timer);
    if (stageIdx >= G.stages.length - 1) applyUpTo(-1);
    step();
    updateDock();
  });
  el("reset").addEventListener("click", reset);
  el("fit").addEventListener("click", function () { fit(true); });
  el("relayout").addEventListener("click", function () {
    nodes.forEach(function (n) { n.pinned = false; n.el.classList.remove("is-pinned"); });
    seed = Date.now() % 2147483647;
    nodes.forEach(function (n, i) {
      var a = (i / nodes.length) * Math.PI * 2 + rnd() * 0.9;
      n.x = W / 2 + Math.cos(a) * (120 + rnd() * 220);
      n.y = H / 2 + Math.sin(a) * (100 + rnd() * 190);
      n.vx = 0; n.vy = 0;
    });
    settle();
    userMovedView = false;
    fit(true);
  });
  el("zoom-in").addEventListener("click", function () { zoomAt(W / 2, H / 2, 1.22); });
  el("zoom-out").addEventListener("click", function () { zoomAt(W / 2, H / 2, 1 / 1.22); });
  el("theme-btn").addEventListener("click", function () {
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store.set("pinecone.theme", next);
  });
  el("cinema-btn").addEventListener("click", function () {
    var on = document.body.classList.toggle("cinema");
    el("cinema-btn").setAttribute("aria-pressed", on ? "true" : "false");
    el("ui-cinema").textContent = on ? t(G.ui.exitCinema) : t(G.ui.cinema);
    setTimeout(function () { resize(); fit(true); }, 60);
  });
  Array.prototype.forEach.call(document.querySelectorAll("#lang-seg button"), function (b) {
    b.addEventListener("click", function () {
      lang = b.dataset.lang;
      store.set("pinecone.lang", lang);
      renderChrome();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("#speed-seg button"), function (b) {
    b.addEventListener("click", function () {
      speed = parseFloat(b.dataset.speed);
      store.set("pinecone.speed", String(speed));
      renderChrome();
    });
  });

  document.addEventListener("keydown", function (evt) {
    if (evt.target && /^(INPUT|TEXTAREA|SELECT)$/.test(evt.target.tagName)) return;
    if (evt.key === " ") { evt.preventDefault(); play(); }
    else if (evt.key === "ArrowRight") { evt.preventDefault(); el("step").click(); }
    else if (evt.key.toLowerCase() === "r") reset();
    else if (evt.key.toLowerCase() === "f") fit(true);
    else if (evt.key.toLowerCase() === "c") el("cinema-btn").click();
    else if (evt.key === "Escape") select(null);
  });

  var userMovedView = false;
  function onResize() {
    resize();
    if (!userMovedView) fit(false);
  }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(wrap);
  else window.addEventListener("resize", onResize);

  /* --------------------------------------------------------------- boot -- */

  var savedTheme = store.get("pinecone.theme", "");
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

  buildEdges();
  buildNodes();
  resize();
  settle();
  fit(false);
  applyUpTo(-1);
  renderChrome();
  requestAnimationFrame(draw);
})();
