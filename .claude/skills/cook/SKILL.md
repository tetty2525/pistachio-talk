---
name: cook
description: "料理場での創作。パントリーのエッセンス（歴史・文化・自然の素材）を使い、ユーザーと対話でキザなセリフを共作して creations/ に保存する。kitchen UI の注文書を貼られた場合はそれをパースして開始する。素材の捏造（fetchしていない出典のエッセンス登録）は絶対禁止。"
---

# /cook — 料理場での創作

収集（phrases/）とは**完全別棟**の創作活動。憲法第2条は適用されないが、`recipe.essences` が出自の記録として必須（素材レベルで第1条の精神を貫く）。創作物が phrases/ に入ることはない。

## 手順

1. **注文の受け取り**
   - 引数や貼り付けに「/cook 注文書」形式のテキスト（kitchen UI が生成）があればパースする:
     ```
     /cook 注文書
     相手: <target_relation> / 場面: <scene> / トーン: <tone> / 言語: <lang>
     素材: <ess-id, ...> または（おまかせ）
     着想: <phrase-id, ...>   ← 任意行
     ```
   - なければ対話で確定する: 相手（friend/coworker/boss/romantic_interest/partner/family/stranger）・場面・トーン（sweet/playful/poetic/bold/gentle/witty）・言語

2. **素材出し**
   - `indexes/pantry.md` と `essences/*.md` を読み、注文に合うエッセンスを2〜4件提示する（指定があればそれを読む）
   - `indexes/metaphors.md` から着想元になりうる収集フレーズも提示する
   - それぞれ「この素材ならこういう筋の一皿になる」という調理の方向性を添える

3. **その場のエッセンス採集（必要時）**
   - 足りない素材はWeb検索で探す。**出典URLを実際にfetchして内容を確認**し、`templates/essence.md` から `essences/<slug>.md` を先に作成、`npm run validate` を通してから創作に使う
   - **fetchしていない出典でエッセンスを登録することは絶対禁止**（第1条の原則）。文化的事実の捏造は創作の土台を腐らせる

4. **下書き**
   - 2〜3案を提示する。各案に「どのエッセンスをどう使ったか」のレシピ説明を付ける
   - 直訳調・説明調に逃げない。キザ4要素（比喩・機知・詩的イメージ・文化的暗喩）のどれかが効いた文を目指す

5. **推敲ループ**
   - ユーザーと対話で磨く。主要な転換点（何を捨て、何を残したか）をメモしておく

6. **保存**
   - `templates/creation.md` から `creations/<言語コード>/<slug>.md` を作成（id: `cre-<lang>-<slug>`）
   - `recipe.essences`（必須）・`recipe.inspired_phrases`・`recipe.notes_ja` を記入
   - `created_by` にはユーザーと実行AIの**両方**の contributor id を入れる（共作の明示）
   - 本文「狙い」「レシピの物語」「推敲の記録」を書く

7. **検証・索引・コミット**
   - `npm run validate` → `npm run dashboard`（pantry/recipes/地図/厨房データ再生成）
   - main 直接コミット可（creations は phrases の憲法検査対象外）。新規エッセンスも同一コミットに含めてよい
   - コミットメッセージ例: `cook: 「<セリフ冒頭>…」を創作（ess-xxx 使用）`

## 心構え

料理場は「正解を当てる場」ではなく「素材と遊ぶ場」。ボツ案も推敲の記録に残せば財産になる。実際に使ってみたら `/field-note`（creation_id 対応）で記録する。
