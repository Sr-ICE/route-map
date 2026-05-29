/* ============================================
   My路線図 - 制御スクリプト (v2)
   ============================================ */

(function() {
  'use strict';

  // ===== 状態 =====
  // viewBox を直接操作することで SVG をベクターのまま拡大縮小（文字滲み防止）
  const BASE_VB = { x: -20, y: 20, w: 1400, h: 1520 };
  // デフォルト表示路線: 東横線 + 相鉄全線 + MM線（東横線と直通）
  const DEFAULT_VISIBLE = ['toyoko', 'sotetsu-main', 'sotetsu-izumino', 'sotetsu-shin', 'minatomirai'];
  const state = {
    visibleLines: new Set(DEFAULT_VISIBLE),
    viewBox: { ...BASE_VB },
  };

  // ===== 駅レイアウト (公式路線図風) =====
  // 主要駅を手動配置し、その間の駅は等間隔補間
  // 地理的正確さは犠牲、見やすさ優先
  const ANCHORS = {
    // JR山手線 (中央の骨格)
    'shinjuku':          { x: 740,  y: 600 },
    'shibuya':           { x: 1000, y: 850 },
    'ikebukuro':         { x: 800,  y: 350 },
    'tokyo':             { x: 1320, y: 650 },
    'ueno':              { x: 1320, y: 500 },
    'tabata':            { x: 1200, y: 430 },
    'shinagawa':         { x: 1320, y: 880 },
    'osaki':             { x: 1200, y: 900 },
    'ebisu':             { x: 1030, y: 890 },
    'harajuku':          { x: 950,  y: 800 },
    'yoyogi':            { x: 830,  y: 680 },
    'gotanda':           { x: 1130, y: 880 },
    'meguro':            { x: 1080, y: 910 },

    // 副都心線
    'wakoshi':           { x: 600,  y: 200 },
    'kotake-mukaihara':  { x: 700,  y: 290 },
    'meijijingumae':     { x: 970,  y: 820 },
    'shinjuku-sanchome': { x: 800,  y: 580 },

    // 南北線
    'akabane-iwabuchi':  { x: 1100, y: 280 },
    'shirokane-takanawa':{ x: 1110, y: 870 },
    'shirokanedai':      { x: 1090, y: 890 },

    // 三田線
    'nishi-takashimadaira': { x: 550, y: 100 },
    'mita':              { x: 1260, y: 950 },
    'jimbocho':          { x: 1180, y: 590 },
    'otemachi':          { x: 1270, y: 620 },

    // 東急 (南西方向に放射)
    'naka-meguro':       { x: 970,  y: 880 },
    'jiyugaoka':         { x: 760,  y: 970 },
    'den-en-chofu':      { x: 700,  y: 1010 },
    'tamagawa':          { x: 660,  y: 1030 },
    'musashi-kosugi':    { x: 540,  y: 1080 },
    'hiyoshi':           { x: 440,  y: 1100 },
    'okusawa':           { x: 780,  y: 1000 },
    'ookayama':          { x: 870,  y: 1015 },
    'hatanodai':         { x: 1090, y: 990 },
    'futako-tamagawa':   { x: 580,  y: 940 },
    'mizonokuchi':       { x: 470,  y: 970 },
    'nagatsuta':         { x: 200,  y: 1030 },
    'chuo-rinkan':       { x: 60,   y: 1060 },
    'kamata':            { x: 1280, y: 1100 },
    'oimachi':           { x: 1320, y: 960 },
    'sangen-jaya':       { x: 840,  y: 870 },
    'shimo-takaido':     { x: 700,  y: 770 },

    // 東急新横浜線
    'shin-yokohama':     { x: 270,  y: 1140 },

    // 相鉄（斜め展開で駅密集を防ぐ）
    'yokohama':          { x: 460,  y: 1380 },
    'hoshikawa':         { x: 360,  y: 1330 },
    'nishiya':           { x: 280,  y: 1290 },
    'tsurugamine':       { x: 230,  y: 1300 },
    'futamatagawa':      { x: 170,  y: 1330 },
    'yamato':            { x: 130,  y: 1220 },
    'ebina':             { x: 30,   y: 1130 },
    'izumino':           { x: 100,  y: 1410 },
    'shonandai':         { x: 60,   y: 1490 },
    'hazawa-yokohama-kokudai': { x: 280, y: 1220 },

    // みなとみらい線
    'motomachi-chukagai':{ x: 700,  y: 1530 },

    // 西武・東武
    'nerima':            { x: 550,  y: 320 },
    'hanno':             { x: 100,  y: 240 },
    'ogawamachi':        { x: 100,  y: 50 },

    // こどもの国
    'kodomonokuni':      { x: 280,  y: 1100 },

    // JR補助
    'shin-kawasaki':     { x: 480,  y: 1060 },
    'nishi-oi':          { x: 1190, y: 940 },
  };

  function computeStationLayout() {
    // ANCHORS で駅座標を上書き
    Object.keys(ANCHORS).forEach(id => {
      if (STATIONS[id]) {
        STATIONS[id].x = ANCHORS[id].x;
        STATIONS[id].y = ANCHORS[id].y;
      }
    });

    // 各路線で ANCHORS 駅でない駅は等間隔補間
    LINES.forEach(line => {
      const ids = line.stations;
      const anchorIdx = [];
      ids.forEach((id, i) => {
        if (ANCHORS[id]) anchorIdx.push(i);
      });
      if (anchorIdx.length < 2) return;

      for (let j = 0; j < anchorIdx.length - 1; j++) {
        const a = anchorIdx[j];
        const b = anchorIdx[j + 1];
        const pa = ANCHORS[ids[a]];
        const pb = ANCHORS[ids[b]];
        for (let k = a + 1; k < b; k++) {
          const t = (k - a) / (b - a);
          if (STATIONS[ids[k]] && !ANCHORS[ids[k]]) {
            STATIONS[ids[k]].x = pa.x + (pb.x - pa.x) * t;
            STATIONS[ids[k]].y = pa.y + (pb.y - pa.y) * t;
          }
        }
      }
    });
  }

  computeStationLayout();

  // ===== 乗り換え駅の判定 =====
  const stationLineMap = {};
  LINES.forEach(line => {
    line.stations.forEach(sid => {
      if (!stationLineMap[sid]) stationLineMap[sid] = new Set();
      stationLineMap[sid].add(line.id);
    });
  });

  // ===== メモ管理 =====
  const MEMOS = (typeof STATION_MEMOS !== 'undefined') ? { ...STATION_MEMOS } : {};
  function memoCount(sid) {
    return (MEMOS[sid] && MEMOS[sid].length) || 0;
  }

  // ===== GitHub PAT 認証・保存 =====
  const REPO_OWNER = 'Sr-ICE';
  const REPO_NAME = 'route-map';
  const FILE_PATH = 'memos.js';
  const PAT_KEY = 'route-map.github-pat';
  const PAT_EXPIRY_KEY = 'route-map.github-pat-expiry';

  const getPat = () => localStorage.getItem(PAT_KEY) || '';
  const setPat = (t) => localStorage.setItem(PAT_KEY, t);
  const getPatExpiry = () => localStorage.getItem(PAT_EXPIRY_KEY) || '';
  const setPatExpiry = (d) => d ? localStorage.setItem(PAT_EXPIRY_KEY, d) : localStorage.removeItem(PAT_EXPIRY_KEY);
  const clearPat = () => {
    localStorage.removeItem(PAT_KEY);
    localStorage.removeItem(PAT_EXPIRY_KEY);
  };

  // PAT 期限までの残り日数を返す（期限未設定なら null）
  function patDaysLeft() {
    const exp = getPatExpiry();
    if (!exp) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(exp + 'T00:00:00');
    const diffMs = expDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function patAlertLevel() {
    const d = patDaysLeft();
    if (d === null) return 'none';     // 期限未設定（無期限想定）
    if (d < 0) return 'expired';        // 期限切れ
    if (d <= 3) return 'critical';      // 3日以内
    if (d <= 14) return 'warning';      // 14日以内
    return 'ok';
  }

  function genMemosJs(data) {
    return `// ===== 駅メモ（お気に入りショップ）データ =====
// アプリの「保存」ボタンで自動更新されるファイル。手動編集も可能。
// キー: 駅id（data.jsのSTATIONSと同じ）
// 値: { name, genre, url, memo } の配列

const STATION_MEMOS = ${JSON.stringify(data, null, 2)};
`;
  }

  async function ghGetFile() {
    const pat = getPat();
    if (!pat) throw new Error('PAT未設定');
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=main`,
      { headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github+json' } }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let detail = '';
      try { detail = JSON.parse(errText).message || ''; } catch { detail = errText.slice(0, 120); }
      throw new Error(`取得失敗: ${res.status} ${detail}`);
    }
    return res.json();
  }

  // UTF-8文字列 → base64（日本語・絵文字対応、スタック溢れ対策）
  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }

  async function ghPutFile(content, sha, message) {
    const pat = getPat();
    if (!pat) throw new Error('PAT未設定');
    const b64 = utf8ToBase64(content);
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github+json' },
        body: JSON.stringify({
          message: message || 'Update memos.js via app',
          content: b64,
          sha: sha,
          branch: 'main',
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`保存失敗: ${res.status} ${err.slice(0, 200)}`);
    }
    return res.json();
  }

  async function saveMemoToGithub(sid, newList) {
    let stage = 'fetch';
    try {
      // 1) 現在のファイルを取得（最新のsha）
      const cur = await ghGetFile();
      const rawContent = (cur && cur.content) ? cur.content.replace(/\s/g, '') : '';

      // 2) リモート memos を最善努力でパース。失敗時はローカルベース
      stage = 'parse';
      let remoteMemos = { ...MEMOS };
      if (rawContent) {
        try {
          const decoded = new TextDecoder().decode(
            Uint8Array.from(atob(rawContent), c => c.charCodeAt(0))
          );
          const m = decoded.match(/const\s+STATION_MEMOS\s*=\s*({[\s\S]*?})\s*;?\s*$/m);
          if (m) {
            // コメント/トレーリングカンマを掃除して JSON.parse
            const cleaned = m[1]
              .replace(/\/\/.*$/gm, '')
              .replace(/\/\*[\s\S]*?\*\//g, '')
              .replace(/,(\s*[}\]])/g, '$1');
            try {
              remoteMemos = JSON.parse(cleaned);
            } catch {
              // JSONとして読めない場合は無理せずローカルベース
              remoteMemos = { ...MEMOS };
            }
          }
        } catch (e) {
          console.warn('decode failed, using local memos', e);
        }
      }

      // 3) 該当駅のメモを更新
      remoteMemos[sid] = newList;

      // 4) 新しい memos.js コンテンツ生成
      stage = 'serialize';
      const newContent = genMemosJs(remoteMemos);

      // 5) PUT
      stage = 'put';
      await ghPutFile(newContent, cur.sha, `Add memo to ${sid}`);

      // 6) ローカル状態も更新
      Object.assign(MEMOS, remoteMemos);
    } catch (err) {
      throw new Error(`[${stage}] ${err.message || err}`);
    }
  }

  // ===== 設定モーダル =====
  function updatePatStatus() {
    const el = document.getElementById('pat-status');
    const pat = getPat();
    if (!pat) {
      el.innerHTML = `<span class="pat-status__off">○ PAT未登録</span><br><small>保存はクリップボードコピーになります</small>`;
      return;
    }
    const level = patAlertLevel();
    const days = patDaysLeft();
    const masked = `<span class="pat-status__masked">${pat.slice(0, 12)}…</span>`;
    if (level === 'expired') {
      el.innerHTML = `<span class="pat-status__expired">⚠ PAT期限切れ（${-days}日経過）</span> ${masked}<br><small>新しいPATを発行して登録してください</small>`;
    } else if (level === 'critical') {
      el.innerHTML = `<span class="pat-status__critical">⚠ あと${days}日で失効</span> ${masked}<br><small>新しいPATを発行する準備をしてください</small>`;
    } else if (level === 'warning') {
      el.innerHTML = `<span class="pat-status__warning">▲ あと${days}日で失効</span> ${masked}`;
    } else if (level === 'ok') {
      el.innerHTML = `<span class="pat-status__ok">● PAT登録済み</span>（あと${days}日） ${masked}`;
    } else {
      el.innerHTML = `<span class="pat-status__ok">● PAT登録済み（期限未設定）</span> ${masked}`;
    }
  }

  // ヘッダー設定ドット表示
  function updateSettingsDot() {
    const dot = document.getElementById('settings-dot');
    if (!dot) return;
    const level = patAlertLevel();
    if (level === 'critical' || level === 'expired') {
      dot.removeAttribute('hidden');
      dot.className = 'header-settings__dot is-critical';
    } else if (level === 'warning') {
      dot.removeAttribute('hidden');
      dot.className = 'header-settings__dot is-warning';
    } else {
      dot.setAttribute('hidden', '');
    }
  }

  document.getElementById('open-settings').addEventListener('click', () => {
    updatePatStatus();
    document.getElementById('pat-input').value = '';
    document.getElementById('pat-expiry').value = getPatExpiry();
    document.getElementById('settings-modal').removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) {
      document.getElementById('settings-modal').setAttribute('hidden', '');
      document.body.style.overflow = '';
      if (window.__resetPanZoom) window.__resetPanZoom();
    }
  });

  document.getElementById('pat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = document.getElementById('pat-input').value.trim();
    const exp = document.getElementById('pat-expiry').value;
    if (!v) {
      // 期限だけ更新するケース（既存PAT流用）
      if (getPat() && exp !== getPatExpiry()) {
        setPatExpiry(exp);
        updatePatStatus();
        updateSettingsDot();
        toast('有効期限を更新しました');
      }
      return;
    }
    setPat(v);
    setPatExpiry(exp);
    updatePatStatus();
    updateSettingsDot();
    toast('PATを保存しました');
  });

  document.getElementById('pat-clear').addEventListener('click', () => {
    if (!confirm('PATを削除しますか？')) return;
    clearPat();
    updatePatStatus();
    updateSettingsDot();
    toast('PATを削除しました');
  });

  // PAT接続テスト: /user とリポジトリの両方を叩いて確認
  document.getElementById('pat-test').addEventListener('click', async () => {
    const resultEl = document.getElementById('pat-test-result');
    const pat = getPat();
    if (!pat) {
      resultEl.className = 'pat-test-result is-error';
      resultEl.textContent = '先にPATを保存してください';
      return;
    }
    resultEl.className = 'pat-test-result is-loading';
    resultEl.textContent = '確認中...';
    try {
      // 1) /user で認証確認
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github+json' }
      });
      if (!userRes.ok) {
        const t = await userRes.text();
        throw new Error(`認証失敗 (${userRes.status}): ${t.slice(0, 100)}`);
      }
      const user = await userRes.json();
      // 2) リポジトリアクセス確認
      const repoRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=main`,
        { headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github+json' } }
      );
      if (!repoRes.ok) {
        const t = await repoRes.text();
        throw new Error(`リポジトリアクセス失敗 (${repoRes.status}): ${t.slice(0, 100)}`);
      }
      resultEl.className = 'pat-test-result is-success';
      resultEl.textContent = `✓ 成功 — user: ${user.login} / リポジトリ書込OK`;
    } catch (err) {
      resultEl.className = 'pat-test-result is-error';
      resultEl.textContent = '✗ ' + err.message;
    }
  });

  // 起動時：期限チェックして必要なら警告トースト
  function checkPatExpiryOnLoad() {
    const level = patAlertLevel();
    if (level === 'expired') {
      toast('⚠ PATが期限切れです。設定から更新してください');
    } else if (level === 'critical') {
      toast(`⚠ PATがあと${patDaysLeft()}日で失効します`);
    } else if (level === 'warning') {
      // ヘッダードットのみ、トーストは出さない
    }
    updateSettingsDot();
  }

  // ===== 駅ラベル方向の決定 =====
  // 駅の周りの線の方向を見て、ラベルを最適な向きに配置
  function calcLabelDirection(sid, station) {
    // この駅を通る全ての路線で、前後の駅との方向ベクトルを平均化
    const dirs = [];
    LINES.forEach(line => {
      const idx = line.stations.indexOf(sid);
      if (idx === -1) return;
      const prev = idx > 0 ? STATIONS[line.stations[idx - 1]] : null;
      const next = idx < line.stations.length - 1 ? STATIONS[line.stations[idx + 1]] : null;
      if (prev) dirs.push({ dx: station.x - prev.x, dy: station.y - prev.y });
      if (next) dirs.push({ dx: next.x - station.x, dy: next.y - station.y });
    });

    if (dirs.length === 0) return { dx: 1, dy: 0 };

    // 平均方向
    let avgDx = 0, avgDy = 0;
    dirs.forEach(d => {
      const len = Math.hypot(d.dx, d.dy) || 1;
      avgDx += d.dx / len;
      avgDy += d.dy / len;
    });
    avgDx /= dirs.length;
    avgDy /= dirs.length;

    // 線に垂直な方向にラベルを置く（90度回転）
    // (dx, dy) の垂直は (-dy, dx) または (dy, -dx)
    // 北上または右上を優先（読みやすい方向）
    let perpX = -avgDy;
    let perpY = avgDx;
    // 下向きに偏らせない（画面上で読みやすく）
    if (perpY > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const len = Math.hypot(perpX, perpY) || 1;
    return { dx: perpX / len, dy: perpY / len };
  }

  // ===== 路線フィルタの構築 =====
  function buildFilters() {
    const groupsEl = document.getElementById('filter-groups');
    const companies = {};
    LINES.forEach(line => {
      if (!companies[line.company]) companies[line.company] = [];
      companies[line.company].push(line);
    });

    const order = ['東急', '相鉄', '横浜高速', '東京メトロ', '都営', '東武', '西武', 'JR', '相鉄/JR'];
    const sortedCompanies = Object.keys(companies).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    groupsEl.innerHTML = '';
    sortedCompanies.forEach(company => {
      const group = document.createElement('div');
      group.className = 'filter-group';
      group.innerHTML = `<h3 class="filter-group__title">${company}</h3>`;

      const items = document.createElement('div');
      items.className = 'filter-group__items';

      companies[company].forEach(line => {
        const isOn = state.visibleLines.has(line.id);
        const label = document.createElement('label');
        label.className = 'filter-item';
        label.innerHTML = `
          <input type="checkbox" data-line="${line.id}" ${isOn ? 'checked' : ''}>
          <span class="filter-item__dot" style="background:${line.color}"></span>
          <span>${line.name}</span>
        `;
        items.appendChild(label);
      });

      group.appendChild(items);
      groupsEl.appendChild(group);
    });

    groupsEl.addEventListener('change', (e) => {
      const cb = e.target.closest('input[type=checkbox]');
      if (!cb) return;
      const lineId = cb.dataset.line;
      if (cb.checked) state.visibleLines.add(lineId);
      else state.visibleLines.delete(lineId);
      updateVisibility();
      updateFilterCount();
      if (window.__fitToVisible) window.__fitToVisible();
    });

    updateFilterCount();
  }

  function updateFilterCount() {
    const el = document.getElementById('filter-count');
    el.textContent = `${state.visibleLines.size} / ${LINES.length} 路線`;
  }

  document.getElementById('filter-toggle').addEventListener('click', () => {
    const body = document.getElementById('filter-body');
    const toggle = document.getElementById('filter-toggle');
    const isHidden = body.hasAttribute('hidden');
    if (isHidden) {
      body.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      body.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.querySelectorAll('.filter-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const checkboxes = document.querySelectorAll('#filter-groups input[type=checkbox]');
      if (action === 'all') {
        checkboxes.forEach(cb => { cb.checked = true; state.visibleLines.add(cb.dataset.line); });
      } else if (action === 'none') {
        checkboxes.forEach(cb => { cb.checked = false; });
        state.visibleLines.clear();
      } else if (action === 'tokyu-sotetsu') {
        state.visibleLines.clear();
        checkboxes.forEach(cb => {
          const line = LINES.find(l => l.id === cb.dataset.line);
          const keep = line && (line.company === '東急' || line.company === '相鉄');
          cb.checked = keep;
          if (keep) state.visibleLines.add(cb.dataset.line);
        });
      }
      updateVisibility();
      updateFilterCount();
      if (window.__fitToVisible) window.__fitToVisible();
    });
  });

  // ===== SVG描画 =====
  function buildMap() {
    const svg = document.getElementById('map-svg');
    const NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';

    // 路線レイヤー
    const linesLayer = document.createElementNS(NS, 'g');
    linesLayer.setAttribute('id', 'lines-layer');

    LINES.forEach(line => {
      const points = line.stations
        .map(sid => STATIONS[sid])
        .filter(Boolean)
        .map(s => `${s.x},${s.y}`)
        .join(' ');

      const polyline = document.createElementNS(NS, 'polyline');
      polyline.setAttribute('points', points);
      polyline.setAttribute('class', 'line-path');
      polyline.setAttribute('data-line', line.id);
      polyline.setAttribute('stroke', line.color);
      linesLayer.appendChild(polyline);
    });
    svg.appendChild(linesLayer);

    // 駅レイヤー
    const stationsLayer = document.createElementNS(NS, 'g');
    stationsLayer.setAttribute('id', 'stations-layer');

    Object.entries(STATIONS).forEach(([sid, station]) => {
      const lines = Array.from(stationLineMap[sid] || []);
      if (lines.length === 0) return;

      const isTransfer = lines.length >= 2;
      const hasMemo = memoCount(sid) > 0;
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', station.x);
      circle.setAttribute('cy', station.y);
      circle.setAttribute('r', isTransfer ? 5.5 : 3.5);
      circle.setAttribute('class', 'station-circle' + (isTransfer ? ' is-transfer' : '') + (hasMemo ? ' has-memo' : ''));
      circle.setAttribute('data-station', sid);
      circle.setAttribute('data-lines', lines.join(','));
      if (!isTransfer) {
        const lineColor = LINES.find(l => l.id === lines[0])?.color || '#333';
        circle.setAttribute('stroke', lineColor);
      } else {
        circle.setAttribute('stroke', '#1d1d1f');
      }
      // メモがある駅は金色枠で上書き
      if (hasMemo) circle.setAttribute('stroke', '#F4A300');
      stationsLayer.appendChild(circle);
    });
    svg.appendChild(stationsLayer);

    // 駅クリックでモーダルオープン
    stationsLayer.addEventListener('click', (e) => {
      const c = e.target.closest('.station-circle');
      if (!c) return;
      openMemoModal(c.dataset.station);
    });

    // メモバッジレイヤー（駅丸の右上に件数バッジ）
    const memoBadgeLayer = document.createElementNS(NS, 'g');
    memoBadgeLayer.setAttribute('id', 'memo-badge-layer');
    svg.appendChild(memoBadgeLayer);
    renderMemoBadgesSvg();

    // ラベルレイヤー（駅の進行方向に対し垂直方向に配置）
    const labelsLayer = document.createElementNS(NS, 'g');
    labelsLayer.setAttribute('id', 'labels-layer');

    Object.entries(STATIONS).forEach(([sid, station]) => {
      const lines = Array.from(stationLineMap[sid] || []);
      if (lines.length === 0) return;

      const isTransfer = lines.length >= 2;
      const dir = calcLabelDirection(sid, station);

      // ラベルの基準距離（駅丸から離す）
      const dist = isTransfer ? 12 : 9;
      const tx = station.x + dir.dx * dist;
      const ty = station.y + dir.dy * dist;

      // text-anchor を方向で決定
      let anchor = 'middle';
      if (dir.dx > 0.3) anchor = 'start';
      else if (dir.dx < -0.3) anchor = 'end';

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', tx);
      text.setAttribute('y', ty + 3);  // ベースライン補正
      text.setAttribute('text-anchor', anchor);
      text.setAttribute('class', 'station-label' + (isTransfer ? ' is-transfer' : ''));
      text.setAttribute('data-station', sid);
      text.setAttribute('data-lines', lines.join(','));
      text.textContent = station.name;
      labelsLayer.appendChild(text);
    });
    svg.appendChild(labelsLayer);
  }

  // ===== 表示/非表示の更新 =====
  function updateVisibility() {
    document.querySelectorAll('[data-line]').forEach(el => {
      const lineId = el.dataset.line;
      if (state.visibleLines.has(lineId)) {
        el.classList.remove('line-hidden');
      } else {
        el.classList.add('line-hidden');
      }
    });

    document.querySelectorAll('[data-lines]').forEach(el => {
      const lines = el.dataset.lines.split(',');
      const anyVisible = lines.some(l => state.visibleLines.has(l));
      if (anyVisible) el.classList.remove('line-hidden');
      else el.classList.add('line-hidden');
    });

    document.querySelectorAll('.list-line').forEach(el => {
      const lineId = el.dataset.line;
      if (state.visibleLines.has(lineId)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // ===== パン・ズーム =====
  function setupPanZoom() {
    const viewport = document.getElementById('map-viewport');
    const svg = document.getElementById('map-svg');

    let isDragging = false;
    let lastX = 0, lastY = 0;
    const pointers = new Map();
    let lastPinchDist = 0;

    function applyViewBox() {
      const vb = state.viewBox;
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      updateNonScalingElements();
    }

    // ズーム倍率に応じて駅丸サイズ・フォントサイズを補正
    function updateNonScalingElements() {
      const rect = viewport.getBoundingClientRect();
      if (rect.width === 0) return;
      const pxPerUnit = state.viewBox.w / rect.width;
      document.querySelectorAll('.station-circle').forEach(el => {
        const baseR = el.classList.contains('is-transfer') ? 6 : 3.5;
        el.setAttribute('r', baseR * pxPerUnit);
        el.setAttribute('stroke-width', 2.5 * pxPerUnit);
      });
      document.querySelectorAll('.station-label').forEach(el => {
        const baseFs = el.classList.contains('is-transfer') ? 12 : 11;
        el.setAttribute('font-size', baseFs * pxPerUnit);
        el.setAttribute('stroke-width', 3.5 * pxPerUnit);
      });
      document.querySelectorAll('.line-path').forEach(el => {
        el.setAttribute('stroke-width', 7 * pxPerUnit);
      });
      // メモバッジも一定px化
      document.querySelectorAll('.memo-badge-svg').forEach(el => {
        el.setAttribute('r', 7 * pxPerUnit);
        el.setAttribute('stroke-width', 1.5 * pxPerUnit);
      });
      document.querySelectorAll('.memo-badge-text').forEach(el => {
        el.setAttribute('font-size', 9 * pxPerUnit);
      });
    }
    window.__updateNonScalingElements = updateNonScalingElements;

    // 画面上の dx, dy 分だけパン (右にドラッグ = 地図が右に移動 = viewBox が左に)
    function pan(dx, dy) {
      const rect = viewport.getBoundingClientRect();
      if (rect.width === 0) return;
      const svgDx = dx * state.viewBox.w / rect.width;
      const svgDy = dy * state.viewBox.h / rect.height;
      state.viewBox.x -= svgDx;
      state.viewBox.y -= svgDy;
      applyViewBox();
    }

    // factor 倍ズーム、(cx, cy) は画面座標でズームの中心
    function zoom(factor, cx, cy) {
      const rect = viewport.getBoundingClientRect();
      if (rect.width === 0) return;
      const vb = state.viewBox;
      const newW = vb.w / factor;
      const newH = vb.h / factor;
      // ズーム範囲制限 (基準viewBoxの幅に対して0.1〜3.0倍)
      const minW = BASE_VB.w * 0.1;
      const maxW = BASE_VB.w * 3.0;
      if (newW < minW || newW > maxW) return;
      // ズーム中心の SVG 座標
      const ratioX = (cx - rect.left) / rect.width;
      const ratioY = (cy - rect.top) / rect.height;
      const svgCx = vb.x + ratioX * vb.w;
      const svgCy = vb.y + ratioY * vb.h;
      state.viewBox.x = svgCx - ratioX * newW;
      state.viewBox.y = svgCy - ratioY * newH;
      state.viewBox.w = newW;
      state.viewBox.h = newH;
      applyViewBox();
    }

    viewport.addEventListener('pointerdown', (e) => {
      viewport.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (pointers.size === 2) {
        isDragging = false;
        const pts = Array.from(pointers.values());
        lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1 && isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        pan(dx, dy);
        lastX = e.clientX;
        lastY = e.clientY;
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        if (lastPinchDist > 0) {
          const ratio = dist / lastPinchDist;
          zoom(ratio, cx, cy);
        }
        lastPinchDist = dist;
      }
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) lastPinchDist = 0;
      if (pointers.size === 0) isDragging = false;
    }
    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', endPointer);
    viewport.addEventListener('pointerleave', endPointer);

    // パン/ズーム状態を強制リセット（モーダル等で操作競合した時用）
    window.__resetPanZoom = function() {
      pointers.clear();
      isDragging = false;
      lastPinchDist = 0;
    };

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1/1.1;
      zoom(factor, e.clientX, e.clientY);
    }, { passive: false });

    document.getElementById('zoom-in').addEventListener('click', () => {
      const rect = viewport.getBoundingClientRect();
      zoom(1.25, rect.left + rect.width/2, rect.top + rect.height/2);
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      const rect = viewport.getBoundingClientRect();
      zoom(1/1.25, rect.left + rect.width/2, rect.top + rect.height/2);
    });

    // 表示中の路線の駅バウンディングを画面いっぱいにフィット
    function fitToVisible() {
      const rect = viewport.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const visibleStations = new Set();
      LINES.forEach(line => {
        if (state.visibleLines.has(line.id)) {
          line.stations.forEach(sid => visibleStations.add(sid));
        }
      });

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      visibleStations.forEach(sid => {
        const s = STATIONS[sid];
        if (!s) return;
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x);
        maxY = Math.max(maxY, s.y);
      });

      if (!isFinite(minX)) {
        state.viewBox = { ...BASE_VB };
        applyViewBox();
        return;
      }

      const contentW = Math.max(maxX - minX, 200);
      const contentH = Math.max(maxY - minY, 200);
      const screenR = rect.width / rect.height;
      const contentR = contentW / contentH;
      const padFactor = 1.08;

      // まずコンテンツ全体が画面に収まるようフィット
      let vbW, vbH;
      if (contentR > screenR) {
        vbW = contentW * padFactor;
        vbH = vbW / screenR;
      } else {
        vbH = contentH * padFactor;
        vbW = vbH * screenR;
      }

      // aspect不一致で空白が大きすぎる場合はズームインして画面を埋める
      // 短辺方向の充填率が低いと地図が小さく見えるので 0.55 以上を確保
      const fillRateShort = (contentR > screenR)
        ? contentH / vbH
        : contentW / vbW;
      const minFill = 0.55;
      if (fillRateShort < minFill) {
        const zoom = minFill / fillRateShort;
        vbW /= zoom;
        vbH /= zoom;
      }

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      state.viewBox = {
        x: cx - vbW / 2,
        y: cy - vbH / 2,
        w: vbW,
        h: vbH,
      };
      applyViewBox();
    }

    document.getElementById('zoom-reset').addEventListener('click', fitToVisible);

    requestAnimationFrame(() => requestAnimationFrame(fitToVisible));
    window.addEventListener('resize', fitToVisible);

    // 外部から呼べるように公開
    window.__fitToVisible = fitToVisible;
  }

  // ===== リストビュー構築 =====
  function buildList() {
    const container = document.getElementById('list-container');
    container.innerHTML = '';

    LINES.forEach(line => {
      const wrap = document.createElement('div');
      wrap.className = 'list-line';
      wrap.dataset.line = line.id;

      // 左カラーバー
      const bar = document.createElement('div');
      bar.className = 'list-line__bar';
      bar.style.background = line.color;
      wrap.appendChild(bar);

      // ヘッダー
      const header = document.createElement('div');
      header.className = 'list-line__header';
      header.innerHTML = `
        <span class="list-line__color" style="background:${line.color}"></span>
        <div class="list-line__title">
          <span class="list-line__name">${line.name}</span>
          <span class="list-line__meta">${line.company} · ${line.stations.length}駅</span>
        </div>
        <span class="list-line__chevron">⌄</span>
      `;
      header.addEventListener('click', () => wrap.classList.toggle('is-open'));

      // 駅リスト
      const ul = document.createElement('ul');
      ul.className = 'list-line__stations';
      ul.style.setProperty('--line-color', line.color);

      line.stations.forEach(sid => {
        const s = STATIONS[sid];
        if (!s) return;
        const li = document.createElement('li');
        li.className = 'list-station';
        li.dataset.station = sid;

        const transfers = Array.from(stationLineMap[sid] || [])
          .filter(lid => lid !== line.id)
          .map(lid => LINES.find(l => l.id === lid))
          .filter(Boolean);

        if (transfers.length > 0) li.classList.add('is-transfer');
        const mc = memoCount(sid);
        if (mc > 0) li.classList.add('has-memo');

        const chips = transfers.map(t => `
          <span class="list-station__transfer-chip">
            <span class="list-station__transfer-chip__dot" style="background:${t.color}"></span>
            ${t.name}
          </span>
        `).join('');

        const memoBadge = mc > 0
          ? `<span class="list-station__memo-badge" title="${mc}件のメモ">★ ${mc}</span>`
          : '';

        li.innerHTML = `
          <span class="list-station__name">${s.name}</span>
          ${memoBadge}
          <span class="list-station__transfers">${chips}</span>
        `;
        li.addEventListener('click', () => openMemoModal(sid));
        ul.appendChild(li);
      });

      wrap.appendChild(header);
      wrap.appendChild(ul);
      container.appendChild(wrap);
    });
  }

  // ===== ジャンル・タグ・アイコン定義 =====
  const GENRE_TAGS = {
    'カフェ':       ['Wi-Fi', '電源', '禁煙', '喫煙OK', '24時間', '静か', 'おしゃれ', 'チェーン'],
    'レストラン':   ['個室', '予約必要', 'カード可', 'テイクアウト', 'ランチ', 'ディナー', '飲み放題'],
    'バー/居酒屋':  ['個室', '予約必要', '深夜営業', '隠れ家', 'カード可'],
    '商業施設':     ['駐車場', '深夜営業', '日曜営業'],
    'レジャー':     ['屋内', '屋外', '予約必要', '子供OK', '雨でもOK'],
    '書店':         ['雑誌', '専門書', '古書', 'カフェ併設'],
    'ホテル':       ['朝食付き', '駐車場', 'Wi-Fi', '禁煙'],
    '雑貨':         ['チェーン', 'セレクト'],
    'その他':       [],
  };
  const GENRE_LIST = Object.keys(GENRE_TAGS);
  const GENRE_ICONS = {
    'カフェ':       '☕',
    'レストラン':   '🍴',
    'バー/居酒屋':  '🍻',
    '商業施設':     '🏬',
    'レジャー':     '🎢',
    '書店':         '📚',
    'ホテル':       '🏨',
    '雑貨':         '🛍️',
    'その他':       '📍',
  };
  const GENRE_COLORS = {
    'カフェ':       '#A0522D',
    'レストラン':   '#DC143C',
    'バー/居酒屋':  '#6A0DAD',
    '商業施設':     '#1E90FF',
    'レジャー':     '#2E8B57',
    '書店':         '#FF8C00',
    'ホテル':       '#5F6F81',
    '雑貨':         '#E91E63',
    'その他':       '#888',
  };

  // SVG上のメモバッジ（駅丸の右上に件数を表示）
  function renderMemoBadgesSvg() {
    const layer = document.getElementById('memo-badge-layer');
    if (!layer) return;
    const NS = 'http://www.w3.org/2000/svg';
    layer.innerHTML = '';
    Object.entries(STATIONS).forEach(([sid, station]) => {
      const mc = memoCount(sid);
      if (mc === 0) return;
      const lines = Array.from(stationLineMap[sid] || []);
      if (lines.length === 0) return;
      const cx = station.x + 8;
      const cy = station.y - 8;
      const r = 6;
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', '#F4A300');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', 1.2);
      circle.setAttribute('class', 'memo-badge-svg');
      circle.setAttribute('data-station', sid);
      circle.setAttribute('data-lines', lines.join(','));
      layer.appendChild(circle);
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', cx);
      text.setAttribute('y', cy + 3);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', 8);
      text.setAttribute('font-weight', 700);
      text.setAttribute('class', 'memo-badge-text');
      text.setAttribute('data-station', sid);
      text.setAttribute('data-lines', lines.join(','));
      text.setAttribute('pointer-events', 'none');
      text.textContent = mc > 9 ? '9+' : mc;
      layer.appendChild(text);
    });
    // ズーム比率で再スケーリング
    if (window.__updateNonScalingElements) window.__updateNonScalingElements();
  }

  // ===== メモバッジ即時反映 =====
  function rebuildMemoBadges() {
    // マップ駅丸
    document.querySelectorAll('.station-circle').forEach(c => {
      const sid = c.dataset.station;
      const hasMemo = memoCount(sid) > 0;
      c.classList.toggle('has-memo', hasMemo);
      if (hasMemo) {
        c.setAttribute('stroke', '#F4A300');
      } else {
        const lines = (c.dataset.lines || '').split(',');
        const isTransfer = lines.length >= 2;
        if (isTransfer) {
          c.setAttribute('stroke', '#1d1d1f');
        } else {
          const lineColor = LINES.find(l => l.id === lines[0])?.color || '#333';
          c.setAttribute('stroke', lineColor);
        }
      }
    });
    // SVGメモバッジ再描画
    renderMemoBadgesSvg();
    // リスト駅セル
    document.querySelectorAll('.list-station').forEach(li => {
      const sid = li.dataset.station;
      const mc = memoCount(sid);
      li.classList.toggle('has-memo', mc > 0);
      let badge = li.querySelector('.list-station__memo-badge');
      if (mc > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'list-station__memo-badge';
          const name = li.querySelector('.list-station__name');
          name.insertAdjacentElement('afterend', badge);
        }
        badge.textContent = `★ ${mc}`;
      } else if (badge) {
        badge.remove();
      }
    });
  }

  // ===== 駅メモモーダル =====
  let currentMemoSid = null;
  let memoEditingIndex = null;  // null=新規追加 / number=該当indexを編集中

  function openMemoModal(sid) {
    currentMemoSid = sid;
    memoEditingIndex = null;
    renderMemoModal();
    document.getElementById('memo-modal').removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (window.__resetPanZoom) window.__resetPanZoom();
  }

  function renderMemoModal() {
    const sid = currentMemoSid;
    if (!sid) return;
    const station = STATIONS[sid];
    if (!station) return;
    const lines = Array.from(stationLineMap[sid] || [])
      .map(lid => LINES.find(l => l.id === lid))
      .filter(Boolean);

    const titleEl = document.getElementById('memo-modal-title');
    const subEl = document.getElementById('memo-modal-sub');
    const bodyEl = document.getElementById('memo-modal-body');

    titleEl.textContent = station.name;
    subEl.innerHTML = lines.map(l =>
      `<span class="memo-modal__line-chip"><span style="background:${l.color}"></span>${l.name}</span>`
    ).join('');

    const memos = MEMOS[sid] || [];
    const memoListHtml = memos.length === 0
      ? '<p class="memo-modal__empty">まだメモはありません。下のフォームから追加してください。</p>'
      : `<ul class="memo-list">${memos.map((m, i) => {
          const genre = m.genre || 'その他';
          const icon = GENRE_ICONS[genre] || '📍';
          const color = GENRE_COLORS[genre] || '#888';
          const isEditing = memoEditingIndex === i;
          return `
          <li class="memo-item ${isEditing ? 'is-editing' : ''}" data-idx="${i}">
            <div class="memo-item__head">
              <span class="memo-item__icon" style="background:${color}1A;color:${color}">${icon}</span>
              <div class="memo-item__title">
                <span class="memo-item__name">${escapeHtml(m.name)}</span>
                ${m.genre ? `<span class="memo-item__genre" style="background:${color}1A;color:${color}">${escapeHtml(m.genre)}</span>` : ''}
              </div>
              <div class="memo-item__actions">
                <button type="button" class="memo-item__btn" data-action="edit" data-idx="${i}" title="編集">✎</button>
                <button type="button" class="memo-item__btn memo-item__btn--danger" data-action="delete" data-idx="${i}" title="削除">🗑</button>
              </div>
            </div>
            ${(m.tags && m.tags.length) ? `<div class="memo-item__tags">${m.tags.map(t => `<span class="memo-item__tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            ${m.memo ? `<p class="memo-item__memo">${escapeHtml(m.memo)}</p>` : ''}
            ${m.url ? `<a class="memo-item__url" href="${escapeAttr(m.url)}" target="_blank" rel="noopener">${escapeHtml(m.url)} ↗</a>` : ''}
          </li>
        `;}).join('')}</ul>`;

    const editing = memoEditingIndex !== null ? memos[memoEditingIndex] : null;
    const submitLabel = editing
      ? '更新'
      : (getPat() ? '保存（GitHubに自動push）' : 'JSONをコピー（PAT未設定）');

    bodyEl.innerHTML = `
      <section class="memo-section">
        <h3 class="memo-section__title">登録済み (${memos.length})</h3>
        ${memoListHtml}
      </section>
      <section class="memo-section">
        <h3 class="memo-section__title">${editing ? `「${escapeHtml(editing.name)}」を編集` : '追加'}</h3>
        <form class="memo-form" id="memo-form">
          <label class="memo-field">
            <span class="memo-field__label">店名 *</span>
            <input type="text" name="name" id="memo-name" required placeholder="例: モンブラン" value="${escapeAttr(editing ? editing.name : '')}">
          </label>
          <div class="memo-field">
            <span class="memo-field__label">ジャンル</span>
            <div class="pill-group" id="genre-pills">
              ${GENRE_LIST.map(g => `
                <label class="pill-item">
                  <input type="radio" name="genre" value="${g}" ${editing && editing.genre === g ? 'checked' : ''}>
                  <span>${(GENRE_ICONS[g] || '')} ${g}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="memo-field" id="tags-field" ${editing && editing.genre && GENRE_TAGS[editing.genre] && GENRE_TAGS[editing.genre].length ? '' : 'hidden'}>
            <span class="memo-field__label">タグ（複数選択可）</span>
            <div class="pill-group" id="tag-pills">
              ${editing && editing.genre && GENRE_TAGS[editing.genre] ? GENRE_TAGS[editing.genre].map(t => `
                <label class="pill-item pill-item--check">
                  <input type="checkbox" name="tag" value="${t}" ${editing.tags && editing.tags.includes(t) ? 'checked' : ''}>
                  <span>${t}</span>
                </label>
              `).join('') : ''}
            </div>
          </div>
          <label class="memo-field">
            <span class="memo-field__label">URL</span>
            <div class="memo-field__row">
              <input type="url" name="url" id="memo-url" placeholder="https://..." value="${escapeAttr(editing ? (editing.url || '') : '')}">
              <button type="button" class="memo-field__btn" id="search-url-btn" title="店名と駅名でGoogle検索">🔍</button>
            </div>
          </label>
          <label class="memo-field">
            <span class="memo-field__label">メモ</span>
            <textarea name="memo" rows="3" placeholder="自由メモ">${escapeHtml(editing ? (editing.memo || '') : '')}</textarea>
          </label>
          <div class="memo-form__actions">
            <button type="submit" class="memo-form__submit">${submitLabel}</button>
            ${editing ? '<button type="button" class="memo-form__clear" id="cancel-edit">キャンセル</button>' : ''}
          </div>
        </form>
        ${getPat() || editing ? '' : `
          <details class="memo-help">
            <summary>手動で memos.js に反映する手順</summary>
            <ol>
              <li>「JSONをコピー」を押す</li>
              <li>GitHubの <code>memos.js</code> を開く</li>
              <li><code>"${sid}": [ ... ]</code> に貼り付け（既存ならカンマで追加）</li>
              <li>commit → push で反映</li>
            </ol>
            <p>⚙ ボタンから PAT を登録するとワンタップ保存になります。</p>
          </details>
        `}
      </section>
    `;

    // 編集/削除ボタンのハンドラ
    bodyEl.querySelectorAll('.memo-item__btn').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        const action = btn.dataset.action;
        if (action === 'edit') {
          memoEditingIndex = idx;
          renderMemoModal();
          // フォーム位置までスクロール
          setTimeout(() => {
            const form = document.getElementById('memo-form');
            if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        } else if (action === 'delete') {
          const target = memos[idx];
          if (!target) return;
          if (!confirm(`「${target.name}」を削除しますか？`)) return;
          const newList = memos.filter((_, i) => i !== idx);
          if (getPat()) {
            try {
              await saveMemoToGithub(sid, newList);
              toast('削除しました');
              rebuildMemoBadges();
              renderMemoModal();
            } catch (err) {
              toast('削除失敗: ' + err.message);
            }
          } else {
            // PAT未設定時はローカルのみ即時反映（永続化なし）+ コピー案内
            MEMOS[sid] = newList;
            const json = newList.length === 0
              ? `  // "${sid}" を memos.js から削除してください`
              : `  "${sid}": ${JSON.stringify(newList, null, 2).replace(/\n/g, '\n  ')},`;
            navigator.clipboard.writeText(json).catch(() => {});
            toast('一時削除しました。memos.js への反映はクリップボードの内容を参照');
            rebuildMemoBadges();
            renderMemoModal();
          }
        }
      });
    });

    // キャンセル
    const cancelBtn = document.getElementById('cancel-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        memoEditingIndex = null;
        renderMemoModal();
      });
    }

    // ジャンル切替でタグ pill 群を再生成
    const tagsField = document.getElementById('tags-field');
    const tagPills = document.getElementById('tag-pills');
    document.getElementById('genre-pills').addEventListener('change', (ev) => {
      const r = ev.target.closest('input[type=radio]');
      if (!r) return;
      const genre = r.value;
      const tags = GENRE_TAGS[genre] || [];
      if (tags.length === 0) {
        tagsField.setAttribute('hidden', '');
        tagPills.innerHTML = '';
        return;
      }
      tagsField.removeAttribute('hidden');
      tagPills.innerHTML = tags.map(t => `
        <label class="pill-item pill-item--check">
          <input type="checkbox" name="tag" value="${t}">
          <span>${t}</span>
        </label>
      `).join('');
    });

    // URL検索ボタン: 店名 + 駅名でGoogle検索を新タブで開く
    document.getElementById('search-url-btn').addEventListener('click', () => {
      const name = document.getElementById('memo-name').value.trim();
      if (!name) { toast('先に店名を入力してください'); return; }
      const q = encodeURIComponent(`${name} ${station.name}`);
      window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener');
    });

    document.getElementById('memo-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const tags = fd.getAll('tag').map(t => String(t).trim()).filter(Boolean);
      const memoObj = {
        name:  (fd.get('name')  || '').trim(),
        genre: (fd.get('genre') || '').trim(),
        tags:  tags,
        url:   (fd.get('url')   || '').trim(),
        memo:  (fd.get('memo')  || '').trim(),
      };
      if (!memoObj.name) return;
      if (memoObj.tags.length === 0) delete memoObj.tags;

      // 編集モード判定
      const merged = memoEditingIndex !== null
        ? memos.map((m, i) => i === memoEditingIndex ? memoObj : m)
        : [...memos, memoObj];
      const wasEditing = memoEditingIndex !== null;

      const submitBtn = e.target.querySelector('.memo-form__submit');

      if (getPat()) {
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = wasEditing ? '更新中...' : '保存中...';
        try {
          await saveMemoToGithub(sid, merged);
          toast(wasEditing ? '更新完了' : '保存完了（Pagesに1〜2分で反映）');
          memoEditingIndex = null;
          rebuildMemoBadges();
          renderMemoModal();
        } catch (err) {
          toast((wasEditing ? '更新' : '保存') + '失敗: ' + err.message);
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } else {
        // PAT未設定時はローカルのみ即時反映 + クリップボード
        MEMOS[sid] = merged;
        memoEditingIndex = null;
        const json = `  "${sid}": ${JSON.stringify(merged, null, 2).replace(/\n/g, '\n  ')},`;
        navigator.clipboard.writeText(json).then(() => {
          toast(wasEditing ? '一時更新しました。memos.jsへの反映はクリップボードを' : 'JSONをコピー。memos.js に貼り付けてください');
        }).catch(() => {
          prompt('下記をコピーしてください:', json);
        });
        rebuildMemoBadges();
        renderMemoModal();
      }
    });

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    // パン/ズームの pointer 状態が残らないようリセット
    if (window.__resetPanZoom) window.__resetPanZoom();
  }

  function closeMemoModal() {
    document.getElementById('memo-modal').setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (window.__resetPanZoom) window.__resetPanZoom();
  }

  document.getElementById('memo-modal').addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeMemoModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMemoModal();
  });

  // トースト
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.removeAttribute('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.setAttribute('hidden', ''), 3000);
  }

  // エスケープ
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  // ===== 全駅メモビュー =====
  const MEMOS_SORT_KEY = 'route-map.memos-sort';
  const memosFilterState = {
    query: '',
    genre: null,
    sort: localStorage.getItem(MEMOS_SORT_KEY) || 'added',
  };

  function flattenMemos() {
    const arr = [];
    Object.entries(MEMOS).forEach(([sid, list]) => {
      const station = STATIONS[sid];
      if (!station || !Array.isArray(list)) return;
      const lineIds = Array.from(stationLineMap[sid] || []);
      const lines = lineIds.map(lid => LINES.find(l => l.id === lid)).filter(Boolean);
      list.forEach((m, idx) => {
        arr.push({
          sid, idx,
          stationName: station.name,
          lines,
          ...m,
        });
      });
    });
    return arr;
  }

  function buildMemosFilter() {
    const el = document.getElementById('memos-genre-filter');
    if (!el) return;
    const pills = ['すべて', ...GENRE_LIST].map(g => `
      <button type="button" class="memos-pill ${(g === 'すべて' && !memosFilterState.genre) || g === memosFilterState.genre ? 'is-active' : ''}" data-genre="${g === 'すべて' ? '' : g}">
        ${g === 'すべて' ? g : (GENRE_ICONS[g] || '') + ' ' + g}
      </button>
    `).join('');
    el.innerHTML = pills;
  }

  function buildMemosView() {
    const listEl = document.getElementById('memos-list');
    if (!listEl) return;
    const all = flattenMemos();
    const q = memosFilterState.query.trim().toLowerCase();
    const filtered = all.filter(m => {
      if (memosFilterState.genre && m.genre !== memosFilterState.genre) return false;
      if (!q) return true;
      const haystack = [
        m.name, m.genre, m.memo, m.stationName,
        ...(m.tags || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });

    // 並び替え
    const sortKey = memosFilterState.sort;
    const collator = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });
    filtered.sort((a, b) => {
      if (sortKey === 'name')    return collator.compare(a.name, b.name);
      if (sortKey === 'station') return collator.compare(a.stationName, b.stationName);
      if (sortKey === 'genre')   return collator.compare(a.genre || '', b.genre || '');
      if (sortKey === 'added-asc') return 0; // flattenMemos順 = 追加順（古い）
      // 'added' (新しい順)
      return -1; // 配列を逆にしたいので簡易反転（下で reverse 適用）
    });
    if (sortKey === 'added') filtered.reverse();

    if (filtered.length === 0) {
      const empty = all.length === 0
        ? 'まだメモがありません。駅をタップして追加してください。'
        : '条件に一致するメモがありません。';
      listEl.innerHTML = `<p class="memos-empty">${empty}</p>`;
      return;
    }

    listEl.innerHTML = `
      <div class="memos-count">${filtered.length}件 / 全${all.length}件</div>
      <ul class="memos-cards">
        ${filtered.map(m => {
          const genre = m.genre || 'その他';
          const icon = GENRE_ICONS[genre] || '📍';
          const color = GENRE_COLORS[genre] || '#888';
          const lineChips = m.lines.map(l =>
            `<span class="memos-card__line"><span style="background:${l.color}"></span>${l.name}</span>`
          ).join('');
          return `
            <li class="memos-card" data-sid="${m.sid}" data-idx="${m.idx}">
              <div class="memos-card__head">
                <span class="memos-card__icon" style="background:${color}1A;color:${color}">${icon}</span>
                <div class="memos-card__title">
                  <span class="memos-card__name">${escapeHtml(m.name)}</span>
                  <span class="memos-card__station">${escapeHtml(m.stationName)}駅</span>
                </div>
                ${m.genre ? `<span class="memos-card__genre" style="background:${color}1A;color:${color}">${escapeHtml(m.genre)}</span>` : ''}
              </div>
              ${(m.tags && m.tags.length) ? `<div class="memos-card__tags">${m.tags.map(t => `<span class="memos-card__tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
              ${m.memo ? `<p class="memos-card__memo">${escapeHtml(m.memo)}</p>` : ''}
              <div class="memos-card__foot">
                ${m.url ? `<a class="memos-card__url" href="${escapeAttr(m.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation();">URL ↗</a>` : ''}
                <div class="memos-card__lines">${lineChips}</div>
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  function setupMemosView() {
    const searchInput = document.getElementById('memos-search-input');
    const clearBtn = document.getElementById('memos-search-clear');
    const filterEl = document.getElementById('memos-genre-filter');
    const listEl = document.getElementById('memos-list');

    searchInput.addEventListener('input', (e) => {
      memosFilterState.query = e.target.value;
      clearBtn.toggleAttribute('hidden', !e.target.value);
      buildMemosView();
    });
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      memosFilterState.query = '';
      clearBtn.setAttribute('hidden', '');
      buildMemosView();
      searchInput.focus();
    });
    filterEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.memos-pill');
      if (!btn) return;
      const g = btn.dataset.genre || null;
      memosFilterState.genre = g;
      buildMemosFilter();
      buildMemosView();
    });
    const sortSelect = document.getElementById('memos-sort-select');
    sortSelect.value = memosFilterState.sort;
    sortSelect.addEventListener('change', (e) => {
      memosFilterState.sort = e.target.value;
      localStorage.setItem(MEMOS_SORT_KEY, memosFilterState.sort);
      buildMemosView();
    });
    // カードタップで該当駅のメモモーダル開く
    listEl.addEventListener('click', (e) => {
      const card = e.target.closest('.memos-card');
      if (!card) return;
      const sid = card.dataset.sid;
      if (sid) openMemoModal(sid);
    });
  }

  // ===== タブ切り替え =====
  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        document.querySelectorAll('.view').forEach(v => {
          const isActive = v.id === `view-${tab}`;
          v.classList.toggle('is-active', isActive);
          if (isActive) v.removeAttribute('hidden');
          else v.setAttribute('hidden', '');
        });
        // メモタブ開いた時に最新で再構築
        if (tab === 'memos') {
          buildMemosFilter();
          buildMemosView();
        }
      });
    });
  }

  // メモ保存/削除時にメモビューも更新するよう rebuildMemoBadges を拡張
  const _origRebuild = rebuildMemoBadges;
  rebuildMemoBadges = function() {
    _origRebuild();
    if (document.getElementById('view-memos').classList.contains('is-active')) {
      buildMemosView();
    }
  };

  // ===== 初期化 =====
  document.addEventListener('DOMContentLoaded', () => {
    buildFilters();
    buildMap();
    buildList();
    setupPanZoom();
    setupTabs();
    setupMemosView();
    buildMemosFilter();
    buildMemosView();
    updateVisibility();
    checkPatExpiryOnLoad();
  });
})();
