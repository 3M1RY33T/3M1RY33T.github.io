---
title: Tensor (Serve)
tagline: Retrieval that knows when to say nothing
summary: >
  A ZIM-backed retrieval proxy for any OpenAI-compatible model. Hybrid FAISS
  and BM25 search joined by reciprocal rank fusion, with an abstention gate
  that forwards the request with no injected context when the corpus cannot
  answer.
problem: >
  A retrieval proxy that always answers is worse than no retrieval at all,
  because it launders a guess into something that looks cited. Tensor scores
  every candidate the whole way through the pipeline, which is what lets it
  tell the difference between "here is the answer" and "this corpus cannot
  answer that", and act on it.
accent: "#FB7185"
accent_wash: "rgba(251,113,133,0.14)"
icon: "/assets/img/projects/tensor-serve.png"
order: 4
date: 2026-04-25
status: active
stack: [Python, FAISS, Rust, Docker]
platforms: [macOS, Linux, Docker]

links:
  github: https://github.com/3M1RY33T/tensor-serve
  package: https://pypi.org/project/tensor-serve/
  package_label: PyPI

install: pip install tensor-serve
install_note: >
  Point it at any OpenAI-compatible endpoint, local or hosted. Tensor sits
  in front of the model rather than replacing it, so an editor or any other
  OpenAI-compatible client needs only its base URL changed.

