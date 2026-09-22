---
title: urthreads
tagline: Engagement software for sites that do not run a server
summary: >
  Likes and comments for static sites. Deploy the Worker to your own
  Cloudflare account, point it at your own D1 database, hold your own admin
  key, and keep your readers' data.
problem: >
  Adding comments to a static site normally means handing your readers'
  identities to a third party whose business model is that data. urthreads
  is the same feature set, self-hosted end to end, with nothing in the
  runtime dependency tree at all. It is also running on this site's blog,
  which is the only deployment test that counts.
order: 3
date: 2026-05-19
status: active
stack: [JavaScript, Cloudflare Workers, D1, SQL]
platforms: [Cloudflare]

links:
  github: https://github.com/3M1RY33T/urthreads
  package: https://www.npmjs.com/package/urthreads
  package_label: npm
  document: /assets/urthreads-Project-Document.pdf

install: npm install -g urthreads
install_note: >
  The guided setup authenticates Wrangler, creates or reuses a D1 database,
  writes .env with 0600 permissions, generates wrangler.toml, initialises
  the schema and deploys the Worker. Teardown undoes all of it.

metrics_verified: 2026-09-22
metrics:
  - { label: Tests, value: "229 passed in 444ms, 0 skipped" }
  - { label: Runtime dependencies, value: "0" }
  - { label: Worker, value: "2,204 lines, 20 routed endpoints" }
  - { label: Published, value: "npm 1.2.2, MIT" }

capabilities:
  - title: Your account, your database, your key
    body: >
      Nothing routes through infrastructure belonging to anyone else. The
      Worker runs in your Cloudflare account against your own D1 instance,
      and the admin key is yours to rotate.
  - title: Zero runtime dependencies, deliberately
    body: >
      A package a stranger installs globally and points at their own cloud
      account is a package whose dependency tree is a security surface. The
      smallest possible tree is none. The Worker uses WebCrypto, fetch and
      the D1 binding; the CLI uses node builtins.
  - title: Nothing a stranger does is visible until you act
    body: >
      Every public endpoint either reads an aggregate or writes something
      invisible until a human approves it. That is the entire authorization
      model on the public side, and it is why no reader needs an account.
  - title: Twelve security properties, each with a test
    body: >
      The cookie flags, the 403 on a cross-origin text/plain POST, the 429
      after five failed keys, the audit-log inserts, the admin endpoint that
      must never leak its own secrets. The security policy in executable
      form is the only form that cannot drift from the code.

showcase:
  - image: /assets/img/urthreads-dashboard-overview.png
    caption: The moderation dashboard, authenticated with your own admin key.
    alt: urthreads dashboard showing comment and like totals
  - image: /assets/img/urthreads-dashboard-threads.png
    caption: Threads, with the five moderation verbs inline.
    alt: A list of comment threads awaiting moderation
  - image: /assets/img/urthreads-website-integration.png
    caption: The embeddable comment thread, running on this site's blog.
    alt: A comment thread embedded in a blog post

post_match: [urthreads]
---

## How it works

One Worker serves two audiences on one origin: a reader's browser calling
`likes.js` and `comments.js`, and the owner's browser driving the admin
dashboard. Both land on the same fetch handler, which applies a CORS policy,
a CSRF check, authentication and rate limits before anything reaches D1.

The threat model is specific and slightly awkward, and every control follows
from it: **an API deliberately called cross-origin from a site the API does
not host, with an admin console that is itself a static file on a third
origin.**

**CORS allows exact strings and nothing else.** The CLI refuses to store a
wildcard and the Worker never honours one on `/admin/*`. Those are two
separate defences because they fail differently. A CLI that refuses the
wildcard protects the person setting it up from a mistake; a Worker that
refuses to honour one protects the deployment from a config that arrived
some other way, such as a hand-edit in the Cloudflare dashboard. A control
implemented only in the tool that writes the config is a control a hand-edit
removes.

**Sessions exist without a session server.** The admin key is accepted
exactly once, at `POST /admin/session`, and exchanged for a cookie that is
`__Host-` prefixed so the browser itself enforces `Secure`, `Path=/` and the
absence of a `Domain` attribute; `HttpOnly` so dashboard JavaScript cannot
read it; signed; and carrying a `jti` recorded in a table. That last part is
what makes an individual session revocable. A signed stateless token cannot
be revoked; a signed token with a row can.

**CSRF is answered with an Origin check on every admin mutation**, because
the usual same-origin defence is unavailable by construction here. A missing
Origin is rejected rather than treated as trust, and a cross-origin
`text/plain` POST, the shape that historically slipped past
`Content-Type`-based defences, is asserted to return 403.

**Rate limiting has no shared memory to work with.** Workers are isolates:
there is no process to hold a counter, so an in-memory limiter is
per-isolate, which means per-region and per-restart. The counters live in D1
instead, one row per bucket per window, upserted with `INSERT ... ON
CONFLICT` so a concurrent burst across isolates increments one row rather
than racing several. The in-memory limiter is kept as a mirror, which makes
the common case cheap without making the guarantee depend on it.

## Trade-offs

**Only failures count on the login limiter.** A limiter that counts
successes locks out the legitimate owner during a busy moderation session,
and that is the failure mode that gets rate limiting removed entirely.

**Client IP comes from `CF-Connecting-IP` only.** `X-Forwarded-For` is
caller-supplied and therefore not an identifier. A limiter keyed on a header
the attacker writes is not a limiter, and the audit log records the same
field for the same reason.

**Errors say nothing and can still be traced.** A sanitised 500 carries a
correlation id, with a base64url fallback when one cannot be derived. The
response tells the caller nothing about the failure; the id lets the owner
find it in the logs. An error handler that returns the stack is a
disclosure, and one that returns nothing at all makes the owner's own bug
reports unusable.

**Email encryption is opt-in, and the documentation says so plainly.**
Commenter emails are optional and, when `DATA_ENCRYPTION_KEY` is set,
encrypted with AES-GCM before they reach the database, with a per-record IV.
An install without the key stores emails in plaintext in the owner's own D1.
That is a defensible position for a field that is itself optional, but it is
stated rather than implied away.

**Hide and delete are separate verbs.** Hiding keeps a comment approved and
stamps `hidden_at`, so it can come back; deleting removes it and its child
replies permanently. A moderation UI with only one destructive verb
encourages using it for both cases.

**Teardown is a first-class command.** Setup creates a database, a Worker,
two config files and a secret. `backout` and the three `clean` commands undo
them, and deleting the deployed Worker requires an explicit confirmation. A
trial install that leaves infrastructure behind becomes a bill.

## What I would do next

**The dashboard is not tested.** 1,919 lines of `web/dashboard.js` have no
test file. The Worker is well covered and the CLI is well covered; the third
surface is neither, and it is the one that renders untrusted text.

**One admin key, one role.** There is no second moderator and no scopes. For
the intended deployment, a personal site, that is correct. It is the first
thing that breaks if anyone wants it for a team blog.

**Email encryption should generate a key during setup** rather than leaving
the field plaintext when the variable is unset.

**Spam defence is keywords and rate limits, and nothing else.** Five
comments per minute per IP plus a denied-keyword list is enough for a
personal site and would not survive being targeted.

**Rate limit rows are never pruned.** Old windows accumulate. The volume is
small and the tables are indexed, so this is housekeeping rather than a
defect, but it is unbounded growth in a database the owner pays for.
