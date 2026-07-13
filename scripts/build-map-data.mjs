#!/usr/bin/env node
// phrases/ leads/ data/frontier.yml から地図liteのデータを生成する。
// - data/map-data.json      : 正典データ（将来のGitHub Pages版でfetchする用）
// - map/map-data.js         : 同内容を window.PISTACHIO_MAP_DATA に代入するJS（file://でも動くように）
// - map/world-land.js       : world-atlas の陸地TopoJSONを等長方形図法でSVGパス化したもの（滅多に変わらないが毎回再生成可能）

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { feature } from "topojson-client";
import { walk, loadYamlOrFrontmatter } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MAP_DIR = path.join(ROOT, "map");
const DATA_DIR = path.join(ROOT, "data");

const WIDTH = 960;
const HEIGHT = 480;

function project([lng, lat]) {
  const x = (lng + 180) * (WIDTH / 360);
  const y = (90 - lat) * (HEIGHT / 180);
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

function ringToPathSegment(ring) {
  return ring
    .map((pt, i) => {
      const [x, y] = project(pt);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ") + " Z";
}

function buildWorldLandPath() {
  const topoPath = path.join(ROOT, "node_modules", "world-atlas", "land-110m.json");
  const topology = JSON.parse(readFileSync(topoPath, "utf8"));
  const geo = feature(topology, topology.objects.land);
  const polygons = geo.type === "FeatureCollection" ? geo.features.map((f) => f.geometry) : [geo.geometry];

  const segments = [];
  for (const geom of polygons) {
    if (!geom) continue;
    const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
    for (const poly of polys) {
      for (const ring of poly) {
        segments.push(ringToPathSegment(ring));
      }
    }
  }
  return segments.join(" ");
}

function loadFrontier() {
  const p = path.join(DATA_DIR, "frontier.yml");
  return YAML.parse(readFileSync(p, "utf8"));
}

function loadPhrases() {
  return walk(path.join(ROOT, "phrases"), [".md"])
    .map((file) => loadYamlOrFrontmatter(file).data)
    .filter(Boolean);
}

function loadLeads() {
  return walk(path.join(ROOT, "leads"), [".yml", ".yaml"])
    .map((file) => loadYamlOrFrontmatter(file).data)
    .filter(Boolean);
}

function buildMapData() {
  const frontier = loadFrontier();
  const phrases = loadPhrases();
  const leads = loadLeads();

  const phrasesByLang = new Map();
  for (const p of phrases) {
    if (!phrasesByLang.has(p.language)) phrasesByLang.set(p.language, []);
    phrasesByLang.get(p.language).push(p);
  }

  const openLeadsByLang = leads.filter((l) => l.status === "open" || l.status === "fresh");

  const frontierPoints = [];
  for (const region of frontier.regions || []) {
    for (const lang of region.languages) {
      const entries = phrasesByLang.get(lang.code) || [];
      const hasFreshToday = openLeadsByLang.some((l) => l.language === lang.code && l.status === "fresh");
      const hasOpenLead = openLeadsByLang.some((l) => l.language === lang.code && l.status === "open");
      frontierPoints.push({
        code: lang.code,
        name_ja: lang.name_ja,
        region: region.name_ja,
        lat: lang.map_anchor.lat,
        lng: lang.map_anchor.lng,
        phraseCount: entries.length,
        maxStatus: entries.reduce((acc, e) => {
          const order = { single_source: 1, cross_checked: 2, native_confirmed: 3 };
          const s = e.verification && e.verification.status;
          return order[s] > (order[acc] || 0) ? s : acc;
        }, null),
        hasFreshToday,
        hasOpenLead,
      });
    }
  }

  const leadsFresh = leads
    .filter((l) => l.status === "fresh")
    .map((l) => ({
      id: l.id,
      lat: l.map_anchor.lat,
      lng: l.map_anchor.lng,
      teaser_ja: l.teaser_ja,
      intrigue_tags: l.intrigue_tags || [],
      date: l.date,
    }));

  const leadsOpen = leads
    .filter((l) => l.status === "open")
    .map((l) => ({
      id: l.id,
      lat: l.map_anchor.lat,
      lng: l.map_anchor.lng,
      teaser_ja: l.teaser_ja,
      intrigue_tags: l.intrigue_tags || [],
      date: l.date,
    }));

  return {
    generated_note: "npm run dashboard / npm run build:map で再生成される。手で編集しない。",
    width: WIDTH,
    height: HEIGHT,
    frontierPoints,
    leadsFresh,
    leadsOpen,
    totals: {
      languagesCovered: frontierPoints.filter((p) => p.phraseCount > 0).length,
      languagesTotal: frontierPoints.length,
      phrases: phrases.length,
      leadsFresh: leadsFresh.length,
      leadsOpen: leadsOpen.length,
    },
  };
}

function main() {
  mkdirSync(MAP_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  const mapData = buildMapData();
  const mapDataJson = JSON.stringify(mapData, null, 2);
  writeFileSync(path.join(DATA_DIR, "map-data.json"), mapDataJson + "\n");
  writeFileSync(
    path.join(MAP_DIR, "map-data.js"),
    `// npm run build:map で自動生成。手で編集しない。\nwindow.PISTACHIO_MAP_DATA = ${mapDataJson};\n`
  );

  const landPath = buildWorldLandPath();
  writeFileSync(
    path.join(MAP_DIR, "world-land.js"),
    `// world-atlas (land-110m) を等長方形図法でSVGパス化したもの。npm run build:map で再生成される。\nwindow.PISTACHIO_WORLD_LAND_PATH = ${JSON.stringify(landPath)};\n`
  );

  console.log(
    `地図データを再生成しました（言語カバー: ${mapData.totals.languagesCovered}/${mapData.totals.languagesTotal}、今日の光: ${mapData.totals.leadsFresh}、噂: ${mapData.totals.leadsOpen}）`
  );
}

main();
