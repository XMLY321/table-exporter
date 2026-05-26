const SELECTED = new Set();

function scanTables() {
  const tables = document.querySelectorAll('table');
  return Array.from(tables).map((table, i) => {
    const rows = table.rows.length;
    const cols = table.rows[0] ? table.rows[0].cells.length : 0;
    const caption = table.caption ? table.caption.textContent.trim() : '';
    const firstCell = table.rows[0]?.cells[0]?.textContent?.trim().slice(0, 30) || '';
    return { index: i, rows, cols, caption, firstCell, selected: SELECTED.has(i) };
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

function highlightTable(index) {
  const table = document.querySelectorAll('table')[index];
  if (!table) return;
  table.classList.toggle('te-selected');
  if (table.classList.contains('te-selected')) {
    SELECTED.add(index);
  } else {
    SELECTED.delete(index);
  }
}

function attachOverlays() {
  document.querySelectorAll('table').forEach((table, i) => {
    if (table.dataset.teOverlay) return;
    table.dataset.teOverlay = '1';
    table.style.position = table.style.position || 'relative';

    const badge = document.createElement('div');
    badge.className = 'te-overlay';
    badge.textContent = `📊 导出`;
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      highlightTable(i);
      badge.textContent = SELECTED.has(i) ? '✅ 已选' : '📊 导出';
    });

    table.addEventListener('mouseenter', () => table.classList.add('te-hover'));
    table.addEventListener('mouseleave', () => table.classList.remove('te-hover'));

    table.appendChild(badge);
  });
}

function removeAllHighlights() {
  SELECTED.clear();
  document.querySelectorAll('.te-selected').forEach(t => t.classList.remove('te-selected'));
  document.querySelectorAll('.te-overlay').forEach(b => { b.textContent = '📊 导出'; });
}

attachOverlays();

const observer = new MutationObserver(() => attachOverlays());
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'scan') {
    sendResponse(scanTables());
  } else if (msg.type === 'getData') {
    sendResponse(getTableData(msg.indices));
  } else if (msg.type === 'clear') {
    removeAllHighlights();
    sendResponse(true);
  }
});
