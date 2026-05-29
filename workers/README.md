# Blog Engagement Worker

This Worker uses [`urthreads`](https://github.com/3M1RY33T/urthreads) to power no-account blog like buttons, moderated comments, threaded replies, comment likes, and admin tooling. The local wrapper is `workers/urthreads-worker.js`. It exposes:

- `GET /likes?path=/post-url`
- `POST /likes?path=/post-url`
- `GET /comments?path=/post-url`
- `POST /comments`
- `GET /comments/like?commentId=123`
- `POST /comments/like?commentId=123`

## Deploy

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create the D1 database for a new site:

   ```sh
   wrangler d1 create portfolio-likes
   ```

   For an existing site, keep the current D1 database so likes and comments remain intact.

3. Copy `wrangler.toml.example` to `wrangler.toml`:

   ```sh
   cp wrangler.toml.example wrangler.toml
   ```

4. Copy the returned or existing `database_id` into `wrangler.toml`.

   The D1 binding must be named `DB`, because `urthreads` reads `env.DB`.

5. Set `ALLOWED_ORIGINS` in `wrangler.toml`.

   Include your production site and local Jekyll URL:

   ```toml
   [vars]
   ALLOWED_ORIGINS = "https://your-username.github.io,http://localhost:4000,http://127.0.0.1:4000"
   ```

6. Create or migrate the tables.

   For a new database, use the schema shipped by `urthreads`:

   ```sh
   wrangler d1 execute portfolio-likes --remote --file=node_modules/urthreads/src/schema.sql
   ```

   For an existing database, back up the current rows and apply the additive migration:

   ```sh
   npm run d1:backup
   npm run d1:migrate:urthreads
   ```

   The `--remote` flag is important. Without it, Wrangler may change only your local development D1 database, while the deployed Worker continues to use the remote database.

7. Generate and store an admin key:

   ```sh
   npx urthreads admin-key --expires never
   ```

   When prompted, store `ADMIN_API_KEY` as a Worker secret. The raw key is written only to the ignored `.env` file and copied to your clipboard when available.

8. Deploy the Worker:

   ```sh
   npx wrangler deploy
   ```

9. Add the Worker URL to your site config.

   For local development, set this in `.env`:

   ```sh
   LIKES_ENDPOINT="https://portfolio-likes.your-subdomain.workers.dev/likes"
   COMMENTS_ENDPOINT=""
   ```

   `COMMENTS_ENDPOINT` is optional when comments use the same Worker as likes. The render script derives it from `LIKES_ENDPOINT` by replacing `/likes` with `/comments`.

   Then render the local Jekyll config:

   ```sh
   ruby scripts/render_config.rb
   ```

   For GitHub Pages, add `LIKES_ENDPOINT` under `Settings > Secrets and variables > Actions > Variables` or in the `github-pages` environment. Add `COMMENTS_ENDPOINT` only if comments use a different Worker URL.

   The rendered Jekyll config will contain:

   ```yml
   likes:
     endpoint: "https://portfolio-likes.your-subdomain.workers.dev/likes"
   comments:
     endpoint: "https://portfolio-likes.your-subdomain.workers.dev/comments"
   ```

## Moderating Comments

New comments are saved with `pending` status. The public API only returns `approved` comments.

## Updating the Dashboard

This site hosts the static urthreads dashboard at `/urthreads/`. The local `.env` stores:

```sh
DASHBOARD_LOCAL_PATH="/path/to/this/repository"
DASHBOARD_ENDPOINT="urthreads"
```

Point the urthreads CLI at the existing site root and dashboard endpoint:

```sh
npx urthreads dashboard set . urthreads
```

Refresh the installed dashboard after updating the `urthreads` package:

```sh
npx urthreads dashboard build
```

The dashboard is rebuilt from `node_modules/urthreads/web`. If you want it to prefill the Worker URL, add the `urthreads:admin:workerUrl` `sessionStorage` snippet to `urthreads/index.html` after rebuilding.

The deployed dashboard origin must be present in `ALLOWED_ORIGINS`, for example `https://yigityildiz.dev`. The origin does not include `/urthreads/`.

Use the `urthreads` CLI for common moderation actions:

```sh
npx urthreads pending
npx urthreads approve 1 --execute
npx urthreads reject 1 --execute
```

The legacy local helper still works for direct-D1 moderation:

```sh
./comments pending
./comments show 1
./comments approve 1
./comments reject 1
```

If you add the repository root to your shell `PATH`, the same helper can be run as `comments pending`.

List pending comments:

```sh
wrangler d1 execute portfolio-likes --remote --command "SELECT id, path, author_name, content, created_at FROM post_comments WHERE status = 'pending' ORDER BY created_at DESC"
```

Approve a comment:

```sh
wrangler d1 execute portfolio-likes --remote --command "UPDATE post_comments SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = 1"
```

Reject a comment:

```sh
wrangler d1 execute portfolio-likes --remote --command "UPDATE post_comments SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = 1"
```

## Troubleshooting

- If the like buttons do not render, confirm `LIKES_ENDPOINT` is set before Jekyll builds.
- If comments do not render, confirm `LIKES_ENDPOINT` is set before Jekyll builds, or set `COMMENTS_ENDPOINT` explicitly.
- If the buttons render but disable themselves, check the Worker response in the browser console.
- If the Worker returns `500` or Cloudflare `error code: 1101`, check that the D1 binding is named `DB`, the database ID is correct, and the `urthreads` schema or migration has been applied.
- If `wrangler d1 execute` says `Resource location: local`, rerun it with `--remote`.
- If the browser reports a CORS error, add your site origin to `ALLOWED_ORIGINS`.

The frontend also stores a local browser flag after a visitor likes a post, which prevents repeat likes from the same browser. Since there is no account system, this is intentionally lightweight rather than abuse-proof.
