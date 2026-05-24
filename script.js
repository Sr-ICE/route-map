/* ============================================
   My路線図 - 制御スクリプト
   ============================================ */

(function() {
  'use strict';

  // ===== 状態 =====
  const state = {
    visibleLines: new Set(LINES.map(l => l.id)),  // 初期は全表示
    transform: { x: 0, y: 0, scale: 1 },
    viewBoxW: 1800,
    viewBoxH: 1500,
  };

  // ===== 乗り換え駅の判定 =====
  // 各駅がいくつの路線に属するかを集計
  const stationLineMap = {};
  LINES.forEach(line => {
    line.stations.forEach(sid => {
      if (!stationLineMap[sid]) stationLineMap[sid] = new Set();
      stationLineMap[sid].add(line.id);
    });
  });

  // ===== 路線フィルタの構築 =====
  function buildFilters() {
    const groupsEl = document.getElementById('filter-groups');
    const companies = {};
    LINES.forEach(line => {
      if (!companies[line.company]) companies[line.company] = [];
      companies[line.company].push(line);
    });

    const order = ['東急', '相鉄', '東京メトロ', '都営', '東武', '西武', 'JR', '相鉄/JR'];
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
        const label = document.createElement('label');
        label.className = 'filter-item';
        label.innerHTML = `
          <input type="checkbox" data-line="${line.id}" checked>
          <span class="filter-item__dot" style="background:${line.color}"></span>
          <span>${line.name}</span>
        `;
        items.appendChild(label);
      });

      group.appendChild(items);
      groupsEl.appendChild(group);
    });

    // チェックボックスのイベント
    groupsEl.addEventListener('change', (e) => {
      const cb = e.target.closest('input[type=checkbox]');
      if (!cb) return;
      const lineId = cb.dataset.line;
      if (cb.checked) state.visibleLines.add(lineId);
      else state.visibleLines.delete(lineId);
      updateVisibility();
      updateFilterCount();
    });

    updateFilterCount();
  }

  function updateFilterCount() {
    const el = document.getElementById('filter-count');
    el.textContent = `(${state.visibleLines.size} / ${LINES.length} 表示)`;
  }

  // フィルタ開閉
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

  // 一括操作
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

    // 駅レイヤー（駅の丸）
    const stationsLayer = document.createElementNS(NS, 'g');
    stationsLayer.setAttribute('id', 'stations-layer');

    Object.entries(STATIONS).forEach(([sid, station]) => {
      const lines = Array.from(stationLineMap[sid] || []);
      if (lines.length === 0) return;

      const isTransfer = lines.length >= 2;
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', station.x);
      circle.setAttribute('cy', station.y);
      circle.setAttribute('r', isTransfer ? 5 : 3.5);
      circle.setAttribute('class', 'station-circle' + (isTransfer ? ' is-transfer' : ''));
      circle.setAttribute('data-station', sid);
      circle.setAttribute('data-lines', lines.join(','));
      stationsLayer.appendChild(circle);
    });
    svg.appendChild(stationsLayer);

    // ラベルレイヤー
    const labelsLayer = document.createElementNS(NS, 'g');
    labelsLayer.setAttribute('id', 'labels-layer');

    Object.entries(STATIONS).forEach(([sid, station]) => {
      const lines = Array.from(stationLineMap[sid] || []);
      if (lines.length === 0) return;

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', station.x + 6);
      text.setAttribute('y', station.y + 3);
      text.setAttribute('class', 'station-label');
      text.setAttribute('data-station', sid);
      text.setAttribute('data-lines', lines.join(','));
      text.textContent = station.name;
      labelsLayer.appendChild(text);
    });
    svg.appendChild(labelsLayer);
  }

  // ===== 表示/非表示の更新 =====
  function updateVisibility() {
    // 路線
    document.querySelectorAll('[data-line]').forEach(el => {
      const lineId = el.dataset.line;
      if (state.visibleLines.has(lineId)) {
        el.classList.remove('line-hidden');
      } else {
        el.classList.add('line-hidden');
      }
    });

    // 駅・ラベル: 関係する路線が1つでも表示なら表示
    document.querySelectorAll('[data-lines]').forEach(el => {
      const lines = el.dataset.lines.split(',');
      const anyVisible = lines.some(l => state.visibleLines.has(l));
      if (anyVisible) el.classList.remove('line-hidden');
      else el.classList.add('line-hidden');
    });

    // リストビューも同期
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

    function applyTransform() {
      svg.style.transform = `translate(${state.transform.x}px, ${state.transform.y}px) scale(${state.transform.scale})`;
    }

    function setScale(newScale, cx, cy) {
      const oldScale = state.transform.scale;
      newScale = Math.max(0.5, Math.min(5, newScale));
      // 中心点を保ったままズーム
      const rect = viewport.getBoundingClientRect();
      const px = cx - rect.left;
      const py = cy - rect.top;
      state.transform.x = px - (px - state.transform.x) * (newScale / oldScale);
      state.transform.y = py - (py - state.transform.y) * (newScale / oldScale);
      state.transform.scale = newScale;
      applyTransform();
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
        state.transform.x += dx;
        state.transform.y += dy;
        lastX = e.clientX;
        lastY = e.clientY;
        applyTransform();
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        if (lastPinchDist > 0) {
          const ratio = dist / lastPinchDist;
          setScale(state.transform.scale * ratio, cx, cy);
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

    // ホイールズーム
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setScale(state.transform.scale * (1 + delta), e.clientX, e.clientY);
    }, { passive: false });

    // ボタン操作
    document.getElementById('zoom-in').addEventListener('click', () => {
      const rect = viewport.getBoundingClientRect();
      setScale(state.transform.scale * 1.25, rect.left + rect.width/2, rect.top + rect.height/2);
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      const rect = viewport.getBoundingClientRect();
      setScale(state.transform.scale / 1.25, rect.left + rect.width/2, rect.top + rect.height/2);
    });
    document.getElementById('zoom-reset').addEventListener('click', () => {
      state.transform = { x: 0, y: 0, scale: 1 };
      applyTransform();
    });

    applyTransform();
  }

  // ===== リストビュー構築 =====
  function buildList() {
    const container = document.getElementById('list-container');
    container.innerHTML = '';

    LINES.forEach(line => {
      const wrap = document.createElement('div');
      wrap.className = 'list-line';
      wrap.dataset.line = line.id;

      const header = document.createElement('div');
      header.className = 'list-line__header';
      header.innerHTML = `
        <span class="list-line__color" style="background:${line.color}"></span>
        <span class="list-line__name">${line.name}</span>
        <span class="list-line__company">${line.company}</span>
        <span class="list-line__chevron">▼</span>
      `;
      header.addEventListener('click', () => wrap.classList.toggle('is-open'));

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

        const dots = transfers.map(t =>
          `<span class="list-station__transfer-dot" style="background:${t.color}" title="${t.name}"></span>`
        ).join('');

        li.innerHTML = `
          <span class="list-station__name">${s.name}</span>
          <span class="list-station__transfers">${dots}</span>
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
