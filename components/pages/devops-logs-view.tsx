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
import { Widget1 } from "@/components/blocks/dashboard/widget/widget-1";
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
import { formatCompact, formatNumber } from "@/lib/dashboardblocks/format";
import {
  CheckCircle2Icon,
  CopyIcon,
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  TerminalIcon,
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

type LogLevel = "INFO" | "WARN" | "ERROR";
type LevelFilter = "All" | LogLevel;

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  traceId: string;
  message: string;
  latencyMs: number;
  payload: Record<string, unknown>;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: "log-1",
    timestamp: "15:24:08.412",
    level: "INFO",
    service: "api-gateway",
    traceId: "tr_8f12a9c0",
    message: "POST /v1/events/batch 202 Accepted",
    latencyMs: 18,
    payload: { region: "eu-west-2", batchSize: 120, status: 202 },
  },
  {
    id: "log-2",
    timestamp: "15:24:06.104",
    level: "WARN",
    service: "ingest-pipeline",
    traceId: "tr_4b09e312",
    message: "Webhook consumer lag reached 1.8s in me-central-1",
    latencyMs: 1820,
    payload: { partition: 3, lagEvents: 440, thresholdMs: 1000 },
  },
  {
    id: "log-3",
    timestamp: "15:24:03.889",
    level: "ERROR",
    service: "realtime-sync",
    traceId: "tr_9d71c004",
    message: "WebSocket heartbeat ACK timeout after 5000ms",
    latencyMs: 5002,
    payload: { node: "me-central-app-b1", socketId: "ws_9941", retries: 2 },
  },
  {
    id: "log-4",
    timestamp: "15:24:01.251",
    level: "INFO",
    service: "auth-service",
    traceId: "tr_2c14f7a1",
    message: "Verified OIDC session token for workspace hamzet-wasel",
    latencyMs: 11,
    payload: { method: "TOTP", region: "eu-west-2", status: 200 },
  },
  {
    id: "log-5",
    timestamp: "15:23:58.740",
    level: "INFO",
    service: "billing-worker",
    traceId: "tr_6a82b519",
    message: "Synced 14 subscription renewals to ledger",
    latencyMs: 94,
    payload: { currency: "USD", syncedCount: 14, queueDepth: 0 },
  },
  {
    id: "log-6",
    timestamp: "15:23:54.019",
    level: "WARN",
    service: "api-gateway",
    traceId: "tr_1e55d208",
    message: "Rate limit approached (88% of burst quota) for key hw_live_34d9",
    latencyMs: 24,
    payload: { quotaLimit: 1200, currentWindow: 1056 },
  },
];

const STREAM_POOL: Omit<LogEntry, "id" | "timestamp">[] = [
  {
    level: "INFO",
    service: "api-gateway",
    traceId: "tr_7a19b221",
    message: "GET /v1/cohorts/retention 200 OK",
    latencyMs: 22,
    payload: { region: "eu-west-2", cache: "HIT", status: 200 },
  },
  {
    level: "INFO",
    service: "auth-service",
    traceId: "tr_3d88e110",
    message: "Issued short-lived edge signing key",
    latencyMs: 9,
    payload: { ttlSeconds: 900, keyVersion: 14 },
  },
  {
    level: "WARN",
    service: "ingest-pipeline",
    traceId: "tr_5c40a891",
    message: "Retrying transient downstream webhook 503",
    latencyMs: 640,
    payload: { attempt: 2, endpoint: "hooks.partner.io" },
  },
];

const SERVICE_BASELINE = [
  { service: "api-gateway", short: "api-gw", info: 420, issues: 14, avgMs: 21 },
  { service: "ingest-pipeline", short: "ingest", info: 310, issues: 26, avgMs: 148 },
  { service: "auth-service", short: "auth", info: 280, issues: 6, avgMs: 11 },
  { service: "billing-worker", short: "billing", info: 165, issues: 9, avgMs: 88 },
  { service: "realtime-sync", short: "realtime", info: 195, issues: 31, avgMs: 210 },
];

