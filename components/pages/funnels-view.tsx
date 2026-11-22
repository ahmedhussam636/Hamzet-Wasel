"use client";

import { useMemo, useState } from "react";
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
import { Details } from "@/components/dashboardblocks/details";
import { Flow4, type FlowPath } from "@/components/dashboardblocks/flow/flow-04";
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
import { Card, CardContent } from "@/components/ui/card";
import { formatCompact, formatNumber, formatPercent } from "@/lib/dashboardblocks/format";
import { initialFunnels } from "@/src/metadata/funnels-data";
import type { FunnelData } from "@/src/metadata/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const funnelConversionsKPIProps: LineChartKPI1Props = {
  title: "Funnel conversions",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 1_240, value: 1_410 },
    { label: "Tue", previous: 1_310, value: 1_520 },
    { label: "Wed", previous: 1_280, value: 1_390 },
    { label: "Thu", previous: 1_450, value: 1_680 },
    { label: "Fri", previous: 1_520, value: 1_790 },
    { label: "Sat", previous: 1_090, value: 1_260 },
    { label: "Sun", previous: 980, value: 1_370 },
  ],
};

const convertedRevenueKPIProps: AreaChartKPI2Props = {
  title: "Converted revenue",
  comparison: "last week",
  format: "currency",
  previous: 94_200,
  data: [
    { label: "Mon", value: 12_800 },
    { label: "Tue", value: 15_400 },
    { label: "Wed", value: 14_100 },
    { label: "Thu", value: 17_900 },
    { label: "Fri", value: 21_200 },
    { label: "Sat", value: 13_600 },
    { label: "Sun", value: 16_800 },
  ],
};

const funnelEntriesKPIProps: LineChartKPI1Props = {
  title: "Funnel entries",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 3_400, value: 3_620 },
    { label: "Tue", previous: 3_750, value: 3_980 },
    { label: "Wed", previous: 3_520, value: 3_490 },
    { label: "Thu", previous: 3_880, value: 4_210 },
    { label: "Fri", previous: 4_020, value: 4_460 },
    { label: "Sat", previous: 2_890, value: 3_120 },
    { label: "Sun", previous: 2_640, value: 2_740 },
  ],
};

const qualifiedUpgradesKPIProps: AreaChartKPI2Props = {
  title: "Pro upgrades",
  comparison: "last week",
  format: "compact",
  previous: 3_620,
  data: [
    { label: "Mon", value: 520 },
    { label: "Tue", value: 610 },
    { label: "Wed", value: 540 },
    { label: "Thu", value: 690 },
    { label: "Fri", value: 780 },
    { label: "Sat", value: 530 },
    { label: "Sun", value: 610 },
  ],
};

const FUNNEL_SHORT_NAMES: Record<string, string> = {
  "funnel-onboarding": "Onboarding",
  "funnel-checkout": "Checkout",
};

const FUNNEL_PATHS: Record<string, { goal: string; total: number; paths: FlowPath[] }> = {
  "funnel-onboarding": {
    goal: "Pro upgrade",
    total: 12_500,
    paths: [
      {
        converted: 1_840,
        count: 4_120,
        steps: ["Landing", "Sign up", "Verified", "Workspace", "Pro"],
      },
      {
        converted: 1_190,
        count: 2_860,
        steps: ["Pricing", "Sign up", "Verified", "Pro"],
      },
      {
        converted: 740,
        count: 2_340,
        steps: ["Docs", "Sign up", "Workspace", "Pro"],
      },
      {
        converted: 510,
        count: 1_980,
        steps: ["Blog", "Landing", "Sign up", "Verified"],
      },
    ],
  },
  "funnel-checkout": {
    goal: "Paid",
    total: 13_120,
    paths: [
      {
        converted: 2_940,
        count: 4_850,
        steps: ["Product", "Add to cart", "Checkout", "Paid"],
      },
      {
        converted: 1_780,
        count: 3_420,
        steps: ["Search", "Product", "Add to cart", "Paid"],
      },
      {
        converted: 960,
        count: 2_610,
        steps: ["Campaign", "Product", "Checkout", "Paid"],
      },
      {
        converted: 460,
        count: 2_240,
        steps: ["Home", "Collection", "Product", "Cart"],
      },
    ],
  },
};

function getStageHealth(dropOffRate: number): { label: string; tone: StatusTone } {
  if (dropOffRate === 0) return { label: "Entry", tone: "neutral" };
  if (dropOffRate >= 25) return { label: "Bottleneck", tone: "bad" };
  if (dropOffRate >= 18) return { label: "Watch", tone: "warning" };
  return { label: "Healthy", tone: "good" };
}

function shortStageLabel(name: string): string {
  if (name.length <= 16) return name;
  return `${name.slice(0, 15)}…`;
}

