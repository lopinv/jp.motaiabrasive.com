/**
 * 文章内容生成器
 * 基于选题规格 + 模板 + 产品数据 生成符合提示词规范的日文文章 HTML
 * （日本站 jp.motaiabrasive.com，地域维度为日本地域 jaRegions）
 */

import { models, getModelByCategory } from '../data/models';
import { productCategories, industries, SITE, applicationScenes } from '../data/site';
import { glossary } from '../data/glossary';
import { articleTemplates, getTemplate, ArticleTemplate } from './article-templates';
import { TopicSpec, topicMatrix, jaRegions, industrySegments, keywordLibrary } from './topic-matrix';

// ========== 确定性种子（slug → 0..N 变体选择，保证可复现） ==========

/**
 * FNV-1a 32 位：同一 slug 永远同值（可增量重建），不同 slug 均匀落桶。
 * 用于驱动措辞模板/FAQ 滑窗/可选章节的确定性变体，降低同质化且无随机性。
 */
export function seedOf(slug: string, mod: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % mod;
}

/** 按种子从数组中取一个元素（空数组返回 undefined） */
function pickBySeed<T>(arr: T[], seed: number, mod: number): T | undefined {
  if (!arr?.length) return undefined;
  return arr[seed % arr.length];
}

// ========== 术语表快速查找 ==========

const termMap = new Map(glossary.map(g => [g.term.toLowerCase(), g.ja]));
const productTermMap: Record<string, string> = {
  'abrasive belts': '研磨ベルト',
  'sanding belts': 'サンディングベルト',
  'grinding belts': '研削ベルト',
  'abrasive discs': '研磨ディスク',
  'sanding discs': 'サンディングディスク',
  'flap discs': 'フラップディスク',
  'mesh sanding discs': 'メッシュディスク',
  'PSA': 'PSA（圧感型粘着）',
  'hook-and-loop': 'フック&ループ',
  'sanding sponges': '研磨スポンジ',
  'grit': '砥粒',
  'backing': '基材',
  'resin bond': '樹脂接着',
  'aluminum oxide': '酸化アルミニウム',
  'zirconia alumina': 'ジルコニアアルミナ',
  'ceramic': 'セラミック砥粒',
  'silicon carbide': '炭化シリコン（SiC）',
};

function t(term: string): string {
  return productTermMap[term.toLowerCase()] || termMap.get(term.toLowerCase()) || term;
}

// ========== 内容生成核心 ==========

export interface GeneratedArticle {
  frontmatter: Record<string, any>;
  html: string;
  slug: string;
}

function getModel(slug: string) {
  return models.find(m => m.slug === slug);
}

function getProductCategory(slug: string) {
  const cat = productCategories.find(c => c.slug === slug);
  if (!cat) {
    console.warn(`[WARN] Product category not found for slug: ${slug}`);
    // 返回一个最小的回退对象，避免后续代码报错
    return {
      slug,
      name: getProductFamilyNameJa(slug),
      title: '',
      description: '',
      image: '',
      applications: [],
      specs: [],
      faq: [],
    } as typeof productCategories[0];
  }
  return cat;
}

function getIndustry(slug: string) {
  return industries.find(i => i.slug === slug);
}

function getJaRegion(code: string) {
  return jaRegions.find(c => c.code === code);
}

/**
 * 生成单篇文章
 */
export function generateArticle(topic: TopicSpec): GeneratedArticle {
  const template = getTemplate(topic.articleType);
  if (!template) throw new Error(`Unknown template: ${topic.articleType}`);

  const model = topic.productModel ? getModel(topic.productModel) : null;
  const productCat = getProductCategory(topic.productFamily);
  const industry = getIndustry(topic.industry);
  const jaRegion = getJaRegion(topic.jaRegion);

  const frontmatter = buildFrontmatter(topic, template, model, productCat, industry, jaRegion);
  const html = buildArticleHTML(topic, template, model, productCat, industry, jaRegion);

  return { frontmatter, html, slug: topic.slug };
}

/**
 * 构建 Frontmatter（符合 Content Collections schema）
 */
function buildFrontmatter(
  topic: TopicSpec,
  template: ArticleTemplate,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
) {
  const now = new Date().toISOString();

  // 内链：至少 3 条
  const internalLinks = buildInternalLinks(topic, model, productCat, industry);

  // 外链：2-4 条权威来源
  const externalLinks = buildExternalLinks(topic, industry, jaRegion);

  // FAQ
  const faq = buildFAQ(topic, model, productCat, industry, jaRegion);

  // 规格表
  const specsTable = buildSpecsTable(topic, model, productCat);

  // 信息块
  const infoBoxes = buildInfoBoxes(topic, model, productCat, industry, jaRegion);

  // 语音搜索查询
  const voiceSearchQueries = buildVoiceSearchQueries(topic, model, productCat, industry, jaRegion);

  // CTA
  const cta = buildCTA(topic, model, productCat);

  return {
    title: topic.title,
    description: buildMetaDescription(topic, model, productCat),
    publishDate: now,
    updatedDate: now,
    author: 'MoTai Abrasives',
    category: topic.articleType,
    productFamily: topic.productFamily,
    productModel: topic.productModel,
    industry: topic.industry,
    jaRegion: topic.jaRegion,
    keywords: [topic.primaryKeyword, ...topic.secondaryKeywords, ...topic.longTailKeywords],
    primaryKeyword: topic.primaryKeyword,
    secondaryKeywords: topic.secondaryKeywords,
    longTailKeywords: topic.longTailKeywords,
    searchIntent: topic.searchIntent,
    featuredImage: model?.image ? `https://jp.motaiabrasive.com${model.image}` : productCat?.image ? `https://jp.motaiabrasive.com${productCat.image}` : undefined,
    featuredImageAlt: model?.imageAlt || productCat?.name,
    internalLinks,
    externalLinks,
    cta,
    faq,
    specsTable,
    infoBoxes,
    voiceSearchQueries,
    buyerJourneyStage: topic.buyerJourneyStage,
    notes: `Generated from topic matrix. Priority: P${topic.priority}. DedupeKey: ${topic.dedupeKey}`,
  };
}

/**
 * 构建文章 HTML 正文
 */
function buildArticleHTML(
  topic: TopicSpec,
  template: ArticleTemplate,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
): string {
  const sections: string[] = [];

  // 根容器
  sections.push('<div dir="ltr" lang="ja" class="article-content">');

  // 型号真实规格差异块（根 div 内、BLUF 前），保证同类目跨型号正文可区分（B 去重）
  sections.push(buildModelSpecBlock(model));

  // BLUF + 直接回答块
  sections.push(buildBLUF(topic, model, productCat, industry, jaRegion));
  sections.push(buildDirectAnswerBlock(topic, model, productCat, industry, jaRegion));

  // 按模板结构生成 H2 章节
  template.structure.forEach((h2Title, idx) => {
    const sectionHtml = buildSection(h2Title, topic, model, productCat, industry, jaRegion, template, idx);
    if (sectionHtml) sections.push(sectionHtml);
  });

  // 广度差异化：按种子插入 0–2 个可选附加章节（复用现有构建器，章节数随 slug 浮动）
  const optSeed = seedOf(topic.slug + ':opt', 1_000_000);
  const optionalSections: Array<{ title: string; build: () => string }> = [
    { title: '使い切りコスト（TCO）の最適化', build: () => buildCostOptimization(topic, model, productCat) },
    { title: '予防整備と使用寿命', build: () => buildPreventiveMaintenance(topic, model) },
    { title: '用語クイックカード', build: () => buildGlossaryCard(topic) },
  ];
  // 选 0–2 个：bit 各独立决定一个章节是否插入（k0 ~50%，k1 ~33%）
  for (let k = 0; k < 2; k++) {
    const on = k === 0 ? optSeed % 2 === 0 : optSeed % 3 === 0;
    if (on) {
      const sec = optionalSections[k];
      const html = sec.build();
      if (html) sections.push(`<h2>${sec.title}</h2>\n${html}`);
    }
  }

  // FAQ
  sections.push(buildFAQSection(topic, model, productCat, industry, jaRegion));

  // CTA
  sections.push(buildCTASection(topic, model, productCat));

  sections.push('</div>');

  return sections.join('\n\n');
}

/** 型号真实规格差异块（根 div 内、BLUF 前），保证同类目跨型号正文可区分（B 去重） */
function buildModelSpecBlock(model: typeof models[0] | null): string {
  if (!model) return '';
  const grits = model.gritRange.slice(0, 4).join('–') + (model.gritRange.length > 4 ? '…' : '');
  const lines = [
    // MDX 合法注释语法（HTML 注释 <!-- --> 在 MDX/JSX 中非法，会中断构建）
    '{/* model-spec-block */}',
    `<h2>${model.name} の仕様（主要な違い）</h2>`,
    `<ul class="plain-links">`,
    `  <li><strong>対応砥粒:</strong> ${grits}</li>`,
    `  <li><strong>基材:</strong> ${model.backing}</li>`,
    `  <li><strong>取付システム:</strong> ${model.attachment}</li>`,
    ...model.useCases.map((u) => `  <li><strong>主な用途:</strong> ${u}</li>`),
    ...model.notes.slice(0, 2).map((n) => `  <li><strong>技術メモ:</strong> ${n}</li>`),
    `</ul>`,
  ];
  return lines.join('\n');
}

/**
 * BLUF 开篇段
 */
function buildBLUF(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  const industryName = industry?.name || industrySegments.find(i => i.code === topic.industry)?.name || '';
  const regionName = jaRegion?.name === '全国' ? '全国' : (jaRegion ? `${jaRegion.name}地域` : '');
  // 确定性种子：同一 slug 永远同一组变体（可复现），不同 slug 均匀分散
  const sv = seedOf(topic.slug, 1_000_000);
  const pick3 = <T,>(arr: T[]) => pickBySeed(arr, sv, 3) ?? arr[0];
  const pick2 = <T,>(arr: T[]) => pickBySeed(arr, Math.floor(sv / 3), 2) ?? arr[0];
  // 型号专属数据注入（有型号才加）
  const useCase = model?.useCases?.length ? ` 補足用途：${pick2([...model.useCases])}。` : '';
  const note = model?.notes?.length ? ` ${pick2([...model.notes])}。` : '';
  // 行业痛点注入（site.ts industries + 全行业 fallback）
  const challenge = industry?.challenges?.length ? ` 最も多い課題：${industry.challenges[sv % industry.challenges.length]}。` : '';

  let bluf = '';

  switch (topic.articleType) {
    case 'product-comparison':
      bluf = pick3([
        `${productName}の選択は、加工材料・仕上げ工程・機械タイプに依存します。${industryName}（${regionName}）では、砥粒・ベルト幅/ディスク径・取付システムを発注前に確定します。`,
        `${productName}と代替品の判断は、材料・工程・機械の互換性という3軸で進めます。${industryName}（${regionName}）では、サイズと取付システムが選択の分かれ目です。`,
        `発注前に材料・工程・機械を確定し、${productName}から最適な仕様を選ぶ。砥粒・寸法・取付システムが${industryName}（${regionName}）での主要な判断軸です。`,
      ]);
      bluf += useCase;
      break;
    case 'buying-guide':
      bluf = pick3([
        `${productName}の仕様は3ステップで確定します：加工材料 → 仕上げ工程 → 機械の互換性。本ガイドは基準、砥粒シークエンス、見積依頼テンプレートまでカバーしています。`,
        `${productName}の正確な見積依頼は3つの質問から始まります：材料は何ですか、どの工程ですか、どの機械を使いますか。以下のガイドはその答えを、発注可能な仕様につなげます。`,
        `${productName}の見積依頼の前に、材料・工程・取付システムを確定しましょう。この3点が最終仕様の土台となり、砥粒シークエンスと見積依頼フォームにつながります。`,
      ]);
      bluf += useCase + challenge;
      break;
    case 'technical-guide':
      bluf = pick3([
        `${productName}の性能は砥粒（酸化アルミニウム・ジルコニアアルミナ・セラミック）、基材（布/紙/ポリマー）、接着剤の3要素で決まります。砥粒グレードは FEPA/ISO 基準で精密に示されます。`,
        `${productName}の性能を決める3要素：砥粒、基材、接着剤。砥粒は材料に合わせ、基材は機械に合わせ、グレードは FEPA P で指定します。`,
        `${productName}の理解は砥粒（Al₂O₃/SiC/ジルコニアアルミナ/セラミック）から始まり、次は基材と接着剤、そして FEPA P による砥粒読解です。ANSI や JIS と混同しないことが重要です。`,
      ]);
      bluf += note;
      break;
    case 'application-guide':
      bluf = pick3([
        `${industryName}（${regionName}）での ${productName} の工程は、粗削り → 中間仕上げ → 最終仕上げの3段階です。標準的な砥粒シークエンスは 60–80 → 120–180 → 240–400（材料次第）です。`,
        `${industryName}（${regionName}）への ${productName} の適用は、材料除去 → 平坦化 → 最終仕上げの3段階で進みます。砥粒シークエンスは 60–80 から始まり、240–400 以上で終えます。`,
        `${industryName}（${regionName}）では ${productName} の作業を粗→細の順で組みます：粗削り（60–80）、平坦化（120–180）、仕上げ（240–400+）。材料と仕上がり目標で調整します。`,
      ]);
      bluf += useCase + challenge;
      break;
    case 'process-tutorial':
      bluf = pick2([
        `${industryName || '用途'}における${productName}の標準工程：表面準備 → 粗削り砥粒 → 中間砥粒 → 仕上げ砥粒。各段階に機械パラメータ設定があります。`,
        `${industryName || '用途'}での${productName}の作業手順：表面清掃、粗削り、平坦化、仕上げの順です。速度・圧力・送り量は各段階で調整します。`,
      ]);
      bluf += note;
      break;
    case 'troubleshooting':
      bluf = pick3([
        `${productName}のよくある不具合（摩耗が早い、ローディング、ベルト偏位）は、砥粒不適合・圧力過大・速度不一致・集じん不足に起因することが多いです。下の表で症状→原因→対策を対応付けます。`,
        `${productName}で異常な摩耗・ローディング・偏位を見たら、順に確認：砥粒、圧力、速度、集じんシステム。各症状には原因と直接的な対策があります。`,
        `${productName}の不具合診断は、観察された症状（摩耗速度、付着パターン、偏位方向）から始め、原因を特定します：砥粒不適合、過大な荷重、集じん不足などです。`,
      ]);
      bluf += useCase;
      break;
    case 'product-spec-detail':
      bluf = pick2([
        `${model?.name || productName}: ${model?.summary || productCat?.description || '詳細仕様は以下の表を参照'}。サイズ: ${model?.sizeJa || '複数'}、砥粒: ${model?.gritRange.join('、') || 'お見積り対応'}、基材: ${model?.backing || '購入者と確認'}。`,
        `${model?.name || productName} はサイズ ${model?.sizeJa || '複数'}、砥粒 ${model?.gritRange.join('–') || 'お見積り対応'}、基材 ${model?.backing || '購入者と確認'} で供給可能です。完全な詳細とカスタマイズオプションは下表を参照してください。`,
      ]);
      bluf += note;
      break;
    case 'procurement-guide':
      bluf = pick3([
        `${productName}のプロ的な調達：1) 完全な技術仕様の作成 2) 比較用のサンプル依頼 3) 統一マトリクスでのサプライヤー評価 4) 総合見積比較（価格+輸送+条件）5) 契約と品質条件の確定。`,
        `${productName}の調達は、明確な書面仕様から始まり、サンプル照合、統一基準によるサプライヤー評価、総合見積比較、契約条項の確定まで進みます。`,
        `${productName}の大量調達でトラブルを避けるには：仕様の作成、サンプル依頼、統一マトリクスでのサプライヤー評価、総合価格・納期・条件の見積比較。以下に詳細手順をまとめます。`,
      ]);
      bluf += useCase + challenge;
      break;
    case 'wholesale-oem-guide':
      bluf = pick3([
        `${productName}の卸売/OEM協業：カスタマイズオプション（ロゴ、包装、カラー）を確定し、最小注文数量、サンプル確認工程、納品スケジュールを計画します。詳細は下のガイドを参照してください。`,
        `${productName}のOEM/大量発注には、ロゴ・包装ファイルと必要砥粒グレードの確定が先です。量産前にサンプルを承認します。カスタマイズオプションとMOQは下表に示します。`,
        `${productName}の卸売・OEMは5つの工程で進みます：仕様確定、サンプル、承認、量産、納品確認。包装とカスタマイズの詳細は以下のガイドにまとめます。`,
      ]);
      bluf += note;
      break;
    case 'industry-market':
      bluf = pick2([
        `${regionName || '日本'}の${industryName}業界では、規格のアップデート（JIS/JANSI/ISO/FEPA）とセラミック・ジルコニアアルミナ砥粒への移行が進んでいます。${productName}の調達判断への影響：仕様の詳細化、評価期間の短縮。`,
        `${regionName || '日本'}の${industryName}業界の変化（JIS/JANSI/ISO/FEPA規格、高性能砥粒、厳密な文書管理）により、${productName}の購入はブランド名ではなく仕様が基準になるよう変わっています。`,
      ]);
      bluf += challenge;
      break;
    case 'jp-regional-sourcing':
      bluf = pick3([
        `${regionName}への${productName}の輸入：JIS/JANSI適合要件の確認、主要港湾 ${getMainPort(jaRegion?.code)} での通関、海上輸送7–15日、決済はLC/TT。当社は当地に在庫も拠点も保有していません。`,
        `${regionName}への${productName}供給計画には：JIS/JANSI適合、${getMainPort(jaRegion?.code)} 経由の通関、海上7–15日のリードタイム、LC/TT決済。工場直送で当地在庫なし。`,
        `${regionName}へのスムーズな輸入のため：適合証書の準備、通関港（${getMainPort(jaRegion?.code)}）の確定、決済手段（LC/TT）の調整。当地に在庫も拠点もありません。`,
      ]);
      bluf += useCase;
      break;
    case 'faq-buyers-guide':
      bluf = pick2([
        `${productName}の購入者が最もよく尋ねる3点：1) ${industryName}に合う砥粒は？→ 工程段階で決まります。2) MOQは？→ 仕様で決まります。3) 納期は？→ 数量と仕様で見積りで確定します。詳細は下の質問セクションを参照ください。`,
        `${productName}の購入者によくある質問：${industryName}への砥粒選定、MOQ、納期。直接回答と、完成した見積依頼テンプレートは下のセクションにまとめます。`,
      ]);
      bluf += challenge;
      break;
    default:
      bluf = `${productName}（${industryName}${regionName ? ` ${regionName}` : ''}）：仕様、砥粒、発注手順は以下のとおりです。`;
      bluf += useCase;
  }

  return `<p class="bluf"><strong>${bluf}</strong></p>`;
}

