---
name: field-note
description: "実践メモ（実際に異性・上司・友達等に使ってみた記録）を対話形式で記録する。収集フレーズ(phrase_id)にも創作セリフ(creation_id)にも付けられる。共有層(field-notes/)は構造化データのみ、生々しい詳細は各自のprivate/へ。個人特定情報が入っていないかセルフチェックする。"
---

# /field-note [phrase-id | creation-id] — 実践メモの記録

第5条（プライバシー）を守りながら、実践の記録を楽しく残す。**収集フレーズ（`tr-...` 等）にも料理場の創作（`cre-...`）にも付けられる。**

## 手順

1. **対象の確認**
   - id が指定されていなければユーザーに尋ねる（`phrases/**/*.md` と `creations/**/*.md` から候補を探して提示してもよい）
   - `cre-` で始まる id なら `creation_id` フィールドに、それ以外なら `phrase_id` に書く（**どちらか一方のみ**）

2. **対話で構造化データを埋める**（`schema/field-note.schema.json` 準拠）
   - `date`: 試した日（省略時は今日）
   - `tried_by`: `contributors.yml` のid（ユーザー自身）
   - `target_relation`: friend | coworker | boss | romantic_interest | partner | family | stranger | native_consultant
   - `target_is_native`: 相手がそのフレーズの言語のネイティブか
   - `delivery`: verbal | text
   - `reaction`: charmed | laughed | flattered | confused | neutral | cringed | offended
   - `would_use_again`: yes | no | situational
   - `note_ja`: 一言メモ

3. **個人特定情報のセルフチェック（重要）**
   - `note_ja` に実名・所属・特定可能な状況描写が含まれていないか確認する
   - 含まれていれば、ユーザーに指摘し `private/` 側へ移すことを提案する

4. **共有層の保存**
   - `templates/field-note.yml` を雛形に `field-notes/<年>/<日付>-<tried_by>-<連番2桁>.yml` を作成

5. **プライベート層（任意）**
   - ユーザーが生々しい詳細も残したいと言えば、`private/field-notes/<ファイル名>` に雛形を作成し、共有層の `private_ref` にそのファイル名を書く
   - このファイルが `git status` に一切現れないことを確認する（`.gitignore` の `private/*` により無視されるはず）

6. **検証・コミット**
   - `npm run validate` を通す
   - 共有層のみコミットする（`private/` は無視されているので自動的に含まれない）
