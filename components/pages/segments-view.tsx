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
import {
  formatCompact,
  formatNumber,
  formatPercent,
} from "@/lib/dashboardblocks/format";
import { initialSegments } from "@/src/metadata/segments-data";
import type { AudienceSegment } from "@/src/metadata/types";
import {
  CheckCircle2Icon,
  DownloadIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  UsersIcon,
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

const STORAGE_KEY = "hamzet-wasel-segments-v1";

const segmentedUsersKPIProps: LineChartKPI1Props = {
  title: "Segmented users",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 31_200, value: 34_100 },
    { label: "Tue", previous: 32_400, value: 35_200 },
    { label: "Wed", previous: 31_900, value: 34_800 },
    { label: "Thu", previous: 33_100, value: 36_150 },
    { label: "Fri", previous: 33_800, value: 37_470 },
    { label: "Sat", previous: 29_500, value: 32_640 },
    { label: "Sun", previous: 28_900, value: 31_980 },
  ],
};

const regionalPipelineKPIProps: AreaChartKPI2Props = {
  title: "MENA growth reach",
  comparison: "last week",
  format: "compact",
  previous: 7_860,
  data: [
    { label: "Mon", value: 1_240 },
    { label: "Tue", value: 1_380 },
    { label: "Wed", value: 1_310 },
    { label: "Thu", value: 1_520 },
    { label: "Fri", value: 1_690 },
    { label: "Sat", value: 1_360 },
    { label: "Sun", value: 1_450 },
  ],
};

const conversionLeadsKPIProps: LineChartKPI1Props = {
  title: "Expansion-ready leads",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 3_620, value: 3_940 },
    { label: "Tue", previous: 3_740, value: 4_060 },
    { label: "Wed", previous: 3_680, value: 4_010 },
    { label: "Thu", previous: 3_810, value: 4_140 },
    { label: "Fri", previous: 3_890, value: 4_210 },
    { label: "Sat", previous: 3_410, value: 3_790 },
    { label: "Sun", previous: 3_320, value: 3_680 },
  ],
};

const recoveredMrrKPIProps: AreaChartKPI2Props = {
  title: "Campaign-attributed MRR",
  comparison: "last week",
  format: "currency",
  previous: 42_100,
  data: [
    { label: "Mon", value: 6_400 },
    { label: "Tue", value: 7_150 },
    { label: "Wed", value: 6_850 },
    { label: "Thu", value: 7_620 },
    { label: "Fri", value: 8_340 },
    { label: "Sat", value: 5_900 },
    { label: "Sun", value: 6_520 },
  ],
};

const RULE_PRESETS = [
  "sessions >= 20/mo AND actions_per_session > 50",
  "country_code IN ['EG', 'SA', 'AE', 'QA', 'KW']",
  "team_members >= 10 AND plan == 'Free'",
  "paid_status == true AND days_inactive >= 10",
  "signup_date >= now() - 7d",
];

type SegmentFilter = "all" | "growing" | "at-risk";

function parseGrowthPct(growth: string): number {
  const num = Number.parseFloat(growth.replace("%", ""));
  return Number.isFinite(num) ? num : 0;
}

function getGrowthTone(growth: string): StatusTone {
  const value = parseGrowthPct(growth);
  if (value < 0) return "bad";
  if (value >= 20) return "good";
  return "info";
}

function shortSegmentName(name: string): string {
  if (name.length <= 15) return name;
  return `${name.slice(0, 14)}…`;
}

