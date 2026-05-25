#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { getDatabaseName, resultsFor } from "./d1-utils.js";

const databaseName = getDatabaseName();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = new URL("../backups/", import.meta.url);
const backupPath = new URL(`d1-${databaseName}-${timestamp}.json`, backupDir);

mkdirSync(backupDir, { recursive: true });

const tables = resultsFor(databaseName, `
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
    AND name NOT LIKE '_cf_%'
  ORDER BY name
`).map((row) => row.name);

const data = {
  databaseName,
  createdAt: new Date().toISOString(),
  tables: {},
};

for (const table of tables) {
  data.tables[table] = resultsFor(databaseName, `SELECT * FROM ${table}`);
}

writeFileSync(backupPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(`Backed up ${tables.length} table(s) from ${databaseName} to ${backupPath.pathname}`);
