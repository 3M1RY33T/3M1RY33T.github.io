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
must_contain("index.html", "data-theme-toggle")
must_contain("index.html", "theme-icon-moon")
must_contain("index.html", "activity-graph")
must_contain("index.html", "contributions, last year")

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
  fail!("light theme block missing from site.css") unless css.include?('[data-theme="light"]')
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
must_contain("projects/tensor-serve/index.html", "168 passed, 1 skipped, in 10.6s")
must_have_assets("projects/tensor-serve/index.html")

# --- Task 8: Brewery, product half only ----------------------------------
must_render("projects/brewery/index.html")
must_contain("projects/brewery/index.html", "what breaks if this goes")
must_have_assets("projects/brewery/index.html")
# The engineering half is deliberately absent until it is written.
brewery = page("projects/brewery/index.html")
fail!("brewery unexpectedly has a writeup section") if brewery && brewery.include?("project-writeup")

# --- Task 9: homepage and nav ---------------------------------------------
# The /projects/ index was removed on request: the nav anchors to the
# homepage section, and only individual project pages have URLs.
home = page("index.html")
%w[loci delroy urthreads tensor-serve brewery].each do |slug|
  fail!("homepage does not link /projects/#{slug}/") unless home&.include?("/projects/#{slug}/")
end
fail!("nav does not point at the #projects anchor") unless home&.include?('href="/#projects"')
fail!("a page still links the removed /projects/ index") if Dir.glob(File.join(SITE, "**", "*.html")).any? { |f| File.read(f).include?('href="/projects/"') }
fail!("Earlier work block missing") unless home&.include?("Earlier work")

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


# --- tabbed sections and schematics ---------------------------------------
# A tab whose band list drops a band silently loses that content, and a
# diagram that ships without its ASCII fallback is blank without JS. Both
# failed exactly once during the rebuild, so both are checked here.
%w[assets/js/project-tabs.js assets/js/project-diagram.js].each do |asset|
  fail!("missing script: #{asset}") unless File.file?(File.join(SITE, asset))
end

TABBED = { "loci" => 4, "delroy" => 5, "urthreads" => 4, "tensor-serve" => 5, "brewery" => 3 }.freeze
TABBED.each do |slug, count|
  html = page("projects/#{slug}/index.html")
  next if html.nil?
  tabs = html.scan(/data-tab="/).size
  fail!("#{slug} has #{tabs} tabs, expected #{count}") unless tabs == count
  panels = html.scan(/class="project-panel"/).size
  fail!("#{slug} has #{panels} panels for #{tabs} tabs") unless panels == tabs
  fail!("#{slug} tab bar is not a tablist") unless html.include?('role="tablist"')
end

# Every schematic carries its data and a fallback drawing.
%w[loci delroy urthreads tensor-serve].each do |slug|
  html = page("projects/#{slug}/index.html")
  next if html.nil?
  fail!("#{slug} has no schematic data") unless html.include?("data-diagram-data")
  fail!("#{slug} schematic has no ascii fallback") unless html.include?("project-diagram-ascii")
end

# The install button points into a panel, so that id has to exist.
%w[loci tensor-serve urthreads].each do |slug|
  html = page("projects/#{slug}/index.html")
  next if html.nil?
  next unless html.include?('href="#quickstart"')
  fail!("#{slug} links #quickstart but never renders it") unless html.include?('id="quickstart"')
end

# Every stage of every schematic carries an in-depth description: the side
# panel is the point of the chart, and a stage with one line or none leaves
# it empty while the tour sits on that stage.
require "json"
%w[loci delroy urthreads tensor-serve].each do |slug|
  html = page("projects/#{slug}/index.html")
  next if html.nil?
  html.scan(%r{<script type="application/json" data-diagram-data>(.*?)</script>}m).each do |(raw)|
    data = JSON.parse(raw) rescue (fail!("#{slug} schematic data is not valid JSON"); next)
    Array(data["nodes"]).each do |n|
      paras = Array(n["detail"])
      words = paras.join(" ").split.size
      fail!("#{slug}/#{data["id"]}/#{n["id"]} description is #{words} words") if words < 60
      fail!("#{slug}/#{data["id"]}/#{n["id"]} has no facts") if Array(n["facts"]).empty?
    end
  end
end

# A screenshot with a light variant names both files in data attributes,
# which the asset check above does not read. A missing one would only show
# as a broken image after someone toggled the theme.
Dir.glob(File.join(SITE, "**", "*.html")).each do |file|
  File.read(file).scan(/data-src-(?:light|dark)="(\/[^"]+)"/).flatten.uniq.each do |asset|
    fail!("#{file.sub(SITE + "/", "")} names missing themed image #{asset}") unless File.file?(File.join(SITE, asset))
  end
end
brewery_themed = page("projects/brewery/index.html").to_s.scan(/data-src-light=/).size
fail!("brewery has #{brewery_themed} light screenshots, expected 4") unless brewery_themed == 4
brewery_post = page("2026/09/18/brewery-a-native-homebrew-client-that-shows-dependents.html").to_s
fail!("brewery post does not use the README's light and dark captures") unless brewery_post.scan(/data-src-light=/).size == 2

if $failures.empty?
  puts "verify_build: OK"
  exit 0
else
  warn "verify_build: #{$failures.size} failure(s)"
  $failures.each { |f| warn "  - #{f}" }
  exit 1
end
