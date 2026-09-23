/* Interactive schematics for project pages.
 *
 * Each [data-diagram] figure carries its nodes and edges as JSON. This
 * draws them as real elements with the edges painted on an SVG beneath,
 * so the labels theme, wrap and read like the rest of the page, then
 * steps a query through the pipeline one stage at a time.
 *
 * If this never runs, the verbatim ASCII diagram from the project
 * document stays on the page, which is why it is in the markup.
 */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var PLAY_MS = 2000;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
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

    // The step order defaults to the order the nodes are declared in.
    var steps = (data.steps && data.steps.length ? data.steps : nodes.map(function (n) { return n.id; }))
      .filter(function (id) { return byId[id]; });
    if (!steps.length) return;

    var root = el("div", "pd");
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

    // Query line: the thing actually entering the pipeline.
    if (data.query) {
      var q = el("p", "pd-query");
      q.appendChild(el("span", "pd-query-label", data.query_label || "input"));
      q.appendChild(el("code", null, data.query));
      root.appendChild(q);
    }

    // Rows of nodes.
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
        var label = el("span", "pd-node-label", n.label || n.id);
        b.appendChild(label);
        if (n.meta) b.appendChild(el("span", "pd-node-meta", n.meta));
        b.addEventListener("click", function () {
          stop();
          var i = steps.indexOf(n.id);
          show(i >= 0 ? i : 0);
        });
        rowEl.appendChild(b);
        buttons[n.id] = b;
      });
      stage.appendChild(rowEl);
    });
    root.appendChild(stage);

    // Detail panel, written on every step.
    var detail = el("div", "pd-detail");
    var detailTitle = el("p", "pd-detail-title");
    var detailBody = el("p", "pd-detail-body");
    detail.appendChild(detailTitle);
    detail.appendChild(detailBody);
    detail.setAttribute("aria-live", "polite");
    root.appendChild(detail);

    // Controls.
    var controls = el("div", "pd-controls");
    var playBtn = el("button", "pd-play");
    playBtn.type = "button";
    var playLabel = el("span", "pd-play-text", "Play");
    playBtn.appendChild(playLabel);
    var prevBtn = el("button", "pd-step", "Back");
    prevBtn.type = "button";
    var nextBtn = el("button", "pd-step", "Next");
    nextBtn.type = "button";
    var dots = el("div", "pd-dots");
    var dotEls = steps.map(function (id, i) {
      var d = el("button", "pd-dot");
      d.type = "button";
      d.setAttribute("aria-label", "Step " + (i + 1) + ": " + ((byId[id] && byId[id].label) || id));
      d.addEventListener("click", function () { stop(); show(i); });
      dots.appendChild(d);
      return d;
    });
    var counter = el("p", "pd-counter");
    controls.appendChild(playBtn);
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(dots);
    controls.appendChild(counter);
    root.appendChild(controls);

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
        var from = buttons[edge[0] || edge.from];
        var to = buttons[edge[1] || edge.to];
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
        path.dataset.from = edge[0] || edge.from;
        path.dataset.to = edge[1] || edge.to;
        svg.appendChild(path);
        edgeEls.push(path);
      });
      paint();
    }

    // --- state -------------------------------------------------------
    var index = 0;
    var timer = null;

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
      detailTitle.textContent = n.label || n.id;
      detailBody.textContent = n.detail || "";
      counter.textContent = (index + 1) + " of " + steps.length;
      paint();
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      root.classList.remove("is-playing");
      playLabel.textContent = "Play";
      playBtn.setAttribute("aria-label", "Play the sequence");
    }

    function play() {
      stop();
      root.classList.add("is-playing");
      playLabel.textContent = "Pause";
      playBtn.setAttribute("aria-label", "Pause the sequence");
      timer = setInterval(function () {
        if (index >= steps.length - 1) { stop(); return; }
        show(index + 1);
      }, PLAY_MS);
    }

    playBtn.addEventListener("click", function () {
      if (timer) { stop(); return; }
      if (index >= steps.length - 1) show(0);
      play();
    });
    prevBtn.addEventListener("click", function () { stop(); show(index - 1); });
    nextBtn.addEventListener("click", function () { stop(); show(index + 1); });

    root.tabIndex = 0;
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { stop(); show(index + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { stop(); show(index - 1); e.preventDefault(); }
    });

    // Pause when scrolled away, so a diagram is not animating unseen.
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (!entry.isIntersecting) stop(); });
      }, { threshold: 0.2 }).observe(root);
    }

    show(0);
    drawEdges();
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
