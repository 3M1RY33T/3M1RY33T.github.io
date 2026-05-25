#!/usr/bin/env ruby

require "json"
require "open3"

ROOT = File.expand_path("..", __dir__)
WRANGLER_FILE = File.join(ROOT, "wrangler.toml")
DEFAULT_LIMIT = 25

def usage
  puts <<~TEXT
    Usage:
      ./comments pending
      ./comments approved
      ./comments rejected
      ./comments all
      ./comments show ID
      ./comments approve ID
      ./comments reject ID

    Notes:
      - Uses the remote D1 database from wrangler.toml.
      - Run as "comments" if the repository root is on your PATH.
      - New comments are pending until approved.
  TEXT
end

def database_name
  return ENV["D1_DATABASE_NAME"] if ENV["D1_DATABASE_NAME"] && !ENV["D1_DATABASE_NAME"].empty?

  unless File.file?(WRANGLER_FILE)
    abort("Missing wrangler.toml. Set D1_DATABASE_NAME or run this from the repository root.")
  end

  config = File.read(WRANGLER_FILE)
  match = config.match(/^\s*database_name\s*=\s*"([^"]+)"/)
  abort("Could not find database_name in wrangler.toml.") unless match

  match[1]
end

def comment_id(value)
  id = Integer(value || "", exception: false)
  abort("Comment ID must be a positive integer.") unless id&.positive?
  id
end

def run_sql(sql)
  stdout, stderr, status = Open3.capture3(
    "wrangler",
    "d1",
    "execute",
    database_name,
    "--remote",
    "--json",
    "--command",
    sql,
    chdir: ROOT,
  )

  unless status.success?
    warn(stderr)
    abort("Wrangler command failed.")
  end

  JSON.parse(stdout)
rescue Errno::ENOENT
  abort("Could not find wrangler. Install it or run through your package manager.")
rescue JSON::ParserError
  warn(stdout)
  warn(stderr)
  abort("Could not parse Wrangler JSON output.")
end

def results_for(sql)
  payload = run_sql(sql)
  payload.fetch(0, {}).fetch("results", [])
end

def truncate(value, length)
  text = String(value || "").gsub(/\s+/, " ").strip
  text.length > length ? "#{text[0...(length - 3)]}..." : text
end

def print_rows(rows)
  if rows.empty?
    puts "No comments found."
    return
  end

  widths = {
    "id" => 4,
    "status" => 8,
    "created_at" => 19,
    "author_name" => 18,
    "path" => 36,
    "content" => 52,
  }

  puts widths.keys.map { |key| key.ljust(widths[key]) }.join("  ")
  puts widths.values.map { |width| "-" * width }.join("  ")

  rows.each do |row|
    puts [
      String(row["id"]).ljust(widths["id"]),
      truncate(row["status"], widths["status"]).ljust(widths["status"]),
      truncate(row["created_at"], widths["created_at"]).ljust(widths["created_at"]),
      truncate(row["author_name"], widths["author_name"]).ljust(widths["author_name"]),
      truncate(row["path"], widths["path"]).ljust(widths["path"]),
      truncate(row["content"], widths["content"]).ljust(widths["content"]),
    ].join("  ")
  end
end

def list_comments(status)
  where = status == "all" ? "" : "WHERE status = '#{status}'"
  results_for(<<~SQL)
    SELECT id, path, author_name, content, status, created_at
    FROM post_comments
    #{where}
    ORDER BY created_at DESC
    LIMIT #{DEFAULT_LIMIT}
  SQL
end

def show_comment(id)
  rows = results_for(<<~SQL)
    SELECT id, path, page_url, page_title, author_name, author_email, content, status, created_at, updated_at
    FROM post_comments
    WHERE id = #{id}
    LIMIT 1
  SQL

  if rows.empty?
    puts "No comment found for ID #{id}."
    return
  end

  comment = rows.first
  puts "ID: #{comment["id"]}"
  puts "Status: #{comment["status"]}"
  puts "Author: #{comment["author_name"]}"
  puts "Email: #{comment["author_email"] || "(none)"}"
  puts "Path: #{comment["path"]}"
  puts "Page: #{comment["page_title"]}"
  puts "URL: #{comment["page_url"]}"
  puts "Created: #{comment["created_at"]}"
  puts "Updated: #{comment["updated_at"]}"
  puts
  puts comment["content"]
end

def set_status(id, status)
  run_sql(<<~SQL)
    UPDATE post_comments
    SET status = '#{status}', updated_at = CURRENT_TIMESTAMP
    WHERE id = #{id}
  SQL

  puts "#{status.capitalize} comment ##{id}."
end

command = ARGV[0] || "pending"

case command
when "pending", "list", "ls"
  print_rows(list_comments("pending"))
when "approved"
  print_rows(list_comments("approved"))
when "rejected"
  print_rows(list_comments("rejected"))
when "all"
  print_rows(list_comments("all"))
when "show"
  show_comment(comment_id(ARGV[1]))
when "approve"
  set_status(comment_id(ARGV[1]), "approved")
when "reject"
  set_status(comment_id(ARGV[1]), "rejected")
when "help", "-h", "--help"
  usage
else
  usage
  abort("Unknown command: #{command}")
end