const FORMULA_START = /^[=+\-@\t\r]/;
function csvCell(value: string | number): string {
  const text =
    typeof value === "string" && FORMULA_START.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportSegmentsCsv(rows: AudienceSegment[], filename = "segments.csv") {
  const headers: (keyof AudienceSegment)[] = [
    "id",
    "name",
    "description",
    "criteria",
    "usersCount",
    "growth",
    "lastUpdated",
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

function loadStoredSegments(): AudienceSegment[] {
  if (typeof window === "undefined") return initialSegments;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSegments;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return initialSegments;
}

interface SegmentFormState {
  name: string;
  description: string;
  criteria: string;
  usersCount: number;
  growth: string;
}

const EMPTY_FORM: SegmentFormState = {
  name: "",
  description: "",
  criteria: RULE_PRESETS[0],
  usersCount: 1_250,
  growth: "+14.0%",
};

export function SegmentsView(props: DashboardBlockStateProps = {}) {
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

  const [segments, setSegments] = useState<AudienceSegment[]>(loadStoredSegments);
  const [hasModified, setHasModified] = useState(false);
  const [filter, setFilter] = useState<SegmentFilter>("all");

  // Dialog states
  const [viewingSegment, setViewingSegment] = useState<AudienceSegment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<AudienceSegment | null>(null);
  const [formState, setFormState] = useState<SegmentFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AudienceSegment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
    } catch {
      // Ignore storage write errors
    }
  }, [segments]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const activeSegments = useMemo(
    () => (state.isEmpty ? [] : segments),
    [state.isEmpty, segments]
  );

  const filteredSegments = useMemo(() => {
    if (filter === "growing") {
      return activeSegments.filter((seg) => parseGrowthPct(seg.growth) >= 0);
    }
    if (filter === "at-risk") {
      return activeSegments.filter((seg) => parseGrowthPct(seg.growth) < 0);
    }
    return activeSegments;
  }, [activeSegments, filter]);

  const summary = useMemo(() => {
    const totalUsers = activeSegments.reduce((sum, seg) => sum + seg.usersCount, 0);
    const fastest =
      activeSegments.length > 0
        ? activeSegments.reduce((best, seg) =>
            parseGrowthPct(seg.growth) > parseGrowthPct(best.growth) ? seg : best
          )
        : undefined;
    const avgSize =
      activeSegments.length > 0 ? Math.round(totalUsers / activeSegments.length) : 0;
    const growingCount = activeSegments.filter(
      (seg) => parseGrowthPct(seg.growth) >= 0
    ).length;

    return {
      totalUsers,
      fastest,
      avgSize,
      growingCount,
      atRiskCount: activeSegments.length - growingCount,
    };
  }, [activeSegments]);

  const chartData = useMemo(() => {
    return activeSegments.map((seg) => {
      const pct = parseGrowthPct(seg.growth) / 100;
      const priorUsers = Math.max(
        0,
        Math.round(seg.usersCount / Math.max(0.2, 1 + pct))
      );
      return {
        id: seg.id,
        name: seg.name,
        shortName: shortSegmentName(seg.name),
        users: seg.usersCount,
        priorUsers,
        growth: seg.growth,
      };
    });
  }, [activeSegments]);

  const rankedSegments = useMemo(() => {
    const total = Math.max(summary.totalUsers, 1);
    return [...activeSegments]
      .sort((a, b) => b.usersCount - a.usersCount)
      .map((seg) => ({
        ...seg,
        sharePct: (seg.usersCount / total) * 100,
      }));
  }, [activeSegments, summary.totalUsers]);

  const chartState = getBlockState(state.status, activeSegments);
  const tableState = getBlockState(state.status, filteredSegments);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentSegmentsGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Active segments",
      items: activeSegments.slice(0, 5).map((seg) => ({
        id: `recent-segment-${seg.id}`,
        label: seg.name,
        description: seg.criteria,
        meta: `${formatCompact(seg.usersCount)} users`,
        icon: <UsersIcon />,
        onSelect: () => setViewingSegment(seg),
      })),
    }),
    [activeSegments]
  );

  const searchSegments = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentSegmentsGroup];

    const matches = activeSegments.filter((seg) =>
      `${seg.name} ${seg.description} ${seg.criteria} ${seg.growth}`
        .toLowerCase()
        .includes(needle)
    );

    if (matches.length === 0) return [];

    return [
      {
        heading: "Segments",
        items: matches.map((seg) => ({
          id: `search-segment-${seg.id}`,
          label: seg.name,
          description: seg.criteria,
          meta: `${formatNumber(seg.usersCount)} · ${seg.growth}`,
          icon: <UsersIcon />,
          onSelect: () => setViewingSegment(seg),
        })),
      },
    ];
  };

  const openCreateDialog = () => {
    setEditingSegment(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditDialog = (segment: AudienceSegment) => {
    setViewingSegment(null);
    setEditingSegment(segment);
    setFormState({
      name: segment.name,
      description: segment.description,
      criteria: segment.criteria,
      usersCount: segment.usersCount,
      growth: segment.growth,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveSegment = (e: FormEvent) => {
    e.preventDefault();
    const name = formState.name.trim();
    const description = formState.description.trim();
    const criteria = formState.criteria.trim();
    const usersCount = Math.max(0, Number(formState.usersCount) || 0);
    const growth = formState.growth.trim() || "+0.0%";

    if (!name) {
      setFormError("Segment name is required.");
      return;
    }
    if (!criteria) {
      setFormError("Rule criteria expression is required.");
      return;
    }

    const normalizedGrowth =
      growth.startsWith("+") || growth.startsWith("-") ? growth : `+${growth}`;

    if (editingSegment) {
      const updated: AudienceSegment = {
        ...editingSegment,
        name,
        description: description || editingSegment.description,
        criteria,
        usersCount,
        growth: normalizedGrowth.endsWith("%")
          ? normalizedGrowth
          : `${normalizedGrowth}%`,
        lastUpdated: "Just now",
      };
      setSegments((prev) =>
        prev.map((seg) => (seg.id === editingSegment.id ? updated : seg))
      );
      setNotice(`Updated segment "${name}".`);
    } else {
      const newSegment: AudienceSegment = {
        id: `seg-${Date.now().toString(36)}`,
        name,
        description:
          description || "Custom behavioral cohort defined for targeted workflows.",
        criteria,
        usersCount,
        growth: normalizedGrowth.endsWith("%")
          ? normalizedGrowth
          : `${normalizedGrowth}%`,
        lastUpdated: "Just now",
        badgeColor: parseGrowthPct(normalizedGrowth) < 0 ? "rose" : "emerald",
      };
      setSegments((prev) => [newSegment, ...prev]);
      setNotice(`Created segment "${name}".`);
    }

    setHasModified(true);
    setFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setSegments((prev) => prev.filter((seg) => seg.id !== deleteTarget.id));
    setViewingSegment(null);
    setHasModified(true);
    setNotice(`Deleted segment "${deleteTarget.name}".`);
    setDeleteTarget(null);
  };

  const handleResetSegments = () => {
    setSegments(initialSegments);
    setHasModified(false);
    setFilter("all");
    setNotice("Restored default audience segments.");
  };

  const handleExportSegment = (seg: AudienceSegment) => {
    const slug = seg.name
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/^-|-$/g, "");
    exportSegmentsCsv([seg], `${slug || seg.id}.csv`);
    setNotice(`Exported "${seg.name}" definition.`);
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
          {...segmentedUsersKPIProps}
          data={state.isEmpty ? [] : segmentedUsersKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...regionalPipelineKPIProps}
          data={state.isEmpty ? [] : regionalPipelineKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...conversionLeadsKPIProps}
          data={state.isEmpty ? [] : conversionLeadsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...recoveredMrrKPIProps}
          data={state.isEmpty ? [] : recoveredMrrKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Middle Row: Audience Reach Chart + Segment Share Leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Audience reach by segment
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Current matched users compared against prior week segment baseline.
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
                    label="Updating segment reach"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">
                            Matched memberships
                          </dt>
                          <dd>
                            <KPIValue
                              value={summary.totalUsers}
                              format={(v) => formatCompact(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              Across {formatNumber(activeSegments.length)} active rules
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Avg. segment size
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.avgSize}
                              format={(v) => formatCompact(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.growingCount} growing · {summary.atRiskCount}{" "}
                              contracting
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Top momentum
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={
                                summary.fastest
                                  ? parseGrowthPct(summary.fastest.growth)
                                  : undefined
                              }
                              format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground truncate text-xs">
                              {summary.fastest?.name ?? "—"}
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Current users" },
                            {
                              color: "var(--color-muted-foreground)",
                              label: "Prior week",
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
                                aria-label="Audience reach by segment"
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
                                  dataKey="shortName"
                                  interval={0}
                                />
                                <YAxis
                                  {...chartAxisProps}
                                  tickFormatter={(value: number) => formatCompact(value)}
                                  width={chartValueAxisWidth}
                                />
                                <Tooltip
                                  cursor={chartBarCursor}
                                  content={({ active, payload }) => (
                                    <ChartTooltipContent
                                      active={active}
                                      label={String(payload?.[0]?.payload?.name ?? "")}
                                      payload={payload}
                                      valueFormatter={(value) =>
                                        `${formatNumber(value)} users`
                                      }
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="priorUsers"
                                  name="Prior week"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                  dataKey="users"
                                  name="Current users"
                                  fill="var(--color-chart-2)"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Segment audience comparison"
                            columns={[
                              { key: "name", label: "Segment" },
                              {
                                key: "users",
                                label: "Current users",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "priorUsers",
                                label: "Prior week",
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
                        Segment distribution
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Share of segmented audience and weekly growth rate per cohort.
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
                    label="Updating segment distribution"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={leaderboardRefreshKey}>
                          {rankedSegments.map((seg, index) => (
                            <LeaderboardItem key={seg.id} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={seg.sharePct} delay={index * 60} />
                              <LeaderboardLabel>
                                <button
                                  type="button"
                                  onClick={() => setViewingSegment(seg)}
                                  className="block max-w-full cursor-pointer truncate text-left font-medium hover:underline"
                                >
                                  {seg.name}
                                </button>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>{seg.growth} growth</span>
                                  <span>Updated {seg.lastUpdated}</span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{formatCompact(seg.usersCount)}</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {formatPercent(seg.sharePct / 100, {
                                    maximumFractionDigits: 1,
                                  })}
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground border-t pt-3 text-sm">
                          {summary.fastest
                            ? `${summary.fastest.name} leads momentum at ${summary.fastest.growth} this week.`
                            : "Create a segment to track audience distribution."}
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

      {/* Segments Directory Table */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">Audience segments</h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeSegments.length}{" "}
                      {activeSegments.length === 1 ? "segment" : "segments"} covering{" "}
                      {formatNumber(summary.totalUsers)} matched users.
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
                      onClick={handleResetSegments}
                      className="h-7 gap-1.5 text-xs"
                    >
                      <RotateCcwIcon className="size-3.5" />
                      Reset
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={state.isLoading || activeSegments.length === 0}
                    onClick={() => {
                      exportSegmentsCsv(filteredSegments, "segments.csv");
                      setNotice("Exported segments to CSV.");
                    }}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <DownloadIcon className="size-3.5" />
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={state.isLoading}
                    onClick={openCreateDialog}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <PlusIcon className="size-3.5" />
                    Create segment
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating segments">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  {/* Toolbar: CommandMenu2 Search + Momentum Filter */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full sm:w-auto items-stretch"
                      emptyMessage="No matching segments found."
                      placeholder="Search segments or rules..."
                      recent={recentSegmentsGroup}
                      search={searchSegments}
                      showStatus={false}
                      title="Search segments"
                      triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div
                      role="tablist"
                      aria-label="Filter segments by momentum"
                      className="bg-muted inline-flex items-center rounded-lg p-0.5"
                    >
                      {(
                        [
                          { id: "all", label: `All (${activeSegments.length})` },
                          { id: "growing", label: `Growing (${summary.growingCount})` },
                          { id: "at-risk", label: `At risk (${summary.atRiskCount})` },
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
                    <DataTable density="compact" caption="Audience segments directory">
                      <DataTableHeader>
                        <DataTableRow>
                          <DataTableHead>Segment</DataTableHead>
                          <DataTableHead>Rule criteria</DataTableHead>
                          <DataTableHead align="end">Users</DataTableHead>
                          <DataTableHead align="end">Growth</DataTableHead>
                          <DataTableHead align="end">Updated</DataTableHead>
                          <DataTableHead align="end">
                            <span className="sr-only">Actions</span>
                          </DataTableHead>
                        </DataTableRow>
                      </DataTableHeader>
                      <DataTableBody>
                        <DataTableStateRows colSpan={6} rows={5} />
                        {!tableState &&
                          filteredSegments.map((seg) => (
                            <DataTableRow key={seg.id}>
                              <DataTableCell primary truncate className="max-w-xs">
                                <button
                                  type="button"
                                  onClick={() => setViewingSegment(seg)}
                                  className="group block w-full cursor-pointer text-left focus-visible:outline-none"
                                >
                                  <span className="block truncate font-medium group-hover:underline">
                                    {seg.name}
                                  </span>
                                  <span className="text-muted-foreground block truncate text-xs font-normal">
                                    {seg.description}
                                  </span>
                                </button>
                              </DataTableCell>

                              <DataTableCell truncate className="max-w-sm">
                                <code className="text-muted-foreground block truncate font-mono text-xs">
                                  {seg.criteria}
                                </code>
                              </DataTableCell>

                              <DataTableCell align="end">
                                {formatNumber(seg.usersCount)}
                              </DataTableCell>

                              <DataTableCell align="end">
                                <StatusLabel tone={getGrowthTone(seg.growth)}>
                                  {seg.growth}
                                </StatusLabel>
                              </DataTableCell>

                              <DataTableCell
                                align="end"
                                className="text-muted-foreground whitespace-nowrap"
                              >
                                {seg.lastUpdated}
                              </DataTableCell>

                              <DataTableCell align="end" className="w-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Actions for ${seg.name}`}
                                        className="size-7 cursor-pointer"
                                      />
                                    }
                                  >
                                    <MoreHorizontalIcon className="size-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel>{seg.name}</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => setViewingSegment(seg)}
                                      >
                                        <EyeIcon className="size-3.5" />
                                        View details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openEditDialog(seg)}
                                      >
                                        <PencilIcon className="size-3.5" />
                                        Edit rule
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleExportSegment(seg)}
                                      >
                                        <DownloadIcon className="size-3.5" />
                                        Export CSV
                                      </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setDeleteTarget(seg)}
                                      >
                                        <Trash2Icon className="size-3.5" />
                                        Delete segment
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

      {/* Segment Details Dialog */}
      <Dialog
        open={Boolean(viewingSegment)}
        onOpenChange={(open) => {
          if (!open) setViewingSegment(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {viewingSegment && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 pr-6">
                  <DialogTitle>{viewingSegment.name}</DialogTitle>
                  <StatusLabel tone={getGrowthTone(viewingSegment.growth)}>
                    {viewingSegment.growth}
                  </StatusLabel>
                </div>
                <DialogDescription>{viewingSegment.description}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 border-y py-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">
                    Behavioral rule criteria
                  </span>
                  <code className="bg-muted/50 rounded-md border px-2.5 py-2 font-mono text-xs break-all">
                    {viewingSegment.criteria}
                  </code>
                </div>

                <dl className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground text-xs">Matched users</dt>
                    <dd className="font-mono font-semibold tabular-nums">
                      {formatNumber(viewingSegment.usersCount)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground text-xs">Audience share</dt>
                    <dd className="font-mono tabular-nums">
                      {summary.totalUsers > 0
                        ? formatPercent(viewingSegment.usersCount / summary.totalUsers, {
                            maximumFractionDigits: 1,
                          })
                        : "0%"}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground text-xs">Last synced</dt>
                    <dd className="text-muted-foreground">
                      {viewingSegment.lastUpdated}
                    </dd>
                  </div>
                </dl>
              </div>

              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const target = viewingSegment;
                    setViewingSegment(null);
                    setDeleteTarget(target);
                  }}
                >
                  <Trash2Icon className="size-3.5" />
                  Delete
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSegment(viewingSegment)}
                  >
                    <DownloadIcon className="size-3.5" />
                    Export
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openEditDialog(viewingSegment)}
                  >
                    <PencilIcon className="size-3.5" />
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Segment Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveSegment} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {editingSegment ? `Edit ${editingSegment.name}` : "Create segment"}
              </DialogTitle>
              <DialogDescription>
                {editingSegment
                  ? "Update cohort name, behavioral query rules, or tracked size."
                  : "Define a dynamic audience cohort using behavioral or account attributes."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="segment-name">Segment name</Label>
                <Input
                  id="segment-name"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="High-Intent Trial Workspaces"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="segment-description">Description</Label>
                <Textarea
                  id="segment-description"
                  rows={2}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Workspaces inviting 3+ members within the first 48 hours."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="segment-criteria">Rule criteria</Label>
                <Input
                  id="segment-criteria"
                  className="font-mono text-xs"
                  value={formState.criteria}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, criteria: e.target.value }))
                  }
                  placeholder="sessions >= 10/mo AND team_members >= 3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="segment-users">Estimated users</Label>
                  <Input
                    id="segment-users"
                    type="number"
                    min={0}
                    value={formState.usersCount}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        usersCount: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="segment-growth">Weekly growth</Label>
                  <Input
                    id="segment-growth"
                    value={formState.growth}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, growth: e.target.value }))
                    }
                    placeholder="+14.0%"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-destructive text-xs font-medium">{formError}</p>
              )}
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editingSegment ? "Save changes" : "Create segment"}
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
            <DialogTitle>Delete {deleteTarget?.name ?? "segment"}?</DialogTitle>
            <DialogDescription>
              This removes the segment rule from your active audience directory and
              updates total segment counts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SegmentsView;
