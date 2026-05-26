---
layout: post
title: "urthreads is Live!"
date: 2026-05-25
author: "Yigit Yildiz"
excerpt: "Self-hosted likes, comments, moderation, and dashboard tooling for static websites."
tags:
  - release
---

I have recently released the first public version of urthreads; an open-source, self-hosted engagement service for static websites. It adds likes, moderated comments, threaded replies, comment likes, and a dashboard without needing to run a traditional backend server.

<div data-post-slider markdown="1" aria-label="Urthreads screenshots">

![Urthreads](/assets/img/urthreads-logo-banner.png "npm i urthreads")
![Dashboard overview](/assets/img/urthreads-dashboard-overview.png "Dashboard summary and thread stats")
![Comment moderation](/assets/img/urthreads-dashboard-threads.png "Threaded / nested comments, pending comment review queue")
![Comment moderation](/assets/img/urthreads-denied-keywords.png "Auto-deny selected keywords")

</div>

urthreads is self-hosted software for adding engagement features to static websites. Simply deploy the Worker to your own Cloudflare account, connect it to your own D1 database, and manage the dashboard with your own admin key. It adds page likes, threaded comments, moderation, dashboard analytics, and admin tooling for blogs, portfolios, documentation sites, and other static pages that need interaction without running a traditional server.

The goal is to keep the main website simple while moving interaction into a small service that you control. New comments are pending by default, the dashboard supports moderation and analytics, and the CLI can help with setup, admin keys, sessions, comments, likes, stats, and D1 health checks.

I am also using urthreads on this portfolio now. The likes and comments on this blog were previously backed by a small manual Worker setup, but I migrated the existing D1 database into urthreads without losing the old likes or comments. That was one of the main reasons I wanted to turn this into its own package: I wanted a reusable service that could support this site and future static websites without copying the same Worker code around.

This project is still young, and I am expecting to keep improving the dashboard, moderation workflow, and deployment experience. urthreads is open source, and everyone is welcome to use it, test it, and contribute.

<img src="https://raw.githubusercontent.com/3M1RY33T/3M1RY33T.github.io/main/assets/svg/github.svg" alt="urthreads on Github" height="30" style="vertical-align:middle;"/> [Check out the Github Repository](https://github.com/3M1RY33T/urthreads)

<img src="https://raw.githubusercontent.com/3M1RY33T/3M1RY33T.github.io/main/assets/svg/npm.svg" alt="urthreads on npm" height="30" style="vertical-align:middle;"/> [Check out the npm Package](https://www.npmjs.com/package/urthreads)