/**
 * 直接回答块（AEO 优化）
 */
function buildDirectAnswerBlock(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  let answer = '';

  switch (topic.articleType) {
    case 'product-comparison':
      answer = `${productName}は、広範囲の材料を素早く除去しながら仕上げを制御したい場合に適しています。代替品（他のディスク/ベルト）は、狭いスペースや機械が異なる場合、細かな作業に向きます。`;
      break;
    case 'buying-guide':
      answer = `確定するのは：1) 加工材料（木/金属/プラスチック）2) 工程（粗削り/仕上げ/最終）3) 機械と取付サイズ。その後砥粒を選択：40–80 は除去、100–180 は仕上げ、240+ は最終仕上げ。`;
      break;
    case 'technical-guide':
      answer = `砥粒：酸化アルミニウム（汎用）、ジルコニアアルミナ（高硬度金属）、セラミック（高耐久）。基材：布（柔軟）、紙（寸法安定）、ポリマー（耐湿）。接着剤：耐熱性樹脂。砥粒グレードは FEPA P で指定。`;
      break;
    case 'application-guide':
      answer = `標準シークエンス：砥粒 60–80（錆・塗料・材料の除去）→ 120–180（平坦化）→ 240–400（最終仕上げ）。${industry?.name} では追加で：清掃 → 検査 → 塗装/コーティング準備。`;
      break;
    case 'process-tutorial':
      answer = `手順：1) 部品の清掃 2) 最初の砥粒の選択 3) 機械の速度/圧力設定 4) 段階的なサンディング 5) 工程間の清掃 6) 最終検査。パラメータは材料と機械で変わります。`;
      break;
    case 'troubleshooting':
      answer = `摩耗が早い → 細い砥粒か圧力軽減。ローディング → メッシュディスクまたは冷却。偏位 → ローラーの調整とベルト方向の確認。集じん不足 → フィルターと吸い込み経路の清掃。`;
      break;
    case 'product-spec-detail':
      answer = `${model?.name || productName}: サイズ ${model?.sizeJa || '複数'}、砥粒 ${model?.gritRange.join('–') || 'お見積り対応'}、基材 ${model?.backing || '布/紙/ポリマー'}、取付 ${model?.attachment || '機械に依存'}。`;
      break;
    case 'procurement-guide':
      answer = `技術仕様：製品、寸法、砥粒、基材、取付、数量、包装、出荷先。評価：総合価格、納期、証書、OEM柔軟性、納品実績。契約：決済条件、遅延ペナルティ、品質基準。`;
      break;
    case 'wholesale-oem-guide':
      answer = `OEMには：ベクトルロゴデータ、包装図面、ターゲット市場の言語、印刷仕様の確定が必要。MOQは製品とカスタマイズ内容で決まります。量産前にサンプルを承認します。`;
      break;
    case 'industry-market':
      answer = `最新の規格（JIS、JANSI、ISO 6344、FEPA P）は砥粒の均一性と粉塵排出の厳格化を求めています。動向：高負荷向けセラミック/ジルコニアアルミナ砥粒、湿環境向けポリマー基材。`;
      break;
    case 'jp-regional-sourcing':
      answer = `必要事項：JIS/JANSI 規格適合の確認。主要港湾：${getMainPort(jaRegion?.code)}。海上 7–15 日。決済：LC（信用状）またはTT（前払い）。当地に在庫はありません。`;
      break;
    case 'faq-buyers-guide':
      answer = `1) 砥粒はどう選ぶ？→ 工程段階で決まります。2) MOQは？→ 仕様で決まります。3) 納期は？→ 見積りで確定します。4) OEM対応？→ 可能です、条件付き。5) 見積依頼は？→ 完全な仕様付きの見積依頼テンプレートを使用してください。`;
      break;
    default:
      answer = `直接回答：${productName} は材料、工程、機械に応じて選択します。詳細は記事内にあります。`;
  }

  return `
<div class="direct-answer" style="background:#f5f8ff;border-left:4px solid #2563eb;padding:1rem;margin:1.5rem 0;border-radius:8px 0 0 8px;">
  <strong>直接回答：</strong> ${answer}
</div>`;
}

/**
 * 构建各章节
 */
function buildSection(
  h2Title: string,
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined,
  template: ArticleTemplate,
  idx: number
): string {
  let content = '';
  const type = topic.articleType;

  // JP Regional Sourcing - 精确逐节匹配
  if (type === 'jp-regional-sourcing') {
    if (h2Title.includes('法規制') || h2Title.includes('適合') || h2Title.includes('JIS') || h2Title.includes('JANSI')) {
      content = buildImportCompliance(jaRegion);
    }
    else if (h2Title.includes('物流') || h2Title.includes('港湾') || h2Title.includes('通関') || h2Title.includes('ルート')) {
      content = buildLogisticsPorts(jaRegion);
    }
    else if (h2Title.includes('販売') || h2Title.includes('代理') || h2Title.includes('モデル')) {
      content = buildDistributionModel(jaRegion);
    }
    else if (h2Title.includes('決済') || h2Title.includes('取引条件')) {
      content = buildPaymentTerms(jaRegion);
    }
    else if (h2Title.includes('商務文化')) {
      content = buildCulturalNotes(jaRegion);
    }
    else if (h2Title.includes('免責')) {
      content = buildDisclaimer(jaRegion);
    }
  }
  // Industry Market - 精确逐节匹配
  else if (type === 'industry-market') {
    if (h2Title.includes('背景') || h2Title.includes('推進')) {
      content = buildMarketContext(topic, industry, jaRegion);
    }
    else if (h2Title.includes('アップデート') || h2Title.includes('規格') || h2Title.includes('JIS') || h2Title.includes('JANSI') || h2Title.includes('FEPA') || h2Title.includes('ISO')) {
      content = buildStandardsAnalysis(topic, industry, jaRegion);
    }
    else if (h2Title.includes('市場規模') || h2Title.includes('データ') || h2Title.includes('成長')) {
      content = buildMarketData(topic, industry, jaRegion);
    }
    else if (h2Title.includes('技術トレンド') || h2Title.includes('イノベーション')) {
      content = buildTechTrends(topic, industry, jaRegion);
    }
    else if (h2Title.includes('調達') || h2Title.includes('判断')) {
      content = buildProcurementImplications(topic, industry, jaRegion);
    }
  }
  // Procurement Guide - 精确逐节匹配
  else if (type === 'procurement-guide') {
    if (h2Title.includes('手法') || h2Title.includes('5ステップ')) {
      content = buildDecisionGuide(topic, model, productCat, industry);
    }
    else if (h2Title.includes('統一') || h2Title.includes('テンプレート')) {
      content = buildProcurementTemplate(topic, model, productCat);
    }
    else if (h2Title.includes('サンプル評価') || h2Title.includes('カード')) {
      content = buildSampleEvaluation(topic, model, productCat);
    }
    else if (h2Title.includes('評価マトリクス') || h2Title.includes('サプライヤー')) {
      content = buildSupplierMatrix(topic, model, productCat);
    }
    else if (h2Title.includes('見積比較') || h2Title.includes('ポイント')) {
      content = buildQuoteComparison(topic, model, productCat);
    }
    else if (h2Title.includes('ミス') || h2Title.includes('回避')) {
      content = buildCommonMistakes(topic, model, productCat);
    }
    else if (h2Title.includes('契約') || h2Title.includes('納品')) {
      content = buildContractTerms(topic, model, productCat);
    }
  }
  // Wholesale OEM Guide - 精确逐节匹配
  else if (type === 'wholesale-oem-guide') {
    if (h2Title.includes('工程') || h2Title.includes('概要') || h2Title.includes('OEM')) {
      content = buildOEMOverview(topic, model, productCat);
    }
    else if (h2Title.includes('カスタマイズ') || h2Title.includes('オプション')) {
      content = buildOEMOptions(topic, model, productCat);
    }
    else if (h2Title.includes('包装') || h2Title.includes('ブランド') || h2Title.includes('設計')) {
      content = buildPackagingSpecs(topic, model, productCat);
    }
    else if (h2Title.includes('MOQ') || h2Title.includes('価格帯') || h2Title.includes('最小注文')) {
      content = buildMOQPricing(topic, model, productCat);
    }
    else if (h2Title.includes('サンプル確認') || h2Title.includes('承認')) {
      content = buildSampleApproval(topic, model, productCat);
    }
    else if (h2Title.includes('品質検査') || h2Title.includes('受入')) {
      content = buildQAStandards(topic, model, productCat);
    }
    else if (h2Title.includes('物流') || h2Title.includes('通関')) {
      content = buildLogisticsCustoms(topic, model, productCat);
    }
    else if (h2Title.includes('長期') || h2Title.includes('協業') || h2Title.includes('フレームワーク')) {
      content = buildPartnershipFramework(topic, model, productCat);
    }
  }
  // Application Guide - 精确逐节匹配
  else if (type === 'application-guide') {
    if (h2Title.includes('課題') || h2Title.includes('ソリューション')) {
      content = buildPainPoints(topic, model, productCat, industry);
    }
    else if (h2Title.includes('工程') || h2Title.includes('ステップ') || h2Title.includes('プロセス')) {
      content = buildApplicationSection(topic, model, productCat, industry, jaRegion);
    }
    else if (h2Title.includes('製品構成') || h2Title.includes('砥粒シークエンス')) {
      content = buildProductCombo(topic, model, productCat, industry);
    }
    else if (h2Title.includes('パラメータ') || h2Title.includes('設定')) {
      content = buildProcessParams(topic, model, productCat);
    }
    else if (h2Title.includes('安全') || h2Title.includes('コンプライアンス')) {
      content = buildSafetyCompliance(topic, industry, jaRegion);
    }
    else if (h2Title.includes('コスト') || h2Title.includes('最適化') || h2Title.includes('トレードオフ')) {
      content = buildCostOptimization(topic, model, productCat);
    }
    else if (h2Title.includes('テンプレート') || h2Title.includes('調達')) {
      content = buildProcurementTemplate(topic, model, productCat);
    }
  }
  // Buying Guide - 精确逐节匹配
  else if (type === 'buying-guide') {
    if (h2Title.includes('3ステップ') || h2Title.includes('判定フロー')) {
      content = buildDecisionGuide(topic, model, productCat, industry);
    }
    else if (h2Title.includes('判定基準') || h2Title.includes('テーブル')) {
      content = buildKeyParamsTable(topic, model, productCat);
    }
    else if (h2Title.includes('砥粒シークエンス') || h2Title.includes('材料') || h2Title.includes('推奨')) {
      content = buildGritSequenceTable(topic, model, productCat, industry);
    }
    else if (h2Title.includes('互換性') || h2Title.includes('チェック')) {
      content = buildCompatibilityChecklist(topic, model, productCat);
    }
    else if (h2Title.includes('評価') || h2Title.includes('サンプル')) {
      content = buildSampleEvaluation(topic, model, productCat);
    }
    else if (h2Title.includes('情報') || h2Title.includes('依頼前')) {
      content = buildInquiryChecklist(topic, model, productCat);
    }
  }
  // Product Comparison
  else if (type === 'product-comparison') {
    if (h2Title.includes('直接回答')) {
      content = buildComparisonDirectAnswer(topic, model, productCat);
    }
    else if (h2Title.includes('違い') || h2Title.includes('比較')) {
      content = buildComparisonTable(topic, model, productCat);
    }
    else if (h2Title.includes('判断') || h2Title.includes('フロー') || h2Title.includes('シナリオ')) {
      content = buildApplicationDecisionTree(topic, model, productCat, industry);
    }
    else if (h2Title.includes('パラメータ') || h2Title.includes('仕様') || h2Title.includes('分析')) {
      content = buildSpecsSection(topic, model, productCat);
    }
    else if (h2Title.includes('ミス') || h2Title.includes('よくある')) {
      content = buildCommonMistakes(topic, model, productCat);
    }
    else if (h2Title.includes('調達') || h2Title.includes('確認') || h2Title.includes('チェック')) {
      content = buildProcurementChecklist(topic, model, productCat);
    }
  }
  // Multi Product Comparison
  else if (type === 'multi-product-comparison') {
    if (h2Title.includes('一言') || h2Title.includes('本質')) {
      content = buildComparisonDirectAnswer(topic, model, productCat);
    }
    else if (h2Title.includes('マトリクス') || h2Title.includes('多次元')) {
      content = buildMultiComparisonMatrix(topic, model, productCat);
    }
    else if (h2Title.includes('バリアント') || h2Title.includes('作業条件')) {
      content = buildVariantDetails(topic, model, productCat);
    }
    else if (h2Title.includes('性能') || h2Title.includes('コスト') || h2Title.includes('トレードオフ')) {
      content = buildCostPerformanceTradeoff(topic, model, productCat);
    }
    else if (h2Title.includes('互換') || h2Title.includes('機械')) {
      content = buildMachineCompatibility(topic, model, productCat);
    }
    else if (h2Title.includes('大量') || h2Title.includes('購入')) {
      content = buildBulkProcurementAdvice(topic, model, productCat);
    }
  }
  // Technical Guide
  else if (type === 'technical-guide') {
    if (h2Title.includes('核心概念')) {
      content = buildTechConceptSummary(topic, model, productCat);
    }
    else if (h2Title.includes('原理') || h2Title.includes('詳細分析')) {
      content = buildTechDeepDive(topic, model, productCat);
    }
    else if (h2Title.includes('規格') || h2Title.includes('JIS') || h2Title.includes('ANSI') || h2Title.includes('FEPA')) {
      content = buildStandardsComparison(topic, model, productCat);
    }
    else if (h2Title.includes('影響')) {
      content = buildParameterImpact(topic, model, productCat);
    }
    else if (h2Title.includes('誤解') || h2Title.includes('解消')) {
      content = buildMythBusting(topic, model, productCat);
    }
    else if (h2Title.includes('クイック') || h2Title.includes('参考')) {
      content = buildSpecChecklist(topic, model, productCat);
    }
  }
  // Process Tutorial
  else if (type === 'process-tutorial') {
    if (h2Title.includes('全体像')) {
      content = buildProcessOverview(topic, model, industry);
    }
    else if (h2Title.includes('段階') || h2Title.includes('オペレーション')) {
      content = buildProcessSteps(topic, model, productCat, industry);
    }
    else if (h2Title.includes('シークエンス') || h2Title.includes('原理')) {
      content = buildGritProgressionTable(topic, model, industry);
    }
    else if (h2Title.includes('管理') || h2Title.includes('検査')) {
      content = buildQualityControl(topic, model, industry);
    }
    else if (h2Title.includes('不具合') || h2Title.includes('対策')) {
      content = buildDefectTroubleshooting(topic, model, industry);
    }
    else if (h2Title.includes('材料') || h2Title.includes('調整')) {
      content = buildMaterialAdjustments(topic, model, industry);
    }
    else if (h2Title.includes('安全')) {
      content = buildSafetyTips(topic, industry);
    }
  }
  // Troubleshooting
  else if (type === 'troubleshooting') {
    if (h2Title.includes('クイック') || h2Title.includes('テーブル')) {
      content = buildTroubleshootingTable(topic, model);
    }
    else if (h2Title.includes('分類') || h2Title.includes('診断')) {
      content = buildFailureClassification(topic, model);
    }
    else if (h2Title.includes('詳細') || h2Title.includes('分析')) {
      content = buildRootCauseAnalysis(topic, model);
    }
    else if (h2Title.includes('根本') || h2Title.includes('チェック')) {
      content = buildRootCauseChecklist(topic, model);
    }
    else if (h2Title.includes('予防') || h2Title.includes('整備')) {
      content = buildPreventiveMaintenance(topic, model);
    }
    else if (h2Title.includes('サポート') || h2Title.includes('相談')) {
      content = buildSupportEscalation();
    }
  }
  // Product Spec Detail
  else if (type === 'product-spec-detail') {
    if (h2Title.includes('ポジショニング') || h2Title.includes('適用')) {
      content = buildProductPositioning(topic, model, productCat);
    }
    else if (h2Title.includes('完全') || h2Title.includes('仕様テーブル')) {
      content = buildFullSpecsTable(topic, model, productCat);
    }
    else if (h2Title.includes('設計') || h2Title.includes('原理') || h2Title.includes('特性')) {
      content = buildDesignPrinciples(topic, model, productCat);
    }
    else if (h2Title.includes('対応') || h2Title.includes('機械') || h2Title.includes('取付')) {
      content = buildCompatibilityGuide(topic, model, productCat);
    }
    else if (h2Title.includes('カスタマイズ') || h2Title.includes('オプション')) {
      content = buildCustomizationOptions(topic, model, productCat);
    }
    else if (h2Title.includes('発注') || h2Title.includes('MOQ') || h2Title.includes('納期')) {
      content = buildOrderingInfo(topic, model, productCat);
    }
  }
  // FAQ Buyers Guide
  else if (type === 'faq-buyers-guide') {
    if (h2Title.includes('3つの') || h2Title.includes('主要')) {
      content = buildTop3FAQ(topic, model, productCat);
    }
    else if (h2Title.includes('テーマ') || h2Title.includes('質問')) {
      content = '<p>下の質問はテーマ別にグループ化されており、素早い参照が可能です。</p>';
    }
    else if (h2Title.includes('参考テーブル')) {
      content = buildDecisionReferenceTable(topic, model, productCat);
    }
    else if (h2Title.includes('テンプレート') || h2Title.includes('見積')) {
      content = buildInquiryTemplate(topic);
    }
    else if (h2Title.includes('用語') || h2Title.includes('カード')) {
      content = buildGlossaryCard(topic);
    }
    else if (h2Title.includes('連絡') || h2Title.includes('チャネル')) {
      content = buildContactInfo();
    }
  }
  // 其他类型的通用匹配
  else {
    // 通用规格表
    if (h2Title.includes('仕様') || h2Title.includes('パラメータ')) {
      content = buildSpecsSection(topic, model, productCat);
    }
    // 通用应用
    else if (h2Title.includes('適用') || h2Title.includes('工程')) {
      content = buildApplicationSection(topic, model, productCat, industry, jaRegion);
    }
    // 通用步骤
    else if (h2Title.includes('手順') || h2Title.includes('ステップ')) {
      content = buildProcessSteps(topic, model, productCat, industry);
    }
    // 通用安全
    else if (h2Title.includes('安全') || h2Title.includes('規格')) {
      content = buildSafetyCompliance(topic, industry, jaRegion);
    }
    // 通用成本
    else if (h2Title.includes('コスト') || h2Title.includes('最適化')) {
      content = buildCostOptimization(topic, model, productCat);
    }
  }

  // 信息块插入（在合适位置）
  const infoBoxHtml = buildInlineInfoBoxes(topic, idx);
  if (infoBoxHtml) content = infoBoxHtml + '\n\n' + content;

  if (!content) return '';

  return `<h2>${h2Title}</h2>\n${content}`;
}

