async function sendToTab(msg) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return chrome.tabs.sendMessage(tab.id, msg);
}

function escapeCSV(cell) {
  if (/[",\n\r]/.test(cell)) {
    return '"' + cell.replace(/"/g, '""') + '"';
  }
  return cell;
}

function downloadCSV(tables, tabTitle) {
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
  const safeName = (tabTitle || 'export').replace(/[\\/:*?"<>|]/g, '_');
  chrome.downloads.download({
    url,
    filename: `${safeName}_${Date.now()}.csv`,
    saveAs: false
  });
}

function renderList(tables) {
  const list = document.getElementById('tableList');
  const empty = document.getElementById('empty');
  const actions = document.getElementById('actions');

  if (!tables.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    actions.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  actions.style.display = 'flex';

  list.innerHTML = tables.map((t, i) => `
    <label class="table-item">
      <input type="checkbox" data-index="${i}" ${t.selected ? 'checked' : ''}>
      <div class="info">
        <div class="caption">${t.caption || '表格 #' + (i + 1)}</div>
        <div class="meta">${t.rows} 行 × ${t.cols} 列 · ${t.firstCell || '—'}</div>
      </div>
    </label>
  `).join('');

  list.querySelectorAll('input').forEach(cb => {
    cb.addEventListener('change', (e) => {
      sendToTab({ type: 'getData', indices: [parseInt(e.target.dataset.index)] })
        .catch(() => {});
    });
  });
}

async function refresh() {
  try {
    const tables = await sendToTab({ type: 'scan' });
    renderList(tables);
  } catch {
    document.getElementById('empty').textContent = '请刷新页面后重试';
    document.getElementById('empty').style.display = 'block';
  }
}

document.getElementById('refreshBtn').addEventListener('click', refresh);

document.getElementById('exportBtn').addEventListener('click', async () => {
  const checked = document.querySelectorAll('#tableList input:checked');
  const indices = Array.from(checked).map(c => parseInt(c.dataset.index));

  if (!indices.length) {
    alert('请先勾选要导出的表格');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tables = await sendToTab({ type: 'getData', indices });
    downloadCSV(tables, tab.title);
  } catch {
    alert('导出失败，请刷新页面后重试');
  }
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  await sendToTab({ type: 'clear' });
  refresh();
});

refresh();
