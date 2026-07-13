#!/usr/bin/env node
// phrases/ leads/ field-notes/ data/frontier.yml から indexes/*.md を再生成する。
// 生成物だがコミットする（GitHub上で旅の地図として常に見えることが楽しさに直結するため）。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { walk, loadYamlOrFrontmatter } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INDEXES_DIR = path.join(ROOT, "indexes");

function loadPhrases() {
  return walk(path.join(ROOT, "phrases"), [".md"])
    .map((file) => ({ file, ...loadYamlOrFrontmatter(file) }))
    .filter((p) => p.data);
}

function loadLeads() {
  return walk(path.join(ROOT, "leads"), [".yml", ".yaml"])
    .map((file) => ({ file, ...loadYamlOrFrontmatter(file) }))
    .filter((l) => l.data);
}

function loadFieldNotes() {
  return walk(path.join(ROOT, "field-notes"), [".yml", ".yaml"])
    .map((file) => ({ file, ...loadYamlOrFrontmatter(file) }))
    .filter((f) => f.data);
}

function loadFrontier() {
  const p = path.join(ROOT, "data", "frontier.yml");
  if (!existsSync(p)) return { regions: [] };
  return YAML.parse(readFileSync(p, "utf8"));
}

function buildCoverage(phrases, frontier) {
  const byLang = new Map();
  for (const { data } of phrases) {
    if (!byLang.has(data.language)) byLang.set(data.language, []);
    byLang.get(data.language).push(data);
  }

  let totalLangs = 0;
  let coveredLangs = 0;
  const lines = [
    "# カバレッジダッシュボード",
    "",
    "`npm run dashboard` で自動生成。手で編集しない。",
    "",
  ];

  for (const region of frontier.regions || []) {
    lines.push(`## ${region.name_ja}`);
    lines.push("");
    lines.push("| 言語 | 収録数 | single_source | cross_checked | native_confirmed |");
    lines.push("|---|---|---|---|---|");
    for (const lang of region.languages) {
      totalLangs++;
      const entries = byLang.get(lang.code) || [];
      if (entries.length > 0) coveredLangs++;
      const counts = { single_source: 0, cross_checked: 0, native_confirmed: 0 };
      for (const e of entries) {
        const s = e.verification && e.verification.status;
        if (s in counts) counts[s]++;
      }
      const mark = entries.length > 0 ? `${entries.length}` : "0（未踏）";
      lines.push(
        `| ${lang.name_ja} (${lang.code}) | ${mark} | ${counts.single_source} | ${counts.cross_checked} | ${counts.native_confirmed} |`
      );
    }
    lines.push("");
  }

  // frontier に無い言語も拾う
  const frontierCodes = new Set(
    (frontier.regions || []).flatMap((r) => r.languages.map((l) => l.code))
  );
  const extra = [...byLang.keys()].filter((c) => !frontierCodes.has(c));
  if (extra.length > 0) {
    lines.push("## frontier.yml 未登録の言語（フロンティア外の収穫）");
    lines.push("");
    lines.push("| 言語コード | 収録数 |");
    lines.push("|---|---|");
    for (const code of extra) {
      lines.push(`| ${code} | ${byLang.get(code).length} |`);
    }
    lines.push("");
  }

  lines.unshift("");
  lines.unshift(
    `**カバー率: ${coveredLangs}/${totalLangs} 言語**（frontier.yml 基準） / 総フレーズ数: ${phrases.length}`
  );

  return lines.join("\n") + "\n";
}

function buildFrontierDoc(phrases, frontier) {
  const covered = new Set(phrases.map((p) => p.data.language));
  const lines = ["# 未踏領域", "", "`npm run dashboard` で自動生成。次の遠征先候補。", ""];
  for (const region of frontier.regions || []) {
    const untouched = region.languages.filter((l) => !covered.has(l.code));
    if (untouched.length === 0) continue;
    lines.push(`## ${region.name_ja}`);
    lines.push("");
    for (const lang of untouched) {
      lines.push(`- ${lang.name_ja} (${lang.code})`);
    }
    lines.push("");
  }
  if (lines.length === 4) lines.push("すべての frontier 言語が最低1件収録されています。frontier.yml に新しい言語を追加しましょう。");
  return lines.join("\n") + "\n";
}

function buildMetaphors(phrases) {
  const byTag = new Map();
  for (const { data } of phrases) {
    for (const tag of data.metaphor_tags || []) {
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(data);
    }
  }
  const lines = [
    "# 比喩パターン横断索引",
    "",
    "「トルコはピスタチオ、他の文化は何で褒める？」— 比喩タグで束ねた横断索引。`npm run dashboard` で自動生成。",
    "",
  ];
  const tags = [...byTag.keys()].sort();
  if (tags.length === 0) {
    lines.push("（まだ metaphor_tags が付いたエントリがありません）");
  }
  for (const tag of tags) {
    lines.push(`## ${tag}`);
    lines.push("");
    for (const d of byTag.get(tag)) {
      lines.push(`- **${d.phrase_original}**（${d.language_name_ja || d.language}, \`${d.id}\`） — ${d.gloss_ja}`);
    }
    lines.push("");
  }
  return lines.join("\n") + "\n";
}

function buildRumors(leads) {
  const lines = ["# 世界の噂", "", "`/scout` が発見した未開封・未確定のリード。`npm run dashboard` で自動生成。", ""];

  const fresh = leads.filter((l) => l.data.status === "fresh");
  const open = leads.filter((l) => l.data.status === "open");
  const collected = leads.filter((l) => l.data.status === "collected");
  const rejected = leads.filter((l) => l.data.status === "rejected");

  lines.push(`今日の光: ${fresh.length}件 / 残っている噂: ${open.length}件 / 開封済み: ${collected.length}件 / ガセだった噂: ${rejected.length}件`);
  lines.push("");

  if (fresh.length > 0) {
    lines.push("## 今日の光（fresh）");
    lines.push("");
    for (const { data } of fresh) {
      lines.push(`- \`${data.id}\` — ${data.teaser_ja}`);
    }
    lines.push("");
  }

  if (open.length > 0) {
    lines.push("## 残っている噂（open）");
    lines.push("");
    for (const { data } of open) {
      lines.push(`- \`${data.id}\`（${data.date}） — ${data.teaser_ja}`);
    }
    lines.push("");
  }

  if (rejected.length > 0) {
    lines.push("## ガセ噂の博物館（rejected）");
    lines.push("");
    for (const { data } of rejected) {
      lines.push(`- \`${data.id}\` — ${data.resolution && data.resolution.reason}`);
    }
    lines.push("");
  }

  return lines.join("\n") + "\n";
}

function main() {
  mkdirSync(INDEXES_DIR, { recursive: true });
  const phrases = loadPhrases();
  const leads = loadLeads();
  const frontier = loadFrontier();

  writeFileSync(path.join(INDEXES_DIR, "coverage.md"), buildCoverage(phrases, frontier));
  writeFileSync(path.join(INDEXES_DIR, "frontier.md"), buildFrontierDoc(phrases, frontier));
  writeFileSync(path.join(INDEXES_DIR, "metaphors.md"), buildMetaphors(phrases));
  writeFileSync(path.join(INDEXES_DIR, "rumors.md"), buildRumors(leads));

  console.log(
    `indexes/ を再生成しました（phrases:${phrases.length} leads:${leads.length} field-notes:${loadFieldNotes().length}）`
  );
}

main();
