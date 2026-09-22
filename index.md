---
layout: default
title: "Home"
excerpt: "A personal portfolio and blog by Yigit (Emir) Yildiz."
---

<section class="hero">
  <div class="hero-copy">
    <div class="hero-head">
      <img class="hero-avatar" src="https://1.gravatar.com/avatar/acbc4f96261335fc2e541a294927b481a49ec1fa62bf3bf14fc2239b2ae7ac9d?s=200" alt="" width="96" height="96">
      <div class="hero-title">
        <p class="eyebrow">Software Engineer &middot; Full-stack &middot; AI &middot; Mobile</p>
        <h1>Yigit Yildiz<span class="accent">.</span></h1>
      </div>
    </div>
    <p class="intro">I'm a Software Engineer from Istanbul, Turkey living in Toronto, Ontario with a passion for building scalable, open-source solutions free for everyone to use. I have a diverse tech stack spanning full-stack development, AI/ML systems, and mobile applications.</p>
    <div class="hero-links">
      <a class="button" href="#projects">View projects</a>
      <a class="button button-secondary" href="#contact">Contact</a>
      <span class="hero-social">
        <a href="https://github.com/3M1RY33T" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        </a>
        <a href="https://www.linkedin.com/in/yigitt-yildizz" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
        </a>
      </span>
    </div>
  </div>
  {% include activity-panel.html %}
</section>

{% if site.posts.size > 0 %}
{% assign likes_endpoint = site.likes.endpoint | default: "" %}
<section id="featured-blog" class="section featured-blog-section" data-featured-blog>
  <div class="featured-blog-header">
    <h2>Feed</h2>
    <p class="section-intro">Most recent notes, releases, and project updates from <strong><span class="accent">My</span>Blog</strong>.</p>
  </div>

  <div class="featured-blog-layout">
    <div class="featured-blog-stage">
      {% for post in site.posts limit: 4 %}
        <article class="featured-post{% if forloop.first %} is-active{% endif %}" data-featured-item="{{ forloop.index0 }}">
          <a class="featured-post-link" href="{{ post.url }}">
            <p class="post-meta">{{ post.date | date: "%B %-d, %Y" }}</p>
            <h3>{{ post.title }}</h3>
            {% if post.tags %}
              <ul class="post-tags" aria-label="Post tags">
                {% for tag in post.tags %}
                  <li class="tag-{{ tag | slugify }}">{{ tag | capitalize }}</li>
                {% endfor %}
              </ul>
            {% endif %}
            {% assign featured_content = "" %}
            {% assign post_lines = post.content | newline_to_br | split: "<br />" %}
            {% for line in post_lines %}
              {% assign trimmed_line = line | strip %}
              {% assign first_char = trimmed_line | slice: 0 %}
              {% unless trimmed_line == "" %}
                {% if first_char == "#" %}
                  {% assign heading_text = trimmed_line | remove: "#" | strip %}
                  {% assign featured_content = featured_content | append: " <strong>" | append: heading_text | append: ":</strong>" %}
                {% elsif trimmed_line contains "<h1" or trimmed_line contains "<h2" or trimmed_line contains "<h3" or trimmed_line contains "<h4" or trimmed_line contains "<h5" or trimmed_line contains "<h6" %}
                  {% assign heading_text = trimmed_line | strip_html | strip %}
                  {% assign featured_content = featured_content | append: " <strong>" | append: heading_text | append: ":</strong>" %}
                {% else %}
                  {% assign line_text = trimmed_line | strip_html %}
                  {% assign featured_content = featured_content | append: " " | append: line_text %}
                {% endif %}
              {% endunless %}
            {% endfor %}
            <div class="featured-post-excerpt">{{ featured_content | normalize_whitespace }}</div>
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
            <span class="post-read-link">Read post</span>
          </a>
        </article>
      {% endfor %}
    </div>

    <div class="featured-playlist" aria-label="Featured blog playlist">
      {% for post in site.posts limit: 4 %}
        <button class="{% if forloop.first %}is-active{% endif %}" type="button" data-featured-trigger="{{ forloop.index0 }}" aria-pressed="{% if forloop.first %}true{% else %}false{% endif %}">
          <span class="featured-playlist-date">{{ post.date | date: "%b %-d" }}</span>
          <span>
            <strong>{{ post.title }}</strong>
            <span>{% if post.tags %}{{ post.tags | join: " · " | capitalize }}{% else %}Blog post{% endif %}</span>
          </span>
        </button>
      {% endfor %}
    </div>
  </div>

  <a class="featured-blog-see-all" href="/blog/">See all posts</a>
</section>
{% endif %}