metrics_verified: 2026-09-22
diagrams:
  - id: query
    title: "A request passing through the proxy"
    query: "POST /v1/chat/completions"
    query_label: "received"
    nodes:
      - id: message
        label: "user message"
        meta: "OpenAI chat schema"
        row: 0
        detail:
          - "Every request enters through one endpoint, POST /v1/chat/completions, which accepts the same JSON body any OpenAI-compatible client sends: a model name and a list of messages. chat_completions() reads that body, pulls the last message with role user out of it, and hands the text onward; every other /v1/* route (models, embeddings, provider-specific paths) is passed straight through unchanged by a separate catch-all proxy."
          - "Nothing about this contract signals that retrieval is happening. A client pointed at http://localhost:8000/v1 behaves exactly as if it were pointed at Ollama or the OpenAI API directly, so no editor, chat UI or script needs to be written against Tensor specifically, only against the OpenAI chat schema it already speaks."
        facts:
          - "POST /v1/chat/completions"
          - "_last_user_text()"
          - "/v1/{path} passthrough"
      - id: analyze
        label: "needs retrieval?"
        meta: "QueryAnalyzer"
        row: 1
        detail:
          - "QueryAnalyzer.needs_rag() decides whether the message needs retrieval at all before anything is embedded or searched. A query under five characters is skipped outright; anything containing a domain phrase such as \"how to\", \"explain\", \"compare\" or \"architecture\" is routed to RAG; failing that, a short list of regexes catches simple patterns like \"what is 2+2\" or a yes/no question and skips retrieval for those too."
          - "Everything else defaults to needing RAG. The comment beside that default is explicit about the bias: better to retrieve unnecessarily than to miss context the model actually needed. The whole check is optional: query_analysis_enabled (default true) can be turned off, in which case every message is retrieved for."
        facts:
          - "QueryAnalyzer.needs_rag()"
          - "DOMAIN_INDICATORS list"
          - "query_analysis_enabled=true"
      - id: cache
        label: "seen this query before?"
        meta: "search cache"
        row: 2
        detail:
          - "cache.get_search_result(query, search_mode, top_k) checks an in-memory LRU keyed on the lowercased, stripped query text plus the chosen search mode and top_k, hashed together with MD5. A hit returns immediately, skipping embedding, FAISS, BM25 and the abstention gate entirely."
          - "What is stored is the whole RetrievalOutcome, not just chunk text: candidates, their scores, and the abstain reason if the pipeline abstained last time. That matters because the chat proxy needs candidate indices for source attribution, something a text-only cache could not have served. Entries expire after one hour and the cache holds at most 100 queries before evicting the oldest."
        facts:
          - "QueryCache.get_search_result()"
          - "max_size=100"
          - "ttl=3600s (1 hour)"
          - "MD5(query+mode+top_k)"
      - id: mode
        label: "pick search mode"
        meta: "hybrid · faiss · bm25"
        row: 3
        detail:
          - "QueryAnalyzer.select_search_mode() scores the query against two small keyword lists. Terms like \"error\", \"traceback\", a dotted identifier, or a query three words or shorter push a keyword score up; phrases like \"explain\", \"why\", \"architecture\" or \"best practice\" push a semantic score up. Whichever score wins by at least 2 picks bm25 or faiss outright; anything closer than that falls through to hybrid, which is also the default."
          - "This runs on every cache miss, before the query is even embedded, so the mode is already known before FAISS or BM25 are touched. Users can override auto-detection per request with keyword_search_mode and semantic_search_mode settings, forcing one retriever off entirely."
        facts:
          - "select_search_mode()"
          - "score threshold >= 2"
          - "default: hybrid"
      - id: faiss
        label: "FAISS"
        meta: "cosine similarity"
        row: 4
        detail:
          - "FAISS searches an IndexFlatL2 of unit-normalised chunk vectors and converts the squared L2 distance it returns into cosine similarity with the identity cos = 1 - d/2, exact because every stored vector already has the embedding model's own Normalize layer applied. It runs whenever the mode is hybrid, faiss or hybrid_web, and it stays fast at scale: 4.3ms per query at a million vectors, exact, no approximation."
          - "The query itself is embedded first, on the ONNX Runtime backend by default (measured 1.19ms against 4.00ms on PyTorch for a single short query, identical vectors either way), because ONNX wins for one-off queries while PyTorch wins for the large batches ingestion produces, and the auto setting picks whichever workload it is given."
        facts:
          - "IndexFlatL2"
          - "cos = 1 - d/2"
          - "4.3ms @ 1M vectors"
          - "ONNX 1.19ms/query vs torch 4.00ms"
      - id: bm25
        label: "BM25"
        meta: "postings lookup"
        row: 4
        detail:
          - "PostingsBM25 walks an inverted index rather than scoring every chunk in the corpus, so a query only touches documents containing at least one of its terms. Scoring uses the Lucene/Robertson IDF formula, non-negative by construction. Measured on a synthetic 80,000-chunk corpus this took query latency from 104.86ms to 0.85ms; on real documentation it cuts the BM25 stage itself from 19.75ms to 0.24ms, the largest single win in the pipeline."
          - "The optional Rust extension (tensor_postings) only speeds up building this index, not querying it. It replaces loops over Python strings and dictionaries at ingest time, measuring 2.8x faster there and producing a byte-identical index the test suite checks against the pure-Python builder. Retrieval itself is already native code (81% inside PyTorch, 4% inside FAISS), leaving little for a compiled extension to win at query time."
        facts:
          - "PostingsBM25 (inverted index)"
          - "0.85ms @ 80k chunks (was 104.86ms)"
          - "tensor_postings: 2.8x faster build"
      - id: web
        label: "web search"
        meta: "optional, time-sensitive only"
        row: 4
        detail:
          - "Web search only runs when two things are both true: web_search_enabled is turned on (it defaults to off, zero overhead) and QueryAnalyzer.is_time_sensitive() matches the query against a keyword list such as \"latest\", \"today\", \"2026\", \"stock\", \"price\" or \"election\". It is a DuckDuckGo lookup by default, no API key required, with Brave and Google as configured alternatives."
          - "This check is independent of the FAISS/BM25 mode decision: it can add a third ranked list to fusion regardless of whether the mode is hybrid, faiss or bm25. Web results skip the abstention gate entirely, since they exist to answer exactly what the local corpus cannot, and they add 1 to 3 seconds of live search latency per uncached query."
        facts:
          - "is_time_sensitive()"
          - "web_search_enabled=false (default)"
          - "DuckDuckGo default provider"
          - "bypasses the abstention gate"
      - id: rrf
        label: "Reciprocal Rank Fusion"
        meta: "score = sum 1/(60+rank)"
        row: 5
        detail:
          - "reciprocal_rank_fusion() merges however many ranked lists came back from FAISS, BM25 and web search into one order, scoring each chunk the sum of 1/(60+rank) across every list it appears in, rank counted from 1. A chunk that places well in two lists outranks one that placed first in only one, which is the point: agreement between two different retrieval methods is itself a signal."
          - "The constant 60 is the standard from the original RRF paper, chosen to dampen how much a single first-place finish can dominate. If only one retriever ran, the same formula still applies to just that list. If an index is entirely unavailable, its list is simply absent from the sum rather than causing a failure."
        facts:
          - "reciprocal_rank_fusion()"
          - "score = sum 1/(60+rank)"
          - "k=60 (RRF paper default)"
      - id: gate
        label: "abstention gate"
        meta: "two tiers, either is enough"
        row: 6
        detail:
          - "Before any candidate is handed onward, the fused result as a whole is judged against two independent thresholds: is the question's vocabulary present in the corpus at all, or is the single best FAISS match close enough in embedding space. Either is sufficient; the check only runs when a signal actually exists to judge on, and it is skipped entirely when web results are present, since those already answer what the corpus alone could not."
          - "Turning this gate on moved abstention on nonsense queries from 0% to 100% in the evaluation harness, while recall@k, precision@1 and MRR on real questions stayed exactly where they were. It costs nothing on a question the corpus can answer and catches every one it plainly cannot."
        facts:
          - "two-tier gate: lexical OR semantic"
          - "abstention_enabled=true (default)"
          - "nonsense abstention: 0% -> 100%"
      - id: forward
        label: "forward unchanged"
        meta: "nothing injected"
        row: 7
        kind: refusal
        detail:
          - "This is the path taken whenever there is nothing safe to inject: the message did not need RAG, no database is loaded, both search modes are switched off, or the abstention gate decided the corpus could not answer. Every one of these collapses to the same empty candidate list, and _payload_with_context() returns the original request unchanged when that list is empty."
          - "No system message is prepended and no source footer is appended to the reply. To the client this is indistinguishable from talking to the upstream model directly, which is deliberate: forwarding a guess dressed up as retrieved context would be worse than forwarding nothing."
        facts:
          - "context_chunks=[] on any abstain path"
          - "_payload_with_context() no-op"
          - "no footer appended"
      - id: rerank
        label: "cross-encoder rerank"
        meta: "optional"
        row: 7
        detail:
          - "rerank_results() runs a cross-encoder over query/chunk pairs, scoring each pair directly rather than comparing independently computed vectors the way FAISS does. It is off by default (reranker_enabled=false) because it costs a second model pass over every candidate. Two model sizes are offered: lightweight (ms-marco-MiniLM-L-6-v2, 22M parameters, about 50ms per batch, the default) and balanced (ms-marco-MiniLM-L-12-v2, 71M parameters, about 100ms per batch)."
          - "Because reranking reorders the chunk text, the candidate list carrying indices, cosine scores and sources is re-sorted afterwards to match, so source attribution still points at the right chunk after reordering. If the cross-encoder model fails to load, reranking falls back silently to the original RRF order."
        facts:
          - "rerank_results()"
          - "reranker_enabled=false (default)"
          - "lightweight: 22M, ~50ms/batch"
          - "balanced: 71M, ~100ms/batch"
      - id: inject
        label: "inject as system context"
        meta: "with a source footer"
        row: 8
        detail:
          - "_payload_with_context() builds one system message, \"Use the following context to answer questions:\" followed by each surviving chunk as a bullet, and prepends it to the message list before the request goes upstream. Separately, _resource_attribution() builds a footer from the same chunks' metadata, \"Read from <source titles>\" and \"Enhanced by <collection name>\", appended to the model's reply after it comes back, streamed or not."
          - "A client can suppress the footer per request with tensor_show_resources set to false in the request body; Tensor strips that field before the request is forwarded, so the upstream model never sees it."
        facts:
          - "_payload_with_context()"
          - "_resource_attribution()"
          - "Read from ... / Enhanced by ..."
          - "tensor_show_resources flag"
      - id: up
        label: "upstream model"
        meta: "Ollama · LM Studio · any OpenAI API"
        row: 9
        detail:
          - "_proxy_ai_request() forwards the request, now carrying injected context or not, to whatever endpoint is configured: Ollama, LM Studio, vLLM, OpenAI, Anthropic-compatible gateways or a LiteLLM gateway all work, since the whole proxy only assumes the OpenAI chat schema. Auth headers are attached from the stored provider config, and both streaming and non-streaming responses pass the upstream status code and content type straight back to the client."
          - "If the upstream server cannot be reached, that surfaces as a 502, not a silent failure, and if no endpoint is configured at all the request is rejected with a 400 before Tensor even tries. Response time here is dominated by the upstream model itself, not by anything Tensor does."
        facts:
          - "_proxy_ai_request()"
          - "502 on unreachable upstream"
          - "400 if endpoint unconfigured"
    edges:
      - [message, analyze]
      - [analyze, cache]
      - [analyze, forward]
      - [cache, mode]
      - [cache, inject]
      - [mode, faiss]
      - [mode, bm25]
      - [mode, web]
      - [faiss, rrf]
      - [bm25, rrf]
      - [web, rrf]
      - [rrf, gate]
      - [gate, forward]
      - [gate, rerank]
      - [rerank, inject]
      - [inject, up]
      - [forward, up]
    steps: [message, analyze, cache, mode, faiss, bm25, web, rrf, gate, forward, rerank, inject, up]
    ascii: |
      user message
        │
        ▼
      needs retrieval? ──no──▶ forward unchanged ───────────┐
        │ yes                                               │
        ▼                                                   │
      seen this query before? ──hit──▶ inject context ───┐  │
        │ miss                                           │  │
        ▼                                                │  │
      pick search mode                                   │  │
        ├─▶ FAISS   cosine similarity                    │  │
        ├─▶ BM25    postings lookup                      │  │
        └─▶ web     optional, time-sensitive only        │  │
        ▼                                                │  │
      Reciprocal Rank Fusion, candidates keep their      │  │
      scores                                             │  │
        ▼                                                │  │
      abstention gate ──nothing passes──▶ forward ───────┼──┤
        │ candidates pass                                │  │
        ▼                                                │  │
      cross-encoder rerank, optional                     │  │
        ▼                                                │  │
      inject as system context ──────────────────────────┘  │
        ▼                                                   │
      upstream model ◀──────────────────────────────────────┘
  - id: gate
    title: "The abstention gate"
    nodes:
      - id: candidates
        label: "fused candidates"
        meta: "with their scores"
        row: 0
        detail:
          - "Each surviving chunk is a Candidate: its index into the loaded corpus, its text, the RRF score that placed it, and whichever of cosine or keyword_score its retrievers actually produced, plus a sources tuple recording which of FAISS, BM25 or web found it. These are what the gate judges, but not individually."
          - "The gate looks at the fused result as a whole rather than filtering candidates one by one: the summed IDF evidence and the single best cosine across every FAISS hit are both computed once, before any candidate is even assembled into the returned list."
        facts:
          - "Candidate dataclass"
          - "fields: index, rrf_score, cosine, sources"
      - id: lexical
        label: "lexically grounded?"
        meta: "sum of IDF ≥ 1.0"
        row: 1
        detail:
          - "bm25_index.term_evidence(query) sums the IDF of every query term that exists anywhere in the corpus vocabulary; a term simply absent from the index contributes nothing, so a question sharing no vocabulary with the corpus sums to exactly zero. The floor is 1.0. Measured over 10,399 chunks of real documentation, the weakest family of genuine questions still summed to 2.27, while nonsense queries summed to 0.00 every time, with no overlap between the two."
          - "This runs first because evidence, not similarity, is what actually separates a real question from gibberish on this corpus."
        facts:
          - "term_evidence() -> summed IDF"
          - "DEFAULT_LEXICAL_EVIDENCE_FLOOR=1.0"
          - "nonsense: 0.00, real min: 2.27"
      - id: semantic
        label: "semantically confident?"
        meta: "best cosine ≥ 0.45"
        row: 2
        detail:
          - "If the words themselves are not in the corpus, the gate falls back to the single best cosine similarity any FAISS hit produced, max(cosine_by_index.values()), against a floor of 0.45. This is the second chance specifically for questions that use different words than the documentation does, which is exactly what embeddings were added to catch."
          - "Cosine alone cannot do the job the lexical check does: the weakest real question in the same measurement sat at 0.201 while nonsense reached as high as 0.381, well inside where a real answer lives. A fixed cosine floor on its own would reject that real question while letting the nonsense through, so it only runs as the fallback, never the first check."
        facts:
          - "best_cosine = max(cosine_by_index)"
          - "DEFAULT_SEMANTIC_CONFIDENCE_FLOOR=0.45"
          - "real min: 0.201, nonsense max: 0.381"
      - id: answer
        label: "answer"
        meta: "inject the chunks"
        row: 3
        detail:
          - "If either check passed, the fused candidates are assembled into the final list: deduplicated, capped at top_k, kept in RRF order, and each one still carrying the index, text and per-retriever scores it will need later for reranking and for the source footer. RetrievalOutcome.abstained stays false, and evidence and best_cosine are recorded on the outcome regardless, for anyone inspecting why it answered."
          - "From here the candidates go to the optional reranker if one is configured, then get folded into the system message injected ahead of the user's question."
        facts:
          - "RetrievalOutcome.abstained=False"
          - "capped at top_k"
          - "RRF order preserved"
      - id: abstain
        label: "abstain"
        meta: "inject nothing, forward the question"
        row: 3
        kind: refusal
        detail:
          - "If neither check passed, the function returns immediately with RetrievalOutcome(abstained=True, reason=\"no_lexical_or_semantic_evidence\", ...); no candidate list is even built. _context_for_query() gets back an empty list, and the chat proxy injects nothing: the user's original question goes upstream unchanged."
          - "This is what moved abstention on nonsense from 0% to 100% in the evaluation harness while leaving recall, precision and MRR on real questions completely untouched: the gate does not make the corpus worse at answering what it can already answer, it only stops it from answering what it plainly cannot, which is the failure mode this whole two-tier design exists to close."
        facts:
          - "reason=\"no_lexical_or_semantic_evidence\""
          - "abstained=True, candidates=[]"
          - "nonsense abstention: 0% -> 100%"
    edges:
      - [candidates, lexical]
      - [lexical, answer]
      - [lexical, semantic]
      - [semantic, answer]
      - [semantic, abstain]
    steps: [candidates, lexical, semantic, answer, abstain]
    ascii: |
      fused candidates, with their scores
        │
        ▼
      lexically grounded?            ──yes──▶ answer, inject the chunks
        sum of IDF of query terms                 ▲
        present in the corpus ≥ 1.0               │
        │ no, the words are not in the corpus     │
        ▼                                         │
      semantically confident?        ──yes────────┘
        best cosine ≥ 0.45
        │ no
        ▼
      abstain, inject nothing, forward the question
