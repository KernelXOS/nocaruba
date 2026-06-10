/**
 * Exportación CSV genérica — funciona con datos mock o reales.
 * Incluye BOM UTF-8 para que Excel abra acentos correctamente.
 */
export function exportCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: { key: string; label: string }[],
) {
  if (!rows.length) return;

  const cols = columns ?? Object.keys(rows[0]).map(k => ({ key: k, label: k }));

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? v.join(' | ') : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = cols.map(c => escape(c.label)).join(';');
  const body = rows
    .map(r => cols.map(c => escape((r as Record<string, unknown>)[c.key])).join(';'))
    .join('\n');

  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
