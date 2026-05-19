# Blog Engagement Worker

This Worker powers the no-account blog like buttons and the moderated comment section. It exposes:

- `GET /likes?path=/post-url`
- `POST /likes?path=/post-url`
- `GET /comments?path=/post-url`
- `POST /comments`

## Deploy

1. Create the D1 database:

   ```sh
   wrangler d1 create portfolio-likes
   ```

2. Copy `wrangler.toml.example` to `wrangler.toml`:

   ```sh
   cp wrangler.toml.example wrangler.toml
   ```

3. Copy the returned `database_id` into `wrangler.toml`.

   The D1 binding must be named `DB`, because `workers/likes-worker.js` reads `env.DB`.

4. Set `ALLOWED_ORIGINS` in `wrangler.toml`.

   Include your production site and local Jekyll URL:

   ```toml
   [vars]
   ALLOWED_ORIGINS = "https://your-username.github.io,http://localhost:4000,http://127.0.0.1:4000"
   ```

5. Create the tables:

   ```sh
   wrangler d1 execute portfolio-likes --remote --file=workers/schema.sql
   ```

   The `--remote` flag is important. Without it, Wrangler may create the table only in your local development D1 database, while the deployed Worker continues to fail against the remote database.

6. Deploy the Worker:

   ```sh
   wrangler deploy
   ```

7. Add the Worker URL to your site config.

   For local development, set this in `.env`:

   ```sh
   LIKES_ENDPOINT="https://portfolio-likes.your-subdomain.workers.dev/likes"
   COMMENTS_ENDPOINT="https://portfolio-likes.your-subdomain.workers.dev/comments"
   ```

   Then render the local Jekyll config:

   ```sh
   ruby scripts/render_config.rb
   ```

   For GitHub Pages, add the same values as `LIKES_ENDPOINT` and `COMMENTS_ENDPOINT` under `Settings > Secrets and variables > Actions > Variables` or in the `github-pages` environment.

   The rendered Jekyll config will contain:

   ```yml
   likes:
     endpoint: "https://portfolio-likes.your-subdomain.workers.dev/likes"
   comments:
     endpoint: "https://portfolio-likes.your-subdomain.workers.dev/comments"
   ```

## Moderating Comments

New comments are saved with `pending` status. The public API only returns `approved` comments.

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
- If comments do not render, confirm `COMMENTS_ENDPOINT` is set before Jekyll builds.
- If the buttons render but disable themselves, check the Worker response in the browser console.
- If the Worker returns `500` or Cloudflare `error code: 1101`, check that the D1 binding is named `DB`, the database ID is correct, and `workers/schema.sql` has been applied.
- If `wrangler d1 execute` says `Resource location: local`, rerun it with `--remote`.
- If the browser reports a CORS error, add your site origin to `ALLOWED_ORIGINS`.

The frontend also stores a local browser flag after a visitor likes a post, which prevents repeat likes from the same browser. Since there is no account system, this is intentionally lightweight rather than abuse-proof.
