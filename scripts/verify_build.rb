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

# --- Task 3 onward appends assertions below this line --------------------

if $failures.empty?
  puts "verify_build: OK"
  exit 0
else
  warn "verify_build: #{$failures.size} failure(s)"
  $failures.each { |f| warn "  - #{f}" }
  exit 1
end
