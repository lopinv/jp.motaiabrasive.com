# 記事執筆規約（300 本 B2B 技術記事）

本ファイルは、`src/content/articles/<slug>.mdx` を人手執筆する際の**固定規約**。
各スライスのエージェントが同じ形に収束するための契約。事実の根拠はデータ層のみ。

## 0. 禁止事項（最優先）
- **スクリプトによる定型テンプレ堆積を禁止**。各記事は manifest の「観点(angle)」と対象モデル/業界/地域に基づき、導入・構成・FAQ を個別に組む。
- **未定義数値・性能・RPM・寿命・価格・MOQ・納期・認証・テスト結果・顧客実績の捏造を禁止**。欠けた値は「発注時に確認」or「未記載」と書く。
- **中国語・アラビア語の残留を禁止**。本文は標準日本語（商务技术文体）。術語の初出のみ（）に英借語。
- 用語は `src/data/glossary.ts` の固定訳法を使う（造語禁止）。
- `scaled content abuse`：タイトル・説明文・本文は記事ごとに固有。同型でも観点・対象・数値で差別化。

## 1. 出力先と命名
- ファイル：`src/content/articles/<slug>.mdx`（`_topics.json` の `slug` をそのまま使う。連番付与は不要）。
- UTF-8、LF、CRLF 不可。
- frontmatter（YAML）＋本文（HTML フラグメント）の順。

## 2. frontmatter スキーマ（`content.config.ts` に厳密準拠）
必須：`title` / `description` / `publishDate` / `category`。
推奨・利用：`author`(既定 "MoTai Abrasives" / "墨泰研磨材") / `productFamily`(family slug) / `productModel`(model slug、対象時) / `industry` / `jaRegion` / `keywords` / `primaryKeyword` / `secondaryKeywords` / `longTailKeywords` / `searchIntent` / `featuredImage` / `featuredImageAlt` / `internalLinks` / `externalLinks` / `cta` / `faq` / `specsTable` / `infoBoxes` / `voiceSearchQueries` / `buyerJourneyStage`。

- `publishDate`：全記事固定 `"2026-11-21T00:00:00.000Z"`（一斉公開）。
- `category`：`_topics.json` の `type` と一致（13 種の 1 つ）。
- `productFamily`：`_topics.json` の `family`（モデル付き時）。モデルなしで family が必要な比較記事は対象 family を指定。
- `featuredImage`：対象モデルの `image` を使う（`models.ts` の `image` 値、例 `/images/belt-533.webp`）。`featuredImageAlt` はモデルの `imageAlt`。family 記事・比較記事は `/images/flap-disc.jpg` 等 family 代表画像、汎用サービス記事は `/images/factory.jpg` または `/images/workshop.jpg`。**必ず実在画像のみ**（`public/images/` にあるもの）。
- `description`：90〜175 文字。本文の価値を端的に。主語を主キーワードで開く。
- `internalLinks`：≥3。要素 `{ url, anchorText, description? }`。`url` は**§4 のホワイトリストのみ**。
- `externalLinks`：0〜3。要素 `{ url, anchorText, source, year? }`。権威機関のみ（§5）。`year` は確定時だけ。
- `cta`：`{ type:"soft"|"hard", text, targetUrl:"/quote" }`。
- `faq`：≥3（モデル記事はモデルの faq を踏襲・改写、汎用記事は B2B 実務疑問）。要素 `{ q, a }`。
- `specsTable`：`{ パラメータ, 値 }` の配列（モデル記事は必須、数値は `models.ts` 準拠）。
- `infoBoxes`：`{ type, title, content }`、`content` は文字列（改行可）。`type`∈`quick-answer|spec-checklist|inquiry-checklist`。
- `voiceSearchQueries`：3 程度の発話風検索。

### YAML 書式（重要）
- 配列は flow：`keywords: ["a", "b", "c"]`。
- オブジェクト配列（internalLinks 等）は block。`- ` の直後改行しインデント：
```
internalLinks:
  -
    url: "/quote"
    anchorText: "見積依頼フォーム"
    description: "統一のお問い合わせ"
```
- 文字列は二重引用符。改行は `\n` で 1 行に。
- **YAML が壊れると全ビルド失敗**：`_` 始まり・先頭スペース注意。数値の「値」は文字列で囲む。