tabs:
  - id: overview
    label: Overview
    bands: [problem, capabilities, quickstart]
  - id: pipeline
    label: Pipeline
    heading: What happens to a request
    lede: >
      Tensor sits in front of a model rather than replacing it, so every
      request either arrives upstream enriched or arrives untouched. The chart
      walks the path on its own; choose any stage to stay on it.
    diagram: query
    notes:
      - title: Retrieval is native already
        body: >
          Profiling put 81% of a query inside PyTorch and 4% inside FAISS,
          so there was little for a compiled language to win there. Building
          the keyword index was the exception, and that is the only part
          that went to Rust.
        evidence: 2.8x faster index build, byte-identical output
      - title: The backend is chosen per phase
        body: >
          ONNX answers a single query in 1.19ms against PyTorch's 4.00ms,
          and loses badly on bulk ingestion at 127 chunks a second against
          323. So the backend is selected by what the process is doing
          rather than picked once.
        evidence: 1.19ms vs 4.00ms · 127 vs 323 chunks/s
      - title: Writes moved, they do not happen in place
        body: >
          Writing an index in place produced 34,704 torn reads out of 34,709
          in a few seconds of concurrent access. Writing to a temporary file
          and moving it into position produced none.
        evidence: 34,704 of 34,709, then 0
  - id: abstention
    label: Abstention
    heading: Knowing when to say nothing
    lede: >
      A retrieval proxy that always answers is worse than no retrieval at
      all, because it launders a guess into something that looks cited.
      Two tiers guard the injection, and either one alone is enough.
    diagram: gate
    notes:
      - title: Why cosine alone could not do it
        body: >
          Real questions bottom out around 0.201 cosine while nonsense
          reaches 0.381, so no threshold separates them. Summed IDF
          evidence goes to exactly 0.00 for invented words, which is a
          separation rather than a gradient.
        evidence: real 0.201 · nonsense 0.381 · evidence 0.00
      - title: Why both tiers are not required
        body: >
          Requiring both would reject exactly the questions embeddings were
          added for, and requiring neither is how the pipeline came to
          answer invented words with confident documentation.
        evidence: floors 1.0 lexical · 0.45 cosine
      - title: What it cost to add
        body: >
          Abstention on nonsense went from 0% to 100%, and recall@k,
          precision@1 and MRR on the real question set did not move.
        evidence: 0% to 100%, retrieval quality unchanged
  - id: measured
    label: Measured
    heading: Numbers that came from commands
    bands: [metrics, terminal]
  - id: depth
    label: In depth
    bands: [writeup]

