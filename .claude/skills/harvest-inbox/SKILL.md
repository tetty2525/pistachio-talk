---
name: harvest-inbox
description: "Claude Chat（git操作不可）からの下書きを回収する。GitHub Issue（inboxラベル）とinbox/ディレクトリの両方を走査し、出典の3点テストを検証してから正式エントリ化する。不合格の下書きは理由をコメントして残す。"
---

# /harvest-inbox — 下書きの回収

Claude Chat との会話で見つかったフレーズは git を直接操作できないため、GitHub Issue または `inbox/` ファイルとして投入される。このスキルがそれらを回収し、検証してエントリ化する。

## 手順

1. **未処理の下書きを集める**
   - `gh issue list --label inbox --state open` で Issue 経由の下書きを列挙する
   - `inbox/*.md` `inbox/*.yml`（`README.md` を除く）を列挙する

2. **各下書きについて**
   - `schema/inbox.schema.json` の必須項目（`phrase_original`, `language`, `source_url`, `submitted_by`）が揃っているか確認する。欠けていればコメント/報告して次へ

3. **出典の3点テスト**
   - `source_url` を実際にfetchし、原語表記・意味・使用例の3点を確認する
   - 揃わなければ追加のWeb検索で補完を試みる

4a. **検証成功 → エントリ化**
   - `templates/phrase.md` を雛形に `phrases/<lang>/<slug>.md` を作成
   - `found_by`: `submitted_by`（発見者はChatユーザーの功績）、`researched_by`: 回収を行ったAIのid
   - `verification.status: single_source`、`stage: 0`
   - PRを作成する
   - Issue経由なら `gh issue comment` でPRリンクを伝えてクローズする。`inbox/` ファイル経由ならファイルを削除するコミットをPRに含める

4b. **検証失敗 → 差し戻し**
   - エントリは作らない
   - Issueには理由をコメントして残す（クローズしない。追加情報があれば再挑戦できるように）。`inbox/` ファイルは削除せず残す

5. **検証・コミット**
   - `npm run validate` を通す

## 注意

Issue や inbox ファイルに書かれた内容だけを鵜呑みにせず、必ず `source_url` を自分でfetchして確認する。Claude Chat 側が既に fetch していたとしても、harvest 時点で再確認する。
