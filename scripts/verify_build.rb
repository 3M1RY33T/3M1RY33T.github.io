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
css_path = File.join(SITE, "assets/css/site.css")
if File.file?(css_path)
  css = File.read(css_path)
  declared = css.scan(/(--[a-z0-9-]+)\s*:/).flatten.uniq
  used = css.scan(/var\((--[a-z0-9-]+)\)/).flatten.uniq
  (used - declared).each { |t| fail!("site.css uses undeclared token #{t}") }
else
  fail!("missing stylesheet: assets/css/site.css")
end

# --- Task 3: the collection renders --------------------------------------
must_render("projects/loci/index.html")
must_contain("projects/loci/index.html", "Scoped memory for coding agents")
must_have_assets("projects/loci/index.html")

# --- Task 4: every band renders from loci's data -------------------------
must_contain("projects/loci/index.html", "passed, 14 skipped, in 37.2s")
must_contain("projects/loci/index.html", "Measured from the repository on 22 September 2026")
must_contain("projects/loci/index.html", "An agent that remembers everything")
must_contain("projects/loci/index.html", "Routes before it searches")
must_contain("projects/loci/index.html", "project-terminal")
must_contain("projects/loci/index.html", "pip install loci-mem")
must_contain("projects/loci/index.html", "Built with")

# --- Task 5: Delroy ------------------------------------------------------
must_render("projects/delroy/index.html")
must_contain("projects/delroy/index.html", "collected across 9 tiers")
must_have_assets("projects/delroy/index.html")

# --- Task 6: urthreads ---------------------------------------------------
must_render("projects/urthreads/index.html")
must_contain("projects/urthreads/index.html", "passed in 444ms")
must_have_assets("projects/urthreads/index.html")

# --- Task 7: Tensor ------------------------------------------------------
must_render("projects/tensor-serve/index.html")
must_contain("projects/tensor-serve/index.html", "passed, 17 skipped, in 13.1s")
must_have_assets("projects/tensor-serve/index.html")

# --- Task 8: Brewery, product half only ----------------------------------
must_render("projects/brewery/index.html")
must_contain("projects/brewery/index.html", "what breaks if this goes")
must_have_assets("projects/brewery/index.html")
# The engineering half is deliberately absent until it is written.
brewery = page("projects/brewery/index.html")
fail!("brewery unexpectedly has a writeup section") if brewery && brewery.include?("project-writeup")

# --- Task 9: homepage, index, nav ----------------------------------------
must_render("projects/index.html")
home = page("index.html")
%w[loci delroy urthreads tensor-serve brewery].each do |slug|
  fail!("homepage does not link /projects/#{slug}/") unless home&.include?("/projects/#{slug}/")
  fail!("projects index does not link /projects/#{slug}/") unless page("projects/index.html")&.include?("/projects/#{slug}/")
end
fail!("nav still points at the #projects anchor") if home&.include?('href="/#projects"')
fail!("Earlier work block missing") unless home&.include?("Earlier work")
must_have_assets("projects/index.html")

# --- Task 10: whole-site invariants --------------------------------------

# No page may ship unrendered Liquid or an instruction comment.
Dir.glob(File.join(SITE, "**", "*.html")).each do |file|
  rel = file.sub(SITE + "/", "")
  html = File.read(file)
  fail!("unrendered Liquid in #{rel}") if html.include?("{%") || html.include?("{{")
  fail!("instruction comment shipped in #{rel}") if html =~ /<!--\s*(Adapt|From|TODO|TBD)/
end

# All five project pages must exist. Jekyll logs a YAML exception and still
# exits 0, silently dropping the document, so this is the only thing that
# catches a malformed front matter.
SLUGS = %w[loci delroy urthreads tensor-serve brewery].freeze
built = Dir.glob(File.join(SITE, "projects", "*", "index.html")).map { |f| File.basename(File.dirname(f)) }
(SLUGS - built).each { |s| fail!("project page never built: #{s}") }

SLUGS.each do |slug|
  html = page("projects/#{slug}/index.html")
  next if html.nil?
  fail!("#{slug} has metrics with no verified date") if html.include?("project-metrics") && !html.include?("Measured from the repository on")
  fail!("#{slug} page has no outbound rail") unless html.include?("project-rail")
end

# Em dashes and en dashes are not used on this site.
Dir.glob(File.join(SITE, "projects", "**", "*.html")).each do |file|
  html = File.read(file)
  rel = file.sub(SITE + "/", "")
  fail!("em or en dash in #{rel}") if html =~ /[\u2013\u2014]/
end

if $failures.empty?
  puts "verify_build: OK"
  exit 0
else
  warn "verify_build: #{$failures.size} failure(s)"
  $failures.each { |f| warn "  - #{f}" }
  exit 1
end
