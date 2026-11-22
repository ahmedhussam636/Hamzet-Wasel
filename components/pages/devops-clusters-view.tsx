"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BlockReady,
  BlockStateProvider,
  BlockStateRows,
  getBlockState,
} from "@/components/dashboardblocks/block-state";
import {
  ChartHatch,
  ChartPlaceholder,
  ChartTooltipContent,
  chartAxisProps,
  chartBarCursor,
  chartGridProps,
  chartValueAxisWidth,
  useChartId,
} from "@/components/dashboardblocks/chart";
import {
  ChartPanelFigure,
  ChartPanelLegend,
  ChartPanelTable,
} from "@/components/dashboardblocks/chart-panel";
import type { CommandMenuGroup } from "@/components/dashboardblocks/command-menu";
import { CommandMenu2 } from "@/components/dashboardblocks/command-menu/command-menu-02";
import { ExportMenu } from "@/components/dashboardblocks/dashboard-header";
import { Details } from "@/components/dashboardblocks/details";
import {
  AreaChartKPI2,
  type AreaChartKPI2Props,
} from "@/components/dashboardblocks/kpi/area-chart-kpi-02";
import {
  LineChartKPI1,
  type LineChartKPI1Props,
} from "@/components/dashboardblocks/kpi/line-chart-kpi-01";
import { KPIValue } from "@/components/dashboardblocks/kpi";
import {
  Leaderboard,
  LeaderboardBar,
  LeaderboardItem,
  LeaderboardLabel,
  LeaderboardRank,
  LeaderboardValue,
} from "@/components/dashboardblocks/leaderboard";
import { StatusLabel, type StatusTone } from "@/components/dashboardblocks/status-label";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableStateRows,
} from "@/components/dashboardblocks/table";
import {
  BlockBusyIndicator,
  ChartRefreshButton,
  DashboardBusy,
  useChartRefresh,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsvReport, downloadPdfComplianceReport } from "@/lib/compliance-export";
