#!/usr/bin/env ruby

require "fileutils"
require "tmpdir"

ROOT = File.expand_path("..", __dir__)
ENV_FILE = File.join(ROOT, ".env")
POSTS_DIR = File.join(ROOT, "_posts")
ASSET_PATH_PATTERN = %r{(?:https?://raw\.githubusercontent\.com/[^)\s"']+/)?/?(assets/[^)\s"']+)}

def load_dotenv(path)
  return unless File.file?(path)

  File.readlines(path, chomp: true).each do |line|
    line = line.strip
    next if line.empty? || line.start_with?("#")

    key, value = line.split("=", 2)
    next if key.nil? || value.nil?

    key = key.strip
    value = value.strip

    if (value.start_with?('"') && value.end_with?('"')) ||
       (value.start_with?("'") && value.end_with?("'"))
      value = value[1...-1]
    end

    ENV[key] = value unless ENV.key?(key)
  end
end

load_dotenv(ENV_FILE)

repository = ENV.fetch("BLOG_POSTS_REPOSITORY", "").strip
ref = ENV.fetch("BLOG_POSTS_REF", "main").strip
source_path = ENV.fetch("BLOG_POSTS_PATH", ".").strip

if repository.empty?
  puts "BLOG_POSTS_REPOSITORY is not set; using local _posts only."
  exit 0
end

unless repository.match?(%r{\A[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\z})
  abort "BLOG_POSTS_REPOSITORY must use owner/repo format."
end

ref = "main" if ref.empty?
source_path = "." if source_path.empty?

Dir.mktmpdir("external-blog-posts") do |tmpdir|
  clone_url = "https://github.com/#{repository}.git"
  clone_args = [
    "git",
    "clone",
    "--depth",
    "1",
    "--branch",
    ref,
    "--single-branch",
    clone_url,
    tmpdir
  ]

  unless system(*clone_args)
    abort "Unable to clone #{repository}@#{ref}."
  end

  source_dir = File.expand_path(source_path, tmpdir)
  unless source_dir.start_with?(tmpdir) && Dir.exist?(source_dir)
    abort "BLOG_POSTS_PATH does not exist in #{repository}: #{source_path}"
  end

  post_files = Dir.glob(File.join(source_dir, "**", "*")).select do |path|
    File.file?(path) &&
      [".md", ".markdown", ".html"].include?(File.extname(path).downcase) &&
      File.basename(path).match?(/\A\d{4}-\d{2}-\d{2}-.+\.(md|markdown|html)\z/i)
  end
  if post_files.empty?
    abort "No Jekyll post files found in #{repository}/#{source_path}."
  end

  FileUtils.mkdir_p(POSTS_DIR)

  post_files.each do |source_file|
    relative_path = source_file.delete_prefix("#{source_dir}/")
    relative_path = relative_path.delete_prefix("_posts/")
    destination_file = File.join(POSTS_DIR, relative_path)
    FileUtils.mkdir_p(File.dirname(destination_file))
    FileUtils.cp(source_file, destination_file)
  end

  asset_paths = post_files.flat_map do |source_file|
    File.read(source_file).scan(ASSET_PATH_PATTERN).flatten
  end.uniq.sort

  copied_assets = 0
  unchanged_assets = 0
  missing_assets = []

  asset_paths.each do |asset_path|
    source_file = File.expand_path(asset_path, tmpdir)
    destination_file = File.expand_path(asset_path, ROOT)

    if source_file.start_with?(tmpdir) &&
       destination_file.start_with?(ROOT) &&
       File.file?(source_file)
      if File.file?(destination_file) && FileUtils.compare_file(source_file, destination_file)
        unchanged_assets += 1
        next
      end

      FileUtils.mkdir_p(File.dirname(destination_file))
      FileUtils.cp(source_file, destination_file)
      copied_assets += 1
    else
      missing_assets << asset_path
    end
  end

  puts "Synced #{post_files.length} external blog post(s) from #{repository}@#{ref}/#{source_path}."
  puts "Synced #{copied_assets} referenced blog asset(s)." if copied_assets.positive?
  puts "Skipped #{unchanged_assets} unchanged referenced blog asset(s)." if unchanged_assets.positive?

  unless missing_assets.empty?
    warn "Missing #{missing_assets.length} referenced blog asset(s):"
    missing_assets.each { |asset_path| warn "- #{asset_path}" }
    abort "External blog posts reference assets that were not found in #{repository}."
  end
end