## 3. 本文（HTML フラグメント）
- 根は `<div dir="ltr" lang="ja">` 1 個で包む（クラス不要）。
- **H1 を書かない**（ページタイトルは frontmatter `title` が H1）。本文は `<h2>` / `<h3>`。
- 開頭は **BLUF**（結論を 1〜2 文）。「この記事では…します」式導入禁止。
- `<h2>` は ≥3。記事ごとに観点で切分（同型でも構成を変える）。
- モデル記事：`<table class="spec-table">` で主要仕様を 1 枚。列は「項目 / 値 / 読み方」等の固有。
- `<div class="info-box quick-answer" style="background:#eff6ff;border-left:4px solid #3b82f6;padding:1rem;margin:1.5rem 0;border-radius:8px 0 0 8px;">` を 1〜2 個。
- 末尾 CTA：`<div class="cta-band" style="background:#1e3a5f;color:#fff;padding:2rem;border-radius:12px;margin:2rem 0;text-align:center;">` + 見出し + `<a href="/quote" class="button button--primary" style="background:#fff;color:#1e3a5f;border:none;padding:0.75rem 1.5rem;border-radius:6px;font-weight:600;text-decoration:none;display:inline-block;margin-top:1rem;">`。
- 数値・単位は半角数字＋全角スペース（`115 mm`、`533 × 75 mm`）。目数は `40〜800` 風、全文統一。
- 本文に `<script>`/JSON-LD を**書かない**（構造化データは `[slug].astro` が frontmatter から自動出力）。
- FAQ は見出し「よくある質問」+ 短段落 or frontmatter `faq` に載せる（`details` は描画側が生成）。
- 安全・標準に触れる記事は PPE / 集じん / 製品ラベル遵守を 1 行添える。機構は推測せず「製品ラベルと機械マニュアルに従う」。

## 4. 内リンク ホワイトリスト（この中からだけ）
- `/products/{family}`：`abrasive-belts` `flap-discs` `sanding-discs` `hook-loop` `sanding-sponges`
- `/products/models/{model}`：32 中 slug（`_topics.json` の `model` が対象）
- `/industries/{industry}`：`woodworking` `metalworking` `automotive` `shipbuilding` `oil-gas` `construction` `general`
- `/industries` `/resources` `/resources/abrasive-grit-guide` `/resources/oem-packaging-guide`
- `/quality` `/company` `/contact` `/quote` `/shipping-oem` `/technical-specs` `/articles` `/`
- **杜撰スラッグ・未実在ルートを一切書かない。** 記事同士の自己参照（`/articles/<slug>`）は書かない（描画側が関連記事を自動付与）。

## 5. 外リンク（権威機関のみ、実在確認）
- FEPA `https://www.fepa-abrasives.org` / ISO `https://www.iso.org` / JISC `https://www.jisc.go.jp` / OSHA `https://www.osha.gov` / NIOSH `https://www.cdc.gov/niosh`
- 該当論点に直結する時だけ 1〜3 件。年（year）は確信ある時だけ。無理に載せない。

## 6. 事実の根拠（データ層のみ）
- 寸法・砥粒・基材・取付・用途・FAQ は `src/data/models.ts` の対象モデルから。
- 製品族・業界・サービスは `src/data/site.ts`（productCategories / industries / qualitySteps / resources）。
- 固定訳語は `src/data/glossary.ts`。
- 地域・港湾・海上輸送日数（7〜15日）は `src/templates/topic-matrix.ts` の jaRegions と整合。地域記事は「当地在庫・拠点・法人・専属代理店を持たない」「中国工場出荷」「最終適合は輸入者責任」を必ず明記（免責）。
- モデル `models.ts` に無ければモデル記事にしない。

## 7. 品質ゲート（後で自動検証）
- 同セル（model|type|industry|region）内 6-gram Jaccard ≤ 0.90、全文重複 0 → **本文は記事ごとに固有**。定型 CTA・表は許容だが本文骨格・FAQ・数値・観点で差別化。
- `title`・`description` は全 300 本で一意（geate 検証）。
- 全 internal link 実在、OGP 画像実在、H1 恰 1（描画側）。
- 各スライスは `quality-check` / `homogeneity-audit --gate` / `link-check` が通る状態を目指す。

## 8. 黄金例
`src/content/articles/spec-abrasive-belt-533x75.mdx` を読み、frontmatter の YAML 書式・本文 HTML・CTA・表の形で揃える。
**ただし黄金例の文を転用しない。** 各記事は対象・観点に応じて独自に書く。
```
