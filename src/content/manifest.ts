/**
 * 記事カバー率・ユニーク性マニフェスト（編集者ハンドキュレーション）
 *
 * 目的：300 本の執筆計画を「データ」で固定し、(1) 全製品（32 モデル / 5 ファミリー）・
 *       全サービス・全業界（7）・全地域（7）・全記事タイプ（13）が集合的に網羅されること、
 *       (2) 同セル（model|type|industry|region）の重複がないこと（＝同質化ゲートを構造的に回避）、
 *       を検証可能にする。
 *
 * 注意：本文（MDX）は生成スクリプトでは作成しない。本マニフェストは「編集計画」であり、
 *       各スラッグの本文は facts（models.ts / site.ts / glossary.ts）に厳密に紐づけて
 *       人手で執筆する。angle（導入の観点）で各篇の切り口・構成・FAQ を差別化する。
 */

export const MODEL_CATALOG = [
  'abrasive-belt-533x75',
  'abrasive-belt-610x100',
  'abrasive-belt-915x100',
  'abrasive-belt-1220x150',
  'abrasive-belt-1520x630',
  'abrasive-belt-2200x1330',
  'flap-disc-115-plastic',
  'flap-disc-115-fiberglass',
  'flap-disc-125-plastic',
  'flap-disc-125-ceramic',
  'flap-disc-125-zirconia',
  'flap-disc-180-fiberglass',
  'flap-disc-180-steel-back',
  'mesh-disc-3-inch',
  'mesh-disc-5-inch',
  'mesh-disc-6-inch',
  'psa-disc-3-inch',
  'psa-disc-4-inch',
  'psa-disc-5-inch',
  'psa-disc-6-inch',
  'solid-disc-5-inch',
  'solid-disc-6-inch',
  'hook-loop-disc',
  'hook-loop-disc-multi-hole',
  'hook-loop-disc-film',
  'sanding-sponge-block-medium',
  'sanding-sponge-block-fine',
  'sanding-sponge-pad-hookloop',
  'sanding-sponge-flexible-sheet',
  'sanding-sponge-dual-angle',
  'sanding-sponge-detail-finger',
] as const;

export const FAMILY_BY_MODEL: Record<string, string> = {
  'abrasive-belt-533x75': 'abrasive-belts',
  'abrasive-belt-610x100': 'abrasive-belts',
  'abrasive-belt-915x100': 'abrasive-belts',
  'abrasive-belt-1220x150': 'abrasive-belts',
  'abrasive-belt-1520x630': 'abrasive-belts',
  'abrasive-belt-2200x1330': 'abrasive-belts',
  'flap-disc-115-plastic': 'flap-discs',
  'flap-disc-115-fiberglass': 'flap-discs',
  'flap-disc-125-plastic': 'flap-discs',
  'flap-disc-125-ceramic': 'flap-discs',
  'flap-disc-125-zirconia': 'flap-discs',
  'flap-disc-180-fiberglass': 'flap-discs',
  'flap-disc-180-steel-back': 'flap-discs',
  'mesh-disc-3-inch': 'sanding-discs',
  'mesh-disc-5-inch': 'sanding-discs',
  'mesh-disc-6-inch': 'sanding-discs',
  'psa-disc-3-inch': 'sanding-discs',
  'psa-disc-4-inch': 'sanding-discs',
  'psa-disc-5-inch': 'sanding-discs',
  'psa-disc-6-inch': 'sanding-discs',
  'solid-disc-5-inch': 'sanding-discs',
  'solid-disc-6-inch': 'sanding-discs',
  'hook-loop-disc': 'hook-loop',
  'hook-loop-disc-multi-hole': 'hook-loop',
  'hook-loop-disc-film': 'hook-loop',
  'sanding-sponge-block-medium': 'sanding-sponges',
  'sanding-sponge-block-fine': 'sanding-sponges',
  'sanding-sponge-pad-hookloop': 'sanding-sponges',
  'sanding-sponge-flexible-sheet': 'sanding-sponges',
  'sanding-sponge-dual-angle': 'sanding-sponges',
  'sanding-sponge-detail-finger': 'sanding-sponges',
};

