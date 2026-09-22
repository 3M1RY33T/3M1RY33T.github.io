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
order: 2
date: 2026-06-18
status: active
stack: [Python, TypeScript, SQLite, FastAPI]
platforms: [macOS, Linux]

links:
  document: /assets/Delroy-Project-Document.pdf

metrics_verified: 2026-09-22
metrics:
  - { label: Tests, value: "7,503 collected across 9 tiers" }
  - { label: Default tier, value: "5,895 passed, 0 failed, 0 skipped" }
  - { label: Surface, value: "225 HTTP endpoints, 19 SQLite tables" }
  - { label: History, value: "564 commits since 18 June 2026" }

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
