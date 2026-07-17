#!/usr/bin/env node
// 憲法(CONSTITUTION.md)の機械執行装置。
// 通常実行: node scripts/validate.mjs  → カレントディレクトリ（リポジトリルート）を検証
// 自己テスト: node scripts/validate.mjs --self-test → fixtures/{valid,invalid} で検証ロジック自体を検証

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { walk, extractH2Sections, loadYamlOrFrontmatter } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.join(__dirname, "..", "schema");

const REQUIRED_COVERS = ["phrase", "meaning", "usage"];
const T1_T3_TYPES = ["dictionary_academic", "language_media", "native_personal"];
const STAGE_SECTIONS = {
  2: ["語源", "文化・歴史背景"],
};

function loadSchema(name) {
  return JSON.parse(readFileSync(path.join(SCHEMA_DIR, `${name}.schema.json`), "utf8"));
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validators = {
  phrase: ajv.compile(loadSchema("phrase")),
  lead: ajv.compile(loadSchema("lead")),
  inbox: ajv.compile(loadSchema("inbox")),
  fieldNote: ajv.compile(loadSchema("field-note")),
  contributors: ajv.compile(loadSchema("contributors")),
  essence: ajv.compile(loadSchema("essence")),
  creation: ajv.compile(loadSchema("creation")),
};

function ajvErrorsToStrings(validatorErrors) {
  return (validatorErrors || []).map(
    (e) => `${e.instancePath || "(root)"} ${e.message}` + (e.params ? ` [${JSON.stringify(e.params)}]` : "")
  );
}

// ---- メイン検証: 与えられたルート配下の全ファイルを読み、エラー一覧を返す ----
function validateAll(root) {
  const errors = [];
  const addErr = (file, msg) => errors.push({ file: path.relative(root, file), msg });

  // contributors.yml
  let contributorIds = new Set();
  const contributorsPath = path.join(root, "contributors.yml");
  if (existsSync(contributorsPath)) {
    let list;
    try {
      list = YAML.parse(readFileSync(contributorsPath, "utf8"));
    } catch (e) {
      addErr(contributorsPath, `YAML parse error: ${e.message}`);
      list = [];
    }
    if (list) {
      if (!validators.contributors(list)) {
        for (const m of ajvErrorsToStrings(validators.contributors.errors)) addErr(contributorsPath, m);
      }
      for (const c of list) if (c && c.id) contributorIds.add(c.id);
    }
  }

  // phrases/**/*.md
  const phraseFiles = walk(path.join(root, "phrases"), [".md"]);
  const phrasesById = new Map();
  const phraseEntries = [];
  for (const file of phraseFiles) {
    const { data, body, parseError } = loadYamlOrFrontmatter(file);
    if (parseError) {
      addErr(file, `frontmatter parse error: ${parseError}`);
      continue;
    }
    if (!data) {
      addErr(file, "frontmatter が見つかりません（--- で囲まれた YAML が必要）");
      continue;
    }
    if (!validators.phrase(data)) {
      for (const m of ajvErrorsToStrings(validators.phrase.errors)) addErr(file, `[schema] ${m}`);
    }
    phraseEntries.push({ file, data, body });
    if (data.id) {
      if (phrasesById.has(data.id)) {
        addErr(file, `id "${data.id}" は ${phrasesById.get(data.id)} と重複しています（全リポジトリで一意である必要があります）`);
      } else {
        phrasesById.set(data.id, path.relative(root, file));
      }
    }
  }

  for (const { file, data, body } of phraseEntries) {
    if (!data.id) continue; // schema エラーとして既に報告済み

    // --- ID とパスの整合性 ---
    const rel = path.relative(path.join(root, "phrases"), file);
    const parts = rel.split(path.sep);
    if (parts.length === 2) {
      const langDir = parts[0];
      const slug = parts[1].replace(/\.md$/, "");
      const expectedId = `${langDir}-${slug}`;
      if (data.id !== expectedId) {
        addErr(file, `id "${data.id}" はファイルパスから期待される id "${expectedId}" と一致しません`);
      }
      if (data.language && data.language !== langDir) {
        addErr(file, `language "${data.language}" が配置ディレクトリ "${langDir}" と一致しません`);
      }
    } else {
      addErr(file, `phrases/<言語コード>/<slug>.md の形式に従っていません: ${rel}`);
    }

    // --- 第4条: phrases/ に unverified は進入不可 ---
    const status = data.verification && data.verification.status;
    if (status === "unverified") {
      addErr(file, `verification.status が "unverified" です。phrases/ には single_source 以上のみ置けます（第4条）`);
    }

    // --- 第1条: 3点テスト（covers の和集合） ---
    if (status && status !== "unverified") {
      const coveredSet = new Set();
      for (const s of data.sources || []) for (const c of s.covers || []) coveredSet.add(c);
      const missing = REQUIRED_COVERS.filter((c) => !coveredSet.has(c));
      if (missing.length > 0) {
        addErr(
          file,
          `第1条違反: sources の covers を合わせても {${missing.join(", ")}} が欠けています（phrase/meaning/usage の3点テスト未達）`
        );
      }
    }

    // --- 第4条: cross_checked / native_confirmed の要件 ---
    if (status === "cross_checked" || status === "native_confirmed") {
      const sources = data.sources || [];
      const domains = new Set();
      for (const s of sources) {
        try {
          domains.add(new URL(s.url).hostname);
        } catch {
          /* URL 不正は schema 側の format:uri で既に検出 */
        }
      }
      if (domains.size < 2) {
        addErr(file, `第4条違反: status "${status}" には独立した（別ドメインの）出典が2件以上必要です（現在: ${domains.size}）`);
      }
      const hasT1T3 = sources.some((s) => T1_T3_TYPES.includes(s.type));
      if (!hasT1T3) {
        addErr(file, `第4条違反: status "${status}" には T1〜T3 の出典が最低1件必要です（フォーラムUGCのみは不可）`);
      }
    }
    if (status === "native_confirmed") {
      if (!data.verification.evidence || data.verification.evidence.length === 0) {
        addErr(file, `第4条違反: native_confirmed には verification.evidence の記載が必要です`);
      }
    }

    // --- Stage 整合性 ---
    const stage = data.stage;
    if (typeof stage === "number") {
      if (stage >= 1 && !["cross_checked", "native_confirmed"].includes(status)) {
        addErr(file, `stage ${stage} には verification.status が cross_checked 以上である必要があります（現在: ${status}）`);
      }
      if (stage >= 2) {
        const sections = extractH2Sections(body);
        for (const heading of STAGE_SECTIONS[2]) {
          if (!sections[heading] || sections[heading].length === 0) {
            addErr(file, `stage ${stage} には本文の「${heading}」節に実質的な内容が必要です`);
          }
        }
      }
      if (stage === 3) {
        if (!data.metaphor_tags || data.metaphor_tags.length === 0) {
          addErr(file, `stage 3 には metaphor_tags が最低1つ必要です`);
        }
        const hasEquivalents = data.cross_language_equivalents && data.cross_language_equivalents.length > 0;
        if (!hasEquivalents && data.no_known_equivalents !== true) {
          addErr(file, `stage 3 には cross_language_equivalents か no_known_equivalents: true のいずれかが必要です`);
        }
      }
    }

    // --- 第6条: metaphor 宣言と横断索引の整合 ---
    if ((data.kiza_elements || []).includes("metaphor") && (!data.metaphor_tags || data.metaphor_tags.length === 0)) {
      addErr(file, `第6条: kiza_elements に metaphor を宣言していますが metaphor_tags が空です（横断索引に載らない比喩を作らない）`);
    }

    // --- 貢献者 ID の実在確認 ---
    const contributorFields = [["found_by", data.found_by]];
    for (const f of data.researched_by || []) contributorFields.push(["researched_by", f]);
    for (const f of data.verified_by || []) contributorFields.push(["verified_by", f]);
    for (const [field, id] of contributorFields) {
      if (id && contributorIds.size > 0 && !contributorIds.has(id)) {
        addErr(file, `${field}: "${id}" は contributors.yml に登録されていません`);
      }
    }
  }

  // 相互参照解決（フレーズ間）
  for (const { file, data } of phraseEntries) {
    for (const refId of [...(data.related_phrases || []), ...(data.cross_language_equivalents || [])]) {
      if (!phrasesById.has(refId)) {
        addErr(file, `参照先の id "${refId}" が見つかりません`);
      }
    }
  }

  // leads/*.yml
  const leadFiles = walk(path.join(root, "leads"), [".yml", ".yaml"]);
  const leadIds = new Set();
  for (const file of leadFiles) {
    const { data, parseError } = loadYamlOrFrontmatter(file);
    if (parseError) {
      addErr(file, `YAML parse error: ${parseError}`);
      continue;
    }
    if (!data) {
      addErr(file, "空のリードファイルです");
      continue;
    }
    if (!validators.lead(data)) {
      for (const m of ajvErrorsToStrings(validators.lead.errors)) addErr(file, `[schema] ${m}`);
    }
    if (data.id) {
      if (leadIds.has(data.id)) addErr(file, `lead id "${data.id}" が重複しています`);
      leadIds.add(data.id);
    }
    if (data.status === "collected") {
      if (!data.resolution || !data.resolution.phrase_id) {
        addErr(file, `status "collected" には resolution.phrase_id が必要です`);
      } else if (!phrasesById.has(data.resolution.phrase_id)) {
        addErr(file, `resolution.phrase_id "${data.resolution.phrase_id}" が phrases/ に見つかりません`);
      }
    }
    if (data.status === "rejected") {
      if (!data.resolution || !data.resolution.reason) {
        addErr(file, `status "rejected" には resolution.reason が必要です`);
      }
    }
    if (
      (data.status === "fresh" || data.status === "open") &&
      (!data.candidate || !data.candidate.kiza_elements || data.candidate.kiza_elements.length === 0)
    ) {
      addErr(file, `第6条違反: fresh/open のリードには candidate.kiza_elements（metaphor/wit/poetic_image/cultural_allusion）が最低1つ必要です`);
    }
    if (data.scouted_by && contributorIds.size > 0 && !contributorIds.has(data.scouted_by)) {
      addErr(file, `scouted_by: "${data.scouted_by}" は contributors.yml に登録されていません`);
    }
  }

  // essences/*.md
  const essenceFiles = walk(path.join(root, "essences"), [".md"]);
  const essencesById = new Map();
  for (const file of essenceFiles) {
    const { data, parseError } = loadYamlOrFrontmatter(file);
    if (parseError) {
      addErr(file, `frontmatter parse error: ${parseError}`);
      continue;
    }
    if (!data) {
      addErr(file, "frontmatter が見つかりません（--- で囲まれた YAML が必要）");
      continue;
    }
    if (!validators.essence(data)) {
      for (const m of ajvErrorsToStrings(validators.essence.errors)) addErr(file, `[schema] ${m}`);
    }
    if (data.id) {
      const expectedId = `ess-${path.basename(file, ".md")}`;
      if (data.id !== expectedId) {
        addErr(file, `id "${data.id}" はファイル名から期待される id "${expectedId}" と一致しません`);
      }
      if (essencesById.has(data.id)) {
        addErr(file, `essence id "${data.id}" が ${essencesById.get(data.id)} と重複しています`);
      } else {
        essencesById.set(data.id, path.relative(root, file));
      }
    }
    if (data.found_by && contributorIds.size > 0 && !contributorIds.has(data.found_by)) {
      addErr(file, `found_by: "${data.found_by}" は contributors.yml に登録されていません`);
    }
  }

  // creations/<lang>/<slug>.md
  const creationFiles = walk(path.join(root, "creations"), [".md"]);
  const creationsById = new Map();
  const creationEntries = [];
  for (const file of creationFiles) {
    const { data, parseError } = loadYamlOrFrontmatter(file);
    if (parseError) {
      addErr(file, `frontmatter parse error: ${parseError}`);
      continue;
    }
    if (!data) {
      addErr(file, "frontmatter が見つかりません（--- で囲まれた YAML が必要）");
      continue;
    }
    if (!validators.creation(data)) {
      for (const m of ajvErrorsToStrings(validators.creation.errors)) addErr(file, `[schema] ${m}`);
    }
    creationEntries.push({ file, data });
    if (data.id) {
      const rel = path.relative(path.join(root, "creations"), file);
      const parts = rel.split(path.sep);
      if (parts.length === 2) {
        const expectedId = `cre-${parts[0]}-${parts[1].replace(/\.md$/, "")}`;
        if (data.id !== expectedId) {
          addErr(file, `id "${data.id}" はファイルパスから期待される id "${expectedId}" と一致しません`);
        }
        if (data.language && data.language !== parts[0]) {
          addErr(file, `language "${data.language}" が配置ディレクトリ "${parts[0]}" と一致しません`);
        }
      } else {
        addErr(file, `creations/<言語コード>/<slug>.md の形式に従っていません: ${rel}`);
      }
      if (creationsById.has(data.id)) {
        addErr(file, `creation id "${data.id}" が重複しています`);
      } else {
        creationsById.set(data.id, path.relative(root, file));
      }
    }
    if (data.language && data.language !== "ja" && !data.translation_ja) {
      addErr(file, `language が ja 以外の創作には translation_ja が必要です`);
    }
    for (const cid of data.created_by || []) {
      if (contributorIds.size > 0 && !contributorIds.has(cid)) {
        addErr(file, `created_by: "${cid}" は contributors.yml に登録されていません`);
      }
    }
  }

  // 創作のレシピ参照解決（essences/phrases が全て読み込まれた後）
  for (const { file, data } of creationEntries) {
    if (!data.recipe) continue;
    for (const eid of data.recipe.essences || []) {
      if (!essencesById.has(eid)) {
        addErr(file, `recipe.essences の "${eid}" が essences/ に見つかりません`);
      }
    }
    for (const pid of data.recipe.inspired_phrases || []) {
      if (!phrasesById.has(pid)) {
        addErr(file, `recipe.inspired_phrases の "${pid}" が phrases/ に見つかりません`);
      }
    }
  }

  // field-notes/**/*.yml
  const fieldNoteFiles = walk(path.join(root, "field-notes"), [".yml", ".yaml"]);
  for (const file of fieldNoteFiles) {
    const { data, parseError } = loadYamlOrFrontmatter(file);
    if (parseError) {
      addErr(file, `YAML parse error: ${parseError}`);
      continue;
    }
    if (!data) {
      addErr(file, "空の field-note ファイルです");
      continue;
    }
    if (!validators.fieldNote(data)) {
      for (const m of ajvErrorsToStrings(validators.fieldNote.errors)) addErr(file, `[schema] ${m}`);
    }
    if (data.phrase_id && phrasesById.size > 0 && !phrasesById.has(data.phrase_id)) {
      addErr(file, `phrase_id "${data.phrase_id}" が phrases/ に見つかりません`);
    }
    if (data.creation_id && !creationsById.has(data.creation_id)) {
      addErr(file, `creation_id "${data.creation_id}" が creations/ に見つかりません`);
    }
    if (data.tried_by && contributorIds.size > 0 && !contributorIds.has(data.tried_by)) {
      addErr(file, `tried_by: "${data.tried_by}" は contributors.yml に登録されていません`);
    }
  }

  // inbox/*
  const inboxFiles = walk(path.join(root, "inbox"), [".md", ".yml", ".yaml"]);
  for (const file of inboxFiles) {
    if (path.basename(file) === "README.md") continue;
    const { data, parseError } = loadYamlOrFrontmatter(file);
    if (parseError) {
      addErr(file, `parse error: ${parseError}`);
      continue;
    }
    if (!data) continue;
    if (!validators.inbox(data)) {
      for (const m of ajvErrorsToStrings(validators.inbox.errors)) addErr(file, `[schema] ${m}`);
    }
  }

  return {
    errors,
    counts: {
      phrases: phraseEntries.length,
      leads: leadFiles.length,
      essences: essenceFiles.length,
      creations: creationFiles.length,
      fieldNotes: fieldNoteFiles.length,
      inbox: inboxFiles.length,
    },
  };
}

// ---- 実行モード ----
const args = process.argv.slice(2);
const selfTest = args.includes("--self-test");

if (selfTest) {
  const fixturesDir = path.join(__dirname, "fixtures");
  const validDir = path.join(fixturesDir, "valid");
  const invalidDir = path.join(fixturesDir, "invalid");

  let failures = 0;

  console.log("=== 自己テスト: fixtures/valid が CI を通過すること ===");
  const validResult = validateAll(validDir);
  if (validResult.errors.length === 0) {
    console.log(`OK: valid fixtures はエラー0件（phrases:${validResult.counts.phrases} leads:${validResult.counts.leads} essences:${validResult.counts.essences} creations:${validResult.counts.creations} field-notes:${validResult.counts.fieldNotes}）`);
  } else {
    failures++;
    console.log(`NG: valid fixtures であるにもかかわらず ${validResult.errors.length} 件のエラーが検出されました:`);
    for (const e of validResult.errors) console.log(`  - ${e.file}: ${e.msg}`);
  }

  console.log("\n=== 自己テスト: fixtures/invalid の各ケースが確実に落ちること ===");
  if (!existsSync(invalidDir)) {
    console.log("invalid フィクスチャディレクトリが見つかりません");
    failures++;
  } else {
    const cases = readdirSync(invalidDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    for (const caseName of cases) {
      const caseDir = path.join(invalidDir, caseName);
      const result = validateAll(caseDir);
      if (result.errors.length > 0) {
        console.log(`OK: "${caseName}" は期待通り ${result.errors.length} 件のエラーで落ちました`);
      } else {
        failures++;
        console.log(`NG: "${caseName}" はエラーなしで通過してしまいました（違反を検出できていません）`);
      }
    }
  }

  console.log(`\n${failures === 0 ? "全ての自己テストに合格しました。" : `${failures} 件の自己テストが失敗しました。`}`);
  process.exit(failures === 0 ? 0 : 1);
} else {
  const root = process.cwd();
  const result = validateAll(root);
  if (result.errors.length === 0) {
    console.log(
      `検証OK — phrases:${result.counts.phrases} leads:${result.counts.leads} essences:${result.counts.essences} creations:${result.counts.creations} field-notes:${result.counts.fieldNotes} inbox:${result.counts.inbox}`
    );
    process.exit(0);
  } else {
    console.log(`憲法違反 / スキーマ違反が ${result.errors.length} 件見つかりました:\n`);
    const byFile = new Map();
    for (const e of result.errors) {
      if (!byFile.has(e.file)) byFile.set(e.file, []);
      byFile.get(e.file).push(e.msg);
    }
    for (const [file, msgs] of byFile) {
      console.log(file);
      for (const m of msgs) console.log(`  - ${m}`);
    }
    process.exit(1);
  }
}
