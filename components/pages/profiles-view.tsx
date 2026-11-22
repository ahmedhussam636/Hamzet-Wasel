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
import { CountryFlag } from "@/components/dashboardblocks/country-flag";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { initialProfiles } from "@/src/metadata/profiles-data";
import type { UserProfileItem } from "@/src/metadata/types";
import {
  CheckCircle2Icon,
  CircleUserRoundIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
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

const STORAGE_KEY = "hamzet-wasel-profiles-v1";

const trackedProfilesKPIProps: LineChartKPI1Props = {
  title: "Tracked profiles",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 84_200, value: 91_400 },
    { label: "Tue", previous: 85_600, value: 93_100 },
    { label: "Wed", previous: 85_100, value: 94_200 },
    { label: "Thu", previous: 86_900, value: 96_500 },
    { label: "Fri", previous: 87_500, value: 98_420 },
    { label: "Sat", previous: 82_100, value: 91_800 },
    { label: "Sun", previous: 81_400, value: 90_950 },
  ],
};

const payingAccountsKPIProps: AreaChartKPI2Props = {
  title: "Paying customers",
  comparison: "last week",
  format: "compact",
  previous: 13_680,
  data: [
    { label: "Mon", value: 2_040 },
    { label: "Tue", value: 2_120 },
    { label: "Wed", value: 2_080 },
    { label: "Thu", value: 2_190 },
    { label: "Fri", value: 2_260 },
    { label: "Sat", value: 2_050 },
    { label: "Sun", value: 2_150 },
  ],
};

const averageLtvKPIProps: AreaChartKPI2Props = {
  title: "Average profile LTV",
  comparison: "last week",
  format: "currency",
  previous: 1_274,
  data: [
    { label: "Mon", value: 1_390 },
    { label: "Tue", value: 1_420 },
    { label: "Wed", value: 1_410 },
    { label: "Thu", value: 1_455 },
    { label: "Fri", value: 1_480 },
    { label: "Sat", value: 1_435 },
    { label: "Sun", value: 1_465 },
  ],
};

const activeSessionsKPIProps: LineChartKPI1Props = {
  title: "Identified sessions",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 11_400, value: 12_850 },
    { label: "Tue", previous: 11_900, value: 13_420 },
    { label: "Wed", previous: 11_650, value: 13_110 },
    { label: "Thu", previous: 12_300, value: 13_980 },
    { label: "Fri", previous: 12_750, value: 14_540 },
    { label: "Sat", previous: 9_800, value: 11_240 },
    { label: "Sun", previous: 9_500, value: 10_960 },
  ],
};

type PlanFilter = "all" | UserProfileItem["plan"];
type PresenceFilter = "all" | UserProfileItem["status"];

const PRESENCE_META: Record<
  UserProfileItem["status"],
  { label: string; tone: StatusTone }
> = {
  online: { label: "Online", tone: "good" },
  idle: { label: "Idle", tone: "warning" },
  offline: { label: "Offline", tone: "neutral" },
};

const COUNTRY_PRESETS: { country: string; code: string }[] = [
  { country: "Egypt", code: "EG" },
  { country: "Saudi Arabia", code: "SA" },
  { country: "United Arab Emirates", code: "AE" },
  { country: "United States", code: "US" },
  { country: "United Kingdom", code: "GB" },
  { country: "Germany", code: "DE" },
  { country: "Japan", code: "JP" },
];

