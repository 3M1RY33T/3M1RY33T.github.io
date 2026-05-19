---
layout: default
title: "Home"
excerpt: "A personal portfolio and blog by Yigit (Emir) Yildiz."
---

<section class="hero">
  <div>
    <h1>About <span class="accent">Me</span></h1>
    <!-- <h1>Yigit <span class="accent">(Emir)</span> Yildiz</h1> -->
    <p class="eyebrow">Software Engineer · Full-stack · AI · Mobile</p>
    <p class="intro">I build full-stack web and mobile applications, AI-powered tools, and developer-focused services. My work combines Go, Vue.js, React, .NET, Flutter, PostgreSQL, and practical AI integrations.</p>
    <a class="hero-gravatar-compact" href="https://gravatar.com/pleasantwitchcd83be3d56" target="_blank" rel="noopener noreferrer" aria-label="View Yigit Yildiz on Gravatar">
      <img src="https://1.gravatar.com/avatar/acbc4f96261335fc2e541a294927b481a49ec1fa62bf3bf14fc2239b2ae7ac9d?s=160" alt="Yigit Yildiz">
      <span>
        <strong>Yigit Yildiz</strong>
        <span>Software Engineer · Toronto, Ontario</span>
      </span>
    </a>
    <div class="hero-links">
      <a class="button" href="#contact">Contact</a>
      <a class="button button-secondary" href="/blog/"><span class="accent">My</span>Blog</a>
    </div>
  </div>
  <!-- Custom Gravatar banner option:
  <a class="hero-gravatar-banner" href="https://gravatar.com/pleasantwitchcd83be3d56" target="_blank" rel="noopener noreferrer" aria-label="View Yigit Yildiz on Gravatar">
    <div class="hero-gravatar-profile">
      <img src="https://1.gravatar.com/avatar/acbc4f96261335fc2e541a294927b481a49ec1fa62bf3bf14fc2239b2ae7ac9d?s=220" alt="Yigit Yildiz">
      <div>
        <p class="hero-gravatar-name">Yigit Yildiz</p>
        <p>Software Engineer</p>
        <p>Toronto, Ontario, Canada</p>
      </div>
    </div>
  </a>
  -->
  <iframe class="hero-gravatar-card" src="https://gravatar.com/pleasantwitchcd83be3d56.card" title="Yigit Yildiz Gravatar profile card" width="415" height="228" loading="lazy"></iframe>
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
              {% unless trimmed_line == "" or first_char == "#" %}
                {% assign featured_content = featured_content | append: " " | append: trimmed_line %}
              {% endunless %}
            {% endfor %}
            <p>{{ featured_content | markdownify | strip_html | normalize_whitespace | truncate: 220 }}</p>
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
  <div class="card-grid">
    <article class="card project-card">
      <h3>TSRC</h3>
      <p class="meta">Coming Soon</p>
      <p>Tensor-powered code editor / browser. Fetch any website domain, build a local semantic database from it, and your AI will be fine-tuned for the specific skills you need.</p>
      <a class="project-card-link" target="_blank" rel="noopener noreferrer" aria-label="Soon on GitHub">
        <img src="/assets/svg/github.svg" alt="" aria-hidden="true">
        <span>Soon available on GitHub</span>
      </a>
    </article>
    <article class="card project-card">
      <h3>Tensor (Serve)</h3>
      <p class="meta">May 2026</p>
      <p>ZIM-based retrieval-augmented proxy for OpenAI-compatible AI models. Downloads ZIM documentation, builds a semantic vector database, and combines keyword + semantic search for more accurate AI responses.</p>
      <a class="project-card-link" href="https://github.com/3M1RY33T/tensor-serve" target="_blank" rel="noopener noreferrer" aria-label="View Tensor Serve on GitHub">
        <img src="/assets/svg/github.svg" alt="" aria-hidden="true">
        <span>View Project on GitHub</span>
      </a>
    </article>
    <article class="card project-card">
      <h3>E-Commerce Website</h3>
      <p class="meta">Aug 2025</p>
      <p>Full-stack retail site built with Vue, Quasar, .NET, C#, and MSSQL. Includes signup/login, order processing, and inventory tracking using the MVC pattern.</p>
      <a class="project-card-link" href="https://github.com/3M1RY33T/E-CommerceWebsite" target="_blank" rel="noopener noreferrer" aria-label="View E-Commerce Website on GitHub">
        <img src="/assets/svg/github.svg" alt="" aria-hidden="true">
        <span>View Project on GitHub</span>
      </a>
    </article>
    <article class="card project-card">
      <h3>TextRoom</h3>
      <p class="meta">Feb 2025</p>
      <p>React + Express chatroom application with Socket.IO for real-time messaging, typing indicators, and group collaboration.</p>
      <a class="project-card-link" href="https://github.com/3M1RY33T/TextRoom" target="_blank" rel="noopener noreferrer" aria-label="View TextRoom on GitHub">
        <img src="/assets/svg/github.svg" alt="" aria-hidden="true">
        <span>View Project on GitHub</span>
      </a>
    </article>
        <article class="card project-card">
      <h3>Pandemic Modeller</h3>
      <p class="meta">Sep 2024</p>
      <p>The pandemic modeler project presents the interface to the user in order the handle simulation parameters, such as: population size, infection rate, recovery time,immunity levels (1 to 5), simulation speed.</p>
      <a class="project-card-link" href="https://github.com/3M1RY33T/PandemicModeller" target="_blank" rel="noopener noreferrer" aria-label="View Pandemic Modeller on GitHub">
        <img src="/assets/svg/github.svg" alt="" aria-hidden="true">
        <span>View Project on GitHub</span>
      </a>
    </article>
  </div>
