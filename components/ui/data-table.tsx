type DataTableProps = {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr className="hover:bg-muted/60" key={row.join("-")}>
                {row.map((cell) => (
                  <td className="px-4 py-3 align-top" key={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
