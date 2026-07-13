---
name: uncover
description: "リード（leads/の噂）を開封して正式なフレーズエントリにする「開封の儀」。引数にlead-idを取る。3点テストの本格検証→正体開示→phrases/へエントリ化、または検証失敗ならrejectedとして理由を記録する。"
---

# /uncover <lead-id> — 開封の儀

`leads/` にある噂（`/scout` が発見した候補）を1件選び、本格的な検証を経て正式エントリ化する。ユーザーが地図の光をクリックして「これが気になる」と選んだ体験の核心部分。

## 手順

1. **リードを読む**
   - `leads/*.yml` から該当 `id` のファイルを探す（`lead-<日付>-<lang>-<連番>` 形式）
   - 見つからなければユーザーに報告して終了

2. **正体を開示する**
   - `candidate.phrase_original` と `candidate.gloss_hint` をユーザーに提示する（ここで初めてフレーズ本体が明かされる）

3. **本格検証（3点テスト）**
   - `candidate.sources` の各URLを改めてfetchし、以下を確認する:
     - フレーズが原語で書かれているか（`phrase`）
     - 意味の説明があるか（`meaning`）
     - 使用例または使用場面の記述があるか（`usage`）
   - 3点が1つのURLで揃わない場合、追加のWeb検索で補完URLを探し、実際にfetchして確認する
   - 語源・文化的主張がある場合は、出典の質ティア（T1〜T4）を判定する

4a. **検証成功 → エントリ化**
   - `templates/phrase.md` を雛形に `phrases/<lang>/<slug>.md` を作成
   - `sources[]` の `covers` を実際に確認した範囲で正確に埋める（過大申告しない）
   - `verification.status: single_source`、`stage: 0`
   - `lead_id: <このリードのid>` を記載
   - `found_by`: リードの `scouted_by`（発見はスカウトの功績）
   - `researched_by`: このエントリ化を行ったAI/人間のid
   - リードファイルを更新: `status: collected`, `resolution: { phrase_id: "<新エントリのid>" }`

4b. **検証失敗 → 棄却**
   - エントリは作らない
   - リードファイルを更新: `status: rejected`, `resolution: { reason: "<具体的な理由>" }`
   - 「ガセ噂」として記録に残すことに価値がある（後で誰かが別角度から再挑戦できる）

5. **索引・記録の更新**
   - `npm run validate` を通す
   - `npm run dashboard` で `indexes/` と `data/map-data.json` を再生成（地図の永続点灯を反映）
   - `EXPEDITION_LOG.md` に開封の記録を追記する（発見→開封→結果のミニストーリー。棄却でも記録する）

6. **コミット**
   - エントリ化の場合はブランチを切って（`phrase/<id>`）PRを作成するか、軽量運用中ならセルフレビューでmainにコミットしてよい
   - 棄却の場合はリード更新のみを直接コミットしてよい（`phrases/` に変更がないため）

## 心構え

開封は「答え合わせ」ではなく「調査の続き」。ティザーだけでは分からなかった深さを、ここで初めて掘る。検証に失敗しても収穫（何が足りなかったかの学び）として EXPEDITION_LOG に残す。