export function FunnelsView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const {
    refreshing: chartRefreshing,
    refreshKey: chartRefreshKey,
    triggerRefresh: triggerChartRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });
  const {
    refreshing: breakdownRefreshing,
    refreshKey: breakdownRefreshKey,
    triggerRefresh: triggerBreakdownRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });
  const {
    refreshing: tableRefreshing,
    refreshKey: tableRefreshKey,
    triggerRefresh: triggerTableRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });

  const [funnels] = useState<FunnelData[]>(initialFunnels);
  const [activeFunnelId, setActiveFunnelId] = useState<string>("funnel-onboarding");
  const hatchId = useChartId();

  const activeFunnels = state.isEmpty ? [] : funnels;
  const currentFunnel = useMemo(
    () => activeFunnels.find((f) => f.id === activeFunnelId) ?? activeFunnels[0],
    [activeFunnels, activeFunnelId]
  );

  const steps = currentFunnel?.steps ?? [];
  const topVisitors = steps[0]?.visitors ?? 0;

  const chartData = useMemo(
    () =>
      steps.map((step, index) => {
        const prevVisitors = index === 0 ? step.visitors : steps[index - 1].visitors;
        const dropped = Math.max(0, prevVisitors - step.visitors);
        return {
          dropped,
          label: `Step ${step.step}`,
          name: step.name,
          retainedRate: topVisitors ? step.visitors / topVisitors : 0,
          shortName: shortStageLabel(step.name),
          stepConv: step.conversionRate,
          visitors: step.visitors,
        };
      }),
    [steps, topVisitors]
  );

  const biggestDropStep = useMemo(() => {
    if (steps.length <= 1) return undefined;
    return steps.reduce((worst, step) =>
      step.dropOffRate > worst.dropOffRate ? step : worst
    );
  }, [steps]);

  const funnelFlowConfig =
    FUNNEL_PATHS[currentFunnel?.id ?? activeFunnelId] ??
    FUNNEL_PATHS["funnel-onboarding"];

  const chartState = getBlockState(state.status, steps);
  const isChartBusy = Boolean(state.refreshing || chartRefreshing);
  const isBreakdownBusy = Boolean(state.refreshing || breakdownRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  return (
    <div className="flex flex-col gap-4">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <LineChartKPI1
          {...funnelConversionsKPIProps}
          data={state.isEmpty ? [] : funnelConversionsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...convertedRevenueKPIProps}
          data={state.isEmpty ? [] : convertedRevenueKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...funnelEntriesKPIProps}
          data={state.isEmpty ? [] : funnelEntriesKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...qualifiedUpgradesKPIProps}
          data={state.isEmpty ? [] : qualifiedUpgradesKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Main Funnel Chart + Stage Progression Leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        {currentFunnel ? currentFunnel.name : "Conversion funnels"}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Retained users and step-to-step drop-off across each stage.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isChartBusy && <BlockBusyIndicator />}
                      {!state.isLoading && !state.isError && activeFunnels.length > 0 && (
                        <div
                          role="tablist"
                          aria-label="Select funnel"
                          className="bg-muted inline-flex items-center rounded-lg p-0.5"
                        >
                          {activeFunnels.map((funnel) => {
                            const active = funnel.id === currentFunnel?.id;
                            return (
                              <button
                                key={funnel.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setActiveFunnelId(funnel.id)}
                                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                                  active
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {FUNNEL_SHORT_NAMES[funnel.id] ?? funnel.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isChartBusy}
                        onClick={() => void triggerChartRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy refreshing={isChartBusy} label="Updating conversion funnel">
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">
                            Overall conversion
                          </dt>
                          <dd>
                            <KPIValue
                              value={currentFunnel?.overallRate}
                              format={(v) => `${v.toFixed(1)}%`}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {formatNumber(currentFunnel?.totalConversions ?? 0)} of{" "}
                              {formatNumber(topVisitors)} users
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Biggest drop-off
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={biggestDropStep?.dropOffRate}
                              format={(v) => `-${v.toFixed(1)}%`}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground truncate text-xs">
                              {biggestDropStep?.name ?? "—"}
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Completed goals
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={currentFunnel?.totalConversions}
                              format={(v) => formatCompact(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {steps.length} tracked stages
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!chartState || chartState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Retained users" },
                            {
                              color: "var(--color-muted-foreground)",
                              label: "Dropped at stage",
                              shape: "hatched",
                            },
                          ]}
                        />
                      )}

                      {chartState ? (
                        <ChartPlaceholder height={256} />
                      ) : (
                        <>
                          <ChartPanelFigure key={chartRefreshKey} className="h-64">
                            <ResponsiveContainer initialDimension={{ width: 480, height: 256 }} width="100%" height="100%">
                              <BarChart
                                aria-label={currentFunnel?.name ?? "Conversion funnel chart"}
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
                                  dataKey="visitors"
                                  name="Retained users"
                                  stackId="funnel"
                                  fill="var(--color-chart-2)"
                                  radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                  dataKey="dropped"
                                  name="Dropped at stage"
                                  stackId="funnel"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption={currentFunnel?.name ?? "Funnel stages"}
                            columns={[
                              { key: "name", label: "Stage" },
                              {
                                key: "visitors",
                                label: "Visitors",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "dropped",
                                label: "Dropped",
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

        {/* Stage Retention Leaderboard */}
        <div className="lg:col-span-5">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">Stage retention</h2>
                      <p className="text-muted-foreground text-sm">
                        Share of initial traffic remaining at each funnel step.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isBreakdownBusy && <BlockBusyIndicator />}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isBreakdownBusy}
                        onClick={() => void triggerBreakdownRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy refreshing={isBreakdownBusy} label="Updating stage retention">
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={5} />
                      {!chartState && (
                        <Leaderboard key={breakdownRefreshKey}>
                          {steps.map((step, index) => {
                            const pctOfTop = topVisitors
                              ? (step.visitors / topVisitors) * 100
                              : 0;
                            return (
                              <LeaderboardItem key={step.step} size="lg">
                                <LeaderboardRank variant="badge" medal rank={step.step} />
                                <LeaderboardBar value={pctOfTop} delay={index * 60} />
                                <LeaderboardLabel>
                                  <p className="truncate font-medium">{step.name}</p>
                                  <Details className="text-muted-foreground block truncate text-xs">
                                    <span>{step.avgDuration}</span>
                                    <span>
                                      {step.dropOffRate > 0
                                        ? `-${step.dropOffRate}% drop`
                                        : "Entry step"}
                                    </span>
                                  </Details>
                                </LeaderboardLabel>
                                <LeaderboardValue className="text-sm">
                                  <span>{formatNumber(step.visitors)}</span>
                                  <span className="text-muted-foreground block text-xs font-normal">
                                    {formatPercent(pctOfTop / 100, {
                                      maximumFractionDigits: 1,
                                    })}
                                  </span>
                                </LeaderboardValue>
                              </LeaderboardItem>
                            );
                          })}
                        </Leaderboard>
                      )}
                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground border-t pt-3 text-sm">
                          {currentFunnel
                            ? `${formatNumber(currentFunnel.totalConversions)} users reached the final goal (${currentFunnel.overallRate}% end-to-end).`
                            : "Select a funnel to view stage progression."}
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

      {/* Bottom Row: Stage Velocity Table + Top Converting Paths */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <BlockStateProvider errorMessage={state.errorMessage} state={chartState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container/data-table flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Stage velocity &amp; health
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Step conversion rate, drop-off, and median time spent per stage.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isTableBusy && <BlockBusyIndicator />}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isTableBusy}
                        onClick={() => void triggerTableRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy refreshing={isTableBusy} label="Updating stage velocity">
                    <div key={tableRefreshKey} className="border-t pt-1">
                      <DataTable density="compact" caption="Funnel stage velocity">
                        <DataTableHeader>
                          <DataTableRow>
                            <DataTableHead>Stage</DataTableHead>
                            <DataTableHead align="end">Users</DataTableHead>
                            <DataTableHead align="end">Step conv.</DataTableHead>
                            <DataTableHead align="end">Avg. time</DataTableHead>
                            <DataTableHead align="end">Health</DataTableHead>
                          </DataTableRow>
                        </DataTableHeader>
                        <DataTableBody>
                          <DataTableStateRows colSpan={5} rows={5} />
                          {!chartState &&
                            steps.map((step) => {
                              const health = getStageHealth(step.dropOffRate);
                              return (
                                <DataTableRow key={step.step}>
                                  <DataTableCell primary truncate>
                                    <span className="text-muted-foreground mr-2 font-mono text-xs tabular-nums">
                                      0{step.step}
                                    </span>
                                    <span>{step.name}</span>
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    {formatNumber(step.visitors)}
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    {step.conversionRate.toFixed(1)}%
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    {step.avgDuration}
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    <StatusLabel tone={health.tone}>
                                      {health.label}
                                    </StatusLabel>
                                  </DataTableCell>
                                </DataTableRow>
                              );
                            })}
                        </DataTableBody>
                      </DataTable>
                    </div>
                  </DashboardBusy>
                </section>
              </CardContent>
            </Card>
          </BlockStateProvider>
        </div>

        <div className="lg:col-span-6">
          <Flow4
            title="Top converting funnel paths"
            description="Most frequent multi-step sequences leading to goal completion."
            goal={funnelFlowConfig.goal}
            total={funnelFlowConfig.total}
            paths={state.isEmpty ? [] : funnelFlowConfig.paths}
            unit="users"
            refreshing={state.refreshing}
            status={state.status}
            errorMessage={state.errorMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default FunnelsView;
