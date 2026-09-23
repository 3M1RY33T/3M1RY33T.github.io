---
title: Delroy
tagline: An agent harness built the slow way
summary: >
  A local-first agent harness with an effort ladder, sixteen built-in tools,
  desktop and browser control, and a project graph that survives between
  sessions. Four surfaces, one runtime, nothing leaving the machine but the
  model call.
problem: >
  Almost every agent tool asks you to choose a model. That is the wrong
  question, because it collapses two independent decisions into one: how
  hard this should try, and what it is allowed to touch. Delroy asks how
  hard instead, derives the budgets from the answer, and keeps permission on
  a separate dial entirely.
accent: "#60A5FA"
accent_wash: "rgba(96,165,250,0.14)"
icon: "/assets/img/projects/delroy.png"
icon_rounded: true
order: 2
date: 2026-06-18
status: active
stack: [Python, TypeScript, SQLite, FastAPI]
platforms: [macOS, Linux]

links:
  document: /assets/Delroy-Project-Document.pdf

metrics_verified: 2026-09-22
diagrams:
  - id: surfaces
    title: "Four surfaces, one runtime"
    nodes:
      - id: desktop
        label: "Desktop"
        meta: "native pywebview"
        row: 0
        detail:
          - "The desktop shell is a native window built with pywebview, pointed at the same local HTTP server every other surface talks to. It carries a cookie handoff for authentication rather than the bearer token the CLI and extension use, because a native embedded browser engine does not fit that model cleanly."
          - "Whether that cookie is honoured depends on a header the embedded engine emits, Sec-Fetch-Site, which cannot be unit-tested since it depends on the real engine rather than Delroy's own code. That is why the native smoke test is the one manual gate in an otherwise automated release checklist, and why every failure mode is written to fail closed: no header falls back to a loopback check and is allowed; a spurious one produces a loud 403 rather than a silent bypass."
        facts:
          - "pywebview"
          - "Sec-Fetch-Site check"
          - "one manual release gate"
      - id: web
        label: "Web"
        meta: "workspace"
        row: 0
        detail:
          - "The web workspace is the browser client under client/static, with 64 test files of its own. Like the desktop shell, the CLI and the glasses app, it is a consumer of the local HTTP server's NDJSON event stream rather than a second implementation of the agent loop."
          - "That separation is what lets the same run, a workflow, a fanned stage, a delegated sub-turn, be watched from any surface at once: the server does not know which client is reading, and a slow client simply misses events rather than corrupting shared state."
        facts:
          - "client/static"
          - "64 test files"
          - "consumes the NDJSON stream"
      - id: cli
        label: "CLI"
        meta: "delroy"
        row: 0
        detail:
          - "delroy is the command-line entry point, client/cli.py, 5,157 lines. It is the surface every headless invocation goes through: a run started with --print exits the process the moment the turn ends, which is the exact constraint that shaped how delegated sub-turns are kept alive elsewhere in the runtime."
          - "It speaks the same request path as every other surface: no separate agent loop, no separate provider integration, just a thinner rendering of the NDJSON stream the server already produces for everyone."
        facts:
          - "client/cli.py, 5,157 lines"
      - id: glasses
        label: "Even G2"
        meta: "glasses companion"
        row: 0
        detail:
          - "The Even G2 companion is a TypeScript app of 59 modules rendering chat, effort selection and spoken answers onto a monochrome display. Its firmware font covers a small, undocumented subset of Unicode: the phone panel is a WebView using the phone's own fonts, so a glyph the glasses cannot draw looks correct until tested on real hardware."
          - "On-glass probing found exactly four non-ASCII characters that draw, U+25B6, U+00B7, U+25CF, U+25BC, against thirteen probed in the same row that do not, including the smaller or hollow variant of each surviving shape: never infer a related glyph renders because a similar one does."
          - "Two layers enforce ASCII-plus-four elsewhere: a test parsing every module that fails the build on a non-ASCII literal, and a safeText() call at the display boundary catching text nobody authored. glyphs.ts is the one file allowed the four."
        facts:
          - "59 TypeScript modules"
          - "4 safe glyphs of 17 probed"
          - "glasses/src/ui/glyphs.ts"
      - id: server
        label: "local HTTP server"
        meta: "NDJSON streaming, bearer + cookie auth"
        row: 1
        detail:
          - "client/server.py is the local HTTP server every surface talks to: 250 routed endpoints, streaming NDJSON so a client renders a run event by event rather than waiting on one response. It authenticates two ways: a bearer token for programmatic clients, and a cookie handoff for the native shell, with every cross-site failure mode written to fail closed."
          - "Approvals resolve over this same surface, POST /api/approvals/{id}, which lets the desktop, a phone, the CLI and a paired set of glasses all answer one card, but that also means an approval is no longer a keypress in the window that drew the diff. Each card carries a blake2b digest over the tool, the preview and the suggested rule; a surface that never rendered the card cannot reproduce it, so approving something unseen stops being possible."
        facts:
          - "250 endpoints"
          - "NDJSON streaming"
          - "bearer + cookie auth"
          - "blake2b card digest"
      - id: runtime
        label: "agent runtime"
        meta: "tool loop, 16 tools"
        row: 2
        detail:
          - "client/agent_runtime.py, 9,544 lines, is the streaming tool-calling loop for one agent's turn: 16 development tools plus MCP, computer use and delegation. It runs on concurrency, not parallelism: a turn is almost entirely waiting, on a model reply, then a shell command, so several sub-turns in flight are sockets held open, not cores doing arithmetic. The fan-out limit is a legibility, not a hardware, ceiling."
          - "Delegation runs three ways: sequential (dispatch one, wait), concurrent (up to MAX_PARALLEL_DELEGATIONS = 4), asynchronous (up to MAX_BACKGROUND_SUBTASKS = 8, receipt, carry on). Depth caps at 1, raised to 2 only by the top level, and every branch draws one shared DelegationLedger rather than a fresh budget."
          - "Sub-turns sharing one tree own files without declaring them first: write_claims.py grants a path to whoever writes it first, refuses a live sibling, releases in a finally block. stale_text's mtime check closes the gap a release opens."
        facts:
          - "16 built-in tools"
          - "agent_runtime.py, 9,544 lines"
          - "MAX_PARALLEL_DELEGATIONS = 4"
          - "MAX_BACKGROUND_SUBTASKS = 8"
      - id: pipeline
        label: "pipeline engine"
        meta: "stages · lanes · gates · rework"
        row: 2
        detail:
          - "client/pipeline.py, 7,607 lines, builds multi-stage workflows: a routing prompt shapes the stages, and the draft passes through two pure functions, materialize_workflow_plan and lint_stage_plan: two to eight stages, last always a gate, never staffed by whoever did the work. classify_shape substitutes a curated skeleton when no model answers, a stated floor, not an understanding."
          - "The top level lets a stage discover its own width at runtime: a stage that has read the repository publishes a work-list, and widen_stage_explained fans a later stage one lane per item, refusing rather than guessing where unusable."
          - "This replaced a deleted design, a git worktree per lane: a lane needing a sibling's class wrote its own stub, and two stubs at one path caused a merge conflict that rolled the run back. One run spent 44% of total cost after that first failure and landed one file. The replacement is one shared tree, declared lane ownership."
        facts:
          - "pipeline.py, 7,607 lines"
          - "2-8 stages, gate always last"
          - "44% of spend after 1st merge fail"
          - "widen_stage_explained"
      - id: subsystems
        label: "subsystems"
        meta: "backlog · automations · MCP · voice · browser"
        row: 2
        detail:
          - "The backlog is a cross-project to-do list with dependencies and a fail-closed judge; task effort is restricted to high, extended or ultra at creation, since headless work nobody is watching should not run a thin pass. Automations are scheduled prompts modelled as a synthetic single-stage pipeline, one runtime rather than a second execution path."
          - "MCP keeps a local registry searchable in roughly 12ms, and sessions now survive past one turn in mcp_pool.py, keyed on command, environment and directory, checked for liveness, reaped when idle. Voice runs locally, whisper.cpp for recognition and piper for speech, with spoken approvals and a silence gate."
          - "Browser control reversed architecture: a headless DevTools-Protocol driver was deleted for a Chrome MV3 extension in the user's own profile, where sessions and logins already live. A canvas fixture exposed a gap in its accessibility-tree reading, generalised into a rule: grade a run on what the page says."
        facts:
          - "backlog: high/extended/ultra only"
          - "MCP registry search ~12ms"
          - "whisper.cpp + piper"
          - "MV3 extension, real profile"
      - id: policy
        label: "policy layer"
        meta: "run_policy · permission_rules · sensitive_paths"
        row: 3
        detail:
          - "Five permission modes gate mutation: auto (full access, explicit opt-in), ask (default, mutating tools pause), accept-edits (edits go through, else asks), read (no mutation) and plan (read-only, cannot submit without asking a question or declaring its own decisions). permission_rules.py layers strings like run_shell(npm *), evaluated after the mode filters."
          - "sensitive_paths.py is one credential blocklist shared by both file-tool implementations: a guard built inside only one of two executors protects only one path, and it was first built in the less dangerous branch while an in-project .env went straight through the other. Untrusted web and MCP output are fenced by untrusted_content.py."
          - "lane_ownership.py, which enforces write ownership on a shared tree, is a leaf both pipeline and agent_runtime import, so a path spelled one way cannot be checked another. This layer may never import the runtime or server, a rule stated in run_policy.py and held by the import graph."
        facts:
          - "5 modes: auto/ask/accept-edits/read/plan"
          - "permission_rules.py"
          - "sensitive_paths.py, 1 blocklist"
          - "untrusted_content.py fencing"
      - id: providers
        label: "model providers"
        meta: "10 · local and hosted"
        row: 4
        detail:
          - "The registry in providers.py lists ten providers: ollama, openrouter, openai, anthropic, google, deepseek, ollama_cloud, lmstudio, vllm and llamacpp. llama.cpp was the most recent addition, landed in the shared provider layer so every surface picked it up at once."
          - "Seven of the ten share one OpenAI-compatible request path: OpenAI, Gemini, DeepSeek, Ollama Cloud and the three local servers. Anthropic stays on its own Messages API. The local three, lmstudio, vllm and llamacpp, differ in exactly two ways: the base URL is configuration rather than a constant, and a missing key is normal, since a local server usually serves unauthenticated."
          - "Provider choice stays independent of where Delroy runs: the server binds locally and nothing leaves the machine except the model call itself, so local execution constrains the deployment, not which provider a run may call."
        facts:
          - "10 providers"
          - "7 on the OpenAI-compatible path"
          - "LOCAL_COMPAT_PROVIDERS: 3"
    edges:
      - [desktop, server]
      - [web, server]
      - [cli, server]
      - [glasses, server]
      - [server, runtime]
      - [server, pipeline]
      - [server, subsystems]
      - [pipeline, runtime]
      - [runtime, policy]
      - [policy, providers]
    steps: [desktop, web, cli, glasses, server, runtime, pipeline, subsystems, policy, providers]
    ascii: |
      ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────────────┐
      │  Desktop  │  │    Web    │  │    CLI    │  │  Even G2   │
      │  (native  │  │ workspace │  │  (delroy) │  │  glasses   │
      │  pywebview│  │           │  │           │  │  companion │
      └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬──────┘
            │              │              │              │
            └──────────────┴──────┬───────┴──────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │   Local HTTP server      │
                     │   NDJSON streaming,      │
                     │   bearer + cookie auth   │
                     └────────────┬─────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
      ┌─────▼──────┐    ┌─────────▼────────┐   ┌────────▼────────┐
      │   Agent    │    │    Pipeline      │   │  Subsystems     │
      │  runtime   │◄───┤    engine        │   │  backlog,       │
      │ 16 tools   │    │  stages · lanes  │   │  automations,   │
      │ concurrent │    │  gates · rework  │   │  MCP, voice,    │
      │ + async    │    │                  │   │  browser        │
      └─────┬──────┘    └──────────────────┘   └─────────────────┘
            │
      ┌─────▼──────────────────────────────────────────┐
      │  Policy layer: run_policy, permission_rules,   │
      │  sensitive_paths, untrusted_content,           │
      │  lane_ownership, write_claims                  │
      └──────────────────────┬─────────────────────────┘
                             │
      ┌──────────────────────▼─────────────────────────┐
      │  model providers, local and hosted             │
      └────────────────────────────────────────────────┘
tabs:
  - id: overview
    label: Overview
    bands: [problem, capabilities]
  - id: architecture
    label: Architecture
    heading: Four surfaces, one runtime
    lede: >
      A desktop app, a browser workspace, a CLI and a pair of smart glasses
      are four clients of the same local server, not four implementations.
      The chart walks down the stack on its own; choose any layer to stay on
      it.
    diagram: surfaces
    notes:
      - title: The layering is enforced by the import graph
        body: >
          The policy layer may never import the runtime or the server. That
          rule is written into the modules themselves with its reason
          attached, and the import graph obeys it, which makes it a property
          of the build rather than a convention asking politely.
      - title: Concurrency, not parallelism
        body: >
          An isolated worktree per lane was built, shipped behind a flag and
          then deleted, because the isolation caused the failure: agents that
          cannot see each other's work invent it, and the inventions collide
          at merge. Ownership on first write replaced it.
      - title: Ownership is taken, not declared
        body: >
          A partitioner cannot know the split in advance for ad-hoc
          delegation, so a lane claims a file the first time it writes one.
          Exclusion alone leaves a lost-update window, so a staleness check
          guards it alongside.
  - id: effort
    label: Effort
    heading: How hard should this try?
    lede: >
      Almost every agent tool asks you to choose a model. Delroy asks a
      different question and derives everything else from the answer.
    notes:
      - title: One dial became two axes
        body: >
          A single level answered two questions at once, so "fan out across
          twelve lanes but think cheaply in each" could not be expressed.
          The reasoning rung and the orchestration shape are now separate,
          and the fused ladder survives as a wire format rather than an
          architecture.
        evidence: EFFORT_LEVELS · ORCHESTRATION_LEVELS none · subagents · extended · ultra
      - title: The name is the value
        body: >
          A reasoning rung is not translated on the way to the provider: the
          level's name is literally what gets sent. An earlier vocabulary of
          light, standard and deep was deleted because it was a second name
          for something the provider had already named.
      - title: The rename had to be a migration
        body: >
          Two of the old names survived with different meanings, so a stored
          value was not self-describing. A read-time alias would have made
          the new meaning permanently unreachable, which turns a lookup
          table into a single UPDATE with a CASE.
  - id: measured
    label: Measured
    heading: Numbers that came from commands
    lede: >
      Every figure below was produced by a command against the repository,
      and the appendix of the project document carries the raw output.
    bands: [metrics, terminal]
  - id: depth
    label: In depth
    bands: [writeup]

metrics:
  - { label: Tests, value: "7,503", detail: "collected across 9 tiers" }
  - { label: Default tier, value: "5,895", detail: "passed, 0 failed, 0 skipped" }
  - { label: HTTP surface, value: "250", detail: "endpoints, 19 SQLite tables" }
  - { label: Commits, value: "564", detail: "since 18 June 2026" }

capabilities:
  - title: An effort ladder, not a model picker
    body: >
      Nine levels with one meaning on every surface. Seven are rungs of the
      provider's own reasoning ladder, where the level name is literally
      what gets sent. Two build multi-stage workflows instead.
  - title: The level owns the number, everything else grades it
    body: >
      A level resolves to concrete budgets: a turn-limit multiplier, a
      wall-clock ceiling from 20 to 300 minutes, and a stage-execution cap.
      Downstream stages step down from the run's rung rather than declaring
      their own, so raising the run raises everything under it.
  - title: Layering rules written into the modules
    body: >
      The policy layer may never import the runtime or the server. The agent
      runtime imports nothing from the server and takes its completion
      callable by injection. Each rule is stated in the module that carries
      it, with the reason attached, and the import graph obeys them.
  - title: Four surfaces, one runtime
    body: >
      A native desktop shell, a web workspace, a CLI and a smart-glasses
      companion all drive the same agent loop over a local HTTP server. The
      harness runs where the code does.

showcase:
  - image: /assets/img/delroy-graph.png
    caption: The project knowledge graph, built once and reused across sessions.
    alt: A node and edge graph of a codebase
  - image: /assets/img/delroy-pipeline-showcase-1.png
    caption: "A pipeline run: stages, fan-out lanes, gates, and where the run actually is."
    alt: Delroy's pipeline interface showing workflow stages in progress

post_match: [delroy]
---

## How it works

The organizing idea is the effort ladder, and the thing worth taking from
it is not the ladder but the rule underneath it: **the level owns the
number, and everything downstream grades it rather than replacing it.**

A level resolves to real budgets. `medium` scales the turn limit by 1.0 and
allows 45 minutes; `ultra` scales by 2.0 and allows 300 minutes across 40
stage executions. The scale is a multiplier rather than an override, because
the chat settings page already owns the baseline turn limit and a flat
override would make the effort module a second writer of a value the user
can see and edit.

The wall-clock ceiling exists because iteration counts do not bound time.
Stage-execution limits bound how many stages run, and rework loops re-run
stages. Without a clock, nothing bounds what a run costs.

The same grading rule reappears when stages pick their own rung. The obvious
design is a per-role table, `investigate` thinks at `low`, `plan` thinks at
`high`. It was rejected because an absolute table would make an `extended`
stage and an `ultra` stage think identically wherever the two entries
happened to agree, which is the opposite of a dial. Four gathering roles
step down one rung from the run's own. Two exceptions are where the obvious
rule is wrong: a gate never steps down whatever its role, because a verify
gate renders the verdict the whole run exists to produce, and an
unrecognised role steps down by zero, because a drafted stage declaring no
role is the common case rather than the exotic one.

**Architecturally, the distinctive property is that the layering rules are
written into the modules themselves, with reasons.** The policy layer may
never import the runtime or the server, so policies stay trivially
unit-testable. The agent runtime receives its LLM completion callable and
its tool dispatcher from the caller, so it imports nothing from the server
at all. The pipeline engine takes its per-stage runner the same way.

That discipline is what makes the test numbers possible. The two most
complex subsystems in the project can both be driven from a stub, which is
how 168 test files cover the agent loop, stage routing, cancellation, budget
exhaustion and rework semantics without ever starting a server or spending a
provider credit.

## Trade-offs

**A rename became a database migration, and the reason is worth the
paragraph.** The single-pass levels were once `light` / `standard` / `deep`,
a second vocabulary for a concept the provider already named. Deleting it
was easy for three of five identifiers. The other two were not: `ultra` and
`max` both survive as valid names with different meanings than they used to
have, so a stored `ultra` is not self-describing. It could be an old row
meaning "workflow" or a new row meaning "self-sizing workflow". A read-time
alias would make the new `ultra` permanently unreachable, so the translation
has to happen exactly once, at the only point where old and new can still be
told apart. It also had to be a single `UPDATE ... CASE` rather than five
sequential statements, because sequential ones would carry a `max` row
through `ultra` and on to `extended`, the later statement unable to
distinguish a row it just wrote from one that always said `ultra`.

**A budget that kills a run at 0.05% over is measuring the wrong thing.**
One run died 37,015 characters past a 70M ceiling, with its final gate 27
seconds old and no verdict rendered. The run's own spend was not
pathological; what had happened was that a single delegated sub-turn sat in
one blocked provider call for 75.6 minutes, and the verification stage
consumed 48.4% of the whole allowance because nothing bounded an individual
turn. Both were fixed per-turn, and only then was the ceiling raised to
100M, because once the real failure is fixed the ceiling has to cover a
healthy run of that size rather than an unbounded one.

**A budget can go missing rather than be set badly.** `extended` had no run
ceiling at all, and because the per-turn spend cap, the landing reserve and
the quota abort are all derived from what the ledger has left, a level with
no ledger had none of them either. It was the only orchestration level with
a 26-stage ceiling and nothing bounding what those stages could spend.

**One `with` statement hid four bugs.** Using `with` on a SQLite connection
commits the transaction but never closes the connection. Fixing that single
idiom exposed four further real bugs the leaked handles had been masking: a
lost update in the engine, a shutdown path that never joined its watcher
threads, promotion logic clobbering a mid-build plan, and an engine started
in one place and stopped only in another.

## What I would do next

**The model does not reliably publish file-level work-lists.** A planning
stage is asked for an identifier, a focus and a complete file list per
workstream. When it emits nothing, the widener finds no work-list and the
implementation stage falls back to a single agent: the machinery is correct
and completely inert. Four required fields in one artifact may simply be too
much to ask.

**A live fan-out canary is owed, and its pass criterion is one number.** The
share of lane turns that change at least one file, currently 24%. Offline
tests can prove the partitioning, the enforcement and the failure semantics.
They cannot prove a model will cooperate.

**Budgets need rebalancing against real workloads.** In the best run to
date, survey, planning and implementation consumed the entire budget between
them. That run succeeded at implementation, with every one of the target
project's 87 tests passing, and still recorded as failed.

**Containment, as a third option alongside withholding and policing.**
Nothing currently bounds the blast radius of a command the harness has
decided to run. The dangerous-command table was enforced on two executors
while a third read a different list that defaulted to empty. Both were fixed
by installing the missing guard, and that fix is what the item questions:
two implementations of one concept, a guard added to each, and the
correctness of the whole now depending on nobody adding a third.

**The frontend has no coverage from the structural gates**, and zero of
roughly thirty survey findings touched it. For the primary interface, that
absence is much more likely to mean nobody looked than that nothing is
there.
