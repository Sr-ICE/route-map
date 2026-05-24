// ===== 駅データ =====
// id: { name, x, y, lines: [], type: 'normal' | 'transfer' | 'terminal' }
// 座標系: ビューボックス 1800 x 1500 (左上が原点)
// 同名駅は複数路線で共有する

const STATIONS = {
  // === 東急東横線 ===
  'shibuya':           { name: '渋谷',           x: 970,  y: 700 },
  'daikanyama':        { name: '代官山',         x: 955,  y: 720 },
  'naka-meguro':       { name: '中目黒',         x: 940,  y: 745 },
  'yutenji':           { name: '祐天寺',         x: 925,  y: 770 },
  'gakugei-daigaku':   { name: '学芸大学',       x: 910,  y: 795 },
  'toritsu-daigaku':   { name: '都立大学',       x: 895,  y: 820 },
  'jiyugaoka':         { name: '自由が丘',       x: 880,  y: 855 },
  'den-en-chofu':      { name: '田園調布',       x: 855,  y: 895 },
  'tamagawa':          { name: '多摩川',         x: 840,  y: 925 },
  'shin-maruko':       { name: '新丸子',         x: 825,  y: 955 },
  'musashi-kosugi':    { name: '武蔵小杉',       x: 800,  y: 990 },
  'motosumiyoshi':     { name: '元住吉',         x: 770,  y: 1020 },
  'hiyoshi':           { name: '日吉',           x: 740,  y: 1055 },
  'tsunashima':        { name: '綱島',           x: 760,  y: 1090 },
  'okurayama':         { name: '大倉山',         x: 780,  y: 1125 },
  'kikuna':            { name: '菊名',           x: 800,  y: 1160 },
  'myorenji':          { name: '妙蓮寺',         x: 815,  y: 1190 },
  'hakuraku':          { name: '白楽',           x: 825,  y: 1215 },
  'higashi-hakuraku':  { name: '東白楽',         x: 835,  y: 1235 },
  'tammachi':          { name: '反町',           x: 845,  y: 1260 },
  'yokohama':          { name: '横浜',           x: 855,  y: 1290 },

  // === 東急目黒線（東横と重複しない駅）===
  'meguro':            { name: '目黒',           x: 1010, y: 775 },
  'fudo-mae':          { name: '不動前',         x: 1000, y: 800 },
  'musashi-koyama':    { name: '武蔵小山',       x: 985,  y: 825 },
  'nishi-koyama':      { name: '西小山',         x: 970,  y: 850 },
  'senzoku':           { name: '洗足',           x: 950,  y: 870 },
  'ookayama':          { name: '大岡山',         x: 925,  y: 875 },
  'okusawa':           { name: '奥沢',           x: 895,  y: 890 },

  // === 東急新横浜線 ===
  'shin-tsunashima':   { name: '新綱島',         x: 690,  y: 1080 },
  'shin-yokohama':     { name: '新横浜',         x: 630,  y: 1115 },

  // === 田園都市線 ===
  'ikejiri-ohashi':    { name: '池尻大橋',       x: 945,  y: 720 },
  'sangen-jaya':       { name: '三軒茶屋',       x: 910,  y: 740 },
  'komazawa-daigaku':  { name: '駒沢大学',       x: 880,  y: 760 },
  'sakura-shinmachi':  { name: '桜新町',         x: 850,  y: 780 },
  'yoga':              { name: '用賀',           x: 820,  y: 800 },
  'futako-tamagawa':   { name: '二子玉川',       x: 785,  y: 825 },
  'futako-shinchi':    { name: '二子新地',       x: 760,  y: 855 },
  'takatsu':           { name: '高津',           x: 730,  y: 880 },
  'mizonokuchi':       { name: '溝の口',         x: 690,  y: 910 },
  'kajigaya':          { name: '梶が谷',         x: 650,  y: 925 },
  'miyazakidai':       { name: '宮崎台',         x: 610,  y: 940 },
  'miyamaedaira':      { name: '宮前平',         x: 570,  y: 950 },
  'saginuma':          { name: '鷺沼',           x: 530,  y: 960 },
  'tama-plaza':        { name: 'たまプラーザ',   x: 490,  y: 970 },
  'azamino':           { name: 'あざみ野',       x: 450,  y: 970 },
  'eda':               { name: '江田',           x: 420,  y: 970 },
  'ichigao':           { name: '市が尾',         x: 390,  y: 970 },
  'fujigaoka':         { name: '藤が丘',         x: 360,  y: 970 },
  'aobadai':           { name: '青葉台',         x: 330,  y: 975 },
  'tana':              { name: '田奈',           x: 300,  y: 980 },
  'nagatsuta':         { name: '長津田',         x: 270,  y: 985 },
  'tsukushino':        { name: 'つくし野',       x: 240,  y: 990 },
  'suzukakedai':       { name: 'すずかけ台',     x: 215,  y: 995 },
  'minami-machida':    { name: '南町田グランベリーパーク', x: 190, y: 1000 },
  'tsukimino':         { name: 'つきみ野',       x: 165,  y: 1010 },
  'chuo-rinkan':       { name: '中央林間',       x: 140,  y: 1020 },

  // === 大井町線（重複なし）===
  'oimachi':           { name: '大井町',         x: 1170, y: 800 },
  'shimo-shimmei':     { name: '下神明',         x: 1145, y: 810 },
  'togoshi-koen':      { name: '戸越公園',       x: 1120, y: 820 },
  'nakanobu':          { name: '中延',           x: 1095, y: 830 },
  'ebaramachi':        { name: '荏原町',         x: 1070, y: 840 },
  'hatanodai':         { name: '旗の台',         x: 1045, y: 855 },
  'kita-senzoku':      { name: '北千束',         x: 1010, y: 865 },
  'midorigaoka':       { name: '緑が丘',         x: 935,  y: 870 },
  'kuhonbutsu':        { name: '九品仏',         x: 860,  y: 850 },
  'oyamadai':          { name: '尾山台',         x: 835,  y: 845 },
  'todoroki':          { name: '等々力',         x: 810,  y: 840 },
  'kaminoge':          { name: '上野毛',         x: 790,  y: 832 },

  // === 池上線 ===
  'gotanda':           { name: '五反田',         x: 1080, y: 750 },
  'osaki-hirokoji':    { name: '大崎広小路',     x: 1075, y: 775 },
  'togoshi-ginza':     { name: '戸越銀座',       x: 1090, y: 810 },
  'ebara-nakanobu':    { name: '荏原中延',       x: 1080, y: 838 },
  'nagahara':          { name: '長原',           x: 1040, y: 870 },
  'senzoku-ike':       { name: '洗足池',         x: 1010, y: 885 },
  'ishikawadai':       { name: '石川台',         x: 990,  y: 900 },
  'yukigaya-otsuka':   { name: '雪が谷大塚',     x: 975,  y: 920 },
  'ontakesan':         { name: '御嶽山',         x: 970,  y: 940 },
  'kugahara':          { name: '久が原',         x: 985,  y: 960 },
  'chidoricho':        { name: '千鳥町',         x: 1005, y: 975 },
  'ikegami':           { name: '池上',           x: 1035, y: 990 },
  'hasunuma':          { name: '蓮沼',           x: 1095, y: 1010 },
  'kamata':            { name: '蒲田',           x: 1130, y: 1020 },

  // === 多摩川線（多摩川・蒲田は重複）===
  'numabe':            { name: '沼部',           x: 870,  y: 950 },
  'unoki':             { name: '鵜の木',         x: 905,  y: 960 },
  'shimo-maruko':      { name: '下丸子',         x: 950,  y: 975 },
  'musashi-nitta':     { name: '武蔵新田',       x: 990,  y: 990 },
  'yaguchi-no-watashi':{ name: '矢口渡',         x: 1050, y: 1005 },

  // === 世田谷線 ===
  'nishi-taishido':    { name: '西太子堂',       x: 895,  y: 735 },
  'wakabayashi':       { name: '若林',           x: 880,  y: 730 },
  'shoinjinjamae':     { name: '松陰神社前',     x: 855,  y: 720 },
  'setagaya':          { name: '世田谷',         x: 830,  y: 712 },
  'kamimachi':         { name: '上町',           x: 805,  y: 705 },
  'miyanosaka':        { name: '宮の坂',         x: 785,  y: 698 },
  'yamashita':         { name: '山下',           x: 770,  y: 690 },
  'matsubara':         { name: '松原',           x: 755,  y: 685 },
  'shimo-takaido':     { name: '下高井戸',       x: 740,  y: 680 },

  // === こどもの国線 ===
  'onda':              { name: '恩田',           x: 290,  y: 1015 },
  'kodomonokuni':      { name: 'こどもの国',     x: 310,  y: 1045 },

  // === 相鉄本線 ===
  'hiranumabashi':     { name: '平沼橋',         x: 825,  y: 1305 },
  'nishi-yokohama':    { name: '西横浜',         x: 800,  y: 1310 },
  'tennocho':          { name: '天王町',         x: 770,  y: 1315 },
  'hoshikawa':         { name: '星川',           x: 740,  y: 1320 },
  'wadamachi':         { name: '和田町',         x: 710,  y: 1322 },
  'kami-hoshikawa':    { name: '上星川',         x: 680,  y: 1325 },
  'nishiya':           { name: '西谷',           x: 640,  y: 1328 },
  'tsurugamine':       { name: '鶴ヶ峰',         x: 595,  y: 1335 },
  'futamatagawa':      { name: '二俣川',         x: 540,  y: 1345 },
  'kibogaoka':         { name: '希望ヶ丘',       x: 495,  y: 1340 },
  'mitsukyo':          { name: '三ツ境',         x: 450,  y: 1330 },
  'seya':              { name: '瀬谷',           x: 400,  y: 1320 },
  'yamato':            { name: '大和',           x: 350,  y: 1305 },
  'sagami-otsuka':     { name: '相模大塚',       x: 300,  y: 1280 },
  'sagamino':          { name: 'さがみ野',       x: 260,  y: 1255 },
  'kashiwadai':        { name: 'かしわ台',       x: 220,  y: 1225 },
  'ebina':             { name: '海老名',         x: 170,  y: 1185 },

  // === 相鉄いずみ野線 ===
  'minami-makigahara': { name: '南万騎が原',     x: 525,  y: 1370 },
  'ryokuentoshi':      { name: '緑園都市',       x: 495,  y: 1390 },
  'yayoidai':          { name: '弥生台',         x: 460,  y: 1400 },
  'izumino':           { name: 'いずみ野',       x: 420,  y: 1410 },
  'izumi-chuo':        { name: 'いずみ中央',     x: 380,  y: 1420 },
  'yumegaoka':         { name: 'ゆめが丘',       x: 340,  y: 1425 },
  'shonandai':         { name: '湘南台',         x: 300,  y: 1430 },

  // === 相鉄新横浜線 ===
  'hazawa-yokohama-kokudai': { name: '羽沢横浜国大', x: 635, y: 1240 },

  // === 副都心線（渋谷は重複）===
  'meijijingumae':     { name: '明治神宮前',     x: 970,  y: 660 },
  'kita-sando':        { name: '北参道',         x: 945,  y: 615 },
  'shinjuku-sanchome': { name: '新宿三丁目',     x: 905,  y: 580 },
  'higashi-shinjuku':  { name: '東新宿',         x: 920,  y: 545 },
  'nishi-waseda':      { name: '西早稲田',       x: 935,  y: 510 },
  'zoshigaya':         { name: '雑司が谷',       x: 925,  y: 475 },
  'ikebukuro':         { name: '池袋',           x: 905,  y: 430 },
  'kanamecho':         { name: '要町',           x: 870,  y: 415 },
  'senkawa':           { name: '千川',           x: 835,  y: 400 },
  'kotake-mukaihara':  { name: '小竹向原',       x: 800,  y: 385 },
  'hikawadai':         { name: '氷川台',         x: 770,  y: 360 },
  'heiwadai':          { name: '平和台',         x: 740,  y: 335 },
  'chikatetsu-akatsuka': { name: '地下鉄赤塚',   x: 705,  y: 305 },
  'chikatetsu-narimasu': { name: '地下鉄成増',   x: 680,  y: 280 },
  'wakoshi':           { name: '和光市',         x: 645,  y: 250 },

  // === 南北線（目黒は重複）===
  'shirokanedai':      { name: '白金台',         x: 1030, y: 745 },
  'shirokane-takanawa':{ name: '白金高輪',       x: 1055, y: 720 },
  'azabujuban':        { name: '麻布十番',       x: 1070, y: 695 },
  'roppongi-itchome':  { name: '六本木一丁目',   x: 1075, y: 670 },
  'tameike-sanno':     { name: '溜池山王',       x: 1065, y: 645 },
  'nagatacho':         { name: '永田町',         x: 1040, y: 625 },
  'yotsuya':           { name: '四ツ谷',         x: 990,  y: 600 },
  'ichigaya':          { name: '市ヶ谷',         x: 960,  y: 575 },
  'iidabashi':         { name: '飯田橋',         x: 950,  y: 545 },
  'korakuen':          { name: '後楽園',         x: 985,  y: 520 },
  'todaimae':          { name: '東大前',         x: 975,  y: 490 },
  'hon-komagome':      { name: '本駒込',         x: 990,  y: 465 },
  'komagome':          { name: '駒込',           x: 1010, y: 440 },
  'nishi-gahara':      { name: '西ヶ原',         x: 1040, y: 415 },
  'oji':               { name: '王子',           x: 1075, y: 390 },
  'oji-kamiya':        { name: '王子神谷',       x: 1095, y: 365 },
  'shimo':             { name: '志茂',           x: 1100, y: 340 },
  'akabane-iwabuchi':  { name: '赤羽岩淵',       x: 1080, y: 310 },

  // === 三田線（目黒・白金台・白金高輪は南北線と共用、後楽園と春日が隣接）===
  'kasuga':            { name: '春日',           x: 970,  y: 525 },
  'suidobashi':        { name: '水道橋',         x: 1000, y: 555 },
  'jimbocho':          { name: '神保町',         x: 1030, y: 580 },
  'otemachi':          { name: '大手町',         x: 1095, y: 595 },
  'hibiya':            { name: '日比谷',         x: 1100, y: 625 },
  'uchisaiwaicho':     { name: '内幸町',         x: 1095, y: 650 },
  'onarimon':          { name: '御成門',         x: 1085, y: 680 },
  'shibakoen':         { name: '芝公園',         x: 1080, y: 705 },
  'mita':              { name: '三田',           x: 1075, y: 735 },
  'hakusan':           { name: '白山',           x: 955,  y: 475 },
  'sengoku':           { name: '千石',           x: 945,  y: 445 },
  'sugamo':            { name: '巣鴨',           x: 940,  y: 415 },
  'nishi-sugamo':      { name: '西巣鴨',         x: 925,  y: 390 },
  'shin-itabashi':     { name: '新板橋',         x: 905,  y: 370 },
  'itabashi-kuyakusho':{ name: '板橋区役所前',   x: 880,  y: 350 },
  'itabashi-honcho':   { name: '板橋本町',       x: 855,  y: 330 },
  'hon-hasunuma':      { name: '本蓮沼',         x: 825,  y: 305 },
  'shimura-sakaue':    { name: '志村坂上',       x: 790,  y: 280 },
  'shimura-sanchome':  { name: '志村三丁目',     x: 760,  y: 255 },
  'hasune':            { name: '蓮根',           x: 730,  y: 230 },
  'nishidai':          { name: '西台',           x: 700,  y: 205 },
  'takashimadaira':    { name: '高島平',         x: 665,  y: 185 },
  'shin-takashimadaira':{name: '新高島平',       x: 625,  y: 175 },
  'nishi-takashimadaira':{name:'西高島平',       x: 585,  y: 165 },

  // === 東武東上線（和光市までは副都心線、その先 主要駅）===
  'asaka':             { name: '朝霞',           x: 605,  y: 220 },
  'asakadai':          { name: '朝霞台',         x: 555,  y: 195 },
  'shiki':             { name: '志木',           x: 515,  y: 175 },
  'yanasegawa':        { name: '柳瀬川',         x: 475,  y: 155 },
  'mizuhodai':         { name: 'みずほ台',       x: 440,  y: 140 },
  'tsuruse':           { name: '鶴瀬',           x: 410,  y: 125 },
  'fujimino':          { name: 'ふじみ野',       x: 380,  y: 115 },
  'kamifukuoka':       { name: '上福岡',         x: 350,  y: 105 },
  'shingashi':         { name: '新河岸',         x: 325,  y: 100 },
  'kawagoe':           { name: '川越',           x: 295,  y: 95 },
  'kawagoeshi':        { name: '川越市',         x: 270,  y: 90 },
  'sakado':            { name: '坂戸',           x: 235,  y: 85 },
  'higashi-matsuyama': { name: '東松山',         x: 195,  y: 78 },
  'ogawamachi':        { name: '小川町',         x: 155,  y: 72 },

  // === 西武有楽町線・池袋線 ===
  'shin-sakuradai':    { name: '新桜台',         x: 770,  y: 365 },
  'nerima':            { name: '練馬',           x: 730,  y: 345 },
  'sakuradai':         { name: '桜台',           x: 760,  y: 380 },
  'ekoda':             { name: '江古田',         x: 805,  y: 405 },
  'higashi-nagasaki':  { name: '東長崎',         x: 840,  y: 420 },
  'shiinamachi':       { name: '椎名町',         x: 875,  y: 432 },
  'nakamurabashi':     { name: '中村橋',         x: 680,  y: 320 },
  'fujimidai':         { name: '富士見台',       x: 625,  y: 295 },
  'nerima-takanodai':  { name: '練馬高野台',     x: 575,  y: 270 },
  'shakujii-koen':     { name: '石神井公園',     x: 525,  y: 248 },
  'oizumi-gakuen':     { name: '大泉学園',       x: 475,  y: 232 },
  'hoya':              { name: '保谷',           x: 425,  y: 218 },
  'hibarigaoka':       { name: 'ひばりヶ丘',     x: 385,  y: 205 },
  'tokorozawa':        { name: '所沢',           x: 320,  y: 190 },
  'hanno':             { name: '飯能',           x: 230,  y: 165 },

  // === JR山手線 主要駅（重複以外）===
  'shinjuku':          { name: '新宿',           x: 870,  y: 580 },
  'shinagawa':         { name: '品川',           x: 1140, y: 740 },
  'tokyo':             { name: '東京',           x: 1110, y: 580 },
  'ueno':              { name: '上野',           x: 1130, y: 450 },
  'tabata':            { name: '田端',           x: 1085, y: 395 },
  'osaki':             { name: '大崎',           x: 1100, y: 770 },
  'ebisu':             { name: '恵比寿',         x: 1010, y: 740 },
  'harajuku':          { name: '原宿',           x: 960,  y: 670 },
  'yoyogi':            { name: '代々木',         x: 880,  y: 620 },

  // === 湘南新宿ライン・相鉄JR直通 補助駅 ===
  'nishi-oi':          { name: '西大井',         x: 1090, y: 870 },
  'shin-kawasaki':     { name: '新川崎',         x: 920,  y: 1020 },
};

