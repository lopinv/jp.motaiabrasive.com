/**
 * 選題マトリクス生成器
 * 製品×仕様×業界×日本地域×13記事タイプ の組み合わせ生成
 * 目標：重複排除・意図を区別・キーワードカニバライズしない 3000 本の選題
 */

import { models } from '../data/models';
import { productCategories, industries } from '../data/site';
import { getAllTemplateTypes, getTemplate } from './article-templates';

// ========== 基本ディメンション定義 ==========

// 純粋な Hook&Loop 変体は hook-loop ファミリーにのみ帰属させ
//（sanding-discs から除外）同一型番が 2 ファミリーで重複タイトルを出すのを防ぐ
const HOOK_ONLY_MODEL_SLUGS = new Set(['hook-loop-disc', 'hook-loop-disc-multi-hole', 'hook-loop-disc-film']);

export const productFamilies = [
  { slug: 'abrasive-belts', name: '研磨ベルト', models: models.filter(m => m.categorySlug === 'abrasive-belts') },
  { slug: 'flap-discs', name: 'フラップディスク', models: models.filter(m => m.categorySlug === 'flap-discs') },
  { slug: 'sanding-discs', name: '研磨ディスク', models: models.filter(m => m.categorySlug === 'sanding-discs' && !HOOK_ONLY_MODEL_SLUGS.has(m.slug)) },
  { slug: 'hook-loop', name: 'フック&ループディスク', models: models.filter(m => m.categorySlug === 'sanding-discs' && m.attachment.includes('Hook')) },
  { slug: 'sanding-sponges', name: '研磨スポンジ', models: models.filter(m => m.categorySlug === 'sanding-sponges') },
] as const;

/**
 * 日本地域 — 記事の地域ディメンション（旧 GCC 諸国 → 日本地域）。
 * 主市場は関東（東京/横浜の製造業クラスタ + 横浜・川崎・千葉の主要輸入港）。
 */
export const jaRegions = [
  { code: 'kanto', name: '関東', nameEn: 'Kanto', clusters: ['東京', '横浜', '川崎', '千葉'] },
  { code: 'kansai', name: '関西', nameEn: 'Kansai', clusters: ['大阪', '神戸', '京都'] },
  { code: 'tohoku', name: '東北', nameEn: 'Tohoku', clusters: ['仙台'] },
  { code: 'chubu', name: '中部', nameEn: 'Chubu', clusters: ['名古屋', '愛知', '新潟'] },
  { code: 'chugoku', name: '中国地方', nameEn: 'Chugoku', clusters: ['広島', '山口'] },
  { code: 'kyushu', name: '九州', nameEn: 'Kyushu', clusters: ['福岡', '北九州'] },
  { code: 'general-jp', name: '全国', nameEn: 'All Japan', clusters: [] },
] as const;

// titleName: SEO タイトル作成用の短縮名（≤ 70 文字制約）— generateTitleVariants に使用
export const industrySegments = [
  { code: 'woodworking', name: '木工', titleName: '木工', nameEn: 'Woodworking', keyProcesses: ['木材表面準備', 'エッジ仕上げ', '家具製造', '床材'] },
  { code: 'metalworking', name: '金属仕上げ', titleName: '金属', nameEn: 'Metalworking', keyProcesses: ['バリ取り', '錆除去', '溶接ビード処理', '表面準備', '板金'] },
  { code: 'automotive', name: '自動車・メンテナンス', titleName: '自動車', nameEn: 'Automotive', keyProcesses: ['車体サンディング', 'プライマー研磨', '板金修理', '最終ポリッシュ'] },
  { code: 'shipbuilding', name: '造船・船舶メンテナンス', titleName: '造船', nameEn: 'Shipbuilding', keyProcesses: ['鋼板錆除去', '溶接処理', '塗装前準備', '表面防滑'] },
  { code: 'oil-gas', name: '石油・ガス - 表面準備', titleName: '石油・ガス', nameEn: 'Oil & Gas', keyProcesses: ['パイプ錆除去', 'タンク内面処理', '海洋リグメンテナンス', '防食塗装前準備'] },
  { code: 'construction', name: '建設材料加工', titleName: '建設', nameEn: 'Construction Materials', keyProcesses: ['木材板材', '石膏ボードサンディング', '石材ポリッシュ', 'コンクリート研磨'] },
  { code: 'general', name: '一般産業', titleName: '一般産業', nameEn: 'General Industrial', keyProcesses: ['メンテナンス・修理', '一般サンディング', '表面清掃'] },
] as const;

