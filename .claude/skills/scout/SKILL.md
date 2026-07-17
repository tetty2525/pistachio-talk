---
name: scout
description: 日次スカウト。frontierの未踏・手薄言語からキザなセリフ候補（リード）とエッセンス（創作素材）を発見し、地図に光として灯す。クラウドroutineから毎朝自動実行されるほか、手動でも実行できる。出典URLを実際にfetchして存在確認せずに書くことは絶対禁止。直接的な機能フレーズは候補にしない（第6条）。
---

# /scout — 日次スカウト

このスキルは「世界のキザなセリフ辞典」の日次冒険ループの起点。2つの収穫を狙う:
1. **キザなセリフ候補（リード）** — `leads/` に記録するだけで、正式なエントリ化（`phrases/`）は行わない。正式化は `/uncover` の仕事
2. **エッセンス（創作素材）** — 調査の道中で出会った文化素材を `essences/` に直接登録する（少量）

## 憲法上の位置づけ

CONSTITUTION.md 第1条・第2条・第6条はリードにも及ぶ:
- `candidate.sources` / エッセンスの `sources` には**実際にfetchして存在・内容を確認したURL**を最低1つ記載する。幻覚URLは絶対禁止。
- フィクション（創作フレーズ・脚本のみが出典のもの）は候補にしない。
- **第6条（キザ基準）**: 候補はキザ4要素（`metaphor` 比喩 / `wit` 機知 / `poetic_image` 詩的イメージ / `cultural_allusion` 文化的暗喩）を最低1つ持つこと。「ここへよく来ますか？」のような**直接的な機能フレーズは fetch する前に破棄する**。判定は「4要素のどれに当たるかを一言で言えるか」で行い、`candidate.kiza_elements` に記録する。
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
   - Web検索でその言語のキザなセリフ・気の利いた口説き文句・比喩の効いた褒め言葉の候補を探す
   - **キザ判定（第6条・fetch前に行う）**: 候補が4要素（比喩/機知/詩的イメージ/文化的暗喩）のどれに当たるか一言で言えなければ破棄する。直接的な機能フレーズ（声かけの定番・単なる褒め言葉）は集めない
   - 残った候補ごとに出典URLを**実際にfetch**し、以下を確認する:
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
   - `candidate.kiza_elements`: キザ判定の結果を記録（fresh/open では必須・CI検査対象）
   - `candidate.sources`: fetch確認済みURLのみ
   - `scouted_by`: 実行しているAIのcontributor id（`contributors.yml` の `claude-routine-hiroto` または実行者に応じたAI id）
   - `status: fresh`, `picked_for: <今日の日付>` を、`picks_per_day` 件数まで付与。それを超える発掘分は `status: open`（`picked_for: null`）として噂リストに残す

5. **エッセンス採集**（`essence_picks_per_day`（既定1）件まで。収穫ゼロでもよい）
   - フレーズ調査の道中で出会った文化素材（詩の伝統・食文化・自然の異名・神話のモチーフなど）のうち、創作の比喩の担い手になれそうなものを選ぶ
   - 出典URLを**実際にfetch**して (a)モチーフの記載 (b)文化的文脈の説明 を確認する
   - `templates/essence.md` から `essences/<slug>.md` に直接登録する（リード化しない。エッセンスに開封の演出は不要）
   - 地図には「今日届いた素材」としてミント色の菱形が明滅する

6. **検証**
   - `npm run validate` を実行し、通過することを確認する

7. **索引・地図・厨房データの更新**
   - `npm run dashboard` を実行し、`indexes/`（rumors・pantry 含む）・`data/map-data.json`・`kitchen/kitchen-data.js` を再生成する

8. **コミット & push**
   - 変更を `git status` で確認し、**`leads/` `essences/` `indexes/` `data/map-data.json` `data/scout-config.yml` `map/map-data.js` `map/world-land.js` `kitchen/kitchen-data.js` の変更のみ**であることを確認する（`phrases/` `creations/` や他の人間の作業に触れていないこと）
   - コミットメッセージ例: `scout: 2026-07-19 の候補を追加（tr, sw + 素材1件）`
   - `main` に直接コミットしてpushする（リード・エッセンスは憲法上 `phrases/` に入らないため、PRを経ずに直接反映してよい設計）

## 失敗時の安全性

このスキルが何らかの理由で失敗しても、地図は最後に成功した日のリードを表示し続けるだけで壊れない。無理に毎日実行を成功させようとせず、候補が見つからなければ「今日は収穫なし」でリードを1件も作らずに終えてよい。
