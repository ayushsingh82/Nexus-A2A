import LiveDashboard from "@/components/LiveDashboard";
import type { DashboardSnapshot } from "@/components/LiveDashboard";
import {
  getKpis,
  getTreasury,
  listEdges,
  listExecutions,
  listOpportunities,
  listVenues,
} from "@/graph/store";

export const dynamic = "force-dynamic";

/**
 * Server component: read the in-memory store once for a fast first paint, then
 * hand the snapshot to the client `LiveDashboard`, which keeps everything live
 * via polling + autopilot scanning.
 */
export default function DashboardPage() {
  const initial: DashboardSnapshot = {
    kpis: getKpis(),
    treasury: getTreasury(),
    venues: listVenues(),
    edges: listEdges(),
    opportunities: listOpportunities(6),
    executions: listExecutions(10),
  };

  return <LiveDashboard initial={initial} />;
}
