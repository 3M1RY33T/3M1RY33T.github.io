# Graph Report - 3M1RY33T.github.io  (2026-07-11)

## Corpus Check
- 24 files · ~307,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 200 nodes · 346 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86d33230`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard.js
- <img src="../assets/img/urthreads.png" alt="" width="40" height="40" align="left" style="margin-right: 20px;" /> Dashboard
- parseDateInputValue
- backup-d1.js
- likes-worker.js
- package.json
- comments.rb
- 2026-05-11-tensor-serve-v0.2.0.md
- updateCommentSettings
- Security Policy
- Blog Engagement Worker
- 2026-05-26-website-updates-urthreads.md
- comments
- 2026-05-16-launching-my-portfolio-and-blog.md

## God Nodes (most connected - your core abstractions)
1. `refreshAll()` - 15 edges
2. `parseDateInputValue()` - 13 edges
3. `<img src="../assets/img/urthreads.png" alt="" width="40" height="40" align="left" style="margin-right: 20px;" /> Dashboard` - 13 edges
4. `requestAdmin()` - 12 edges
5. `setStatus()` - 10 edges
6. `updateCommentSettings()` - 9 edges
7. `restoreSessionAfterRefresh()` - 9 edges
8. `handleComments()` - 9 edges
9. `[<img src="assets/svg/favicon.svg" alt="" width="50" height="50" align="center"/>Website](https://3m1ry33t.github.io/)` - 9 edges
10. `renderStatsDateCalendar()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `addDeniedKeywordFromPopover()` --calls--> `setStatus()`  [EXTRACTED]
  urthreads/dashboard.js → urthreads/dashboard.js  _Bridges community 0 → community 8_
- `selectAuditDate()` --calls--> `safeLoadAuditLogs()`  [EXTRACTED]
  urthreads/dashboard.js → urthreads/dashboard.js  _Bridges community 2 → community 0_

## Import Cycles
- None detected.

## Communities (21 total, 2 thin omitted)

### Community 0 - "dashboard.js"
Cohesion: 0.10
Nodes (42): canAttemptCookieSession(), clearAdminSession(), closeAuthPrompt(), confirmCommentAction(), copyTextToClipboard(), endpoint(), endSession(), formatAuditAction() (+34 more)

### Community 1 - "<img src="../assets/img/urthreads.png" alt="" width="40" height="40" align="left" style="margin-right: 20px;" /> Dashboard"
Cohesion: 0.08
Nodes (22): About The Repository, Built With, External Blog Posts, Featured Areas, [<img src="assets/svg/favicon.svg" alt="" width="50" height="50" align="center"/>Website](https://3m1ry33t.github.io/), Live Site, Website Features, What I Share Here (+14 more)

### Community 2 - "parseDateInputValue"
Cohesion: 0.19
Nodes (22): clampStatsStartDate(), formatStatsDateLabel(), getLatestStatsStartDate(), getRollingStatsStartDate(), loadStats(), parseDateInputValue(), parseStatsRangeDays(), renderAuditDateCalendar() (+14 more)

### Community 3 - "backup-d1.js"
Cohesion: 0.15
Nodes (16): backupDir, backupPath, data, databaseName, tables, timestamp, getDatabaseName(), parseWranglerJson() (+8 more)

### Community 4 - "likes-worker.js"
Cohesion: 0.28
Nodes (15): createComment(), fetch(), formatTimestamp(), getApprovedComments(), getCorsHeaders(), getLikeCount(), handleComments(), handleLikes() (+7 more)

### Community 5 - "package.json"
Cohesion: 0.18
Nodes (10): dependencies, urthreads, devDependencies, wrangler, name, private, scripts, d1:backup (+2 more)

### Community 6 - "comments.rb"
Cohesion: 0.27
Nodes (7): list_comments(), print_rows(), results_for(), run_sql(), set_status(), show_comment(), truncate()

### Community 7 - "2026-05-11-tensor-serve-v0.2.0.md"
Cohesion: 0.22
Nodes (8): Backward Compatibility, Latency (P99) by Profile, Performance Notes, Quality (Normalized MAP@5) by Profile, Quick Start, Summary, Switch to a Profile with the CLI, View Available Profiles

### Community 8 - "updateCommentSettings"
Cohesion: 0.43
Nodes (8): addDeniedKeywordFromPopover(), clearPendingKeywordDelete(), createTrashIcon(), removeDeniedKeywordFromPopover(), renderDeniedKeywordsPopover(), setKeywordPopoverOpen(), setPendingKeywordDelete(), updateCommentSettings()

### Community 9 - "Security Policy"
Cohesion: 0.33
Nodes (5): Reporting a Vulnerability, Repository Use, Scope, Security Policy, Supported Project

### Community 10 - "Blog Engagement Worker"
Cohesion: 0.33
Nodes (5): Blog Engagement Worker, Deploy, Moderating Comments, Troubleshooting, Updating the Dashboard

### Community 11 - "2026-05-26-website-updates-urthreads.md"
Cohesion: 0.50
Nodes (3): What Changed, What Comes Next, Why urthreads

## Knowledge Gaps
- **58 isolated node(s):** `name`, `private`, `type`, `d1:backup`, `d1:migrate:urthreads` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `refreshAll()` connect `dashboard.js` to `updateCommentSettings`, `parseDateInputValue`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `name`, `private`, `type` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09948979591836735 - nodes in this community are weakly interconnected._
- **Should `<img src="../assets/img/urthreads.png" alt="" width="40" height="40" align="left" style="margin-right: 20px;" /> Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `backup-d1.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._