// 专门的故障排查详情构建
function buildTroubleshootingDetail(
  topic: TopicSpec,
  model: typeof models[0] | null,
  h2Title: string
): string {
  if (h2Title.includes('分類')) {
    return buildComparisonTable(topic, model, undefined); // 复用表格结构做故障-原因-对策表
  }
  if (h2Title.includes('分析')) {
    return buildRootCauseAnalysis(topic, model);
  }
  if (h2Title.includes('予防')) {
    return buildPreventiveMaintenance(topic, model);
  }
  if (h2Title.includes('相談')) {
    return buildSupportEscalation();
  }
  return '';
}

// 专门的 FAQ 买家指南详情
function buildFAQBuyersDetail(
  topic: TopicSpec,
  model: typeof models[0] | null,
  h2Title: string
): string {
  if (h2Title.includes('テーマ')) {
    return '<p>下の質問はテーマ別にグループ化されており、素早い参照が可能です。</p>';
  }
  if (h2Title.includes('判断')) {
    return buildDecisionGuide(topic, model, undefined, undefined);
  }
  if (h2Title.includes('テンプレート')) {
    return buildInquiryTemplate(topic);
  }
  if (h2Title.includes('用語')) {
    return buildGlossaryCard(topic);
  }
  if (h2Title.includes('連絡')) {
    return buildContactInfo();
  }
  return '';
}

// ========== 缺失的辅助函数 ==========

function buildKeyParamsTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>${productName} 選択の主要基準</h3>
<table class="spec-table">
  <thead><tr><th>基準</th><th>内容</th><th>確定方法</th></tr></thead>
  <tbody>
    <tr><td>加工材料</td><td>木、金属、プラスチック、複合材</td><td>材料を特定</td></tr>
    <tr><td>工程</td><td>粗削り / 仕上げ / 最終</td><td>砥粒：40–80 / 100–180 / 240+</td></tr>
    <tr><td>取付システム</td><td>フック&ループ / PSA / メッシュ</td><td>機械のベースと照合</td></tr>
    <tr><td>寸法</td><td>長さ×幅（ベルト）/ 径（ディスク）</td><td>機械マニュアル参照</td></tr>
    <tr><td>砥粒タイプ</td><td>酸化アルミニウム / ジルコニアアルミナ / セラミック</td><td>材料の硬度に応じて</td></tr>
    <tr><td>基材</td><td>布 / 紙 / ポリマー</td><td>柔軟性と寸法安定性のバランス</td></tr>
  </tbody>
</table>`;
}

function buildGritSequenceTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const industryName = industry?.name || '';
  return `
<h3>${industryName} の推奨砥粒シークエンス</h3>
<table class="spec-table">
  <thead><tr><th>工程</th><th>砥粒（FEPA P）</th><th>目的</th><th>メモ</th></tr></thead>
  <tbody>
    <tr><td>材料/錆/塗料の除去</td><td>40 – 80</td><td>高能率の除去</td><td>金属にはジルコニアアルミナ/セラミック</td></tr>
    <tr><td>中間仕上げ</td><td>100 – 180</td><td>前工程の痕の平坦化</td><td>汎用の酸化アルミニウム</td></tr>
    <tr><td>細目仕上げ</td><td>240 – 400</td><td>塗装準備</td><td>過度な光沢化を避ける</td></tr>
    <tr><td>最終仕上げ</td><td>600 – 1500+</td><td>見える面/精密面</td><td>家具・自動車・精密加工</td></tr>
  </tbody>
</table>`;
}

function buildCompatibilityChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>機械互換性の確認チェックリスト</h3>
<ul class="plain-links">
  <li>☐ ベルト/ディスクの寸法が機械の仕様と一致</li>
  <li>☐ 取付システム（フック&ループ / PSA / メッシュ）がベースと互換</li>
  <li>☐ ベルトの回転方向が正しい（ベルトの場合）</li>
  <li>☐ ジョイント方式が適切（ストレート/斜め/インターロック）</li>
  <li>☐ 機械速度（RPM）が製品の限度内</li>
  <li>☐ 集じんシステムがディスクタイプ（穴あき/メッシュ）と適合</li>
  <li>☐ パッドの状態が良好（特にフック&ループ）</li>
</ul>`;
}

function buildInquiryChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildProcurementTemplate(topic, model, productCat);
}

function buildComparisonDirectAnswer(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  const altProduct = getAlternativeProduct(topic.productFamily);
  return `
<p>${productName} は、広い面で仕上げを制御しながら材料を速く/中程度に除去する場合に適しています。${altProduct} は狭い場所、機械が合わない場合、細かな作業に向きます。</p>`;
}

function buildApplicationDecisionTree(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  return buildDecisionGuide(topic, model, productCat, industry);
}

function buildProcurementChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildInquiryChecklist(topic, model, productCat);
}

function buildMultiComparisonMatrix(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildComparisonTable(topic, model, productCat);
}

function buildVariantDetails(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildApplicationSection(topic, model, productCat, undefined, undefined);
}

function buildCostPerformanceTradeoff(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCostOptimization(topic, model, productCat);
}

function buildMachineCompatibility(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCompatibilityChecklist(topic, model, productCat);
}

function buildBulkProcurementAdvice(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildProcurementTemplate(topic, model, productCat);
}

function buildTechConceptSummary(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<p>${productName} は3つの基本要素で構成されます：<strong>砥粒</strong>（酸化アルミニウム、ジルコニアアルミナ、セラミック）が切削力を決まり、<strong>基材</strong>（布、紙、ポリマー）が柔軟性と寸法安定性を決まり、<strong>樹脂接着</strong>が砥粒を固定し耐熱性を確保します。砥粒グレードの FEPA P 表記が国際的な均一性を保証します。</p>`;
}

function buildTechDeepDive(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildApplicationSection(topic, model, productCat, undefined, undefined);
}

function buildStandardsComparison(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>砥粒規格体系の比較</h3>
<table class="spec-table">
  <thead><tr><th>JIS（日本）</th><th>FEPA P（欧州）</th><th>ANSI（米国）</th><th>メモ</th></tr></thead>
  <tbody>
    <tr><td>40</td><td>P40</td><td>40</td><td>粗目はほぼ一致</td></tr>
    <tr><td>80</td><td>P80</td><td>80</td><td></td></tr>
    <tr><td>120</td><td>P120</td><td>120</td><td></td></tr>
    <tr><td>240</td><td>P240</td><td>240</td><td>細目から差異が出てくる</td></tr>
    <tr><td>400</td><td>P400</td><td>360</td><td>ANSIは小さい数字で細目</td></tr>
    <tr><td>800</td><td>P800</td><td>600</td><td></td></tr>
    <tr><td>1200</td><td>P1200</td><td>800</td><td>JIS/FEPAの方が細い</td></tr>
  </tbody>
</table>
<p><strong>原則：</strong>すべての仕様で1つの規格体系（FEPA P が国際的に推奨）に統一してください。1つの依頼で規格を混在しないこと。</p>`;
}

