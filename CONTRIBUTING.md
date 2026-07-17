# CONTRIBUTING

憲法（[CONSTITUTION.md](./CONSTITUTION.md)）は厳格に守る。それ以外はここに書く軽量なルール。

## 文体・記述言語

- フレーズ原文: **現地語表記** + ローマ字転写 + IPA発音記号
- 解説（意味・語源・文化背景など）: **日本語**
- 本文は固定の H2 見出しを使う: `## 意味とニュアンス` `## 比喩の論理` `## 語源` `## 文化・歴史背景` `## 使いどころと注意` `## 発見の記録`
- 語源・文化史の主張には出典を（新しい主張を書いたら出典も増やす）

## ライフサイクル

```
Claude Chat 下書き ──Issue/inbox──▶ unverified
                                     │ /harvest-inbox or /add-phrase（3点テスト通過）
                                     ▼
                          phrases/ single_source（= ドラフト扱い）
                                     │ /verify-phrase（独立2出典）
                                     ▼
                                cross_checked
                                     │ ネイティブ確認の証跡
                                     ▼
                              native_confirmed
```

日次スカウトが生む `leads/`（噂）は別ルート:

```
/scout が発見 ─▶ lead: fresh（当日ピック、地図で脈打つ）
                     │ 翌日以降
                     ▼
                 lead: open（噂リストに残留、いつでも開封可）
                     │ /uncover
                     ▼
        collected（phrases/へ）or rejected（理由を記録）
```

## 人間 + Claude Code の標準ワークフロー

1. ブランチ作成: `expedition/<地域slug>` または `phrase/<id>`
2. エントリ作成（`/add-phrase` などのスキル、または手動で `templates/phrase.md` をコピー）
3. `npm run validate` をローカルで通す
4. PR 作成。下記チェックリストに従いレビュー

K参加前のソロ期間はセルフレビュー + CI通過でマージ可。官僚制は持ち込まない。

### PRレビューチェックリスト

- [ ] 出典URLを実際に開き、原語表記・意味・使用例の3点が確認できた
- [ ] `origin_type` は妥当（フィクション起源なら現実の流通を示す出典が別途あるか）
- [ ] `verification.status` が出典の実態と一致している（過大申告なし）
- [ ] `kiza_elements` の申告が本文（比喩の論理 等）の記述で裏付けられている（直接的な機能フレーズを比喩と強弁していない・第6条）
- [ ] IPA・ローマ字転写・`gloss_ja` がある
- [ ] 個人特定情報が含まれていない（第5条）
- [ ] AI作成エントリの場合、出典URLの内容をAIが実際に取得・確認した記録がPR本文にある

## Claude Chat（git不可）の参加経路

1. **主経路**: GitHub Issue（`.github/ISSUE_TEMPLATE/phrase-draft.yml`）。Claude Chat との会話で見つけたフレーズは、Chat に `schema/inbox.schema.json` 準拠の内容を出力させ、ブラウザ（スマホ可）から Issue に貼る
2. **副経路**: `inbox/*.md` または `inbox/*.yml` を直接コミット
3. 回収は `/harvest-inbox` スキルが行う。検証失敗の下書きは理由をコメントして残す（捨てない — 後の遠征の手がかり）

## スキル一覧

| スキル | 用途 |
|---|---|
| `/scout` | 日次スカウト: キザなセリフ候補+エッセンスの発見（routine/手動両対応） |
| `/uncover <lead-id>` | リードを開封してエントリ化 |
| `/expedition <地域/言語>` | 自由遠征でまとめて収集（フレーズ専門） |
| `/forage <テーマ>` | エッセンスの集中採集（テーマ・文化圏特化） |
| `/cook [注文書]` | 料理場での創作: 素材選び→下書き→推敲→creations/保存 |
| `/add-phrase` | 単発追加（対話） |
| `/deepen <phrase-id>` | Stage 2 化（語源・文化史の深掘り） |
| `/verify-phrase <phrase-id>` | Stage 1 化（独立第2出典の発掘） |
| `/field-note [id]` | 実践メモの記録（phrase / creation 両対応） |
| `/harvest-inbox` | Claude Chat 下書きの回収 |
| `/dashboard` | indexes・地図・厨房データの再生成 |

分業の目安: **scout** = 毎朝の自動巡回で広く薄く（フレーズのリード+エッセンス少量）/ **forage** = 人間が指名するテーマの集中採集 / **expedition** = フレーズ専門の腰を据えた遠征 / **cook** = 創作。

## 命名規則

- 言語ディレクトリ: ISO 639-1（2文字）優先、なければ ISO 639-3（3文字）
- ファイル名: ローマ字転写ベースの slug（小文字・ASCII・ハイフン区切り）
- フレーズID: `<言語コード>-<slug>`（例: `tr-fistik-gibisin`）
- エッセンスID: `ess-<slug>`（例: `ess-rose-and-nightingale`）
- 創作ID: `cre-<言語コード>-<slug>`（例: `cre-ja-tsuki-no-nagori`）
