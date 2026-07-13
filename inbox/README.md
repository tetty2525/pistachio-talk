# inbox/

Claude Chat（git操作不可）からの下書きの**副経路**。主経路は GitHub Issue（`inbox` ラベル、[phrase-draft.yml](../.github/ISSUE_TEMPLATE/phrase-draft.yml)）。

ここに `.md`（frontmatter形式）または `.yml` ファイルを置くと、`/harvest-inbox` スキルが拾って検証・エントリ化する。スキーマは [schema/inbox.schema.json](../schema/inbox.schema.json)（`phrase_original` `language` `source_url` `submitted_by` が必須、`status: unverified` 固定）。

このファイル自体はバリデータの対象外。