metrics:
  - { label: Tests, value: "169", detail: "168 passed, 1 skipped, in 10.6s" }
  - { label: Keyword latency, value: "0.85ms", detail: "at 80,000 chunks, from 104.86ms" }
  - { label: Torn reads, value: "0", detail: "was 34,704 of 34,709" }
  - { label: Releases, value: "4", detail: "across 68 commits" }

capabilities:
  - title: Three retrievers, one chunk numbering
    body: >
      FAISS for conceptually related passages, BM25 for exact identifiers
      and error codes, and optional web search for time-sensitive questions.
      All three run against the same chunk numbering, so fusion compares
      like with like and every candidate keeps its own score end to end.
  - title: Abstention is a supported outcome
    body: >
      A candidate must be lexically grounded, the summed IDF of query terms
      present in the corpus reaching 1.0, or semantically confident, best
      cosine at 0.45. When nothing passes, the request is forwarded upstream
      with no injected context at all.
  - title: A reader never sees half an index
    body: >
      Index files are written to a temporary file and moved into place.
      Writing in place produced 34,704 torn reads out of 34,709 in a few
      seconds of concurrent access. A server answering queries while an
      ingest runs sits squarely in that window.
  - title: No index file contains a pickle
    body: >
      An index is derived from a ZIM someone downloaded, and pickle.load on
      such a file executes whatever it contains. Chunk text is a UTF-8 blob
      plus an offsets array, postings are flat numpy arrays, metadata is
      JSON, and everything is read with allow_pickle=False.