<section id="projects" class="section">
  <h2>Projects</h2>
  <p class="section-intro">Five shipped products. Each has its own page.</p>
  {% include project-tiles.html %}

  <div class="earlier-work">
    <h3>Earlier work</h3>
    <ul>
      <li>
        <a href="https://github.com/3M1RY33T/E-CommerceWebsite" target="_blank" rel="noopener noreferrer">E-Commerce Website</a>
        <span class="earlier-work-year">Aug 2025</span>
        <span class="earlier-work-note">Full-stack retail site in Vue, Quasar, .NET and MSSQL.</span>
      </li>
      <li>
        <a href="https://github.com/3M1RY33T/TextRoom" target="_blank" rel="noopener noreferrer">TextRoom</a>
        <span class="earlier-work-year">Feb 2025</span>
        <span class="earlier-work-note">React and Express chatroom over Socket.IO.</span>
      </li>
      <li>
        <a href="https://github.com/3M1RY33T/PandemicModeller" target="_blank" rel="noopener noreferrer">Pandemic Modeller</a>
        <span class="earlier-work-year">Sep 2024</span>
        <span class="earlier-work-note">Simulation with tunable population, infection rate and immunity.</span>
      </li>
    </ul>
  </div>
</section>

<section id="skills" class="section">
  <h2>Tech Stack</h2>
  <input class="skills-toggle" type="checkbox" id="skills-toggle" aria-label="Toggle full skills list">
  <div class="skills-grid">
    <div>
      <img class="icon" src="/assets/svg/python.svg" width="100" height="100">
      <h3 class="skill-header">Python</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/js.svg" width="100" height="100">
      <h3 class="skill-header">JavaScript</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/typescript.svg" width="100" height="100">
      <h3 class="skill-header">TypeScript</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/java.svg" width="100" height="100">
      <h3 class="skill-header">Java</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/c.svg" width="100" height="100">
      <h3 class="skill-header">C/C++</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/csharp.svg" width="100" height="100">
      <h3 class="skill-header">C#</h3>
    </div>
    <div>
      <img class="cropped-icon" src="/assets/svg/go.svg" width="100" height="100">
      <h3 class="skill-header">Go</h3>
    </div>
    <div>
      <img class="cropped-icon" src="/assets/svg/kotlin.svg" width="180" height="100">
      <h3 class="skill-header">Kotlin</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/flutter.svg" width="100" height="100">
      <h3 class="skill-header">Flutter</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/react-native.svg" width="100" height="100">
      <h3 class="skill-header">React Native</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/android-studio.svg" width="100" height="100">
      <h3 class="skill-header">Android Studio</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/firebase.svg" width="100" height="100">
      <h3 class="skill-header">Firebase</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/react.svg" width="100" height="100">
      <h3 class="skill-header">React</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/angular.svg" width="100" height="100">
      <h3 class="skill-header">Angular</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/vue.svg" width="100" height="100">
      <h3 class="skill-header">Vue</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/dotnet.svg" width="100" height="100">
      <h3 class="skill-header">.Net</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/git.svg" width="100" height="100">
      <h3 class="skill-header">Git</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/postgre.svg" width="100" height="100">
      <h3 class="skill-header">PostgreSQL</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/mysql.svg" width="100" height="100">
      <h3 class="skill-header">MySQL</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/mssql.svg" width="100" height="100">
      <h3 class="skill-header">Microsoft SQL Server</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/mongo.svg" width="100" height="100">
      <h3 class="skill-header">MongoDB</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/docker.svg" width="100" height="100">
      <h3 class="skill-header">Docker</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/aws.svg" width="100" height="100">
      <h3 class="skill-header">AWS</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/cloudflare.svg" width="100" height="100">
      <h3 class="skill-header">Cloudflare</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/shopify.svg" width="100" height="100">
      <h3 class="skill-header">Shopify</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/microsoft.svg" width="100" height="100">
      <h3 class="skill-header">Windows</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/apple.svg" width="100" height="100">
      <h3 class="skill-header">MacOS</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/linux.svg" width="100" height="100">
      <h3 class="skill-header">Linux</h3>
    </div>
  </div>
  <label class="skills-toggle-control" for="skills-toggle">
    <span class="skills-toggle-more">Show more skills</span>
    <span class="skills-toggle-less">Show fewer skills</span>
  </label>
</section>