export const articleTypes = getAllTemplateTypes();

// ========== キーワードライブラリ（ロングテール組み合わせ用） ==========

export const keywordLibrary = {
  // コア製品語（メインキーワード候補）
  primaryKeywords: {
    'abrasive-belts': ['研磨ベルト', 'サンディングベルト', '耐水研磨ベルト'],
    'flap-discs': ['フラップディスク', 'フラップ研磨ディスク', '研削フラップディスク'],
    'sanding-discs': ['研磨ディスク', 'サンディングディスク', 'メッシュディスク'],
    'hook-loop': ['フック&ループディスク', 'ベルクロディスク', '着脱式研磨ディスク'],
    'sanding-sponges': ['研磨スポンジ', 'サンディングスポンジ', 'スポンジ研磨材'],
  },

  // 仕様語（サブキーワード）
  specKeywords: {
    grit: ['砥粒 40', '砥粒 60', '砥粒 80', '砥粒 100', '砥粒 120', '砥粒 150', '砥粒 180', '砥粒 240', '砥粒 320', '砥粒 400', '砥粒 600', '砥粒 800', '砥粒 1000', '砥粒 3000', '砥粒 5000'],
    size: ['533×75 mm', '610×100 mm', '1520×630 mm', '2200×1330 mm', '3インチ', '4インチ', '5インチ', '6インチ', '125 mm', '150 mm'],
    backing: ['布基材', '紙基材', '合成繊維基材', 'プラスチック基材', 'ガラス繊維基材'],
    attachment: ['フック&ループ', 'PSA（圧感型粘着）', 'メッシュ'],
    grain: ['酸化アルミニウム', '炭化シリコン（SiC）', 'ジルコニアアルミナ', 'セラミック砥粒'],
  },

  // 応用語
  applicationKeywords: {
    'woodworking': ['木工', '家具', '合板', '木材エッジ', 'フローリング'],
    'metalworking': ['金属', 'ステンレス', '鉄', 'アルミ', 'バリ取り', '溶接ビード', '錆除去'],
    'automotive': ['自動車', '車体パネル', 'メンテナンス', '塗装', 'ポリッシュ'],
    'shipbuilding': ['船舶', 'ドック', '船体メンテナンス', '鋼板', '防錆'],
    'oil-gas': ['石油', 'ガス', 'パイプ', 'タンク', '海洋プラットフォーム', '防食'],
    'construction': ['建設', '石膏ボード', 'セメント', '石材', 'タイル'],
  },

  // 調達語
  procurementKeywords: [
    '卸売サプライヤー', '産業用品販売店', '工場直販', '見積依頼', '価格見積',
    '最小注文数量（MOQ）', '納期', 'サンプル依頼', 'OEM（顧客ブランド製造）',
    '適合証明書（COC）', '分析証明書（COA）', 'カスタム包装', '海上運送', '空輸',
  ],

  // 地域語
  regionalKeywords: jaRegions.map(r => `${r.name} 供給元`).concat(
    jaRegions.map(r => `${r.name} 販売代理`)
  ).concat(
    jaRegions.map(r => `${r.name} 市場`)
  ),

  // 技術/規格語
  technicalKeywords: [
    'FEPA規格', 'ISO 6344', 'JIS', 'JANSI', 'ANSI',
    '個人用保護具', '集じん', '表面準備',
    '砥粒グレード', 'スポンジ接着剤', 'CE', 'PSE',
  ],
};

// ========== 選題生成ロジック ==========

export interface TopicSpec {
  id: string;
  slug: string;
  title: string;
  articleType: string;
  productFamily: string;
  productModel?: string;
  industry: string;
  jaRegion: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  searchIntent: 'informational' | 'technical' | 'commercial' | 'supplier-evaluation' | 'transactional';
  buyerJourneyStage: 'understanding' | 'evaluation' | 'comparison' | 'sourcing';
  estimatedWordCount: number;
  priority: number; // 1=優先度高（商業価値の高いロングテール）, 2=中, 3=低
  dedupeKey: string; // 重複排除用
}

