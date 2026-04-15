import { cn } from '../../utils/cn';

export function DataTable({
  columns,
  rows,
  getRowKey = (row) => row.id,
  className = '',
  tableClassName = '',
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table
        className={cn(
          'min-w-full border-collapse text-left text-sm',
          tableClassName
        )}
      >
        <thead>
          <tr className="border-b border-slate-200/95 bg-slate-100/95">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-4 py-3.5 font-semibold text-slate-800 sm:px-6',
                  col.headerClassName
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="bg-white transition-colors hover:bg-slate-50/80"
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn('px-4 py-3.5 sm:px-6', col.cellClassName)}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
