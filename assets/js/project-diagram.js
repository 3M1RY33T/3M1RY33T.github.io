/* Interactive schematics for project pages.
 *
 * Each [data-diagram] figure carries its nodes and edges as JSON. This
 * draws the chart on the left, as real elements with the edges painted on
 * an SVG beneath, and the selected stage's description on the right.
 *
 * The chart tours itself: it cycles through the stages, always showing
 * one description, and holds while the pointer or keyboard focus is on
 * the diagram so text does not change under a reader. Choosing a stage
 * ends the tour; it resumes after three minutes without interaction,
 * but not while the pointer is still over the diagram.
 *
 * If this never runs, the verbatim ASCII diagram from the project
 * document stays on the page, which is why it is in the markup.
 */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var IDLE_RESUME_MS = 3 * 60 * 1000;
  // Dwell scales with the length of the description, within bounds.
  var DWELL_MIN = 7000;
  var DWELL_MAX = 15000;
  var DWELL_PER_WORD = 120;

  var STATUS = {
    auto: "Touring the stages · hover to hold, click one to choose",
    held: "Holding while you read",
    manual: "Showing your choice · the tour resumes after 3 minutes idle",
    paused: "Paused"
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  // Control icons on a 24 unit grid. Play and pause are filled, as media
  // controls conventionally are, with round joins softening the corners;
  // the step chevrons are strokes, like the rest of the site's icons.
  var ICONS = {
    play: [["path", { d: "M8 5.5v13l10.5-6.5z" }]],
    pause: [["rect", { x: "6.5", y: "5", width: "3.5", height: "14", rx: "1" }],
            ["rect", { x: "14", y: "5", width: "3.5", height: "14", rx: "1" }]],
    prev: [["path", { d: "M14.5 6l-6 6 6 6" }]],
    next: [["path", { d: "M9.5 6l6 6-6 6" }]]
  };

  function icon(name) {
    var filled = name === "play" || name === "pause";
    var node = svgEl("svg", {
      viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false",
      fill: filled ? "currentColor" : "none", stroke: "currentColor",
      "stroke-width": filled ? "1.5" : "2.25",
      "stroke-linecap": "round", "stroke-linejoin": "round"
    });
    ICONS[name].forEach(function (part) { node.appendChild(svgEl(part[0], part[1])); });
    return node;
  }

  function iconButton(cls, name, label) {
    var b = el("button", cls);
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.dataset.label = label;
    b.appendChild(icon(name));
    return b;
  }

  function paragraphs(detail) {
    if (!detail) return [];
    if (Array.isArray(detail)) return detail.filter(Boolean);
    return String(detail).split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  // Descriptions mark code with backticks. Built as text and code nodes,
  // never as HTML, so front matter cannot inject markup.
  function richParagraph(text) {
    var p = document.createElement("p");
    String(text).split("`").forEach(function (part, i) {
      if (!part) return;
      p.appendChild(i % 2 ? el("code", null, part) : document.createTextNode(part));
    });
    return p;
  }

  function isKeyboardFocus(node) {
    try { return node.matches(":focus-visible"); } catch (err) { return true; }
  }

  function build(figure) {
    var holder = figure.querySelector("[data-diagram-data]");
    if (!holder) return;

    var data;
    try { data = JSON.parse(holder.textContent); } catch (err) { return; }
    if (!data || !data.nodes || !data.nodes.length) return;

    var nodes = data.nodes;
    var edges = data.edges || [];
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    var steps = (data.steps && data.steps.length ? data.steps : nodes.map(function (n) { return n.id; }))
      .filter(function (id) { return byId[id]; });
    if (!steps.length) return;

    var root = el("div", "pd");
    var chart = el("div", "pd-chart");
    var aside = el("div", "pd-aside");

    // --- chart -------------------------------------------------------
    if (data.query) {
      var q = el("p", "pd-query");
      q.appendChild(el("span", "pd-query-label", data.query_label || "input"));
      q.appendChild(el("code", null, data.query));
      chart.appendChild(q);
    }

    var stage = el("div", "pd-stage");
    var svg = svgEl("svg", { "class": "pd-edges", "aria-hidden": "true", preserveAspectRatio: "none" });
    var defs = svgEl("defs");
    var markerId = "pd-arrow-" + Math.random().toString(36).slice(2, 8);
    var marker = svgEl("marker", {
      id: markerId, viewBox: "0 0 10 10", refX: "8", refY: "5",
      markerWidth: "5", markerHeight: "5", orient: "auto-start-reverse"
    });
    marker.appendChild(svgEl("path", { d: "M 0 1 L 8 5 L 0 9 z", fill: "currentColor" }));
    defs.appendChild(marker);
    svg.appendChild(defs);
    stage.appendChild(svg);

    var rows = [];
    nodes.forEach(function (n) {
      var r = Number(n.row) || 0;
      if (!rows[r]) rows[r] = [];
      rows[r].push(n);
    });

    var buttons = {};
    rows.forEach(function (rowNodes) {
      if (!rowNodes) return;
      var rowEl = el("div", "pd-row");
      rowNodes.forEach(function (n) {
        var b = el("button", "pd-node");
        b.type = "button";
        b.dataset.node = n.id;
        if (n.kind) b.classList.add("pd-node-" + n.kind);
        b.appendChild(el("span", "pd-node-label", n.label || n.id));
        if (n.meta) b.appendChild(el("span", "pd-node-meta", n.meta));
        b.addEventListener("click", function () {
          var i = steps.indexOf(n.id);
          select(i >= 0 ? i : 0);
        });
        rowEl.appendChild(b);
        buttons[n.id] = b;
      });
      stage.appendChild(rowEl);
    });
    chart.appendChild(stage);

    // --- description -------------------------------------------------
    var detail = el("div", "pd-detail");
    var progress = el("div", "pd-progress");
    var bar = el("span", "pd-progress-bar");
    progress.appendChild(bar);
    progress.setAttribute("aria-hidden", "true");
    var eyebrow = el("p", "pd-detail-eyebrow");
    var title = el("p", "pd-detail-title");
    var body = el("div", "pd-detail-body");
    var facts = el("ul", "pd-facts");
    // The text scrolls inside its own box so a long description never
    // pushes the controls off screen; the progress bar sits outside it.
    var inner = el("div", "pd-detail-inner");
    inner.appendChild(eyebrow);
    inner.appendChild(title);
    inner.appendChild(body);
    inner.appendChild(facts);
    detail.appendChild(progress);
    detail.appendChild(inner);

    function updateMore() {
      detail.classList.toggle("has-more", inner.scrollTop + inner.clientHeight < inner.scrollHeight - 4);
    }
    inner.addEventListener("scroll", updateMore, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(updateMore).observe(inner);
    aside.appendChild(detail);

    // --- controls ----------------------------------------------------
    var controls = el("div", "pd-controls");
    var playBtn = iconButton("pd-play", "pause", "Pause the tour");
    var playIcon = "pause";
    var prevBtn = iconButton("pd-step", "prev", "Previous stage");
    var nextBtn = iconButton("pd-step", "next", "Next stage");
    var dots = el("div", "pd-dots");
    var dotEls = steps.map(function (id, i) {
      var d = el("button", "pd-dot");
      d.type = "button";
      d.setAttribute("aria-label", "Stage " + (i + 1) + ": " + ((byId[id] && byId[id].label) || id));
      d.addEventListener("click", function () { select(i); });
      dots.appendChild(d);
      return d;
    });
    var status = el("p", "pd-status");
    controls.appendChild(playBtn);
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(dots);
    controls.appendChild(status);
    aside.appendChild(controls);

    root.appendChild(chart);
    root.appendChild(aside);

    var ascii = figure.querySelector(".project-diagram-ascii");
    if (ascii) ascii.hidden = true;
    var caption = figure.querySelector(".project-diagram-title");
    figure.insertBefore(root, caption ? caption.nextSibling : figure.firstChild);
    figure.classList.add("is-live");

    // --- edges -------------------------------------------------------
    var edgeEls = [];
    function drawEdges() {
      edgeEls.forEach(function (e) { e.remove(); });
      edgeEls = [];
      var box = stage.getBoundingClientRect();
      if (!box.width) return;
      svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
      edges.forEach(function (edge) {
        var fromId = edge[0] || edge.from;
        var toId = edge[1] || edge.to;
        var from = buttons[fromId];
        var to = buttons[toId];
        if (!from || !to) return;
        var a = from.getBoundingClientRect();
        var b = to.getBoundingClientRect();
        var x1 = a.left - box.left + a.width / 2;
        var y1 = a.top - box.top + a.height;
        var x2 = b.left - box.left + b.width / 2;
        var y2 = b.top - box.top;
        if (y2 < y1) { y1 = a.top - box.top; y2 = b.top - box.top + b.height; }
        var mid = (y1 + y2) / 2;
        var path = svgEl("path", {
          "class": "pd-edge",
          d: "M " + x1 + " " + y1 + " C " + x1 + " " + mid + ", " + x2 + " " + mid + ", " + x2 + " " + y2,
          "marker-end": "url(#" + markerId + ")"
        });
        path.dataset.from = fromId;
        path.dataset.to = toId;
        svg.appendChild(path);
        edgeEls.push(path);
      });
      paint();
    }

    // --- what is shown -----------------------------------------------
    var index = 0;

    function paint() {
      var activeId = steps[index];
      var seen = steps.slice(0, index + 1);
      nodes.forEach(function (n) {
        var b = buttons[n.id];
        if (!b) return;
        b.classList.toggle("is-active", n.id === activeId);
        b.classList.toggle("is-done", n.id !== activeId && seen.indexOf(n.id) !== -1);
        b.setAttribute("aria-current", n.id === activeId ? "step" : "false");
      });
      edgeEls.forEach(function (p) {
        var lit = seen.indexOf(p.dataset.to) !== -1 && seen.indexOf(p.dataset.from) !== -1;
        p.classList.toggle("is-lit", lit);
        p.classList.toggle("is-active", p.dataset.to === activeId);
      });
      dotEls.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.classList.toggle("is-done", i < index);
      });
    }

    function show(i) {
      index = (i + steps.length) % steps.length;
      var n = byId[steps[index]];
      eyebrow.replaceChildren(el("span", "pd-eyebrow-step", "Stage " + (index + 1) + " of " + steps.length));
      if (n.meta) eyebrow.appendChild(el("span", "pd-eyebrow-meta", n.meta));
      title.textContent = n.label || n.id;
      body.replaceChildren();
      paragraphs(n.detail).forEach(function (p) { body.appendChild(richParagraph(p)); });
      facts.replaceChildren();
      (n.facts || []).forEach(function (f) { facts.appendChild(el("li", null, f)); });
      facts.hidden = !(n.facts && n.facts.length);
      inner.scrollTop = 0;
      updateMore();
      paint();
    }

    // --- the tour ------------------------------------------------------
    // mode: "auto" tours; "manual" shows the reader's choice and resumes
    // after IDLE_RESUME_MS; "paused" waits for the Play button.
    var mode = steps.length > 1 ? "auto" : "paused";
    var hovering = false;
    var focused = false;
    var visible = false;
    var dwellTimer = null;
    var dwellLeft = 0;
    var dwellStart = 0;
    var dwellRunning = false;
    var idleTimer = null;
    var resumeOnLeave = false;

    function dwellFor(n) {
      var words = paragraphs(n.detail).join(" ").split(/\s+/).filter(Boolean).length;
      return Math.max(DWELL_MIN, Math.min(DWELL_MAX, words * DWELL_PER_WORD));
    }

    function canRun() {
      return mode === "auto" && visible && !hovering && !focused && !document.hidden;
    }

    function restartBar(ms) {
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = "pd-fill " + ms + "ms linear forwards";
      bar.style.animationPlayState = "paused";
    }

    function startDwell() {
      clearTimeout(dwellTimer);
      dwellRunning = false;
      dwellLeft = dwellFor(byId[steps[index]]);
      restartBar(dwellLeft);
      sync();
    }

    function sync() {
      var run = canRun();
      if (run && !dwellRunning && dwellLeft > 0) {
        dwellStart = Date.now();
        dwellRunning = true;
        dwellTimer = setTimeout(function () {
          dwellRunning = false;
          dwellLeft = 0;
          show(index + 1);
          startDwell();
        }, dwellLeft);
      } else if (!run && dwellRunning) {
        clearTimeout(dwellTimer);
        dwellRunning = false;
        dwellLeft = Math.max(0, dwellLeft - (Date.now() - dwellStart));
      }
      bar.style.animationPlayState = run ? "running" : "paused";

      root.classList.toggle("is-auto", mode === "auto");
      var held = mode === "auto" && !run;
      status.textContent = mode === "auto" ? (held ? STATUS.held : STATUS.auto) : STATUS[mode];
      var want = mode === "auto" ? "pause" : "play";
      if (want !== playIcon) {
        playIcon = want;
        playBtn.replaceChildren(icon(want));
        var label = want === "pause" ? "Pause the tour" : "Play the tour";
        playBtn.setAttribute("aria-label", label);
        playBtn.dataset.label = label;
      }
      // A live region that speaks every few seconds is noise; announce
      // only what the reader chose.
      detail.setAttribute("aria-live", mode === "auto" ? "off" : "polite");
    }

    function armIdle() {
      clearTimeout(idleTimer);
      resumeOnLeave = false;
      if (mode !== "manual") return;
      idleTimer = setTimeout(function () {
        if (hovering || focused) { resumeOnLeave = true; return; }
        resume(true);
      }, IDLE_RESUME_MS);
    }

    function resume(advance) {
      clearTimeout(idleTimer);
      resumeOnLeave = false;
      mode = "auto";
      if (advance) show(index + 1);
      startDwell();
    }

    function select(i) {
      show(i);
      mode = "manual";
      clearTimeout(dwellTimer);
      dwellRunning = false;
      dwellLeft = 0;
      armIdle();
      sync();
    }

    playBtn.addEventListener("click", function () {
      if (mode === "auto") {
        mode = "paused";
        clearTimeout(idleTimer);
        resumeOnLeave = false;
        clearTimeout(dwellTimer);
        dwellRunning = false;
        sync();
      } else {
        resume(false);
      }
    });
    prevBtn.addEventListener("click", function () { select(index - 1); });
    nextBtn.addEventListener("click", function () { select(index + 1); });

    root.tabIndex = 0;
    root.setAttribute("aria-label", (data.title || "Schematic") + ". Use the arrow keys to move between stages.");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { select(index + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { select(index - 1); e.preventDefault(); }
    });

    // Reading is activity: moving over the diagram restarts the idle
    // clock, at most once a second.
    var lastActivity = 0;
    function activity() {
      var now = Date.now();
      if (mode === "manual" && now - lastActivity > 1000) { lastActivity = now; armIdle(); }
    }
    root.addEventListener("pointermove", activity);
    root.addEventListener("wheel", activity, { passive: true });
    root.addEventListener("keydown", activity);

    function leftArea() {
      if (resumeOnLeave && !hovering && !focused) { resume(true); return; }
      sync();
    }
    root.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      hovering = true;
      sync();
    });
    root.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      hovering = false;
      leftArea();
    });
    // Only keyboard focus holds the tour. A clicked button keeps focus in
    // most browsers, and treating that as reading would stop the tour
    // from ever resuming once the pointer had left.
    root.addEventListener("focusin", function (e) {
      focused = isKeyboardFocus(e.target);
      sync();
    });
    root.addEventListener("focusout", function (e) {
      if (e.relatedTarget && root.contains(e.relatedTarget)) return;
      focused = false;
      leftArea();
    });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
        sync();
      }, { threshold: 0.2 }).observe(root);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", sync);

    show(0);
    drawEdges();
    if (mode === "auto") startDwell(); else sync();

    if (window.ResizeObserver) {
      new ResizeObserver(drawEdges).observe(stage);
    } else {
      window.addEventListener("resize", drawEdges);
    }
    window.addEventListener("load", drawEdges);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawEdges);
  }

  function init() {
    var list = document.querySelectorAll("[data-diagram]");
    for (var i = 0; i < list.length; i++) build(list[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
