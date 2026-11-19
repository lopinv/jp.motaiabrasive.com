export const SITE = {
  name: 'MoTai Abrasives',
  nameAr: '墨泰研磨材',
  legalName: 'Hubei MoTai Abrasives Materials Co., Ltd.',
  url: 'https://ar.motaiabrasive.com',
  locale: 'ja',
  email: 'motai-01@motaiabrasive.com',
  whatsapp: '8618118635597',
  phone: '+86 181 1863 5597',
  address: 'No. 88 Yuli Avenue, Junshui Town, Tongcheng County, Xianning, Hubei, China',
  addressAr: '中国湖北省咸寧市通城県軍水鎮玉里大道88号',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61595012045510',
    instagram: 'https://www.instagram.com/motai_1_',
  },
} as const;

export const navItems = [
  { label: 'ホーム', href: '/' },
  { label: '製品', href: '/products' },
  { label: '業界', href: '/industries' },
  { label: '墨泰を選ぶ理由', href: '/company' },
  { label: '品質保証', href: '/quality' },
  { label: '記事', href: '/articles' },
  { label: 'リソース', href: '/resources' },
  { label: 'お問い合わせ', href: '/contact' },
];

export const productCategories = [
  {
    slug: 'abrasive-belts',
    name: '研磨ベルト',
    title: '木工・金属用途向け均一仕上げの産業用研磨ベルト',
    description:
      '研磨ベルトは、木材および金属の繰り返しエッジクリーニングおよび仕上げ用に設計されています。機械タイプ、被削材、ジョイントタイプ、数量要件に合わせて仕様を調整し、生産前に購入者と合意します。',
    image: '/images/belt-533.webp',
    applications: ['木材切削', '金属仕上げ', '家具製造'],
    specs: [
      ['用途', 'エッジ仕上げおよび表面層除去'],
      ['基材', '紙、布、またはポリマー繊維'],
      ['標準サイズ', '533×75 mm, 610×100 mm, 1520×630 mm, 2200×1330 mm'],
      ['適用基準', '機械タイプとジョイントタイプを購入者と確認'],
      ['カスタマイズ', '砥粒、サイズ、ブランド、包装'],
    ],
    faq: [
      {
        q: 'ベルトサイズをカスタマイズできますか？',
        a: '可能です。お客様の機械に適したサイズと基材、ジョイントタイプを決定し、生産承認前にベルト回転方向を確認します。',
      },
      {
        q: '適切な砥粒度をどう選べばよいですか？',
        a: '粗削りには粗目、均一仕上げには中目、超仕上げには細目を選択します。オペレーターはサンプルと表面状態を送付していただければ、より正確な推奨が可能です。',
      },
      {
        q: 'OEMブランド製品の注文は可能ですか？',
        a: '可能です。仕様確認段階で、お客様のブランド、包装、ロゴ要件を評価し、それらが最小注文数量とコストに与える影響を決定します。',
      },
    ],
  },
  {
    slug: 'flap-discs',
    name: 'フラップディスク',
    title: '効率的な金属クリーニングと仕上げのためのフラップディスク',
    description:
      '両面異なるフラップディスクは、研削と仕上げをバランスよく組み合わせます。設備メンテナンス、錆除去、塗装前や組立前のエッジ準備に適しており、砥粒と基材、被削材、加工負荷を考慮して選定します。',
    image: '/images/flap-disc.jpg',
    applications: ['設備メンテナンス', '錆除去', '塗装前の表面処理'],
    specs: [
      ['標準直径', '115 mm, 125 mm, 180 mm, 180/230 mm'],
      ['砥粒タイプ', '酸化アルミニウム、セラミック、または用途別混合'],
      ['基材', 'プラスチックまたはガラス繊維'],
      ['供給形態', '個別包装と商業数量'],
      ['カスタマイズ', '砥粒度、色、ブランド'],
    ],
    faq: [
      {
        q: 'プラスチック基材とガラス繊維基材の違いは？',
        a: 'ガラス繊維基材は引張試験済みで重削りに適し、プラスチック基材は一般作業向けです。機械タイプと用途特性に合わせて選択してください。',
      },
      {
        q: 'このディスクは厚い層の削りに適していますか？',
        a: '薄層および中層の削りに使用可能です。重削りには、被削材に適したディスクと制御された加工負荷・送り速度を推奨します。',
      },
    ],
  },
  {
    slug: 'sanding-discs',
    name: '研磨ディスク',
    title: '均一仕上げのためのメッシュ研磨ディスク',
    description:
      'メッシュディスクは仕上げ、平滑化、表面処理に適しています。オープンメッシュ構造により研削中に粉塵を排出し、均一な結果を維持します。取付システムは購入者の機械に合わせて選定します。',
    image: '/images/mesh-disc.webp',
    applications: ['木材仕上げ', '精密金属', '装飾・準備加工'],
    specs: [
      ['標準直径', '5インチ, 6インチ'],
      ['タイプ', '穴あきメッシュ'],
      ['砥粒', '多目的対応の複数グレード'],
      ['互換性', '研磨機の取付システムに準拠'],
      ['包装', 'オペレーター要件に応じたセット'],
    ],
    faq: [
      {
        q: 'メッシュディスクとは？',
        a: '研削時に粉塵を排出するオープンメッシュ構造を使用したディスクで、均一な表面が求められ粉塵付着を抑えたい工程に実用的な選択肢です。',
      },
      {
        q: '異なるサイズのディスクを供給できますか？',
        a: '標準サイズはすべて供給可能です。特殊サイズは注文仕様と生産計画で確認します。',
      },
    ],
  },
  {
    slug: 'hook-loop',
    name: 'フック&ループディスク',
    title: '着脱再利用可能なフック&ループ研磨ディスク',
    description:
      'フック&ループ（ベルクロ）システムの研磨ディスク、直径3, 4, 5, 6インチ、標準パッドに対応。砥粒度60〜5000、平面および繰り返し仕上げに適し、ねじ不要。',
    image: '/images/disc-hook-loop.webp',
    applications: ['平面仕上げ', '繰り返しメンテナンス', '塗装前準備'],
    specs: [
      ['標準直径', '3インチ, 4インチ, 5インチ, 6インチ'],
      ['取付システム', 'フック&ループ（ベルクロ）着脱式'],
      ['砥粒度', '全直径で60〜5000'],
      ['互換性', '標準ベルクロパッド'],
      ['包装', 'オペレーター要件に応じた混合セット'],
    ],
    faq: [
      {
        q: 'フック&ループとPSA粘着ディスクの違いは？',
        a: 'ベルクロシステムはディスクを着脱し、パッドを何度も再利用可能です。PSA粘着ディスクは使い捨てです。砥粒度を頻繁に変える場合はベルクロを推奨します。',
      },
      {
        q: '4サイズすべてを1ロットで供給できますか？',
        a: '可能です。オペレーターのリストに従って混合セットで梱包し、各直径の砥粒度数を指定できます。',
      },
    ],
  },
  {
    slug: 'sanding-sponges',
    name: '研磨スポンジ',
    title: 'エッジ平滑化と超仕上げのための研磨スポンジ',
    description:
      'エッジ、曲面、手作業仕上げ用の柔軟な研磨スポンジ。実加工ペースと快適性に合わせた最終仕上げ段階に適し、複数形状と砥粒度で削り・平滑化各段階に対応。',
    image: '/images/sponge.jpg',
    applications: ['最終仕上げ', 'エッジ平滑化', '表面補修'],
    specs: [
      ['用途', '手作業またはクランプ工具互換'],
      ['砥粒度（スポンジ）', '36, 60, 80, 100, 120, 180, 220, 240, 280'],
      ['フック&ループディスク', '180, 320, 400, 500–600, 800–1000, 1200–1500, 2000, 2500, 3000'],
      ['形状', '用途別シート、ブロック、スポンジ'],
      ['包装', '個別または商業用包装'],
    ],
    faq: [
      {
        q: 'スポンジ研磨材とフック&ループディスクの違いは？',
        a: 'スポンジ研磨材は手作業の柔軟な最終仕上げ向け、フック&ループディスクは平面とパッド取付に適しています。',
      },
      {
        q: 'スポンジは狭い角度に適していますか？',
        a: '適しています。スポンジの柔軟性により、エッジや曲面で制御された削りが可能で、快適な圧力で作業できます。',
      },
    ],
  },
] as const;

