/**
 * 用語集 — 産業用研磨材業界の標準的な日本語表現
 *
 * 原則：業界で一般的な用語を使用し、造語は使用しない。
 * 各項目は英語の原語、一般的な日本語訳法、使用コンテキストで構成。
 * 補足：これらの訳法は、日本語の産業サプライヤーの一般的な書き方と一致しています。
 */
export const glossary = [
  {
    term: 'Abrasives',
    ja: '研磨材',
    note: '仕上げと研削の産業環境で一般的な用語',
  },
  { term: 'Abrasive belt', ja: '研磨ベルト', note: '研磨機に取り付けるベルト' },
  { term: 'Flap disc', ja: 'フラップディスク（フラップ）', note: '多層フラップをパッドに取付' },
  { term: 'Sanding disc', ja: '研磨ディスク / サンドディスク', note: '研削用の円形ディスク' },
  { term: 'Sanding sponge', ja: '研磨スポンジ', note: '手作業研削用のスポンジ片' },
  { term: 'Grit / Grain', ja: '砥粒 / 砥粒度', note: '砥粒の粒度を示す等級（FEPA/JIS/ANSI）' },
  { term: 'Grain size', ja: '砥粒サイズ / 砥粒グレード', note: 'FEPA P / JIS / ISO 6344 で区分' },
  { term: 'Aluminum oxide', ja: '酸化アルミニウム', note: '最も一般的な砥粒の一つ' },
  { term: 'Ceramic', ja: 'セラミック（セラミック砥粒）', note: '高性能砥粒' },
  { term: 'Zirconia alumina', ja: 'ジルコニアアルミナ', note: 'ジルコニアと酸化アルミニウムの混合' },
  { term: 'Backing', ja: '基材 / 裏材', note: '砥粒を保持する材料' },
  {
    term: 'Hook & loop',
    ja: 'フック&ループ / ベルクロ',
    note: 'フックとループの取付システム、商業名はベルクロ',
  },
  { term: 'PSA', ja: '圧感型粘着（PSA）', note: 'Pressure Sensitive Adhesive、裏面への粘着' },
  { term: 'Mesh disc', ja: 'メッシュディスク（穴あきディスク）', note: '粉塵排出用の穴あきディスク' },
  { term: 'Sanding / Grinding', ja: 'サンディング / 研削', note: 'サンディングは薄く除去、研削は厚く除去' },
  { term: 'Polishing', ja: '研磨（ポリッシュ）', note: '光沢のある表面を創る' },
  { term: 'Surface finishing', ja: '表面仕上げ', note: '表面の最終処理' },
  { term: 'Edge deburring', ja: 'バリ取り（エッジ面取り）', note: '切断後のエッジの除去' },
  { term: 'MOQ', ja: '最小注文数量', note: 'Minimum Order Quantity' },
  { term: 'OEM', ja: '顧客ブランド製造', note: '顧客のブランドを製品に付与' },
  { term: 'ODM', ja: '顧客仕様設計', note: '顧客名のデザイン開発' },
  { term: 'RFQ', ja: '見積依頼', note: 'Request for Quotation' },
  { term: 'Converting', ja: 'コンバーティング（転換加工）', note: 'ロール状の研磨材を切売り・製品化する加工（カッティングコンバーティング等）' },
  { term: 'Certificate of Conformity', ja: '適合証明書', note: '製品が仕様通りであることの確認' },
  { term: 'Certificate of Analysis', ja: '分析証明書 / 検査報告書', note: 'COA、ロットの検査結果詳細' },
] as const;