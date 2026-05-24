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
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', station.x);
      circle.setAttribute('cy', station.y);
      circle.setAttribute('r', isTransfer ? 5.5 : 3.5);
      circle.setAttribute('class', 'station-circle' + (isTransfer ? ' is-transfer' : ''));
      circle.setAttribute('data-station', sid);
      circle.setAttribute('data-lines', lines.join(','));
      // 単独駅は所属路線色を線色に
      if (!isTransfer) {
        const lineColor = LINES.find(l => l.id === lines[0])?.color || '#333';
        circle.setAttribute('stroke', lineColor);
      } else {
        circle.setAttribute('stroke', '#1d1d1f');
      }
      stationsLayer.appendChild(circle);
    });
    svg.appendChild(stationsLayer);

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
    // (線は CSS の vector-effect で対応済み)
    function updateNonScalingElements() {
      const rect = viewport.getBoundingClientRect();
      if (rect.width === 0) return;
      // 画面1ピクセルあたりのviewBox単位数
      const pxPerUnit = state.viewBox.w / rect.width;
      // 各要素を「実ピクセル基準」のサイズに変換
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
      // 線も viewBox 単位で stroke を一定 px に
      document.querySelectorAll('.line-path').forEach(el => {
        el.setAttribute('stroke-width', 7 * pxPerUnit);
      });
    }

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
      const padFactor = 1.15;

      // コンテンツ全体が画面に収まる範囲でフィット（aspect不一致は余白）
      let vbW, vbH;
      if (contentR > screenR) {
        vbW = contentW * padFactor;
        vbH = vbW / screenR;
      } else {
        vbH = contentH * padFactor;
        vbW = vbH * screenR;
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

        const transfers = Array.from(stationLineMap[sid] || [])
          .filter(lid => lid !== line.id)
          .map(lid => LINES.find(l => l.id === lid))
          .filter(Boolean);

        if (transfers.length > 0) li.classList.add('is-transfer');

        const chips = transfers.map(t => `
          <span class="list-station__transfer-chip">
            <span class="list-station__transfer-chip__dot" style="background:${t.color}"></span>
            ${t.name}
          </span>
        `).join('');

        li.innerHTML = `
          <span class="list-station__name">${s.name}</span>
          <span class="list-station__transfers">${chips}</span>
        `;
        ul.appendChild(li);
      });

      wrap.appendChild(header);
      wrap.appendChild(ul);
      container.appendChild(wrap);
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
      });
    });
  }

  // ===== 初期化 =====
  document.addEventListener('DOMContentLoaded', () => {
    buildFilters();
    buildMap();
    buildList();
    setupPanZoom();
    setupTabs();
    updateVisibility();
  });
})();
