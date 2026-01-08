// data.js
// ルールの「器」を統一：麻雀/ハイ/その他ゲーム全部これでいける

window.RULE_DB = {
  version: "0.1.0",
  games: [
    {
      id: "mahjong",
      name: "麻雀",
      icon: "🀄",
      categories: [
        { id: "basic", name: "基本" },
        { id: "win", name: "アガリ/役" },
        { id: "foul", name: "チョンボ/反則" },
        { id: "table", name: "点数/場" },
      ],
    },
    {
      id: "highlow",
      name: "ハイ＆ロー",
      icon: "🎴",
      categories: [
        { id: "basic", name: "基本" },
        { id: "bet", name: "ベット/配当" },
        { id: "penalty", name: "反則/罰" },
      ],
    },
    // ここに将棋/ポーカー/UNO/ボドゲ etc 追加してOK
  ],

  rules: [
    // ===== 麻雀 =====
    {
      id: "mj-001",
      gameId: "mahjong",
      categoryId: "basic",
      title: "フリテン（基本）",
      description: "自分の捨て牌にアガリ牌が含まれる形だとロンできない。",
      detail: "一度フリテンになると、その局の間はロン不可。ツモは可能（一般的なルール）。",
      procedure: "ロン宣言せず、ツモを待つ。テンパイ取り直しは状況次第。",
      penalty: "反則ではない（ただしロン不可）。",
      tags: ["フリテン", "ロン", "ツモ", "テンパイ"],
      aliases: ["振り聴", "フリテンとは"],
    },
    {
      id: "mj-002",
      gameId: "mahjong",
      categoryId: "foul",
      title: "チョンボ（代表例）",
      description: "誤ロン/誤ツモなど成立しないアガリ宣言はチョンボ扱いになることが多い。",
      detail: "チョンボの扱いは場（競技・フリー・身内）で差が大きい。代表例：誤ロン、ノーテンリーチ、牌姿崩しなど。",
      procedure: "場の取り決めに従う。進行停止→裁定→精算の流れが一般的。",
      penalty: "例：満貫払い/供託没収/局続行など（取り決め依存）。",
      tags: ["チョンボ", "反則", "誤ロン", "誤ツモ"],
      aliases: ["チョンボとは", "誤ロン", "誤ツモ"],
    },
    {
      id: "mj-003",
      gameId: "mahjong",
      categoryId: "table",
      title: "リーチ棒（供託）",
      description: "リーチ時に1000点を供託として場に出す（一般的）。",
      detail: "アガった人が供託を総取りするルールが多い。流局時の扱い（持ち越し等）は場の取り決め。",
      procedure: "リーチ宣言→1000点棒を供託→打牌（リーチ牌）。",
      penalty: "供託は基本戻らない（アガれなければ失点扱い）。",
      tags: ["リーチ", "供託", "点棒"],
      aliases: ["供託", "リーチ棒"],
    },

    // ===== ハイ＆ロー（例） =====
    {
      id: "hl-001",
      gameId: "highlow",
      categoryId: "basic",
      title: "同値（タイ）の扱い",
      description: "引き分け（Push）にするか、負け扱いにするかを事前に決める。",
      detail: "ゲームによっては「同値はディーラー勝ち」「同値は引き分けでベット返却」など差がある。",
      procedure: "開始前に同値ルールを明示→プレイ中は裁定固定。",
      penalty: "なし（ルール差）。",
      tags: ["同値", "タイ", "push"],
      aliases: ["引き分け", "同値は？"],
    },
    {
      id: "hl-002",
      gameId: "highlow",
      categoryId: "bet",
      title: "ダブルアップ",
      description: "勝ち分（または元金）を倍にして次の勝負に挑むオプション。",
      detail: "連続で当てるほどリターンは増えるが、負けると失う。上限や回数制限がある場合も。",
      procedure: "勝利後にダブルアップ選択→次ラウンドへ。",
      penalty: "負けると増分（または全額）失う（仕様依存）。",
      tags: ["ダブルアップ", "配当", "ベット"],
      aliases: ["倍プッシュ"],
    },
  ],
};
