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
    title: Four surfaces, one runtime
    nodes:
      - id: desktop
        label: "Desktop"
        meta: "native pywebview"
        row: 0
        detail: >
          One of four surfaces. Each is a client of the same local server rather than its own implementation.
      - id: web
        label: "Web"
        meta: "workspace"
        row: 0
        detail: >
          The browser workspace, talking to the same endpoints as everything else.
      - id: cli
        label: "CLI"
        meta: "delroy"
        row: 0
        detail: >
          The terminal surface. Same runtime, same policy, same nine levels.
      - id: glasses
        label: "Even G2"
        meta: "glasses companion"
        row: 0
        detail: >
          A voice command spoken into smart glasses enters here and is answered by the same runtime as a typed one.
      - id: server
        label: "local HTTP server"
        meta: "NDJSON streaming, bearer + cookie auth"
        row: 1
        detail: >
          The single point every surface goes through. Nothing bypasses it, which is why a feature added once appears on all four.
      - id: runtime
        label: "agent runtime"
        meta: "tool loop, 16 tools"
        row: 2
        detail: >
          The tool loop, with concurrent and async delegation. This is what actually runs a turn.
      - id: pipeline
        label: "pipeline engine"
        meta: "stages · lanes · gates · rework"
        row: 2
        detail: >
          Calls into the agent runtime once per stage rather than bypassing it, so a pipeline stage and a chat turn obey the same rules.
      - id: subsystems
        label: "subsystems"
        meta: "backlog · automations · MCP · voice · browser"
        row: 2
        detail: >
          The reach: everything the harness is wired into, sharing the runtime rather than reimplementing it.
      - id: policy
        label: "policy layer"
        meta: "run_policy · permission_rules · sensitive_paths"
        row: 3
        detail: >
          May never import the runtime or the server. The import graph enforces the layering rather than a convention asking politely.
      - id: providers
        label: "model providers"
        meta: "local and hosted"
        row: 4
        detail: >
          The bottom of the stack. Which one answers is a configuration detail, not an architectural one.
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
      Step down the stack, or click any layer.
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
