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
    ar: '研磨材',
    note: '仕上げと研削の産業環境で一般的な用語',
  },
  { term: 'Abrasive belt', ar: '研磨ベルト', note: '研磨機に取り付けるベルト' },
  { term: 'Flap disc', ar: 'フラップディスク（フラップ）', note: '多層フラップをパッドに取付' },
  { term: 'Sanding disc', ar: '研磨ディスク / サンドディスク', note: '研削用の円形ディスク' },
  { term: 'Sanding sponge', ar: '研磨スポンジ', note: '手作業研削用のスポンジ片' },
  { term: 'Grit / Grain', ar: '砥粒 / 砥粒度', note: '表面粗さを示す等級' },
  { term: 'Grain size', ar: '砥粒サイズ / 砥粒グレード', note: '欧州FEPA基準で測定' },
  { term: 'Aluminum oxide', ar: '酸化アルミニウム', note: '最も一般的な砥粒の一つ' },
  { term: 'Ceramic', ar: 'セラミック（セラミック砥粒）', note: '高性能砥粒' },
  { term: 'Zirconia alumina', ar: 'ジルコニアアルミナ', note: 'ジルコニアと酸化アルミニウムの混合' },
  { term: 'Backing', ar: '基材 / リーニング（裏材）', note: '砥粒を保持する材料' },
  {
    term: 'Hook & loop',
    ar: 'フック&ループ / ベルクロ',
    note: 'フックとループの取付システム、商業名はベルクロ',
  },
  { term: 'PSA', ar: '圧感型粘着（PSA）', note: 'Pressure Sensitive Adhesive、裏面への粘着' },
  { term: 'Mesh disc', ar: 'メッシュディスク（穴あきディスク）', note: '粉塵排出用の穴あきディスク' },
  { term: 'Sanding / Grinding', ar: 'サンディング / 研削', note: 'サンディングは薄く除去、研削は厚く除去' },
  { term: 'Polishing', ar: '研磨（ポリッシュ）', note: '光沢のある表面を創る' },
  { term: 'Surface finishing', ar: '表面仕上げ', note: '表面の最終処理' },
  { term: 'Edge deburring', ar: 'バリ取り（エッジ面取り）', note: '切断後のエッジの除去' },
  { term: 'MOQ', ar: '最小注文数量', note: 'Minimum Order Quantity' },
  { term: 'OEM', ar: '顧客ブランド製造', note: '顧客のブランドを製品に付与' },
  { term: 'ODM', ar: '顧客仕様設計', note: '顧客名のデザイン開発' },
  { term: 'RFQ', ar: '見積依頼', note: 'Request for Quotation' },
  { term: 'Converting', ar: 'コンバーティング（工業加工）', note: '原材料を製品へ転換' },
  { term: 'Certificate of Conformity', ar: '適合証明書', note: '製品が仕様通りであることの確認' },
  { term: 'Certificate of Analysis', ar: '分析証明書 / 検査報告書', note: 'COA、ロットの検査結果詳細' },
] as const;