terminal:
  - cmd: pip install tensor-serve && tensor-serve config detect-local-ai
    out: |
      Scanning for OpenAI-compatible endpoints...
      found  http://localhost:11434/v1   (ollama)
      upstream set.  point your client at http://localhost:8000/v1
  - cmd: python3 -m pytest -q
    out: |
      152 passed, 17 skipped, 5 warnings in 13.07s

post_match: [tensor]
---

## How it works

A request arrives on the OpenAI-compatible `/v1/chat/completions` endpoint
and runs a gauntlet, any stage of which can decide the corpus is not needed.

The analyzer decides whether retrieval is warranted at all: a simple or
self-contained message is forwarded unchanged. A domain-specific one picks a
search mode. A time-sensitive one can additionally trigger web search.

Up to three retrievals then run in parallel and merge with reciprocal rank
fusion, `score = Σ 1 / (60 + rank)`, so chunks ranking well in more than one
result set float to the top. The pipeline degrades rather than failing: an
unavailable index is skipped.

**The abstention gate is the point of the whole design.** Retrieval returns
scored candidates rather than bare text, so the pipeline can distinguish an
answer from an absence. A candidate set passes if it is lexically grounded,
meaning the summed IDF of query terms actually present in the corpus reaches
1.0, *or* semantically confident, meaning best cosine reaches 0.45. When
neither holds, the request goes upstream with **no injected context**, and
the model answers as itself rather than appearing to cite a corpus that said
nothing.