// ===== 路線データ =====
// id: { name, company, color, stations: [駅id配列], hidden: bool }

const LINES = [
  // 東急
  {
    id: 'toyoko', name: '東横線', company: '東急', color: '#DA0442',
    stations: ['shibuya','daikanyama','naka-meguro','yutenji','gakugei-daigaku','toritsu-daigaku','jiyugaoka','den-en-chofu','tamagawa','shin-maruko','musashi-kosugi','motosumiyoshi','hiyoshi','tsunashima','okurayama','kikuna','myorenji','hakuraku','higashi-hakuraku','tammachi','yokohama']
  },
  {
    id: 'meguro', name: '目黒線', company: '東急', color: '#00B5A6',
    stations: ['meguro','fudo-mae','musashi-koyama','nishi-koyama','senzoku','ookayama','okusawa','den-en-chofu','tamagawa','shin-maruko','musashi-kosugi','motosumiyoshi','hiyoshi']
  },
  {
    id: 'shin-yokohama', name: '東急新横浜線', company: '東急', color: '#5E63B6',
    stations: ['hiyoshi','shin-tsunashima','shin-yokohama']
  },
  {
    id: 'denentoshi', name: '田園都市線', company: '東急', color: '#1A9F3D',
    stations: ['shibuya','ikejiri-ohashi','sangen-jaya','komazawa-daigaku','sakura-shinmachi','yoga','futako-tamagawa','futako-shinchi','takatsu','mizonokuchi','kajigaya','miyazakidai','miyamaedaira','saginuma','tama-plaza','azamino','eda','ichigao','fujigaoka','aobadai','tana','nagatsuta','tsukushino','suzukakedai','minami-machida','tsukimino','chuo-rinkan']
  },
  {
    id: 'oimachi', name: '大井町線', company: '東急', color: '#ED8E03',
    stations: ['oimachi','shimo-shimmei','togoshi-koen','nakanobu','ebaramachi','hatanodai','kita-senzoku','ookayama','midorigaoka','jiyugaoka','kuhonbutsu','oyamadai','todoroki','kaminoge','futako-tamagawa','futako-shinchi','takatsu','mizonokuchi']
  },
  {
    id: 'ikegami', name: '池上線', company: '東急', color: '#ED8090',
    stations: ['gotanda','osaki-hirokoji','togoshi-ginza','ebara-nakanobu','hatanodai','nagahara','senzoku-ike','ishikawadai','yukigaya-otsuka','ontakesan','kugahara','chidoricho','ikegami','hasunuma','kamata']
  },
  {
    id: 'tamagawa-line', name: '多摩川線', company: '東急', color: '#AC52A1',
    stations: ['tamagawa','numabe','unoki','shimo-maruko','musashi-nitta','yaguchi-no-watashi','kamata']
  },
  {
    id: 'setagaya', name: '世田谷線', company: '東急', color: '#FFD400',
    stations: ['sangen-jaya','nishi-taishido','wakabayashi','shoinjinjamae','setagaya','kamimachi','miyanosaka','yamashita','matsubara','shimo-takaido']
  },
  {
    id: 'kodomonokuni', name: 'こどもの国線', company: '東急', color: '#80C241',
    stations: ['nagatsuta','onda','kodomonokuni']
  },

  // 相鉄
  {
    id: 'sotetsu-main', name: '相鉄本線', company: '相鉄', color: '#2288CC',
    stations: ['yokohama','hiranumabashi','nishi-yokohama','tennocho','hoshikawa','wadamachi','kami-hoshikawa','nishiya','tsurugamine','futamatagawa','kibogaoka','mitsukyo','seya','yamato','sagami-otsuka','sagamino','kashiwadai','ebina']
  },
  {
    id: 'sotetsu-izumino', name: 'いずみ野線', company: '相鉄', color: '#5BABE8',
    stations: ['futamatagawa','minami-makigahara','ryokuentoshi','yayoidai','izumino','izumi-chuo','yumegaoka','shonandai']
  },
  {
    id: 'sotetsu-shin', name: '相鉄新横浜線', company: '相鉄', color: '#6BB3DD',
    stations: ['nishiya','hazawa-yokohama-kokudai','shin-yokohama']
  },

  // 東京メトロ・都営
  {
    id: 'fukutoshin', name: '副都心線', company: '東京メトロ', color: '#9C5E31',
    stations: ['wakoshi','chikatetsu-narimasu','chikatetsu-akatsuka','heiwadai','hikawadai','kotake-mukaihara','senkawa','kanamecho','ikebukuro','zoshigaya','nishi-waseda','higashi-shinjuku','shinjuku-sanchome','kita-sando','meijijingumae','shibuya']
  },
  {
    id: 'nanboku', name: '南北線', company: '東京メトロ', color: '#00AC9B',
    stations: ['akabane-iwabuchi','shimo','oji-kamiya','oji','nishi-gahara','komagome','hon-komagome','todaimae','korakuen','iidabashi','ichigaya','yotsuya','nagatacho','tameike-sanno','roppongi-itchome','azabujuban','shirokane-takanawa','shirokanedai','meguro']
  },
  {
    id: 'mita', name: '三田線', company: '都営', color: '#006AB6',
    stations: ['nishi-takashimadaira','shin-takashimadaira','takashimadaira','nishidai','hasune','shimura-sanchome','shimura-sakaue','hon-hasunuma','itabashi-honcho','itabashi-kuyakusho','shin-itabashi','nishi-sugamo','sugamo','sengoku','hakusan','kasuga','suidobashi','jimbocho','otemachi','hibiya','uchisaiwaicho','onarimon','shibakoen','mita','shirokane-takanawa','shirokanedai','meguro']
  },

  // 東武・西武
  {
    id: 'tobu-tojo', name: '東武東上線', company: '東武', color: '#1565C0',
    stations: ['ikebukuro','wakoshi','asaka','asakadai','shiki','yanasegawa','mizuhodai','tsuruse','fujimino','kamifukuoka','shingashi','kawagoe','kawagoeshi','sakado','higashi-matsuyama','ogawamachi']
  },
  {
    id: 'seibu-yurakucho', name: '西武有楽町線', company: '西武', color: '#F18900',
    stations: ['kotake-mukaihara','shin-sakuradai','nerima']
  },
  {
    id: 'seibu-ikebukuro', name: '西武池袋線', company: '西武', color: '#F18900',
    stations: ['ikebukuro','shiinamachi','higashi-nagasaki','ekoda','sakuradai','nerima','nakamurabashi','fujimidai','nerima-takanodai','shakujii-koen','oizumi-gakuen','hoya','hibarigaoka','tokorozawa','hanno']
  },

  // JR
  {
    id: 'yamanote', name: 'JR山手線', company: 'JR', color: '#9ACD32',
    stations: ['shinjuku','yoyogi','harajuku','shibuya','ebisu','meguro','gotanda','osaki','shinagawa','tokyo','ueno','tabata','ikebukuro','shinjuku']
  },
  {
    id: 'shonan-shinjuku', name: '湘南新宿ライン', company: 'JR', color: '#E60012',
    stations: ['ikebukuro','shinjuku','shibuya','ebisu','osaki','nishi-oi','musashi-kosugi','shin-kawasaki','yokohama']
  },
  {
    id: 'sotetsu-jr', name: '相鉄・JR直通線', company: '相鉄/JR', color: '#00AC42',
    stations: ['shinjuku','shibuya','ebisu','osaki','nishi-oi','musashi-kosugi','shin-kawasaki','hazawa-yokohama-kokudai','nishiya','tsurugamine','futamatagawa','kibogaoka','mitsukyo','seya','yamato','sagami-otsuka','sagamino','kashiwadai','ebina']
  },
];
