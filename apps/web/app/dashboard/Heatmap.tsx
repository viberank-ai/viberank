/**
 * Heatmap Component - Visualizes brand coverage across AI platforms
 *
 * This client component renders a pivot table showing visibility scores
 * in a query×surface matrix. Each cell is color-coded from red (low score)
 * to green (high score) to provide instant visual feedback.
 *
 * Features:
 * - Pivots flat data into matrix format
 * - Color gradient based on scores (HSL interpolation)
 * - Special styling for missing/not-present data
 * - Uses TanStack Table for efficient rendering
 *
 * Color coding:
 * - Gray: No data or brand not mentioned
 * - Red (0°): Score near 0 (poor visibility)
 * - Yellow (60°): Score around 50 (moderate visibility)
 * - Green (120°): Score near 100 (excellent visibility)
 */

'use client';

import { useMemo, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import SnapshotModal from './SnapshotModal';

/** Row - Analysis result from API (matches dashboard/page.tsx) */
type Row = {
  query: string; // Search query
  surface: string; // AI platform
  score: number; // Visibility score (0-100)
  present: boolean; // Brand mentioned
  authority: boolean; // Brand cited
};

/** PivotRow - Transformed data structure for table display
 * One row per query with surface scores as columns */
type PivotRow = {
  query: string;
  [key: string]: string | number | boolean | null; // Dynamic keys for each surface
};

/** CellInfo - TanStack Table cell rendering context */
interface CellInfo {
  getValue: () => unknown; // Get cell value
  row: { original: PivotRow }; // Access full row data
}

/**
 * colorForScore - Generates CSS classes for score-based coloring
 *
 * Uses HSL color space for smooth gradient:
 * - Hue: 0° (red) to 120° (green) based on score
 * - Saturation: 90% for vibrant colors
 * - Lightness: 60% for good contrast with black text
 *
 * @param score - Visibility score (0-100)
 * @param present - Whether brand was mentioned
 * @returns Tailwind CSS classes for cell styling
 */
function colorForScore(score: number, present: boolean) {
  // Gray background if brand not mentioned at all
  if (!present) return 'bg-slate-800 text-slate-400';

  // Linear interpolation: 0 score = red (0°), 100 score = green (120°)
  const hue = Math.round((score / 100) * 120);

  // Use HSL with dynamic hue for smooth gradient and white text for contrast
  // bg-[hsl(...)] is Tailwind's arbitrary value syntax
  return `text-white font-semibold` + ` ` + `bg-[hsl(${hue},90%,50%)]`;
}

/**
 * Heatmap - Main heat-map component
 *
 * Transforms flat row data into a pivot table for visualization.
 * Each query becomes a row, each surface becomes a column.
 *
 * @param rows - Flat array of analysis results from API
 * @returns Rendered heat-map table
 */
export default function Heatmap({ rows }: { rows: Row[] }) {
  // Debug: Check if we have data
  console.log('Heatmap received rows:', rows);

  const [sel, setSel] = useState<{ q: string; s: string } | null>(null);

  // Handle empty data case
  if (!rows || rows.length === 0) {
    return (
      <div className="p-8 text-center border border-slate-800 rounded">
        <p className="text-slate-400">No data available. Run a scan to populate the heatmap.</p>
      </div>
    );
  }

  // Extract unique surfaces and queries for table structure
  const surfaces = Array.from(new Set(rows.map((r) => r.surface))).sort();
  const queries = Array.from(new Set(rows.map((r) => r.query)));

  console.log('Surfaces:', surfaces);
  console.log('Queries:', queries);

  // Transform flat data into pivot table structure
  // Creates one row per query with surface scores as dynamic columns
  const pivot: PivotRow[] = queries.map((q) => {
    const record: PivotRow = { query: q };

    // Add score and presence data for each surface
    surfaces.forEach((s) => {
      const r = rows.find((rr) => rr.query === q && rr.surface === s);
      record[s] = r ? r.score : null; // Score value for cell
      record[`${s}:present`] = r?.present ?? false; // Presence flag for coloring
    });

    return record;
  });

  // Define table columns with TanStack Table
  const columns = useMemo<ColumnDef<PivotRow>[]>(
    () => [
      // Query column (row headers)
      {
        header: 'Query',
        accessorKey: 'query',
        cell: (info: CellInfo) => <span className="text-sm">{info.getValue() as string}</span>,
      },
      // Dynamic columns for each surface
      ...surfaces.map((s) => ({
        header: s.replace('_', ' '), // Humanize surface names
        accessorKey: s,
        cell: (info: CellInfo) => {
          const v = info.getValue() as number | null; // Score value
          const present = info.row.original[`${s}:present`] as boolean; // Presence flag
          const q = info.row.original.query as string;
          const cls =
            'text-center rounded px-2 py-1 cursor-pointer ' +
            (v == null ? 'bg-slate-900' : colorForScore(v, present));

          return (
            <div className={cls} onClick={() => v != null && setSel({ q, s })}>
              {v == null ? '-' : v} {/* Show dash for missing data */}
            </div>
          );
        },
      })),
    ],
    [surfaces]
  );

  const table = useReactTable({ data: pivot, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="relative">
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
              <tr key={r.id} className="border-b border-slate-800">
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
      {sel && <SnapshotModal query={sel.q} surface={sel.s} onClose={() => setSel(null)} />}
    </div>
  );
}
