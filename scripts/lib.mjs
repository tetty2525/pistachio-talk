// phrases/leads/field-notes 等の共通ファイル読み込みユーティリティ。
// validate.mjs / build-indexes.mjs / build-map-data.mjs から共有される。

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";

export function walk(dir, exts) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: null, body: "" };
  let data;
  try {
    data = YAML.parse(m[1]);
  } catch (e) {
    return { data: undefined, body: "", parseError: e.message };
  }
  return { data, body: m[2] || "" };
}

export function extractH2Sections(body) {
  const sections = {};
  const lines = body.split("\n");
  let current = null;
  let buf = [];
  const flush = () => {
    if (current !== null) sections[current] = buf.join("\n").trim();
  };
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      flush();
      current = m[1];
      buf = [];
    } else if (current !== null) {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

export function loadYamlOrFrontmatter(file) {
  const raw = readFileSync(file, "utf8");
  if (file.endsWith(".md")) {
    const { data, body, parseError } = parseFrontmatter(raw);
    return { data, body, parseError };
  }
  try {
    return { data: YAML.parse(raw), body: "" };
  } catch (e) {
    return { data: undefined, body: "", parseError: e.message };
  }
}