function parseCurrency(value: string): number {
  const num = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const FORMULA_START = /^[=+\-@\t\r]/;
function csvCell(value: string | number): string {
  const text =
    typeof value === "string" && FORMULA_START.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportProfilesCsv(rows: UserProfileItem[], filename = "profiles.csv") {
  const headers: (keyof UserProfileItem)[] = [
    "id",
    "name",
    "email",
    "country",
    "plan",
    "status",
    "sessionsCount",
    "totalSpent",
    "lastSeen",
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

function loadStoredProfiles(): UserProfileItem[] {
  if (typeof window === "undefined") return initialProfiles;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProfiles;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return initialProfiles;
}

interface ProfileFormState {
  name: string;
  email: string;
  countryCode: string;
  plan: UserProfileItem["plan"];
  status: UserProfileItem["status"];
  sessionsCount: number;
  totalSpent: number;
}

const EMPTY_FORM: ProfileFormState = {
  name: "",
  email: "",
  countryCode: "EG",
  plan: "Pro",
  status: "online",
  sessionsCount: 24,
  totalSpent: 640,
};

export function ProfilesView(props: DashboardBlockStateProps = {}) {
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

  const [profiles, setProfiles] = useState<UserProfileItem[]>(loadStoredProfiles);
  const [hasModified, setHasModified] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanFilter>("all");
  const [selectedPresence, setSelectedPresence] = useState<PresenceFilter>("all");

  // Dialog states
  const [selectedProfile, setSelectedProfile] = useState<UserProfileItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfileItem | null>(null);
  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfileItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // Ignore storage write errors
    }
  }, [profiles]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const activeProfiles = useMemo(
    () => (state.isEmpty ? [] : profiles),
    [state.isEmpty, profiles]
  );

  const filteredProfiles = useMemo(() => {
    return activeProfiles.filter((profile) => {
      const matchPlan = selectedPlan === "all" || profile.plan === selectedPlan;
      const matchPresence =
        selectedPresence === "all" || profile.status === selectedPresence;
      return matchPlan && matchPresence;
    });
  }, [activeProfiles, selectedPlan, selectedPresence]);

  const summary = useMemo(() => {
    const totalLtv = activeProfiles.reduce(
      (sum, item) => sum + parseCurrency(item.totalSpent),
      0
    );
    const totalSessions = activeProfiles.reduce(
      (sum, item) => sum + item.sessionsCount,
      0
    );
    const onlineCount = activeProfiles.filter((p) => p.status === "online").length;
    const enterpriseCount = activeProfiles.filter(
      (p) => p.plan === "Enterprise"
    ).length;
    const avgLtv = activeProfiles.length > 0 ? totalLtv / activeProfiles.length : 0;

    return {
      totalLtv,
      totalSessions,
      onlineCount,
      enterpriseCount,
      avgLtv,
    };
  }, [activeProfiles]);

  const planEngagementData = useMemo(() => {
    const tiers: UserProfileItem["plan"][] = ["Enterprise", "Pro", "Free"];
    return tiers.map((tier) => {
      const items = activeProfiles.filter((p) => p.plan === tier);
      const ltv = items.reduce((sum, p) => sum + parseCurrency(p.totalSpent), 0);
      const sessions = items.reduce((sum, p) => sum + p.sessionsCount, 0);
      return {
        plan: tier,
        accounts: items.length,
        ltv,
        avgSessions: items.length > 0 ? Math.round(sessions / items.length) : 0,
        priorLtv: Math.round(ltv * 0.84),
      };
    });
  }, [activeProfiles]);

  const rankedProfiles = useMemo(() => {
    const maxLtv = Math.max(
      1,
      ...activeProfiles.map((profile) => parseCurrency(profile.totalSpent))
    );
    return [...activeProfiles]
      .sort((a, b) => parseCurrency(b.totalSpent) - parseCurrency(a.totalSpent))
      .slice(0, 5)
      .map((profile) => ({
        ...profile,
        spentNum: parseCurrency(profile.totalSpent),
        barPct: (parseCurrency(profile.totalSpent) / maxLtv) * 100,
      }));
  }, [activeProfiles]);

  const chartState = getBlockState(state.status, activeProfiles);
  const tableState = getBlockState(state.status, filteredProfiles);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentProfilesGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Recent profiles",
      items: activeProfiles.slice(0, 4).map((profile) => ({
        id: `recent-profile-${profile.id}`,
        label: profile.name,
        description: `${profile.email} · ${profile.country}`,
        meta: profile.totalSpent,
        icon: <CircleUserRoundIcon />,
        onSelect: () => setSelectedProfile(profile),
      })),
    }),
    [activeProfiles]
  );

  const searchProfiles = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentProfilesGroup];

    const matches = activeProfiles.filter((p) =>
      `${p.name} ${p.email} ${p.country} ${p.plan} ${p.status} ${p.id}`
        .toLowerCase()
        .includes(needle)
    );

    if (matches.length === 0) return [];

    return [
      {
        heading: "User profiles",
        items: matches.map((profile) => ({
          id: `search-profile-${profile.id}`,
          label: profile.name,
          description: `${profile.email} · ${profile.country} · ${profile.plan}`,
          meta: profile.totalSpent,
          icon: <CircleUserRoundIcon />,
          onSelect: () => setSelectedProfile(profile),
        })),
      },
    ];
  };

  const openCreateDialog = () => {
    setEditingProfile(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditDialog = (profile: UserProfileItem) => {
    setSelectedProfile(null);
    setEditingProfile(profile);
    setFormState({
      name: profile.name,
      email: profile.email,
      countryCode: profile.countryCode,
      plan: profile.plan,
      status: profile.status,
      sessionsCount: profile.sessionsCount,
      totalSpent: parseCurrency(profile.totalSpent),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    const name = formState.name.trim();
    const email = formState.email.trim();
    const countryMeta =
      COUNTRY_PRESETS.find((c) => c.code === formState.countryCode) ??
      COUNTRY_PRESETS[0];

    if (!name) {
      setFormError("Full name is required.");
      return;
    }
    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const spentNum = Math.max(0, Math.round(Number(formState.totalSpent) || 0));
    const sessionsCount = Math.max(
      0,
      Math.round(Number(formState.sessionsCount) || 0)
    );
    const lastSeen =
      formState.status === "online"
        ? "Online now"
        : formState.status === "idle"
          ? "10m ago"
          : "2h ago";

    if (editingProfile) {
      const updated: UserProfileItem = {
        ...editingProfile,
        name,
        email,
        country: countryMeta.country,
        countryCode: countryMeta.code,
        plan: formState.plan,
        status: formState.status,
        sessionsCount,
        totalSpent: `$${spentNum.toLocaleString("en-US")}`,
        lastSeen,
      };
      setProfiles((prev) =>
        prev.map((item) => (item.id === editingProfile.id ? updated : item))
      );
      setNotice(`Updated profile for ${name}.`);
    } else {
      const created: UserProfileItem = {
        id: `usr-${Math.floor(200 + Math.random() * 799)}`,
        name,
        email,
        avatar: "",
        country: countryMeta.country,
        countryCode: countryMeta.code,
        plan: formState.plan,
        status: formState.status,
        sessionsCount,
        totalSpent: `$${spentNum.toLocaleString("en-US")}`,
        lastSeen,
      };
      setProfiles((prev) => [created, ...prev]);
      setNotice(`Added profile for ${name}.`);
    }

    setHasModified(true);
    setFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setProfiles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setSelectedProfile(null);
    setHasModified(true);
    setNotice(`Removed profile "${deleteTarget.name}".`);
    setDeleteTarget(null);
  };

  const handleResetProfiles = () => {
    setProfiles(initialProfiles);
    setHasModified(false);
    setSelectedPlan("all");
    setSelectedPresence("all");
    setNotice("Restored default user profiles.");
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setNotice(`Copied ${email} to clipboard.`);
    } catch {
      setNotice(`Email: ${email}`);
    }
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
          {...trackedProfilesKPIProps}
          data={state.isEmpty ? [] : trackedProfilesKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...payingAccountsKPIProps}
          data={state.isEmpty ? [] : payingAccountsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...averageLtvKPIProps}
          data={state.isEmpty ? [] : averageLtvKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...activeSessionsKPIProps}
          data={state.isEmpty ? [] : activeSessionsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Middle Row: Plan Revenue Breakdown + Top Value Profiles Leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Lifetime value by plan tier
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Cumulative directory revenue across Enterprise, Pro, and Free users.
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
                    label="Updating profile LTV breakdown"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">
                            Directory LTV
                          </dt>
                          <dd>
                            <KPIValue
                              value={summary.totalLtv}
                              format={(v) => formatCurrency(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {formatNumber(activeProfiles.length)} tracked profiles
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Avg. spend / user
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
                              {formatNumber(summary.totalSessions)} total sessions
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Live presence
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.onlineCount}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {summary.enterpriseCount} Enterprise accounts
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Current LTV" },
                            {
                              color: "var(--color-muted-foreground)",
                              label: "Prior month",
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
                                aria-label="Profile LTV by plan"
                                data={planEngagementData}
                                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                              >
                                <defs>
                                  <ChartHatch
                                    color="var(--color-muted-foreground)"
                                    id={hatchId}
                                  />
                                </defs>
                                <CartesianGrid {...chartGridProps} />
                                <XAxis {...chartAxisProps} dataKey="plan" />
                                <YAxis
                                  {...chartAxisProps}
                                  tickFormatter={(value: number) =>
                                    formatCurrency(value)
                                  }
                                  width={chartValueAxisWidth}
                                />
                                <Tooltip
                                  cursor={chartBarCursor}
                                  content={(tooltipProps) => (
                                    <ChartTooltipContent
                                      {...tooltipProps}
                                      valueFormatter={(value) => formatCurrency(value)}
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="priorLtv"
                                  name="Prior month"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                  dataKey="ltv"
                                  name="Current LTV"
                                  fill="var(--color-chart-2)"
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Profile LTV by plan tier"
                            columns={[
                              { key: "plan", label: "Plan" },
                              {
                                key: "ltv",
                                label: "Current LTV",
                                format: (v) => formatCurrency(v),
                              },
                              {
                                key: "priorLtv",
                                label: "Prior month",
                                format: (v) => formatCurrency(v),
                              },
                            ]}
                            rows={planEngagementData}
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
                        Top value profiles
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Highest lifetime spend and session frequency accounts.
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
                    label="Updating top profiles"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={leaderboardRefreshKey}>
                          {rankedProfiles.map((profile, index) => (
                            <LeaderboardItem key={profile.id} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={profile.barPct} delay={index * 60} />
                              <LeaderboardLabel>
                                <button
                                  type="button"
                                  onClick={() => setSelectedProfile(profile)}
                                  className="block max-w-full cursor-pointer truncate text-left font-medium hover:underline"
                                >
                                  {profile.name}
                                </button>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>{profile.country}</span>
                                  <span>
                                    {formatNumber(profile.sessionsCount)} sessions
                                  </span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{profile.totalSpent}</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {profile.plan}
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground border-t pt-3 text-sm">
                          {rankedProfiles[0]
                            ? `${rankedProfiles[0].name} leads directory value at ${rankedProfiles[0].totalSpent} across ${rankedProfiles[0].sessionsCount} sessions.`
                            : "Identified profiles will be ranked by total lifetime spend."}
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

      {/* Profiles Directory Table */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">User profiles</h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeProfiles.length} identified{" "}
                      {activeProfiles.length === 1 ? "profile" : "profiles"} ·{" "}
                      {formatCurrency(summary.totalLtv)} combined LTV ·{" "}
                      {formatPercent(
                        activeProfiles.length > 0
                          ? summary.onlineCount / activeProfiles.length
                          : 0,
                        { maximumFractionDigits: 0 }
                      )}{" "}
                      online
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
                      onClick={handleResetProfiles}
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
                    disabled={state.isLoading || activeProfiles.length === 0}
                    onClick={() => {
                      exportProfilesCsv(filteredProfiles, "profiles.csv");
                      setNotice("Exported user profiles to CSV.");
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
                    Add profile
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    className="h-8 px-2.5"
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating profiles">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  {/* Toolbar: CommandMenu2 Search + Plan & Presence Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full sm:w-auto items-stretch"
                      emptyMessage="No matching user profiles found."
                      placeholder="Search user by name, email, or country..."
                      recent={recentProfilesGroup}
                      search={searchProfiles}
                      showStatus={false}
                      title="Search profiles"
                      triggerClassName="h-8 w-full sm:w-72 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        role="tablist"
                        aria-label="Filter profiles by plan"
                        className="bg-muted inline-flex items-center rounded-lg p-0.5"
                      >
                        {(["all", "Enterprise", "Pro", "Free"] as const).map(
                          (plan) => {
                            const active = selectedPlan === plan;
                            return (
                              <button
                                key={plan}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setSelectedPlan(plan)}
                                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                                  active
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {plan === "all" ? "All plans" : plan}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <div
                        role="tablist"
                        aria-label="Filter profiles by presence"
                        className="bg-muted inline-flex items-center rounded-lg p-0.5"
                      >
                        {(["all", "online", "idle", "offline"] as const).map(
                          (status) => {
                            const active = selectedPresence === status;
                            return (
                              <button
                                key={status}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setSelectedPresence(status)}
                                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap capitalize transition-colors ${
                                  active
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {status === "all" ? "Any status" : status}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-1">
                    <DataTable density="compact" caption="User profiles directory">
                      <DataTableHeader>
                        <DataTableRow>
                          <DataTableHead>User</DataTableHead>
                          <DataTableHead>Country</DataTableHead>
                          <DataTableHead>Plan</DataTableHead>
                          <DataTableHead align="end">Sessions</DataTableHead>
                          <DataTableHead align="end">Total spent</DataTableHead>
                          <DataTableHead align="end">Presence</DataTableHead>
                          <DataTableHead align="end">
                            <span className="sr-only">Actions</span>
                          </DataTableHead>
                        </DataTableRow>
                      </DataTableHeader>
                      <DataTableBody>
                        <DataTableStateRows colSpan={7} rows={5} />
                        {!tableState &&
                          filteredProfiles.map((user) => {
                            const presence = PRESENCE_META[user.status];
                            return (
                              <DataTableRow key={user.id}>
                                <DataTableCell primary truncate className="max-w-xs">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProfile(user)}
                                    className="group flex w-full cursor-pointer items-center gap-2.5 text-left focus-visible:outline-none"
                                  >
                                    <Avatar size="sm">
                                      <AvatarImage src={user.avatar} alt={user.name} />
                                      <AvatarFallback className="text-[10px] font-medium">
                                        {getInitials(user.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="min-w-0">
                                      <span className="block truncate font-medium group-hover:underline">
                                        {user.name}
                                      </span>
                                      <span className="text-muted-foreground block truncate text-xs font-normal">
                                        {user.email}
                                      </span>
                                    </span>
                                  </button>
                                </DataTableCell>

                                <DataTableCell className="whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5">
                                    <CountryFlag
                                      code={user.countryCode}
                                      className="w-auto"
                                    />
                                    <span className="text-muted-foreground">
                                      {user.country}
                                    </span>
                                  </span>
                                </DataTableCell>

                                <DataTableCell className="font-medium whitespace-nowrap">
                                  {user.plan}
                                </DataTableCell>

                                <DataTableCell align="end">
                                  <span className="tabular-nums">
                                    {formatNumber(user.sessionsCount)}
                                  </span>
                                  <span className="text-muted-foreground block text-[11px] font-normal">
                                    {user.lastSeen}
                                  </span>
                                </DataTableCell>

                                <DataTableCell align="end" className="font-medium">
                                  {user.totalSpent}
                                </DataTableCell>

                                <DataTableCell align="end">
                                  <StatusLabel tone={presence.tone}>
                                    {presence.label}
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
                                          aria-label={`Actions for ${user.name}`}
                                          className="size-7 cursor-pointer"
                                        />
                                      }
                                    >
                                      <MoreHorizontalIcon className="size-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuGroup>
                                        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => setSelectedProfile(user)}
                                        >
                                          <EyeIcon className="size-3.5" />
                                          View profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => openEditDialog(user)}
                                        >
                                          <PencilIcon className="size-3.5" />
                                          Edit profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => void handleCopyEmail(user.email)}
                                        >
                                          <CopyIcon className="size-3.5" />
                                          Copy email
                                        </DropdownMenuItem>
                                      </DropdownMenuGroup>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuGroup>
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() => setDeleteTarget(user)}
                                        >
                                          <Trash2Icon className="size-3.5" />
                                          Remove profile
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

      {/* Selected Profile Details Dialog */}
      <Dialog
        open={Boolean(selectedProfile)}
        onOpenChange={(open) => {
          if (!open) setSelectedProfile(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedProfile && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 pr-6">
                  <Avatar size="lg">
                    <AvatarImage
                      src={selectedProfile.avatar}
                      alt={selectedProfile.name}
                    />
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(selectedProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate">
                      {selectedProfile.name}
                    </DialogTitle>
                    <DialogDescription className="truncate">
                      {selectedProfile.email}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-4 border-y py-4 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">User ID</dt>
                  <dd className="font-mono text-xs tabular-nums">
                    {selectedProfile.id}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Country</dt>
                  <dd className="flex items-center gap-1.5">
                    <CountryFlag
                      code={selectedProfile.countryCode}
                      className="w-auto"
                    />
                    <span>{selectedProfile.country}</span>
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Plan tier</dt>
                  <dd className="font-medium">{selectedProfile.plan}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Presence</dt>
                  <dd>
                    <StatusLabel tone={PRESENCE_META[selectedProfile.status].tone}>
                      {PRESENCE_META[selectedProfile.status].label}
                    </StatusLabel>
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Total spent</dt>
                  <dd className="font-mono font-semibold tabular-nums">
                    {selectedProfile.totalSpent}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground text-xs">Activity</dt>
                  <dd className="font-mono tabular-nums">
                    {formatNumber(selectedProfile.sessionsCount)} sessions ·{" "}
                    {selectedProfile.lastSeen}
                  </dd>
                </div>
              </dl>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEditDialog(selectedProfile)}
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

      {/* Create / Edit Profile Dialog */}
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
              {editingProfile ? "Edit user profile" : "Add user profile"}
            </DialogTitle>
            <DialogDescription>
              Maintain customer identity attributes, plan tier, and lifetime spend.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Nourhan Adel"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={formState.email}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="nourhan@company.eg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-country">Country</Label>
                <select
                  id="profile-country"
                  value={formState.countryCode}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      countryCode: e.target.value,
                    }))
                  }
                  className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  {COUNTRY_PRESETS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-plan">Plan</Label>
                <select
                  id="profile-plan"
                  value={formState.plan}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      plan: e.target.value as UserProfileItem["plan"],
                    }))
                  }
                  className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Pro">Pro</option>
                  <option value="Free">Free</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-status">Status</Label>
                <select
                  id="profile-status"
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: e.target.value as UserProfileItem["status"],
                    }))
                  }
                  className="border-input bg-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="online">Online</option>
                  <option value="idle">Idle</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-sessions">Sessions</Label>
                <Input
                  id="profile-sessions"
                  type="number"
                  min={0}
                  value={formState.sessionsCount}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      sessionsCount: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-spent">Total spent ($)</Label>
                <Input
                  id="profile-spent"
                  type="number"
                  min={0}
                  value={formState.totalSpent}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      totalSpent: Number(e.target.value),
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
                {editingProfile ? "Save changes" : "Add profile"}
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
            <DialogTitle>Remove profile</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium">{deleteTarget?.name}</span> from the
              user directory? You can restore default profiles anytime.
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
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfilesView;
