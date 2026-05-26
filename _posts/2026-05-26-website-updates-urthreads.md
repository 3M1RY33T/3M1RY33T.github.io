---
layout: post
title: "Website Updates: urthreads Integration"
date: 2026-05-26
author: "Yigit Yildiz"
excerpt: "This portfolio now uses urthreads for likes, comments, moderation, and dashboard tooling."
tags:
  - update
---

I have made a pretty meaningful update to this website: the blog engagement system is now powered by [urthreads](https://github.com/3M1RY33T/urthreads), my self-hosted static-site engagement service for Cloudflare Workers and D1.

![urthreads Integration](/assets/img/urthreads-website-integration.png)

I came up with the idea of this project during the development of this website. I wanted to add engagement and reactions to my posts without having to maintain a user flow that would be mostly unnecessary since I'm the only author of the blog.

While I was looking for ready services to implement my idea, they were either not working properly on the free tier, or it needed a subscription tier to use. So I made it open source and free, hosted by you. 

## What Changed

- Likes and comments now run through the urthreads Worker.
- Comments are still moderated before they appear publicly.
- The Worker keeps using Cloudflare D1, so the site itself remains static and GitHub Pages-friendly.
- The backend can now support richer features like threaded comments, comment likes, denied keywords, stats, and audit logs.
- The blog feed now has a wider responsive desktop layout while keeping the mobile layout compact.
- Posts with media now use a two-column desktop feed layout, with the text continuing full-width after it passes the media preview.
- Single images and image sliders are extracted into consistent media previews on the blog feed.
- Image sliders can be dragged or swiped on mobile and tablet viewports.
- Comment spacing on the feed is tighter, and the extra divider between post content and comments has been removed.
- Homepage featured-post excerpts now keep post headings as compact bold labels instead of rendering them as full headings.
- Code blocks are more compact and now use a blue theme that better matches the rest of the site.

I also added a few smaller improvements around the site while making the change. The browser tab now has a small theme-aware `My` SVG favicon, the blog feed avatar has a clearer blue ring, author labels now read more naturally, and post likes stay synchronized across repeated buttons for the same post. 

Posts can now include image sliders using ordinary Markdown images, which makes it easier to write visual project updates without making every post layout custom.

## Why urthreads

urthreads is meant to sit in the middle between a completely static website and a full backend application. It gives static sites just enough interaction to feel alive, but still keeps the deployment model simple: a Worker, a D1 database, and static dashboard files.

For this portfolio, that means I can keep writing posts in Markdown and publishing through GitHub Pages, while the interactive parts live in a focused service that can evolve independently.

## What Comes Next

I want to keep improving the dashboard and moderation flow, especially around threaded conversations and post-level analytics. I also want this website to use the new media slider more often and keep refining how media-heavy posts are presented across the feed and individual post pages.

This update is mostly infrastructure, but it should make the blog easier to maintain and more pleasant to use over time.

<img src="https://raw.githubusercontent.com/3M1RY33T/3M1RY33T.github.io/main/assets/svg/github.svg" alt="urthreads on Github" height="30" style="vertical-align:middle;"/> [Check out the urthreads Repository](https://github.com/3M1RY33T/urthreads)
