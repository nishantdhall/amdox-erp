'use client'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  title?: string
  action?: React.ReactNode
  emptyMessage?: string
}

export function DataTable({ columns, data, title, action, emptyMessage = 'No data available' }: DataTableProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e0e5ef] overflow-hidden shadow-sm">
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f2f7]">
          {title && <h3 className="text-[13px] font-bold text-[#1a1d2e]">{title}</h3>}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        {data.length === 0 ? (
          <div className="px-5 py-12 text-center text-[#8898aa] text-sm">{emptyMessage}</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f2f7]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-5 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-[#8898aa] bg-[#f7f8fb]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-[#f7f8fb] table-row-hover">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3 text-[12px] text-[#444]">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
