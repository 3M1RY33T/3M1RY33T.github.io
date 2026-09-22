#!/usr/bin/env ruby
# Asserts on _site after a build. Exits non-zero and prints every failure.
# Each implementation task adds its assertions here before implementing.

ROOT = File.expand_path("..", __dir__)
SITE = File.join(ROOT, "_site")

$failures = []

def fail!(message)
  $failures << message
end

def page(path)
  full = File.join(SITE, path)
  return nil unless File.file?(full)
  File.read(full)
end

def must_render(path)
  html = page(path)
  return fail!("missing page: #{path}") if html.nil?
  if html.include?("{{") || html.include?("{%")
    fail!("unrendered Liquid in #{path}")
  end
  html
end

def must_contain(path, needle)
  html = page(path)
  return fail!("missing page: #{path}") if html.nil?
  fail!("#{path} does not contain #{needle.inspect}") unless html.include?(needle)
end

# Every local asset referenced by a page must exist on disk.
def must_have_assets(path)
  html = page(path)
  return fail!("missing page: #{path}") if html.nil?
  html.scan(/(?:src|href)="(\/[^"]+\.(?:png|jpg|jpeg|svg|pdf|css|js))"/).flatten.uniq.each do |asset|
    target = File.join(SITE, asset)
    fail!("#{path} references missing asset #{asset}") unless File.file?(target)
  end
end

# --- baseline: the site as it exists today -------------------------------
must_render("index.html")
must_render("blog/index.html")
must_have_assets("index.html")

# --- Task 2: no CSS custom property is referenced but never declared -----
# A typo like var(--acent) is not a CSS error: it resolves to nothing and the
# property silently falls back. This is the one failure mode the tokenization
# introduced, so it is checked on every build from here on.
css_path = File.join(SITE, "assets/css/style.css")
if File.file?(css_path)
  css = File.read(css_path)
  declared = css.scan(/(--[a-z0-9-]+)\s*:/).flatten.uniq
  used = css.scan(/var\((--[a-z0-9-]+)\)/).flatten.uniq
  (used - declared).each { |t| fail!("style.css uses undeclared token #{t}") }
else
  fail!("missing stylesheet: assets/css/style.css")
end

# --- Task 3: the collection renders --------------------------------------
must_render("projects/loci/index.html")
must_contain("projects/loci/index.html", "Scoped memory for coding agents")
must_have_assets("projects/loci/index.html")

# --- Task 4: every band renders from loci's data -------------------------
must_contain("projects/loci/index.html", "400 passed, 14 skipped in 37s")
must_contain("projects/loci/index.html", "Measured from the repository on 22 September 2026")
must_contain("projects/loci/index.html", "An agent that remembers everything")
must_contain("projects/loci/index.html", "Routes before it searches")
must_contain("projects/loci/index.html", "project-terminal")
must_contain("projects/loci/index.html", "pip install loci-mem")
must_contain("projects/loci/index.html", "Built with")

# --- Task 5: Delroy ------------------------------------------------------
must_render("projects/delroy/index.html")
must_contain("projects/delroy/index.html", "7,503 collected across 9 tiers")
must_have_assets("projects/delroy/index.html")

# --- Task 6: urthreads ---------------------------------------------------
must_render("projects/urthreads/index.html")
must_contain("projects/urthreads/index.html", "229 passed in 444ms")
must_have_assets("projects/urthreads/index.html")

# --- Task 7: Tensor ------------------------------------------------------
must_render("projects/tensor-serve/index.html")
must_contain("projects/tensor-serve/index.html", "152 passed, 17 skipped in 13s")
must_have_assets("projects/tensor-serve/index.html")

# --- Task 8: Brewery, product half only ----------------------------------
must_render("projects/brewery/index.html")
must_contain("projects/brewery/index.html", "what breaks if this goes")
must_have_assets("projects/brewery/index.html")
# The engineering half is deliberately absent until it is written.
brewery = page("projects/brewery/index.html")
fail!("brewery unexpectedly has a writeup section") if brewery && brewery.include?("project-writeup")

if $failures.empty?
  puts "verify_build: OK"
  exit 0
else
  warn "verify_build: #{$failures.size} failure(s)"
  $failures.each { |f| warn "  - #{f}" }
  exit 1
end
