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

import DashboardClient from './DashboardClient';

// Force dynamic rendering to always fetch fresh data
// This ensures the dashboard shows the latest analysis results
export const dynamic = 'force-dynamic';

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
  // Use client component to handle project-specific data fetching
  // This allows access to localStorage for project ID
  return <DashboardClient />;
}
