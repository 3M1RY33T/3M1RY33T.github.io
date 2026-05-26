# Security Policy

## Supported Project

This repository contains the source for a personal static Jekyll portfolio/blog and an optional Cloudflare Worker used for blog post likes and comments.

Security reports are most useful for issues that affect the frontend comment/like integrations, the Cloudflare Worker implementation, or accidental exposure of deployment-specific configuration.

## Reporting a Vulnerability

Please do not open a public issue for sensitive security reports.

To report a vulnerability, contact the maintainer through the contact information listed on the website or GitHub profile. Include:

- A clear description of the issue.
- Steps to reproduce the behavior.
- The affected file, route, or service.
- Any relevant browser console output, HTTP response, or Worker error message.

I will review reports as soon as reasonably possible and follow up if more information is needed.

## Scope

In scope:

- Bugs in the static site code that could expose visitor data or break browser security expectations.
- Issues in the Cloudflare Worker likes or comments API.
- CORS or request handling problems related to the engagement service.
- Accidental exposure of deployment-specific configuration.

Out of scope:

- Attacks against third-party services such as GitHub Pages, Cloudflare, or Gravatar.
- Spam, abuse, or repeated voting limitations caused by the intentionally lightweight no-account like system.
- Social engineering or physical attacks.

## Repository Use

This repository may be used as a website template under the restrictions in `LICENSE`. Replace all personal content, branding, profile links, contact details, images, posts, project descriptions, service endpoints, and deployment-specific configuration before publishing your own version.

Keep secrets and deployment-specific files out of version control. The included `.gitignore` excludes common local files such as `wrangler.toml`, `.env`, `.wrangler/`, and `_site/`.
