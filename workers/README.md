# Blog Likes Worker

This Worker powers the no-account blog like buttons. It exposes:

- `GET /likes?path=/post-url`
- `POST /likes?path=/post-url`

## Deploy

1. Create the D1 database:

   ```sh
   wrangler d1 create portfolio-likes
   ```

2. Copy the returned `database_id` into `wrangler.toml`.

3. Create the table:

   ```sh
   wrangler d1 execute portfolio-likes --file=workers/schema.sql
   ```

4. Deploy the Worker:

   ```sh
   wrangler deploy
   ```

5. Add the Worker URL to `_config.yml`:

   ```yml
   likes:
     endpoint: "https://portfolio-likes.your-subdomain.workers.dev/likes"
   ```

The frontend also stores a local browser flag after a visitor likes a post, which prevents repeat likes from the same browser. Since there is no account system, this is intentionally lightweight rather than abuse-proof.
