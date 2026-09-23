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
    title: "A question entering the pipeline"
    query: "loci ask \"why was the session cookie dropped on localhost?\""
    query_label: "asked"
    nodes:
      - id: ask
        label: "loci ask \"…\""
        meta: "the question, cwd, --group"
        row: 0
        detail:
          - "`loci ask \"<question>\"` takes three inputs: the question text, the working directory (read with `os.getcwd()` unless `--no-cwd` or `--cwd` overrides it), and an optional `--group` naming a policy group to confine to. cwd is resolved to the deepest scope whose root contains it, and that same resolution is what both the router's cwd boost and the confinement stage key off."
          - "`--scope NAME`, repeatable, skips confinement and routing entirely: it sets the scope list directly, marks the result as forced with no score, and also turns off the episode store's two-tier gate for those scopes, on the reasoning that a gate meant to stop an answer arriving from the wrong scope has nothing to check once the user has named the right one. When both `--scope` and `--group` are given, `--scope` wins and a note is printed saying so."
        facts:
          - "cwd via os.getcwd()"
          - "--scope bypasses routing"
          - "gate=not force_scopes"
          - "--group confines via groups.json"
      - id: confinement
        label: "confinement"
        meta: "groups.py"
        row: 1
        detail:
          - "`groups.confinement()` reads two files on disk: the scope registry (`scopes.json`, via `load_scopes`) and group policy (`groups.json`, via `load_policy`). It never touches `scope_index.json` and calls no model; it turns policy plus an anchor into two optional sets, `eligible` and `demoted`, that `route` consumes."
          - "Named with `--group X`, all three modes, explicit, soft and hard, confine to X's members; only the mode decides what happens when the best answer is outside them. Reached through cwd instead, the anchor is the scope containing cwd, and its groups are resolved to whichever is tied for strictest (`STRICTNESS`: explicit below soft below hard). `hard` sets `eligible` and `strict=True`, `soft` sets `demoted` to everyone outside the group, `explicit` sets neither."
        facts:
          - "groups.py: confinement()"
          - "reads scopes.json + groups.json"
          - "STRICTNESS: explicit < soft < hard"
          - "--group X confines in all 3 modes"
      - id: route
        label: "route"
        meta: "router.py"
        row: 2
        detail:
          - "`router.route()` reads `scope_index.json` (token to `{scope: node_df}`) and scores every scope: `contrib = scope_idf(t) * (1 + log1p(node_df/size * 1000))`, summed over query tokens, divided by token count and `size**SIZE_PRIOR` (0.15). A demoted scope (soft group) is penalised by `GROUP_PENALTY` 0.5 before any boost, so the penalty can never invert one. Boosts follow: `ALIAS_BOOST` 6.0 if the question names the project, `CWD_BOOST` 4.0 to the deepest containing scope only, `RECENCY_BOOST` 0.15 as a tiebreak."
          - "Three refusal checks run in a fixed order: `out_of_group` (the corpus-wide winner sits outside a hard/named group and would itself have routed), `deictic` (the question points at its subject without naming it, and nothing forced the scope), `no_evidence` (none of three OR'd gates clears: summed evidence at or above `EVIDENCE_FLOOR` 7.6, `MIN_MATCHED` 4 tokens matched, or a token held by at most 2 scopes). An alias or cwd hit is `forced` and skips the last two checks."
        facts:
          - "ALIAS_BOOST=6.0, CWD_BOOST=4.0"
          - "RECENCY_BOOST=0.15, SIZE_PRIOR=0.15"
          - "EVIDENCE_FLOOR=7.6, MIN_MATCHED=4"
          - "one dict lookup per token, sub-ms"
      - id: abstain
        label: "ABSTAIN"
        meta: "out_of_group · deictic · no_evidence"
        row: 3
        kind: refusal
        detail:
          - "Three named causes. `out_of_group`: the best-scoring scope across the whole corpus sits outside a hard or named group, and would itself have routed unconfined, so answering with the in-group runner-up would be a confident answer from the wrong project. `deictic`: the question points at its subject (`this`, `it`, `here`, `the project`) without naming it, and neither an alias nor cwd resolved what it points at. `no_evidence`: none of the three evidence gates clears the floor."
          - "Every abstention queries nothing: `ask()` empties the selected scope list before any store is called. It still hands back a shortlist, in score order: every eligible scope holding a distinctive term, one that at most half the corpus holds, listed with up to three of those terms. `_advice()` then names the flag that fixes it: `--scope <name>` when cwd already tried and failed, `loci doctor` when no scope holds a distinctive term at all."
        facts:
          - "out_of_group / deictic / no_evidence"
          - "CANDIDATE_SHARE=0.5, CANDIDATE_TERMS=3"
          - "selected = [] on abstain"
          - "_advice() names the fixing flag"
      - id: scopes
        label: "selected scopes"
        meta: "at most 3"
        row: 3
        detail:
          - "The router hands back at most `MAX_SCOPES` (3) for an ordinary question, widened from the top score by `WIDEN_RATIO` (0.85) and with every concentrated-token holder forced in; a question detected as enumerative instead keeps every scope that clears its own discounted floor, up to `MAX_SET_SCOPES` (8)."
          - "Each selected scope is queried in its own thread inside a `ThreadPoolExecutor`, and neither store is ever queried across a scope boundary: the structure call is handed only that scope's own `graphify-out/graph.json`, and the episode call is handed only the chunks `chunks_for(store, sid)` returns for that scope id. Before the fan-out, `warm_up()` pays the embedding model's one-off native initialisation on a single thread first, because constructing it from two threads at once has caused a segfault or hang on macOS."
        facts:
          - "MAX_SCOPES=3, MAX_SET_SCOPES=8"
          - "ThreadPoolExecutor per selected scope"
          - "one graph.json / chunk list per scope"
      - id: expand
        label: "expand the question"
        meta: "against this scope's postings"
        row: 4
        detail:
          - "`expand_for_scope()` tokenises the question and keeps only the tokens present in this scope's own postings, `scope_index.json`'s token to `{scope: node_df}` map: a dict lookup, so a token the scope's index does not hold cannot be invented into a query. `semantic_symbols()` then appends the tokens of the `SEMANTIC_SYMBOL_LABELS` (2) nearest embedded symbol labels, when embeddings are available, because graphify seeds its traversal by lexical similarity to a label and a question phrased in behaviour rather than identifiers otherwise expands to nothing."
          - "Both run, not either: the lexical half anchors terms the user actually typed, the semantic half reaches code the question described rather than named. The combined token list is what is handed to the structure query and printed in the answer as `expanded:`."
        facts:
          - "ask.py: expand_for_scope()"
          - "SEMANTIC_SYMBOL_LABELS=2"
          - "lexical postings lookup + 2 nearest labels"
      - id: structure
        label: "structure store"
        meta: "graphify"
        row: 5
        detail:
          - "`GraphifyBackend.query()` shells out to `graphify query <expanded tokens> --graph <this scope's graph.json> --budget <per-scope budget>`, one subprocess per graph source that has at least `MIN_SOURCE_NODES` (20) nodes, with a 60 second timeout. The graph read is `<scope root>/graphify-out/graph.json`, written only by `loci graphs` or `loci setup`; loci never writes anywhere else inside a repository."
          - "The result text, with `file:line` citations, comes back verbatim from graphify's own output; a failure or timeout is captured as `ok=False` with the stderr rather than raised. The same adapter's `vocabulary()` method, counting each token once per node, is what builds the `node_df` figures the routing stage reads."
        facts:
          - "graphify query --graph <path> --budget N"
          - "MIN_SOURCE_NODES=20, 60s timeout"
          - "<scope>/graphify-out/graph.json"
      - id: episode
        label: "episode store"
        meta: "BM25 + char 3-5 gram + embeddings"
        row: 5
        detail:
          - "`BuiltinEpisodeBackend.search()` fuses three rankers over one scope's chunks: BM25, char 3 to 5 gram TF-IDF, and local `bge-small` embeddings when enabled, weighted 0.20 / 0.20 / 0.60 with a 0.05 recency term, renormalised over whichever signals scored. The lexical rankers are fitted once and cached to `rankers/<scope>.lex`, mmapped rather than unpickled, so a cached scope opens in microseconds instead of refitting."
          - "A hit must clear a two-tier gate: lexically grounded (`MIN_GROUNDED` 2 matched tokens, or `MIN_GROUNDED_FRAC` 25%) OR semantically confident (cosine at or above `SEMANTIC_FLOOR` 0.57), plus an absolute `SCORE_FLOOR` of 0.12. The gate exists because embeddings alone give every chunk a nonzero score, which would stop an absolute floor firing; an AND of the two conditions would reject exactly the meaning-without-shared-words matches embeddings exist to catch, so they are OR'd. Gate, fusion and sort run in the Rust extension."
        facts:
          - "weights: BM25 .20 / char .20 / embed .60"
          - "SCORE_FLOOR=0.12, SEMANTIC_FLOOR=0.57"
          - "MIN_GROUNDED=2 / MIN_GROUNDED_FRAC=0.25"
          - "rankers cached as <scope>.lex, mmapped"
      - id: answer
        label: "merged, cited answer"
        meta: "one block per scope"
        row: 6
        detail:
          - "`ask.render()` prints one block per selected scope, headed `ROUTED` or `ENUMERATED`, the scope name, and the tokens the expand stage produced. Inside each block: structure hits with their `file:line` citations, then episode hits with a fused score, the chunk's source and heading, and a text snippet. When a scope's structure query and episode query both come back empty, the block reads `no evidence in this scope` rather than being silently omitted, so an empty answer is visible as empty and not indistinguishable from a scope that was never asked."
          - "A relational question (an edge between two projects) answers outside this shape entirely: a `USES ->` list of resolved edges, each a fact with its own `file:line` citation and no score, because there is no ranking to fall back on for a registry fact."
        facts:
          - "ask.py: render()"
          - "note = \"no evidence in this scope\""
          - "verb: ROUTED or ENUMERATED"
          - "edges print as USES -> with file:line"
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
      the corpus, then asks three refusal questions in a fixed order. The
      chart walks through each stage on its own; choose any stage to stay on
      it.
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