function buildParameterImpact(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>主要パラメータが性能に与える影響</h3>
<table class="spec-table">
  <thead><tr><th>パラメータ</th><th>値を大きくした影響</th><th>値を小さくした影響</th></tr></thead>
  <tbody>
    <tr><td>砥粒（細目）</td><td>滑らかな仕上げ、除去速度低下</td><td>除去速度向上、深い傷</td></tr>
    <tr><td>作業圧力</td><td>切削速くなる、発熱、摩耗加速</td><td>切削遅くなる、発熱減、寿命延長</td></tr>
    <tr><td>機械速度</td><td>除去速くなる、焼き付きリスク</td><td>制御向上、除去遅くなる</td></tr>
    <tr><td>送り速度</td><td>生産性向上、荒い仕上げ</td><td>滑らかな仕上げ、時間増加</td></tr>
    <tr><td>砥粒の硬度</td><td>高硬度材料で寿命延長</td><td>コスト低、割れやすい</td></tr>
  </tbody>
</table>`;
}

function buildMythBusting(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCommonMistakes(topic, model, productCat);
}

function buildSpecChecklist(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildSpecsSection(topic, model, productCat);
}

function buildProcessOverview(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  const industryName = industry?.name || '';
  return `
<h3>工程概要 - ${industryName}</h3>
<p>標準的なサンディング工程は4段階で進みます：準備 → 粗削り → 中間平坦化 → 最終仕上げ。各段階は指定砥粒、機械パラメータの調整、次段階前の品質検査が必要です。</p>`;
}

function buildGritProgressionTable(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return buildGritSequenceTable(topic, model, undefined, industry);
}

function buildQualityControl(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return `
<h3>重要管理点と検査基準</h3>
<table class="spec-table">
  <thead><tr><th>管理点</th><th>基準</th><th>検査方法</th><th>頻度</th></tr></thead>
  <tbody>
    <tr><td>表面粗さ（Ra）</td><td>図面仕様に準拠</td><td>ポータブル粗さ計</td><td>50点ごとに</td></tr>
    <tr><td>表面外観</td><td>深い傷/マークなし</td><td>標準照明での目視</td><td>全数</td></tr>
    <tr><td>寸法</td><td>許容公差内</td><td>ノギス/マイクロメータ</td><td>初品/終品/ロットごと</td></tr>
    <tr><td>ベルト/ディスク状態</td><td>摩耗均一、損傷なし</td><td>目視</td><td>砥粒交換時</td></tr>
  </tbody>
</table>`;
}

function buildDefectTroubleshooting(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return `
<h3>よくある製造不良と対策</h3>
<table class="spec-table">
  <thead><tr><th>不良</th><th>考えられる原因</th><th>対策</th></tr></thead>
  <tbody>
    <tr><td>深い傷/均一でない</td><td>砥粒が粗すぎる、圧力過大、ベルト破損</td><td>細い砥粒へ、圧力軽減、ベルト交換</td></tr>
    <tr><td>光沢/焼き付き</td><td>高速度、高圧力、冷却不足</td><td>RPM下げ、圧力軽減、集じん/冷却改善</td></tr>
    <tr><td>仕上げの不均一</td><td>ベルト偏位、ローラー劣化、送りが不規則</td><td>アライメント修正、ローラー交換、送りを一定に</td></tr>
    <tr><td>ローディング</td><td>粘着材料、砥粒が細すぎる、集じん不足</td><td>清掃/交換、正しい砥粒シークエンス、フィルター清掃</td></tr>
  </tbody>
</table>`;
}

function buildMaterialAdjustments(topic: TopicSpec, model: typeof models[0] | null, industry: typeof industries[0] | undefined): string {
  return `
<h3>材料別の調整ポイント</h3>
<table class="spec-table">
  <thead><tr><th>材料</th><th>推奨砥粒</th><th>開始砥粒</th><th>圧力/速度</th></tr></thead>
  <tbody>
    <tr><td>軟木</td><td>酸化アルミニウム</td><td>80–100</td><td>圧力軽く、速度中</td></tr>
    <tr><td>硬木</td><td>酸化アルミニウム/ジルコニアアルミナ</td><td>60–80</td><td>圧力中、速度中</td></tr>
    <tr><td>炭素鋼</td><td>ジルコニアアルミナ/セラミック</td><td>40–60</td><td>圧力中〜高、速度高</td></tr>
    <tr><td>ステンレス</td><td>ジルコニアアルミナ/セラミック</td><td>60–80</td><td>圧力軽〜中、冷却良</td></tr>
    <tr><td>アルミ</td><td>炭化シリコン（SiC）</td><td>80–120</td><td>圧力軽、速度高</td></tr>
    <tr><td>塗料/ラッカー</td><td>酸化アルミニウム</td><td>80–120</td><td>圧力軽、強力集じん</td></tr>
  </tbody>
</table>`;
}

function buildSafetyTips(topic: TopicSpec, industry: typeof industries[0] | undefined): string {
  return buildSafetyCompliance(topic, industry, undefined);
}

function buildTroubleshootingTable(topic: TopicSpec, model: typeof models[0] | null): string {
  const productName = model?.name || t(topic.productFamily);
  return `
<h3>クイックテーブル：${productName} の不具合 - 原因 - 解決</h3>
<table class="spec-table">
  <thead><tr><th>不具合</th><th>主原因</th><th>即時対策</th><th>予防</th></tr></thead>
  <tbody>
    <tr><td>摩耗が早い</td><td>砥粒が細すぎる / 圧力過大</td><td>粗い砥粒に変更 / 圧力軽減</td><td>正しい砥粒シークエンス</td></tr>
    <tr><td>ローディング</td><td>粘着材料 / 集じん不足</td><td>メッシュディスク / フィルター清掃</td><td>有効な集じん、冷却</td></tr>
    <tr><td>ベルト偏位</td><td>ローラーのズレ / ジョイント不良</td><td>アライメント調整 / ジョイント確認</td><td>ローラーの週次整備</td></tr>
    <tr><td>振動/異音</td><td>ベルトの不均一 / ローラー破損</td><td>ベルト / ローラー交換</td><td>毎日の目視</td></tr>
    <tr><td>焼き付き</td><td>高RPM / 高圧力 / 冷却なし</td><td>速度/圧力下げ / 冷却追加</td><td>材料に合わせたパラメータ設定</td></tr>
  </tbody>
</table>`;
}

function buildFailureClassification(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>不具合の分類と診断ロジック</h3>
<ol class="numbered-list">
  <li><strong>摩耗系不具合：</strong>早期摩耗、摩耗不均一、砥粒の剥落 → 砥粒、圧力、砥粒タイプを確認</li>
  <li><strong>付着系不具合：</strong>ローディング、表面光沢、切削力低下 → 集じん、材料、砥粒シークエンスを確認</li>
  <li><strong>機械系不具合：</strong>偏位、振動、破れ、割れ → ローラー、アライメント、ジョイント、RPMを確認</li>
  <li><strong>表面系不具合：</strong>傷、焼き付き、波打ち、均一でない仕上げ → 砥粒シークエンス、パラメータ、ベルト状態を確認</li>
  <li><strong>安全系不具合：</strong>粉塵過多、火花、破片 → 保護具、集じん、機械ガード、製品状態を確認</li>
</ol>`;
}

function buildRootCauseAnalysis(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>根本原因分析（例）</h3>
<table class="spec-table">
  <thead><tr><th>不具合</th><th>直接原因</th><th>根本原因（5Why）</th><th>対策</th></tr></thead>
  <tbody>
    <tr><td>摩耗が早い</td><td>除去工程で砥粒120使用</td><td>工程が未定義 → 砥粒シークエンス不明 → 案内資料なし</td><td>砥粒シークエンス表を提供しオペレーターを教育</td></tr>
    <tr><td>偏位が繰り返す</td><td>ガイドローラーの劣化</td><td>定期整備なし → チェックリストなし → 責任者不明</td><td>ローラーを週次整備に追加し責任者を指定</td></tr>
    <tr><td>ローディングが継続</td><td>粘着材料で穴あきなしディスク使用</td><td>ディスクタイプと材料の照合なし → 仕様不明 → 誤った前提</td><td>RFQテンプレートの「ディスクタイプ」欄を追加し調達を教育</td></tr>
  </tbody>
</table>`;
}

function buildRootCauseChecklist(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>根本原因チェックリスト</h3>
<ul class="plain-links">
  <li>☐ 砥粒は工程と一致していますか？</li>
  <li>☐ 砥粒タイプは加工材料に合っていますか？</li>
  <li>☐ 圧力は推奨範囲（0.5–2 N/cm²）内ですか？</li>
  <li>☐ 機械RPMは製品の限度内ですか？</li>
  <li>☐ 集じんシステムは効果的ですか？（フィルター、気流を確認）</li>
  <li>☐ ローラー/ベースは清潔で状態良好ですか？</li>
  <li>☐ 回転方向/ジョイントは正しく（ベルト）？</li>
  <li>☐ オペレーターは砥粒シークエンスを教育済みですか？</li>
  <li>☐ 環境（湿度/温度）が基材/接着に影響していませんか？</li>
  <li>☐ 現在のロットは基準仕様に合っていますか？</li>
</ul>`;
}

function buildDistributionModel(jaRegion: typeof jaRegions[0] | undefined): string {
  if (!jaRegion || jaRegion.code === 'general-jp') return '';
  return `
<h3>${jaRegion.name}地域の流通モデル</h3>
<ul class="plain-links">
  <li><strong>直接輸入者：</strong>大型企業がフルコンテナを購入し、地域販売店に供給</li>
  <li><strong>産業用品販売店：</strong>在庫を持ち、作業場と工場にサービス、マージン 15–25%</li>
  <li><strong>専属代理店：</strong>稀。大口の数量コミットと全国カバーが必要</li>
  <li><strong>B2B EC：</strong>少量注文向けのプラットフォーム</li>
</ul>
<p>墨泰は直接に輸入者と大型販売店と取引します。買い手が希望すれば、地域代理店経由での取引も可能です。</p>`;
}

function buildPaymentTerms(jaRegion: typeof jaRegions[0] | undefined): string {
  if (!jaRegion || jaRegion.code === 'general-jp') return '';
  return `
<h3>${jaRegion.name}地域の決済条件と通貨</h3>
<table class="spec-table">
  <thead><tr><th>方法</th><th>一般的</th><th>メモ</th></tr></thead>
  <tbody>
    <tr><td>LC（信用状）</td><td>最も安全</td><td>5万ドル以上の発注に必須、日本の銀行が受け入れ可</td></tr>
    <tr><td>TT 前払い30%</td><td>一般的</td><td>残り70%は出荷前または書類提示時</td></tr>
    <tr><td>TT 100%前払い</td><td>小口注文向け</td><td>1万ドル未満、手続き簡素化</td></tr>
    <tr><td>請求通貨</td><td>USD / JPY</td><td>固定化し、為替変動リスクを回避</td></tr>
  </tbody>
</table>
<p>初回注文と大口にはLCを、信頼できるパートナーとの定期注文にはTTを推奨します。</p>`;
}

function buildMarketContext(topic: TopicSpec, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  const industryName = industry?.name || '';
  const regionName = jaRegion?.name || '日本';
  return `
<h3>${regionName}の${industryName}業界背景</h3>
<p>業界の推進要因：製造業の自動化・高度化、インフラ維持・更新、生産性向上への投資。産業用仕上げ材料の需要は年率 3–5% で成長しています。</p>`;
}

/**
 * 进口合规（地域寻源篇专用）：按目的地域给出真实的监管机构与合规要点，
 * 替代原先误路由的 PPE 安全清单（该清单与进口法规主题无关，属灌水）。
 * 数据基于日本市场：JIS/JANSI 規格体系 + 通関・関税法務 + 表示義務。
 */
function buildImportCompliance(jaRegion: typeof jaRegions[0] | undefined): string {
  if (!jaRegion || jaRegion.code === 'general-jp') return '';
  const info: Record<string, { regulator: string; cert: string; points: string[] }> = {
    'kanto': {
      regulator: 'JIS / JANSI（日本産業規格 / 日本耐水紙工業会）',
      cert: '適合証明書（COC）/ 分析証明書（COA）',
      points: [
        'JIS 規格に準拠した砥粒グレード（JIS R 6001 等）で納品、ロットごとの COA 同封',
        '製品表示は日本語で必須：品名・寸法・砥粒グレード・JIS適合マーク・製造元・輸入者名',
        '輸入者名の表示は関税法務（不正表示防止）の観点から必須、日本国内の取扱い会社を特定',
      ],
    },
    'kansai': {
      regulator: 'JIS / JANSI（日本産業規格 / 日本耐水紙工業会）',
      cert: '適合証明書（COC）/ 分析証明書（COA）',
      points: [
        '造船・海洋業界の多い関西では溶接面処理・防食塗装前の表面準備基準（JIS Z 2372 等）が参考になる',
        'ロットごとの寸法公差と砥粒分布を示す検査記録の提出を推奨',
        '表示は日本語で統一、ロット番号と製造日を必ず明記',
      ],
    },
    'tohoku': {
      regulator: 'JIS / JANSI（日本産業規格 / 日本耐水紙工業会）',
      cert: '適合証明書（COC）/ 分析証明書（COA）',
      points: [
        'JIS 準拠の砥粒グレードで納品、ロットごとの COA 同封',
        '寒冷期の保管で接着剥離を防ぐための保管条件の明記',
        '表示は日本語で統一、ロット番号と製造日を必ず明記',
      ],
    },
    'chubu': {
      regulator: 'JIS / JANSI（日本産業規格 / 日本耐水紙工業会）',
      cert: '適合証明書（COC）/ 分析証明書（COA）',
      points: [
        '自動車産業の多い中部（愛知）では、板金・塗装ライン向けの寸法公差管理が重視される',
        'ロットごとの寸法公差と砥粒分布を示す検査記録の提出を推奨',
        '表示は日本語で統一、ロット番号と製造日を必ず明記',
      ],
    },
    'chugoku': {
      regulator: 'JIS / JANSI（日本産業規格 / 日本耐水紙工業会）',
      cert: '適合証明書（COC）/ 分析証明書（COA）',
      points: [
        'JIS 準拠の砥粒グレードで納品、ロットごとの COA 同封',
        '表示は日本語で統一、ロット番号と製造日を必ず明記',
        '通関書類（インボイス、パッキングリスト、原産国表示）の事前準備',
      ],
    },
    'kyushu': {
      regulator: 'JIS / JANSI（日本産業規格 / 日本耐水紙工業会）',
      cert: '適合証明書（COC）/ 分析証明書（COA）',
      points: [
        'JIS 準拠の砥粒グレードで納品、ロットごとの COA 同封',
        '北九州・福岡の造船・海洋産業向けに溶接ビード処理仕様を事前確認',
        '表示は日本語で統一、ロット番号と製造日を必ず明記',
      ],
    },
  };
  const inf = info[jaRegion.code];
  if (!inf) return '';
  return `
<h3>${jaRegion.name}地域の規制と適合要件</h3>
<p>管轄： <strong>${inf.regulator}</strong>。必要な証書：<strong>${inf.cert}</strong>。</p>
<ul class="plain-links">
  ${inf.points.map(p => `<li>${p}</li>`).join('\n  ')}
</ul>
<p>墨泰では全ロットで工場適合証書（COC）と分析証明書（COA）を提供します。<strong>輸入国の最終適合は輸入者の責任です</strong>。当社では提出書類の準備に協力します。</p>`;
}

/**
 * 行业/市场篇的标准与合规解读：全国版给出 JIS/JANSI 统一框架，
 * 地域主版给出该地区监管机构的具体要求（复用地域寻源的合规数据）。
 */
function buildStandardsAnalysis(topic: TopicSpec, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  if (jaRegion && jaRegion.code !== 'general-jp') {
    return buildImportCompliance(jaRegion);
  }
  return `
<h3>日本の規格体系（JIS/JANSI）</h3>
<ul class="plain-links">
  <li><strong>JIS R 6001：</strong>砥粒の粒度区分、日本国内の規格適合の基準</li>
  <li><strong>JANSI：</strong>耐水紙工業会規格、湿潤研磨材の適合基準</li>
  <li><strong>FEPA P / ISO 6344：</strong>国際的な砥粒粒度分析基準、クロスボーダー取引での参照</li>
  <li><strong>労働安全衛生法：</strong>粉じん作業の管理基準、集じん設備の要件</li>
</ul>
<p>要約：仕様は JIS または FEPA P のいずれか1つの体系で記載し、契約時に輸入国特有の要件を追加します。</p>`;
}

function buildMarketData(topic: TopicSpec, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  return `
<h3>市場データ（概算）</h3>
<ul class="plain-links">
  <li>日本の研磨材市場規模：年間 約500億円規模（概算 2023–2024）</li>
  <li>年率成長率（CAGR）：2028年まで 2–4%</li>
  <li>最大のシェア：サンディングディスク（約45%）、次はフラップディスク（約25%）</li>
  <li>主要輸入元：日本、米国、ドイツ、韓国、中国</li>
</ul>
<p><em>出典：業界レポート、商工会議所の統計。数値は概算で、出典によって異なります。</em></p>`;
}

function buildTechTrends(topic: TopicSpec, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  return buildMarketTrends(topic, industry, jaRegion);
}

function buildProcurementImplications(topic: TopicSpec, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  return `
<h3>調達判断への影響</h3>
<ul class="plain-links">
  <li>規格の厳密化 → 全ロットで COC/COA の提出を依頼</li>
  <li>高性能砥粒 → 単価ではなく平方メートル単価で計算</li>
  <li>自動化 → 仕様で寸法公差（±0.5 mm）を明確化</li>
  <li>サステナビリティ → リサイクル可能な基材、低排出砥粒への関心</li>
</ul>`;
}

function buildOEMOverview(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildOEMOptions(topic, model, productCat);
}

