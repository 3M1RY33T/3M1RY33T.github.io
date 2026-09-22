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
metrics:
  - { label: Tests, value: "152", detail: "passed, 17 skipped, in 13.1s" }
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
