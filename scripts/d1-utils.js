import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);

export function getDatabaseName() {
  if (process.env.D1_DATABASE_NAME) return process.env.D1_DATABASE_NAME;

  const wranglerPath = new URL("wrangler.toml", root);
  const config = readFileSync(wranglerPath, "utf8");
  const match = config.match(/^\s*database_name\s*=\s*"([^"]+)"/m);

  if (!match) {
    throw new Error("Could not find database_name in wrangler.toml. Set D1_DATABASE_NAME instead.");
  }

  return match[1];
}

export function runD1(databaseName, sql) {
  const stdout = execFileSync(
    "wrangler",
    ["d1", "execute", databaseName, "--remote", "--json", "--command", sql],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const payload = parseWranglerJson(stdout);
  if (payload?.error) {
    throw new Error(payload.error.text || "Wrangler returned an error.");
  }

  return payload;
}

export function resultsFor(databaseName, sql) {
  const payload = runD1(databaseName, sql);
  return payload?.[0]?.results || [];
}

function parseWranglerJson(stdout) {
  const text = String(stdout || "").trim();
  const jsonStart = Math.min(
    ...[text.indexOf("["), text.indexOf("{")].filter((index) => index >= 0),
  );

  if (!Number.isFinite(jsonStart)) {
    throw new Error(`Wrangler did not return JSON: ${text}`);
  }

  return JSON.parse(text.slice(jsonStart));
}