</section>

<section id="skills" class="section">
  <h2>Tech Stack</h2>
  <input class="skills-toggle" type="checkbox" id="skills-toggle" aria-label="Toggle full skills list">
  <div class="skills-grid">
    <div>
      <img class="icon" src="/assets/svg/flutter.svg" width="100" height="100"> 
      <h3 class="skill-header">Flutter</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/android-studio.svg" width="100" height="100"> 
      <h3 class="skill-header">Android Studio</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/react-native.svg" width="100" height="100"> 
      <h3 class="skill-header">React Native</h3>
    </div>
    <div>
      <img class="cropped-icon" src="/assets/svg/go.svg" width="100" height="100"> 
      <h3 class="skill-header">Go</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/c.svg" width="100" height="100"> 
      <h3 class="skill-header">C/C++</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/python.svg" width="100" height="100"> 
      <h3 class="skill-header">Python</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/java.svg" width="100" height="100"> 
      <h3 class="skill-header">Java</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/js.svg" width="100" height="100"> 
      <h3 class="skill-header">JavaScript</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/vue.svg" width="100" height="100"> 
      <h3 class="skill-header">Vue</h3>
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
      <img class="icon" src="/assets/svg/typescript.svg" width="100" height="100"> 
      <h3 class="skill-header">TypeScript</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/dotnet.svg" width="100" height="100"> 
      <h3 class="skill-header">.Net</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/postgre.svg" width="100" height="100"> 
      <h3 class="skill-header">PostgreSQL</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/mssql.svg" width="100" height="100"> 
      <h3 class="skill-header">Microsoft SQL Server</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/mysql.svg" width="100" height="100"> 
      <h3 class="skill-header">MySQL</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/mongo.svg" width="100" height="100"> 
      <h3 class="skill-header">MongoDB</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/firebase.svg" width="100" height="100"> 
      <h3 class="skill-header">Firebase</h3>
    </div>
    <div>
      <img class="icon" src="/assets/svg/git.svg" width="100" height="100"> 
      <h3 class="skill-header">Git</h3>
    </div>
    <!-- <div>
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
    </div> -->
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
