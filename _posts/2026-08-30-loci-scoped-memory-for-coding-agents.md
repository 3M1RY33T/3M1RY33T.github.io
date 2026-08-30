---
layout: post
title: "loci: Scoped Memory for Coding Agents"
date: 2026-08-30
author: "Yigit Yildiz"
excerpt: "I released loci v0.2.0 today. It decides which project your question is about before it searches anything, and it is willing to tell you it does not know. Here is the problem it solves, and the two bugs that shipping it uncovered."
tags: [release]
---

I released [loci](https://github.com/3M1RY33T/loci) v0.2.0 today. It is on [PyPI](https://pypi.org/project/loci-mem/) as `loci-mem` and listed in the MCP registry, so an agent can reach it over stdio without me writing a client.

It is a memory tool for coding agents, and the thing that makes it different is small enough to state in one sentence: **it decides which project your question belongs to before it searches anything.**

## The problem

Every memory tool I had used, including the one I wrote before this, does the same thing. You point it at your code, it builds one index, and every question searches all of it.

That works until you have more than one project. Then the largest project wins, regardless of what you asked.

I measured this against a merged graph of ten of my own repositories. Same questions, one index:

| question | on-topic nodes returned |
|---|---|
| why was the admin session cookie dropped on localhost? | **18%** (19 of 31 came from the biggest project) |
| what happens when a user clicks Save as ZIM? | **2%** (61 of 62 came from the biggest project) |
| how does the reserved landing step work? | 98% |

The third row is the one worth staring at. It scored 98% because the biggest project genuinely *was* the answer that time. Merged retrieval looks excellent whenever the answer happens to live in the largest corpus, and collapses when it does not. Same failure in both directions, visible in only one, which is the worst property a bug can have.

Knowledge graphs hold structure but no prose, so they cannot answer *why did the cookie get dropped*. Verbatim recall systems hold prose but no call graphs, so they cannot answer *what calls `run_agent_turn`*. And both of them make you name the namespace when you **write**.

loci decides the scope when you **read**.

## What it actually is

A router in front of two stores.

The **structure store** holds what calls what: symbols, files, references, with `file:line` citations. The **episode store** holds what happened and why: READMEs, docs, git commit bodies, docstrings and comment blocks, stored verbatim and redacted before they are written.

The **router** decides which projects a question belongs to. There is no model call in the query path. It is a dict lookup per query token against a token to scope map, which is sub-millisecond and stays flat from 25 projects to 100. Signals, in order of weight: an explicit project name, your working directory, vocabulary evidence, and recency as a tiebreak.

Weight is not usefulness. Your working directory is the signal that carries most real questions, because most real questions never name a project at all.

## Refusing is a feature

The part I am most attached to is that `ABSTAIN` is a first-class outcome, at both layers. The router can decline to pick a project, and a project it did pick can still hand back nothing.

Ask any RAG tool what the airspeed velocity of an unladen swallow is and it will confidently retrieve something. loci says it does not know.

Getting there took an actual finding. Questions like *"how is this deployed?"* or *"how do I run the tests?"* point at their subject without ever naming it. Before I fixed this, loci abstained on those only 37.5% of the time, which means 56% were confident and wrong. From the outside that is indistinguishable from correct.

No lexical statistic rescues it. I checked: per-token evidence for `start` (2.51) and `services` (2.56) is indistinguishable from real evidence like `session` (2.53). The individual words are not generic. The *question* is.

Pointing at your subject is a grammatical property, so I detect it grammatically. A closed class of markers, no tuned threshold. That moved abstention from 37.5% to 87.5% across 80 generated questions, with in-project routing unchanged at 100%.

## The two bugs v0.2.0 found

This release exists because someone reviewed the tool and asked it a question I had not.

### Enumerative questions returned one owner of two

```
loci ask "which of my projects use Cloudflare workers or D1?"
  -> 3M1RY33T.github.io
```

It dropped `urthreads`, which *is* the Cloudflare Worker.

Every gate in the router asks the same thing: is there enough evidence for **one** project? A question about something several projects share splits its evidence across all of them by construction. So the more projects genuinely shared a term, the less likely all of them came back. The mechanism inverted on exactly the question shape that wants a set.

Worse, the quickstart example in my own README, `which projects use wrangler and D1?`, returned both owners only by luck. `wrangler` happens to live in exactly two projects, which tripped a different code path.

The fix follows the same rule as the deixis one. Enumeration is grammatical, so detect it grammatically: a closed class of markers, no threshold, switching selection from "within 0.85 of the top project" to "every project that clears the floor on its own". The frame nouns (`projects`, `repos`) get stripped from the query, because they are scaffolding rather than vocabulary.

| | before | after |
|---|---|---|
| confusable top-1 | 50.0% | **100.0%** |
| confusable gold-coverage | 41.7% | **66.7%** |
| cross gold-coverage | 66.7% | **83.3%** |
| negative (abstains correctly) | 66.7% | **88.9%** |

### The tokenizer was deleting `D1`

Then, testing that fix, I found the real problem.

The tokenizer used `[^\W\d_]+`, which treats every digit as a separator *and* throws it away. So `D1` became `d`, and `d` died on the minimum length floor.

Across 53 markdown files in three repositories: **258 distinct alphanumeric terms deleted outright, over 1,246 occurrences.** `s3` (102 times), `n8n` (70), `d1` (64). Plus `base64` collapsing to `base` and `sha256` to `sha`.

`d1` appears in this project's README as a routing example. It could never have worked.

It also silently killed aliases. A project named `3M1RY33T` tokenized its only alias to an empty list, so the strongest signal in the entire router could never fire for it. Naming that project outright made loci abstain.

The new tokenizer emits a superset, so nothing that matched before can stop matching: `base64` now yields both `base64` and `base`.

### And the reason I nearly missed it

I shipped the tokenizer fix and `loci index` cheerfully reported 12 of 14 projects "unchanged, reused without re-parsing". The fingerprint is a content signature, and no file had changed. The routing index and the tokenizer now disagreed about what a word is, and nothing said so.

The fingerprint is now seeded with a signature of the tokenizing rules, so any future change to them invalidates the cache by construction instead of when I remember to bump a constant.

## Something I got wrong

While fixing the enumerative case, folding singular and plural at query time looked obviously correct. `urthreads` holds `worker` 158 times and `workers` twice, so a question asking about "workers" should clearly match "worker".

I measured it. It was worse: behavior gold-coverage dropped from 42.9% to 28.6%, and correct negatives from 66.7% to 55.6%. It is recorded as rejected in the changelog rather than quietly dropped, because "obviously right" is exactly the kind of thing that needs a number attached to it.

## What it cannot do yet

I would rather say this myself than have someone find it.

- Every constant in the router was fitted against ten repositories belonging to one person. Me. The architecture came from mechanisms and should generalise. The numbers came from one machine and demonstrably do not.
- Uncontaminated top-1 is 85.7%, which is 6 items out of 7. A single item moves that 14 points.
- The structure store surfaces the answering symbol in 4 of 7 probes. That is a real miss, not a rounding error.
- Large prose-heavy projects over-attract. One of mine absorbs questions belonging elsewhere purely by having more words.
- CI runs on Linux, Windows and macOS across Python 3.10 to 3.13, and standing that up found a Windows bug that reading the code had walked straight past. But no user has actually run loci on Windows yet.

## Try it

```bash
pipx install 'loci-mem[all]'
loci setup
loci ask "why was the session cookie dropped on localhost?"
```

`setup` scans, graphs, indexes, embeds and calibrates in one pass, then runs `doctor` so whatever it could not cover is the last thing you read rather than something you discover from a bad answer a week later.

Everything stays on your machine. No LLM in the query path, embeddings run locally when you enable them, and everything collected is redacted before it is written.

There is one thing I actually want, and it is not stars:

```bash
loci eval
```

It asks only questions whose correct answer is known by construction, so it needs no labelling and no setup, and it takes a few seconds. Then tell me what it says about **your** projects, not mine. Every number in this post was measured by the same person who wrote the router, and that is a limit no amount of additional self-testing can fix.

<img src="https://raw.githubusercontent.com/3M1RY33T/3M1RY33T.github.io/main/assets/svg/github.svg" alt="loci on GitHub" height="30" style="vertical-align:middle;"/> [Check out the loci Repository](https://github.com/3M1RY33T/loci)

<img src="https://raw.githubusercontent.com/3M1RY33T/3M1RY33T.github.io/main/assets/svg/pypi.svg" alt="loci on PyPI" height="30" style="vertical-align:middle;"/> [Check out the PyPI Package](https://pypi.org/project/loci-mem/)
