---
layout: post
title: "Tensor (Serve) v2.0.2"
date: 2026-05-11
author: "Yigit Yildiz"
excerpt: "ZIM-based retrieval augmented proxy for OpenAI-compatible AI."
tags:
  - update
---

## Summary

Tensor Serve now supports **configurable search profiles** that let you optimize the search pipeline for your specific deployment scenario—from lightweight local machines to enterprise production servers.

## Quick Start

### Switch to a Profile with the CLI

```bash
# Lightweight (local/embedded deployment)
tensor-serve config set-search-profile lightweight

# Balanced (default, general purpose)
tensor-serve config set-search-profile balanced

# Production (enterprise servers, large-scale)
tensor-serve config set-search-profile production
```Y

### View Available Profiles

```bash
tensor-serve config search-profiles
```

By default, these commands update local `config.json`. Add
`--server http://localhost:8000` to read or apply the profile through a running
Tensor Serve server's REST endpoints.

---

## Performance Notes

### Latency (P99) by Profile
```
Query embedding:                  10-20ms
-----------------------------------------
Lightweight:
  BM25 Okapi:                     2ms
  FAISS Flat:                     5ms
  Total:                          7ms + 20ms embedding = 27ms

Balanced:
  BM25 Okapi:                     2ms
  FAISS Flat:                     5ms
  Reranking (lightweight):        50ms
  Total:                          57ms + 20ms embedding = 77ms

Production:
  BM25+:                          3ms
  FAISS IVF:                      2ms
  Query Expansion (PRF):          5ms
  Reranking (balanced):           100ms
  Total:                          110ms + 20ms embedding = 130ms
```

### Quality (Normalized MAP@5) by Profile
Based on TREC benchmarks:
```
Lightweight:    ~0.65
Balanced:       ~0.75
Production:     ~0.85+
```

---

## Backward Compatibility

Existing deployments continue to work with **default settings (Balanced profile)**:
- All previous configurations are preserved
- Search behavior is identical to pre-optimization release
- No re-ingestion required
- Optional to upgrade to new profiles

No breaking changes. All new features are opt-in.
