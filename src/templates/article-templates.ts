/**
 * 13 种文章类型的模板系统
 * 每个模板包含：结构大纲、必含模块、变量插槽、术语约束
 * 大纲与术语均为日语（日本站 jp.motaiabrasive.com）
 */

export interface ArticleTemplate {
  type: string;
  name: string;
  description: string;
  structure: string[]; // H2 级大纲
  requiredModules: string[]; // 必含模块：BLUF, 直接回答块, 表格, 信息块, FAQ, CTA
  variableSlots: string[]; // 可插入变量
  terminologyConstraints: string[]; // 术语表强制词
  minWordCount: number;
  maxWordCount: number;
  ctaType: 'hard' | 'soft';
  buyerJourneyStage: 'understanding' | 'evaluation' | 'comparison' | 'sourcing';
}

export const articleTemplates: Record<string, ArticleTemplate> = {
  'product-comparison': {
    type: 'product-comparison',
    name: '产品对比',
    description: '两种产品/方案的深度对比，帮助买家按工艺选型',
    structure: [
      '直接回答：A/Bのそれぞれが向く場面',
      '本質的な違いの比較表',
      '用途シナリオ別の判断フロー',
      '選定基準の詳細分析',
      'よくある選択ミスとその回避法',
      '発注前の確認チェックリスト',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'comparison-table', 'decision-tree', 'spec-table', 'common-mistakes', 'inquiry-checklist', 'FAQ', 'CTA'],
    variableSlots: ['productA', 'productB', 'application', 'material', 'gritRange', 'machineType', 'attachmentSystem'],
    terminologyConstraints: ['研磨ベルト', '研磨ディスク', '砥粒', '基材', '取付システム', 'FEPA P'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'hard',
    buyerJourneyStage: 'comparison',
  },

  'multi-product-comparison': {
    type: 'multi-product-comparison',
    name: '多产品横向对比',
    description: '同类产品不同变体（背板、结合剂、孔型、固定方式）的矩阵对比',
    structure: [
      '直接回答：一言で言い切る本質的な違い',
      '多次元比較マトリクス',
      '各バリアントの適する作業条件',
      '性能とコストのトレードオフ分析',
      '機械互換性テーブル',
      '大量購入の推奨事項',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'comparison-table', 'spec-table', 'compatibility-table', 'procurement-advice', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'variants', 'backingTypes', 'bondTypes', 'holePatterns', 'attachmentSystems', 'machineModels'],
    terminologyConstraints: ['布基材または紙基材', '樹脂接着', 'メッシュ', 'フック&ループ', 'PSA（圧感型粘着）'],
    minWordCount: 1500,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'comparison',
  },

  'buying-guide': {
    type: 'buying-guide',
    name: '选购指南',
    description: '按工艺、材质、机器、预算维度的选型决策指南',
    structure: [
      '直接回答：3ステップで仕様を確定する',
      '選定の判断フロー',
      '主要判定基準テーブル',
      '材料・工程別の推奨砥粒シークエンス',
      '機械互換性の確認チェックリスト',
      'サンプル評価基準',
      '見積依頼の前に準備する情報',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'decision-flow', 'spec-table', 'grit-sequence-table', 'compatibility-checklist', 'sample-evaluation', 'inquiry-checklist', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'workpieceMaterials', 'processSteps', 'machineTypes', 'budgetRanges', 'gritProgressions'],
    terminologyConstraints: ['砥粒', '仕上げ工程', '切削', '中間仕上げ', '最終仕上げ', '最小注文数量（MOQ）'],
    minWordCount: 1800,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'evaluation',
  },

  'technical-guide': {
    type: 'technical-guide',
    name: '技术科普',
    description: '磨料颗粒、目数体系、背板、结合剂、孔型、固定方式的原理深度解析',
    structure: [
      '直接回答：核心概念を3行で',
      '技術原理の詳細分析',
      '規格体系の比較（JIS / FEPA / ANSI）',
      'パラメータが性能に与える影響',
      'よくある技術的な誤解の解消',
      '参考仕様クイックテーブル',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'technical-deep-dive', 'standards-table', 'parameter-impact', 'myth-busting', 'spec-checklist', 'FAQ', 'CTA'],
    variableSlots: ['technicalTopic', 'grainTypes', 'standards', 'parameters', 'performanceMetrics'],
    terminologyConstraints: ['セラミック砥粒', '炭化シリコン（SiC）', 'FEPA P', 'ISO 6344', 'JIS', '樹脂接着', '布基材または紙基材'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'soft',
    buyerJourneyStage: 'understanding',
  },

  'application-guide': {
    type: 'application-guide',
    name: '应用指南',
    description: '针对特定行业/工况（钢结构、造船、油气、木工、汽车）的完整工艺方案',
    structure: [
      '直接回答：業界課題と主要ソリューション',
      '標準工程のステップ分解',
      '推奨製品構成と砥粒シークエンス',
      '推奨パラメータ設定',
      '安全とコンプライアンスの要点（JIS / JANSI / ISO）',
      'コスト削減の提案',
      '調達仕様テンプレート',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'process-breakdown', 'product-recommendation-table', 'grit-sequence-table', 'safety-compliance', 'cost-optimization', 'procurement-template', 'FAQ', 'CTA'],
    variableSlots: ['industry', 'workpieceMaterials', 'processSteps', 'recommendedProducts', 'gritProgressions', 'safetyStandards', 'jaRegion'],
    terminologyConstraints: ['表面準備', 'バリ取り', '金属加工', '造船', '船舶メンテナンス', '石油・ガス', '個人用保護具', 'FEPA P'],
    minWordCount: 1500,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'evaluation',
  },

  'process-tutorial': {
    type: 'process-tutorial',
    name: '工序/工艺教程',
    description: '分步骤的打磨序列、目数递进、去毛刺、表面制备操作指导',
    structure: [
      '直接回答：標準工程の全体像',
      'パラメータ付き段階別オペレーションガイド',
      '砥粒シークエンスの原理とテーブル',
      '重要管理点と品質検査基準',
      'よくある不具合と対策',
      '材料別の調整ポイント',
      '作業時の安全注意事項',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'step-by-step', 'grit-progression-table', 'quality-control', 'defect-troubleshooting', 'material-adjustments', 'safety', 'FAQ', 'CTA'],
    variableSlots: ['processName', 'steps', 'gritProgressions', 'machineSettings', 'qualityCriteria', 'defectTypes', 'materials'],
    terminologyConstraints: ['仕上げ工程', '砥粒', '切削', '中間仕上げ', '最終仕上げ', '表面準備', '個人用保護具'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'soft',
    buyerJourneyStage: 'understanding',
  },

  'troubleshooting': {
    type: 'troubleshooting',
    name: '故障排查',
    description: '磨损过快、堵塞、砂带跑偏、除尘不良等问题的诊断与对策',
    structure: [
      '直接回答：症状・原因・対策クイックテーブル',
      '不具合の分類と診断ロジック',
      '各不具合の詳細分析',
      '根本原因チェックリスト',
      '予防整備の提案',
      'サプライヤー技術サポートへ相談するタイミング',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'troubleshooting-table', 'root-cause-analysis', 'preventive-maintenance', 'support-escalation', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'failureModes', 'rootCauses', 'correctiveActions', 'preventiveMeasures', 'machineTypes'],
    terminologyConstraints: ['粉塵付着（ローディング）', 'ベルト偏位', '摩耗が早い', '集じん', '布基材または紙基材', '樹脂接着'],
    minWordCount: 1000,
    maxWordCount: 1800,
    ctaType: 'soft',
    buyerJourneyStage: 'evaluation',
  },

  'product-spec-detail': {
    type: 'product-spec-detail',
    name: '单产品/规格详解',
    description: '某产品族、尺寸、目数段、背板类型的全参数详解',
    structure: [
      '直接回答：基本ポジショニングと適用範囲',
      '完全な仕様テーブル',
      '設計原理と性能特性',
      '対応機械と取付ポイント',
      'カスタマイズオプション（砥粒、寸法、基材、ブランド）',
      '発注情報：MOQ、納期、包装',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'full-spec-table', 'design-principles', 'compatibility-guide', 'customization-options', 'ordering-info', 'FAQ', 'CTA'],
    variableSlots: ['productModel', 'specs', 'compatibleMachines', 'customizationOptions', 'moq', 'leadTime', 'packagingOptions'],
    terminologyConstraints: ['最小注文数量（MOQ）', '納期', '工場直販', 'OEM（顧客ブランド製造）', '砥粒', '基材'],
    minWordCount: 1000,
    maxWordCount: 1800,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'procurement-guide': {
    type: 'procurement-guide',
    name: '采购与寻源指南',
    description: 'B2B 如何规格化需求、评估样品、比价、比较供应商',
    structure: [
      '直接回答：5ステップのプロ的な調達手法',
      '仕様標準化テンプレート',
      'サンプル評価カード',
      'サプライヤー評価マトリクス',
      '見積比較の重要ポイント',
      '契約条項と納品条件',
      'よくある調達ミスとその回避',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'specification-template', 'sample-evaluation-card', 'supplier-evaluation-matrix', 'quote-comparison', 'contract-terms', 'procurement-pitfalls', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'evaluationCriteria', 'supplierTypes', 'contractTerms', 'incoterms', 'paymentTerms'],
    terminologyConstraints: ['見積依頼', '卸売サプライヤー', '販売代理', '最小注文数量（MOQ）', '納期', 'サンプル依頼', '適合証明書（COC）', '分析証明書（COA）'],
    minWordCount: 1800,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'wholesale-oem-guide': {
    type: 'wholesale-oem-guide',
    name: '批发 / OEM 指南',
    description: '自有品牌、包装、批量采购、样品确认、供应商评估',
    structure: [
      '直接回答：OEM／卸売の工程概要',
      'OEMカスタマイズオプションマトリクス',
      'ブランド包装設計仕様',
      '最小注文数量と価格帯',
      'サンプル確認プロセスと基準',
      '品質検査と受入基準',
      '物流と通関',
      '長期協業のフレームワーク',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'oem-options-table', 'packaging-specs', 'moq-pricing-tiers', 'sample-approval-process', 'qa-standards', 'logistics-customs', 'partnership-framework', 'FAQ', 'CTA'],
    variableSlots: ['productFamily', 'customizationOptions', 'packagingTypes', 'moqTiers', 'sampleProcess', 'qaParameters', 'shippingTerms', 'jaRegion'],
    terminologyConstraints: ['OEM（顧客ブランド製造）', '卸売サプライヤー', '最小注文数量（MOQ）', '納期', 'サンプル依頼', '適合証明書（COC）', '包装', 'ブランド'],
    minWordCount: 1800,
    maxWordCount: 2500,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'industry-market': {
    type: 'industry-market',
    name: '行业与市场',
    description: '标准、安全规范、市场动态——需可靠当期信源',
    structure: [
      '直接回答：トレンド・規格の要点',
      '業界背景と推進要因',
      '主要規格のアップデート（JIS / JANSI / ISO / FEPA）',
      '市場規模と成長データ',
      '技術トレンドと製品イノベーションの方向',
      '調達判断への影響',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'industry-context', 'standards-analysis', 'market-data', 'technology-trends', 'procurement-implications', 'FAQ', 'CTA'],
    variableSlots: ['industry', 'standardsUpdates', 'marketData', 'technologyTrends', 'regulatoryChanges', 'jaRegion'],
    terminologyConstraints: ['FEPA P', 'ISO 6344', 'JIS', 'JANSI', '個人用保護具', '表面準備'],
    minWordCount: 1500,
    maxWordCount: 2500,
    ctaType: 'soft',
    buyerJourneyStage: 'understanding',
  },

  'jp-regional-sourcing': {
    type: 'jp-regional-sourcing',
    name: '日本地域寻源篇',
    description: '面向日本各地域（关东/关西/东北/中部/中国/九州）的供给与物流考量',
    structure: [
      '直接回答：この地域への輸入における3つの重要検討事項',
      '市場と主要工業クラスタ',
      '輸入法規制と適合要件（JIS / JANSI）',
      '物流ルート・主要港湾・通関リードタイム',
      '現地販売・代理店のモデル',
      '決済方法と取引条件',
      '商務文化のポイント',
      '免責事項',
      'よくある質問',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'market-overview', 'regulatory-compliance', 'logistics-ports', 'distribution-model', 'payment-terms', 'cultural-notes', 'disclaimer', 'FAQ', 'CTA'],
    variableSlots: ['jaRegion', 'industrialClusters', 'regulations', 'ports', 'leadTimes', 'distributors', 'paymentMethods', 'culturalTips'],
    terminologyConstraints: ['関東', '関西', '東北', '中部', '中国地方', '九州', 'JIS', 'JANSI', '納期', '卸売サプライヤー', '販売代理'],
    minWordCount: 1500,
    maxWordCount: 2200,
    ctaType: 'hard',
    buyerJourneyStage: 'sourcing',
  },

  'faq-buyers-guide': {
    type: 'faq-buyers-guide',
    name: 'FAQ / 买家资源',
    description: '工业买家真实问题簇，按主题聚类的 Q&A 合集',
    structure: [
      '直接回答：主要3つの質問と簡潔な回答',
      'テーマ別よくある質問（製品/仕様/調達/技術/物流/アフター）',
      '主要判断の参考テーブル',
      '見積依頼テンプレート',
      '用語クイックカード',
      '連絡チャネルと対応目安',
    ],
    requiredModules: ['BLUF', 'direct-answer', 'themed-faq', 'decision-reference-table', 'inquiry-template', 'glossary-card', 'contact-info', 'CTA'],
    variableSlots: ['faqGroups', 'decisionCriteria', 'inquiryTemplateFields', 'glossaryTerms', 'contactChannels'],
    terminologyConstraints: ['見積依頼', '最小注文数量（MOQ）', '納期', 'サンプル依頼', '砥粒', '布基材または紙基材', '取付システム', 'OEM（顧客ブランド製造）'],
    minWordCount: 1200,
    maxWordCount: 2000,
    ctaType: 'hard',
    buyerJourneyStage: 'comparison',
  },
};

export function getTemplate(type: string): ArticleTemplate | undefined {
  return articleTemplates[type];
}

export function getAllTemplateTypes(): string[] {
  return Object.keys(articleTemplates);
}
