// ==UserScript==
// @name         表格导出助手
// @namespace    https://github.com/XMLY321/table-exporter
// @version      1.0.0
// @description  检测网页表格，一键选中导出为 CSV 文件。纯本地处理，不收集任何数据。
// @author       XMLY321
// @match        *://*/*
// @match        file:///*
// @grant        GM_download
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // ========== 表格检测与高亮 ==========
  const SELECTED = new Set();

  function scanTables() {
    const tables = document.querySelectorAll('table');
    return Array.from(tables).map((table, i) => {
      const rows = table.rows.length;
      const cols = table.rows[0] ? table.rows[0].cells.length : 0;
      const caption = table.caption ? table.caption.textContent.trim() : '';
      const firstCell = table.rows[0]?.cells[0]?.textContent?.trim().slice(0, 30) || '';
      return { index: i, rows, cols, caption, firstCell };
    });
  }

  function getTableData(indices) {
    const tables = document.querySelectorAll('table');
    return indices.map(i => {
      const table = tables[i];
      if (!table) return [];
      return Array.from(table.rows).map(row =>
        Array.from(row.cells).map(cell => cell.textContent.trim())
      );
    });
  }

  function escapeCSV(cell) {
    if (/[",\n\r]/.test(cell)) {
      return '"' + cell.replace(/"/g, '""') + '"';
    }
    return cell;
  }

  function downloadCSV(tables) {
    const BOM = '﻿';
    let csv = BOM;
    tables.forEach((data, ti) => {
      if (ti > 0) csv += '\n\n';
      data.forEach(row => {
        csv += row.map(escapeCSV).join(',') + '\n';
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = (document.title || 'export').replace(/[\\/:*?"<>|]/g, '_');
    const filename = safeName + '_' + Date.now() + '.csv';

    if (typeof GM_download === 'function') {
      GM_download({ url, name: filename, saveAs: false });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    }

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ========== 表格高亮标签 ==========
  function attachOverlays() {
    document.querySelectorAll('table').forEach((table, i) => {
      if (table.dataset.tusOverlay) return;
      table.dataset.tusOverlay = '1';
      const cs = getComputedStyle(table);
      if (!cs.position || cs.position === 'static') {
        table.style.position = 'relative';
      }

      const badge = document.createElement('div');
      badge.style.cssText = `
        position:absolute;top:0;left:0;background:#4f46e5;color:#fff;
        font-size:11px;font-family:system-ui,sans-serif;padding:2px 8px;
        border-radius:0 0 6px 0;z-index:2147483646;cursor:pointer;
        user-select:none;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);
        transition:background .15s;line-height:1.5;
      `;
      badge.textContent = '导出';
      badge.addEventListener('mouseenter', () => { badge.style.background = '#6366f1'; });
      badge.addEventListener('mouseleave', () => { badge.style.background = '#4f46e5'; });
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (SELECTED.has(i)) {
          SELECTED.delete(i);
          table.style.outline = '';
          table.style.background = '';
          badge.textContent = '导出';
        } else {
          SELECTED.add(i);
          table.style.outline = '3px solid #22c55e';
          table.style.outlineOffset = '2px';
          badge.textContent = '已选';
        }
        updatePanel();
      });

      table.addEventListener('mouseenter', () => {
        if (!SELECTED.has(i)) {
          table.style.outline = '3px solid #818cf8';
          table.style.outlineOffset = '2px';
        }
      });
      table.addEventListener('mouseleave', () => {
        if (!SELECTED.has(i)) {
          table.style.outline = '';
        }
      });

      table.appendChild(badge);
    });
  }

  // ========== 浮动面板 UI ==========
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #tus-btn {
        all:initial; position:fixed; bottom:24px; right:24px; z-index:2147483647;
        width:48px; height:48px; border-radius:50%; background:#4f46e5; color:#fff;
        font-size:20px; cursor:pointer; box-shadow:0 4px 16px rgba(79,70,229,.4);
        display:flex; align-items:center; justify-content:center; border:none;
        transition:transform .2s,background .2s; font-family:system-ui,sans-serif;
      }
      #tus-btn:hover { background:#4338ca; transform:scale(1.08); }
      #tus-btn .tus-count {
        position:absolute; top:-4px; right:-4px; background:#ef4444; color:#fff;
        font-size:11px; min-width:18px; height:18px; border-radius:9px;
        display:flex; align-items:center; justify-content:center;
      }
      #tus-drawer {
        all:initial; position:fixed; bottom:84px; right:24px; z-index:2147483647;
        width:340px; max-height:480px; background:#fff; border-radius:12px;
        box-shadow:0 8px 32px rgba(0,0,0,.18); display:none; flex-direction:column;
        font-family:system-ui,-apple-system,sans-serif; font-size:13px; color:#1e293b;
        overflow:hidden;
      }
      #tus-drawer.tus-open { display:flex; }
      #tus-drawer .tus-header {
        background:#4f46e5; color:#fff; padding:14px 16px; font-weight:600;
        font-size:14px; display:flex; justify-content:space-between; align-items:center;
      }
      #tus-drawer .tus-header button {
        background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.3);
        color:#fff; border-radius:4px; padding:4px 10px; font-size:12px; cursor:pointer;
      }
      #tus-drawer .tus-header button:hover { background:rgba(255,255,255,.25); }
      #tus-drawer .tus-empty { padding:32px; text-align:center; color:#94a3b8; }
      #tus-drawer .tus-list { flex:1; overflow-y:auto; max-height:340px; }
      #tus-drawer .tus-item {
        display:flex; align-items:center; gap:10px; padding:10px 16px;
        border-bottom:1px solid #e2e8f0; cursor:pointer;
      }
      #tus-drawer .tus-item:hover { background:#f8fafc; }
      #tus-drawer .tus-item input { width:16px; height:16px; accent-color:#4f46e5; flex-shrink:0; }
      #tus-drawer .tus-item .tus-info { flex:1; min-width:0; }
      #tus-drawer .tus-item .tus-cap {
        font-weight:600; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      #tus-drawer .tus-item .tus-meta { font-size:11px; color:#64748b; margin-top:2px; }
      #tus-drawer .tus-footer {
        padding:12px 16px; border-top:1px solid #e2e8f0; display:flex; gap:8px;
      }
      #tus-drawer .tus-export-btn {
        flex:1; padding:10px; background:#4f46e5; color:#fff; border:none;
        border-radius:6px; font-size:13px; font-weight:600; cursor:pointer;
      }
      #tus-drawer .tus-export-btn:hover { background:#4338ca; }
      #tus-drawer .tus-export-btn:disabled { background:#94a3b8; cursor:not-allowed; }
      #tus-drawer .tus-clear-btn {
        padding:10px 14px; background:#fff; border:1px solid #e2e8f0;
        border-radius:6px; font-size:12px; cursor:pointer; color:#64748b;
      }
      #tus-drawer .tus-clear-btn:hover { background:#f1f5f9; }
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    const btn = document.createElement('button');
    btn.id = 'tus-btn';
    btn.innerHTML = '📊<span class="tus-count" id="tus-count" hidden></span>';

    const drawer = document.createElement('div');
    drawer.id = 'tus-drawer';
    drawer.innerHTML = `
      <div class="tus-header">
        <span>表格导出助手</span>
        <button id="tus-refresh">刷新</button>
      </div>
      <div class="tus-empty" id="tus-empty">当前页面没有检测到表格</div>
      <div class="tus-list" id="tus-list"></div>
      <div class="tus-footer" id="tus-footer" style="display:none">
        <button class="tus-export-btn" id="tus-export">导出 CSV</button>
        <button class="tus-clear-btn" id="tus-clear">清除</button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(drawer);

    btn.addEventListener('click', () => {
      drawer.classList.toggle('tus-open');
      if (drawer.classList.contains('tus-open')) updatePanel();
    });

    document.addEventListener('click', (e) => {
      if (e.target !== btn && !btn.contains(e.target) && !drawer.contains(e.target)) {
        drawer.classList.remove('tus-open');
      }
    });

    document.getElementById('tus-refresh').addEventListener('click', updatePanel);

    document.getElementById('tus-export').addEventListener('click', () => {
      const indices = Array.from(SELECTED);
      if (!indices.length) {
        alert('请先勾选要导出的表格');
        return;
      }
      const tables = getTableData(indices);
      downloadCSV(tables);
      drawer.classList.remove('tus-open');
    });

    document.getElementById('tus-clear').addEventListener('click', () => {
      SELECTED.clear();
      document.querySelectorAll('table').forEach(t => {
        t.style.outline = '';
        t.style.background = '';
        t.dataset.tusOverlay = '';
        const badges = t.querySelectorAll('div');
        badges.forEach(b => {
          if (b.textContent === '已选' || b.textContent === '导出') b.textContent = '导出';
        });
      });
      updatePanel();
    });

    return { btn, drawer, countBadge: document.getElementById('tus-count') };
  }

  let panelCtx = null;

  function updatePanel() {
    if (!panelCtx) return;
    const tables = scanTables();
    const list = document.getElementById('tus-list');
    const empty = document.getElementById('tus-empty');
    const footer = document.getElementById('tus-footer');
    const countBadge = document.getElementById('tus-count');

    // Update count badge
    if (tables.length > 0) {
      countBadge.hidden = false;
      countBadge.textContent = tables.length;
    } else {
      countBadge.hidden = true;
    }

    if (!tables.length) {
      list.innerHTML = '';
      empty.style.display = 'block';
      footer.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    footer.style.display = 'flex';

    list.innerHTML = tables.map((t, i) => `
      <label class="tus-item">
        <input type="checkbox" data-idx="${i}" ${SELECTED.has(i) ? 'checked' : ''}>
        <div class="tus-info">
          <div class="tus-cap">${t.caption || '表格 #' + (i + 1)}</div>
          <div class="tus-meta">${t.rows} 行 x ${t.cols} 列 · ${t.firstCell || '—'}</div>
        </div>
      </label>
    `).join('');

    list.querySelectorAll('input').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = parseInt(cb.dataset.idx);
        const table = document.querySelectorAll('table')[idx];
        if (!table) return;
        if (cb.checked) {
          SELECTED.add(idx);
          table.style.outline = '3px solid #22c55e';
          table.style.outlineOffset = '2px';
        } else {
          SELECTED.delete(idx);
          table.style.outline = '';
        }
        // Update badge text
        const badges = table.querySelectorAll('div');
        badges.forEach(b => {
          if (b.textContent === '已选' || b.textContent === '导出') {
            b.textContent = cb.checked ? '已选' : '导出';
          }
        });
      });
    });
  }

  // ========== 初始化 ==========
  injectStyles();
  attachOverlays();
  panelCtx = createPanel();
  updatePanel();

  let updating = false;
  const observer = new MutationObserver((mutations) => {
    const ours = mutations.some(m => {
      return Array.from(m.addedNodes).some(n =>
        n.id === 'tus-btn' || n.id === 'tus-drawer' ||
        (n.dataset && n.dataset.tusOverlay)
      );
    });
    if (ours || updating) return;
    attachOverlays();
    updatePanel();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