<section id="contact" class="section contact-section">
  <div class="contact-grid">
    <div class="contact-copy">
      <h2>Contact</h2>
      <p>If you would like to connect, collaborate on a project, or have any questions at all, send a message directly and I’ll respond as soon as I can.</p>
      <div class="contact-links-layout">
        <div class="contact-timezone">
          <h3><span class="accent">My</span> Timezone:</h3>
          <div class="contact-time" aria-label="Current time in Toronto, Ontario">
            <time class="lockscreen-clock" datetime="">
              <span data-toronto-time>--:--</span>
              <span class="clock-period" data-toronto-period></span>
            </time>
            <span data-toronto-date>Toronto, ON</span>
          </div>
        </div>
        <ul class="contact-details">
          <li>
            <a href="mailto:yigitgl@gmail.com">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 3.2v8.8h16V8.2l-7.4 5.3a1 1 0 0 1-1.2 0L4 8.2Zm1.2-1.2 6.8 4.9L18.8 7H5.2Z"/>
              </svg>
              <span>
                <strong>Email</strong>
                yigitgl@gmail.com
              </span>
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/yigitt-yildizz" target="_blank" rel="noopener noreferrer">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M6.94 8.98H3.72V20h3.22V8.98ZM5.33 4a1.87 1.87 0 1 0 0 3.74 1.87 1.87 0 0 0 0-3.74Zm5.37 4.98H7.62V20h3.22v-5.46c0-1.44.27-2.83 2.05-2.83 1.76 0 1.78 1.64 1.78 2.92V20h3.22v-6.05c0-2.97-.64-5.25-4.11-5.25-1.67 0-2.79.91-3.25 1.78h-.04l.01-1.5Z"/>
              </svg>
              <span>
                <strong>LinkedIn</strong>
                linkedin.com/in/yigitt-yildizz
              </span>
            </a>
          </li>
          <li>
            <a href="https://github.com/3M1RY33T" target="_blank" rel="noopener noreferrer">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.38-3.9-1.38-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.28-5.27-5.72 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.2 1.19A11.1 11.1 0 0 1 12 6.05c.97 0 1.94.13 2.85.39 2.22-1.5 3.2-1.19 3.2-1.19.63 1.6.23 2.78.11 3.07.75.81 1.2 1.85 1.2 3.11 0 4.45-2.7 5.43-5.28 5.72.42.36.78 1.07.78 2.16v3.03c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z"/>
              </svg>
              <span>
                <strong>GitHub</strong>
                github.com/3M1RY33T
              </span>
            </a>
          </li>
          <li>
            <a href="https://discord.com/users/4m1ry33t" target="_blank" rel="noopener noreferrer">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M19.54 5.34A16.9 16.9 0 0 0 15.35 4l-.2.4c-.15.3-.29.6-.4.9a15.9 15.9 0 0 0-5.5 0 8.8 8.8 0 0 0-.61-1.3 16.9 16.9 0 0 0-4.2 1.34C1.78 9.3 1.06 13.15 1.42 16.94A16.8 16.8 0 0 0 6.56 19.5c.42-.57.78-1.18 1.1-1.83-.6-.22-1.16-.5-1.7-.83l.42-.32c3.27 1.5 6.82 1.5 10.05 0l.42.32c-.54.33-1.1.61-1.7.83.32.65.69 1.26 1.1 1.83a16.8 16.8 0 0 0 5.14-2.56c.43-4.4-.74-8.2-1.85-11.6ZM8.35 14.55c-1 0-1.82-.91-1.82-2.03 0-1.12.8-2.03 1.82-2.03 1.02 0 1.84.92 1.82 2.03 0 1.12-.8 2.03-1.82 2.03Zm7.3 0c-1 0-1.82-.91-1.82-2.03 0-1.12.8-2.03 1.82-2.03 1.02 0 1.84.92 1.82 2.03 0 1.12-.8 2.03-1.82 2.03Z"/>
              </svg>
              <span>
                <strong>Discord</strong>
                4m1ry33t
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>
    <form class="contact-form" action="https://formsubmit.co/yigitgl@gmail.com" method="POST" data-contact-form>
      <input type="hidden" name="_subject" value="New portfolio message">
      <input type="hidden" name="_captcha" value="false">
      <input type="hidden" name="_template" value="table">
      <input type="text" name="_honey" class="form-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label>
        Name
        <input type="text" name="name" required placeholder="Your name">
      </label>
      <label>
        Email
        <input type="email" name="email" required placeholder="you@example.com">
      </label>
      <label>
        Message
        <textarea name="message" rows="6" required placeholder="Tell me about your project or question"></textarea>
      </label>
      <button class="button" type="submit">Send message</button>
      <p class="form-status" data-contact-status role="status"></p>
      <p class="form-note">This form submits securely to my email via FormSubmit.co. Please verify the email if prompted after your first message.</p>
    </form>
  </div>
</section>
