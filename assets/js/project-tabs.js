/* Section tabs for project pages.
 *
 * The panels are all in the markup and all visible until this runs, so a
 * page without JavaScript is just the long page it used to be and the
 * tabs behave as jump links.
 */
(function () {
  "use strict";

  function init() {
    var nav = document.querySelector("[data-project-tabs]");
    if (!nav) return;

    var tabs = Array.prototype.slice.call(nav.querySelectorAll("[data-tab]"));
    if (tabs.length < 2) return;

    var panels = {};
    tabs.forEach(function (tab) {
      var id = tab.dataset.tab;
      var panel = document.getElementById(id);
      if (panel) panels[id] = panel;
    });

    var ids = Object.keys(panels);
    if (ids.length < 2) return;

    document.documentElement.classList.add("has-project-tabs");
    var current = null;

    function activate(id, opts) {
      if (!panels[id] || id === current) return false;
      current = id;
      tabs.forEach(function (tab) {
        var on = tab.dataset.tab === id;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      ids.forEach(function (key) {
        panels[key].hidden = key !== id;
      });
      if (opts && opts.hash) {
        try { history.replaceState(null, "", "#" + id); } catch (err) { /* file:// */ }
      }
      // A panel that was hidden has never been measured, so anything
      // inside it that draws from layout has to be told to look again.
      window.dispatchEvent(new Event("resize"));
      return true;
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        activate(tab.dataset.tab, { hash: true });
        if (nav.getBoundingClientRect().top < 0) {
          nav.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        next.focus();
        activate(next.dataset.tab, { hash: true });
      });
    });

    // A link into a hidden panel (the Install button points at
    // #quickstart) has to open that panel before it can scroll to it.
    function panelOf(node) {
      for (var key in panels) {
        if (panels.hasOwnProperty(key) && panels[key].contains(node)) return key;
      }
      return null;
    }

    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link || link.dataset.tab) return;
      var id = link.getAttribute("href").slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      var owner = panels[id] ? id : panelOf(target);
      if (!owner || owner === current) return;
      e.preventDefault();
      activate(owner, { hash: false });
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    });

    // A hash typed into the address bar, or a link that only changes the
    // hash, is a navigation within this document: nothing reloads, so
    // the tab has to follow it here as well as on first load.
    window.addEventListener("hashchange", function () {
      var id = location.hash.slice(1);
      if (!id || activate(id, { hash: false })) return;
      var target = document.getElementById(id);
      var owner = target ? panelOf(target) : null;
      if (owner && owner !== current) {
        activate(owner, { hash: false });
        target.scrollIntoView({ block: "start" });
      }
    });

    var fromHash = location.hash.slice(1);
    if (!(fromHash && activate(fromHash, { hash: false }))) {
      if (fromHash) {
        var target = document.getElementById(fromHash);
        var owner = target ? panelOf(target) : null;
        if (owner) {
          activate(owner, { hash: false });
          target.scrollIntoView({ block: "start" });
          return;
        }
      }
      activate(ids[0], { hash: false });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
