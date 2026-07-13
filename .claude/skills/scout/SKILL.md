---
name: scout
description: 日次スカウト。frontierの未踏・手薄言語からフレーズ候補を発見し、地図に灯るリード(leads/)として記録する。クラウドroutineから毎朝自動実行されるほか、手動でも実行できる。出典URLを実際にfetchして存在確認せずにsourcesへ書くことは絶対禁止。
---

# /scout — 日次スカウト

このスキルは「世界のナンパフレーズ辞典」の日次冒険ループの起点。**フレーズ候補（リード）を見つけて `leads/` に記録するだけ**で、正式なエントリ化（`phrases/`）は行わない。正式化は `/uncover` の仕事。

## 憲法上の位置づけ

CONSTITUTION.md 第1条・第2条はリードにも及ぶ:
- `candidate.sources` には**実際にfetchして存在・内容を確認したURL**を最低1つ記載する。幻覚URLは絶対禁止。
- フィクション（創作フレーズ・脚本のみが出典のもの）は候補にしない。
- リードは「噂」であり `phrases/` の収集実績にはカウントされない。焦って正式検証まで済ませる必要はない。

## 手順

1. **現状把握**
   - `data/frontier.yml` を読み、目標言語リストと地図アンカーを把握する
   - `leads/*.yml` を全て読み、既存の言語カバレッジ・最近スカウトした言語（`cooldown_days` 以内）を把握する
   - `phrases/**/*.md` を読み、既に収録済みの言語を把握する
   - `data/scout-config.yml` を読み、`picks_per_day`（既定3）・`max_candidates_per_run`・`cooldown_days`・`region_weighting` を確認する

2. **地域選定**
   - `region_weighting: frontier_first` に従い、`frontier.yml` のうち phrases/leads ともに実績が薄い言語を優先して 2〜3 言語を選ぶ
   - 直近 `cooldown_days` 以内にスカウト済みの言語は避ける（毎日同じ言語ばかりにならないように）

3. **候補発掘**（言語ごとに1〜2件、合計 `max_candidates_per_run` まで）
   - Web検索でその言語のナンパフレーズ・キザな決まり文句の候補を探す
   - 候補ごとに出典URLを**実際にfetch**し、以下を確認する:
     - フレーズが原語で書かれているか
     - 意味の説明があるか
     - 使用例または使用場面の記述があるか
   - 3点が揃わない候補は破棄する（無理に採用しない。今日ゼロ件でもよい）
   - 創作・フィクション由来の疑いがあるものは破棄する

4. **リード作成**
   - `templates/lead.yml` を雛形に、`leads/<YYYY-MM-DD>-<lang>-<連番2桁>.yml` を作成
   - `id`: `lead-<日付>-<lang>-<連番>`
   - `map_anchor`: `frontier.yml` の対応言語のアンカー座標をそのまま使う（候補の地域が違えばより適切な座標に調整してよい）
   - `teaser_ja`: **フレーズ本体・直訳・gloss を一切含めない**。性格や面白みだけを匂わせる1〜2文（例:「食べ物で人を褒める文化圏の一つ、70年代の流行歌との関連を示唆する噂あり」）
   - `candidate.sources`: fetch確認済みURLのみ
   - `scouted_by`: 実行しているAIのcontributor id（`contributors.yml` の `claude-routine-hiroto` または実行者に応じたAI id）
   - `status: fresh`, `picked_for: <今日の日付>` を、`picks_per_day` 件数まで付与。それを超える発掘分は `status: open`（`picked_for: null`）として噂リストに残す

5. **検証**
   - `npm run validate` を実行し、通過することを確認する

6. **索引・地図データの更新**
   - `npm run dashboard`（`build-indexes.mjs` + `build-map-data.mjs`）を実行し、`indexes/rumors.md` と `data/map-data.json` を再生成する

7. **コミット & push**
   - 変更を `git status` で確認し、**`leads/` `indexes/` `data/map-data.json` `data/scout-config.yml` の変更のみ**であることを確認する（`phrases/` や他の人間の作業に触れていないこと）
   - コミットメッセージ例: `scout: 2026-07-14 の候補を追加（tr, ja, sw）`
   - `main` に直接コミットしてpushする（リードは憲法上 `phrases/` に入らないため、PRを経ずに直接反映してよい設計）

## 失敗時の安全性

このスキルが何らかの理由で失敗しても、地図は最後に成功した日のリードを表示し続けるだけで壊れない。無理に毎日実行を成功させようとせず、候補が見つからなければ「今日は収穫なし」でリードを1件も作らずに終えてよい。