export const industries = [
  {
    slug: 'woodworking',
    name: '木工',
    title: '家具および工業用木材向け研磨ソリューション',
    description:
      '木材仕上げ工程は削りと平滑化のバランスに依存します。適切なベルトとディスクを選ぶことで、より安定したプロセスと再現性のある品質を実現し、不適切な選定によるダウンタイムを削減します。',
    image: '/images/belt-533.webp',
    challenges: [
      '異なる部品間での仕上げグレードの統一',
      'ベルト選定不良による機械停止の削減',
      '各加工段階に適した砥粒選定',
    ],
    products: ['abrasive-belts', 'sanding-discs', 'sanding-sponges'],
    faq: [
      {
        q: '安定した木材品質をどう維持しますか？',
        a: '削り段階、次に仕上げ段階、最後に超仕上げ段階の順で砥粒を決定します。これにより製造段階を統一し、やり直しを減らせます。',
      },
      {
        q: '既存ラインに研磨ベルトを合わせられますか？',
        a: '機械タイプとジョイントタイプのサンプルを送付いただければ、ベルトサイズと基材を確認し供給承認前に検証します。',
      },
    ],
  },
  {
    slug: 'metalworking',
    name: '金属仕上げ',
    title: '金属および産業メンテナンス向け研磨ソリューション',
    description:
      '金属表面には酸化物除去、バリ取り、塗装が必要です。ディスクとベルトは金属硬度、光沢要求、表面が保護層処理済みかどうかに基づいて選定します。',
    image: '/images/workshop.jpg',
    challenges: [
      '母材を傷めずに錆除去',
      '塗装前のエッジ処理',
      '硬度に適した研磨材選定',
    ],
    products: ['flap-discs', 'abrasive-belts'],
    faq: [
      {
        q: '高硬度に適した研磨材はありますか？',
        a: '金属タイプと要求仕上げグレードに基づいて砥粒タイプを決定し、サンプル送付または試験グレード提案後に数量注文へ進みます。',
      },
      {
        q: '見積り依頼で何を指定すべきですか？',
        a: '金属タイプ、要求仕上げグレード、工具直径、取付タイプ、数量、注文頻度。',
      },
    ],
  },
  {
    slug: 'automotive',
    name: '自動車・メンテナンス',
    title: '車体準備およびメンテナンス向け研磨材',
    description:
      '塗装剥離、車体パネル準備、エッジ平滑化まで、各段階で異なる工具と研磨材が必要です。製品と加工方法の両面からアドバイスします。',
    image: '/images/flap-disc.jpg',
    challenges: [
      '塗装前の表面準備',
      '切断後のバリ取り',
      '付着層硬度に合わせたディスク選定',
    ],
    products: ['flap-discs', 'abrasive-belts'],
    faq: [
      {
        q: '塗装のための表面準備はどう進めますか？',
        a: '古い層の除去、表面洗浄、エッジ平滑化、欠陥検査の順で進行します。研磨材タイプが各段階を決定します。',
      },
      {
        q: 'メンテナンス工場向けに個別包装できますか？',
        a: '可能です。製品カタログと工場の消費量に合わせて梱包します。',
      },
    ],
  },
  {
    slug: 'shipbuilding',
    name: '造船・船舶メンテナンス',
    title: '船舶表面準備および錆除去向け研磨材',
    description:
      '造船所での表面準備は、鋼板の錆除去と旧塗装剥離から始まり、溶継手処理、塗装前表面処理、表面摩擦低減へと続きます。ベルト/ディスク選定は表面積、錆タイプ、加工速度に依存。',
    image: '/images/flap-disc.jpg',
    challenges: [
      '母材を傷めずに鋼板の錆除去',
      '塗装前のエッジと溶継手処理',
      '防錆塗装前の表面準備',
    ],
    products: ['flap-discs', 'abrasive-belts'],
    faq: [
      {
        q: '造船所の錆除去に適した砥粒度は？',
        a: '塗装・錆除去には粗目40–80、その後平滑化に100–180。砥粒タイプ（酸化物/ジルコニア）は錆タイプと加工方法を確認してから推奨します。',
      },
      {
        q: '造船生産ライン向け大容量包装は可能ですか？',
        a: '可能です。造船所の実消費量に合わせた定期的な安定供給が可能です。',
      },
    ],
  },
  {
    slug: 'oil-gas',
    name: '石油・ガス - 表面準備',
    title: 'パイプおよびタンク向け研磨材（石油・ガス）',
    description:
      '石油・ガス分野の表面準備には、パイプ錆除去、タンク内面処理、海洋掘削リグメンテナンス、防食塗装前準備が含まれます。砥粒度とディスクタイプは表面タイプと塗装要求により決定。',
    image: '/images/factory.jpg',
    challenges: [
      '表面を傷めずにパイプ錆除去',
      '塗装前のタンク内面準備',
      '湿気・腐食環境に耐える砥粒選定',
    ],
    products: ['flap-discs', 'sanding-discs'],
    faq: [
      {
        q: 'オイルタンク用砥粒度はどう決めますか？',
        a: '粗目40–80で削り開始、その後仕上げ120–180へ段階的向上。砥粒タイプ（酸化物/ジルコニア）は表面硬度に依存。承認前に仕様確認します。',
      },
      {
        q: '数量注文前のサンプル照合はサポートされますか？',
        a: 'サポートします。サンプルを被削材と砥粒で送付いただき、照合結果を記録してから量産へ進みます。',
      },
    ],
  },
  {
    slug: 'construction',
    name: '建設材料加工',
    title: '石膏ボードおよびコンクリート処理向け研磨材',
    description:
      '建設材料（石膏ボード、セメント、石材、木材）の加工には、曲面と平面に対応する柔軟な研磨工具が必要です。仕上げ段階と表面タイプに合わせて砥粒度と基材を選定。',
    image: '/images/converting.jpg',
    challenges: [
      '塗装前の石膏ボード表面統一',
      'ボードエッジとヒンジの平滑化',
      '現場での粉塵管理',
    ],
    products: ['sanding-discs', 'sanding-sponges', 'abrasive-belts'],
    faq: [
      {
        q: '石膏ボードに適した工具は？',
        a: '粉塵排出用メッシュディスク、またはエッジと曲面用研磨スポンジ。塗装には120–240が適切。',
      },
      {
        q: '建設工場向け混合包装は可能ですか？',
        a: '可能です。オペレーターのリストに従って混合セットで梱包し、各工具の砥粒度数を指定できます。',
      },
    ],
  },
  {
    slug: 'general',
    name: '一般産業',
    title: 'メンテナンスおよび一般産業向け研磨ソリューション',
    description:
      '一般産業施設でのメンテナンス、修理、表面洗浄作業。幅広い材料と用途をカバーし、正確な消費量に合わせたカスタマイズオプションを提供。',
    image: '/images/workshop.jpg',
    challenges: [
      '異なるライン間での仕上げ品質統一',
      '一般用途への適切な砥粒選定',
      '単位処理コストの削減',
    ],
    products: ['abrasive-belts', 'flap-discs', 'sanding-discs'],
    faq: [
      {
        q: '一般メンテナンス用研磨材の選び方は？',
        a: '表面タイプ、加工段階、現有機械を特定します。大半の一般用途には80–120–180の順序を推奨。',
      },
      {
        q: '少量多品種の供給は可能ですか？',
        a: '可能です。多様な消費を持つ工場向けに、サイズ混合セットで梱包します。',
      },
    ],
  },
] as const;