/**
 * 特定の組み合わせの選題を生成
 */
function generateTopicsForCombination(
  productFamily: typeof productFamilies[0],
  model: typeof models[0] | null,
  industry: typeof industrySegments[0],
  jaRegion: typeof jaRegions[0],
  articleType: string
): TopicSpec[] {
  const template = getTemplate(articleType);
  if (!template) return [];

  const topics: TopicSpec[] = [];
  const baseId = `${productFamily.slug}-${model?.slug || 'general'}-${industry.code}-${jaRegion.code}-${articleType}`;

  // 記事タイプに応じたバリアントタイトルを生成；最初にバリアント（focus 0）のみ採用。
  // 以降のフォーカスバリアント（例 grit-size-selection）はメインバリアントと同一 cell 本文の
  // Jaccard 0.95 以上で、同一テンプレートの角度替えコピーであり生成しない。
  // 例外：jp-regional-sourcing の 2 バリアント（import-guide / market-logistics）は
  // 本文が地域別データで駆動され差異が顕著のため、残す。
  const all = generateTitleVariants(productFamily, model, industry, jaRegion, articleType);
  const variants = articleType === 'jp-regional-sourcing' ? all : all.slice(0, 1);

  variants.forEach((variant, idx) => {
    const keywords = selectKeywords(productFamily.slug, industry.code, jaRegion.code, articleType, model);
    const modelSlug = model?.slug || 'general';
    const dedupeKey = `${productFamily.slug}|${modelSlug}|${industry.code}|${jaRegion.code}|${articleType}|${variant.focus}`;

    topics.push({
      id: `${baseId}-${idx}`,
      slug: generateSlug(productFamily.slug, modelSlug, industry.code, jaRegion.code, articleType, variant.focus, idx),
      title: variant.title,
      articleType,
      productFamily: productFamily.slug,
      productModel: model?.slug,
      industry: industry.code,
      jaRegion: jaRegion.code,
      primaryKeyword: keywords.primary,
      secondaryKeywords: keywords.secondary,
      longTailKeywords: keywords.longTail,
      searchIntent: mapIntent(articleType),
      buyerJourneyStage: template.buyerJourneyStage,
      estimatedWordCount: Math.floor((template.minWordCount + template.maxWordCount) / 2),
      priority: calculatePriority(articleType, jaRegion.code, industry.code),
      dedupeKey,
    });
  });

  return topics;
}

/**
 * タイトルバリアントを生成
 */
