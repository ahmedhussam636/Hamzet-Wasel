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
  Heatmap2,
  heatmap2ExampleProps,
} from "@/components/dashboardblocks/heatmap/heatmap-02";
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
import { RetentionBar } from "@/components/dashboardblocks/retention";
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
import {
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/dashboardblocks/format";
import { initialCohorts } from "@/src/metadata/cohorts-data";
import type { CohortItem } from "@/src/metadata/types";
import {
  CheckCircle2Icon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
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

const STORAGE_KEY = "hamzet-wasel-cohorts-v1";

const trackedCohortUsersKPIProps: LineChartKPI1Props = {
  title: "Tracked cohort users",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 44_200, value: 48_900 },
    { label: "Tue", previous: 45_100, value: 49_700 },
    { label: "Wed", previous: 44_800, value: 50_300 },
    { label: "Thu", previous: 46_400, value: 51_600 },
    { label: "Fri", previous: 47_200, value: 52_900 },
    { label: "Sat", previous: 41_900, value: 46_800 },
    { label: "Sun", previous: 41_100, value: 45_950 },
  ],
};

const blendedLtvKPIProps: AreaChartKPI2Props = {
  title: "Blended cohort LTV",
  comparison: "last week",
  format: "currency",
  previous: 492,
  data: [
    { label: "Mon", value: 528 },
    { label: "Tue", value: 541 },
    { label: "Wed", value: 536 },
    { label: "Thu", value: 554 },
    { label: "Fri", value: 568 },
    { label: "Sat", value: 549 },
    { label: "Sun", value: 562 },
  ],
};

const week1RetentionKPIProps: LineChartKPI1Props = {
  title: "Week-1 retention avg",
  comparison: "last week",
  currentLabel: "This week",
  format: "percent",
  data: [
    { label: "Mon", previous: 0.54, value: 0.58 },
    { label: "Tue", previous: 0.55, value: 0.59 },
    { label: "Wed", previous: 0.54, value: 0.6 },
    { label: "Thu", previous: 0.56, value: 0.61 },
    { label: "Fri", previous: 0.57, value: 0.62 },
    { label: "Sat", previous: 0.55, value: 0.6 },
    { label: "Sun", previous: 0.56, value: 0.61 },
  ],
};

const cohortMrrKPIProps: AreaChartKPI2Props = {
  title: "Cohort expansion MRR",
  comparison: "last week",
  format: "currency",
  previous: 34_800,
  data: [
    { label: "Mon", value: 5_240 },
    { label: "Tue", value: 5_680 },
    { label: "Wed", value: 5_490 },
    { label: "Thu", value: 6_120 },
    { label: "Fri", value: 6_540 },
    { label: "Sat", value: 4_890 },
    { label: "Sun", value: 5_360 },
  ],
};

type CohortFilter = "all" | CohortItem["status"];

const STATUS_META: Record<
  CohortItem["status"],
  { label: string; tone: StatusTone }
> = {
  growing: { label: "Growing", tone: "good" },
  stable: { label: "Stable", tone: "info" },
  declining: { label: "Declining", tone: "warning" },
};

const CHANNEL_OPTIONS = [
  "Organic Search",
  "Paid Social",
  "Direct Traffic",
  "Referral Community",
  "Email / Affiliate",
  "Partner Ecosystem",
];

