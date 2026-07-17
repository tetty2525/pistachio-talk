# pistachio-talk — 世界のキザなセリフ辞典と料理場

世界各地の**実在するキザなセリフ**（比喩・機知・詩的イメージ・文化的暗喩のあるもの）を出典URL付きで集め、さらにその文化素材から**自分たちのキザなセリフを創作する**プロジェクト。

お手本: トルコ語 **"Fıstık gibisin"**（直訳: 君はピスタチオのようだ → 実際の意味: 君は最高にきれいだ）
出典: https://turkishfluent.com/blog/fistik-gibisin-meaning-origin-turkish/

「ここへよく来ますか？」のような直接的な機能フレーズは集めない（憲法第6条）。収集棚（`phrases/`）にフィクションは一切入れない。すべてのエントリに「意味と使用例が書いてある出典URL」が必須。詳しくは [CONSTITUTION.md](./CONSTITUTION.md)。

## 二本柱: 収集（夜の地図）と創作（昼の厨房）

```
【収集】毎朝: AIスカウトが世界のどこかでキザなセリフ候補と文化素材を発見
  → 世界地図に光が灯る（フレーズはティザーのみ・素材はミントの菱形）
  → 気になった光を /uncover で開封 → 出典検証 → 正体開示 → 正式エントリ化
  → 地図がその地域で永続点灯、旅日誌（EXPEDITION_LOG.md）に記録

【創作】厨房（npm run kitchen）でパントリーの素材（歴史・文化・自然）を籠に入れ
  → 相手・場面・トーンを決めて注文書を作成
  → Claude Code に貼ると /cook が調理開始（下書き→推敲→保存）
  → 完成した一皿は creations/ にレシピ付きで収蔵、実践メモも付けられる
```

## クイックスタート

```bash
npm install
npm run validate     # 全エントリを憲法・スキーマに照らして検証
npm test              # バリデータ自体の自己テスト（fixtures/valid・invalid）
npm run dashboard     # indexes/・地図データ・厨房データを再生成
npm run map           # 地図lite（夜の探検）をローカルで開く
npm run kitchen       # 料理場（昼の厨房）をローカルで開く
```

## ディレクトリ構成

| パス | 内容 |
|---|---|
| `phrases/<言語コード>/<slug>.md` | 収集した本物のキザなセリフ（検証済みエントリ） |
| `leads/` | AIスカウトが見つけた未検証の候補（噂） |
| `essences/<slug>.md` | 創作素材の器（歴史・文化・自然のエッセンス、id は `ess-` 始まり） |
| `creations/<言語コード>/<slug>.md` | 料理場で創作したセリフ（id は `cre-` 始まり、レシピ必須） |
| `field-notes/` | 実践メモ（共有・構造化層。phrase / creation どちらにも付く） |
| `private/` | 実践メモの生々しい層（gitignore 済み、コミットされない） |
| `inbox/` | Claude Chat 等からの下書き |
| `map/` | 地図lite UI（収集の冒険） |
| `kitchen/` | 料理場 UI（創作の厨房） |
| `indexes/` | 自動生成ダッシュボード（カバレッジ・比喩索引・未踏領域・噂・パントリー・レシピ帳） |
| `data/` | frontier（目標言語リスト）・scout設定・地図用データ |
| `schema/` `scripts/` | JSON Schema とバリデータ |
| `.claude/skills/` | Claude Code 用の運用スキル（11種） |

## ドキュメント

- [CONSTITUTION.md](./CONSTITUTION.md) — 憲法（5条）
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 貢献手順・レビュー観点
- [EXPEDITION_LOG.md](./EXPEDITION_LOG.md) — 旅の記録