function generateTitleVariants(
  productFamily: typeof productFamilies[0],
  model: typeof models[0] | null,
  industry: typeof industrySegments[0],
  jaRegion: typeof jaRegions[0],
  articleType: string
): Array<{ title: string; focus: string }> {
  const variants: Array<{ title: string; focus: string }> = [];
  // タイトルは shortName（型番短名）で長さを制御；型番なし時はファミリー名にフォールバック
  const modelName = model ? (model.shortName || model.name) : productFamily.name;
  const regionName = jaRegion.code === 'general-jp' ? '全国' : jaRegion.name;
  const industryName = industry.name;

  // タイトルはセクター短縮名（titleName）で 70 文字以内に収める
  const iName = (industry as any).titleName || industryName;
  const altProduct = getAlternativeProduct(productFamily.slug);

  switch (articleType) {
    case 'product-comparison':
      // 同ファミリーの異なる仕様、または異ファミリーの比較（型番名を一意性のアンカーとして保持）
      variants.push({
        title: `${modelName} vs ${altProduct}｜${iName}・${regionName}でどう選ぶ？`,
        focus: 'vs-alternative',
      });
      variants.push({
        title: `【選定ガイド】${iName}向け${modelName}の選び方（${regionName}）`,
        focus: 'selection-guide',
      });
      break;

    case 'multi-product-comparison':
      variants.push({
        title: `${iName}向け${modelName}複数仕様比較（${regionName}）`,
        focus: 'full-matrix',
      });
      break;

    case 'buying-guide':
      variants.push({
        title: `${iName}向け${modelName} 購入ガイド（${regionName}）`,
        focus: 'complete-guide',
      });
      if (model) {
        variants.push({
          title: `${modelName} の砥粒・サイズ選び｜${iName} ${regionName}`,
          focus: 'grit-size-selection',
        });
      }
      break;

    case 'technical-guide':
      variants.push({
        title: `${modelName}の規格と構造｜${iName}での性能（${regionName}）`,
        focus: 'technical-deep-dive',
      });
      break;

    case 'application-guide':
      variants.push({
        title: `${iName}における${modelName}の適用ガイド（${regionName}）`,
        focus: 'industry-application',
      });
      break;

    case 'process-tutorial':
      variants.push({
        title: `${iName}向け ${getProcessName(industry.code)} 工程解説（${modelName}使用・${regionName}）`,
        focus: 'step-by-step',
      });
      break;

    case 'troubleshooting':
      variants.push({
        title: `${iName}での${modelName}不具合と対策（${regionName}）`,
        focus: 'failure-modes',
      });
      break;

    case 'product-spec-detail':
      if (model) {
        variants.push({
          title: `${modelName} 仕様詳細｜${iName}・${regionName}`,
          focus: 'full-specs',
        });
      }
      break;

    case 'procurement-guide':
      variants.push({
        title: `${iName}向け${modelName} サプライヤー評価ガイド（${regionName}）`,
        focus: 'procurement-process',
      });
      break;

    case 'wholesale-oem-guide':
      variants.push({
        title: `${modelName}の卸・OEMガイド｜${iName}（${regionName}）`,
        focus: 'wholesale-oem',
      });
      break;

    case 'industry-market':
      variants.push({
        title: `${iName}市場の動向と${modelName}への影響（${regionName}）`,
        focus: 'market-trends',
      });
      break;

    case 'jp-regional-sourcing':
      if (jaRegion.code !== 'general-jp') {
        variants.push({
          title: `【${regionName}】${modelName}の輸入・物流ガイド（${iName}向け）`,
          focus: 'import-guide',
        });
        variants.push({
          title: `${regionName}における${modelName}の市場と調達`,
          focus: 'market-logistics',
        });
      }
      break;

    case 'faq-buyers-guide':
      variants.push({
        title: `${iName}向け${modelName} 購入者FAQ（${regionName}）`,
        focus: 'buyer-faq',
      });
      break;
  }

  return variants;
}

/**
 * キーワード組み合わせを選択
 */
function selectKeywords(
  productFamilySlug: string,
  industryCode: string,
  jaRegionCode: string,
  articleType: string,
  model: typeof models[0] | null
) {
  const lib = keywordLibrary;
  const primaryCandidates = lib.primaryKeywords[productFamilySlug as keyof typeof lib.primaryKeywords] || [productFamilySlug];
  const primary = primaryCandidates[0];

  // サブキーワード：仕様 + 応用 + 調達
  const secondary: string[] = [];
  if (model) {
    secondary.push(...model.gritRange.slice(0, 3).map(g => `砥粒 ${g}`));
    secondary.push(model.sizeJa);
  }
  secondary.push(...(lib.applicationKeywords[industryCode as keyof typeof lib.applicationKeywords] || []).slice(0, 2));
  secondary.push(...lib.procurementKeywords.slice(0, 2));
  secondary.push(...lib.technicalKeywords.slice(0, 1));

  // ロングテール：地域 + 製品 + 調達/応用
  const longTail: string[] = [];
  const regionName = jaRegions.find(c => c.code === jaRegionCode)?.name || '';
  if (regionName && jaRegionCode !== 'general-jp') {
    longTail.push(`${primary} ${regionName}`);
    longTail.push(`${primary} 供給元 ${regionName}`);
    longTail.push(`${primary} ${industrySegments.find(i => i.code === industryCode)?.name}向け ${regionName}`);
  }
  longTail.push(`${primary} 見積依頼`);
  longTail.push(`${primary} の選び方`);

  return {
    primary,
    secondary: [...new Set(secondary)].slice(0, 6),
    longTail: [...new Set(longTail)].slice(0, 5),
  };
}

/**
 * URL slug を生成
 */
