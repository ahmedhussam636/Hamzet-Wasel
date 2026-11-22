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
import { formatNumber, formatPercent } from "@/lib/dashboardblocks/format";
import {
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  GitBranchIcon,
  MoreHorizontalIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  TerminalIcon,
  WorkflowIcon,
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

type PipelineStatus = "Succeeded" | "Running" | "Failed";
type StageState = "passed" | "running" | "failed" | "skipped";

interface PipelineStage {
  name: string;
  duration: string;
  state: StageState;
}

interface PipelineRun {
  id: string;
  pipeline: string;
  service: string;
  branch: string;
  commit: string;
  author: string;
  status: PipelineStatus;
  duration: string;
  durationSec: number;
  startedAt: string;
  environment: "production" | "staging" | "preview";
  stages: PipelineStage[];
  logs: string[];
}

const STORAGE_KEY = "hamzet-wasel-devops-pipelines-v2";

const INITIAL_RUNS: PipelineRun[] = [
  {
    id: "run-4821",
    pipeline: "core-api-deploy",
    service: "api-gateway",
    branch: "main",
    commit: "a94f21c",
    author: "Karim Hassan",
    status: "Succeeded",
    duration: "3m 42s",
    durationSec: 222,
    startedAt: "14m ago",
    environment: "production",
    stages: [
      { name: "Lint & Typecheck", duration: "38s", state: "passed" },
      { name: "Unit & Integration Tests", duration: "1m 44s", state: "passed" },
      { name: "Docker Build & Sign", duration: "49s", state: "passed" },
      { name: "Rollout eu-west-2", duration: "31s", state: "passed" },
    ],
    logs: [
      "[15:08:11] Checking out main@a94f21c...",
      "[15:08:49] tsc --noEmit passed with 0 errors.",
      "[15:10:33] 412/412 test suites passed (94.8% coverage).",
      "[15:11:22] Pushed ghcr.io/hamzet-wasel/api-gateway:a94f21c",
      "[15:11:53] Rolling update complete: 6/6 pods ready.",
    ],
  },
  {
    id: "run-4820",
    pipeline: "billing-worker-ci",
    service: "billing-worker",
    branch: "feat/invoice-pdf",
    commit: "7c12d8e",
    author: "Nour El-Din",
    status: "Running",
    duration: "1m 19s",
    durationSec: 79,
    startedAt: "2m ago",
    environment: "staging",
    stages: [
      { name: "Lint & Typecheck", duration: "32s", state: "passed" },
      { name: "Unit & Integration Tests", duration: "47s", state: "running" },
      { name: "Docker Build & Sign", duration: "—", state: "skipped" },
      { name: "Deploy staging", duration: "—", state: "skipped" },
    ],
    logs: [
      "[15:22:01] Checking out feat/invoice-pdf@7c12d8e...",
      "[15:22:33] Lint & typecheck clean.",
      "[15:22:35] Running Vitest worker pool (8 shards)...",
    ],
  },
  {
    id: "run-4819",
    pipeline: "realtime-sync-cd",
    service: "realtime-sync",
    branch: "fix/ws-heartbeat",
    commit: "3e88b02",
    author: "Laila Mansour",
    status: "Failed",
    duration: "2m 08s",
    durationSec: 128,
    startedAt: "41m ago",
    environment: "staging",
    stages: [
      { name: "Lint & Typecheck", duration: "29s", state: "passed" },
      { name: "Unit & Integration Tests", duration: "1m 39s", state: "failed" },
      { name: "Docker Build & Sign", duration: "—", state: "skipped" },
      { name: "Deploy staging", duration: "—", state: "skipped" },
    ],
    logs: [
      "[14:40:10] Checking out fix/ws-heartbeat@3e88b02...",
      "[14:40:39] Lint & typecheck passed.",
      "[14:42:18] FAIL tests/ws-reconnect.spec.ts: Timeout after 5000ms waiting for ACK.",
      "[14:42:18] Process exited with code 1.",
    ],
  },
  {
    id: "run-4818",
    pipeline: "analytics-ingest-ci",
    service: "ingest-pipeline",
    branch: "main",
    commit: "d051a77",
    author: "Shaban Haider",
    status: "Succeeded",
    duration: "4m 15s",
    durationSec: 255,
    startedAt: "2h ago",
    environment: "production",
    stages: [
      { name: "Lint & Typecheck", duration: "41s", state: "passed" },
      { name: "Unit & Integration Tests", duration: "2m 02s", state: "passed" },
      { name: "Docker Build & Sign", duration: "54s", state: "passed" },
      { name: "Rollout me-central-1", duration: "38s", state: "passed" },
    ],
    logs: [
      "[13:15:02] Checking out main@d051a77...",
      "[13:17:45] Schema migration dry-run verified.",
      "[13:19:17] Deployed ingest-pipeline@d051a77 to me-central-1.",
    ],
  },
  {
    id: "run-4817",
    pipeline: "edge-auth-deploy",
    service: "auth-service",
    branch: "main",
    commit: "5b94e11",
    author: "Karim Hassan",
    status: "Succeeded",
    duration: "2m 54s",
    durationSec: 174,
    startedAt: "4h ago",
    environment: "production",
    stages: [
      { name: "Lint & Typecheck", duration: "27s", state: "passed" },
      { name: "Unit & Integration Tests", duration: "1m 18s", state: "passed" },
      { name: "Docker Build & Sign", duration: "42s", state: "passed" },
      { name: "Rollout global edge", duration: "27s", state: "passed" },
    ],
    logs: [
      "[11:12:00] Checking out main@5b94e11...",
      "[11:14:54] Global edge propagation complete in 27s.",
    ],
  },
];

const SERVICE_THROUGHPUT_SEED = [
  { service: "api-gateway", short: "api-gw", succeeded: 48, failed: 2, passRate: 96.0 },
  { service: "auth-service", short: "auth", succeeded: 34, failed: 1, passRate: 97.1 },
  { service: "billing-worker", short: "billing", succeeded: 27, failed: 2, passRate: 93.1 },
  { service: "ingest-pipeline", short: "ingest", succeeded: 39, failed: 3, passRate: 92.9 },
  { service: "realtime-sync", short: "realtime", succeeded: 22, failed: 4, passRate: 84.6 },
];

const pipelineRunsKPIProps: LineChartKPI1Props = {
  title: "Weekly pipeline runs",
  comparison: "last week",
  currentLabel: "This week",
  format: "number",
  data: [
    { label: "Mon", previous: 24, value: 29 },
    { label: "Tue", previous: 28, value: 33 },
    { label: "Wed", previous: 26, value: 31 },
    { label: "Thu", previous: 31, value: 36 },
    { label: "Fri", previous: 29, value: 34 },
    { label: "Sat", previous: 14, value: 16 },
    { label: "Sun", previous: 12, value: 15 },
  ],
};

const successfulBuildsKPIProps: AreaChartKPI2Props = {
  title: "Successful builds",
  comparison: "last week",
  format: "number",
  previous: 152,
  data: [
    { label: "Mon", value: 27 },
    { label: "Tue", value: 31 },
    { label: "Wed", value: 29 },
    { label: "Thu", value: 34 },
    { label: "Fri", value: 32 },
    { label: "Sat", value: 15 },
    { label: "Sun", value: 14 },
  ],
};

const productionDeploysKPIProps: LineChartKPI1Props = {
  title: "Production deploys",
  comparison: "last week",
  currentLabel: "This week",
  format: "number",
  data: [
    { label: "Mon", previous: 7, value: 9 },
    { label: "Tue", previous: 9, value: 11 },
    { label: "Wed", previous: 8, value: 10 },
    { label: "Thu", previous: 10, value: 12 },
    { label: "Fri", previous: 9, value: 11 },
    { label: "Sat", previous: 3, value: 4 },
    { label: "Sun", previous: 3, value: 3 },
  ],
};

const failedRunsKPIProps: AreaChartKPI2Props = {
  title: "Failed workflows",
  comparison: "last week",
  format: "number",
  previous: 16,
  data: [
    { label: "Mon", value: 2 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 2 },
    { label: "Thu", value: 2 },
    { label: "Fri", value: 2 },
    { label: "Sat", value: 1 },
    { label: "Sun", value: 1 },
  ],
};

type StatusFilter = "All" | PipelineStatus;

const STATUS_TONE: Record<PipelineStatus, StatusTone> = {
  Succeeded: "good",
  Running: "info",
  Failed: "bad",
};

function loadStoredRuns(): PipelineRun[] {
  if (typeof window === "undefined") return INITIAL_RUNS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_RUNS;
    const parsed = JSON.parse(raw) as PipelineRun[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RUNS;
  } catch {
    return INITIAL_RUNS;
  }
}

function formatSec(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

function exportRunsCsv(rows: PipelineRun[]) {
  const headers = ["ID", "Pipeline", "Service", "Branch", "Commit", "Author", "Env", "Status", "Duration"];
  const lines = [
    headers,
    ...rows.map((r) => [
      r.id,
      r.pipeline,
      r.service,
      r.branch,
      r.commit,
      r.author,
      r.environment,
      r.status,
      r.duration,
    ]),
  ]
    .map((cols) => cols.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([lines], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "ci-cd-pipelines.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function DevOpsPipelinesView(props: DashboardBlockStateProps = {}) {
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

  const [runs, setRuns] = useState<PipelineRun[]>(loadStoredRuns);
  const [hasModified, setHasModified] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [newService, setNewService] = useState("api-gateway");
  const [newBranch, setNewBranch] = useState("main");
  const [newEnv, setNewEnv] = useState<"production" | "staging" | "preview">("staging");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    } catch {
      // Ignore storage write errors
    }
  }, [runs]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeRuns = useMemo(() => (state.isEmpty ? [] : runs), [state.isEmpty, runs]);

  const filteredRuns = useMemo(() => {
    if (statusFilter === "All") return activeRuns;
    return activeRuns.filter((r) => r.status === statusFilter);
  }, [activeRuns, statusFilter]);

  const summary = useMemo(() => {
    const succeeded = activeRuns.filter((r) => r.status === "Succeeded").length;
    const running = activeRuns.filter((r) => r.status === "Running").length;
    const failed = activeRuns.filter((r) => r.status === "Failed").length;
    const finished = succeeded + failed;
    const passRate = finished > 0 ? succeeded / finished : 1;
    const avgDuration =
      activeRuns.length > 0
        ? Math.round(
            activeRuns.reduce((sum, r) => sum + r.durationSec, 0) / activeRuns.length
          )
        : 0;
    const prodCount = activeRuns.filter((r) => r.environment === "production").length;

    return { succeeded, running, failed, passRate, avgDuration, prodCount };
  }, [activeRuns]);

  const chartData = useMemo(() => {
    if (state.isEmpty) return [];
    const extraSucceeded = Math.max(0, runs.length - INITIAL_RUNS.length);
    return SERVICE_THROUGHPUT_SEED.map((row, idx) => ({
      ...row,
      succeeded: idx === 0 ? row.succeeded + extraSucceeded : row.succeeded,
    }));
  }, [state.isEmpty, runs.length]);

  const rankedPipelines = useMemo(() => {
    const maxRuns = Math.max(
      1,
      ...chartData.map((row) => row.succeeded + row.failed)
    );
    return activeRuns.slice(0, 5).map((run, idx) => {
      const svcStats = chartData.find((s) => s.service === run.service);
      const totalSvcRuns = svcStats ? svcStats.succeeded + svcStats.failed : 20;
      return {
        run,
        passRate: svcStats?.passRate ?? 95.0,
        totalSvcRuns,
        barPct: Math.max(25, Math.round((totalSvcRuns / maxRuns) * 100) - idx * 4),
      };
    });
  }, [activeRuns, chartData]);

  const chartState = getBlockState(state.status, chartData);
  const tableState = getBlockState(state.status, filteredRuns);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentRunsGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Recent workflow runs",
      items: activeRuns.slice(0, 5).map((run) => ({
        id: `recent-run-${run.id}`,
        label: run.pipeline,
        description: `${run.service} · ${run.branch} (${run.commit})`,
        meta: `${run.status} · ${run.duration}`,
        icon: <WorkflowIcon />,
        onSelect: () => setSelectedRun(run),
      })),
    }),
    [activeRuns]
  );

  const searchRuns = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentRunsGroup];
    const matches = activeRuns.filter((run) =>
      `${run.id} ${run.pipeline} ${run.service} ${run.branch} ${run.commit} ${run.author} ${run.environment}`
        .toLowerCase()
        .includes(needle)
    );
    if (matches.length === 0) return [];
    return [
      {
        heading: "Workflow runs",
        items: matches.map((run) => ({
          id: `search-run-${run.id}`,
          label: run.pipeline,
          description: `${run.service} · ${run.branch}@${run.commit}`,
          meta: `${run.status} · ${run.duration}`,
          icon: <WorkflowIcon />,
          onSelect: () => setSelectedRun(run),
        })),
      },
    ];
  };

  const handleRerun = (run: PipelineRun) => {
    const nextId = `run-${4822 + runs.length}`;
    const rerun: PipelineRun = {
      ...run,
      id: nextId,
      status: "Succeeded",
      startedAt: "Just now",
      duration: "2m 58s",
      durationSec: 178,
      stages: run.stages.map((s) => ({
        ...s,
        state: "passed",
        duration: s.duration === "—" ? "42s" : s.duration,
      })),
      logs: [
        ...run.logs,
        "[retry] Manual re-run triggered -> all stages passed cleanly.",
      ],
    };
    setRuns((prev) => [rerun, ...prev]);
    setHasModified(true);
    setNotice(`Re-ran workflow "${run.pipeline}" (${nextId}).`);
  };

  const handleTriggerRun = (e: FormEvent) => {
    e.preventDefault();
    const shortHash = Math.random().toString(16).slice(2, 9);
    const branchName = newBranch.trim() || "main";
    const created: PipelineRun = {
      id: `run-${4822 + runs.length}`,
      pipeline: `${newService}-ci`,
      service: newService,
      branch: branchName,
      commit: shortHash,
      author: "Shaban Haider",
      status: "Running",
      duration: "0m 14s",
      durationSec: 14,
      startedAt: "Just now",
      environment: newEnv,
      stages: [
        { name: "Lint & Typecheck", duration: "14s", state: "running" },
        { name: "Unit & Integration Tests", duration: "—", state: "skipped" },
        { name: "Docker Build & Sign", duration: "—", state: "skipped" },
        { name: `Deploy ${newEnv}`, duration: "—", state: "skipped" },
      ],
      logs: [
        `[now] Triggered ${newService}-ci on ${branchName}@${shortHash} (${newEnv})`,
        "[now] Provisioning ephemeral runner...",
      ],
    };
    setRuns((prev) => [created, ...prev]);
    setHasModified(true);
    setTriggerOpen(false);
    setNotice(`Dispatched ${created.pipeline} on ${branchName} (${newEnv}).`);
  };

  const handleReset = () => {
    setRuns(INITIAL_RUNS);
    setHasModified(false);
    setStatusFilter("All");
    setNotice("Restored default CI/CD pipeline runs.");
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
          {...pipelineRunsKPIProps}
          data={state.isEmpty ? [] : pipelineRunsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...successfulBuildsKPIProps}
          data={state.isEmpty ? [] : successfulBuildsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...productionDeploysKPIProps}
          data={state.isEmpty ? [] : productionDeploysKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...failedRunsKPIProps}
          data={state.isEmpty ? [] : failedRunsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Analytics Row: Build Throughput by Service + Top Workflow Pipelines */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Pipeline throughput by service
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Completed builds compared with failed workflow executions per service.
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
                    label="Updating pipeline throughput"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">Pass rate</dt>
                          <dd>
                            <KPIValue
                              value={summary.passRate}
                              format={(v) =>
                                formatPercent(v, { maximumFractionDigits: 1 })
                              }
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.succeeded} succeeded · {summary.failed} failed
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Median duration
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.avgDuration}
                              format={(v) => formatSec(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              Build, test &amp; push
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Active runners
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.running}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.prodCount} prod rollouts queued
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Succeeded runs" },
                            {
                              color: "var(--color-chart-5)",
                              label: "Failed runs",
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
                                aria-label="Pipeline runs by service"
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
                                      valueFormatter={(value) => `${formatNumber(value)} runs`}
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="succeeded"
                                  name="Succeeded runs"
                                  stackId="runs"
                                  fill="var(--color-chart-2)"
                                  radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                  dataKey="failed"
                                  name="Failed runs"
                                  stackId="runs"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="CI/CD runs by service"
                            columns={[
                              { key: "service", label: "Service" },
                              {
                                key: "succeeded",
                                label: "Succeeded",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "failed",
                                label: "Failed",
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
                        Top workflow pipelines
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Active CI/CD pipelines ranked by deployment volume and pass rate.
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
                    label="Updating pipeline rankings"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={leaderboardRefreshKey}>
                          {rankedPipelines.map((entry, index) => (
                            <LeaderboardItem key={entry.run.id} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={entry.barPct} delay={index * 60} />
                              <LeaderboardLabel>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRun(entry.run)}
                                  className="block max-w-full cursor-pointer truncate text-left font-medium hover:underline"
                                >
                                  {entry.run.pipeline}
                                </button>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>{entry.run.service}</span>
                                  <span>{entry.run.environment}</span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{entry.passRate.toFixed(1)}%</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {entry.run.duration}
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground text-sm">
                          {rankedPipelines[0]
                            ? `${rankedPipelines[0].run.pipeline} leads throughput (${rankedPipelines[0].totalSvcRuns} weekly runs at ${rankedPipelines[0].passRate.toFixed(1)}% pass rate).`
                            : "Trigger a workflow run to benchmark pipeline throughput."}
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

      {/* Workflow Runs Directory */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">Workflow runs</h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeRuns.length} tracked{" "}
                      {activeRuns.length === 1 ? "execution" : "executions"} across
                      production, staging, and preview environments.
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
                    disabled={state.isLoading || activeRuns.length === 0}
                    onClick={() => {
                      exportRunsCsv(filteredRuns);
                      setNotice("Exported CI/CD runs to CSV.");
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
                    onClick={() => setTriggerOpen(true)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <PlayIcon className="size-3.5" />
                    Trigger pipeline
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    className="h-8 px-2.5"
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating workflow runs">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full items-stretch sm:w-auto"
                      emptyMessage="No matching workflow runs found."
                      placeholder="Search pipelines, branches, commits..."
                      recent={recentRunsGroup}
                      search={searchRuns}
                      showStatus={false}
                      title="Search pipelines"
                      triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div
                      role="tablist"
                      aria-label="Filter runs by status"
                      className="bg-muted inline-flex items-center rounded-lg p-0.5"
                    >
                      {(
                        [
                          { id: "All", label: `All (${activeRuns.length})` },
                          { id: "Succeeded", label: `Succeeded (${summary.succeeded})` },
                          { id: "Running", label: `Running (${summary.running})` },
                          { id: "Failed", label: `Failed (${summary.failed})` },
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
                    <DataTable density="compact" caption="CI/CD workflow runs">
                      <DataTableHeader>
                        <DataTableRow>
                          <DataTableHead>Pipeline</DataTableHead>
                          <DataTableHead>Branch &amp; Commit</DataTableHead>
                          <DataTableHead>Environment</DataTableHead>
                          <DataTableHead>Stages</DataTableHead>
                          <DataTableHead align="end">Duration</DataTableHead>
                          <DataTableHead align="end">Status</DataTableHead>
                          <DataTableHead align="end">
                            <span className="sr-only">Actions</span>
                          </DataTableHead>
                        </DataTableRow>
                      </DataTableHeader>
                      <DataTableBody>
                        <DataTableStateRows colSpan={7} rows={5} />
                        {!tableState &&
                          filteredRuns.map((run) => (
                            <DataTableRow key={run.id}>
                              <DataTableCell primary truncate className="max-w-xs">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRun(run)}
                                  className="cursor-pointer text-left font-medium hover:underline"
                                >
                                  {run.pipeline}
                                </button>
                                <span className="text-muted-foreground block text-xs">
                                  {run.service} · {run.author}
                                </span>
                              </DataTableCell>
                              <DataTableCell>
                                <div className="flex items-center gap-1.5">
                                  <GitBranchIcon className="text-muted-foreground size-3.5" />
                                  <span className="font-mono text-xs">{run.branch}</span>
                                </div>
                                <span className="text-muted-foreground block font-mono text-xs">
                                  {run.commit} · {run.startedAt}
                                </span>
                              </DataTableCell>
                              <DataTableCell className="text-muted-foreground text-xs capitalize">
                                {run.environment}
                              </DataTableCell>
                              <DataTableCell>
                                <div className="flex items-center gap-1" aria-label="Stage progress">
                                  {run.stages.map((stage) => (
                                    <span
                                      key={stage.name}
                                      title={`${stage.name}: ${stage.state}`}
                                      className={`h-2 w-5 rounded-[2px] ${
                                        stage.state === "passed"
                                          ? "bg-emerald-600 dark:bg-emerald-500"
                                          : stage.state === "running"
                                            ? "bg-sky-500 motion-safe:animate-pulse"
                                            : stage.state === "failed"
                                              ? "bg-red-500 dark:bg-red-400"
                                              : "bg-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </DataTableCell>
                              <DataTableCell
                                align="end"
                                className="text-muted-foreground font-mono text-xs tabular-nums"
                              >
                                {run.duration}
                              </DataTableCell>
                              <DataTableCell align="end">
                                <StatusLabel tone={STATUS_TONE[run.status]}>
                                  {run.status}
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
                                        aria-label={`Actions for ${run.pipeline}`}
                                      />
                                    }
                                  >
                                    <MoreHorizontalIcon className="size-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel>Workflow</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => setSelectedRun(run)}>
                                        <TerminalIcon className="size-3.5" />
                                        Inspect logs
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRerun(run)}>
                                        <RotateCwIcon className="size-3.5" />
                                        Re-run workflow
                                      </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          exportRunsCsv([run]);
                                          setNotice(`Exported ${run.id} metadata.`);
                                        }}
                                      >
                                        <DownloadIcon className="size-3.5" />
                                        Export run CSV
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

      {/* Run Inspector Dialog */}
      <Dialog
        open={selectedRun !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRun(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          {selectedRun && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selectedRun.pipeline}</span>
                  <StatusLabel tone={STATUS_TONE[selectedRun.status]}>
                    {selectedRun.status}
                  </StatusLabel>
                </DialogTitle>
                <DialogDescription>
                  {selectedRun.service} · {selectedRun.branch} ({selectedRun.commit}) ·{" "}
                  {selectedRun.environment}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedRun.stages.map((stage) => (
                    <div
                      key={stage.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                    >
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {stage.state === "passed" ? (
                          <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                        ) : (
                          <ClockIcon className="text-muted-foreground size-3.5" />
                        )}
                        {stage.name}
                      </span>
                      <span className="text-muted-foreground font-mono tabular-nums">
                        {stage.duration}
                      </span>
                    </div>
                  ))}
                </div>
                <pre className="bg-muted/40 max-h-60 overflow-y-auto rounded-lg border p-3 font-mono text-xs leading-relaxed text-foreground">
                  {selectedRun.logs.join("\n")}
                </pre>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleRerun(selectedRun);
                    setSelectedRun(null);
                  }}
                >
                  <RotateCwIcon className="size-3.5" />
                  Re-run workflow
                </Button>
                <DialogClose render={<Button size="sm" />}>Close</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Trigger Pipeline Dialog */}
      <Dialog open={triggerOpen} onOpenChange={setTriggerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trigger manual pipeline</DialogTitle>
            <DialogDescription>
              Dispatch a new build &amp; deploy run for a service branch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTriggerRun} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pl-service">Service</Label>
              <select
                id="pl-service"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-2"
              >
                <option value="api-gateway">api-gateway</option>
                <option value="auth-service">auth-service</option>
                <option value="billing-worker">billing-worker</option>
                <option value="realtime-sync">realtime-sync</option>
                <option value="ingest-pipeline">ingest-pipeline</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pl-branch">Git branch</Label>
                <Input
                  id="pl-branch"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="main"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pl-env">Environment</Label>
                <select
                  id="pl-env"
                  value={newEnv}
                  onChange={(e) =>
                    setNewEnv(e.target.value as "production" | "staging" | "preview")
                  }
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:ring-2"
                >
                  <option value="staging">staging</option>
                  <option value="preview">preview</option>
                  <option value="production">production</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Start run</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DevOpsPipelinesView;
