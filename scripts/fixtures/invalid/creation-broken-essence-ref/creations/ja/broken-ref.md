---
schema_version: 1
id: cre-ja-broken-ref
text_original: "存在しないエッセンスを参照する創作"
language: ja
situation:
  target_relation: friend
  scene_ja: テスト
  tone: playful
recipe:
  essences: [ess-does-not-exist]
created_by: [tester]
created: "2026-01-01"
updated: "2026-01-01"
---

## 狙い

recipe.essences が存在しない id を指す違反フィクスチャ。