function generateSlug(
  productFamily: string,
  modelSlug: string,
  industry: string,
  jaRegion: string,
  articleType: string,
  focus: string,
  variantIdx: number
): string {
  const parts = [productFamily, modelSlug, industry, jaRegion, articleType, focus, String(variantIdx)];
  return parts.filter(Boolean).join('-').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

/**
 * 記事タイプを検索意図へマッピング
 */
function mapIntent(articleType: string): TopicSpec['searchIntent'] {
  const intentMap: Record<string, TopicSpec['searchIntent']> = {
    'product-comparison': 'commercial',
    'multi-product-comparison': 'commercial',
    'buying-guide': 'commercial',
    'technical-guide': 'technical',
    'application-guide': 'informational',
    'process-tutorial': 'technical',
    'troubleshooting': 'technical',
    'product-spec-detail': 'supplier-evaluation',
    'procurement-guide': 'supplier-evaluation',
    'wholesale-oem-guide': 'transactional',
    'industry-market': 'informational',
    'jp-regional-sourcing': 'supplier-evaluation',
    'faq-buyers-guide': 'commercial',
  };
  return intentMap[articleType] || 'informational';
}

/**
 * 優先度計算（1=高、商業価値の高いロングテール優先）
 */
function calculatePriority(articleType: string, jaRegion: string, industry: string): number {
  // 高商業意図タイプ + 核心地域 + 核心業界 = 優先度 1
  const highIntentTypes = ['buying-guide', 'product-spec-detail', 'procurement-guide', 'wholesale-oem-guide', 'jp-regional-sourcing', 'product-comparison'];
  const coreRegions = ['kanto', 'kansai', 'tohoku'];
  const coreIndustries = ['metalworking', 'woodworking', 'automotive', 'shipbuilding', 'oil-gas'];

  let score = 0;
  if (highIntentTypes.includes(articleType)) score += 2;
  if (coreRegions.includes(jaRegion)) score += 2;
  if (coreIndustries.includes(industry)) score += 1;

  if (score >= 4) return 1;
  if (score >= 2) return 2;
  return 3;
}

/**
 * 補助関数
 */
function getAlternativeProduct(productFamilySlug: string): string {
  const alternatives: Record<string, string> = {
    'abrasive-belts': '研磨ディスク',
    'flap-discs': '研磨ベルト',
    'sanding-discs': '研磨ベルト',
    'hook-loop': 'PSA粘着ディスク',
    'sanding-sponges': '研磨ディスク',
  };
  return alternatives[productFamilySlug] || '代替製品';
}

function getTechnicalTopic(productFamilySlug: string): string {
  const topics: Record<string, string> = {
    'abrasive-belts': '研磨ベルト（砥粒、基材、接着剤）',
    'flap-discs': 'フラップディスク（フラップ枚数、基材、角度）',
    'sanding-discs': '研磨ディスク（メッシュ、樹脂、粘着）',
    'hook-loop': 'フック&ループシステム（フック、ループ、互換性）',
    'sanding-sponges': '研磨スポンジ（密度、砥粒、柔軟性）',
  };
  return topics[productFamilySlug] || '技術';
}

/**
 * 型番名付き技術トピック：型番があれば「製品名（技術ディメンション）」を使用し、
 * なければ純技術トピックにフォールバック。technical-guide タイトルに具体型番を含め、
 * 同ファミリーでの重複タイトルを防ぐ。
 */
function getTechnicalTopicForModel(
  productFamilySlug: string,
  model: typeof models[0] | null
): string {
  if (model) return `${model.name}（砥粒、基材、接着剤）`;
  return getTechnicalTopic(productFamilySlug);
}

function getProcessName(industryCode: string): string {
  const processes: Record<string, string> = {
    'woodworking': '木材仕上げ工程',
    'metalworking': '金属仕上げ工程',
    'automotive': '車体パネル準備工程',
    'shipbuilding': '船体表面処理工程',
    'oil-gas': 'パイプ・タンク表面準備工程',
    'construction': '建設材料加工工程',
    'general': '産業用サンディング工程',
  };
  return processes[industryCode] || '工程';
}

// ========== メイン生成関数 ==========

/**
 * 完全な選題マトリクスを生成（目標 ~3000 本）
 */
export function generateTopicMatrix(): TopicSpec[] {
  const allTopics: TopicSpec[] = [];

  // すべての組み合わせを反復
  for (const productFamily of productFamilies) {
    const modelsToUse = productFamily.models.length > 0 ? productFamily.models : [null];

    for (const model of modelsToUse) {
      for (const industry of industrySegments) {
        // フィルタ：関連する製品-業界組み合わせのみ生成
        if (!isRelevantCombination(productFamily.slug, industry.code, model)) continue;

        for (const jaRegion of jaRegions) {
          // 反スケール化戦略：記事選題は「主市場(関東)+全国(general-jp)」の二軌で生成、
          // 残り 5 地域は地域ソーシング篇（jp-regional-sourcing）のみ生成。
          // その本文は地域別実データ（港湾、規格適合、工業クラスタ、商務要点）で駆動され
          // 他地域版との本文が顕著に異なる——地域名だけ差し替えた doorway 形態ではない。
          const isNationwide = jaRegion.code === 'general-jp';
          const isPrimary = jaRegion.code === 'kanto';
          if (!isPrimary && !isNationwide) {
            // 非主市場：地域ソーシング 2 タイプのみ
            const regionalTypes = articleTypes.filter(t => t === 'jp-regional-sourcing');
            for (const articleType of regionalTypes) {
              allTopics.push(...generateTopicsForCombination(productFamily, model, industry, jaRegion, articleType));
            }
            continue;
          }
          // 主市場/全国：地域ソーシング篇は general-jp では生成しない
          let relevantTypes = isNationwide
            ? articleTypes.filter(t => t !== 'jp-regional-sourcing')
            : articleTypes;

          for (const articleType of relevantTypes) {
            const topics = generateTopicsForCombination(productFamily, model, industry, jaRegion, articleType);
            allTopics.push(...topics);
          }
        }
      }
    }
  }

  // 重複排除
  const deduped = deduplicateTopics(allTopics);

  // 優先度順にソート
  deduped.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));

  return deduped;
}

