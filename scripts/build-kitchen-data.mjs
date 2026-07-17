#!/usr/bin/env node
// essences/ phrases/ creations/ から厨房UI（kitchen/index.html）用のデータを生成する。
// 出力: kitchen/kitchen-data.js（window.PISTACHIO_KITCHEN_DATA。file:// でも動くように JS 形式）

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walk, loadYamlOrFrontmatter, extractH2Sections } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const KITCHEN_DIR = path.join(ROOT, "kitchen");

function loadAll(dir, exts) {
  return walk(path.join(ROOT, dir), exts)
    .map((file) => ({ file, ...loadYamlOrFrontmatter(file) }))
    .filter((x) => x.data);
}

function main() {
  mkdirSync(KITCHEN_DIR, { recursive: true });

  const essences = loadAll("essences", [".md"]).map(({ data, body }) => {
    const sections = extractH2Sections(body);
    return {
      id: data.id,
      name_ja: data.name_ja,
      name_original: data.name_original || "",
      category: data.category,
      culture_ja: data.culture_ja,
      summary_ja: data.summary_ja,
      metaphor_potential_ja: data.metaphor_potential_ja,
      tags: data.tags || [],
      usage_hint: (sections["創作での使いどころ"] || "").slice(0, 200),
      source_urls: (data.sources || []).map((s) => s.url),
      created: data.created,
    };
  });

  const phrases = loadAll("phrases", [".md"]).map(({ data }) => ({
    id: data.id,
    phrase_original: data.phrase_original,
    language_name_ja: data.language_name_ja || data.language,
    gloss_ja: data.gloss_ja,
    literal_translation_ja: data.literal_translation_ja,
    metaphor_tags: data.metaphor_tags || [],
    kiza_elements: data.kiza_elements || [],
  }));

  const creations = loadAll("creations", [".md"]).map(({ data }) => ({
    id: data.id,
    text_original: data.text_original,
    translation_ja: data.translation_ja || "",
    language_name_ja: data.language_name_ja || data.language,
    situation: data.situation,
    recipe: data.recipe,
    created_by: data.created_by || [],
    created: data.created,
  }));

  const data = { essences, phrases, creations };
  writeFileSync(
    path.join(KITCHEN_DIR, "kitchen-data.js"),
    `// npm run build:kitchen で自動生成。手で編集しない。\nwindow.PISTACHIO_KITCHEN_DATA = ${JSON.stringify(data, null, 2)};\n`
  );
  console.log(
    `厨房データを再生成しました（素材:${essences.length} フレーズ:${phrases.length} 創作:${creations.length}）`
  );
}

main();
