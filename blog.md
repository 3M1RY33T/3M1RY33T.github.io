---
layout: default
title: "Blog"
permalink: /blog/
excerpt: "Blog posts and technical updates from Yigit (Emir) Yildiz."
---

<section class="section blog-section">
  {% assign likes_endpoint = site.likes.endpoint | default: "" %}
  {% assign cusdis_app_id = site.cusdis.app_id | default: "" %}
  <!-- <nav class="post-nav-links blog-nav-links" aria-label="Blog navigation">
    <a class="post-home-link post-home-link-back" href="/">Back to Home</a>
  </nav> -->

  <div class="blog-heading">
    <h1><span class="accent">My</span>Blog</h1>
    <p class="eyebrow">Technical notes · Project updates · Retrospectives</p>
    <p class="blog-intro">A curated space for updates on my personal projects, other tech-related research or interests.</p>
  </div>

  <div class="social-feed">
    {% for post in site.posts %}
      <article class="feed-post" data-feed-post>
        <header class="feed-post-header">
          <img class="feed-avatar" src="https://1.gravatar.com/avatar/acbc4f96261335fc2e541a294927b481a49ec1fa62bf3bf14fc2239b2ae7ac9d?s=96" alt="Yigit Yildiz">
          <div>
            <p class="feed-author">Yigit Yildiz</p>
            <p class="post-meta">{{ post.date | date: "%B %-d, %Y" }}</p>
          </div>
        </header>

        <div class="feed-post-body">
          <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
          {% if post.tags %}
            <ul class="post-tags" aria-label="Post tags">
              {% for tag in post.tags %}
                <li class="tag-{{ tag | slugify }}">{{ tag | capitalize }}</li>
              {% endfor %}
            </ul>
          {% endif %}

          <div class="feed-post-content" data-feed-post-content>
            {{ post.content }}
          </div>

          <div class="feed-post-actions">
            <button class="show-more-button" type="button" data-show-more aria-expanded="false">Show more</button>
            <a class="post-read-link" href="{{ post.url }}">Open post page</a>
          </div>
        </div>

        <section
          class="post-comments feed-comments"
          aria-label="Comments for {{ post.title | escape }}"
          {% if cusdis_app_id != "" %}
            data-cusdis-comments
            data-cusdis-host="{{ site.cusdis.host | default: 'https://cusdis.com' }}"
            data-cusdis-app-id="{{ cusdis_app_id }}"
            data-page-id="{{ post.url }}"
            data-page-url="{{ post.url | absolute_url }}"
            data-page-title="{{ post.title | escape }}"
          {% endif %}
        >
          {% if cusdis_app_id != "" %}
            <div class="comment-list" data-comment-list></div>
            <p class="comment-prompt">Make a comment below.</p>
            <form class="comment-draft-form{% if likes_endpoint != "" %} has-like-button{% endif %}" data-comment-draft-form>
              <label class="sr-only" for="comment-content-{{ forloop.index }}">Comment</label>
              {% if likes_endpoint != "" %}
                <button class="like-button like-button-icon" type="button" data-like-button data-path="{{ post.url }}" aria-label="Like {{ post.title | escape }}" aria-pressed="false">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M8.4 20.2H5.1a2 2 0 0 1-2-2v-7.4a2 2 0 0 1 2-2h3.3v11.4Zm2-10.6 3.7-6.3c.3-.5.8-.8 1.4-.8 1.2 0 2.1 1 1.9 2.2l-.6 4.1h2.1a2.7 2.7 0 0 1 2.6 3.3l-1.2 5.4a3.4 3.4 0 0 1-3.3 2.7h-6.6V9.6Zm-5.3 1.2v7.4h1.3v-7.4H5.1Zm7.3-.7v8.1H17c.7 0 1.2-.5 1.4-1.1l1.2-5.4a.7.7 0 0 0-.7-.9h-4.4l.9-6-3 5.3Z"/>
                  </svg>
                  <span data-like-count>0</span>
                </button>
              {% endif %}
              <textarea id="comment-content-{{ forloop.index }}" name="content" rows="1" required placeholder="What do you think?"></textarea>
              <button class="button comment-send-button" type="submit" aria-label="Send comment" disabled>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3.4 20.4 21.2 12 3.4 3.6 3 10.1l10.8 1.9L3 13.9l.4 6.5Z"/>
                </svg>
              </button>
            </form>
            <p class="comment-status" data-comment-status role="status"></p>

            <div class="comment-modal" data-comment-modal hidden>
              <div class="comment-modal-panel" role="dialog" aria-modal="true" aria-labelledby="comment-modal-title-{{ forloop.index }}">
                <h3 id="comment-modal-title-{{ forloop.index }}">Almost there</h3>
                <p>Choose how your comment should appear.</p>
                <form data-comment-identity-form>
                  <label>
                    Nickname
                    <input type="text" name="nickname" autocomplete="nickname" required placeholder="Your nickname">
                  </label>
                  <label>
                    Email <span>Optional</span>
                    <input type="email" name="email" autocomplete="email" placeholder="you@example.com">
                  </label>
                  <div class="comment-modal-actions">
                    <button class="button button-secondary" type="button" data-comment-cancel>Cancel</button>
                    <button class="button" type="submit">Post comment</button>
                  </div>
                </form>
              </div>
            </div>
          {% else %}
            <p class="comment-empty">There are no comments for this post yet.</p>
            {% if likes_endpoint != "" %}
              <div class="post-engagement">
                <button class="like-button" type="button" data-like-button data-path="{{ post.url }}" aria-label="Like {{ post.title | escape }}" aria-pressed="false">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M8.4 20.2H5.1a2 2 0 0 1-2-2v-7.4a2 2 0 0 1 2-2h3.3v11.4Zm2-10.6 3.7-6.3c.3-.5.8-.8 1.4-.8 1.2 0 2.1 1 1.9 2.2l-.6 4.1h2.1a2.7 2.7 0 0 1 2.6 3.3l-1.2 5.4a3.4 3.4 0 0 1-3.3 2.7h-6.6V9.6Zm-5.3 1.2v7.4h1.3v-7.4H5.1Zm7.3-.7v8.1H17c.7 0 1.2-.5 1.4-1.1l1.2-5.4a.7.7 0 0 0-.7-.9h-4.4l.9-6-3 5.3Z"/>
                  </svg>
                  <span data-like-count>0</span>
                </button>
              </div>
            {% endif %}
          {% endif %}
        </section>
      </article>
    {% endfor %}
  </div>
</section>
