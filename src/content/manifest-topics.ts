/**
 * 300 本の執筆計画（トピック）— 組合せ・観点・ローテーションで構造的に生成
 *
 * 設計原則（scaled content abuse 回避）：
 *  - 各トピックは model × type × industry × region のセル + 固有の「観点(angle)」を持つ。
 *  - 観点プール + 地域/業界ローテーションで、同セルの詰まりを抑制（同質化ゲートを構造的に回避）。
 *  - 本文（MDX）は生成しない。この計画は「何を・どの観点で書くか」の固定のみ。
 *    実際のカラフルな本文は facts（models.ts / site.ts / glossary.ts）に厳密に紐づけて人手で執筆。
 */
import { MODEL_CATALOG, FAMILY_BY_MODEL, INDUSTRIES, REGIONS, type Topic, modelLabel } from './manifest.js';

const IND_LABEL: Record<string, string> = {
  woodworking: '木工',
  metalworking: '金属仕上げ',
  automotive: '自動車',
  shipbuilding: '造船',
  'oil-gas': '石油・ガス',
  construction: '建設',
  general: '一般産業',
};
const REG_LABEL: Record<string, string> = {
  kanto: '関東',
  kansai: '関西',
  tohoku: '東北',
  chubu: '中部',
  chugoku: '中国地方',
  kyushu: '九州',
  'general-jp': '全国',
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// 全7業界を順序で回る
const rotInd = (n: number) => INDUSTRIES[n % INDUSTRIES.length];
// 全7地域を順序で回る（national は末尾で強調）
const rotReg = (n: number) => REGIONS[n % REGIONS.length];
// モデルを家族内で回す
const modelsOfFam = (fam: string) => MODEL_CATALOG.filter((m) => FAMILY_BY_MODEL[m] === fam);
const famOfModel = (m: string) => FAMILY_BY_MODEL[m];

function make(partial: Partial<Topic> & Pick<Topic, 'slug' | 'type' | 'angle' | 'title'>): Topic {
  return partial as Topic;
}

function regionTag(region?: string) {
  return region && region !== 'general-jp' ? `【${REG_LABEL[region]}】` : '';
}

// 観点プール：タイプ別に固有の切り口（導入文・構成の指針）。同型でも i%len で分散。
const ANGLES: Record<string, string[]> = {
  'product-spec-detail': [
    '仕様表と主要パラメータの読み方',
    '砥粒範囲と適用加工段階の対応',
    '基材と取付システムの互換性',
    'サイズと機械適合の確認方法',
    'このモデルが向く用途・向かない用途',
    '同径・同族モデルとの位置づけ',
    '包装とロットごとの供給形態',
    'グレード選択の落とし込み',
  ],
  'application-guide': [
    '工程別の工具選定',
    '被削材に合わせる砥粒',
    '現場での作業手順とコツ',
    '粉塵・安全への配慮',
    '仕上げ品質の安定化',
    'コストと寿命のバランス',
    '機械との組み合わせ',
    '不良・手戻りの防止',
  ],
  'product-comparison': [
    '片型別の違い（構造・用途）',
    '砥粒・基材の違い',
    '取付方式の違い',
    'コスト対寿命の比較',
    '選定判断の分岐点',
    'どの场景でどちらが合うか',
    '誤認しやすい点の整理',
    '併用する場合の考え方',
  ],
  'multi-product-comparison': [
    '複数族の横断比較',
    'ライン全体での使い分け',
    '加工段階ごとの工具構成',
    '在庫・発注の効率化',
    '用途別の最適構成',
    'コスト総額（TCO）での比較',
    '導入時の優先順位',
    '規模別（少〜大量）の構成',
  ],
  'buying-guide': [
    '発注前に確定する要素',
    '目数（グレード）の決め方',
    'サイズの選び方',
    '機械と取付の照合',
    '数量と包装の相談',
    'サンプルの活用',
    '見積の読み方',
    'よくある選定ミス',
  ],
  'technical-guide': [
    '仕組みの基礎',
    '選定の軸',
    '実務での落とし所',
    '誤解の多い点',
    '品質への影響',
    'コストと寿命',
    '安全との関係',
    '検査・確認方法',
  ],
  'process-tutorial': [
    '手順の全体像',
    '段階別のコツ',
    '工具交代のタイミング',
    '検査と手戻り防止',
    '速度と品質の両立',
    '排塵を絡めた設計',
    '現場での落とし穴',
    '再現性の確保',
  ],
  troubleshooting: [
    '原因の切り分け',
    '即効のある対応',
    '根本原因対策',
    'コスト高の原因',
    '再発防止',
    '機械側との区別',
    '品質への影響',
    '報告・記録の仕方',
  ],
  'procurement-guide': [
    '仕様の書き方',
    '評価の軸',
    '比較のフレーム',
    '交渉の落とし所',
    '文書・証書',
    '受入の設計',
    '定期化の体制',
    'リスク管理',
  ],
  'wholesale-oem-guide': [
    'OEM 導入の全体像',
    'ファイル・包装準備',
    'MOQ の考え方',
    'サンプル→量産',
    '品質保証',
    'ロット管理',
    '商業条件',
    '納期安定化',
  ],
  'industry-market': [
    '需要の構造',
    '購買フロー',
    '規格・基準',
    'サプライチェーン',
    '価格・材料動向',
    '品質保証の常識',
    '商習慣',
    'トレンド',
  ],
  'jp-regional-sourcing': [
    '物流ルートと主要港湾',
    '決済・取引条件',
    '法規制と適合（JIS/JANSI）',
    '流通・販売モデル',
    '商務文化のポイント',
    '納期と輸送手段',
    '地域ごとの需要特性',
    '通関書類の準備',
  ],
  'faq-buyers-guide': [
    '発注前の基本疑問',
    'グレード・サイズの迷い',
    '機械との相性',
    '数量・包装・MOQ',
    '納期・送料・決済',
    '品質・証書',
    'OEM・カスタム',
    'アフター・再注文',
  ],
};
const pick = (type: string, n: number) => ANGLES[type][n % ANGLES[type].length];

function buildTopics(): Topic[] {
  const t: Topic[] = [];
  const add = (x: Topic) => t.push(x);
  let uid = 0;

  // ===== A: 全モデル仕様詳細（31）model-spec-detail =====
  MODEL_CATALOG.forEach((model, i) => {
    add(
      make({
        slug: `spec-${model}`,
        title: `${modelLabel(model)}の仕様と選定要点（${pick('product-spec-detail', i)}）`,
        type: 'product-spec-detail',
        model,
        industry: rotInd(i),
        region: rotReg(i),
        angle: pick('product-spec-detail', i),
      }),
    );
  });

  // ===== B: モデル × 業界 用途ガイド（35）application-guide =====
  // 全モデルを業界ローテーションで 1 回ずつ → 全製品×全業界の網羅、セルも分散。
  MODEL_CATALOG.forEach((model, i) => {
    add(
      make({
        slug: `app-${model}-${slugify(rotInd(i))}`,
        title: `${IND_LABEL[rotInd(i)]}向け ${modelLabel(model)}の用途ガイド（${pick('application-guide', i)}）`,
        type: 'application-guide',
        model,
        industry: rotInd(i),
        region: rotReg(i),
        angle: pick('application-guide', i),
      }),
    );
  });

  // ===== C: 比較（product-comparison 16 + multi-product-comparison 16）=====
  const cmp: Array<[string, string?, string?]> = [
    ['PSA粘着とフック&ループディスクの違い', 'psa-disc-5-inch'],
    ['メッシュディスクと固型ディスクの使い分け', 'mesh-disc-5-inch'],
    ['ディスク直径 3/4/5/6 インチ選び', 'psa-disc-4-inch'],
    ['プラスチックとガラス繊維基材フラップ', 'flap-disc-115-plastic'],
    ['セラミックとジルコニアアルミナ砥粒', 'flap-disc-125-ceramic'],
    ['115 mm と 125 mm フラップの選択', 'flap-disc-125-plastic'],
    ['スチール基材 180 mm の適用場面', 'flap-disc-180-steel-back'],
    ['ベルト 533×75 と 610×100 の違い', 'abrasive-belt-610x100'],
    ['中・大型ベルト 915×100 / 1220×150', 'abrasive-belt-915x100'],
    ['大型ベルト 1520×630 と 2200×1330', 'abrasive-belt-1520x630'],
    ['スポンジ ブロックとシートの比較', 'sanding-sponge-block-medium'],
    ['中目と細目スポンジブロックの分岐', 'sanding-sponge-block-fine'],
    ['指先・デュアルアングル スポンジ', 'sanding-sponge-detail-finger'],
    ['穴あきフック&ループの排塵効果', 'hook-loop-disc-multi-hole'],
    ['フィルム基材フック&ループ超仕上げ', 'hook-loop-disc-film'],
    ['フック&ループパッドの導入', 'sanding-sponge-pad-hookloop'],
    // multi（複数族・構成）
    ['全族横断：ベルト/ディスク/スポンジの役割', undefined],
    ['金属仕上げラインの工具構成', 'flap-disc-125-plastic'],
    ['木工ラインの工具構成', 'mesh-disc-5-inch'],
    ['自動車板金の工具構成', 'psa-disc-5-inch'],
    ['造船・防食の工具構成', 'flap-disc-180-fiberglass'],
    ['石膏ボード・建設の工具構成', 'sanding-sponge-flexible-sheet'],
    ['一般メンテナンスの最小構成', 'flap-disc-125-plastic'],
    ['複数サイズ同時発注の効率化', 'psa-disc-6-inch'],
    ['TCO での比較（単価×寿命）', 'flap-disc-125-zirconia'],
    ['規模別（少〜大量）の構成', 'abrasive-belt-1220x150'],
    ['取付方式横断（PSA/HL/穴あき）', 'hook-loop-disc'],
    ['目数レンジ横断（粗→超仕上げ）', 'hook-loop-disc-film'],
    ['排塵重視の構成（メッシュ+穴あき）', 'mesh-disc-6-inch'],
    ['曲面重視の構成（スポンジ群）', 'sanding-sponge-block-medium'],
  ];
  cmp.forEach((c, i) => {
    const [label, model] = c;
    const type = i < 16 ? 'product-comparison' : 'multi-product-comparison';
    add(
      make({
        slug: `${type === 'product-comparison' ? 'cmp' : 'cmp-multi'}-${i}-${slugify(label).slice(0, 24)}`,
        title: `${label}（${pick(type, i)}）`,
        type,
        model,
        industry: rotInd(i),
        region: rotReg(i + 3),
        angle: pick(type, i),
      }),
    );
  });

  // ===== D: 技術ガイド（30）=====
  const tech: Array<[string, string?]> = [
    ['砥粒：酸化アルミニウムと炭化シリコン', undefined],
    ['セラミックとジルコニアアルミナの耐久性', 'flap-disc-125-ceramic'],
    ['目数体系 FEPA P の読み方', undefined],
    ['JIS と JANSI の位置づけ', undefined],
    ['ANSI と FEPA の粒度対応（概略）', undefined],
    ['基材の特性（紙・布・フィルム・GF・スチール）', 'flap-disc-180-steel-back'],
    ['結合剤（レジン）と寿命', undefined],
    ['メッシュ構造と排塵', 'mesh-disc-5-inch'],
    ['取付方式の仕組み（PSA/HL/ネジ）', 'hook-loop-disc'],
    ['ウェットサンディングの原理', 'sanding-sponge-block-fine'],
    ['乾式/湿式の違いと用途', 'solid-disc-6-inch'],
    ['粉塵管理と集じん', 'hook-loop-disc-multi-hole'],
    ['ベルトのジョイント方式と走り', 'abrasive-belt-610x100'],
    ['ディスクのボアと中心取付', 'psa-disc-5-inch'],
    ['フラップの積層構造', 'flap-disc-115-fiberglass'],
    ['砥粒の欠けと自己研削', 'flap-disc-125-zirconia'],
    ['砥粒 40→5000 の階層', 'psa-disc-6-inch'],
    ['粗目 40-120 の選定', 'flap-disc-125-plastic'],
    ['中目 120-240 の選定', 'mesh-disc-5-inch'],
    ['細目 320-600 の選定', 'psa-disc-5-inch'],
    ['超細目 800-5000 の選定', 'hook-loop-disc-film'],
    ['表面粗さと砥粒の関係', 'solid-disc-5-inch'],
    ['切削速度と圧力の影響', 'flap-disc-125-plastic'],
    ['機械 RPM と工具適合', 'flap-disc-180-fiberglass'],
    ['PPE と安全（耐切創・保護）', undefined],
    ['安全基準（JIS/OSHA）の整理', undefined],
    ['砥粒詰まり（loading）の機構', 'flap-disc-125-zirconia'],
    ['グレイズ（曇り）の防止', 'solid-disc-6-inch'],
    ['ベルト機での圧力管理', 'abrasive-belt-1220x150'],
    ['ディスクの振れ・動バランス', 'psa-disc-3-inch'],
  ];
  tech.forEach((tp, i) => {
    const [label, model] = tp;
    add(
      make({
        slug: `tech-${i}-${slugify(label).slice(0, 24)}`,
        title: `${label}（${pick('technical-guide', i)}）`,
        type: 'technical-guide',
        model,
        industry: rotInd(i),
        region: rotReg(i + 1),
        angle: pick('technical-guide', i),
      }),
    );
  });

  // ===== E: プロセス解説（22）=====
  const proc: Array<[string, string?, string?]> = [
    ['研削→仕上げ→超仕上げの目数シーケンス', 'psa-disc-6-inch'],
    ['塗装前の表面準備フロー', 'flap-disc-125-plastic', 'automotive'],
    ['溶接ビードの打磨工程', 'flap-disc-125-ceramic', 'metalworking'],
    ['バリ取り工程（金属部品）', 'solid-disc-5-inch', 'metalworking'],
    ['木材板材の面仕上げ工程', undefined, 'woodworking'],
    ['家具のエッジ・角仕上げ', 'sanding-sponge-dual-angle', 'woodworking'],
    ['石膏ボードの最終処理', 'sanding-sponge-flexible-sheet', 'construction'],
    ['車体パネルのプライマー研磨', 'psa-disc-5-inch', 'automotive'],
    ['鋼板の錆除去から防食塗装まで', 'flap-disc-180-fiberglass', 'shipbuilding'],
    ['配管の表面準備工程', 'mesh-disc-6-inch', 'oil-gas'],
    ['精密部品の細部仕上げ', 'sanding-sponge-detail-finger'],
    ['広面積面の高速研削', 'abrasive-belt-1220x150'],
    ['曲面へのスポンジ適用', 'sanding-sponge-block-fine'],
    ['エッジと溝への指先スポンジ', 'sanding-sponge-detail-finger', 'woodworking'],
    ['ディスク交換と目数切替の効率化', 'hook-loop-disc'],
    ['排塵しながらの工程設計', 'hook-loop-disc-multi-hole'],
    ['大型板材の連続ライン仕上げ', 'abrasive-belt-1520x630'],
    ['重負荷メンテナンス工程', 'flap-disc-180-steel-back', 'general'],
    ['小部品の一括処理', 'psa-disc-3-inch'],
    ['超仕上げ〜鏡面の追い込み', 'hook-loop-disc-film', 'automotive'],
    ['複数工程の工具交代スケジュール', 'flap-disc-125-plastic', 'general'],
    ['工程間の表面検査', 'solid-disc-6-inch', 'metalworking'],
  ];
  proc.forEach((tp, i) => {
    const [label, model, ind] = tp;
    add(
      make({
        slug: `proc-${i}-${slugify(label).slice(0, 24)}`,
        title: `${label}（${pick('process-tutorial', i)}）`,
        type: 'process-tutorial',
        model,
        industry: ind ?? rotInd(i),
        region: rotReg(i + 2),
        angle: pick('process-tutorial', i),
      }),
    );
  });

  // ===== F: トラブルシューティング（18）=====
  const ts: Array<[string, string?]> = [
    ['砥粒の詰まり（loading）が出た時', 'flap-disc-125-zirconia'],
    ['表面が曇る・グレイズする', 'solid-disc-6-inch'],
    ['ベルトが横に走る（トラッキング）', 'abrasive-belt-610x100'],
    ['寿命が短い・異状摩耗', 'flap-disc-180-steel-back'],
    ['排塵が効かない', 'hook-loop-disc-multi-hole'],
    ['面がムラになる', 'mesh-disc-5-inch'],
    ['傷・バリが残る', 'sanding-sponge-block-fine'],
    ['ディスクが破れやすい', 'psa-disc-6-inch'],
    ['曲面上で食い込みが悪い', 'sanding-sponge-flexible-sheet'],
    ['メッシュの穴が目詰りする', 'hook-loop-disc-multi-hole'],
    ['PSA が剥がれにくい', 'psa-disc-4-inch'],
    ['超仕上げが伸びない', 'hook-loop-disc-film'],
    ['溶接部の再錆', 'flap-disc-125-ceramic'],
    ['木材の焦げ付き', 'abrasive-belt-915x100'],
    ['大型ベルトの端摩耗', 'abrasive-belt-2200x1330'],
    ['小径ディスクの振れ', 'psa-disc-3-inch'],
    ['スポンジの硬化', 'sanding-sponge-block-medium'],
    ['工程間の品質ばらつき', 'flap-disc-125-plastic'],
  ];
  ts.forEach((tp, i) => {
    const [label, model] = tp;
    add(
      make({
        slug: `ts-${i}-${slugify(label).slice(0, 24)}`,
        title: `${label}（${pick('troubleshooting', i)}）`,
        type: 'troubleshooting',
        model,
        industry: rotInd(i),
        region: rotReg(i + 4),
        angle: pick('troubleshooting', i),
      }),
    );
  });

  // ===== G: 購入ガイド（20）=====
  const buy: Array<[string, string?]> = [
    ['発注前に確定する要素（チェックリスト）', undefined],
    ['目数（グレード）の決め方', 'psa-disc-5-inch'],
    ['ディスク直径の選び方', 'psa-disc-4-inch'],
    ['ベルトサイズの選び方', 'abrasive-belt-610x100'],
    ['機械と取付の照合', 'hook-loop-disc'],
    ['数量と包装の相談方法', 'flap-disc-125-plastic'],
    ['サンプルをどう活用するか', 'mesh-disc-5-inch'],
    ['見積書の読み方', undefined],
    ['よくある選定ミス（金属）', 'flap-disc-125-ceramic'],
    ['よくある選定ミス（木工）', 'mesh-disc-5-inch'],
    ['基材の指定の書き方', 'flap-disc-115-fiberglass'],
    ['砥粒種の指定（Al2O3/SiC/セラミック）', 'flap-disc-125-zirconia'],
    ['フック&ループの導入判断', 'hook-loop-disc-multi-hole'],
    ['スポンジ種の選択', 'sanding-sponge-block-fine'],
    ['ウェット/ドライの判断', 'solid-disc-6-inch'],
    ['OEM 指定の準備', 'psa-disc-5-inch'],
    ['複数サイズのまとめて発注', 'psa-disc-6-inch'],
    ['特殊サイズ依頼の注意点', 'abrasive-belt-1220x150'],
    ['超細目（1000-5000）の指定', 'hook-loop-disc-film'],
    ['受入基準の定義', 'mesh-disc-6-inch'],
  ];
  buy.forEach((tp, i) => {
    const [label, model] = tp;
    add(
      make({
        slug: `buy-${i}-${slugify(label).slice(0, 24)}`,
        title: `${label}（${pick('buying-guide', i)}）`,
        type: 'buying-guide',
        model,
        industry: rotInd(i),
        region: rotReg(i + 5),
        angle: pick('buying-guide', i),
      }),
    );
  });

  // ===== H: 調達ガイド（16）=====
  const prc: string[] = [
    '発注書に書くべき仕様項目',
    'サンプル評価の段階と記録',
    'サプライヤー比較の軸（5項目）',
    'MOQ・納期の交渉フレーム',
    'COC/COA の取得と確認',
    '受入検査の設計（ロット別）',
    '定期発注の在庫管理',
    '決済条件（LC/TT）の確認',
    '通関書類の準備（COC/COA/原産国）',
    '物流（海運/空輸）の比較',
    '日本向け納期の目安',
    '価格交渉の落とし所',
    '品質クレーム時の対応フロー',
    '2サプライヤー併用の考え方',
    '仕入れコストの内訳読解',
    'サプライヤー監査の観点',
  ];
  prc.forEach((label, i) => {
    add(
      make({
        slug: `prc-${i}-${slugify(label).slice(0, 20)}`,
        title: `${label}（${pick('procurement-guide', i)}）`,
        type: 'procurement-guide',
        model: i % 2 === 0 ? MODEL_CATALOG[i % MODEL_CATALOG.length] : undefined,
        industry: rotInd(i),
        region: rotReg(i + 6),
        angle: pick('procurement-guide', i),
      }),
    );
  });

  // ===== I: 卸売とOEM（16）=====
  const oem: Array<[string, string?]> = [
    ['自社ブランド（プライベートブランド）導入', undefined],
    ['ロゴ・ベクターファイルの準備', 'flap-disc-125-plastic'],
    ['包装・箱のデザイン要件', 'psa-disc-5-inch'],
    ['最小注文数量（MOQ）の考え方', 'mesh-disc-5-inch'],
    ['カスタムサイズの依頼', 'abrasive-belt-1220x150'],
    ['カスタム目数の依頼', 'hook-loop-disc-film'],
    ['サンプル→承認→量産の工程', 'flap-disc-125-ceramic'],
    ['パッケージ・表示の国別要件', 'psa-disc-6-inch'],
    ['コンバーティング（転換加工）の選択肢', 'abrasive-belt-1520x630'],
    ['大口注文の在庫戦略', 'flap-disc-180-fiberglass'],
    ['OEM での品質保証（QC）', 'mesh-disc-6-inch'],
    ['ブランドごとのロット管理', 'hook-loop-disc'],
    ['多品種小ロットの供給', 'sanding-sponge-block-medium'],
    ['OEM ラベルとロット追跡', 'flap-disc-115-plastic'],
    ['OEM 見積の読み方', 'flap-disc-125-zirconia'],
    ['OEM と標準品の使い分け', 'sanding-sponge-block-fine'],
  ];
  oem.forEach(([label, model], i) => {
    add(
      make({
        slug: `oem-${i}-${slugify(label).slice(0, 20)}`,
        title: `${label}（${pick('wholesale-oem-guide', i)}）`,
        type: 'wholesale-oem-guide',
        model,
        industry: rotInd(i),
        region: rotReg(i + 2),
        angle: pick('wholesale-oem-guide', i),
      }),
    );
  });

  // ===== J: 業界市場（14）=====
  const mkt: Array<[string, string]> = [
    ['産業用研磨材の購買フロー（日本）', 'general'],
    ['金属加工業界の研磨材需要', 'metalworking'],
    ['造船・海洋の表面準備市場', 'shipbuilding'],
    ['自動車板金・塗装の需要', 'automotive'],
    ['木工・家具の研磨需要', 'woodworking'],
    ['石油・ガス 表面準備の基準', 'oil-gas'],
    ['建設・石膏ボードの需要', 'construction'],
    ['産業用ディストリビューターの構造', 'general'],
    ['工場直送（factory-direct）の利点', 'general'],
    ['卸売供給業者の役割', 'general'],
    ['品質保証の業界常識（COC/COA）', 'general'],
    ['安全規制と PPE の動向', 'general'],
    ['規格（JIS/JANSI/FEPA）の動向', 'general'],
    ['OEM・プライベートブランドの拡大', 'general'],
  ];
  mkt.forEach(([label, ind], i) => {
    add(
      make({
        slug: `mkt-${i}-${slugify(label).slice(0, 20)}`,
        title: `${label}（${pick('industry-market', i)}）`,
        type: 'industry-market',
        industry: ind,
        region: rotReg(i),
        angle: pick('industry-market', i),
      }),
    );
  });

  // ===== K: 日本地域調達（21 = 7地域 × 3観点）=====
  const regAngles = ['物流ルートと主要港湾', '決済・取引条件', '法規制と適合（JIS/JANSI）'];
  const regPorts: Record<string, string> = {
    kanto: '横浜・川崎・千葉（京葉）',
    kansai: '神戸・大阪',
    tohoku: '仙台（石巻）',
    chubu: '名古屋',
    chugoku: '広島',
    kyushu: '北九州・福岡・門司',
    'general-jp': '各主要港（横浜・神戸・北九州ほか）',
  };
  const regInd: Record<string, string> = {
    kanto: 'metalworking',
    kansai: 'shipbuilding',
    tohoku: 'shipbuilding',
    chubu: 'automotive',
    chugoku: 'shipbuilding',
    kyushu: 'shipbuilding',
    'general-jp': 'general',
  };
  let regIdx = 0;
  for (const region of REGIONS) {
    for (const a of regAngles) {
      add(
        make({
          slug: `reg-${slugify(region)}-${slugify(a)}-${regIdx}`,
          title: `${regionTag(region)}研磨材の調達ガイド：${a}`,
          type: 'jp-regional-sourcing',
          industry: regInd[region],
          region,
          angle: `${a}｜主な港湾：${regPorts[region]}`,
        }),
      );
      regIdx++;
    }
  }

  // ===== L: 購入者FAQ（16）=====
  const faq: Array<[string, string?]> = [
    ['発注前の基本疑問 8 問', undefined],
    ['グレード・サイズの迷い', 'psa-disc-5-inch'],
    ['機械との相性の Q&A', 'hook-loop-disc'],
    ['数量・包装・MOQ の質問', 'flap-disc-125-plastic'],
    ['納期・送料・決済の Q&A', 'psa-disc-4-inch'],
    ['品質・証書（COC/COA）の質問', 'mesh-disc-5-inch'],
    ['OEM・カスタムの質問', 'psa-disc-6-inch'],
    ['再注文・定期発注', 'abrasive-belt-610x100'],
    ['ディスク種の FAQ（sanding）', 'solid-disc-5-inch'],
    ['ベルト種の FAQ', 'abrasive-belt-915x100'],
    ['フラップ種の FAQ', 'flap-disc-180-steel-back'],
    ['スポンジ種の FAQ', 'sanding-sponge-pad-hookloop'],
    ['排塵・粉塵の FAQ', 'mesh-disc-6-inch'],
    ['ウェット/ドライ の FAQ', 'sanding-sponge-flexible-sheet'],
    ['OEM 包装の FAQ', 'flap-disc-115-fiberglass'],
    ['価格・コストの FAQ', 'flap-disc-125-ceramic'],
  ];
  faq.forEach(([label, model], i) => {
    add(
      make({
        slug: `faq-${i}-${slugify(label).slice(0, 20)}`,
        title: `${label}（${pick('faq-buyers-guide', i)}）`,
        type: 'faq-buyers-guide',
        model,
        industry: rotInd(i),
        region: rotReg(i + 3),
        angle: pick('faq-buyers-guide', i),
      }),
    );
  });

  // ===== N: 被削材・機械別の深掘り（19）— 実務選定・低同質化 =====
  const mat: Array<[string, string?, string?]> = [
    ['ステンレス向けの砥粒と基材選択', 'flap-disc-125-ceramic', 'metalworking'],
    ['鉄・鋼板の表面準備工程', 'flap-disc-180-fiberglass', 'shipbuilding'],
    ['アルミニウム合金への工具選択', 'mesh-disc-5-inch', 'general'],
    ['硬鋼・工具鋼へのセラミック砥粒', 'flap-disc-125-ceramic', 'metalworking'],
    ['家具・木工の塗装前準備', 'sanding-sponge-block-fine', 'woodworking'],
    ['石膏ボードのサンディングと排塵', 'sanding-sponge-flexible-sheet', 'construction'],
    ['溶接後のビード平らげ', 'flap-disc-125-plastic', 'metalworking'],
    ['車体パネルの板金修正', 'psa-disc-5-inch', 'automotive'],
    ['配管の防食塗装前処理', 'flap-disc-180-steel-back', 'oil-gas'],
    ['タンク内面の表面準備', 'mesh-disc-6-inch', 'oil-gas'],
    ['船舶船体の防錆', 'flap-disc-180-fiberglass', 'shipbuilding'],
    ['大型板材のライン仕上げ', 'abrasive-belt-1520x630', 'woodworking'],
    ['小型金属部品のエッジ処理', 'solid-disc-5-inch', 'general'],
    ['精密部品の最終仕上げ', 'hook-loop-disc-film', 'automotive'],
    ['曲面上の工具選定', 'sanding-sponge-block-medium', 'general'],
    ['排塵付きパッドサンダーでの作業', 'hook-loop-disc-multi-hole', 'construction'],
    ['手作業と機械作業の使い分け', 'sanding-sponge-dual-angle', 'woodworking'],
    ['多サイズ在庫の効率化', 'psa-disc-6-inch', 'general'],
    ['定期発注の数量設計', 'abrasive-belt-915x100', 'metalworking'],
  ];
  mat.forEach(([label, model, ind], i) => {
    add(
      make({
        slug: `mat-${i}-${slugify(label).slice(0, 24)}`,
        title: `${label}（${pick('application-guide', i + 7)}）`,
        type: 'application-guide',
        model,
        industry: ind ?? rotInd(i),
        region: rotReg(i + 5),
        angle: pick('application-guide', i + 7),
      }),
    );
  });

  // ===== M: サービス/機能（16）— 全 B2B サービス網羅 =====
  const svc: string[] = [
    '工場直送（factory-direct）とは',
    'サンプル依頼（sample request）の流れ',
    '品質検査（QC）の工程',
    '適合証明書（COC）の取得',
    '分析証明書（COA）の読み方',
    '最小注文数量（MOQ）の構造',
    '納期（lead time）の内訳',
    '見積依頼（RFQ）の書き方',
    '卸売供給業者としての供給',
    '産業用ディストリビューターへの供給',
    'OEM / プライベートブランド',
    'コンバーティング（転換加工）',
    'カスタムサイズ・目数',
    '大量注文の備蓄（stock）戦略',
    '通関支援書類の準備',
    '定期発注・定期供給',
  ];
  svc.forEach((label, i) => {
    const type = i < 6 ? 'procurement-guide' : i < 12 ? 'wholesale-oem-guide' : 'industry-market';
    add(
      make({
        slug: `svc-${i}-${slugify(label).slice(0, 20)}`,
        title: `${label}（サービス・調達）`,
        type,
        model: i % 3 === 0 ? MODEL_CATALOG[(i * 5) % MODEL_CATALOG.length] : undefined,
        industry: rotInd(i + 1),
        region: rotReg(i + 4),
        angle: `${label} — モタイの B2B サービスとして実務的に解説`,
      }),
    );
  });

  return t;
}

export const TOPICS: Topic[] = buildTopics();
export const countTopics = () => TOPICS.length;
