# 3M1RY33T.github.io

Personal portfolio and technical blog for Yigit Yildiz, built with Jekyll and hosted on GitHub Pages.

The site includes a portfolio landing page, project cards, a blog feed, individual post pages, and a lightweight Cloudflare Worker/D1 service for post likes and comments.

## Live Site

- Website: https://3m1ry33t.github.io
- Repository: https://github.com/3M1RY33T/3M1RY33T.github.io

## Features

- Responsive portfolio homepage with project cards and skill icons.
- Blog index with social-feed style posts and expandable content.
- Individual blog post pages using the shared `post` layout.
- Featured recent posts on the homepage.
- Comments backed by a Cloudflare Worker and D1 database.
- Like buttons backed by the same Cloudflare Worker and D1 database.
- Toronto local time display in the contact section.
- Static GitHub Pages-friendly setup with no required frontend build step.

## Local Development

This repository is a Jekyll site. Local development uses files on your machine, not GitHub Actions variables.

1. Copy the example environment file:

```sh
cp .env.example .env
```

2. Fill in `.env`:

```sh
SITE_TITLE="Your Name"
SITE_DESCRIPTION="Your portfolio and blog description."
SITE_BASEURL=""
SITE_URL="https://your-username.github.io"
LIKES_ENDPOINT="https://your-worker.your-subdomain.workers.dev/likes"
COMMENTS_ENDPOINT="https://your-worker.your-subdomain.workers.dev/comments"
```

3. Render the local Jekyll config:

```sh
ruby scripts/render_config.rb
```

This creates `_config.local.yml`, which is ignored by Git.

4. Run Jekyll with both config files:

```sh
gem install jekyll bundler
jekyll serve --config _config.yml,_config.local.yml
```

Then open:

```text
http://localhost:4000
```

If you prefer Bundler, add or use a `Gemfile` and run:

```sh
bundle install
bundle exec jekyll serve --config _config.yml,_config.local.yml
```

## Configuration

The project has three config layers:

- `_config.template.yml`: committed template used by the render script.
- `_config.yml`: ignored local Jekyll config. You can create this manually from the template.
- `_config.local.yml`: ignored generated config created from `.env`.

GitHub Actions also renders a temporary `_config.yml` during deployment. That file exists only inside the Actions runner and is not committed back to the repository.

If you are using this project as your own template, fill out `_config.template.yml` with your site values, then copy or rename it to `_config.yml` before running Jekyll:

```sh
cp _config.template.yml _config.yml
```

Local values live in `.env`, and the generated `_config.local.yml` is ignored by Git. The committed `.env.example` file documents the expected variables without exposing live app data.

Config variables:

| Variable | Used for | Local source | GitHub source |
| --- | --- | --- | --- |
| `SITE_TITLE` | Site title | `.env` | Actions variable or secret |
| `SITE_DESCRIPTION` | Site meta description | `.env` | Actions variable or secret |
| `SITE_BASEURL` | Subpath if hosted below a domain path | `.env` | Actions variable or secret |
| `SITE_URL` | Production site URL | `.env` | Actions variable or secret |
| `LIKES_ENDPOINT` | Cloudflare Worker likes API URL | `.env` | Actions variable or secret |
| `COMMENTS_ENDPOINT` | Cloudflare Worker comments API URL | `.env` | Actions variable or secret |

Important fields:

- `title`, `description`, `url`, and `baseurl` control site metadata and generated absolute URLs.
- `permalink` controls blog post URL format.
- `likes.endpoint` controls the Cloudflare Worker URL used by like buttons.
- `comments.endpoint` controls the Cloudflare Worker URL used by comments.
- `defaults` assigns the `post` layout to files in `_posts/`.

After changing `.env`, run:

```sh
ruby scripts/render_config.rb
```

Then restart `jekyll serve --config _config.yml,_config.local.yml` so the new values are picked up.

Important: values used by browser-side features are still public in the generated website. Worker endpoints can be hidden from the repository, but visitors can still see them in the built HTML or browser DevTools. Real secrets, admin keys, database credentials, API tokens, and private service keys should stay in GitHub Secrets, Cloudflare Worker secrets, or another server-side environment.

## Adding Blog Posts

Create a Markdown file in `_posts/` using this filename format:

```text
YYYY-MM-DD-post-title.md
```

Example front matter:

```yaml
---
layout: post
title: "Post title"
date: 2026-05-19
author: "Yigit Yildiz"
excerpt: "Short summary shown in previews."
tags:
  - update
---
```

The post will automatically appear on `/blog/` and in the homepage feed preview.

## Styling

All site styles are in `assets/css/style.css`. The layouts and pages use semantic classes such as:

- `.hero`
- `.featured-blog-section`
- `.card-grid`
- `.blog-section`
- `.feed-post`
- `.post-comments`
- `.like-button`

SVG icons live in `assets/svg/`, and post/page images live in `assets/images/`.

## Comments

Comments are powered by the Cloudflare Worker in `workers/likes-worker.js` and stored in Cloudflare D1. This keeps the site static while moving the comment data into a private backend you control.

The comment UI is rendered in `blog.md` for the feed view and `_layouts/post.html` for individual post pages. The browser-side logic lives in `_layouts/default.html` and handles:

- Loading approved comments for each post.
- Auto-resizing the comment text field.
- Opening a small identity modal before submission.
- Posting the visitor's nickname, optional email, and comment content to the Worker.
- Showing basic loading, success, and error states.

