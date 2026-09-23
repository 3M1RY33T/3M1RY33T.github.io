---
title: loci
tagline: Scoped memory for coding agents
summary: >
  Works out which project a question is about before it searches anything,
  and abstains instead of guessing when it has no material to answer from.
problem: >
  An agent that remembers everything remembers the wrong project. Put ten
  repositories in one index and the largest one wins regardless of the
  question: measured against a merged graph of ten real repositories, one
  question returned 18% on-topic nodes and another returned 2%, with almost
  every result drawn from the biggest project. The trap is that the same
  index scores 98% whenever the answer happens to live in the largest
  corpus, so a merged index tested on a few questions can look excellent
  while being badly broken.
accent: "#A78BFA"
accent_wash: "rgba(167,139,250,0.14)"
icon: "/assets/img/projects/loci.svg"
order: 1
date: 2026-08-27
status: active
stack: [Python, Rust, NumPy]
platforms: [macOS, Linux]

links:
  github: https://github.com/3M1RY33T/loci
  package: https://pypi.org/project/loci-mem/
  package_label: PyPI
  document: /assets/loci-Project-Document.pdf

install: pip install loci-mem
install_note: >
  The distribution is loci-mem; the command, the import and the project are
  all loci. PyPI's loci is an unrelated outlier-detection package abandoned
  in 2018, so the split is forced. It is the same shape as python-dateutil
  installing as dateutil.

metrics_verified: 2026-09-22
metrics:
  - { label: Tests, value: "400", detail: "passed, 14 skipped, in 37.2s" }
  - { label: Routing, value: "<1ms", detail: "flat from 25 to 100 scopes" }
  - { label: Source, value: "10,234", detail: "lines, Python and Rust" }
  - { label: Releases, value: "6", detail: "across 99 commits" }

diagrams:
  - id: routing
    title: A question entering the pipeline
    query: loci ask "why was the session cookie dropped on localhost?"
    query_label: asked
    nodes:
      - id: ask
        label: "loci ask \"…\""
        meta: "the question, cwd, --group"
        row: 0
        detail: >
          The question as typed, plus the directory you are standing in and any --group flag. --scope NAME jumps past routing straight to the fan-out, and drops the episode gate with it: that gate exists to stop an answer arriving from the wrong scope, and you have just named the right one.
      - id: confinement
        label: "confinement"
        meta: "groups.py"
        row: 1
        detail: >
          Reads the registry and groups.json. Never the index, never a model. With --group X the eligible set is the members of that group, in all three modes; otherwise it is the strictest group of the scope you are standing in.
      - id: route
        label: "route"
        meta: "router.py"
        row: 2
        detail: >
          Reads scope_index.json, a map from token to {scope: node_df}. One dictionary lookup per query token, deterministic, sub-millisecond, and no model call anywhere in it.
      - id: abstain
        label: "ABSTAIN"
        meta: "out_of_group · deictic · no_evidence"
        row: 3
        kind: refusal
        detail: >
          The other way out of route, and a first-class outcome rather than an error. It names the cause, lists the scopes with a claim on the question and what each one holds, names the flag that would fix it, and queries nothing at all.
      - id: scopes
        label: "selected scopes"
        meta: "at most 3"
        row: 3
        detail: >
          One thread each. Neither store is ever queried across a scope boundary, so isolation is a property of the fan-out rather than a filter applied to the results afterwards.
      - id: expand
        label: "expand the question"
        meta: "against this scope's postings"
        row: 4
        detail: >
          Query expansion runs against this scope's own postings, a dictionary lookup, so a token the scope does not hold cannot enter its query. That is what makes the isolation structural rather than cosmetic.
      - id: structure
        label: "structure store"
        meta: "graphify"
        row: 5
        detail: >
          What calls what, answered with file and line citations.
      - id: episode
        label: "episode store"
        meta: "BM25 + char 3-5 gram + embeddings"
        row: 5
        detail: >
          What happened and why, from READMEs, commit bodies and docstrings. The three signals are fused, then gated.
      - id: answer
        label: "merged, cited answer"
        meta: "one block per scope"
        row: 6
        detail: >
          One block per scope, each carrying its own citations, so an answer drawn from two projects never reads as one voice.
    edges:
      - [ask, confinement]
      - [confinement, route]
      - [route, abstain]
      - [route, scopes]
      - [scopes, expand]
      - [expand, structure]
      - [expand, episode]
      - [structure, answer]
      - [episode, answer]
    steps: [ask, confinement, route, abstain, scopes, expand, structure, episode, answer]
    ascii: |
      loci ask "why was the session cookie dropped on localhost?"
        │
        │   --scope NAME jumps past routing to the fan-out, and drops the episode
        │   gate with it: that gate exists to stop an answer arriving from the
        │   wrong scope, and you have just named the right one.
        ▼
      confinement                                                       groups.py
        │   reads the registry and groups.json. Never the index, never a model.
        │     --group X  ─▶  eligible = members of X, in ALL THREE modes
        │     else cwd   ─▶  the strictest group of the scope you are standing in
        ▼
      route                                                             router.py
        │   reads scope_index.json: token ─▶ {scope: node_df}. One dict lookup per
        │   query token. Deterministic, sub-millisecond, no model call.
        │
        ├──▶ ABSTAIN, naming the cause, listing the scopes with a claim on the
        │             question and what each one holds, naming the flag that
        │             fixes it, and querying nothing. An outcome, not an error.
        ▼
      selected scopes, at most 3        one thread each; neither store is ever
        │                               queried across a scope boundary
        ├─── scope ─── scope ─── scope
        │      │
        │      │  expand the question against THIS scope's postings, a dict lookup,
        │      │  so a token the scope does not have cannot be invented
        │      │
        │      ├─ structure store   graphify query, what calls what, with file:line
        │      │
        │      └─ episode store     BM25 + char 3-5 gram + embeddings, fused, gated
        ▼
      merged, cited answer, one block per scope

