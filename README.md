# pistachio-talk — 世界のナンパフレーズ辞典

世界各地の**実在する**ナンパフレーズ・キザなセリフを、出典URL付きで集める共同データベース。

お手本: トルコ語 **"Fıstık gibisin"**（直訳: 君はピスタチオのようだ → 実際の意味: 君は最高にきれいだ）
出典: https://turkishfluent.com/blog/fistik-gibisin-meaning-origin-turkish/

フィクション・創作は一切収録しない。すべてのエントリに「意味と使用例が書いてある出典URL」が必須という、ただ一つの絶対ルール（憲法）の上に成り立つ。詳しくは [CONSTITUTION.md](./CONSTITUTION.md)。

## 体験の核: 日次の冒険ループ

```
毎朝: AIスカウトが世界のどこかでフレーズ候補を発見
  → 世界地図に光が灯る（ティザーのみ表示。フレーズ本体は伏せられる）
  → 気になった光を /uncover で開封 → 出典検証 → 正体開示 → 正式エントリ化
  → 地図がその地域で永続点灯、旅日誌（EXPEDITION_LOG.md）に記録
```

## クイックスタート

```bash
npm install
npm run validate     # 全エントリを憲法・スキーマに照らして検証
npm test              # バリデータ自体の自己テスト（fixtures/valid・invalid）
npm run dashboard     # indexes/ と data/map-data.json を再生成
npm run map           # 地図liteをローカルで開く
```

## ディレクトリ構成

| パス | 内容 |
|---|---|
| `phrases/<言語コード>/<slug>.md` | 検証済みエントリ本体 |
| `leads/` | AIスカウトが見つけた未検証の候補（噂） |
| `field-notes/` | 実践メモ（共有・構造化層） |
| `private/` | 実践メモの生々しい層（gitignore 済み、コミットされない） |
| `inbox/` | Claude Chat 等からの下書き |
| `map/` | 地図lite UI |
| `indexes/` | 自動生成ダッシュボード（カバレッジ・比喩索引・未踏領域・噂リスト） |
| `data/` | frontier（目標言語リスト）・scout設定・地図用データ |
| `schema/` `scripts/` | JSON Schema とバリデータ |
| `.claude/skills/` | Claude Code 用の運用スキル（9種） |

## ドキュメント

- [CONSTITUTION.md](./CONSTITUTION.md) — 憲法（5条）
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 貢献手順・レビュー観点
- [EXPEDITION_LOG.md](./EXPEDITION_LOG.md) — 旅の記録