const ingestedEventsKPIProps: LineChartKPI1Props = {
  title: "Log events ingested",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 1_840_000, value: 2_090_000 },
    { label: "Tue", previous: 1_910_000, value: 2_180_000 },
    { label: "Wed", previous: 1_880_000, value: 2_210_000 },
    { label: "Thu", previous: 2_050_000, value: 2_390_000 },
    { label: "Fri", previous: 2_120_000, value: 2_460_000 },
    { label: "Sat", previous: 1_490_000, value: 1_690_000 },
    { label: "Sun", previous: 1_420_000, value: 1_610_000 },
  ],
};

const tracedSpansKPIProps: AreaChartKPI2Props = {
  title: "Traced spans",
  comparison: "last week",
  format: "compact",
  previous: 4_820_000,
  data: [
    { label: "Mon", value: 780_000 },
    { label: "Tue", value: 820_000 },
    { label: "Wed", value: 840_000 },
    { label: "Thu", value: 910_000 },
    { label: "Fri", value: 940_000 },
    { label: "Sat", value: 640_000 },
    { label: "Sun", value: 610_000 },
  ],
};

const warningSpikesKPIProps: LineChartKPI1Props = {
  title: "Warning events",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 4_200, value: 3_600 },
    { label: "Tue", previous: 4_800, value: 4_100 },
    { label: "Wed", previous: 3_900, value: 3_400 },
    { label: "Thu", previous: 5_100, value: 4_300 },
    { label: "Fri", previous: 4_600, value: 3_900 },
    { label: "Sat", previous: 2_800, value: 2_300 },
    { label: "Sun", previous: 2_600, value: 2_100 },
  ],
};

const errorLogsKPIProps: AreaChartKPI2Props = {
  title: "Error logs",
  comparison: "last week",
  format: "number",
  previous: 1_480,
  data: [
    { label: "Mon", value: 210 },
    { label: "Tue", value: 245 },
    { label: "Wed", value: 190 },
    { label: "Thu", value: 230 },
    { label: "Fri", value: 198 },
    { label: "Sat", value: 124 },
    { label: "Sun", value: 112 },
  ],
};

const LEVEL_TONE: Record<LogLevel, StatusTone> = {
  INFO: "info",
  WARN: "warning",
  ERROR: "bad",
};