tabs:
  - id: overview
    label: Overview
    bands: [problem, capabilities, quickstart]
  - id: routing
    label: Routing
    heading: How a question gets routed
    lede: >
      Everything above the fan-out is one function. It scores every scope in
      the corpus, then asks three refusal questions in a fixed order. Step
      through it, or click any stage.
    diagram: routing
    notes:
      - title: Both stages refuse independently
        body: >
          The router can decline to select a scope at all, and a scope it did
          select can still hand back nothing. Those are different failures
          with different fixes, and collapsing them into one "no results"
          would hide which happened.
      - title: Weight is not usefulness
        body: >
          Naming the project outright is worth 6.0 and standing inside its
          tree is worth 4.0, yet cwd is the signal that carries most real
          questions, because most real questions name no project at all.
        evidence: ALIAS_BOOST 6.0 · CWD_BOOST 4.0 · RECENCY 0.15
      - title: The penalty lands before the boosts
        body: >
          A demoted scope is halved first, then boosted. A group penalty
          applied after a 6.0 alias boost is a rounding error; applied
          before, it does what it was written to do.
        evidence: GROUP_PENALTY 0.5
  - id: evidence
    label: Measured
    heading: What was measured
    lede: >
      Every number here came from a command run against the repository, and
      the ones that moved the design are the ones that contradicted it.
    bands: [metrics, terminal]
    notes:
      - title: The merged index fails in only one direction
        body: >
          Against a merged graph of ten real repositories, one question
          returned 18% on-topic nodes and another 2%, while a third scored
          98% purely because the answer happened to live in the largest
          corpus. The same index looks excellent and is badly broken.
        evidence: 18% · 2% · 98% on three real questions
      - title: Deixis detection, measured
        body: >
          Questions that point at a subject they never name ("how does this
          handle retries") took abstention from 37.5% to 100% once deixis
          was detected rather than scored.
        evidence: 37.5% to 100%
      - title: Reranking was measured and shipped off
        body: >
          A cross-encoder moved precision@1 from 2/6 to 3/6 and cost about
          96ms a query, with two small regressions alongside the gain. It
          ships behind a flag rather than on.
        evidence: ~96ms per query
  - id: depth
    label: In depth
    bands: [writeup]

capabilities:
  - title: Routes before it searches
    body: >
      The scope decision happens first, from one dictionary lookup per query
      token, and costs less than a millisecond flat from 25 registered
      projects to 100. Nothing is retrieved until the question has been
      attributed to a project.
  - title: Two stores, not one
    body: >
      A structure store for what calls what, with file and line citations,
      and an episode store for what happened and why, built from READMEs,
      commit bodies and docstrings. Questions about shape and questions
      about history are different queries against different material.
  - title: Abstains with its working shown
    body: >
      Both stages refuse independently: the router can decline to pick a
      scope, and a scope it did pick can still return nothing. Those are
      different failures with different fixes, so they are reported
      separately rather than collapsed into "no results".
  - title: No model in the query path
    body: >
      Routing and retrieval are arithmetic. There is no inference call
      between the question and the answer, which is why the latency is flat,
      the behaviour is reproducible, and the tool runs with no API key.

terminal:
  - cwd: ~/Documents/GitHub/urthreads
    cmd: loci ask "how does rate limiting work"
    out: |
      ROUTED -> urthreads   (score=5.055)

      urthreads   expanded: ['rate', 'limiting', 'cloudflare', 'rules', 'limit', 'key']

      --- episodes

        [0.7497] doc:SECURITY.md > Security Policy > Cloudflare Rate Limiting Rules
            The Worker implements D1-backed rate limiting for public POST
            endpoints as a defense-in-depth measure. For production
            deployments, also configure Cloudflare edge rate limiting rules.

        [0.6556] commit:c1b5769d04 > fix(security): eliminate command injection,
            add rate limiting, session revocation, and crypto hardening
  - cmd: loci ask "how is payroll calculated"
    out: |
      ABSTAINED - not enough of the question exists in any project.
        no project holds a distinctive term from this question
        -- `loci doctor` shows what is not indexed.

post_match: [loci]
---

## How it works

One query runs through three stages, and each can stop the query dead.

**Confinement** reads the registry and decides which scopes are even
eligible. It never touches the index and never calls a model. Standing
inside a project directory confines the query to the strictest group that
project belongs to; `--group` names one explicitly.

**Routing** scores every eligible scope from a single dictionary lookup per
query token against a prebuilt token-to-scope index. The evidence base is
the sum of scope-IDF times prominence, divided by query length and by size
raised to 0.15, and then adjusted: a demotion halves it, naming the project
outright adds 6.0, the working directory adds 4.0, and recency adds 0.15 as
a tiebreak and no more.

The order matters exactly once, and then permanently. The group penalty is
applied *before* the boosts rather than after, because a penalty applied
after a 6.0 alias boost is a rounding error. Applied first, it does what it
was written to do.

Weight is not the same as usefulness. The working directory carries less
weight than an alias, 4.0 against 6.0, and yet it is the signal that carries
most real questions, because most real questions name no project at all.
"How is this deployed?" and "how do I run the tests?" route correctly every
time with the working directory and are unanswerable without it.

Then three refusal gates fire in a fixed order: the corpus-wide winner sits
outside a hard group and would itself have routed; the question points at a
subject it never names; or none of three OR'd evidence tests passes. The
three evidence tests are OR'd rather than ANDed because they fail on
different question shapes. A short question about a rare symbol has high
evidence and few matched tokens; a long question about a familiar subsystem
has the reverse. Requiring both abstains on both.

**Fan-out** runs at most three scopes, one thread each. Query expansion
happens against each scope's own postings, so a token a scope does not hold
cannot enter its query. That is what makes the isolation real rather than a
filter applied afterwards.

## Trade-offs

**Adding embeddings destroyed abstention, and the fix is ugly on purpose.**
Every chunk gets a nonzero similarity score, so an absolute floor stops
firing and the store starts answering everything. The fix is a two-tier
gate: a hit must be lexically grounded *or* semantically confident. Those
two conditions are OR'd rather than ANDed, because a lexical gate alone
would reject exactly the matches embeddings were added to find.

**Reranking is available and off by default, and the reason is a weak
measurement rather than taste.** A cross-encoder reranker moved precision at
1 from 2 of 6 to 3 of 6, at roughly 96ms per query, with two small
regressions, on six cases whose labels are themselves arguable. A feature
that improves one case, regresses two, costs 96ms and is judged on six
debatable labels is a feature that should exist and be off.

**The character-gram ranker is the one that looks skippable and is not.**
Episode search fuses BM25 for exact terminology, character 3 to 5 grams for
morphology and casing, and optional local embeddings for meaning without
shared words. The gram ranker recovers a class of match neither of the
others sees, `samesite` against `SameSite=None` among them, and it costs no
model at all.

**graphify is a dependency and never a fork.** The structure store reads
graphify's `graph.json` contract through a 206-line adapter, so a different
extractor can be substituted without touching anything above the backend
layer. Those 206 lines buy the ability to have been wrong about the
extractor choice.

## What I would do next

**Aisles inside a shop.** A word in a test fixture counts exactly like the
same word in shipped code. That is easy to state and hard to fix without a
second layer of scoping inside each scope, and it is the largest known
source of vocabulary noise.

**The case the tool exists for is the weakest one measured.** Questions
where two scopes should legitimately both come back returned only one in
three of twelve cases. The set-selection rule was written for exactly this
and is evidently not sufficient for it.

**The constants were fitted on ten scopes and now run against fifteen.** The
shipped evidence floor is 7.6 against a floor of 5.411 fitted on the current
corpus, which says the default is already noticeably off for the corpus it
was developed on, and that is the corpus most likely to resemble a first
user's.

**A deleted project stays in the registry.** It is reported rather than
removed, because the entry carries groups and aliases set by hand and the
directory may only be unmounted. That is the right default and it is not a
complete answer.
