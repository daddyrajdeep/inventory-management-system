import { ArrowDown, ArrowUp } from 'lucide-react';
import { SkeletonRows } from './Skeleton';

// columns: [{ key, label, align, render, mono, num, sortable }]
// Backward compatible with the old { columns, rows, loading, emptyText } shape.
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  empty,
  emptyText = 'No data found',
  onRowClick,
  rowKey = 'id',
  sort,
  onSort,
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <SkeletonRows rows={6} cols={Math.min(columns.length, 5)} />
      </div>
    );
  }

  const alignClass = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className="min-w-full text-[13px]">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-line">
            {columns.map((col) => {
              const active = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={`px-4 py-2.5 text-xs font-semibold text-ink-soft ${alignClass(col.align)}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-ink ${col.align === 'right' ? 'flex-row-reverse' : ''}`}
                    >
                      {col.label}
                      {active && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty || <p className="px-4 py-10 text-center text-sm text-ink-soft">{emptyText}</p>}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-line last:border-0 transition-colors duration-[120ms] hover:bg-paper ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 align-middle text-ink ${alignClass(col.align)} ${col.num ? 'num' : ''} ${
                      col.mono ? 'mono text-[12.5px]' : ''
                    }`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