function parseCurrency(value: string): number {
  const num = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function parsePercentValue(value: string): number {
  const num = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(num) ? num : 0;
}

function shortChannelName(channel: string): string {
  if (channel.length <= 14) return channel;
  return `${channel.slice(0, 13)}…`;
}

const FORMULA_START = /^[=+\-@\t\r]/;
function csvCell(value: string | number): string {
  const text =
    typeof value === "string" && FORMULA_START.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportCohortsCsv(rows: CohortItem[], filename = "cohorts.csv") {
  const headers: (keyof CohortItem)[] = [
    "id",
    "name",
    "channel",
    "userCount",
    "avgLtv",
    "retentionRate",
    "status",
  ];
  const csv = [headers, ...rows.map((row) => headers.map((key) => row[key]))]
    .map((line) => line.map(csvCell).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function loadStoredCohorts(): CohortItem[] {
  if (typeof window === "undefined") return initialCohorts;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialCohorts;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return initialCohorts;
}

interface CohortFormState {
  name: string;
  channel: string;
  userCount: number;
  avgLtv: number;
  retentionRate: number;
  status: CohortItem["status"];
}

const EMPTY_FORM: CohortFormState = {
  name: "",
  channel: CHANNEL_OPTIONS[0],
  userCount: 4_500,
  avgLtv: 540,
  retentionRate: 64.0,
  status: "growing",
};

export function CohortsView(props: DashboardBlockStateProps = {}) {
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

  const [cohorts, setCohorts] = useState<CohortItem[]>(loadStoredCohorts);
  const [hasModified, setHasModified] = useState(false);
  const [filter, setFilter] = useState<CohortFilter>("all");

  // Dialog states
  const [viewingCohort, setViewingCohort] = useState<CohortItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<CohortItem | null>(null);
  const [formState, setFormState] = useState<CohortFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CohortItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cohorts));
    } catch {
      // Ignore storage write errors
    }
  }, [cohorts]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const activeCohorts = useMemo(
    () => (state.isEmpty ? [] : cohorts),
    [state.isEmpty, cohorts]
  );

  const filteredCohorts = useMemo(() => {
    if (filter === "all") return activeCohorts;
    return activeCohorts.filter((cohort) => cohort.status === filter);
  }, [activeCohorts, filter]);

  const summary = useMemo(() => {
    const totalUsers = activeCohorts.reduce((sum, item) => sum + item.userCount, 0);
    const weightedLtvNumerator = activeCohorts.reduce(
      (sum, item) => sum + item.userCount * parseCurrency(item.avgLtv),
      0
    );
    const weightedRetentionNumerator = activeCohorts.reduce(
      (sum, item) => sum + item.userCount * parsePercentValue(item.retentionRate),
      0
    );
    const avgLtv = totalUsers > 0 ? weightedLtvNumerator / totalUsers : 0;
    const avgRetention =
      totalUsers > 0 ? weightedRetentionNumerator / totalUsers : 0;
    const bestRetention =
      activeCohorts.length > 0
        ? activeCohorts.reduce((best, item) =>
            parsePercentValue(item.retentionRate) >
            parsePercentValue(best.retentionRate)
              ? item
              : best
          )
        : undefined;
    const growingCount = activeCohorts.filter((c) => c.status === "growing").length;
    const stableCount = activeCohorts.filter((c) => c.status === "stable").length;
    const decliningCount = activeCohorts.filter((c) => c.status === "declining").length;

    return {
      totalUsers,
      avgLtv,
      avgRetention,
      bestRetention,
      growingCount,
      stableCount,
      decliningCount,
    };
  }, [activeCohorts]);

  const chartData = useMemo(() => {
    return activeCohorts.map((cohort) => {
      const ltv = parseCurrency(cohort.avgLtv);
      const retention = parsePercentValue(cohort.retentionRate);
      // Estimated blended CAC vs LTV benchmark by channel efficiency
      const estimatedCac = Math.max(24, Math.round(ltv * (0.14 - (retention - 50) * 0.0012)));
      return {
        id: cohort.id,
        name: cohort.name,
        channel: cohort.channel,
        shortChannel: shortChannelName(cohort.channel),
        ltv,
        cac: estimatedCac,
        users: cohort.userCount,
      };
    });
  }, [activeCohorts]);

  const rankedCohorts = useMemo(() => {
    const maxLtv = Math.max(
      1,
      ...activeCohorts.map((cohort) => parseCurrency(cohort.avgLtv))
    );
    return [...activeCohorts]
      .sort((a, b) => parseCurrency(b.avgLtv) - parseCurrency(a.avgLtv))
      .map((cohort) => ({
        ...cohort,
        ltvNum: parseCurrency(cohort.avgLtv),
        barPct: (parseCurrency(cohort.avgLtv) / maxLtv) * 100,
      }));
  }, [activeCohorts]);

  const chartState = getBlockState(state.status, activeCohorts);
  const tableState = getBlockState(state.status, filteredCohorts);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentCohortsGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Acquisition cohorts",
      items: activeCohorts.slice(0, 5).map((cohort) => ({
        id: `recent-cohort-${cohort.id}`,
        label: cohort.name,
        description: `${cohort.channel} · ${cohort.retentionRate} retention`,
        meta: `${cohort.avgLtv} LTV`,
        icon: <LayersIcon />,
        onSelect: () => setViewingCohort(cohort),
      })),
    }),
    [activeCohorts]
  );

  const searchCohorts = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentCohortsGroup];

    const matches = activeCohorts.filter((cohort) =>
      `${cohort.name} ${cohort.channel} ${cohort.avgLtv} ${cohort.retentionRate} ${cohort.status}`
        .toLowerCase()
        .includes(needle)
    );

    if (matches.length === 0) return [];

    return [
      {
        heading: "Cohorts",
        items: matches.map((cohort) => ({
          id: `search-cohort-${cohort.id}`,
          label: cohort.name,
          description: `${cohort.channel} · ${formatNumber(cohort.userCount)} users`,
          meta: `${cohort.avgLtv} · ${cohort.retentionRate}`,
          icon: <LayersIcon />,
          onSelect: () => setViewingCohort(cohort),
        })),
      },
    ];
  };

  const openCreateDialog = () => {
    setEditingCohort(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditDialog = (cohort: CohortItem) => {
    setViewingCohort(null);
    setEditingCohort(cohort);
    setFormState({
      name: cohort.name,
      channel: cohort.channel,
      userCount: cohort.userCount,
      avgLtv: parseCurrency(cohort.avgLtv),
      retentionRate: parsePercentValue(cohort.retentionRate),
      status: cohort.status,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleDuplicateCohort = (cohort: CohortItem) => {
    const copy: CohortItem = {
      ...cohort,
      id: `coh-${Date.now().toString(36)}`,
      name: `${cohort.name} (Copy)`,
    };
    setCohorts((prev) => [copy, ...prev]);
    setHasModified(true);
    setNotice(`Duplicated "${cohort.name}".`);
  };

  const handleSaveCohort = (e: FormEvent) => {
    e.preventDefault();
    const name = formState.name.trim();
    const channel = formState.channel.trim() || "Direct Traffic";
    const userCount = Math.max(0, Math.round(Number(formState.userCount) || 0));
    const avgLtvNum = Math.max(0, Math.round(Number(formState.avgLtv) || 0));
    const retentionNum = Math.min(
      100,
      Math.max(0, Number(formState.retentionRate) || 0)
    );

    if (!name) {
      setFormError("Cohort name is required.");
      return;
    }

    if (editingCohort) {
      const updated: CohortItem = {
        ...editingCohort,
        name,
        channel,
        userCount,
        avgLtv: `$${avgLtvNum.toLocaleString("en-US")}`,
        retentionRate: `${retentionNum.toFixed(1)}%`,
        status: formState.status,
      };
      setCohorts((prev) =>
        prev.map((item) => (item.id === editingCohort.id ? updated : item))
      );
      setNotice(`Updated cohort "${name}".`);
    } else {
      const created: CohortItem = {
        id: `coh-${Date.now().toString(36)}`,
        name,
        channel,
        userCount,
        avgLtv: `$${avgLtvNum.toLocaleString("en-US")}`,
        retentionRate: `${retentionNum.toFixed(1)}%`,
        status: formState.status,
      };
      setCohorts((prev) => [created, ...prev]);
      setNotice(`Created cohort "${name}".`);
    }

    setHasModified(true);
    setFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setCohorts((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setViewingCohort(null);
    setHasModified(true);
    setNotice(`Deleted cohort "${deleteTarget.name}".`);
    setDeleteTarget(null);
  };

  const handleResetCohorts = () => {
    setCohorts(initialCohorts);
    setHasModified(false);
    setFilter("all");
    setNotice("Restored default acquisition cohorts.");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Subtle action confirmation notice */}
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
          {...trackedCohortUsersKPIProps}
          data={state.isEmpty ? [] : trackedCohortUsersKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...blendedLtvKPIProps}
          data={state.isEmpty ? [] : blendedLtvKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...week1RetentionKPIProps}
          data={state.isEmpty ? [] : week1RetentionKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...cohortMrrKPIProps}
          data={state.isEmpty ? [] : cohortMrrKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Retention by cohort (kept as requested) */}
      <Heatmap2
        {...heatmap2ExampleProps}
        cohorts={state.isEmpty ? [] : heatmap2ExampleProps.cohorts}
        refreshing={state.refreshing}
        status={state.status}
        errorMessage={state.errorMessage}
      />

      {/* Analytics Row: Channel LTV vs CAC Chart & Top Cohorts Leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        LTV &amp; acquisition efficiency by channel
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Customer lifetime value compared with estimated blended CAC per channel.
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
                    label="Updating channel efficiency"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">
                            Cohort users
                          </dt>
                          <dd>
                            <KPIValue
                              value={summary.totalUsers}
                              format={(v) => formatCompact(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              Across {formatNumber(activeCohorts.length)} channels
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Weighted LTV
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={Math.round(summary.avgLtv)}
                              format={(v) => formatCurrency(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.avgRetention.toFixed(1)}% avg retention
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Best retention
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={
                                summary.bestRetention
                                  ? parsePercentValue(summary.bestRetention.retentionRate) /
                                    100
                                  : undefined
                              }
                              format={(v) =>
                                formatPercent(v, { maximumFractionDigits: 1 })
                              }
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground truncate text-xs">
                              {summary.bestRetention?.channel ?? "—"}
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Avg LTV ($)" },
                            {
                              color: "var(--color-muted-foreground)",
                              label: "Est. CAC ($)",
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
                            <ResponsiveContainer initialDimension={{ width: 480, height: 224 }} width="100%" height="100%">
                              <BarChart
                                aria-label="Channel LTV vs CAC"
                                data={chartData}
                                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                              >
                                <defs>
                                  <ChartHatch
                                    color="var(--color-muted-foreground)"
                                    id={hatchId}
                                  />
                                </defs>
                                <CartesianGrid {...chartGridProps} />
                                <XAxis
                                  {...chartAxisProps}
                                  dataKey="shortChannel"
                                  interval={0}
                                />
                                <YAxis
                                  {...chartAxisProps}
                                  tickFormatter={(value: number) =>
                                    formatCurrency(value)
                                  }
                                  width={chartValueAxisWidth}
                                />
                                <Tooltip
                                  cursor={chartBarCursor}
                                  content={({ active, payload }) => (
                                    <ChartTooltipContent
                                      active={active}
                                      label={String(payload?.[0]?.payload?.channel ?? "")}
                                      payload={payload}
                                      valueFormatter={(value) => formatCurrency(value)}
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="cac"
                                  name="Est. CAC ($)"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                  dataKey="ltv"
                                  name="Avg LTV ($)"
                                  fill="var(--color-chart-2)"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Cohort channel LTV and CAC"
                            columns={[
                              { key: "channel", label: "Channel" },
                              {
                                key: "ltv",
                                label: "Avg LTV",
                                format: (v) => formatCurrency(v),
                              },
                              {
                                key: "cac",
                                label: "Est. CAC",
                                format: (v) => formatCurrency(v),
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
                        Top value cohorts
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Acquisition cohorts ranked by average customer lifetime value.
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
                    label="Updating top cohorts"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={leaderboardRefreshKey}>
                          {rankedCohorts.map((cohort, index) => (
                            <LeaderboardItem key={cohort.id} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={cohort.barPct} delay={index * 60} />
                              <LeaderboardLabel>
                                <button
                                  type="button"
                                  onClick={() => setViewingCohort(cohort)}
                                  className="block max-w-full cursor-pointer truncate text-left font-medium hover:underline"
                                >
                                  {cohort.name}
                                </button>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>{cohort.channel}</span>
                                  <span>{formatCompact(cohort.userCount)} users</span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{cohort.avgLtv}</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {cohort.retentionRate} ret.
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground border-t pt-3 text-sm">
                          {rankedCohorts[0]
                            ? `${rankedCohorts[0].channel} generates the highest LTV (${rankedCohorts[0].avgLtv}) at ${rankedCohorts[0].retentionRate} retention.`
                            : "Add an acquisition cohort to benchmark channel LTV."}
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

      {/* Acquisition Cohorts Directory */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">Acquisition cohorts</h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeCohorts.length}{" "}
                      {activeCohorts.length === 1 ? "cohort" : "cohorts"} covering{" "}
                      {formatNumber(summary.totalUsers)} attributed users.
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
                      onClick={handleResetCohorts}
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
                    disabled={state.isLoading || activeCohorts.length === 0}
                    onClick={() => {
                      exportCohortsCsv(filteredCohorts, "cohorts.csv");
                      setNotice("Exported cohorts to CSV.");
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
                    onClick={openCreateDialog}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <PlusIcon className="size-3.5" />
                    New cohort
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    className="h-8 px-2.5"
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating cohorts">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  {/* Toolbar: CommandMenu2 + Status Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full sm:w-auto items-stretch"
                      emptyMessage="No matching cohorts found."
                      placeholder="Search cohorts or channels..."
                      recent={recentCohortsGroup}
                      search={searchCohorts}
                      showStatus={false}
                      title="Search cohorts"
                      triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div
                      role="tablist"
                      aria-label="Filter cohorts by status"
                      className="bg-muted inline-flex items-center rounded-lg p-0.5"
                    >
                      {(
                        [
                          { id: "all", label: `All (${activeCohorts.length})` },
                          { id: "growing", label: `Growing (${summary.growingCount})` },
                          { id: "stable", label: `Stable (${summary.stableCount})` },
                          {
                            id: "declining",
                            label: `Declining (${summary.decliningCount})`,
                          },
                        ] as const
                      ).map((tab) => {
                        const active = filter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setFilter(tab.id)}
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
                    <DataTable density="compact" caption="Acquisition cohorts directory">
                      <DataTableHeader>
                        <DataTableRow>
                          <DataTableHead>Cohort</DataTableHead>
                          <DataTableHead>Channel</DataTableHead>
                          <DataTableHead align="end">Users</DataTableHead>
                          <DataTableHead align="end">Avg LTV</DataTableHead>
                          <DataTableHead align="end">Retention</DataTableHead>
                          <DataTableHead align="end">Status</DataTableHead>
                          <DataTableHead align="end">
                            <span className="sr-only">Actions</span>
                          </DataTableHead>
                        </DataTableRow>
                      </DataTableHeader>
                      <DataTableBody>
                        <DataTableStateRows colSpan={7} rows={5} />
                        {!tableState &&
                          filteredCohorts.map((cohort) => {
                            const statusMeta = STATUS_META[cohort.status];
                            const retentionNum = parsePercentValue(cohort.retentionRate);
                            return (
                              <DataTableRow key={cohort.id}>
                                <DataTableCell primary truncate className="max-w-xs">
                                  <button
                                    type="button"
                                    onClick={() => setViewingCohort(cohort)}
                                    className="group block w-full cursor-pointer text-left focus-visible:outline-none"
                                  >
                                    <span className="block truncate font-medium group-hover:underline">
                                      {cohort.name}
                                    </span>
                                  </button>
                                </DataTableCell>

                                <DataTableCell className="text-muted-foreground whitespace-nowrap">
                                  {cohort.channel}
                                </DataTableCell>

                                <DataTableCell align="end">
                                  {formatNumber(cohort.userCount)}
                                </DataTableCell>

                                <DataTableCell align="end" className="font-medium">
                                  {cohort.avgLtv}
                                </DataTableCell>

                                <DataTableCell align="end">
                                  <div className="ml-auto flex max-w-28 items-center justify-end gap-2">
                                    <RetentionBar
                                      className="h-1.5 w-14"
                                      value={retentionNum / 100}
                                    />
                                    <span className="tabular-nums">
                                      {cohort.retentionRate}
                                    </span>
                                  </div>
                                </DataTableCell>

                                <DataTableCell align="end">
                                  <StatusLabel tone={statusMeta.tone}>
                                    {statusMeta.label}
                                  </StatusLabel>
                                </DataTableCell>

                                <DataTableCell align="end" className="w-10">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon-sm"
                                          aria-label={`Actions for ${cohort.name}`}
                                          className="size-7 cursor-pointer"
                                        />
                                      }
                                    >
                                      <MoreHorizontalIcon className="size-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                          {cohort.channel}
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => setViewingCohort(cohort)}
                                        >
                                          <EyeIcon className="size-3.5" />
                                          View details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => openEditDialog(cohort)}
                                        >
                                          <PencilIcon className="size-3.5" />
                                          Edit cohort
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDuplicateCohort(cohort)}
                                        >
                                          <CopyIcon className="size-3.5" />
                                          Duplicate
                                        </DropdownMenuItem>
                                      </DropdownMenuGroup>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuGroup>
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() => setDeleteTarget(cohort)}
                                        >
                                          <Trash2Icon className="size-3.5" />
                                          Delete cohort
                                        </DropdownMenuItem>
                                      </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </DataTableCell>
                              </DataTableRow>
                            );
                          })}
                      </DataTableBody>
                    </DataTable>
                  </div>
                </div>
              </DashboardBusy>
            </section>
          </CardContent>
        </Card>
      </BlockStateProvider>

      {/* Cohort Details Dialog */}
      <Dialog
        open={Boolean(viewingCohort)}
        onOpenChange={(open) => {
          if (!open) setViewingCohort(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {viewingCohort && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <DialogTitle>{viewingCohort.name}</DialogTitle>
                  <StatusLabel tone={STATUS_META[viewingCohort.status].tone}>
                    {STATUS_META[viewingCohort.status].label}
                  </StatusLabel>
                </div>
                <DialogDescription>
                  Acquisition channel: {viewingCohort.channel}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-4 border-y py-4 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Cohort users</dt>
                  <dd className="font-mono font-semibold tabular-nums">
                    {formatNumber(viewingCohort.userCount)}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Average LTV</dt>
                  <dd className="font-mono font-semibold tabular-nums">
                    {viewingCohort.avgLtv}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Retention rate</dt>
                  <dd className="font-mono font-semibold tabular-nums">
                    {viewingCohort.retentionRate}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Estimated revenue</dt>
                  <dd className="font-mono font-semibold tabular-nums">
                    {formatCurrency(
                      viewingCohort.userCount * parseCurrency(viewingCohort.avgLtv)
                    )}
                  </dd>
                </div>
              </dl>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEditDialog(viewingCohort)}
                >
                  <PencilIcon className="size-3.5" />
                  Edit
                </Button>
                <DialogClose render={<Button type="button" />}>Done</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Cohort Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setFormError(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCohort ? "Edit acquisition cohort" : "New acquisition cohort"}
            </DialogTitle>
            <DialogDescription>
              Track user volume, lifetime value, and retention by acquisition channel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCohort} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cohort-name">Cohort name</Label>
              <Input
                id="cohort-name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. MENA Organic Search Q4"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cohort-channel">Channel</Label>
                <select
                  id="cohort-channel"
                  value={formState.channel}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, channel: e.target.value }))
                  }
                  className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2.5 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  {CHANNEL_OPTIONS.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cohort-status">Momentum</Label>
                <select
                  id="cohort-status"
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: e.target.value as CohortItem["status"],
                    }))
                  }
                  className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2.5 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="growing">Growing</option>
                  <option value="stable">Stable</option>
                  <option value="declining">Declining</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cohort-users">Users</Label>
                <Input
                  id="cohort-users"
                  type="number"
                  min={0}
                  value={formState.userCount}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      userCount: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cohort-ltv">Avg LTV ($)</Label>
                <Input
                  id="cohort-ltv"
                  type="number"
                  min={0}
                  value={formState.avgLtv}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      avgLtv: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cohort-ret">Retention (%)</Label>
                <Input
                  id="cohort-ret"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={formState.retentionRate}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      retentionRate: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            {formError && (
              <p className="text-destructive text-xs font-medium">{formError}</p>
            )}

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editingCohort ? "Save changes" : "Create cohort"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete cohort</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium">{deleteTarget?.name}</span> from the
              acquisition cohorts directory? You can reset defaults anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CohortsView;