**Keyword scoring walks an inverted index rather than the collection.** A
query touches only the chunks containing one of its terms. Measured on a
synthetic corpus of 500-word chunks, that took BM25 latency from 25.79ms to
0.22ms at 20,000 chunks, and from 104.86ms to 0.85ms at 80,000. The larger
the corpus, the larger the win, which is the right shape for the property to
have.

**Durability is ordered on purpose.** The chunk store is written before the
vector index, because `index_exists` gates on the vector index: a crash
part-way therefore leaves a store with no index beside it, which reads as
"not built", rather than an index promising chunks that were never written.
An ingest holds an advisory lock so two builds cannot interleave and produce
a vector index and a keyword index that disagree about what chunk 7 is, and
a lock left behind by a dead process is detected and broken so a crash needs
no manual cleanup.

## Trade-offs

**The Rust extension is optional because the profile said so.** Retrieval is
already native, 81% of a query inside PyTorch and 4% inside FAISS, so there
is little for a compiled language to win there. Building the keyword index
is the exception, being loops over Python strings and dictionaries, and an
extension makes that 2.8x faster while producing a byte-identical index the
test suite checks against the Python path. The published wheel stays pure
Python, needs no Rust toolchain, and falls back when the extension is
absent.

**Merging collections costs the smaller corpus measurably, and it is still
worth it.** Measured on real corpora, 153 chunks of this project's own
documentation merged into 10,399 chunks of Python documentation, the merge
costs the smaller corpus 2.5% recall@5 and 1.7% precision@1. Worth knowing,
not worth one index per collection.

