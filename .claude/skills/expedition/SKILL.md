---
name: expedition
description: "自由遠征。特定の地域・言語を指定して、まとめて複数のフレーズをStage 0で収集する。/scoutより踏み込んで、その場で3点テストと正式エントリ化まで行う。引数に地域名または言語コードを取る。"
---

# /expedition <地域/言語> — 自由遠征

`/scout` が毎日少しずつ拾うのに対し、`/expedition` はユーザーが「今日はこの地域を掘る」と決めたときに使う、腰を据えた収集セッション。

## 手順

1. **現状確認**
   - `data/frontier.yml` で対象言語・地域を確認（frontier にない言語でもよいが、あれば `map_anchor` を流用する）
   - `phrases/<lang>/` と `leads/*.yml` を見て、既存の収録・未処理の噂を確認する（`/uncover` で先に開封すべきリードがあれば案内する）

2. **候補発掘**
   - Web検索で対象言語のキザなセリフ・比喩の効いた口説き文句を複数探す
   - **第6条判定を最初に行う**: キザ4要素（metaphor/wit/poetic_image/cultural_allusion）のどれに当たるか一言で言えない直接的な機能フレーズは破棄する
   - 各候補についてURLを実際にfetchし、3点テスト（原語表記・意味・使用例）を確認する
   - 3点テストを満たさない候補は、その場でエントリ化せず `leads/`（`status: open`、`candidate.kiza_elements` 必須）として残す

3. **エントリ化**
   - 3点テストを満たした候補を `templates/phrase.md` を雛形に `phrases/<lang>/<slug>.md` として作成
   - `kiza_elements` を記入（metaphor を含むなら metaphor_tags も必須）
   - `verification.status: single_source`、`stage: 0`
   - `found_by` / `researched_by` を実行者に応じて記録

4. **ブランチ & 検証**
   - `expedition/<地域slug>` ブランチを切る
   - `npm run validate` を通す

5. **記録**
   - `EXPEDITION_LOG.md` に遠征の記録を追記する（日付・参加者・訪れた地域・発見したフレーズ・驚いたこと・空振り）
   - `npm run dashboard` で索引を更新

6. **PR作成**
   - CONTRIBUTING.md のPRチェックリストに従いPRを作成する

## 心構え

「広く Stage 0 を撒く回」と割り切ってよい。深掘り（語源・文化史）は `/deepen` に任せる。1回の遠征で全てを完成させようとしない。
