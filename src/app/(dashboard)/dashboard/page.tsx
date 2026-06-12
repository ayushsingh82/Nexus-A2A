import LiveDashboard from "@/components/LiveDashboard";
import type { DashboardSnapshot } from "@/components/LiveDashboard";
import {
  getKpis,
  getPortfolio,
  listAgents,
  listDelegations,
  listExecutions,
  listOpportunities,
} from "@/agents/store";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const initial: DashboardSnapshot = {
    kpis: getKpis(),
    portfolio: getPortfolio(),
    agents: listAgents(),
    delegations: listDelegations(),
    opportunities: listOpportunities(),
    executions: listExecutions(10),
  };

  return <LiveDashboard initial={initial} />;
}