export const INDUSTRIES = [
  'woodworking',
  'metalworking',
  'automotive',
  'shipbuilding',
  'oil-gas',
  'construction',
  'general',
] as const;

export const REGIONS = ['kanto', 'kansai', 'tohoku', 'chubu', 'chugoku', 'kyushu', 'general-jp'] as const;

export const TYPES = [
  'product-comparison',
  'multi-product-comparison',
  'buying-guide',
  'technical-guide',
  'application-guide',
  'process-tutorial',
  'troubleshooting',
  'product-spec-detail',
  'procurement-guide',
  'wholesale-oem-guide',
  'industry-market',
  'jp-regional-sourcing',
  'faq-buyers-guide',
] as const;

export interface Topic {
  slug: string;
  title: string;
  type: string;
  /** 対象モデル（任意）。family は MODEL_CATALOG に基づき自動導出 */
  model?: string;
  /** 業界スラッグ（任意） */
  industry?: string;
  /** 地域コード（任意） */
  region?: string;
  /** 導入の観点。本文の切り口・構成・FAQ を差別化するための編集指示 */
  angle: string;
}

/**
 * 検証用：各モデルの「サイズ表記」短縮（タイトル用に最小限）。
 * 完全な名称は models.ts を参照（本文執筆時に使う）。
 */
const MODEL_LABEL: Record<string, string> = {
  'abrasive-belt-533x75': '研磨ベルト 533×75 mm',
  'abrasive-belt-610x100': '研磨ベルト 610×100 mm',
  'abrasive-belt-915x100': '研磨ベルト 915×100 mm',
  'abrasive-belt-1220x150': '研磨ベルト 1220×150 mm',
  'abrasive-belt-1520x630': '研磨ベルト 1520×630 mm',
  'abrasive-belt-2200x1330': '研磨ベルト 2200×1330 mm',
  'flap-disc-115-plastic': 'フラップディスク 115 mm プラスチック',
  'flap-disc-115-fiberglass': 'フラップディスク 115 mm ガラス繊維',
  'flap-disc-125-plastic': 'フラップディスク 125 mm プラスチック',
  'flap-disc-125-ceramic': 'フラップディスク 125 mm セラミック',
  'flap-disc-125-zirconia': 'フラップディスク 125 mm ジルコニアアルミナ',
  'flap-disc-180-fiberglass': 'フラップディスク 180 mm ガラス繊維',
  'flap-disc-180-steel-back': 'フラップディスク 180 mm スチール基材',
  'mesh-disc-3-inch': 'メッシュ研磨ディスク 3インチ',
  'mesh-disc-5-inch': 'メッシュ研磨ディスク 5インチ',
  'mesh-disc-6-inch': 'メッシュ研磨ディスク 6インチ',
  'psa-disc-3-inch': 'PSA粘着ディスク 3インチ',
  'psa-disc-4-inch': 'PSA粘着ディスク 4インチ',
  'psa-disc-5-inch': 'PSA粘着ディスク 5インチ',
  'psa-disc-6-inch': 'PSA粘着ディスク 6インチ',
  'solid-disc-5-inch': '固型研磨ディスク 5インチ',
  'solid-disc-6-inch': '固型研磨ディスク 6インチ',
  'hook-loop-disc': 'フック&ループ研磨ディスク',
  'hook-loop-disc-multi-hole': 'メッシュ（穴あき）フック&ループディスク',
  'hook-loop-disc-film': 'ポリエステルフィルムフック&ループディスク',
  'sanding-sponge-block-medium': '研磨スポンジブロック 中目',
  'sanding-sponge-block-fine': '研磨スポンジブロック 細目',
  'sanding-sponge-pad-hookloop': 'フック&ループ研磨スポンジパッド',
  'sanding-sponge-flexible-sheet': '柔軟研磨スポンジシート',
  'sanding-sponge-dual-angle': 'デュアルアングル研磨スポンジ',
  'sanding-sponge-detail-finger': '細部用指先研磨スポンジ',
};

export const modelLabel = (slug: string) => MODEL_LABEL[slug] ?? slug;
