#!/usr/bin/env ruby

require "erb"
require "json"

ROOT = File.expand_path("..", __dir__)
ENV_FILE = File.join(ROOT, ".env")
TEMPLATE_FILE = File.join(ROOT, "_config.template.yml")
OUTPUT_FILE = File.expand_path(ARGV[0] || "_config.local.yml", ROOT)

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

def q(name, default = "")
  ENV.fetch(name, default).to_json
end

load_dotenv(ENV_FILE)

template = File.read(TEMPLATE_FILE)
rendered = ERB.new(template, trim_mode: "-").result(binding)

File.write(OUTPUT_FILE, rendered)
puts "Rendered #{File.basename(OUTPUT_FILE)} from _config.template.yml"
