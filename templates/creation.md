---
schema_version: 1
id: cre-<言語コード>-<slug>       # 例: cre-ja-tsuki-no-nagori
text_original: ""                 # 創作したセリフそのもの
language: ja                      # ISO 639-1/639-3
language_name_ja: 日本語
translation_ja: ""                # language が ja 以外なら必須
romanization: ""                  # 任意
situation:
  target_relation: romantic_interest  # friend | coworker | boss | romantic_interest | partner | family | stranger | native_consultant
  scene_ja: ""                    # 例: 月見の帰り道
  tone: poetic                    # sweet | playful | poetic | bold | gentle | witty
recipe:
  essences: []                    # 使用エッセンス id（最低1つ。出自の記録 — これが創作の「出典」）
  inspired_phrases: []            # 任意: 着想元の収集フレーズ id
  notes_ja: ""                    # どう料理したかの一言
created_by: []                    # 人間とAIの共作を明示（例: [hiroto, claude-code-hiroto]）
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

## 狙い

（誰に、何を伝えたくて、どんな効果を狙ったか）

## レシピの物語

（各エッセンスをどう使ったか。素材から完成までの調理過程）

## 推敲の記録

（主要な転換点を箇条書きで。詳細は git 履歴に委ねる）