The Worker uses each post URL path as the page identifier, so comments stay attached to the correct blog post. New comments are stored as `pending` by default and only comments marked `approved` are returned to the public site.

To approve a pending comment, run a D1 update such as:

```sh
wrangler d1 execute portfolio-likes --remote --command "UPDATE post_comments SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = 1"
```

To disable comments, leave `COMMENTS_ENDPOINT` blank in `.env` or in the GitHub Actions variables.

## Engagement Worker

Likes and comments are optional and are enabled when their endpoints are set in `.env` or in the GitHub Actions variables. The site uses a small Cloudflare Worker instead of a full backend server, which keeps the main website deployable as a static GitHub Pages site.

The frontend:

- Finds buttons with `data-like-button`.
- Fetches the current count with `GET /likes?path=/post-url`.
- Increments the count with `POST /likes?path=/post-url`.
- Stores a local browser flag to prevent repeat likes from the same browser.
- Disables the button after a successful like from that browser.
- Shows a fallback unavailable state if the Worker cannot be reached.

The backend lives in `workers/likes-worker.js` and exposes these routes:

```text
GET  /likes?path=/post-url
POST /likes?path=/post-url
GET  /comments?path=/post-url
POST /comments
```

The Worker validates that `path` starts with `/`, reads or updates the like count, reads approved comments, and stores new comments as pending. Data is stored in Cloudflare D1 using the `post_likes` and `post_comments` tables from `workers/schema.sql`.

The Worker expects:

- A Cloudflare D1 binding named `DB`.
- An `ALLOWED_ORIGINS` variable containing the site origin, for example `https://3m1ry33t.github.io`.
- The `post_likes` and `post_comments` tables created before deployment.

Basic deployment flow:

```sh
wrangler d1 create portfolio-likes
wrangler d1 execute portfolio-likes --remote --file=workers/schema.sql
wrangler deploy
```

Use `wrangler.toml.example` as the starting point for local Worker configuration. Keep the real `wrangler.toml` out of version control because it can contain deployment-specific IDs.

The like system is intentionally lightweight. It prevents repeat likes with browser `localStorage`, but it is not meant to be abuse-proof like an account-based voting system. Comments are moderated through D1 status updates rather than a public admin dashboard.

## Use as a Template

You are welcome to use this website as a starting template for your own portfolio or blog.

Feel free to fork the repository, replace the personal content, swap the project cards, edit the styles, and configure your own comments or likes service. If you use the Cloudflare Worker, create your own D1 database and update `LIKES_ENDPOINT` and `COMMENTS_ENDPOINT` in your local `.env` and GitHub Actions variables.

Before running your version, fill out `_config.template.yml`, then copy or rename it to `_config.yml`. This gives Jekyll the config file it expects while keeping your personal config out of Git if you keep `_config.yml` ignored.

Please remove or replace personal information, images, analytics/service IDs, comment app IDs, Worker URLs, and any project descriptions that are specific to this portfolio before publishing your version.

## License

The reusable source code for this project is available under the MIT License. See `LICENSE` for the full license text.

Personal content, blog posts, profile information, project descriptions, images, service IDs, and branding are specific to this portfolio and should be replaced before publishing your own version.

## Security

Security reporting guidance is available in `SECURITY.md`.

## Deployment

The static site is designed for GitHub Pages. The included workflow in `.github/workflows/pages.yml` renders `_config.yml` from GitHub Actions variables inside the temporary Actions checkout before building the site.

### GitHub Pages Setup

1. Go to `Settings > Pages`.
2. Set `Build and deployment > Source` to `GitHub Actions`.
3. Go to `Settings > Secrets and variables > Actions`.
4. Add the site config values below as repository or environment **Variables**.

Variables are preferred for public frontend config:

- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_BASEURL`
- `SITE_URL`
- `LIKES_ENDPOINT`
- `COMMENTS_ENDPOINT`

The workflow also supports **Secrets** with the same names if you already configured them that way. If you use environment secrets, add them to the `github-pages` environment. The build job is configured to run in that environment so it can read those values before Jekyll builds the site.

The workflow fails early if `LIKES_ENDPOINT` or `COMMENTS_ENDPOINT` are missing, so check the Actions log if likes or comments are not appearing after deployment.

The engagement API is deployed separately through Cloudflare Workers. If the Worker URL changes, update `LIKES_ENDPOINT` and `COMMENTS_ENDPOINT` in `.env` and in the GitHub Actions variables.

## Removing Old Private History

Moving values into `.env` protects future commits, but it does not erase values that were already committed. If a value was ever committed, treat it as exposed and rotate it where possible.

The safest way to publish this as a reusable public template is:

1. Keep this existing repository private.
2. Create a brand-new public repository.
3. Copy the current sanitized working tree into the new repository without copying the old `.git` directory.
4. Commit the clean files as the first public commit.

That gives the public repo no older private history to inspect.

If you must keep the same repository, use a history rewrite tool such as `git filter-repo` or BFG Repo-Cleaner, then force-push and rotate any exposed values. This is more fragile because anyone who already cloned the repository may still have the old commits.

## Maintenance Notes

- Do not edit `_site/` directly; it is generated by Jekyll.
- Restart the local Jekyll server after config changes.
- Keep `.env` local and uncommitted.
- Keep Worker credentials, database IDs, and environment-specific secrets out of committed files.
- Check browser DevTools when debugging comments or likes, since both features depend on the Worker API.
