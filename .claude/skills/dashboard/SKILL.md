---
name: dashboard
description: "indexes/（coverage・metaphors・frontier・rumors）とdata/map-data.jsonを再生成し、新しい踏破・比喩パターンの発見などの見どころを短くサマリする。"
---

# /dashboard — 索引・地図データの再生成

## 手順

1. `npm run dashboard`（内部で `build-indexes.mjs` と `build-map-data.mjs` を実行）を走らせる
2. 実行前後の `indexes/coverage.md` と `data/map-data.json` を比較し、以下のような見どころがあれば短く報告する:
   - 新しく収録された言語（初踏破）
   - `metaphor_tags` に新しく登場した比喩パターン、または既存パターンの新しい言語での発見（例: 「食べ物系の比喩がまた1つ、○○語で見つかった」）
   - マイルストーン（10言語到達、初の `native_confirmed`、初の噂開封 など。`EXPEDITION_LOG.md` 冒頭のマイルストーン欄と照合する）
3. 変更を `git status` で確認し、`indexes/` `data/map-data.json` のみであることを確認してからコミットする

## 注意

このスキル自体はデータを作らない（`phrases/` `leads/` 等の入力を集計するだけ）。見どころが無ければ「変化なし」と正直に報告してよい。
