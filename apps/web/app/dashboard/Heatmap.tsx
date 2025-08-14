'use client';

import { useMemo } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

type Row = { query: string; surface: string; score: number; present: boolean; authority: boolean };

type PivotRow = {
  query: string;
  [key: string]: string | number | boolean | null;
};

interface CellInfo {
  getValue: () => unknown;
  row: { original: PivotRow };
}

function colorForScore(score: number, present: boolean) {
  if (!present) return 'bg-slate-800 text-slate-400';
  // 0 -> red(0deg), 100 -> green(120deg)
  const hue = Math.round((score / 100) * 120);
  return `text-black` + ` ` + `bg-[hsl(${hue},90%,60%)]`;
}

export default function Heatmap({ rows }: { rows: Row[] }) {
  const surfaces = Array.from(new Set(rows.map((r) => r.surface))).sort();
  const queries = Array.from(new Set(rows.map((r) => r.query)));

  // Pivot rows: one row per query; columns per surface
  const pivot: PivotRow[] = queries.map((q) => {
    const record: PivotRow = { query: q };
    surfaces.forEach((s) => {
      const r = rows.find((rr) => rr.query === q && rr.surface === s);
      record[s] = r ? r.score : null;
      record[`${s}:present`] = r?.present ?? false;
    });
    return record;
  });

  const columns = useMemo<ColumnDef<PivotRow>[]>(
    () => [
      {
        header: 'Query',
        accessorKey: 'query',
        cell: (info: CellInfo) => <span className="text-sm">{info.getValue() as string}</span>,
      },
      ...surfaces.map((s) => ({
        header: s.replace('_', ' '),
        accessorKey: s,
        cell: (info: CellInfo) => {
          const v = info.getValue() as number | null;
          const present = info.row.original[`${s}:present`] as boolean;
          return (
            <div
              className={
                'text-center rounded px-2 py-1 ' +
                (v == null ? 'bg-slate-900' : colorForScore(v, present))
              }
            >
              {v == null ? '-' : v}
            </div>
          );
        },
      })),
    ],
    [surfaces]
  );

  const table = useReactTable({ data: pivot, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto border border-slate-800 rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900 sticky top-0">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="text-left p-2 font-medium">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="odd:bg-slate-950 even:bg-slate-925">
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="p-1">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
