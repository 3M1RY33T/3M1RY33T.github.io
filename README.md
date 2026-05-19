# 3M1RY33T.github.io

Personal portfolio and technical blog for Yigit Yildiz, built with Jekyll and hosted on GitHub Pages.

The site includes a portfolio landing page, project cards, a blog feed, individual post pages, Cusdis-powered comments, and a lightweight Cloudflare Worker/D1 service for post likes.

## Live Site

- Website: https://3m1ry33t.github.io
- Repository: https://github.com/3M1RY33T/3M1RY33T.github.io

## Project Structure

```text
.
├── .github/workflows/pages.yml # GitHub Pages deployment workflow
├── .env.example                # Safe example environment values
├── _config.yml                 # Jekyll site settings and service endpoints
├── _config.template.yml        # Environment-backed config template
├── index.md                    # Home page: hero, feed preview, projects, skills, contact
├── blog.md                     # Blog listing/feed page
├── _layouts/
│   ├── default.html            # Shared HTML shell, navigation, footer, site scripts
│   └── post.html               # Individual blog post layout
├── _posts/                     # Markdown blog posts
├── assets/
│   ├── css/style.css           # Main site styles
│   ├── images/                 # Raster images used by posts/pages
│   └── svg/                    # Tech stack and project icons
├── workers/
│   ├── likes-worker.js         # Cloudflare Worker API for likes
│   ├── schema.sql              # D1 table schema for likes
│   └── README.md               # Worker-specific deployment notes
├── scripts/render_config.rb    # Renders _config.yml from .env or GitHub variables
├── wrangler.toml.example       # Example Cloudflare Worker config
├── LICENSE                     # MIT license for reusable code
├── SECURITY.md                 # Security reporting guidance
└── README.md
```

Generated and local-only directories such as `_site/`, `.jekyll-cache/`, `.wrangler/`, `.venv/`, and `node_modules/` are ignored.

## Features

- Responsive portfolio homepage with project cards and skill icons.
- Blog index with social-feed style posts and expandable content.
- Individual blog post pages using the shared `post` layout.
- Featured recent posts on the homepage.
- Cusdis comments loaded through the frontend.
- Like buttons backed by a Cloudflare Worker and D1 database.
- Toronto local time display in the contact section.
- Static GitHub Pages-friendly setup with no required frontend build step.

## Local Development

This repository is a Jekyll site. Copy the example environment file, fill in your local values, render the local Jekyll config, then run the site:

```sh
cp .env.example .env
ruby scripts/render_config.rb
```

Then, from the project root:

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

The committed `_config.yml` contains safe placeholder defaults. Private local values are rendered into `_config.local.yml` from `_config.template.yml`.

Local values live in `.env`, and the generated `_config.local.yml` is ignored by Git. The committed `.env.example` file documents the expected variables without exposing live app data.

Important fields:

- `title`, `description`, `url`, and `baseurl` control site metadata and generated absolute URLs.
- `permalink` controls blog post URL format.
- `likes.endpoint` controls the Cloudflare Worker URL used by like buttons.
- `cusdis.app_id` and `cusdis.host` control the comment integration.
- `defaults` assigns the `post` layout to files in `_posts/`.

After changing `.env`, run:

```sh
ruby scripts/render_config.rb
```

Then restart `jekyll serve --config _config.yml,_config.local.yml` so the new values are picked up.

Important: values used by browser-side features are still public in the generated website. A likes endpoint or Cusdis app ID can be hidden from the repository, but visitors can still see it in the built HTML or browser DevTools. Real secrets, admin keys, database credentials, API tokens, and private service keys should stay in GitHub Secrets, Cloudflare Worker secrets, or another server-side environment.

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

Comments are powered by Cusdis, a lightweight external comment service. This keeps the site static while still allowing visitors to leave comments on blog posts.

The comment UI is rendered in `blog.md` for the feed view and `_layouts/post.html` for individual post pages. The browser-side logic lives in `_layouts/default.html` and handles:

- Loading approved comments for each post.
- Rendering nested replies returned by Cusdis.
- Auto-resizing the comment text field.
- Opening a small identity modal before submission.
- Posting the visitor's nickname, optional email, and comment content to Cusdis.
- Showing basic loading, success, and error states.

Cusdis uses each post URL as the page identifier, so comments stay attached to the correct blog post. New comments may require approval depending on the Cusdis project settings.

To disable comments, leave `CUSDIS_APP_ID` blank in `.env` or in the GitHub Actions variables.

## Likes Worker

Likes are optional and are enabled when `LIKES_ENDPOINT` is set in `.env` or in the GitHub Actions variables. The site uses a small Cloudflare Worker instead of a full backend server, which keeps the main website deployable as a static GitHub Pages site.

The frontend:

- Finds buttons with `data-like-button`.
- Fetches the current count with `GET /likes?path=/post-url`.
- Increments the count with `POST /likes?path=/post-url`.
- Stores a local browser flag to prevent repeat likes from the same browser.
- Disables the button after a successful like from that browser.
- Shows a fallback unavailable state if the Worker cannot be reached.

The backend lives in `workers/likes-worker.js` and exposes two routes:

```text
GET  /likes?path=/post-url
POST /likes?path=/post-url
```

The Worker validates that `path` starts with `/`, reads or updates the like count, and returns JSON containing the post path and current count. Counts are stored in Cloudflare D1 using the `post_likes` table from `workers/schema.sql`.

The Worker expects:

- A Cloudflare D1 binding named `DB`.
- An `ALLOWED_ORIGINS` variable containing the site origin, for example `https://3m1ry33t.github.io`.
- The `post_likes` table created before deployment.

Basic deployment flow:

```sh
wrangler d1 create portfolio-likes
wrangler d1 execute portfolio-likes --file=workers/schema.sql
wrangler deploy
```

Use `wrangler.toml.example` as the starting point for local Worker configuration. Keep the real `wrangler.toml` out of version control because it can contain deployment-specific IDs.

This like system is intentionally lightweight. It prevents repeat likes with browser `localStorage`, but it is not meant to be abuse-proof like an account-based voting system.

## Use as a Template

You are welcome to use this website as a starting template for your own portfolio or blog.

Feel free to fork the repository, replace the personal content, swap the project cards, edit the styles, and configure your own comments or likes service. If you use the Cloudflare Worker, create your own D1 database and update `LIKES_ENDPOINT` in your local `.env` and GitHub Actions variables.

Please remove or replace personal information, images, analytics/service IDs, comment app IDs, Worker URLs, and any project descriptions that are specific to this portfolio before publishing your version.

## License

The reusable source code for this project is available under the MIT License. See `LICENSE` for the full license text.

Personal content, blog posts, profile information, project descriptions, images, service IDs, and branding are specific to this portfolio and should be replaced before publishing your own version.

## Security

Security reporting guidance is available in `SECURITY.md`.

## Deployment

The static site is designed for GitHub Pages. The included workflow in `.github/workflows/pages.yml` renders `_config.yml` from GitHub Actions variables inside the temporary Actions checkout before building the site.

Add these repository variables in GitHub under `Settings > Secrets and variables > Actions > Variables`:

- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_BASEURL`
- `SITE_URL`
- `LIKES_ENDPOINT`
- `CUSDIS_APP_ID`
- `CUSDIS_HOST`

Then set GitHub Pages to deploy from GitHub Actions under `Settings > Pages`.

The likes API is deployed separately through Cloudflare Workers. If the Worker URL changes, update `LIKES_ENDPOINT` in `.env` and in the GitHub Actions variables.

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
- Check browser DevTools when debugging comments or likes, since both features depend on external APIs.
