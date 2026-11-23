"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/dashboardblocks/format";
import {
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
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

type Severity = "SEV-1" | "SEV-2" | "SEV-3";
type IncidentStatus = "Open" | "Acknowledged" | "Resolved";
type StatusFilter = "All" | IncidentStatus;

interface IncidentItem {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  responder: string;
  openedAt: string;
  summary: string;
}

const STORAGE_KEY = "hamzet-wasel-devops-incidents-v2";

const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: "INC-204",
    title: "Elevated p99 latency on webhook delivery queue",
    service: "ingest-pipeline",
    severity: "SEV-2",
    status: "Open",
    responder: "Karim Hassan",
    openedAt: "24m ago",
    summary: "Worker pool saturation detected in me-central-1 following burst traffic.",
  },
  {
    id: "INC-203",
    title: "WebSocket heartbeat timeout spikes on mobile clients",
    service: "realtime-sync",
    severity: "SEV-2",
    status: "Acknowledged",
    responder: "Laila Mansour",
    openedAt: "2h ago",
    summary: "Investigating keepalive drop after edge proxy TLS session rotation.",
  },
  {
    id: "INC-202",
    title: "Transient Redis cache miss rate above 12%",
    service: "api-gateway",
    severity: "SEV-3",
    status: "Resolved",
    responder: "Nour El-Din",
    openedAt: "Yesterday",
    summary: "Eviction policy adjusted and read replica warmed cleanly.",
  },
  {
    id: "INC-201",
    title: "Invoice PDF renderer memory leak on large batches",
    service: "billing-worker",
    severity: "SEV-1",
    status: "Resolved",
    responder: "Ahmed Steet",
    openedAt: "Nov 18, 2026",
    summary: "Rolled back worker v2.14.3 and capped concurrent Chromium tabs.",
  },
];

const SERVICE_INCIDENT_BASELINE = [
  { service: "ingest-pipeline", short: "ingest", resolved: 9, active: 2, mttrMin: 38 },
  { service: "realtime-sync", short: "realtime", resolved: 7, active: 2, mttrMin: 44 },
  { service: "api-gateway", short: "api-gw", resolved: 11, active: 1, mttrMin: 21 },
  { service: "billing-worker", short: "billing", resolved: 5, active: 1, mttrMin: 52 },
  { service: "auth-service", short: "auth", resolved: 4, active: 0, mttrMin: 18 },
];

const alertsTriggeredKPIProps: LineChartKPI1Props = {
  title: "Alerts triggered",
  comparison: "last week",
  currentLabel: "This week",
  format: "number",
  data: [
    { label: "Mon", previous: 8, value: 6 },
    { label: "Tue", previous: 11, value: 9 },
    { label: "Wed", previous: 7, value: 5 },
    { label: "Thu", previous: 12, value: 8 },
    { label: "Fri", previous: 9, value: 7 },
    { label: "Sat", previous: 5, value: 4 },
    { label: "Sun", previous: 4, value: 3 },
  ],
};

const incidentsResolvedKPIProps: AreaChartKPI2Props = {
  title: "Incidents resolved",
  comparison: "last week",
  format: "number",
  previous: 34,
  data: [
    { label: "Mon", value: 6 },
    { label: "Tue", value: 8 },
    { label: "Wed", value: 5 },
    { label: "Thu", value: 7 },
    { label: "Fri", value: 6 },
    { label: "Sat", value: 4 },
    { label: "Sun", value: 3 },
  ],
};

const onCallPagesKPIProps: LineChartKPI1Props = {
  title: "On-call pages",
  comparison: "last week",
  currentLabel: "This week",
  format: "number",
  data: [
    { label: "Mon", previous: 4, value: 3 },
    { label: "Tue", previous: 5, value: 4 },
    { label: "Wed", previous: 3, value: 2 },
    { label: "Thu", previous: 6, value: 4 },
    { label: "Fri", previous: 4, value: 3 },
    { label: "Sat", previous: 2, value: 1 },
    { label: "Sun", previous: 2, value: 2 },
  ],
};