function buildPackagingSpecs(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>ブランド包装の設計仕様</h3>
<ul class="plain-links">
  <li><strong>ファイル：</strong>ベクトルロゴ（AI/SVG/EPS）、正確な寸法の包装図面、Pantone カラーコード</li>
  <li><strong>言語：</strong>日本語、英語、ターゲット市場の言語（クライアント承認済みテキスト）</li>
  <li><strong>印刷：</strong>フレキソ/オフセット、色数、印刷面、トリムライン</li>
  <li><strong>バーコード：</strong>JAN/GS1-128、製品データのCSVファイル</li>
  <li><strong>素材：</strong>段ボール（ケース用）、PE 袋（個包装用）、耐油/耐湿ラベル</li>
</ul>`;
}

function buildMOQPricing(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>最小注文数量と価格帯（参考）</h3>
<table class="spec-table">
  <thead><tr><th>製品カテゴリ</th><th>標準MOQ</th><th>OEM付きMOQ</th><th>典型数量帯</th></tr></thead>
  <tbody>
    <tr><td>サンディングベルト</td><td>500–1000本</td><td>2000–5000本</td><td>1000 / 5000 / 10000 / 50000</td></tr>
    <tr><td>サンディングディスク</td><td>2000–5000枚</td><td>5000–10000枚</td><td>5000 / 10000 / 50000 / 100000</td></tr>
    <tr><td>フラップディスク</td><td>1000–2000枚</td><td>3000–5000枚</td><td>2000 / 5000 / 10000 / 20000</td></tr>
    <tr><td>サンディングスポンジ</td><td>3000–5000枚</td><td>5000–10000枚</td><td>5000 / 10000 / 20000 / 50000</td></tr>
  </tbody>
</table>
<p><em>数値は参考値です。最終MOQは寸法、砥粒、カスタマイズ、包装で決まります。正確なお見積りを依頼してください。</em></p>`;
}

function buildSampleApproval(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>サンプル確認工程</h3>
<ol class="numbered-list">
  <li>クライアントが提出：ロゴ/包装ファイル + 完全な製品仕様</li>
  <li>初期サンプルを製造（5–10点）、10–15営業日</li>
  <li>クライアント検査：寸法、印刷、カラー、サンディング品質、包装</li>
  <li>修正がある場合 → 5–7日で再サンプル</li>
  <li>「サンプル承認」の書面確認 → 量産開始</li>
  <li>生産リードタイムは数量と複雑度で見積りで確定</li>
</ol>
<p>受入基準：技術仕様の公差内、印刷品質が合格、外観不良なし。</p>`;
}

function buildQAStandards(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>品質検査と受入基準</h3>
<table class="spec-table">
  <thead><tr><th>検査項目</th><th>試験方法</th><th>受入基準</th></tr></thead>
  <tbody>
    <tr><td>寸法</td><td>ノギス/マイクロメータ、ランダム5%</td><td>仕様の公差内</td></tr>
    <tr><td>砥粒グレード</td><td>砥粒分析（FEPA P）または承認基準</td><td>FEPA の銘示グレード範囲内</td></tr>
    <tr><td>表面外観</td><td>1000ルクス照明での目視</td><td>傷・ブツ・汚れなし</td></tr>
    <tr><td>接着強度</td><td>標準引離/剥離試験</td><td>仕様最低値以上</td></tr>
    <tr><td>印刷/包装</td><td>承認サンプルとの照合</td><td>100%一致</td></tr>
  </tbody>
</table>`;
}

function buildLogisticsCustoms(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>物流と通関</h3>
<ul class="plain-links">
  <li><strong>海上輸送：</strong>フルコンテナはFCL、少量はLCL。出港：寧波/上海 → 日本の港</li>
  <li><strong>書類：</strong>船荷証券、インボイス、パッキングリスト、原産国証明、COC、COA</li>
  <li><strong>通関：</strong>買い手の通関業者が処理。当社では船舶到着7日前までに全書類を提供</li>
  <li><strong>保険：</strong>CIF：買い手が保険加入。CFR/FOB：当社が港まで保険加入。全損保険を推奨</li>
  <li><strong>最終納品：</strong>合意した INCOTERMS に基づき買い手の倉庫または到着港へ</li>
</ul>`;
}

function buildPartnershipFramework(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>長期協業フレームワーク</h3>
<ul class="plain-links">
  <li><strong>基本契約：</strong>1–3年、数量予測、半年ごとの価格見直し</li>
  <li><strong>調達計画：</strong>四半期ごとの予測を8週間前、確定注文を4週間前</li>
  <li><strong>安全在庫：</strong>2–4週の消費量を出荷可能な在庫として維持</li>
  <li><strong>パフォーマンスレビュー：</strong>四半期ごと：OTIF、品質、対応、イノベーション</li>
  <li><strong>共同開発：</strong>新製品、仕様改善、材料試験</li>
</ul>`;
}

function buildPainPoints(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const industryName = industry?.name || '';
  // 行业痛点优先用 site.ts 已验证的 challenges；无数据行业回落通用痛点
  const painItems = industry?.challenges?.length
    ? industry.challenges.map(ch => `<li><strong>${ch}：</strong> ${model?.name || productCat?.name || t(topic.productFamily)} で統一された砥粒シークエンスと基準サンプル → 均一な結果と再作業の削減</li>`)
    : [
        '<li><strong>仕上げ品質のばらつき：</strong> 統一された砥粒シークエンス + 基準サンプル → ロット間の均一性</li>',
        '<li><strong>機械の頻繁な停止：</strong> 長寿命のベルト/ディスク + 予防整備 → 稼働率向上</li>',
        '<li><strong>砥粒の誤選択：</strong> シークエンスガイド + 技術相談 → 初回で正しい判断</li>',
        '<li><strong>単位コストが高い：</strong> TCO（価格+寿命+停止）の計算 → 経済的な判断</li>',
      ];
  return `
<h3>${industryName} の課題と ${model?.name || productCat?.name || t(topic.productFamily)} による解決</h3>
<ul class="plain-links">
  ${painItems.join('\n  ')}
</ul>`;
}

function buildProductCombo(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  return buildApplicationSection(topic, model, productCat, industry, undefined);
}

function buildProcessParams(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>推奨作業パラメータ</h3>
<table class="spec-table">
  <thead><tr><th>パラメータ</th><th>推奨範囲</th><th>注意</th></tr></thead>
  <tbody>
    <tr><td>速度（ベルト）</td><td>15–30 m/s</td><td>製品限度を超えない</td></tr>
    <tr><td>速度（ディスク）</td><td>ディスク径と機械RPMに応じて</td><td>ラベルを確認</td></tr>
    <tr><td>圧力</td><td>0.5–2 N/cm²</td><td>圧力過大 = 摩耗 + 発熱</td></tr>
    <tr><td>送り速度</td><td>3–8 m/分</td><td>材料と結果に応じて</td></tr>
  </tbody>
</table>`;
}

function buildSampleEvaluation(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>サンプル評価カード</h3>
<table class="spec-table">
  <thead><tr><th>基準</th><th>重み</th><th>評価方法</th><th>目標値</th></tr></thead>
  <tbody>
    <tr><td>技術仕様の適合</td><td>30%</td><td>寸法、砥粒、材料の測定</td><td>100%適合</td></tr>
    <tr><td>切削/仕上げ性能</td><td>25%</td><td>代表部品での試験</td><td>基準値以上</td></tr>
    <tr><td>寿命</td><td>20%</td><td>完全摩耗まで運転</td><td>基準寿命の90%以上</td></tr>
    <tr><td>ロット均一性</td><td>15%</td><td>異なる位置の5点検査</td><td>CV ≤ 5%</td></tr>
    <tr><td>包装/ラベル</td><td>10%</td><td>目視、バーコードスキャン</td><td>不良ゼロ</td></tr>
  </tbody>
</table>`;
}

function buildSupplierMatrix(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>サプライヤー評価マトリクス</h3>
<table class="spec-table">
  <thead><tr><th>基準</th><th>重み</th><th>評価情報源</th></tr></thead>
  <tbody>
    <tr><td>総合価格（CIF/CFR）</td><td>25%</td><td>正式な見積書</td></tr>
    <tr><td>品質（不良率、均一性）</td><td>25%</td><td>サンプル、参考顧客、証書</td></tr>
    <tr><td>納期と信頼性（OTIF）</td><td>20%</td><td>実績、参考顧客</td></tr>
    <tr><td>OEM/カスタマイズの柔軟性</td><td>10%</td><td>製造能力、過去の実績</td></tr>
    <tr><td>証書と適合</td><td>10%</td><td>ISO 9001、COC、COA、地域要件</td></tr>
    <tr><td>技術サポート</td><td>10%</td><td>対応速度、経験、言語</td></tr>
  </tbody>
</table>`;
}

function buildQuoteComparison(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>見積比較の重要ポイント</h3>
<ul class="plain-links">
  <li><strong>基本価格：</strong>単位ごとの合意通貨、包装込み/外しを明記</li>
  <li><strong>輸送・保険：</strong> CIF（港）、CFR、FOB、EXW — 統一基準で比較</li>
  <li><strong>決済条件：</strong> LC/TT、前払比率、期限、通貨</li>
  <li><strong>納期：</strong> 仕様/サンプル承認から港/倉庫納品まで</li>
  <li><strong>最小発注数量：</strong> 製品/砥粒別のMOQ、品種混合の柔軟性</li>
  <li><strong>保証と品質：</strong> 返品ポリシー、不良ロット交換、全荷物の証書</li>
  <li><strong>OEM対応：</strong> モールド費用、印刷プレート、カスタマイズの最低条件</li>
</ul>`;
}

function buildContractTerms(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>契約条項と納品条件</h3>
<ul class="plain-links">
  <li><strong>INCOTERMS：</strong> 明記（CIF、CFR、FOB、EXW）— 輸送と保険の責任を確定</li>
  <li><strong>納品スケジュール：</strong> 月、ロットごとの数量、±10%の柔軟性</li>
  <li><strong>決済条件：</strong> 失効不能LC、TT 30/70、通貨、受取銀行</li>
  <li><strong>品質検査：</strong> 工場内（出荷前）と/または到着時、受入基準、拒否手順</li>
  <li><strong>遅延ペナルティ：</strong> ロット金額の週あたり 0.5–1%、上限 5–10%</li>
  <li><strong>不可抗力：</strong> 定義、通知、期限延長、解除権</li>
  <li><strong>秘密保持/知的財産：</strong> 図面、ロゴ、仕様 — クライアント所有、秘匿義務</li>
  <li><strong>適用法と管轄：</strong> 中国法 / 買い手国法、仲裁（CIETAC / 国内）</li>
</ul>`;
}

function buildCommonMistakes(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>よくあるミスと回避法</h3>
<table class="spec-table">
  <thead><tr><th>ミス</th><th>結果</th><th>修正</th></tr></thead>
  <tbody>
    <tr><td>砥粒を直感で選定</td><td>除去が遅いか深い傷</td><td>シークエンスに沿う：粗 → 中 → 細</td></tr>
    <tr><td>機械互換性を見落とし（寸法/取付）</td><td>製品が取り付けられないか機械を損傷</td><td>発注前に機械タイプとジョイント方式を送信</td></tr>
    <tr><td>「早く終わらせたい」で圧力過大</td><td>摩耗加速、発熱、部品変形</td><td>砥粒に仕事をさせ、一定の適度な圧力</td></tr>
    <tr><td>集じんを怠る</td><td>ローディング、寿命短縮、健康リスク</td><td>毎日フィルター清掃、気流を確認</td></tr>
    <tr><td>砥粒規格を混在（FEPA/ANSI/JIS）</td><td>ロット間でグレードが不一致</td><td>全仕様に1つの規格（FEPA P）を統一</td></tr>
    <tr><td>サンプルなしに大量発注</td><td>品質/寸法不適合のリスク</td><td>サンプル依頼 → 検査 → 承認 → 量産発注</td></tr>
    <tr><td>OEM/包装の早期未確定</td><td>生産遅延、修正コスト上昇</td><td>初回RFQにブランドファイル添付</td></tr>
  </tbody>
</table>`;
}

function buildProductPositioning(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>${productName} の基本ポジショニング</h3>
<p>${model?.summary || productCat?.description || '産業用表面仕上げ用製品。木材・金属での材料除去、平坦化、最終仕上げを設計。'}</p>
<p><strong>最適な場面：</strong> ${model?.useCases?.join('、') || getMainApplication(topic.productFamily)}</p>
<p><strong>制約：</strong> ${model?.notes?.join('；') || '機械の正確な仕様が必要、重要用途はサンプル推奨。'}</p>`;
}

function buildFullSpecsTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildSpecsSection(topic, model, productCat);
}

function buildDesignPrinciples(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>設計原理と性能特性</h3>
<ul class="plain-links">
  <li><strong>砥粒：</strong> ${getGrainTypes(topic.productFamily).join(' / ')} — 材料の硬度と除去率で選択</li>
  <li><strong>基材：</strong> ${model?.backing || '布/紙/ポリマー'} — 柔軟性（曲面）と寸法安定性（平面）のバランス</li>
  <li><strong>接着剤：</strong> 耐熱性樹脂（Resin）— 高切削負荷でも砥粒を保持</li>
  <li><strong>構造：</strong> ${topic.productFamily === 'abrasive-belts' ? 'ジョイント付きベルト（ストレート/斜め/インターロック）' : '均一/穴あき/メッシュディスク'} — 均一な圧力分布を設計</li>
</ul>`;
}

function buildCompatibilityGuide(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildCompatibilityChecklist(topic, model, productCat);
}

function buildCustomizationOptions(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildOEMOptions(topic, model, productCat);
}

function buildOrderingInfo(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return `
<h3>発注情報：MOQ、納期、包装</h3>
<table class="spec-table">
  <thead><tr><th>項目</th><th>詳細</th></tr></thead>
  <tbody>
    <tr><td>MOQ</td><td>寸法、砥粒、カスタマイズに応じて確定（卸売/OEMセクション参照）</td></tr>
    <tr><td>生産リードタイム</td><td>仕様とサンプル承認後に見積りで確定</td></tr>
    <tr><td>海上輸送</td><td>日本の港湾まで 7–15 日</td></tr>
    <tr><td>標準包装</td><td>段ボール、製品による個装/巻き、識別ラベル</td></tr>
    <tr><td>OEM包装</td><td>クライアント承認に基づき追加費用、リードタイム +5–7日</td></tr>
    <tr><td>同封証書</td><td>COCは標準、COAは要時、地域要件に応じて</td></tr>
  </tbody>
</table>`;
}

function buildTop3FAQ(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  return `
<h3>主要3つの質問 - 簡潔な回答</h3>
<dl class="faq-list">
  <dt>${productName}に合う砥粒はどう選ぶ？</dt>
  <dd>工程が基準：粗削り 40–80、仕上げ 100–180、最終 240+。材料が砥粒タイプを決めます。</dd>
  <dt>最小発注数量（MOQ）は？</dt>
  <dd>仕様で決まります：標準製品は低め、OEM/カスタムは高め。正確な数値は見積りに依頼。</dd>
  <dt>総納期は？</dt>
  <dd>仕様とサンプル承認後に見積りで確定：生産期間 + 輸送（海上または空輸）+ 到着先。正確な数値は見積りに付随します。</dd>
</dl>`;
}

function buildDecisionReferenceTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  return buildDecisionGuide(topic, model, productCat, undefined);
}

// ========== 各类内容构建函数 ==========

// 对比表 B 列（替代产品）的真实规格，取自同站 site.ts 产品族数据，避免「未定義」占位行
function altSize(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  const dim = cat?.specs?.find(s => /直径|標準|サイズ/i.test(s[0]))?.[1];
  return dim || '複数サイズ';
}
function altBacking(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  return cat?.specs?.find(s => /基材|タイプ/i.test(s[0]))?.[1] || '製品による';
}
function altAttachment(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  if (alt === 'sanding-discs') return 'フック&ループ / PSA / メッシュ';
  if (alt === 'abrasive-belts') return '機械によるジョイント方式';
  return '製品による';
}
function altGritRange(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  const g = cat?.specs?.find(s => /砥粒|グレード/i.test(s[0]))?.[1];
  return g || 'お見積り対応';
}
function getAltApplication(familySlug: string): string {
  const alt = { 'abrasive-belts': 'sanding-discs', 'flap-discs': 'abrasive-belts', 'sanding-discs': 'abrasive-belts', 'hook-loop': 'sanding-discs', 'sanding-sponges': 'sanding-discs' }[familySlug] || 'sanding-discs';
  const cat = productCategories.find(c => c.slug === alt);
  return cat?.applications?.join('、') || '補完的用途';
}

function buildComparisonTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  const altProduct = topic.articleType === 'product-comparison' ? getAlternativeProduct(topic.productFamily) : productName;

  return `
<table class="spec-table">
  <thead>
    <tr><th>パラメータ</th><th>${productName}</th><th>${altProduct}</th><th>メモ</th></tr>
  </thead>
  <tbody>
    <tr><td>タイプ</td><td>${productName}</td><td>${altProduct}</td><td>形状と用途の差</td></tr>
    <tr><td>代表寸法</td><td>${model?.sizeJa || '複数'}</td><td>${altSize(topic.productFamily)}</td><td>機械に合わせ選択</td></tr>
    <tr><td>砥粒範囲</td><td>${model?.gritRange.join(' – ') || '40–800'}</td><td>${altGritRange(topic.productFamily)}</td><td>工程で決まる</td></tr>
    <tr><td>基材</td><td>${model?.backing || '布/紙/ポリマー'}</td><td>${altBacking(topic.productFamily)}</td><td>柔軟性と寸法安定性のトレードオフ</td></tr>
    <tr><td>取付システム</td><td>${model?.attachment || '機械により確定'}</td><td>${altAttachment(topic.productFamily)}</td><td>機械互換性が最重要</td></tr>
    <tr><td>主要用途</td><td>${getMainApplication(topic.productFamily)}</td><td>${getAltApplication(topic.productFamily)}</td><td>一部の工程で重複</td></tr>
    <tr><td>MOQ</td><td>見積りで確定</td><td>見積りで確定</td><td>カスタマイズと包装で</td></tr>
  </tbody>
</table>

<p>判断：機械のベルト/ディスクが互換で、面積が許す場合は ${productName} を選択。${altProduct} は狭い場所または機械が合わない場合。</p>`;
}

function buildDecisionGuide(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  const industryName = industry?.name || '';

  return `
<div class="decision-flow">
  <h3>確定ステップ（3ステップ）</h3>
  <ol class="numbered-list">
    <li><strong>加工材料：</strong> ${getWorkpieceMaterials(topic.industry).join(' / ')}</li>
    <li><strong>工程：</strong> 粗削り（砥粒 40–80）→ 中間仕上げ（100–180）→ 最終（240–400+）</li>
    <li><strong>機械互換：</strong> ベルト/ディスク寸法、取付システム（フック&ループ / PSA / メッシュ）、回転方向</li>
  </ol>

  <h3>クイック選択マトリクス</h3>
  <table class="spec-table">
    <thead><tr><td>材料</td><td>工程</td><td>推奨砥粒</td><td>推奨タイプ</td></tr></thead>
    <tbody>
      <tr><td>軟木</td><td>除去</td><td>60–80</td><td>${productName}</td></tr>
      <tr><td>硬木</td><td>仕上げ</td><td>120–180</td><td>${productName}</td></tr>
      <tr><td>鋼/ステンレス</td><td>錆除去</td><td>40–60</td><td>${productName}（ジルコニアアルミナ/セラミック砥粒）</td></tr>
      <tr><td>アルミ</td><td>平滑化</td><td>180–240</td><td>${productName}（酸化アルミニウム）</td></tr>
      <tr><td>旧塗料</td><td>除去</td><td>80–100</td><td>${productName}</td></tr>
    </tbody>
  </table>
</div>`;
}

function buildSpecsSection(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);

  return `
<h3>参考基準</h3>
<p>砥粒グレードは <strong>FEPA P</strong>（欧州）に準拠し、国際的に普及した基準です。日本では <strong>JIS</strong> も併用されますが、1つの仕様で規格を混在しないこと。</p>

<h3>完全仕様テーブル</h3>
<table class="spec-table">
  <thead><tr><th>パラメータ</th><th>値/範囲</th><th>メモ</th></tr></thead>
  <tbody>
    <tr><td>製品</td><td>${productName}</td><td></td></tr>
    <tr><td>寸法</td><td>${model?.sizeJa || productCat?.specs?.find(s => s[0].includes('標準'))?.[1] || '複数寸法'}</td><td>mmで正確に指定</td></tr>
    <tr><td>砥粒範囲</td><td>${model?.gritRange.join('、') || 'お見積り対応'}</td><td>FEPA P 標準</td></tr>
    <tr><td>砥粒タイプ</td><td>${getGrainTypes(topic.productFamily).join(' / ')}</td><td>材料で選択</td></tr>
    <tr><td>基材（Backing）</td><td>${model?.backing || '布、紙、またはポリマー'}</td><td>柔軟性、安定性、耐湿</td></tr>
    <tr><td>接着剤（Bond）</td><td>樹脂（Resin）</td><td>耐熱性</td></tr>
    <tr><td>取付システム</td><td>${model?.attachment || 'フック&ループ / PSA / メッシュ'}</td><td>機械と一致必須</td></tr>
    <tr><td>最大速度</td><td>製品ラベルに準拠</td><td>機械RPMの限度を超えない</td></tr>
    <tr><td>安全</td><td>保護具必須、集じん</td><td>労働安全衛生法 + JIS</td></tr>
  </tbody>
</table>`;
}

function buildApplicationSection(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  const industryName = industry?.name || '';
  const regionName = jaRegion?.name === '全国' ? '全国' : (jaRegion ? `${jaRegion.name}地域` : '');

  return `
<h3>${industryName}${regionName ? `（${regionName}）` : ''} での工程</h3>
<ol class="numbered-list">
  <li><strong>準備：</strong> 表面清掃、錆/旧塗料の除去、不良検査</li>
  <li><strong>速削り：</strong> ${productName} 砥粒 40–80、適度な圧力、推奨速度</li>
  <li><strong>中間平坦化：</strong> 砥粒 100–180、圧力軽減、クロスパス</li>
  <li><strong>最終仕上げ：</strong> 砥粒 240–400（塗装にはそれ以上）、一定の動き</li>
  <li><strong>清掃と検査：</strong> 粉塵除去、表面粗さ（Ra/Rz）検査、次工程準備</li>
</ol>

<h3>推奨砥粒シークエンス</h3>
<table class="spec-table">
  <thead><tr><th>工程</th><th>砥粒</th><th>目的</th><th>メモ</th></tr></thead>
  <tbody>
    <tr><td>材料/錆/塗料の除去</td><td>40 – 80</td><td>高能率</td><td>金属にはジルコニアアルミナ/セラミック</td></tr>
    <tr><td>中間仕上げ</td><td>100 – 180</td><td>前工程の痕の平坦化</td><td>汎用の酸化アルミニウム</td></tr>
    <tr><td>細目仕上げ</td><td>240 – 400</td><td>塗装準備</td><td>過度な光沢化を避ける</td></tr>
    <tr><td>最終仕上げ</td><td>600 – 1500+</td><td>見える面/精密面</td><td>家具、自動車、精密</td></tr>
  </tbody>
</table>
${jaRegion?.clusters?.length ? `
<h3>${regionName} の需要ハブ</h3>
<p>${regionName}では需要は主に ${jaRegion.clusters.join('、')} に集中しています。数量と納期は最寄りの港湾に合わせ調整し、各拠点の保管条件を考慮します。</p>` : ''}`;
}

function buildProcessSteps(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined, industry: typeof industries[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  const industryName = industry?.name || '';

  return `
<h3>標準作業手順（SOP）- ${industryName}</h3>
<ol class="numbered-list">
  <li><strong>機械確認：</strong> ローラーの清潔さ、回転方向、パッド状態、集じんシステム</li>
  <li><strong>${productName} の取付：</strong> 寸法照合、正しい取付、ベルト/ディスクのアライメント確認</li>
  <li><strong>空転試験：</strong> 30秒部品なし、振動/異音/偏位を確認</li>
  <li><strong>パラメータ設定：</strong> 速度（RPM）、圧力（N/cm²）、送り速度（m/min）</li>
  <li><strong>段階的サンディング：</strong> 砥粒テーブルに従い、各グレード間で表面清掃</li>
  <li><strong>品質監視：</strong> 50点ごとまたはロットごとに目視 + 粗さ計</li>
  <li><strong>砥粒交換：</strong> 機械停止、旧品取り外し、ベース清掃、新品取付、試験</li>
  <li><strong>停止と清掃：</strong> ${productName} を取り外し、機械を清掃し、乾燥場所に保管</li>
</ol>

<h3>参考作業パラメータ</h3>
<table class="spec-table">
  <thead><tr><th>パラメータ</th><th>推奨範囲</th><th>注意</th></tr></thead>
  <tbody>
    <tr><td>速度（ベルト）</td><td>15–30 m/s</td><td>製品限度を超えない</td></tr>
    <tr><td>速度（ディスク）</td><td>ディスク径と機械RPMに応じて</td><td>ラベルを確認</td></tr>
    <tr><td>圧力</td><td>0.5–2 N/cm²</td><td>圧力過大 = 摩耗 + 発熱</td></tr>
    <tr><td>送り速度</td><td>3–8 m/分</td><td>材料と結果に応じて</td></tr>
  </tbody>
</table>`;
}

function buildSafetyCompliance(topic: TopicSpec, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  const regionName = jaRegion?.name === '全国' ? '全国' : (jaRegion ? `${jaRegion.name}地域` : '');
  const regionCode = jaRegion?.code || '';

  let standards = 'JIS R 6001、ISO 6344、労働安全衛生法';
  if (regionCode !== 'general-jp') standards += '、JANSI';

  return `
<h3>安全要件（保護具必須）</h3>
<ul class="plain-links">
  <li>保護メガネ / フェースシールド（JIS T 8166）</li>
  <li>粉塵マスク（N95 / FFP2 以上、微細粉塵は上級）</li>
  <li>耐切創グローブ（EN 388 / ISO 15636）</li>
  <li>騒音のある機械には防音具</li>
  <li>長袖作業着、装飾品禁止、髪を束ねる</li>
</ul>

<h3>集じんと換気</h3>
<ul class="plain-links">
  <li>各機械に中央式または局部集じん</li>
  <li>微細粉塵には HEPA フィルタ（セラミック/ジルコニアアルミナ特に）</li>
  <li>サンディング作業場の換気回数：時あたり 6 回以上</li>
</ul>

<h3>速度限度と適合</h3>
<ul class="plain-links">
  <li>製品に印字された <strong>最大RPM</strong> を超えない</li>
  <li>使用前に製品を確認：割れ、破損、不均一摩耗</li>
  <li>適用規格：${standards}</li>
  ${regionCode !== 'general-jp' ? `<li><strong>注意：</strong> ${regionName} では追加要件がある場合があります。作業前に地域の管理機関（${getLocalRegulator(regionCode)}）を参照してください。</li>` : ''}
</ul>

<p class="disclaimer">上記は参考情報です。最終基準：製品ラベル、技術データシート、機械マニュアル、現行の地域規制。</p>`;
}

function buildCostOptimization(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);

  return `
<h3>TCO（総所有コスト）の管理ポイント</h3>
<table class="spec-table">
  <thead><tr><th>要因</th><th>コストへの影響</th><th>改善行動</th></tr></thead>
  <tbody>
    <tr><td>正しい砥粒選択</td><td>再作業回避 + 寿命延長</td><td>量産前に 2–3 グレードの試験</td></tr>
    <tr><td>砥粒タイプ</td><td>セラミック/ジルコニアアルミナは高価だが 2–3 倍長寿命</td><td>単位価格ではなく平方メートル単位で計算</td></tr>
    <tr><td>適切な基材</td><td>柔軟な布 = 曲面での破損低減</td><td>部品形状に基材を合わせる</td></tr>
    <tr><td>集じんシステム</td><td>ローディング低減 → 寿命 30–50% 延長</td><td>有効な集じんへの投資</td></tr>
    <tr><td>予防整備</td><td>清潔なローラー = ベルト直進 = 均一摩耗</td><td>日次/週次の清掃スケジュール</td></tr>
    <tr><td>数量と包装</td><td>大量発注 = 単位価格低下 + 輸送最適化</td><td>月次/四半期の注文まとめ</td></tr>
  </tbody>
</table>

<p>アドバイス：<strong>段階見積</strong>（数量 100、500、1000、5000 単位）を依頼し、真の比較を行ってください。</p>`;
}

function buildProcurementTemplate(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const jaRegionName = () => {
    const r = jaRegions.find(g => g.code === topic.jaRegion);
    return r && r.code !== 'general-jp' ? `${r.clusters[0]}（${r.name}）` : '';
  };
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);

  return `
<h3>見積依頼（RFQ）仕様テンプレート - ${productName}</h3>
<p>表をコピーし、記入のうえ、お問い合わせフォームから送信してください。</p>

<table class="spec-table">
  <thead><tr><th>項目</th><th>例/形式</th><th>必須？</th></tr></thead>
  <tbody>
    <tr><td>製品名/ファミリー</td><td>${productName}</td><td>必須</td></tr>
    <tr><td>寸法（mm / inch）</td><td>${model?.sizeJa || '533 × 75 mm / 5 inch'}</td><td>必須</td></tr>
    <tr><td>砥粒グレード（FEPA）</td><td>${model?.gritRange?.slice(0, 3).join('、') || '80、120、240'}</td><td>必須</td></tr>
    <tr><td>砥粒タイプ</td><td>酸化アルミニウム / ジルコニアアルミナ / セラミック</td><td>推奨</td></tr>
    <tr><td>基材（Backing）</td><td>布 X / 紙 Y / ポリマー Z</td><td>推奨</td></tr>
    <tr><td>取付システム</td><td>フック&ループ / PSA / メッシュ</td><td>必須</td></tr>
    <tr><td>推定数量</td><td>5000個/月</td><td>必須</td></tr>
    <tr><td>注文頻度</td><td>月次 / 四半期 / 年次</td><td>推奨</td></tr>
    <tr><td>用途/材料</td><td>ステンレス、溶接ビード除去</td><td>必須</td></tr>
    <tr><td>機械タイプ</td><td>${model?.attachment || 'Timesavers 1300 / 標準ベルト研削機'}</td><td>必須</td></tr>
    <tr><td>ジョイント方式（ベルトの場合）</td><td>ストレート / 斜め / インターロック</td><td>ベルトのみ</td></tr>
    <tr><td>包装</td><td>段ボールケース / 巻き / カスタム</td><td>推奨</td></tr>
    <tr><td>OEM/ブランド</td><td>あり/なし、ロゴファイル添付</td><td>該当時</td></tr>
    <tr><td>出荷先（港/都市）</td><td>${jaRegionName() || '横浜 / 神戸 / 大阪'}</td><td>必須</td></tr>
    <tr><td>希望決済条件</td><td>LC / TT 前払30%</td><td>推奨</td></tr>
    <tr><td>必要証書</td><td>COC / COA / JIS / JANSI</td><td>該当時</td></tr>
  </tbody>
</table>`;
}

function buildOEMOptions(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);

  return `
<h3>OEMオプションマトリクス - ${productName}</h3>
<table class="spec-table">
  <thead><tr><th>カスタマイズ項目</th><th>オプション</th><th>MOQへの影響</th><th>メモ</th></tr></thead>
  <tbody>
    <tr><td>製品上のロゴ</td><td>インク印刷 / レーザー / 刻印</td><td>+10–20%</td><td>ベクトルファイル（AI/SVG/EPS）必須</td></tr>
    <tr><td>カラー</td><td>赤（標準）/ 青 / 緑 / カスタム</td><td>+5–15%</td><td>Pantone コード必須</td></tr>
    <tr><td>外装パッケージ</td><td>棕色 / カラー / 印刷</td><td>+0–10%</td><td>正確な寸法の包装図面</td></tr>
    <tr><td>内装パッケージ</td><td>PE 袋 / 個別箱 / 巻き</td><td>+0–5%</td><td>数量と輸送に応じて</td></tr>
    <tr><td>ラベル/バーコード</td><td>JAN / カスタム / なし</td><td>+0%</td><td>データCSVファイル提供</td></tr>
    <tr><td>包装上の言語</td><td>日本語、英語、その他</td><td>+0%</td><td>クライアント承認テキスト</td></tr>
    <tr><td>カスタム証書</td><td>クライアント情報付きCOC / ロット毎COA</td><td>+5%/ロット</td><td>契約で合意</td></tr>
  </tbody>
</table>

<h3>サンプル確認工程</h3>
<ol class="numbered-list">
  <li>クライアントがロゴ/包装ファイル + 製品仕様を送信</li>
  <li>初期サンプルを製造（5–10点）、10–15営業日</li>
  <li>クライアント検査：寸法、印刷、カラー、サンディング品質</li>
  <li>修正がある場合 → 5–7日で再サンプル</li>
  <li>「サンプル承認」署名 → 量産開始</li>
  <li>生産リードタイムは数量と複雑度で見積りで確定</li>
</ol>`;
}