**Exact search is the default and approximate is opt-in.** FAISS and PyTorch
can ship conflicting OpenMP runtimes, in which case training an IVF index
aborts the process, so the flat index carries the load. Flat is exact and
measured at 4.3ms per query over a million vectors, which is fast enough
that the approximate index has to earn its place rather than being assumed.

**Reciprocal rank fusion discards the original scores' magnitudes.** It
compares ranks, which is what makes fusing a cosine similarity with a BM25
score legitimate at all, and the cost is that a result which is
overwhelmingly the best in one retriever cannot say so. Keeping every
candidate's own index and score alongside the fused rank is what preserves
both the gate and source attribution.

## What I would do next

**The name is the biggest problem this project has**, and it is not a
technical one. "Tensor" says machine learning generally and says nothing
about retrieval, abstention or ZIM, which are the three things that make it
worth installing.

**The abstention thresholds are two constants fitted once.** IDF at 1.0 and
cosine at 0.45 are the entire gate. They have not been refitted against a
corpus other than the ones they were developed on, and the loci project ran
into exactly this failure: constants fitted on one corpus drift as the
corpus grows.

**The query analyzer decides whether retrieval is needed with heuristics.**
That decision is upstream of everything else, so a wrong call there cannot
be recovered by any later stage, and it is currently the least measured part
of the pipeline.

**Web search is disabled by default and lightly tested.** It enters the same
fusion as the local retrievers, which means it can outrank the corpus, and
the interaction between a live result set and the abstention gate deserves
more than it currently has.
