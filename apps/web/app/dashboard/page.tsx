/**
 * Dashboard Page - Main brand visibility dashboard
 *
 * This is the primary interface for viewing brand coverage across AI search engines.
 * It displays a heat-map visualization showing how well the brand appears in
 * AI-generated responses for different queries.
 *
 * Features:
 * - Heat-map table with color-coded visibility scores
 * - "Run Live GEO Check" button for on-demand scanning
 * - Server-side rendering with fresh data on each load
 *
 * Data flow:
 * 1. Fetches analyzed rows from /api/report on page load
 * 2. Renders heat-map with color coding (red = low, green = high)
 * 3. Allows triggering new scans via RunScan component
 */

import Heatmap from './Heatmap';
import RunScan from './RunScan';

// Force dynamic rendering to always fetch fresh data
// This ensures the dashboard shows the latest analysis results
export const dynamic = 'force-dynamic';

/**
 * Row - Data structure for heat-map cells
 * Matches the output from /api/report endpoint
 */
type Row = {
  query: string; // Search query
  surface: string; // AI platform
  score: number; // Visibility score (0-100)
  present: boolean; // Brand mentioned
  authority: boolean; // Brand cited as source
};

/**
 * fetchRows - Server-side data fetching for dashboard
 *
 * Fetches analyzed golden samples from the report API.
 * Uses no-store cache to ensure fresh data on every page load.
 * Handles errors gracefully by returning empty array.
 *
 * @returns Array of analyzed rows for heat-map display
 */
async function fetchRows(): Promise<Row[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/report`, {
    cache: 'no-store', // Always fetch fresh data
  }).catch(() => null); // Handle network errors

  // Parse response with fallback to empty array
  return (
    (await res
      ?.json()
      .then((d) => d.rows as Row[])
      .catch(() => [])) ?? [] // Handle JSON parse errors
  );
}

/**
 * Dashboard - Main dashboard component (Server Component)
 *
 * Renders the brand visibility dashboard with:
 * - Title and scan button in header
 * - Heat-map table showing query×surface coverage
 *
 * As a Server Component, it:
 * - Fetches data during SSR for instant display
 * - Avoids hydration issues with server-rendered content
 * - Refreshes data on every page navigation
 *
 * @returns Dashboard page with heat-map and controls
 */
export default async function Dashboard() {
  // Fetch rows server-side for immediate rendering
  const rows = await fetchRows();

  return (
    <main>
      {/* Dashboard header with title and action button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Coverage heat-map</h1>
        {/* RunScan provides the "Run Live GEO Check" button */}
        <RunScan />
      </div>

      {/* Heat-map visualization of brand coverage */}
      <Heatmap rows={rows} />
    </main>
  );
}