import { formatCompact, formatNumber, formatPercent } from "@/lib/dashboardblocks/format";
import {
  CheckCircle2Icon,
  CpuIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  RotateCwIcon,
  ServerIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type NodeHealth = "Healthy" | "High Load" | "Draining";
type RegionFilter = "All" | "eu-west-2" | "me-central-1" | "us-east-1";

interface ClusterNode {
  id: string;
  name: string;
  shortName: string;
  region: "eu-west-2" | "me-central-1" | "us-east-1";
  role: "compute" | "database" | "edge";
  instanceType: string;
  kubeletVersion: string;
  cpuPct: number;
  memPct: number;
  pods: number;
  maxPods: number;
  uptime: string;
  status: NodeHealth;
}

const INITIAL_NODES: ClusterNode[] = [
  {
    id: "node-01",
    name: "eu-west-prod-a1",
    shortName: "eu-a1",
    region: "eu-west-2",
    role: "compute",
    instanceType: "c7g.2xlarge",
    kubeletVersion: "v1.31.2",
    cpuPct: 48,
    memPct: 62,
    pods: 28,
    maxPods: 40,
    uptime: "44d 11h",
    status: "Healthy",
  },
  {
    id: "node-02",
    name: "eu-west-prod-a2",
    shortName: "eu-a2",
    region: "eu-west-2",
    role: "compute",
    instanceType: "c7g.2xlarge",
    kubeletVersion: "v1.31.2",
    cpuPct: 54,
    memPct: 59,
    pods: 31,
    maxPods: 40,
    uptime: "44d 11h",
    status: "Healthy",
  },
  {
    id: "node-03",
    name: "me-central-app-b1",
    shortName: "me-b1",
    region: "me-central-1",
    role: "compute",
    instanceType: "m7g.xlarge",
    kubeletVersion: "v1.31.2",
    cpuPct: 86,
    memPct: 81,
    pods: 34,
    maxPods: 36,
    uptime: "19d 04h",
    status: "High Load",
  },
  {
    id: "node-04",
    name: "me-central-db-b2",
    shortName: "me-b2",
    region: "me-central-1",
    role: "database",
    instanceType: "r7g.2xlarge",
    kubeletVersion: "v1.31.2",
    cpuPct: 41,
    memPct: 74,
    pods: 12,
    maxPods: 20,
    uptime: "92d 07h",
    status: "Healthy",
  },
  {
    id: "node-05",
    name: "us-east-edge-c1",
    shortName: "us-c1",
    region: "us-east-1",
    role: "edge",
    instanceType: "c7g.xlarge",
    kubeletVersion: "v1.31.2",
    cpuPct: 33,
    memPct: 46,
    pods: 19,
    maxPods: 32,
    uptime: "61d 18h",
    status: "Healthy",
  },
  {
    id: "node-06",
    name: "eu-west-canary-a3",
    shortName: "eu-a3",
    region: "eu-west-2",
    role: "compute",
    instanceType: "c7g.large",
    kubeletVersion: "v1.31.2",
    cpuPct: 18,
    memPct: 29,
    pods: 6,
    maxPods: 24,
    uptime: "6d 02h",
    status: "Draining",
  },
];

const scheduledPodsKPIProps: LineChartKPI1Props = {
  title: "Pod scheduling events",
  comparison: "last week",
  currentLabel: "This week",
  format: "number",
  data: [
    { label: "Mon", previous: 112, value: 128 },
    { label: "Tue", previous: 124, value: 139 },
    { label: "Wed", previous: 118, value: 131 },
    { label: "Thu", previous: 130, value: 146 },
    { label: "Fri", previous: 126, value: 141 },
    { label: "Sat", previous: 84, value: 92 },
    { label: "Sun", previous: 79, value: 88 },
  ],
};

const autoscaledReplicasKPIProps: AreaChartKPI2Props = {
  title: "Autoscaled replicas",
  comparison: "last week",
  format: "number",
  previous: 184,
  data: [
    { label: "Mon", value: 28 },
    { label: "Tue", value: 34 },
    { label: "Wed", value: 31 },
    { label: "Thu", value: 38 },
    { label: "Fri", value: 36 },
    { label: "Sat", value: 21 },
    { label: "Sun", value: 24 },
  ],
};

const clusterRequestsKPIProps: LineChartKPI1Props = {
  title: "Ingress requests",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 2_840_000, value: 3_120_000 },
    { label: "Tue", previous: 2_950_000, value: 3_290_000 },
    { label: "Wed", previous: 3_010_000, value: 3_340_000 },
    { label: "Thu", previous: 3_180_000, value: 3_520_000 },
    { label: "Fri", previous: 3_240_000, value: 3_610_000 },
    { label: "Sat", previous: 2_410_000, value: 2_690_000 },
    { label: "Sun", previous: 2_290_000, value: 2_580_000 },
  ],
};

const nodeHoursKPIProps: AreaChartKPI2Props = {
  title: "Healthy node-hours",
  comparison: "last week",
  format: "number",
  previous: 980,
  data: [
    { label: "Mon", value: 144 },
    { label: "Tue", value: 144 },
    { label: "Wed", value: 144 },
    { label: "Thu", value: 144 },
    { label: "Fri", value: 144 },
    { label: "Sat", value: 142 },
    { label: "Sun", value: 144 },
  ],
};

const HEALTH_TONE: Record<NodeHealth, StatusTone> = {
  Healthy: "good",
  "High Load": "warning",
  Draining: "neutral",
};

function UsageBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${
            pct >= 90
              ? "bg-red-500"
              : pct >= 80
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums">{pct}%</span>
    </div>
  );
}

const CLUSTER_EXPORT_FORMATS = [
  { label: "Export as CSV", value: "csv" },
  { label: "Export as PDF", value: "pdf" },
];