/**
 * アプリケーションシーン — 全仕上げ工程をカバー（10シーン）
 * 実際のウェブサイト内製品ページのみにリンク。
 */
export const applicationScenes = [
  { title: '産業用金属仕上げ', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-metal-real-1600.jpg?width=900', href: '/products/flap-discs' },
  { title: '木材板材研磨', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-wood-real-1600.jpg?width=900', href: '/products/sanding-discs' },
  { title: '自動車表面準備', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-auto-real-1600.jpg?width=900', href: '/products/sanding-discs' },
  { title: '金属部品仕上げ', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-stainless-real-1600.jpg?width=900', href: '/products' },
  { title: '海洋産業の錆除去', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-marine-real-1600.jpg?width=900', href: '/products/flap-discs' },
  { title: '金属切削とバリ取り', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-surface-real-1600.jpg?width=900', href: '/products/abrasive-belts' },
  { title: '家具と曲面', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-furniture-real-1600.jpg?width=900', href: '/products/sanding-sponges' },
  { title: '壁面と石膏ボード研磨', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-drywall-real-1600.jpg?width=900', href: '/products/sanding-discs' },
  { title: 'ジュエリーと精密部品', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-precision-real-1600.jpg?width=900', href: '/products/models/psa-disc-3-inch' },
  { title: '手作業とクラフト研磨', image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-application-hand-real-1600.jpg?width=900', href: '/products/sanding-sponges' },
] as const;

/**
 * 4製品グループ — ホームページの「製品カテゴリー」カードとして表示、
 * 各カードはウェブサイト内の実リンクを含む。
 */
export const productCategoryLines = [
  {
    no: '01',
    name: '研磨ベルト',
    slug: 'abrasive-belts',
    description:
      '赤色研磨ベルト、533×75〜2200×1330 mm、砥粒度40〜800、参考サンプル付き。卸売およびOEM歓迎。',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-gxk-51-model.jpg?width=640',
    href: '/products/abrasive-belts',
  },
  {
    no: '02',
    name: 'フラップディスク',
    slug: 'flap-discs',
    description:
      'プラスチック、スチール、ガラス繊維基材のフラップディスク。被削材、直径、砥粒度、希望数量をお知らせください。対応見積を提示します。',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-flap-plastic-reddish-brown-display.png?width=640',
    href: '/products/flap-discs',
  },
  {
    no: '03',
    name: '研磨スポンジ',
    slug: 'sanding-sponges',
    description:
      '柔軟な研磨スポンジ片と厚手スポンジシート。曲面、エッジ、平面、乾式/湿式石膏ボード対応。洗浄後再利用可能。卸売およびOEM歓迎。',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-flexible-sanding-sponge-pads-range.jpg?width=640',
    href: '/products/sanding-sponges',
  },
  {
    no: '04',
    name: '研磨ディスク',
    slug: 'sanding-discs',
    description:
      'PSA粘着、フック&ループ、メッシュ、硬質ディスク、直径3〜6インチ、砥粒度60〜5000。卸売およびOEM歓迎。',
    image: 'https://www.motaiabrasive.com/cdn/shop/files/motai-new-disc-gold-8-20261029.jpg?width=640',
    href: '/products/sanding-discs',
  },
] as const;

export const companyFacts = [
  { value: '5', label: '研磨製品グループ' },
  { value: '5', label: '仕様から納品までの段階' },
  { value: '1', label: '購入者直通サポートチーム' },
  { value: 'OEM', label: 'ブランド・包装カスタマイズ' },
];

export const qualitySteps = [
  {
    title: '仕様確認',
    text: '生産前に購入者と製品タイプ、サイズ、砥粒、基材、数量、包装を確認。',
  },
  {
    title: 'サンプルと検査',
    text: '最終数量承認前のサンプル照合対応。購入者フィードバックを記録。',
  },
  {
    title: '加工と準備',
    text: '承認済み仕様で加工。機械タイプ、取付タイプ、要求サイズに注意。',
  },
  {
    title: '検査と梱包',
    text: 'ロット梱包前に構造、直径、基材、包装を検査。要求に応じて参考サンプル保管。',
  },
  {
    title: '納品とドキュメント',
    text: '顧客要求に合わせた輸送手段調整とロット情報提供。納品後フィードバック追跡。',
  },
];

export const resources = [
  {
    slug: 'abrasive-grit-guide',
    title: '砥粒度選定ガイド',
    description:
      '基本仕上げ作業と砥粒度を関連付けた参照表。購買チームが当社連絡時に短時間で仕様を決定できるよう支援。',
    type: 'テクニカルガイド',
    image: '/images/grit-reference.png',
    sections: [
      {
        title: '注文前',
        items: [
          '被削材と加工機械を特定',
          '段階を決定：削り、仕上げ、超仕上げ',
          'サンプルがあれば収集して照合',
        ],
      },
      {
        title: '有用な情報',
        items: [
          '要求サイズと単位',
          '機械タイプと取付タイプ',
          '予想数量と注文頻度',
        ],
      },
    ],
  },
  {
    slug: 'oem-packaging-guide',
    title: 'OEM要件準備ガイド',
    description:
      'ブランドおよび包装要件の準備手順。仕様承認を加速し、材料への印刷エラーを削減。',
    type: 'サプライガイド',
    image: '/images/converting.jpg',
    sections: [
      {
        title: '提供ファイル',
        items: [
          'ベクター形式ロゴファイル',
          '包装図面と言語要件',
          'ターゲット市場とコンプライアンス情報',
        ],
      },
      {
        title: '当社確認事項',
        items: [
          '印刷仕様と印刷面積',
          '印刷位置と箱あたり製品数',
        ],
      },
    ],
  },
];