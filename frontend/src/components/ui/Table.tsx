import type { ReactNode } from "react";

type TableProps = {
  headers: string[];
  children: ReactNode;
};

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-ui border border-surface-600">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-surface-700 text-text-secondary">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-600 bg-surface-800 text-text-primary">{children}</tbody>
      </table>
    </div>
  );
}
