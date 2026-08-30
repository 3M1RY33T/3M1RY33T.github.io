---
layout: post
title: "urthreads v1.2.0: Local Dev, Real Ship"
date: 2026-08-26
author: "Yigit Yildiz"
excerpt: "The first release of urthreads that I shipped with Delroy, my own AI agent. A local admin development environment that fixes the two things blocking local dashboard testing."
tags: [release]
---

I released urthreads v1.2.0 today. The npm page is [live](https://www.npmjs.com/package/urthreads/v/1.2.0), the [GitHub release](https://github.com/3M1RY33T/urthreads/releases) is tagged, and the package is already running on this site. But this one feels different from the earlier releases, and I want to talk about why.

## What Changed

v1.2.0 fixes the local admin development experience. Until now, `wrangler dev` alone could not drive the admin dashboard. Two root causes blocked it, and both were the kind of thing where you spend an hour convinced you're doing something wrong before you realize the code is fighting you.

The first: browsers silently drop `Secure` cookies over plain HTTP. The worker always emitted `__Host-urthreads_admin_session` with the `Secure` attribute, so the session cookie set by `POST /admin/session` on `http://localhost:8787` never stuck. You'd log in, get a 200, and then the next request would show unauthenticated because the cookie vanished. I proved the fix works end to end with curl in a previous session, but the fix itself kept getting reverted.

The second was worse. `getAdminKeyAccess` checks `isAdminKeyExpired` before comparing the key, and `verifyAdminSessionToken` re-checks key expiry on every request. The expiry value sits in `.dev.vars`, written by the admin-key CLI. A stale or past `ADMIN_API_KEY_EXPIRES_AT` makes even the correct key return `admin_key_expired`, and the dashboard tells you to "deploy again," which is wrong advice for a local worker. You'd paste the right key, get rejected, and the UI would point you at a deploy you don't need.

v1.2.0 fixes both, and adds the tooling around them so the whole local workflow is one command.

### Localhost-aware session cookies

`http://localhost`, `http://127.0.0.1`, and `http://[::1]` now get a plain `urthreads_admin_session` cookie without `Secure`. Everything else gets the byte-identical `__Host-urthreads_admin_session` with `Secure`. The cookie logic detects the origin on every request, so production behavior is untouched. `HttpOnly`, `Path=/`, `Max-Age`, and `SameSite` stay the same in both paths.

### No more local key expiry footgun

The new `setup:dev` script always writes `ADMIN_API_KEY_EXPIRES_AT=` (empty) to `.dev.vars`. Empty means never-expires per `isAdminKeyExpired`, so the local worker can never reject the correct key as expired due to a stale env value. The dashboard also got a localhost-aware error message: instead of telling you to deploy again, it says to run `npm run setup:dev` and restart `npm run dev`.

Production semantics are unchanged. Unparseable or past dates still fail closed. Key rotation still kills sessions. The fix is strictly local.

### One-command local setup

```bash
npm install
npm run setup:dev
npm run dev
```

That's the complete local admin testing workflow now. No Cloudflare account, no `CLOUDFLARE_API_TOKEN`, no manual secret or schema management. `setup:dev` reads the D1 database name from `wrangler.toml`, reuses an existing admin key or generates one, writes `.dev.vars` with empty expiry, initializes the local D1 schema, prints the key, and copies it to your clipboard. Wrangler is now a devDependency, so `npm install` alone gives you a runnable dev environment.

The `admin-key` CLI also picked up a local-dev hint in its next-steps output, pointing you at `npm run setup:dev` instead of the Cloudflare secret flow.

## Why This Release Matters to Me

I shipped every previous urthreads release by hand. I'd open the repo, make changes, run tests, bump the version, write the release notes, publish to npm, and tag the commit. This is the first one where I handed the keyboard to Delroy.

If you read the [release notes on GitHub](https://github.com/3M1RY33T/urthreads/releases), you'll notice they don't read like typical changelog prose. They read like a plan. That's because they are. Delroy wrote that plan. It diagnosed both root causes from the codebase, drafted the implementation in four phases, identified every file and line number it needed to touch, specified the security constraints (dev-only behavior gated so it cannot leak into production), and then executed it. I reviewed the diff, we fixed the `.dev.vars` normalization that the previous attempt got wrong, and I published.

I'm not going to pretend this was a hands-off experience. I was in the conversation the whole time. I caught a stale expiry path that would have reintroduced the exact bug we were fixing. I made the call to add wrangler as a devDependency so `npm install` would be enough. But the diagnostic work, the test coverage, the security gating, the dashboard message logic, the setup script itself, the package.json wiring, Delroy did that. I directed and verified. That's the division of labor I've been building toward.

This is the first real deployment I made with my own AI agent. Not a demo. Not a proof of concept. A versioned package on npm, running in production on this site, with tests passing and security constraints intact. That's the milestone.

## What Comes Next

The README already lists what's planned: optional MFA in front of the dashboard, widget-style stats, comment approval settings, broader integration tests. I want to keep using Delroy for these. The local dev environment we just built is what makes that practical. Before v1.2.0, testing the admin dashboard locally meant fighting the cookie and the key expiry every time. Now it's three commands.

If you're running urthreads on your own site, `npm install -g urthreads@latest` gets you v1.2.0. If you're developing against it, `npm install && npm run setup:dev && npm run dev` gets you a working local admin dashboard in under a minute.

<img src="https://raw.githubusercontent.com/3M1RY33T/3M1RY33T.github.io/main/assets/svg/github.svg" alt="urthreads on Github" height="30" style="vertical-align:middle;"/> [Check out the urthreads Repository](https://github.com/3M1RY33T/urthreads)

<img src="https://raw.githubusercontent.com/3M1RY33T/3M1RY33T.github.io/main/assets/svg/npm.svg" alt="urthreads on npm" height="30" style="vertical-align:middle;"/> [Check out the npm Package](https://www.npmjs.com/package/urthreads)