function buildLogisticsPorts(jaRegion: typeof jaRegions[0] | undefined): string {
  if (!jaRegion || jaRegion.code === 'general-jp') return '';

  const ports: Record<string, string[]> = {
    'kanto': ['横浜（最大）', '川崎', '千葉（京葉）'],
    'kansai': ['神戸', '大阪'],
    'tohoku': ['仙台（石巻）', '東京（経由）'],
    'chubu': ['名古屋', '新潟', '富山'],
    'chugoku': ['広島', '高松（経由）'],
    'kyushu': ['北九州', '福岡', '門司'],
  };

  const regionPorts = ports[jaRegion.code] || [];

  return `
<h3>${jaRegion.name}地域の主要港湾</h3>
<ul class="plain-links">
  ${regionPorts.map(p => `<li>${p}</li>`).join('')}
</ul>

<h3>海上輸送リードタイム概算（中国より）</h3>
<table class="spec-table">
  <thead><tr><th>港湾</th><th>航行日数</th><th>通関 + 納品</th><th>合計</th></tr></thead>
  <tbody>
    ${regionPorts.map(p => `<tr><td>${p}</td><td>7–12</td><td>2–3</td><td>9–15</td></tr>`).join('')}
  </tbody>
</table>

<p><strong>空輸：</strong> 3–5日 + 通関1–2日。費用は海上の4–6倍。緊急時のみ。</p>

<p><strong>必要書類：</strong> 船荷証券、インボイス、パッキングリスト、原産国証明、適合証明書（COC/COA）、保険証券。</p>`;
}

function buildMarketTrends(topic: TopicSpec, industry: typeof industries[0] | undefined, jaRegion: typeof jaRegions[0] | undefined): string {
  const industryName = industry?.name || '';
  const regionName = jaRegion?.name === '全国' ? '全国' : (jaRegion ? `${jaRegion.name}地域` : '');

  return `
<h3>${industryName}${regionName ? `（${regionName}）` : ''} の市場推進要因</h3>
<ul class="plain-links">
  <li><strong>規格のアップデート：</strong> JIS R 6001、ISO 6344 が砥粒の均一性をより厳密に要求</li>
  <li><strong>健康安全：</strong> 労働安全衛生法による粉じん管理基準、保護具必須</li>
  <li><strong>自動化：</strong> ロボットサンディングラインは寸法公差の厳しいベルト/ディスクを要求</li>
  <li><strong>サステナビリティ：</strong> リサイクル可能な基材、低排出砥粒への需要増加</li>
</ul>

<h3>製品トレンド</h3>
<table class="spec-table">
  <thead><tr><th>トレンド</th><th>調達への影響</th><th>対象製品</th></tr></thead>
  <tbody>
    <tr><td>セラミック/ジルコニアアルミナ砥粒</td><td>高価格、寿命 2–3 倍、平方メートル単価は低</td><td>ベルト、ディスク、フラップディスク</td></tr>
    <tr><td>耐湿ポリマー基材</td><td>湿潤/海岸環境での寸法安定性</td><td>大型ベルト、ディスク</td></tr>
    <tr><td>多穴メッシュディスク</td><td>集じん向上、ローディング低減、均一な仕上げ</td><td>5/6 inch ディスク</td></tr>
    <tr><td>フック&ループシステム改善</td><td>交換迅速化、保持向上、パッド寿命延長</td><td>全径</td></tr>
  </tbody>
</table>

<p>推奨：長期調達では、サプライヤーに<strong>製品ロードマップ</strong>を依頼し、陳腐化を回避してください。</p>`;
}

function buildPreventiveMaintenance(topic: TopicSpec, model: typeof models[0] | null): string {
  return `
<h3>サンディング設備の予防整備スケジュール</h3>
<table class="spec-table">
  <thead><tr><th>頻度</th><th>作業</th><th>工具/基準</th></tr></thead>
  <tbody>
    <tr><td>日次（シフト開始時）</td><td>ベルト/ディスクの目視、ローラー清掃、集じん試験</td><td>署名済みチェックリスト</td></tr>
    <tr><td>週次</td><td>ガイドローラー/テンションローラーの清掃、アライメント確認、ベアリング潤滑</td><td>機械マニュアル</td></tr>
    <tr><td>月次</td><td>パッド状態確認（フック&ループ/PSA）、RPMキャリブレーション、集じん路（エア路）の清掃</td><td>RPM計、流量計</td></tr>
    <tr><td>四半期</td><td>パッド交換、集じんシステム全面検査、圧力キャリブレーション</td><td>純正部品</td></tr>
    <tr><td>年次</td><td>認定技術者による全面整備、文書化、安全証書</td><td>認定サービス提供者</td></tr>
  </tbody>
</table>

<p>整備記録は機械の寿命を延ばし、予期しない停止を 40–60% 削減します（サンディング機械メーカーのデータ）。</p>`;
}

function buildSupportEscalation(): string {
  return `
<h3>技術サポートに相談するタイミング</h3>
<ul class="plain-links">
  <li>標準対策後も同一パターンで不具合が繰り返される場合</li>
  <li>新製品が契約仕様に適合しない場合</li>
  <li>基準ロットとの性能乖離が 20% を超える場合</li>
  <li>契約中の仕様変更（砥粒、基材、寸法）が必要な場合</li>
</ul>

<h3>サポートチャネル</h3>
<ul class="plain-links">
  <li>メール： <a href="mailto:motai-01@motaiabrasive.com">motai-01@motaiabrasive.com</a></li>
  <li>WhatsApp： <a href="https://wa.me/8618118635597" rel="nofollow noopener" target="_blank">+86 181 1863 5597</a></li>
  <li>お問い合わせフォーム： <a href="/quote">見積依頼ページ</a></li>
</ul>

<p>必ず添付：不具合の写真、ロット番号、仕様、作業条件（機械、材料、パラメータ）。</p>`;
}

function buildCulturalNotes(jaRegion: typeof jaRegions[0] | undefined): string {
  if (!jaRegion || jaRegion.code === 'general-jp') return '';

  const notes: Record<string, string[]> = {
    'kanto': ['週5日勤務が標準（土日休）、祝日は営業停止', 'ビジネス日本語が必須、英語でも対応可', '面会時は名刺を両手で、読みを事前に確認', '判断は階層的、最終決定者は重要'],
    'kansai': ['週5日勤務が標準、造船・自動車産業の拠点', '丁寧な仕様書と品質文書が重視される', '名刺交換の作法が重要、初回面会では丁寧さを', '関西の商習慣は柔軟だが品質基準は厳格'],
    'tohoku': ['週5日勤務、製造・農業の拠点', '寒冷期の保管条件（接着剥離防止）を事前確認', '判断は慎重で、関係構築に時間がかかる', '安全への意識が高い'],
    'chubu': ['週5日勤務、自動車産業の集積地（愛知）', '寸法公差と安定供給が最重要視される', '定期訪問と実績報告が信頼構築に有効', '品質文書の正確性が問われる'],
    'chugoku': ['週5日勤務、造船・海洋産業の拠点', '溶接面処理の基準（JIS Z 2372 等）を事前確認', '関係者は少人数で密接、丁寧な対応が重要', '通関書類の事前準備が鍵'],
    'kyushu': ['週5日勤務、北九州造船・海洋産業', '北九州は鉄鋼・造船の中心地', '防食塗装前の表面準備基準を事前確認', '九州の商習慣は誠実・慎重、長期的関係重視'],
  };

  const regionNotes = notes[jaRegion.code] || [];

  return `
<h3>${jaRegion.name}地域の商務メモ</h3>
<ul class="plain-links">
  ${regionNotes.map(n => `<li>${n}</li>`).join('')}
</ul>

<p>一般的なメモです。各企業・組織文化は異なります。関係を明確さ、納期遵守、約束の実行で築いてください。</p>`;
}

function buildDisclaimer(jaRegion: typeof jaRegions[0] | undefined): string {
  const regionName = jaRegion?.name === '全国' ? '日本' : (jaRegion ? `${jaRegion.name}地域` : '日本');

  return `
<div class="disclaimer" style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:1rem;margin:1.5rem 0;">
  <h3>重要免責事項</h3>
  <ul>
    <li>墨泰は${regionName}に<strong>当地在庫・拠点・法人</strong>も<strong>専属代理店</strong>も保有していません。</li>
    <li>全荷物は合意した INCOTERMS に基づき<strong>中国の工場（湖北省咸寧市）から出荷</strong>されます。</li>
    <li>納期、価格、MOQ、証書は完全な仕様の確認後に<strong>最終商業見積りで確定</strong>されます。</li>
    <li>JIS/JANSI 適合は<strong>輸入者の責任</strong>です。当社は工場証書（COC/COA）を仕様に基づき提供します。</li>
    <li>「当地販売店」または「${regionName}の在庫からの納品」への言及は、墨泰からの書面がない限り<strong>不正確です</strong>。</li>
  </ul>
</div>`;
}

function buildGlossaryCard(topic: TopicSpec): string {
  const terms = [
    { term: '砥粒（Grit）', def: '砥粒サイズの規格番号（FEPA P / JIS）。数字が小さいほど粗目、大きいほど細目' },
    { term: '基材（Backing）', def: '砥粒を支える材料：布（柔軟）、紙（安定）、ポリマー（耐湿）' },
    { term: '接着剤（Resin Bond）', def: '砥粒を基材に固定する粘着材料。耐熱性樹脂' },
    { term: 'フック&ループ（Hook & Loop）', def: 'ベルクロ式取付システム。ディスクの素早い交換を可能に' },
    { term: 'PSA（圧感型粘着）', def: '圧力で粘着するディスク。粘着ベースに一回の取付' },
    { term: 'メッシュ（Mesh）', def: '穴あきディスク/ベルト。粉塵排出でローディング低減、仕上げ向上' },
    { term: '最小注文数量（MOQ）', def: 'サプライヤーが1回の生産で受ける最小数量' },
    { term: '納期（Lead Time）', def: '最終仕様承認から港/倉庫納品までの期間' },
    { term: 'OEM / 自社ブランド', def: 'クライアントのロゴと包装で製品を製造。書面仕様と契約に基づき' },
  ];

  return `
<div class="info-box glossary-card">
  <h3>用語クイックカード</h3>
  <dl>
    ${terms.map(t => `<dt>${t.term}</dt><dd>${t.def}</dd>`).join('')}
  </dl>
</div>`;
}

function buildInquiryTemplate(topic: TopicSpec): string {
  return `
<div class="info-box inquiry-template">
  <h3>見積依頼テンプレート（コピーして記入・送信）</h3>
  <pre style="background:#1e293b;color:#e2e8f0;padding:1rem;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:0.85rem;line-height:1.6;">製品: [製品名/ファミリー]
寸法: [例：533×75 mm または 5 inch]
砥粒: [例：80、120、240]
砥粒タイプ: [酸化アルミニウム / ジルコニアアルミナ / セラミック / 未定]
基材: [布 / 紙 / ポリマー / 未定]
取付: [フック&ループ / PSA / メッシュ / 未定]
数量: [個/月 または 一括]
頻度: [月次 / 四半期 / 年次 / 一発]
用途: [例：ステンレス、溶接ビード除去、最終仕上げ]
機械: [機械タイプ + ベルトの場合はジョイント方式]
包装: [標準 / OEM - ロゴファイル添付]
出荷先: [港 / 都市 / 国]
決済: [LC / TT / その他]
証書: [COC / COA / JIS / JANSI / 不要]
メモ: [特別な要件]</pre>
  <p><a href="/quote" class="button button--primary">フォームから送信</a></p>
</div>`;
}

function buildContactInfo(): string {
  return `
<div class="contact-info">
  <h3>お問い合わせ</h3>
  <dl class="spec-dl">
    <div><dt>メール</dt><dd><a href="mailto:motai-01@motaiabrasive.com">motai-01@motaiabrasive.com</a></dd></div>
    <div><dt>WhatsApp</dt><dd><a href="https://wa.me/8618118635597" rel="nofollow noopener" target="_blank">+86 181 1863 5597</a></dd></div>
    <div><dt>電話</dt><dd>+86 181 1863 5597</dd></div>
    <div><dt>住所</dt><dd>中国 湖北省 咸寧市 通城県 軍水鎮 玉里大道 88号</dd></div>
    <div><dt>対応目安</dt><dd>営業日：24時間以内 | 週末：48時間以内</dd></div>
  </dl>
</div>`;
}

function buildFAQSection(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
): string {
  const faqs = buildFAQ(topic, model, productCat, industry, jaRegion);

  if (faqs.length === 0) return '';

  let html = '<h2>よくある質問</h2>\n<dl class="faq-list">';
  faqs.forEach(faq => {
    html += `<dt>${faq.q}</dt><dd>${faq.a}</dd>`;
  });
  html += '</dl>';
  return html;
}

function buildCTASection(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const cta = buildCTA(topic, model, productCat);
  const targetUrl = cta.targetUrl || '/quote';

  return `
<div class="cta-band" style="background:#1e3a5f;color:#fff;padding:2rem;border-radius:12px;margin:2rem 0;text-align:center;">
  <h3>${cta.text}</h3>
  <a href="${targetUrl}" class="button button--primary" style="background:#fff;color:#1e3a5f;border:none;padding:0.75rem 1.5rem;border-radius:6px;font-weight:600;text-decoration:none;display:inline-block;margin-top:1rem;">${cta.type === 'hard' ? '今すぐ見積依頼' : '技術チームへ相談'}</a>
</div>`;
}

// ========== 辅助函数 ==========

function buildInternalLinks(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined
) {
  const links = [];

  // 1. 产品/产品族
  if (productCat) {
    links.push({
      url: `/products/${topic.productFamily}`,
      anchorText: productCat.name,
      description: `${productCat.name} ファミリーページ（完全仕様とカスタマイズオプション）`,
    });
  }

  // 2. 行业/应用
  if (industry) {
    links.push({
      url: `/industries/${topic.industry}`,
      anchorText: industry.name,
      description: `${industry.name} のソリューション：製品、課題、実績`,
    });
  }

  // 3. 请求报价
  links.push({
    url: '/quote',
    anchorText: '卸売見積依頼',
    description: '24時間以内に仕様確定と見積回答を行う統一のお問い合わせフォーム',
  });

  // 4. 更多资源
  links.push({
    url: '/resources/abrasive-grit-guide',
    anchorText: '砥粒選択ガイド',
    description: '砥粒グレードと仕上げ任務の対応表',
  });

  links.push({
    url: '/resources/oem-packaging-guide',
    anchorText: 'OEM発注準備ガイド',
    description: 'ブランドファイルと包装を準備し承認を速める手順',
  });

  return links.slice(0, 5);
}