const autoMitigationsKPIProps: AreaChartKPI2Props = {
  title: "Auto-mitigated alerts",
  comparison: "last week",
  format: "number",
  previous: 19,
  data: [
    { label: "Mon", value: 3 },
    { label: "Tue", value: 4 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 5 },
    { label: "Fri", value: 4 },
    { label: "Sat", value: 2 },
    { label: "Sun", value: 2 },
  ],
};

const SEVERITY_TONE: Record<Severity, StatusTone> = {
  "SEV-1": "bad",
  "SEV-2": "warning",
  "SEV-3": "info",
};

const INCIDENT_TONE: Record<IncidentStatus, StatusTone> = {
  Open: "bad",
  Acknowledged: "warning",
  Resolved: "good",
};

function loadStoredIncidents(): IncidentItem[] {
  if (typeof window === "undefined") return INITIAL_INCIDENTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_INCIDENTS;
    const parsed = JSON.parse(raw) as IncidentItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_INCIDENTS;
  } catch {
    return INITIAL_INCIDENTS;
  }
}

function exportIncidentsCsv(rows: IncidentItem[]) {
  const headers = ["ID", "Title", "Severity", "Service", "Responder", "Opened", "Status", "Summary"];
  const lines = [
    headers,
    ...rows.map((i) => [
      i.id,
      i.title,
      i.severity,
      i.service,
      i.responder,
      i.openedAt,
      i.status,
      i.summary,
    ]),
  ]
    .map((cols) => cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([lines], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "devops-incidents.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function DevOpsIncidentsView(props: DashboardBlockStateProps = {}) {
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

  const [incidents, setIncidents] = useState<IncidentItem[]>(loadStoredIncidents);
  const [hasModified, setHasModified] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [viewingIncident, setViewingIncident] = useState<IncidentItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [service, setService] = useState("api-gateway");
  const [severity, setSeverity] = useState<Severity>("SEV-2");
  const [summaryText, setSummaryText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch {
      // Ignore storage write errors
    }
  }, [incidents]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeIncidents = useMemo(
    () => (state.isEmpty ? [] : incidents),
    [state.isEmpty, incidents]
  );

  const filteredIncidents = useMemo(() => {
    if (statusFilter === "All") return activeIncidents;
    return activeIncidents.filter((item) => item.status === statusFilter);
  }, [activeIncidents, statusFilter]);

  const summary = useMemo(() => {
    const openCount = activeIncidents.filter((i) => i.status === "Open").length;
    const ackCount = activeIncidents.filter((i) => i.status === "Acknowledged").length;
    const resolvedCount = activeIncidents.filter((i) => i.status === "Resolved").length;
    return { openCount, ackCount, resolvedCount };
  }, [activeIncidents]);

  const chartData = useMemo(() => {
    if (state.isEmpty) return [];
    return SERVICE_INCIDENT_BASELINE.map((row) => {
      const liveOpen = incidents.filter(
        (i) => i.service === row.service && i.status !== "Resolved"
      ).length;
      const liveResolved = incidents.filter(
        (i) => i.service === row.service && i.status === "Resolved"
      ).length;
      return {
        ...row,
        active: liveOpen,
        resolved: row.resolved + liveResolved,
        total: row.resolved + liveResolved + liveOpen,
      };
    });
  }, [state.isEmpty, incidents]);

  const rankedServices = useMemo(() => {
    const maxTotal = Math.max(1, ...chartData.map((r) => r.total));
    return [...chartData]
      .sort((a, b) => b.total - a.total)
      .map((row) => ({
        ...row,
        barPct: Math.round((row.total / maxTotal) * 100),
      }));
  }, [chartData]);

  const chartState = getBlockState(state.status, chartData);
  const tableState = getBlockState(state.status, filteredIncidents);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentIncidentsGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Recent incidents",
      items: activeIncidents.slice(0, 5).map((item) => ({
        id: `recent-inc-${item.id}`,
        label: `${item.id} · ${item.title}`,
        description: `${item.service} · ${item.responder}`,
        meta: `${item.severity} · ${item.status}`,
        icon: <ShieldAlertIcon />,
        onSelect: () => setViewingIncident(item),
      })),
    }),
    [activeIncidents]
  );

  const searchIncidents = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentIncidentsGroup];
    const matches = activeIncidents.filter((item) =>
      `${item.id} ${item.title} ${item.service} ${item.severity} ${item.responder} ${item.status}`
        .toLowerCase()
        .includes(needle)
    );
    if (matches.length === 0) return [];
    return [
      {
        heading: "Incidents",
        items: matches.map((item) => ({
          id: `search-inc-${item.id}`,
          label: `${item.id} · ${item.title}`,
          description: `${item.service} · ${item.responder}`,
          meta: `${item.severity} · ${item.status}`,
          icon: <ShieldAlertIcon />,
          onSelect: () => setViewingIncident(item),
        })),
      },
    ];
  };

  const updateStatus = (id: string, status: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    if (viewingIncident?.id === id) {
      setViewingIncident({ ...viewingIncident, status });
    }
    setHasModified(true);
    setNotice(`Marked ${id} as ${status}.`);
  };

  const handleCreateIncident = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const created: IncidentItem = {
      id: `INC-${205 + incidents.length}`,
      title: title.trim(),
      service,
      severity,
      status: "Open",
      responder: "Ahmed Steet",
      openedAt: "Just now",
      summary: summaryText.trim() || "Triage started by on-call responder.",
    };
    setIncidents((prev) => [created, ...prev]);
    setHasModified(true);
    setTitle("");
    setSummaryText("");
    setCreateOpen(false);
    setNotice(`Opened ${created.id} and paged on-call responder.`);
  };

  const handleReset = () => {
    setIncidents(INITIAL_INCIDENTS);
    setHasModified(false);
    setStatusFilter("All");
    setNotice("Restored default incident queue.");
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
          {...alertsTriggeredKPIProps}
          data={state.isEmpty ? [] : alertsTriggeredKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...incidentsResolvedKPIProps}
          data={state.isEmpty ? [] : incidentsResolvedKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...onCallPagesKPIProps}
          data={state.isEmpty ? [] : onCallPagesKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...autoMitigationsKPIProps}
          data={state.isEmpty ? [] : autoMitigationsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Analytics Row: Incidents by Service + Most Impacted Services */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Incident volume by service
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Resolved historical tickets compared against active unmitigated incidents.
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
                    label="Updating incident telemetry"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">
                            Open &amp; acked
                          </dt>
                          <dd>
                            <KPIValue
                              value={summary.openCount + summary.ackCount}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.openCount} open · {summary.ackCount} acknowledged
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Median MTTA
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={6}
                              format={(v) => `${v}m 15s`}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs">
                              Primary: Karim Hassan
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Median MTTR
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={34}
                              format={(v) => `${v}m 20s`}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.resolvedCount} closed in queue
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Resolved (30d)" },
                            {
                              color: "var(--color-chart-5)",
                              label: "Active open/acked",
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
                                aria-label="Incidents by service"
                                data={chartData}
                                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                              >
                                <defs>
                                  <ChartHatch
                                    color="var(--color-chart-5)"
                                    id={hatchId}
                                  />
                                </defs>
                                <CartesianGrid {...chartGridProps} />
                                <XAxis {...chartAxisProps} dataKey="short" interval={0} />
                                <YAxis
                                  {...chartAxisProps}
                                  tickFormatter={(v: number) => formatNumber(v)}
                                  width={chartValueAxisWidth}
                                />
                                <Tooltip
                                  cursor={chartBarCursor}
                                  content={({ active, payload }) => (
                                    <ChartTooltipContent
                                      active={active}
                                      label={String(payload?.[0]?.payload?.service ?? "")}
                                      payload={payload}
                                      valueFormatter={(value) =>
                                        `${formatNumber(value)} incidents`
                                      }
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="resolved"
                                  name="Resolved (30d)"
                                  stackId="inc"
                                  fill="var(--color-chart-2)"
                                  radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                  dataKey="active"
                                  name="Active open/acked"
                                  stackId="inc"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Incident volume by service"
                            columns={[
                              { key: "service", label: "Service" },
                              {
                                key: "resolved",
                                label: "Resolved",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "active",
                                label: "Active",
                                format: (v) => formatNumber(v),
                              },
                            ]}
                            rows={chartData}
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
                        Most impacted services
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Services ranked by 30-day alert frequency and mean time to recovery.
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
                    label="Updating service reliability"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={leaderboardRefreshKey}>
                          {rankedServices.map((row, index) => (
                            <LeaderboardItem key={row.service} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={row.barPct} delay={index * 60} />
                              <LeaderboardLabel>
                                <span className="block max-w-full truncate font-mono text-sm font-medium">
                                  {row.service}
                                </span>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>{row.active} active</span>
                                  <span>{row.resolved} resolved</span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{row.total}</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {row.mttrMin}m MTTR
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground text-sm">
                          EMEA on-call rotation led by Karim Hassan (rotates in 6h).
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

      {/* Incident Queue Directory */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">Incident queue</h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeIncidents.length} tracked{" "}
                      {activeIncidents.length === 1 ? "incident" : "incidents"} ·{" "}
                      {summary.openCount} awaiting acknowledgment.
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={state.isLoading || activeIncidents.length === 0}
                    onClick={() => {
                      exportIncidentsCsv(filteredIncidents);
                      setNotice("Exported incident queue to CSV.");
                    }}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <DownloadIcon className="size-3.5" />
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={state.isLoading}
                    onClick={() => setCreateOpen(true)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <PlusIcon className="size-3.5" />
                    Declare incident
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    className="h-8 px-2.5"
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating incident queue">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full items-stretch sm:w-auto"
                      emptyMessage="No matching incidents found."
                      placeholder="Search ID, service, responder..."
                      recent={recentIncidentsGroup}
                      search={searchIncidents}
                      showStatus={false}
                      title="Search incidents"
                      triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div
                      role="tablist"
                      aria-label="Filter incidents by status"
                      className="bg-muted inline-flex items-center rounded-lg p-0.5"
                    >
                      {(
                        [
                          { id: "All", label: `All (${activeIncidents.length})` },
                          { id: "Open", label: `Open (${summary.openCount})` },
                          { id: "Acknowledged", label: `Acked (${summary.ackCount})` },
                          { id: "Resolved", label: `Resolved (${summary.resolvedCount})` },
                        ] as const
                      ).map((tab) => {
                        const active = statusFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setStatusFilter(tab.id)}
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
                    <DataTable density="compact" caption="On-call incident queue">
                      <DataTableHeader>
                        <DataTableRow>
                          <DataTableHead>Incident</DataTableHead>
                          <DataTableHead>Severity</DataTableHead>
                          <DataTableHead>Service</DataTableHead>
                          <DataTableHead>Responder</DataTableHead>
                          <DataTableHead align="end">Status</DataTableHead>
                          <DataTableHead align="end">
                            <span className="sr-only">Actions</span>
                          </DataTableHead>
                        </DataTableRow>
                      </DataTableHeader>
                      <DataTableBody>
                        <DataTableStateRows colSpan={6} rows={5} />
                        {!tableState &&
                          filteredIncidents.map((item) => (
                            <DataTableRow key={item.id}>
                              <DataTableCell primary truncate className="max-w-md">
                                <button
                                  type="button"
                                  onClick={() => setViewingIncident(item)}
                                  className="cursor-pointer text-left font-medium hover:underline"
                                >
                                  <span className="text-muted-foreground mr-2 font-mono text-xs">
                                    {item.id}
                                  </span>
                                  {item.title}
                                </button>
                                <span className="text-muted-foreground block truncate text-xs">
                                  {item.summary}
                                </span>
                              </DataTableCell>
                              <DataTableCell>
                                <StatusLabel tone={SEVERITY_TONE[item.severity]}>
                                  {item.severity}
                                </StatusLabel>
                              </DataTableCell>
                              <DataTableCell className="text-muted-foreground font-mono text-xs">
                                {item.service}
                              </DataTableCell>
                              <DataTableCell>
                                <div className="text-sm">{item.responder}</div>
                                <span className="text-muted-foreground block text-xs tabular-nums">
                                  {item.openedAt}
                                </span>
                              </DataTableCell>
                              <DataTableCell align="end">
                                <StatusLabel tone={INCIDENT_TONE[item.status]}>
                                  {item.status}
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
                                        aria-label={`Actions for ${item.id}`}
                                      />
                                    }
                                  >
                                    <MoreHorizontalIcon className="size-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel>Triage</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => setViewingIncident(item)}>
                                        <EyeIcon className="size-3.5" />
                                        Inspect incident
                                      </DropdownMenuItem>
                                      {item.status === "Open" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            updateStatus(item.id, "Acknowledged")
                                          }
                                        >
                                          <ShieldAlertIcon className="size-3.5" />
                                          Acknowledge
                                        </DropdownMenuItem>
                                      )}
                                      {item.status !== "Resolved" && (
                                        <DropdownMenuItem
                                          onClick={() => updateStatus(item.id, "Resolved")}
                                        >
                                          <CheckCircle2Icon className="size-3.5" />
                                          Mark resolved
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          exportIncidentsCsv([item]);
                                          setNotice(`Exported ${item.id} report.`);
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

      {/* Incident Detail Dialog */}
      <Dialog
        open={viewingIncident !== null}
        onOpenChange={(open) => {
          if (!open) setViewingIncident(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {viewingIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">{viewingIncident.id}</span>
                  <StatusLabel tone={SEVERITY_TONE[viewingIncident.severity]}>
                    {viewingIncident.severity}
                  </StatusLabel>
                  <StatusLabel tone={INCIDENT_TONE[viewingIncident.status]}>
                    {viewingIncident.status}
                  </StatusLabel>
                </DialogTitle>
                <DialogDescription>{viewingIncident.title}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Service</dt>
                  <dd className="mt-0.5 font-mono text-foreground">
                    {viewingIncident.service}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Responder</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {viewingIncident.responder}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Opened</dt>
                  <dd className="mt-0.5 text-foreground tabular-nums">
                    {viewingIncident.openedAt}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-muted-foreground">Root cause &amp; mitigation notes</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {viewingIncident.summary}
                  </dd>
                </div>
              </dl>
              <DialogFooter>
                {viewingIncident.status === "Open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(viewingIncident.id, "Acknowledged")}
                  >
                    <ShieldAlertIcon className="size-3.5" />
                    Acknowledge
                  </Button>
                )}
                {viewingIncident.status !== "Resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(viewingIncident.id, "Resolved")}
                  >
                    <CheckCircle2Icon className="size-3.5" />
                    Resolve
                  </Button>
                )}
                <DialogClose render={<Button size="sm" />}>Close</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Declare Incident Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Declare new incident</DialogTitle>
            <DialogDescription>
              Open an operational incident and page the primary on-call responder.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inc-title">Title</Label>
              <Input
                id="inc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Elevated 5xx rate on checkout API"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inc-service">Affected service</Label>
                <select
                  id="inc-service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-2"
                >
                  <option value="api-gateway">api-gateway</option>
                  <option value="auth-service">auth-service</option>
                  <option value="billing-worker">billing-worker</option>
                  <option value="ingest-pipeline">ingest-pipeline</option>
                  <option value="realtime-sync">realtime-sync</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inc-severity">Severity</Label>
                <select
                  id="inc-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-2"
                >
                  <option value="SEV-1">SEV-1 (Critical)</option>
                  <option value="SEV-2">SEV-2 (Major)</option>
                  <option value="SEV-3">SEV-3 (Minor)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inc-summary">Initial summary</Label>
              <Textarea
                id="inc-summary"
                rows={3}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Impact scope, region, and initial mitigation..."
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Open incident</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DevOpsIncidentsView;
