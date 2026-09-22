#!/usr/bin/env ruby
# Fetches public GitHub activity for the hero panel and writes
# _data/activity.json. Runs in CI before every build (the site already
# rebuilds on a 6-hour cron, which becomes the refresh cadence) and by hand
# locally.
#
# This must never fail a build: every fetch is rescued, and on any failure
# the previously committed activity.json is left exactly as it is. Stale
# beats absent, and absent beats broken.

require "net/http"
require "uri"
require "json"
require "time"

USER = "3M1RY33T"
ROOT = File.expand_path("..", __dir__)
OUT = File.join(ROOT, "_data", "activity.json")

def get(url)
  uri = URI(url)
  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 20) do |http|
    req = Net::HTTP::Get.new(uri)
    req["User-Agent"] = "yigityildiz.dev-build"
    req["Accept"] = "text/html, application/json"
    http.request(req)
  end
  return nil unless res.is_a?(Net::HTTPSuccess)
  res.body
end

# --- contribution calendar -------------------------------------------------
# github.com/users/<u>/contributions is the HTML fragment the profile page
# itself loads. Unauthenticated, public data only. Markup can change, hence
# the keep-last-good rule above.
def fetch_calendar
  html = get("https://github.com/users/#{USER}/contributions")
  return nil unless html

  days = html.scan(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/)
             .map { |date, level| { "date" => date, "level" => level.to_i } }
  # Older/newer markup orders attributes differently; try the reverse order too.
  if days.empty?
    days = html.scan(/data-level="(\d)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/)
               .map { |level, date| { "date" => date, "level" => level.to_i } }
  end
  return nil if days.length < 300

  days.sort_by! { |d| d["date"] }

  total = nil
  if (m = html.match(/([\d,]+)\s+contributions?\s+in the last year/))
    total = m[1].delete(",").to_i
  end

  # Group into Sunday-to-Saturday weeks, matching GitHub's columns.
  weeks = []
  days.each do |day|
    wday = Date.parse(day["date"]).wday
    weeks << [] if weeks.empty? || wday == 0
    weeks.last << day
  end

  streak = 0
  days.reverse_each.with_index do |day, i|
    if day["level"] > 0
      streak += 1
    else
      break unless i.zero? # today at zero does not break a streak
    end
  end

  formatted = total&.to_s&.gsub(/(\d)(?=(\d{3})+\z)/, '\\1,')
  { "weeks" => weeks, "total_last_year" => total, "total_formatted" => formatted, "streak" => streak }
rescue StandardError
  nil
end

# --- recent public events ---------------------------------------------------
def fetch_events
  body = get("https://api.github.com/users/#{USER}/events/public?per_page=60")
  return nil unless body

  rows = []
  JSON.parse(body).each do |ev|
    repo = ev.dig("repo", "name").to_s.sub("#{USER}/", "")
    date = ev["created_at"]
    entry =
      case ev["type"]
      when "PushEvent"
        n = ev.dig("payload", "commits")&.length.to_i
        next if n.zero? # a tag push carries no commits and reads as noise
        { "verb" => "pushed", "detail" => "#{n} commit#{n == 1 ? "" : "s"} to #{repo}" }
      when "ReleaseEvent"
        tag = ev.dig("payload", "release", "tag_name")
        { "verb" => "released", "detail" => "#{repo} #{tag}" }
      when "PublicEvent"
        { "verb" => "open-sourced", "detail" => repo }
      when "CreateEvent"
        next unless ev.dig("payload", "ref_type") == "repository"
        { "verb" => "created", "detail" => repo }
      else
        next
      end
    next if rows.any? { |r| r["detail"] == entry["detail"] }
    rows << entry.merge("date" => date)
    break if rows.length == 4
  end
  rows.empty? ? nil : rows
rescue StandardError
  nil
end

calendar = fetch_calendar
events = fetch_events

if calendar.nil? && events.nil?
  warn "fetch_activity: nothing fetched, keeping existing #{File.basename(OUT)}"
  exit 0
end

existing = File.file?(OUT) ? (JSON.parse(File.read(OUT)) rescue {}) : {}
data = existing.merge(calendar || {})
data["events"] = events if events
data["fetched_at"] = Time.now.utc.iso8601

File.write(OUT, JSON.pretty_generate(data))
parts = []
parts << "#{data["weeks"]&.length} weeks, #{data["total_last_year"]} contributions" if calendar
parts << "#{data["events"]&.length} events" if events
puts "fetch_activity: wrote #{parts.join(", ")}"