function buildExternalLinks(
  topic: TopicSpec,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
) {
  const links = [];
  const year = new Date().getFullYear();

  // 国际标准
  links.push({
    url: 'https://www.fepa-abrasives.org',
    anchorText: 'FEPA - Federation of European Producers of Abrasives',
    source: 'FEPA',
    year,
  });

  links.push({
    url: 'https://www.iso.org/standard/74568.html',
    anchorText: 'ISO 6344 - Abrasive grain size analysis',
    source: 'ISO',
    year: 2022,
  });

  // 日本規格
  if (jaRegion && jaRegion.code !== 'general-jp') {
    const regulators: Record<string, { url: string; name: string }> = {
      'kanto': { url: 'https://www.jisc.go.jp', name: 'JISC - 日本工業標準調査会' },
      'kansai': { url: 'https://www.jisc.go.jp', name: 'JISC - 日本工業標準調査会' },
      'tohoku': { url: 'https://www.jisc.go.jp', name: 'JISC - 日本工業標準調査会' },
      'chubu': { url: 'https://www.jisc.go.jp', name: 'JISC - 日本工業標準調査会' },
      'chugoku': { url: 'https://www.jisc.go.jp', name: 'JISC - 日本工業標準調査会' },
      'kyushu': { url: 'https://www.jisc.go.jp', name: 'JISC - 日本工業標準調査会' },
    };
    const reg = regulators[jaRegion.code];
    if (reg) {
      links.push({
        url: reg.url,
        anchorText: reg.name,
        source: reg.name.split(' - ')[0],
        year,
      });
    }
  }

  // 职业安全
  links.push({
    url: 'https://www.osha.gov/abrasive-wheels',
    anchorText: 'OSHA - Abrasive Wheels and Tools Safety',
    source: 'OSHA',
    year,
  });

  return links.slice(0, 4);
}

function buildFAQ(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
) {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  const industryName = industry?.name || '';
  const regionName = jaRegion?.name === '全国' ? '日本' : (jaRegion ? `${jaRegion.name}地域` : '日本');

  const baseFAQs = [
    {
      q: `${productName} と類似製品の違いは？`,
      a: `違いは形状（ベルト/ディスク/スポンジ）、取付システム、砥粒範囲にあります。${productName} は ${getMainApplication(topic.productFamily)} に設計されています。詳細は上の比較表を参照。`,
    },
    {
      q: `${industryName} に合う砥粒グレードはどう決める？`,
      a: `工程が基準：除去（40–80）、中間仕上げ（100–180）、最終（240–400+）。材料も重要：高硬度金属 → ジルコニアアルミナ/セラミック、木材/汎用 → 酸化アルミニウム。`,
    },
    {
      q: `正確な見積依頼に必要な情報は？`,
      a: `製品、寸法、砥粒、砥粒タイプ、基材、取付、数量、用途、機械、出荷先、決済条件、必要証書。完全なテンプレートは「見積依頼テンプレート」セクション参照。`,
    },
    {
      q: `最小発注数量（MOQ）は？`,
      a: `仕様ごとに製品、カスタマイズ、包装で決まります。一般的に：標準製品は低め、OEM/カスタムは高め。正確な数値は見積りに依頼。`,
    },
    {
      q: `納期（Lead Time）は？`,
      a: `仕様とサンプル承認後に見積りで確定：生産 + 輸送（${regionName} までの海上または空輸）。正確な数値は見積りに付随。`,
    },
    {
      q: `OEM/自社ブランド対応は？`,
      a: `可能。必要：ベクトルロゴファイル、包装図面、市場言語、印刷仕様。工程：サンプル → 承認 → 量産。詳細は「卸売とOEMガイド」参照。`,
    },
    {
      q: `JIS / JANSI 証書の提供は？`,
      a: `工場適合証書（COC）と分析証明書（COA）を製品仕様に準拠して提供。JIS/JANSI 適合の最終責任は輸入者にあります。必要書類の準備に協力します。`,
    },
  ];

  // 添加类型专属 FAQ
  const typeFAQs: Record<string, Array<{q: string, a: string}>> = {
    'jp-regional-sourcing': [
      { q: `${regionName} に倉庫または拠点がありますか？`, a: `ありません。全荷物は中国の工場（湖北省咸寧市）から出荷します。当地に在庫・拠点・専属代理店はありません。` },
      { q: `${regionName} への輸入に最適な港は？`, a: `主要港湾：${getMainPort(jaRegion?.code)}。通関業者と調整してスムーズな通関を行います。` },
    ],
    'troubleshooting': [
      { q: `ベルトが繰り返し偏位します、どうしますか？`, a: `確認：ローラーアライメント、ジョイント方向、ローラー摩耗、面清掃。偏位90%は正しいアライメントと清潔なローラーで解決します。` },
      { q: `ディスクが素早くローディングします、どうしますか？`, a: `試す：1) 集じん良好なメッシュディスク 2) 圧力軽減 3) 冷却 4) 初期工程の砥粒を粗目 5) 集じんフィルター清掃。` },
    ],
    'process-tutorial': [
      { q: `砥粒を毎回変える間に表面清掃は必要ですか？`, a: `はい、必須です。粗い砥粒の残留は細いグレードでの作業時に表面を傷めます。圧縮空気または清潔な乾いた布を使用。` },
    ],
  };

  const extraFAQs = typeFAQs[topic.articleType] || [];

  // 行业专属 FAQ（site.ts industries.faq，全行业）：FAQ随行业变化
  const industryFAQs = industry?.faq?.map(f => ({ q: f.q, a: f.a })) || [];

  // 型号专属 FAQ（来自 models.ts 的已验证数据）：FAQ随型号变化
  const modelFAQs = model?.faq?.slice(0, 2).map(f => ({ q: f.q, a: f.a })) || [];

  // 种子滑窗：baseFAQs 7 条中取 4 条（窗口起点随 slug 变化）→ 同类型文章 FAQ 组合不同
  const fSeed = seedOf(topic.slug, 1_000_000);
  const win = fSeed % baseFAQs.length;
  const baseWindow = [0, 1, 2, 3].map(i => baseFAQs[(win + i) % baseFAQs.length]);

  return [...modelFAQs, ...industryFAQs, ...baseWindow, ...extraFAQs].slice(0, 8);
}

function buildSpecsTable(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined) {
  if (!model) return undefined;

  return [
    { パラメータ: '製品', 値: model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily) },
    { パラメータ: '寸法', 値: model.sizeJa },
    { パラメータ: '砥粒範囲', 値: model.gritRange.join(' – ') },
    { パラメータ: 'タイプ', 値: model.type === 'belt' ? 'ベルト' : 'ディスク' },
    { パラメータ: '基材', 値: model.backing },
    { パラメータ: '取付', 値: model.attachment },
    { パラメータ: '用途', 値: model.useCases.join('、') },
  ];
}

function buildInfoBoxes(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
) {
  const boxes = [];
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);

  // Quick Answer
  boxes.push({
    type: 'quick-answer' as const,
    title: 'クイック回答',
    content: [
      `製品：${productName}`,
      `一般砥粒：${getCommonGritRange(topic.productFamily)}`,
      `主要用途：${getMainApplication(topic.productFamily)}`,
      `取付システム：${model?.attachment || 'フック&ループ / PSA / メッシュ'}`,
    ],
  });

  // Spec Checklist
  boxes.push({
    type: 'spec-checklist' as const,
    title: '発注前の仕様確認リスト',
    content: [
      '☐ 製品とファミリー',
      '☐ 正確な寸法（mm/inch）',
      '☐ 砥粒グレード（FEPA P）',
      '☐ 砥粒タイプ（Al₂O₃ / ZrO₂ / セラミック / SiC）',
      '☐ 基材（布 / 紙 / ポリマー）',
      '☐ 取付システム（フック&ループ / PSA / メッシュ）',
      '☐ 数量と頻度',
      '☐ 用途/加工材料',
      '☐ 機械タイプ + ジョイント方式',
      '☐ 出荷先（港/都市）',
      '☐ OEM/包装要件',
      '☐ 必要証書（COC/COA/JIS/JANSI）',
    ],
  });

  // Inquiry Checklist
  boxes.push({
    type: 'inquiry-checklist' as const,
    title: 'コピー可能な見積依頼テンプレート',
    content: [
      `製品：${productName}`,
      `寸法：[記入]`,
      `砥粒：[記入]`,
      `数量：[単位/期間]`,
      `用途：[材料 + 工程]`,
      `機械：[タイプ + 取付]`,
      `出荷先：[港/都市]`,
      `決済：[LC/TT/その他]`,
    ],
  });

  return boxes.slice(0, 3);
}

function buildInlineInfoBoxes(topic: TopicSpec, sectionIdx: number): string {
  // 在文章开头或第一个 H2 后插入信息块
  if (sectionIdx === 0) {
    return `
<div class="info-box quick-answer" style="background:#eff6ff;border-left:4px solid #3b82f6;padding:1rem;margin:1.5rem 0;border-radius:8px 0 0 8px;">
  <strong>要点：</strong> 本記事では ${topic.title} を解説します。要点は仕様表、チェックリスト、見積依頼テンプレート（下）にまとめます。
</div>`;
  }
  return '';
}

function buildVoiceSearchQueries(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined,
  industry: typeof industries[0] | undefined,
  jaRegion: typeof jaRegions[0] | undefined
): string[] {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  const industryName = industry?.name || '';
  const regionName = jaRegion?.name === '全国' ? '日本' : (jaRegion ? `${jaRegion.name}地域` : '日本');

  return [
    `最適な ${productName} は ${industryName} にどれ？`,
    `${productName} の砥粒はどう選ぶ？`,
    `${regionName} で ${productName} の卸価格は？`,
    `信頼できる ${productName} サプライヤーはどこ？`,
    `${productName} の ${industryName} 仕様は？`,
  ];
}

function buildCTA(
  topic: TopicSpec,
  model: typeof models[0] | null,
  productCat: typeof productCategories[0] | undefined
) {
  const productName = model?.name || productCat?.name || getProductFamilyNameJa(topic.productFamily);
  const isHard = ['product-spec-detail', 'procurement-guide', 'wholesale-oem-guide', 'jp-regional-sourcing', 'buying-guide', 'product-comparison', 'faq-buyers-guide'].includes(topic.articleType);
  const cv = seedOf(topic.slug, 1_000_000);
  const pick = <T,>(arr: T[]) => pickBySeed(arr, cv, arr.length) ?? arr[0];

  if (isHard) {
    return {
      type: 'hard' as const,
      text: pick([
        `${productName} の卸売見積を依頼してください。タイプ、寸法、砥粒、基材/取付、数量、用途、出荷先、OEM要件（あれば）を添付。`,
        `${productName} の大量発注：寸法、砥粒、取付システム、推定数量、出荷先を指定。チームが仕様を確認し見積りを送ります。`,
        `${productName} の仕様のまとめ（寸法、砥粒、取付、数量、出荷先）を準備し、卸売見積を依頼 — 必要なら OEM と包装オプション込み。`,
      ]),
      targetUrl: '/quote',
    };
  } else {
    return {
      type: 'soft' as const,
      text: pick([
        `${productName} の技術的なご質問はありますか？加工材料、工程、機械をお知らせください。最適な仕様を提案します。`,
        `${productName} を技術者に質問：材料、工程、機械タイプを送ってください。最適な砥粒と基材を前提なく決定します。`,
        `${productName} の選択でお悩みですか？技術サポート：用途（材料 + 機械 + 工程）を送ってください。砥粒シークエンス付き仕様を提案します。`,
      ]),
      targetUrl: '/quote',
    };
  }
}

function buildMetaDescription(topic: TopicSpec, model: typeof models[0] | null, productCat: typeof productCategories[0] | undefined): string {
  const productName = model?.name || productCat?.name || t(topic.productFamily);
  const industryName = industrySegments.find(i => i.code === topic.industry)?.name || '';
  const regionName = jaRegions.find(r => r.code === topic.jaRegion)?.name || '';

  let desc = `${topic.title}。${productName} の仕様`;

  if (industryName) desc += `、${industryName}向け`;
  if (regionName && regionName !== '全国') desc += `、${regionName}地域`;

  desc += `。砥粒、基材、取付、MOQ、納期、発注手順。`;

  return desc.slice(0, 160);
}

// ========== 数据辅助函数 ==========

function getAlternativeProduct(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': '研磨ディスク',
    'flap-discs': '研磨ベルト',
    'sanding-discs': '研磨ベルト',
    'hook-loop': 'PSA粘着ディスク',
    'sanding-sponges': '研磨ディスク',
  };
  return map[productFamily] || '代替製品';
}

function getMainApplication(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': 'ベルト研削機でのエッジ・板材仕上げ（木/金属）',
    'flap-discs': 'アングルでの錆・溶接ビード・金属仕上げ',
    'sanding-discs': '平面仕上げ、塗装準備',
    'hook-loop': '平面の素早い砥粒交換',
    'sanding-sponges': 'エッジ、曲面、手作業の精密仕上げ',
  };
  return map[productFamily] || '汎用工業用途';
}

function getWorkpieceMaterials(industryCode: string): string[] {
  const map: Record<string, string[]> = {
    'woodworking': ['軟木', '硬木', 'MDF', '集成材', 'フローリング'],
    'metalworking': ['炭素鋼', 'ステンレス', 'アルミ', '鋳鉄', 'チタン'],
    'automotive': ['鋼板', 'アルミ', 'FRP', 'コーティング金属'],
    'shipbuilding': ['海洋鋼板', 'ステンレス', '海洋アルミ'],
    'oil-gas': ['炭素鋼パイプ', 'ステンレス', 'ニッケル合金', '高強度鋼'],
    'construction': ['木材', '石膏ボード', 'セメント', '石材', 'タイル'],
    'general': ['多材料'],
  };
  return map[industryCode] || ['多材料'];
}

function getGrainTypes(productFamily: string): string[] {
  const map: Record<string, string[]> = {
    'abrasive-belts': ['酸化アルミニウム', 'ジルコニアアルミナ', 'セラミック', '炭化シリコン（SiC）'],
    'flap-discs': ['酸化アルミニウム', 'ジルコニアアルミナ', 'セラミック'],
    'sanding-discs': ['酸化アルミニウム', '炭化シリコン（SiC）', 'ジルコニアアルミナ'],
    'hook-loop': ['酸化アルミニウム', '炭化シリコン（SiC）'],
    'sanding-sponges': ['酸化アルミニウム', '炭化シリコン（SiC）'],
  };
  return map[productFamily] || ['酸化アルミニウム'];
}

function getCommonGritRange(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': '40–800',
    'flap-discs': '40–320',
    'sanding-discs': '60–5000',
    'hook-loop': '60–5000',
    'sanding-sponges': '60–3000',
  };
  return map[productFamily] || '60–800';
}

function getProductFamilyNameJa(productFamily: string): string {
  const map: Record<string, string> = {
    'abrasive-belts': '研磨ベルト',
    'flap-discs': 'フラップディスク',
    'sanding-discs': '研磨ディスク',
    'hook-loop': 'フック&ループディスク',
    'sanding-sponges': '研磨スポンジ',
  };
  return map[productFamily] || productFamily;
}

function getMainPort(regionCode: string | undefined): string {
  const ports: Record<string, string> = {
    'kanto': '横浜',
    'kansai': '神戸',
    'tohoku': '仙台（石巻）',
    'chubu': '名古屋',
    'chugoku': '広島',
    'kyushu': '北九州',
  };
  return ports[regionCode || ''] || '主要港湾';
}

function getLocalRegulator(regionCode: string): string {
  const regulators: Record<string, string> = {
    'kanto': 'JIS / JANSI',
    'kansai': 'JIS / JANSI',
    'tohoku': 'JIS / JANSI',
    'chubu': 'JIS / JANSI',
    'chugoku': 'JIS / JANSI',
    'kyushu': 'JIS / JANSI',
  };
  return regulators[regionCode] || '地域の規格当局';
}

// ========== 测试用主函数 ==========

export function generateSampleArticles(count: number = 10): GeneratedArticle[] {
  const samples = topicMatrix.slice(0, count);
  return samples.map(topic => generateArticle(topic));
}
