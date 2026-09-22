import { cn } from "@/lib/cn";

/**
 * Tabla genérica.
 * columns: [{ key, header, cell?: (row) => node, align?: "left"|"right", className? }]
 * Sin `cell` muestra `row[key]`.
 */
export function DataTable({ columns, rows, getRowKey = (row) => row.id, className }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs tracking-wider text-slate-500 uppercase">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn("px-4 py-3 font-medium", column.align === "right" && "text-right", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="transition hover:bg-slate-800/30">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-3 text-slate-300", column.align === "right" && "text-right", column.className)}
                >
                  {column.cell ? column.cell(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
