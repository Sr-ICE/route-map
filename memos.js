// ===== 駅メモ（お気に入りショップ）データ =====
// アプリの「保存」ボタンで自動更新されるファイル。手動編集も可能。
// キー: 駅id（data.jsのSTATIONSと同じ）
// 値: { name, genre, url, memo } の配列

const STATION_MEMOS = {
  "kami-hoshikawa": [
    {
      "name": "喫茶MA",
      "genre": "カフェ",
      "url": "",
      "memo": "喫煙可能な昔ながらの喫茶店"
    }
  ],
  "shibuya": [
    {
      "name": "シェアラウンジ",
      "genre": "カフェ",
      "tags": [
        "Wi-Fi",
        "電源",
        "喫煙OK",
        "静か",
        "チェーン"
      ],
      "url": "",
      "memo": "高い"
    }
  ],
  "harajuku": [
    {
      "name": "ピッツァアルトランチョ",
      "genre": "レストラン",
      "url": "https://spontini.jp/harajuku.html",
      "memo": "でけぇピッツァ🍕"
    }
  ]
};
