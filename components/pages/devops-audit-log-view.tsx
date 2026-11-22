"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActivityFeed,
  ActivityFeedItem,
  ActivityIcon,
} from "@/components/dashboardblocks/activity-feed";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCsvReport, downloadPdfComplianceReport } from "@/lib/compliance-export";
import { formatNumber } from "@/lib/dashboardblocks/format";
import {
  CheckCircle2Icon,
  CopyIcon,
  EyeIcon,
  KeyRoundIcon,
  ListIcon,
  LockIcon,
  MoreHorizontalIcon,
  NetworkIcon,
  RocketIcon,
  ServerIcon,
  ShieldCheckIcon,
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

type AuditScope = "Deployments" | "IAM & Secrets" | "Clusters" | "Network";
type AuditRisk = "Low" | "Elevated" | "Critical";
type AuditOutcome = "Allowed" | "Denied";

interface DevOpsAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: "engineer" | "ci-bot" | "external";
  action: string;
  resource: string;
  scope: AuditScope;
  risk: AuditRisk;
  outcome: AuditOutcome;
  region: string;
  ip: string;
  traceId: string;
  digest: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

const AUDIT_ENTRIES: DevOpsAuditEntry[] = [
  {
    id: "aud-9042",
    timestamp: "2026-11-22 15:48:12",
    actor: "Karim Hassan",
    actorType: "engineer",
    action: "Promoted production release",
    resource: "eu-west-2 / api-gateway:v4.18.2",
    scope: "Deployments",
    risk: "Elevated",
    outcome: "Allowed",
    region: "eu-west-2",
    ip: "197.48.112.19",
    traceId: "tr_aud_8f2109c4",
    digest: "sha256:9f82a41e7bc0...41d2",
    before: { image: "api-gateway:v4.18.1", replicas: 6, canaryWeight: 10 },
    after: { image: "api-gateway:v4.18.2", replicas: 6, canaryWeight: 100 },
  },
  {
    id: "aud-9041",
    timestamp: "2026-11-22 15:31:04",
    actor: "github-actions[bot]",
    actorType: "ci-bot",
    action: "Rotated OIDC signing certificate",
    resource: "global / auth-service / jwt-key-15",
    scope: "IAM & Secrets",
    risk: "Critical",
    outcome: "Allowed",
    region: "global",
    ip: "140.82.115.22",
    traceId: "tr_aud_3c91a40e",
    digest: "sha256:5b10e94c8a2f...89b1",
    before: { activeKeyVersion: 14, rotationWindowHours: 24 },
    after: { activeKeyVersion: 15, rotationWindowHours: 24 },
  },
  {
    id: "aud-9040",
    timestamp: "2026-11-22 14:52:47",
    actor: "unverified-client",
    actorType: "external",
    action: "Attempted KMS decrypt without scope",
    resource: "me-central-1 / secrets / billing-stripe-key",
    scope: "IAM & Secrets",
    risk: "Critical",
    outcome: "Denied",
    region: "me-central-1",
    ip: "185.220.101.48",
    traceId: "tr_aud_7d40f112",
    digest: "sha256:1c73d820e49a...66a0",
    before: { policy: "require-mfa-and-vpc", allowed: false },
    after: { policy: "require-mfa-and-vpc", blockedReason: "missing_scope" },
  },
  {
    id: "aud-9039",
    timestamp: "2026-11-22 14:15:33",
    actor: "Nour El-Din",
    actorType: "engineer",
    action: "Scaled node autoscaler ceiling",
    resource: "me-central-1 / pool-app-workers",
    scope: "Clusters",
    risk: "Elevated",
    outcome: "Allowed",
    region: "me-central-1",
    ip: "86.51.140.82",
    traceId: "tr_aud_6a02c881",
    digest: "sha256:4d91a032b7c1...12f9",
    before: { minNodes: 3, maxNodes: 8, instanceType: "m7g.xlarge" },
    after: { minNodes: 4, maxNodes: 12, instanceType: "m7g.xlarge" },
  },
  {
    id: "aud-9038",
    timestamp: "2026-11-22 13:20:09",
    actor: "Shaban Haider",
    actorType: "engineer",
    action: "Updated ingress WAF rate limit rule",
    resource: "edge / waf-policy-public-api",
    scope: "Network",
    risk: "Elevated",
    outcome: "Allowed",
    region: "global",
    ip: "197.48.112.19",
    traceId: "tr_aud_1b87d320",
    digest: "sha256:8e44c192d01a...07c3",
    before: { burstLimitRpm: 1200, action: "challenge" },
    after: { burstLimitRpm: 1800, action: "throttle" },
  },
  {
    id: "aud-9037",
    timestamp: "2026-11-22 11:44:56",
    actor: "Laila Mansour",
    actorType: "engineer",
    action: "Cordoned canary node for kernel patch",
    resource: "eu-west-2 / eu-west-canary-a3",
    scope: "Clusters",
    risk: "Low",
    outcome: "Allowed",
    region: "eu-west-2",
    ip: "94.200.51.104",
    traceId: "tr_aud_5e21b908",
    digest: "sha256:2a65f719c33d...91e4",
    before: { schedulable: true, pods: 14 },
    after: { schedulable: false, pods: 0 },
  },
  {
    id: "aud-9036",
    timestamp: "2026-11-22 10:09:18",
    actor: "terraform-cloud[bot]",
    actorType: "ci-bot",
    action: "Applied VPC peering route update",
    resource: "us-east-1 / vpc-analytics-prod",
    scope: "Network",
    risk: "Low",
    outcome: "Allowed",
    region: "us-east-1",
    ip: "54.236.18.90",
    traceId: "tr_aud_9c54e201",
    digest: "sha256:7f12b408a92c...38d7",
    before: { cidr: "10.42.0.0/16", state: "pending" },
    after: { cidr: "10.42.0.0/16", state: "active" },
  },
];

const SCOPE_CHART_BASELINE: { scope: AuditScope; short: string; allowed: number; denied: number }[] = [
  { scope: "Deployments", short: "Deploys", allowed: 64, denied: 2 },
  { scope: "IAM & Secrets", short: "IAM", allowed: 41, denied: 7 },
  { scope: "Clusters", short: "Clusters", allowed: 52, denied: 1 },
  { scope: "Network", short: "Network", allowed: 38, denied: 4 },
];

const ACTOR_LEADERBOARD = [
  { actor: "github-actions[bot]", role: "CI automation", events: 84, region: "global" },
  { actor: "Karim Hassan", role: "Platform lead", events: 52, region: "eu-west-2" },
  { actor: "terraform-cloud[bot]", role: "IaC runner", events: 46, region: "us-east-1" },
  { actor: "Nour El-Din", role: "SRE", events: 31, region: "me-central-1" },
  { actor: "Shaban Haider", role: "Workspace admin", events: 28, region: "global" },
];

const auditedEventsKPIProps: LineChartKPI1Props = {
  title: "Audited events",
  comparison: "last week",
  currentLabel: "This week",
  format: "number",
  data: [
    { label: "Mon", previous: 31, value: 36 },
    { label: "Tue", previous: 35, value: 42 },
    { label: "Wed", previous: 33, value: 39 },
    { label: "Thu", previous: 38, value: 44 },
    { label: "Fri", previous: 36, value: 41 },
    { label: "Sat", previous: 18, value: 21 },
    { label: "Sun", previous: 16, value: 19 },
  ],
};

const prodMutationsKPIProps: AreaChartKPI2Props = {
  title: "Production mutations",
  comparison: "last week",
  format: "number",
  previous: 72,
  data: [
    { label: "Mon", value: 11 },
    { label: "Tue", value: 14 },
    { label: "Wed", value: 12 },
    { label: "Thu", value: 15 },
    { label: "Fri", value: 13 },
    { label: "Sat", value: 7 },
    { label: "Sun", value: 6 },
  ],
};

const iamRotationsKPIProps: LineChartKPI1Props = {
  title: "IAM & key rotations",
  comparison: "last week",
  currentLabel: "This week",
  format: "number",
  data: [
    { label: "Mon", previous: 6, value: 8 },
    { label: "Tue", previous: 7, value: 9 },
    { label: "Wed", previous: 5, value: 7 },
    { label: "Thu", previous: 8, value: 10 },
    { label: "Fri", previous: 7, value: 8 },
    { label: "Sat", previous: 4, value: 5 },
    { label: "Sun", previous: 3, value: 4 },
  ],
};

const policyDenialsKPIProps: AreaChartKPI2Props = {
  title: "Policy denials",
  comparison: "last week",
  format: "number",
  previous: 18,
  data: [
    { label: "Mon", value: 3 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 2 },
    { label: "Fri", value: 2 },
    { label: "Sat", value: 1 },
    { label: "Sun", value: 1 },
  ],
};

const SCOPE_FILTERS: ("All" | AuditScope)[] = [
  "All",
  "Deployments",
  "IAM & Secrets",
  "Clusters",
  "Network",
];

const RISK_FILTERS: ("All" | AuditRisk)[] = ["All", "Low", "Elevated", "Critical"];

const RISK_TONE: Record<AuditRisk, StatusTone> = {
  Low: "neutral",
  Elevated: "warning",
  Critical: "bad",
};

function scopeIcon(scope: AuditScope) {
  switch (scope) {
    case "Deployments":
      return <RocketIcon />;
    case "IAM & Secrets":
      return <KeyRoundIcon />;
    case "Clusters":
      return <ServerIcon />;
    case "Network":
      return <NetworkIcon />;
  }
}

const AUDIT_EXPORT_FORMATS = [
  { label: "Export as CSV", value: "csv" },
  { label: "Export as PDF", value: "pdf" },
];

export function DevOpsAuditLogView(props: DashboardBlockStateProps = {}) {
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

  const [scopeFilter, setScopeFilter] = useState<"All" | AuditScope>("All");
  const [riskFilter, setRiskFilter] = useState<"All" | AuditRisk>("All");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [selectedEntry, setSelectedEntry] = useState<DevOpsAuditEntry | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeEntries = useMemo(
    () => (state.isEmpty ? [] : AUDIT_ENTRIES),
    [state.isEmpty]
  );

  const filteredEntries = useMemo(() => {
    return activeEntries.filter((entry) => {
      if (scopeFilter !== "All" && entry.scope !== scopeFilter) return false;
      if (riskFilter !== "All" && entry.risk !== riskFilter) return false;
      return true;
    });
  }, [activeEntries, scopeFilter, riskFilter]);

  const summary = useMemo(() => {
    const highRisk = activeEntries.filter(
      (e) => e.risk === "Elevated" || e.risk === "Critical"
    ).length;
    const denied = activeEntries.filter((e) => e.outcome === "Denied").length;
    return { highRisk, denied };
  }, [activeEntries]);

  const chartData = useMemo(
    () => (state.isEmpty ? [] : SCOPE_CHART_BASELINE),
    [state.isEmpty]
  );

  const rankedActors = useMemo(() => {
    if (state.isEmpty) return [];
    const maxEvents = Math.max(1, ...ACTOR_LEADERBOARD.map((a) => a.events));
    return ACTOR_LEADERBOARD.map((row) => ({
      ...row,
      barPct: Math.round((row.events / maxEvents) * 100),
    }));
  }, [state.isEmpty]);

  const chartState = getBlockState(state.status, chartData);
  const tableState = getBlockState(state.status, filteredEntries);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isLeaderboardBusy = Boolean(state.refreshing || leaderboardRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const recentAuditGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Recent audit events",
      items: activeEntries.slice(0, 5).map((entry) => ({
        id: `recent-aud-${entry.id}`,
        label: entry.action,
        description: `${entry.actor} · ${entry.resource}`,
        meta: `${entry.risk} · ${entry.outcome}`,
        icon: <ShieldCheckIcon />,
        onSelect: () => setSelectedEntry(entry),
      })),
    }),
    [activeEntries]
  );

  const searchAudit = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentAuditGroup];
    const matches = activeEntries.filter((entry) =>
      `${entry.id} ${entry.actor} ${entry.action} ${entry.resource} ${entry.ip} ${entry.scope} ${entry.digest}`
        .toLowerCase()
        .includes(needle)
    );
    if (matches.length === 0) return [];
    return [
      {
        heading: "Audit ledger entries",
        items: matches.map((entry) => ({
          id: `search-aud-${entry.id}`,
          label: entry.action,
          description: `${entry.actor} · ${entry.resource}`,
          meta: `${entry.risk} · ${entry.outcome}`,
          icon: <ShieldCheckIcon />,
          onSelect: () => setSelectedEntry(entry),
        })),
      },
    ];
  };

  const handleVerifyIntegrity = () => {
    setNotice(
      `Verified ${activeEntries.length} SHA-256 ledger digests — 0 tampering anomalies detected.`
    );
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
          {...auditedEventsKPIProps}
          data={state.isEmpty ? [] : auditedEventsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...prodMutationsKPIProps}
          data={state.isEmpty ? [] : prodMutationsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...iamRotationsKPIProps}
          data={state.isEmpty ? [] : iamRotationsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...policyDenialsKPIProps}
          data={state.isEmpty ? [] : policyDenialsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Analytics Row: Policy Enforcement by Scope + Top Principals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Audit activity by scope
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Authorized mutations compared with policy-blocked access attempts per domain.
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
                    label="Updating audit distribution"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">
                            Ledger entries
                          </dt>
                          <dd>
                            <KPIValue
                              value={activeEntries.length}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs">
                              SHA-256 append-only chain
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Elevated &amp; critical
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.highRisk}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs">
                              Prod &amp; IAM mutations
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Policy denials
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.denied}
                              format={(v) => formatNumber(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs">
                              Blocked unauthorized calls
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Allowed actions" },
                            {
                              color: "var(--color-chart-5)",
                              label: "Denied attempts",
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
                                aria-label="Audit events by scope"
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
                                      label={String(payload?.[0]?.payload?.scope ?? "")}
                                      payload={payload}
                                      valueFormatter={(value) =>
                                        `${formatNumber(value)} events`
                                      }
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="allowed"
                                  name="Allowed actions"
                                  stackId="aud"
                                  fill="var(--color-chart-2)"
                                  radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                  dataKey="denied"
                                  name="Denied attempts"
                                  stackId="aud"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Audit events by infrastructure scope"
                            columns={[
                              { key: "scope", label: "Scope" },
                              {
                                key: "allowed",
                                label: "Allowed",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "denied",
                                label: "Denied",
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
                        Most active principals
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Engineers and automation bots ranked by verified infrastructure changes.
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
                    label="Updating principal activity"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={leaderboardRefreshKey}>
                          {rankedActors.map((row, index) => (
                            <LeaderboardItem key={row.actor} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={row.barPct} delay={index * 60} />
                              <LeaderboardLabel>
                                <span className="block max-w-full truncate font-medium">
                                  {row.actor}
                                </span>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>{row.role}</span>
                                  <span>{row.region}</span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{formatNumber(row.events)}</span>
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
                          All ledger digests verified against hardware KMS root key.
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

      {/* Infrastructure Audit Ledger */}
      <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
        <Card>
          <CardContent className="overflow-x-auto">
            <section className="@container/data-table flex flex-col gap-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 className="font-semibold tracking-tight">
                    Infrastructure audit ledger
                  </h2>
                  <BlockReady className="text-sm">
                    <p className="text-muted-foreground text-sm">
                      {activeEntries.length} signed{" "}
                      {activeEntries.length === 1 ? "record" : "records"} · select any row
                      to inspect its SHA-256 digest and before/after state diff.
                    </p>
                  </BlockReady>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isTableBusy && <BlockBusyIndicator />}
                  <div
                    role="tablist"
                    aria-label="Ledger display mode"
                    className="bg-muted inline-flex items-center rounded-lg p-0.5"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === "table"}
                      onClick={() => setViewMode("table")}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        viewMode === "table"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ListIcon className="size-3.5" />
                      Table
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={viewMode === "timeline"}
                      onClick={() => setViewMode("timeline")}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        viewMode === "timeline"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LockIcon className="size-3.5" />
                      Timeline
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={state.isLoading || activeEntries.length === 0}
                    onClick={handleVerifyIntegrity}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <ShieldCheckIcon className="size-3.5" />
                    Verify chain
                  </Button>
                  <ExportMenu
                    size="sm"
                    disabled={state.isLoading || filteredEntries.length === 0}
                    formats={AUDIT_EXPORT_FORMATS}
                    onExport={(format) => {
                      if (format === "csv") {
                        downloadCsvReport({
                          filename: "devops-audit-log-compliance.csv",
                          headers: [
                            "Event ID",
                            "Timestamp",
                            "Actor",
                            "Action",
                            "Resource",
                            "Scope",
                            "Risk",
                            "Outcome",
                            "Region",
                            "IP",
                            "Digest",
                          ],
                          rows: filteredEntries.map((e) => [
                            e.id,
                            e.timestamp,
                            e.actor,
                            e.action,
                            e.resource,
                            e.scope,
                            e.risk,
                            e.outcome,
                            e.region,
                            e.ip,
                            e.digest,
                          ]),
                        });
                        setNotice("Exported DevOps audit ledger to CSV.");
                      } else if (format === "pdf") {
                        downloadPdfComplianceReport({
                          filename: "devops-audit-log-compliance.pdf",
                          title: "DevOps Audit Log Compliance Report",
                          subtitle:
                            "Immutable operational ledger with actor attribution, risk classification, and digest verification.",
                          metadata: [
                            { label: "Scope Filter", value: scopeFilter },
                            { label: "Risk Filter", value: riskFilter },
                            { label: "Chain Integrity", value: "SHA-256 Verified" },
                          ],
                          columns: [
                            { header: "Event ID", width: 11 },
                            { header: "Timestamp", width: 15 },
                            { header: "Actor", width: 17 },
                            { header: "Action", width: 22 },
                            { header: "Scope", width: 13 },
                            { header: "Risk", width: 10 },
                            { header: "Result", width: 10 },
                          ],
                          rows: filteredEntries.map((e) => [
                            e.id,
                            e.timestamp,
                            e.actor,
                            e.action,
                            e.scope,
                            e.risk,
                            e.outcome,
                          ]),
                        });
                        setNotice("Exported DevOps audit compliance report to PDF.");
                      }
                    }}
                  />
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isTableBusy}
                    className="h-8 px-2.5"
                    onClick={() => void triggerTableRefresh()}
                  />
                </div>
              </header>

              <DashboardBusy refreshing={isTableBusy} label="Updating audit ledger">
                <div key={tableRefreshKey} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CommandMenu2
                      className="w-full items-stretch sm:w-auto"
                      emptyMessage="No matching audit events found."
                      placeholder="Search actor, resource, IP, digest..."
                      recent={recentAuditGroup}
                      search={searchAudit}
                      showStatus={false}
                      title="Search audit ledger"
                      triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        role="tablist"
                        aria-label="Filter audit events by scope"
                        className="bg-muted inline-flex flex-wrap items-center rounded-lg p-0.5"
                      >
                        {SCOPE_FILTERS.map((scope) => {
                          const active = scopeFilter === scope;
                          return (
                            <button
                              key={scope}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => setScopeFilter(scope)}
                              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                                active
                                  ? "bg-background text-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {scope}
                            </button>
                          );
                        })}
                      </div>

                      <div
                        role="tablist"
                        aria-label="Filter audit events by risk"
                        className="bg-muted inline-flex items-center rounded-lg p-0.5"
                      >
                        {RISK_FILTERS.map((risk) => {
                          const active = riskFilter === risk;
                          return (
                            <button
                              key={risk}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => setRiskFilter(risk)}
                              className={`cursor-pointer rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                                active
                                  ? "bg-background text-foreground shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {risk}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-1">
                    {viewMode === "table" ? (
                      <DataTable density="compact" caption="DevOps audit log">
                        <DataTableHeader>
                          <DataTableRow>
                            <DataTableHead>Timestamp</DataTableHead>
                            <DataTableHead>Actor</DataTableHead>
                            <DataTableHead>Action &amp; Resource</DataTableHead>
                            <DataTableHead>Scope</DataTableHead>
                            <DataTableHead align="end">Risk</DataTableHead>
                            <DataTableHead align="end">Result</DataTableHead>
                            <DataTableHead align="end">
                              <span className="sr-only">Actions</span>
                            </DataTableHead>
                          </DataTableRow>
                        </DataTableHeader>
                        <DataTableBody>
                          <DataTableStateRows colSpan={7} rows={5} />
                          {!tableState &&
                            filteredEntries.map((entry) => (
                              <DataTableRow key={entry.id}>
                                <DataTableCell className="text-muted-foreground font-mono text-xs whitespace-nowrap tabular-nums">
                                  <div>{entry.timestamp}</div>
                                  <span className="block text-[11px]">{entry.id}</span>
                                </DataTableCell>
                                <DataTableCell>
                                  <div className="font-medium">{entry.actor}</div>
                                  <span className="text-muted-foreground block font-mono text-xs tabular-nums">
                                    {entry.ip}
                                  </span>
                                </DataTableCell>
                                <DataTableCell primary truncate className="max-w-md">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEntry(entry)}
                                    className="cursor-pointer text-left font-medium hover:underline"
                                  >
                                    {entry.action}
                                  </button>
                                  <span className="text-muted-foreground block truncate font-mono text-xs">
                                    {entry.resource}
                                  </span>
                                </DataTableCell>
                                <DataTableCell className="text-muted-foreground text-xs">
                                  {entry.scope}
                                </DataTableCell>
                                <DataTableCell align="end">
                                  <StatusLabel tone={RISK_TONE[entry.risk]}>
                                    {entry.risk}
                                  </StatusLabel>
                                </DataTableCell>
                                <DataTableCell align="end">
                                  <StatusLabel
                                    tone={entry.outcome === "Allowed" ? "good" : "bad"}
                                  >
                                    {entry.outcome}
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
                                          aria-label={`Actions for ${entry.id}`}
                                        />
                                      }
                                    >
                                      <MoreHorizontalIcon className="size-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuGroup>
                                        <DropdownMenuLabel>Forensics</DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() => setSelectedEntry(entry)}
                                        >
                                          <EyeIcon className="size-3.5" />
                                          Inspect diff
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            void navigator.clipboard?.writeText(entry.digest);
                                            setNotice(`Copied digest for ${entry.id}.`);
                                          }}
                                        >
                                          <CopyIcon className="size-3.5" />
                                          Copy SHA-256
                                        </DropdownMenuItem>
                                      </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </DataTableCell>
                              </DataTableRow>
                            ))}
                        </DataTableBody>
                      </DataTable>
                    ) : (
                      <div className="pt-4">
                        <BlockStateRows rows={5} />
                        {!tableState && (
                          <ActivityFeed>
                            {filteredEntries.map((entry) => (
                              <ActivityFeedItem
                                key={entry.id}
                                connector
                                className="pb-6 last:pb-0"
                              >
                                <ActivityIcon
                                  icon={scopeIcon(entry.scope)}
                                  tone={
                                    entry.outcome === "Denied"
                                      ? "danger"
                                      : entry.risk === "Critical"
                                        ? "warning"
                                        : entry.scope === "Deployments"
                                          ? "success"
                                          : "info"
                                  }
                                />
                                <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedEntry(entry)}
                                      className="cursor-pointer text-left text-sm font-medium text-foreground hover:underline"
                                    >
                                      {entry.action}
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <StatusLabel tone={RISK_TONE[entry.risk]}>
                                        {entry.risk}
                                      </StatusLabel>
                                      <StatusLabel
                                        tone={
                                          entry.outcome === "Allowed" ? "good" : "bad"
                                        }
                                      >
                                        {entry.outcome}
                                      </StatusLabel>
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground font-mono text-xs">
                                    {entry.resource}
                                  </p>
                                  <Details className="text-muted-foreground block text-xs tabular-nums">
                                    <span>{entry.actor}</span>
                                    <span>{entry.region}</span>
                                    <span>{entry.ip}</span>
                                    <span>{entry.timestamp}</span>
                                  </Details>
                                </div>
                              </ActivityFeedItem>
                            ))}
                          </ActivityFeed>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </DashboardBusy>
            </section>
          </CardContent>
        </Card>
      </BlockStateProvider>

      {/* Forensics Diff Dialog */}
      <Dialog
        open={selectedEntry !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span>{selectedEntry.action}</span>
                  <StatusLabel
                    tone={selectedEntry.outcome === "Allowed" ? "good" : "bad"}
                  >
                    {selectedEntry.outcome}
                  </StatusLabel>
                </DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  {selectedEntry.id} · {selectedEntry.resource} ·{" "}
                  {selectedEntry.timestamp}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Actor</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {selectedEntry.actor}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Source IP</dt>
                    <dd className="mt-0.5 font-mono text-foreground tabular-nums">
                      {selectedEntry.ip}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Trace ID</dt>
                    <dd className="mt-0.5 font-mono text-foreground">
                      {selectedEntry.traceId}
                    </dd>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-muted-foreground">Ledger Digest</dt>
                    <dd className="mt-0.5 font-mono text-foreground">
                      {selectedEntry.digest}
                    </dd>
                  </div>
                </dl>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-medium">
                      Previous state
                    </p>
                    <pre className="bg-muted/40 overflow-x-auto rounded-lg border p-3 font-mono text-xs text-foreground">
                      {JSON.stringify(selectedEntry.before, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground text-xs font-medium">
                      New state
                    </p>
                    <pre className="bg-muted/40 overflow-x-auto rounded-lg border p-3 font-mono text-xs text-foreground">
                      {JSON.stringify(selectedEntry.after, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(
                      JSON.stringify(selectedEntry, null, 2)
                    );
                    setNotice("Copied audit event forensics JSON.");
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

export default DevOpsAuditLogView;