export function DevOpsClustersView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const hatchId = useChartId();

  const {
    refreshing: chartRefreshing,
    refreshKey: chartRefreshKey,
    triggerRefresh: triggerChartRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });
  const {
    refreshing: leaderboardRefreshing,
    refreshKey: leaderboardRefreshKey,
    triggerRefresh: triggerLeaderboardRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });
  const {
    refreshing: tableRefreshing,
    refreshKey: tableRefreshKey,
    triggerRefresh: triggerTableRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });

  const [nodes, setNodes] = useState<ClusterNode[]>(INITIAL_NODES);
  const [hasModified, setHasModified] = useState(false);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("All");
  const [viewingNode, setViewingNode] = useState<ClusterNode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeNodes = useMemo(() => (state.isEmpty ? [] : nodes), [state.isEmpty, nodes]);

  const filteredNodes = useMemo(() => {
    if (regionFilter === "All") return activeNodes;
    return activeNodes.filter((n) => n.region === regionFilter);
  }, [activeNodes, regionFilter]);

  const summary = useMemo(() => {
    const totalPods = activeNodes.reduce((sum, n) => sum + n.pods, 0);
    const totalCapacity = activeNodes.reduce((sum, n) => sum + n.maxPods, 0);
    const avgCpu =
      activeNodes.length > 0
        ? activeNodes.reduce((sum, n) => sum + n.cpuPct, 0) / activeNodes.length / 100
        : 0;
    const avgMem =
      activeNodes.length > 0
        ? activeNodes.reduce((sum, n) => sum + n.memPct, 0) / activeNodes.length / 100
        : 0;
    const healthyCount = activeNodes.filter((n) => n.status === "Healthy").length;
    return { totalPods, totalCapacity, avgCpu, avgMem, healthyCount };
  }, [activeNodes]);

  const rankedNodes = useMemo(() => {
    return [...activeNodes].sort((a, b) => b.cpuPct - a.cpuPct);
  }, [activeNodes]);

  const chartState = getBlockState(state.status, activeNodes);
  const tableState = getBlockState(state.status, filteredNodes);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentNodesGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Cluster nodes",
      items: activeNodes.slice(0, 5).map((node) => ({
        id: `recent-node-${node.id}`,
        label: node.name,
        description: `${node.region} · ${node.instanceType} · ${node.role}`,
        meta: `${node.cpuPct}% CPU · ${node.pods}/${node.maxPods} pods`,
        icon: <ServerIcon />,
        onSelect: () => setViewingNode(node),
      })),
    }),
    [activeNodes]
  );

  const searchNodes = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentNodesGroup];
    const matches = activeNodes.filter((node) =>
      `${node.name} ${node.region} ${node.instanceType} ${node.role} ${node.status}`
        .toLowerCase()
        .includes(needle)
    );
    if (matches.length === 0) return [];
    return [
      {
        heading: "Nodes",
        items: matches.map((node) => ({
          id: `search-node-${node.id}`,
          label: node.name,
          description: `${node.region} · ${node.instanceType}`,
          meta: `${node.cpuPct}% CPU · ${node.status}`,
          icon: <ServerIcon />,
          onSelect: () => setViewingNode(node),
        })),
      },
    ];
  };

  const handleToggleDrain = (node: ClusterNode) => {
    const nextStatus: NodeHealth =
      node.status === "Draining" ? "Healthy" : "Draining";
    const updated: ClusterNode = {
      ...node,
      status: nextStatus,
      pods: nextStatus === "Draining" ? 0 : Math.max(8, node.pods || 14),
    };
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updated : n)));
    if (viewingNode?.id === node.id) setViewingNode(updated);
    setHasModified(true);
    setNotice(
      nextStatus === "Draining"
        ? `Cordoned & drained ${node.name}.`
        : `Uncordoned ${node.name} back into scheduling rotation.`
    );
  };

  const handleRebalance = () => {
    setNodes((prev) =>
      prev.map((n) =>
        n.status === "High Load"
          ? { ...n, cpuPct: 61, memPct: 64, pods: 26, status: "Healthy" }
          : n
      )
    );
    setHasModified(true);
    setNotice("Rebalanced workloads across regional Kubernetes pools.");
  };

  const handleReset = () => {
    setNodes(INITIAL_NODES);
    setHasModified(false);
    setRegionFilter("All");
    setNotice("Restored default cluster node telemetry.");
  };

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <div
          role="status"
          className="bg-muted/60 border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
        >
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <LineChartKPI1
          {...scheduledPodsKPIProps}
          data={state.isEmpty ? [] : scheduledPodsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...autoscaledReplicasKPIProps}
          data={state.isEmpty ? [] : autoscaledReplicasKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...clusterRequestsKPIProps}
          data={state.isEmpty ? [] : clusterRequestsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...nodeHoursKPIProps}
          data={state.isEmpty ? [] : nodeHoursKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Analytics Row: Node CPU & Memory Utilization + Highest-Load Nodes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Cluster compute &amp; memory load
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Real-time CPU and memory allocation across multi-region worker nodes.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isChartBusy && <BlockBusyIndicator />}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isChartBusy}
                        onClick={() => void triggerChartRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy
                    refreshing={isChartBusy}
                    label="Updating node utilization"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">Avg CPU load</dt>
                          <dd>
                            <KPIValue
                              value={summary.avgCpu}
                              format={(v) =>
                                formatPercent(v, { maximumFractionDigits: 1 })
                              }
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.healthyCount} of {activeNodes.length} nodes healthy
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Avg memory usage
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.avgMem}
                              format={(v) =>
                                formatPercent(v, { maximumFractionDigits: 1 })
                              }
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              Across 3 active regions
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Running pods
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.totalPods}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              of {formatNumber(summary.totalCapacity)} pod slots
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "CPU (%)" },
                            {
                              color: "var(--color-muted-foreground)",
                              label: "Memory (%)",
                              shape: "hatched",
                            },
                          ]}
                        />
                      )}

                      {chartState ? (
                        <ChartPlaceholder height={224} />
                      ) : (
                        <>
                          <ChartPanelFigure key={chartRefreshKey} className="h-56">
                            <ResponsiveContainer
                              initialDimension={{ width: 480, height: 224 }}
                              width="100%"
                              height="100%"
                            >
                              <BarChart
                                aria-label="CPU and memory usage by node"
                                data={activeNodes}
                                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                              >
                                <defs>
                                  <ChartHatch
                                    color="var(--color-muted-foreground)"
                                    id={hatchId}
                                  />
                                </defs>
                                <CartesianGrid {...chartGridProps} />
                                <XAxis {...chartAxisProps} dataKey="shortName" interval={0} />
                                <YAxis
                                  {...chartAxisProps}
                                  domain={[0, 100]}
                                  tickFormatter={(v: number) => `${v}%`}
                                  width={chartValueAxisWidth}
                                />
                                <Tooltip
                                  cursor={chartBarCursor}
                                  content={({ active, payload }) => (
                                    <ChartTooltipContent
                                      active={active}
                                      label={String(payload?.[0]?.payload?.name ?? "")}
                                      payload={payload}
                                      valueFormatter={(value) => `${value}%`}
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="cpuPct"
                                  name="CPU (%)"
                                  fill="var(--color-chart-2)"
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                  dataKey="memPct"
                                  name="Memory (%)"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Cluster node resource utilization"
                            columns={[
                              { key: "name", label: "Node" },
                              { key: "cpuPct", label: "CPU %", format: (v) => `${v}%` },
                              { key: "memPct", label: "Memory %", format: (v) => `${v}%` },
                            ]}
                            rows={activeNodes}
                          />
                        </>
                      )}
                    </div>
                  </DashboardBusy>
                </section>
              </CardContent>
            </Card>
          </BlockStateProvider>
        </div>

        <div className="lg:col-span-5">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex h-full flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Nodes by CPU pressure
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Worker nodes ordered by current CPU saturation and scheduled pod density.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isLeaderboardBusy && <BlockBusyIndicator />}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isLeaderboardBusy}
                        onClick={() => void triggerLeaderboardRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy
                    refreshing={isLeaderboardBusy}
                    label="Updating node pressure"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={leaderboardRefreshKey}>
                          {rankedNodes.slice(0, 5).map((node, index) => (
                            <LeaderboardItem key={node.id} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={node.cpuPct} delay={index * 60} />
                              <LeaderboardLabel>
                                <button
                                  type="button"
                                  onClick={() => setViewingNode(node)}
                                  className="block max-w-full cursor-pointer truncate text-left font-mono text-sm font-medium hover:underline"
                                >
                                  {node.name}
                                </button>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>{node.region}</span>
                                  <span>{node.instanceType}</span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{node.cpuPct}%</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {node.pods}/{node.maxPods} pods
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground text-sm">
                          {rankedNodes[0]
                            ? `${rankedNodes[0].name} carries the highest compute load (${rankedNodes[0].cpuPct}% CPU, ${rankedNodes[0].memPct}% RAM) in ${rankedNodes[0].region}.`
                            : "No cluster nodes currently registered."}
                        </p>
                      </BlockReady>
                    </div>
                  </DashboardBusy>
                </section>
              </CardContent>
            </Card>
          </BlockStateProvider>
        </div>
      </div>

      {/* Node Fleet Directory */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">Kubernetes node fleet</h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeNodes.length} provisioned nodes running{" "}
                      {formatCompact(summary.totalPods)} pods across 3 availability regions.
                    </p>
                  </BlockReady>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isTableBusy && <BlockBusyIndicator />}
                  {hasModified && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <RotateCcwIcon className="size-3.5" />
                      Reset
                    </Button>
                  )}
                  <ExportMenu
                    size="sm"
                    disabled={state.isLoading || filteredNodes.length === 0}
                    formats={CLUSTER_EXPORT_FORMATS}
                    onExport={(format) => {
                      if (format === "csv") {
                        downloadCsvReport({
                          filename: "cluster-resource-usage-compliance.csv",
                          headers: [
                            "ID",
                            "Node",
                            "Region",
                            "Role",
                            "Instance",
                            "CPU %",
                            "Memory %",
                            "Pods",
                            "Max Pods",
                            "Uptime",
                            "Status",
                          ],
                          rows: filteredNodes.map((n) => [
                            n.id,
                            n.name,
                            n.region,
                            n.role,
                            n.instanceType,
                            n.cpuPct,
                            n.memPct,
                            n.pods,
                            n.maxPods,
                            n.uptime,
                            n.status,
                          ]),
                        });
                        setNotice("Exported node resource usage inventory to CSV.");
                      } else if (format === "pdf") {
                        downloadPdfComplianceReport({
                          filename: "cluster-resource-usage-compliance.pdf",
                          title: "Cluster Resource Usage Compliance Report",
                          subtitle:
                            "Kubernetes worker node compute allocation, memory pressure, and pod capacity inventory.",
                          metadata: [
                            { label: "Region Filter", value: regionFilter },
                            { label: "Avg CPU Load", value: formatPercent(summary.avgCpu) },
                            { label: "Avg Memory Load", value: formatPercent(summary.avgMem) },
                          ],
                          columns: [
                            { header: "Node", width: 22 },
                            { header: "Region", width: 14 },
                            { header: "Instance", width: 14 },
                            { header: "CPU %", width: 10, align: "right" },
                            { header: "Mem %", width: 10, align: "right" },
                            { header: "Pods", width: 11, align: "right" },
                            { header: "Status", width: 13 },
                          ],
                          rows: filteredNodes.map((n) => [
                            n.name,
                            n.region,
                            n.instanceType,
                            `${n.cpuPct}%`,
                            `${n.memPct}%`,
                            `${n.pods}/${n.maxPods}`,
                            n.status,
                          ]),
                        });
                        setNotice("Exported cluster resource usage compliance report to PDF.");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={state.isLoading}
                    onClick={handleRebalance}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <RefreshCwIcon className="size-3.5" />
                    Rebalance load
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    className="h-8 px-2.5"
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating cluster fleet">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full items-stretch sm:w-auto"
                      emptyMessage="No matching cluster nodes found."
                      placeholder="Search nodes, regions, instances..."
                      recent={recentNodesGroup}
                      search={searchNodes}
                      showStatus={false}
                      title="Search cluster nodes"
                      triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div
                      role="tablist"
                      aria-label="Filter nodes by region"
                      className="bg-muted inline-flex items-center rounded-lg p-0.5"
                    >
                      {(
                        [
                          { id: "All", label: `All (${activeNodes.length})` },
                          { id: "eu-west-2", label: "eu-west-2" },
                          { id: "me-central-1", label: "me-central-1" },
                          { id: "us-east-1", label: "us-east-1" },
                        ] as const
                      ).map((tab) => {
                        const active = regionFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setRegionFilter(tab.id)}
                            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                              active
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-1">
                    <DataTable density="compact" caption="Cluster node fleet">
                      <DataTableHeader>
                        <DataTableRow>
                          <DataTableHead>Node</DataTableHead>
                          <DataTableHead>Region</DataTableHead>
                          <DataTableHead>CPU</DataTableHead>
                          <DataTableHead>Memory</DataTableHead>
                          <DataTableHead align="end">Pods</DataTableHead>
                          <DataTableHead align="end">Status</DataTableHead>
                          <DataTableHead align="end">
                            <span className="sr-only">Actions</span>
                          </DataTableHead>
                        </DataTableRow>
                      </DataTableHeader>
                      <DataTableBody>
                        <DataTableStateRows colSpan={7} rows={5} />
                        {!tableState &&
                          filteredNodes.map((node) => (
                            <DataTableRow key={node.id}>
                              <DataTableCell primary truncate className="max-w-xs">
                                <button
                                  type="button"
                                  onClick={() => setViewingNode(node)}
                                  className="cursor-pointer text-left font-mono text-xs font-medium hover:underline"
                                >
                                  {node.name}
                                </button>
                                <span className="text-muted-foreground block text-xs">
                                  {node.instanceType} · {node.role} · up {node.uptime}
                                </span>
                              </DataTableCell>
                              <DataTableCell className="text-muted-foreground font-mono text-xs">
                                {node.region}
                              </DataTableCell>
                              <DataTableCell>
                                <UsageBar pct={node.cpuPct} />
                              </DataTableCell>
                              <DataTableCell>
                                <UsageBar pct={node.memPct} />
                              </DataTableCell>
                              <DataTableCell
                                align="end"
                                className="text-muted-foreground font-mono text-xs tabular-nums"
                              >
                                {node.pods}/{node.maxPods}
                              </DataTableCell>
                              <DataTableCell align="end">
                                <StatusLabel tone={HEALTH_TONE[node.status]}>
                                  {node.status}
                                </StatusLabel>
                              </DataTableCell>
                              <DataTableCell align="end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        aria-label={`Actions for ${node.name}`}
                                      />
                                    }
                                  >
                                    <MoreHorizontalIcon className="size-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel>Node control</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => setViewingNode(node)}>
                                        <CpuIcon className="size-3.5" />
                                        Inspect node
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleToggleDrain(node)}>
                                        <RotateCwIcon className="size-3.5" />
                                        {node.status === "Draining"
                                          ? "Uncordon node"
                                          : "Cordon & drain"}
                                      </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          downloadCsvReport({
                                            filename: `${node.name}-resource-usage.csv`,
                                            headers: [
                                              "ID",
                                              "Node",
                                              "Region",
                                              "Role",
                                              "Instance",
                                              "CPU %",
                                              "Memory %",
                                              "Pods",
                                              "Max Pods",
                                              "Uptime",
                                              "Status",
                                            ],
                                            rows: [
                                              [
                                                node.id,
                                                node.name,
                                                node.region,
                                                node.role,
                                                node.instanceType,
                                                node.cpuPct,
                                                node.memPct,
                                                node.pods,
                                                node.maxPods,
                                                node.uptime,
                                                node.status,
                                              ],
                                            ],
                                          });
                                          setNotice(`Exported telemetry for ${node.name}.`);
                                        }}
                                      >
                                        <DownloadIcon className="size-3.5" />
                                        Export CSV
                                      </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </DataTableCell>
                            </DataTableRow>
                          ))}
                      </DataTableBody>
                    </DataTable>
                  </div>
                </div>
              </DashboardBusy>
            </section>
          </CardContent>
        </Card>
      </BlockStateProvider>

      {/* Node Inspector Dialog */}
      <Dialog
        open={viewingNode !== null}
        onOpenChange={(open) => {
          if (!open) setViewingNode(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {viewingNode && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-base">
                  <span>{viewingNode.name}</span>
                  <StatusLabel tone={HEALTH_TONE[viewingNode.status]}>
                    {viewingNode.status}
                  </StatusLabel>
                </DialogTitle>
                <DialogDescription>
                  {viewingNode.region} · {viewingNode.instanceType} ·{" "}
                  {viewingNode.role} node
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">CPU usage</dt>
                  <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                    {viewingNode.cpuPct}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Memory usage</dt>
                  <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                    {viewingNode.memPct}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Scheduled pods</dt>
                  <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                    {viewingNode.pods}/{viewingNode.maxPods}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kubelet</dt>
                  <dd className="mt-0.5 font-mono text-foreground">
                    {viewingNode.kubeletVersion}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Uptime</dt>
                  <dd className="mt-0.5 font-mono text-foreground tabular-nums">
                    {viewingNode.uptime}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Node ID</dt>
                  <dd className="mt-0.5 font-mono text-foreground">{viewingNode.id}</dd>
                </div>
              </dl>
              <DialogFooter>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleDrain(viewingNode)}
                >
                  <RotateCwIcon className="size-3.5" />
                  {viewingNode.status === "Draining" ? "Uncordon node" : "Drain node"}
                </Button>
                <DialogClose render={<Button size="sm" />}>Close</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DevOpsClustersView;