function formatTimeNow(): string {
  const d = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(
    d.getMilliseconds(),
    3
  )}`;
}

export function DevOpsLogsView(props: DashboardBlockStateProps = {}) {
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

  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [streaming, setStreaming] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("All");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!streaming || state.isEmpty) return;
    const timer = window.setInterval(() => {
      const template =
        STREAM_POOL[Math.floor(Math.random() * STREAM_POOL.length)];
      setLogs((prev) => [
        {
          ...template,
          id: `log-${Date.now()}`,
          timestamp: formatTimeNow(),
        },
        ...prev.slice(0, 49),
      ]);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [streaming, state.isEmpty]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeLogs = useMemo(() => (state.isEmpty ? [] : logs), [state.isEmpty, logs]);

  const filteredLogs = useMemo(() => {
    if (levelFilter === "All") return activeLogs;
    return activeLogs.filter((entry) => entry.level === levelFilter);
  }, [activeLogs, levelFilter]);

  const summary = useMemo(() => {
    const infoCount = activeLogs.filter((l) => l.level === "INFO").length;
    const warnCount = activeLogs.filter((l) => l.level === "WARN").length;
    const errorCount = activeLogs.filter((l) => l.level === "ERROR").length;
    const avgLatency =
      activeLogs.length > 0
        ? Math.round(
            activeLogs.reduce((sum, l) => sum + l.latencyMs, 0) / activeLogs.length
          )
        : 0;
    return { infoCount, warnCount, errorCount, avgLatency };
  }, [activeLogs]);

  const chartData = useMemo(() => {
    if (state.isEmpty) return [];
    return SERVICE_BASELINE.map((row) => {
      const extraInfo = logs.filter(
        (l) => l.service === row.service && l.level === "INFO"
      ).length;
      const extraIssues = logs.filter(
        (l) => l.service === row.service && l.level !== "INFO"
      ).length;
      return {
        ...row,
        info: row.info + extraInfo,
        issues: row.issues + extraIssues,
        total: row.info + row.issues + extraInfo + extraIssues,
      };
    });
  }, [state.isEmpty, logs]);

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
  const tableState = getBlockState(state.status, filteredLogs);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentLogsGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Recent log events",
      items: activeLogs.slice(0, 5).map((entry) => ({
        id: `recent-log-${entry.id}`,
        label: entry.message,
        description: `${entry.service} · ${entry.traceId}`,
        meta: `${entry.level} · ${entry.latencyMs}ms`,
        icon: <TerminalIcon />,
        onSelect: () => setSelectedLog(entry),
      })),
    }),
    [activeLogs]
  );

  const searchLogs = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentLogsGroup];
    const matches = activeLogs.filter((entry) =>
      `${entry.service} ${entry.message} ${entry.traceId} ${entry.level}`
        .toLowerCase()
        .includes(needle)
    );
    if (matches.length === 0) return [];
    return [
      {
        heading: "Log stream matches",
        items: matches.slice(0, 10).map((entry) => ({
          id: `search-log-${entry.id}`,
          label: entry.message,
          description: `${entry.service} · ${entry.traceId}`,
          meta: `${entry.level} · ${entry.latencyMs}ms`,
          icon: <TerminalIcon />,
          onSelect: () => setSelectedLog(entry),
        })),
      },
    ];
  };

  const handleDownloadLogs = () => {
    const content = filteredLogs
      .map(
        (l) =>
          `${l.timestamp} [${l.level}] ${l.service} (${l.traceId}) ${l.latencyMs}ms - ${l.message}`
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hamzet-wasel-runtime.log";
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`Downloaded ${filteredLogs.length} log entries (.log).`);
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
          {...ingestedEventsKPIProps}
          data={state.isEmpty ? [] : ingestedEventsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...tracedSpansKPIProps}
          data={state.isEmpty ? [] : tracedSpansKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...warningSpikesKPIProps}
          data={state.isEmpty ? [] : warningSpikesKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...errorLogsKPIProps}
          data={state.isEmpty ? [] : errorLogsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Analytics Row: Log Volume by Service + Noisiest Services */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Telemetry volume by service
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Standard INFO throughput compared with WARN and ERROR log spikes.
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
                    label="Updating telemetry volume"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">
                            Buffered events
                          </dt>
                          <dd>
                            <KPIValue
                              value={activeLogs.length}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs">
                              {streaming ? "Live tail streaming" : "Stream paused"}
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Errors &amp; warns
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.errorCount + summary.warnCount}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.errorCount} errors · {summary.warnCount} warnings
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Avg trace latency
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.avgLatency}
                              format={(v) => `${formatNumber(v)}ms`}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs">
                              Across buffered spans
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "INFO events" },
                            {
                              color: "var(--color-chart-5)",
                              label: "WARN / ERROR",
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
                                aria-label="Log throughput by service"
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
                                  tickFormatter={(v: number) => formatCompact(v)}
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
                                        `${formatNumber(value)} events`
                                      }
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="info"
                                  name="INFO events"
                                  stackId="logs"
                                  fill="var(--color-chart-2)"
                                  radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                  dataKey="issues"
                                  name="WARN / ERROR"
                                  stackId="logs"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Log events by service"
                            columns={[
                              { key: "service", label: "Service" },
                              {
                                key: "info",
                                label: "INFO",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "issues",
                                label: "WARN / ERROR",
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
                        Noisiest services
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Microservices ordered by ingested log volume and average span latency.
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
                    label="Updating noisy services"
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
                                  <span>{row.issues} warns/errors</span>
                                  <span>{row.avgMs}ms avg</span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{formatCompact(row.total)}</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  events
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground text-sm">
                          {rankedServices[0]
                            ? `${rankedServices[0].service} leads log ingestion (${formatNumber(rankedServices[0].total)} events in rolling window).`
                            : "Enable streaming to inspect live service logs."}
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

      {/* Structured Log Stream Directory */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">Structured log stream</h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeLogs.length} buffered{" "}
                      {activeLogs.length === 1 ? "entry" : "entries"} · click any message
                      to inspect its JSON payload and trace ID.
                    </p>
                  </BlockReady>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isTableBusy && <BlockBusyIndicator />}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={state.isLoading}
                    onClick={() => {
                      setStreaming((prev) => !prev);
                      setNotice(
                        streaming ? "Paused live log tail." : "Resumed live log tail."
                      );
                    }}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {streaming ? (
                      <>
                        <PauseIcon className="size-3.5" />
                        Pause stream
                      </>
                    ) : (
                      <>
                        <PlayIcon className="size-3.5" />
                        Resume stream
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={state.isLoading || filteredLogs.length === 0}
                    onClick={handleDownloadLogs}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <DownloadIcon className="size-3.5" />
                    Download .log
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    className="h-8 px-2.5"
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating log stream">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full items-stretch sm:w-auto"
                      emptyMessage="No matching log entries found."
                      placeholder="Search service, trace ID, message..."
                      recent={recentLogsGroup}
                      search={searchLogs}
                      showStatus={false}
                      title="Search live logs"
                      triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div
                      role="tablist"
                      aria-label="Filter logs by severity"
                      className="bg-muted inline-flex items-center rounded-lg p-0.5"
                    >
                      {(
                        [
                          { id: "All", label: `All (${activeLogs.length})` },
                          { id: "INFO", label: `INFO (${summary.infoCount})` },
                          { id: "WARN", label: `WARN (${summary.warnCount})` },
                          { id: "ERROR", label: `ERROR (${summary.errorCount})` },
                        ] as const
                      ).map((tab) => {
                        const active = levelFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setLevelFilter(tab.id)}
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

                  <div className="border-t pt-3">
                    {tableState === "loading" ? (
                      <BlockStateRows rows={5} />
                    ) : (
                      <Widget1
                        embedded
                        showPauseControl={false}
                        title="Live Console"
                        isPaused={!streaming}
                        onClear={() => {
                          setLogs([]);
                          setNotice("Cleared live console buffer.");
                        }}
                        logs={filteredLogs.map((entry) => ({
                          id: entry.id,
                          timestamp: entry.timestamp,
                          method: entry.level,
                          status: entry.service,
                          path: entry.message,
                          latency: `${entry.latencyMs}ms`,
                        }))}
                        onSelectLog={(item) => {
                          const found = activeLogs.find((l) => l.id === item.id);
                          if (found) setSelectedLog(found);
                        }}
                        emptyMessage={
                          activeLogs.length === 0
                            ? "Waiting for incoming log events..."
                            : "No log entries match the active severity filter."
                        }
                      />
                    )}
                  </div>
                </div>
              </DashboardBusy>
            </section>
          </CardContent>
        </Card>
      </BlockStateProvider>

      {/* Trace Payload Inspector Dialog */}
      <Dialog
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm">{selectedLog.traceId}</span>
                  <StatusLabel tone={LEVEL_TONE[selectedLog.level]}>
                    {selectedLog.level}
                  </StatusLabel>
                </DialogTitle>
                <DialogDescription>
                  {selectedLog.service} · {selectedLog.timestamp} ·{" "}
                  {selectedLog.latencyMs}ms
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {selectedLog.message}
                </p>
                <pre className="bg-muted/40 overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-relaxed text-foreground">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
              <DialogFooter>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(
                      JSON.stringify(selectedLog, null, 2)
                    );
                    setNotice("Copied structured log JSON.");
                  }}
                >
                  <CopyIcon className="size-3.5" />
                  Copy JSON
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

export default DevOpsLogsView;