/**
 * 製品-業界-型番組み合わせの関連性を判定
 */
function isRelevantCombination(productFamily: string, industry: string, model: typeof models[0] | null): boolean {
  const relevanceMap: Record<string, string[]> = {
    'abrasive-belts': ['woodworking', 'metalworking', 'automotive', 'shipbuilding', 'construction', 'oil-gas', 'general'],
    'flap-discs': ['metalworking', 'automotive', 'shipbuilding', 'oil-gas', 'construction', 'woodworking', 'general'],
    'sanding-discs': ['woodworking', 'metalworking', 'automotive', 'construction', 'shipbuilding', 'general'],
    'hook-loop': ['woodworking', 'metalworking', 'automotive', 'construction', 'general'],
    'sanding-sponges': ['woodworking', 'automotive', 'construction', 'metalworking', 'general'],
  };
  return relevanceMap[productFamily]?.includes(industry) ?? true;
}

/**
 * 重複排除：同一 dedupeKey は最優先度のみ保持
 */
function deduplicateTopics(topics: TopicSpec[]): TopicSpec[] {
  const seen = new Map<string, TopicSpec>();
  for (const topic of topics) {
    const existing = seen.get(topic.dedupeKey);
    if (!existing || topic.priority < existing.priority) {
      seen.set(topic.dedupeKey, topic);
    }
  }
  return Array.from(seen.values());
}

/**
 * 統計レポート
 */
export function printMatrixStats(topics: TopicSpec[]) {
  console.log(`\n=== 選題マトリクス統計 ===`);
  console.log(`合計: ${topics.length} 本`);

  const byType = topics.reduce((acc, t) => {
    acc[t.articleType] = (acc[t.articleType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\nタイプ別:');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const byPriority = topics.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  console.log('\n優先度別:');
  Object.entries(byPriority).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([k, v]) => console.log(`  P${k}: ${v}`));

  const byRegion = topics.reduce((acc, t) => {
    acc[t.jaRegion] = (acc[t.jaRegion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n地域別:');
  Object.entries(byRegion).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const byProduct = topics.reduce((acc, t) => {
    acc[t.productFamily] = (acc[t.productFamily] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n製品ファミリー別:');
  Object.entries(byProduct).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  const byIndustry = topics.reduce((acc, t) => {
    acc[t.industry] = (acc[t.industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\n業界別:');
  Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

// シングルトンエクスポート
export const topicMatrix = generateTopicMatrix();
printMatrixStats(topicMatrix);
