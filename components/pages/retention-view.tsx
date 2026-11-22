"use client";

import { useMemo } from "react";
import {
  BlockReady,
  BlockStateProvider,
  getBlockState,
} from "@/components/dashboardblocks/block-state";
import {
  ChartPlaceholder,
  ChartTooltipContent,
  chartAxisProps,
  chartBarCursor,
  chartGridProps,
  chartReferenceProps,
  chartValueAxisWidth,
} from "@/components/dashboardblocks/chart";
import {
  ChartPanelFigure,
  ChartPanelLegend,
  ChartPanelTable,
} from "@/components/dashboardblocks/chart-panel";
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
  RetentionBar,
  getQuickRatio,
  growthColors,
} from "@/components/dashboardblocks/retention";
import {
  Retention2,
  retention2ExampleProps,
} from "@/components/dashboardblocks/retention/retention-02";
import {
  StatusLabel,
  type StatusTone,
} from "@/components/dashboardblocks/status-label";
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
import { formatCompact, formatNumber } from "@/lib/dashboardblocks/format";
import { initialRetentionCohorts } from "@/src/metadata/retention-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const retainedUsersKPIProps: LineChartKPI1Props = {
  title: "Retained users",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 9_800, value: 10_420 },
    { label: "Tue", previous: 10_200, value: 10_960 },
    { label: "Wed", previous: 9_950, value: 10_640 },
    { label: "Thu", previous: 10_540, value: 11_380 },
    { label: "Fri", previous: 10_820, value: 11_790 },
    { label: "Sat", previous: 8_410, value: 9_120 },
    { label: "Sun", previous: 8_190, value: 8_940 },
  ],
};

const retainedMrrKPIProps: AreaChartKPI2Props = {
  title: "Retained MRR",
  comparison: "last week",
  format: "currency",
  previous: 124_500,
  data: [
    { label: "Mon", value: 18_400 },
    { label: "Tue", value: 21_200 },
    { label: "Wed", value: 19_800 },
    { label: "Thu", value: 22_900 },
    { label: "Fri", value: 24_600 },
    { label: "Sat", value: 16_900 },
    { label: "Sun", value: 18_700 },
  ],
};

const returningSessionsKPIProps: LineChartKPI1Props = {
  title: "Returning sessions",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 14_200, value: 15_340 },
    { label: "Tue", previous: 15_100, value: 16_280 },
    { label: "Wed", previous: 14_600, value: 15_420 },
    { label: "Thu", previous: 15_800, value: 17_120 },
    { label: "Fri", previous: 16_400, value: 17_850 },
    { label: "Sat", previous: 11_200, value: 12_340 },
    { label: "Sun", previous: 10_900, value: 12_060 },
  ],
};

const resurrectedAccountsKPIProps: AreaChartKPI2Props = {
  title: "Resurrected accounts",
  comparison: "last week",
  format: "compact",
  previous: 1_120,
  data: [
    { label: "Mon", value: 175 },
    { label: "Tue", value: 198 },
    { label: "Wed", value: 182 },
    { label: "Thu", value: 224 },
    { label: "Fri", value: 248 },
    { label: "Sat", value: 146 },
    { label: "Sun", value: 162 },
  ],
};

interface GrowthPoint {
  label: string;
  new: number;
  resurrected: number;
  churned: number;
}

const GROWTH_ACCOUNTING_DATA: GrowthPoint[] = [
  { label: "Apr", new: 1_180, resurrected: 240, churned: -460 },
  { label: "May", new: 1_290, resurrected: 265, churned: -440 },
  { label: "Jun", new: 1_410, resurrected: 290, churned: -490 },
  { label: "Jul", new: 1_360, resurrected: 310, churned: -430 },
  { label: "Aug", new: 1_540, resurrected: 345, churned: -475 },
  { label: "Sep", new: 1_680, resurrected: 380, churned: -455 },
];

function getCohortHealth(day30: number): { label: string; tone: StatusTone } {
  if (day30 >= 50) return { label: "Strong", tone: "good" };
  if (day30 >= 45) return { label: "Healthy", tone: "info" };
  return { label: "Watch", tone: "warning" };
}

export function RetentionView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const {
    refreshing: growthRefreshing,
    refreshKey: growthRefreshKey,
    triggerRefresh: triggerGrowthRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });
  const {
    refreshing: tableRefreshing,
    refreshKey: tableRefreshKey,
    triggerRefresh: triggerTableRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });

  const growthData = state.isEmpty ? [] : GROWTH_ACCOUNTING_DATA;
  const milestoneCohorts = state.isEmpty ? [] : initialRetentionCohorts;

  const growthState = getBlockState(state.status, growthData);
  const tableState = getBlockState(state.status, milestoneCohorts);
  const isGrowthBusy = Boolean(state.refreshing || growthRefreshing);
  const isTableBusy = Boolean(state.refreshing || tableRefreshing);

  const growthSummary = useMemo(() => {
    const latest = growthData[growthData.length - 1];
    if (!latest) return { quickRatio: 0, netAdded: 0, gained: 0, lost: 0 };
    const churned = Math.abs(latest.churned);
    const gained = latest.new + latest.resurrected;
    return {
      quickRatio: getQuickRatio({
        churned,
        new: latest.new,
        resurrected: latest.resurrected,
      }),
      netAdded: gained - churned,
      gained,
      lost: churned,
    };
  }, [growthData]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <LineChartKPI1
          {...retainedUsersKPIProps}
          data={state.isEmpty ? [] : retainedUsersKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...retainedMrrKPIProps}
          data={state.isEmpty ? [] : retainedMrrKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...returningSessionsKPIProps}
          data={state.isEmpty ? [] : returningSessionsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...resurrectedAccountsKPIProps}
          data={state.isEmpty ? [] : resurrectedAccountsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Retention Curves (kept as requested) */}
      <Retention2
        {...retention2ExampleProps}
        link={undefined}
        cohorts={state.isEmpty ? [] : retention2ExampleProps.cohorts}
        refreshing={state.refreshing}
        status={state.status}
        errorMessage={state.errorMessage}
      />

      {/* Bottom Row: Growth Accounting & Cohort Retention Milestones */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <BlockStateProvider errorMessage={state.errorMessage} state={growthState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Growth accounting &amp; quick ratio
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Monthly new and resurrected accounts balanced against churned users.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isGrowthBusy && <BlockBusyIndicator />}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isGrowthBusy}
                        onClick={() => void triggerGrowthRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy
                    refreshing={isGrowthBusy}
                    label="Updating growth accounting"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">Quick ratio</dt>
                          <dd>
                            <KPIValue
                              value={growthSummary.quickRatio}
                              format={(v) => `${v.toFixed(1)}×`}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              +{formatNumber(growthSummary.netAdded)} net accounts in Sep
                            </dd>
                          </BlockReady>
                        </div>
                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">Gained</dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={growthSummary.gained}
                              format={(v) => formatCompact(v)}
                            />
                          </dd>
                        </div>
                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">Churned</dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={growthSummary.lost}
                              format={(v) => formatCompact(v)}
                            />
                          </dd>
                        </div>
                      </dl>

                      {(!growthState || growthState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: growthColors.new, label: "New" },
                            { color: growthColors.resurrected, label: "Resurrected" },
                            { color: growthColors.churned, label: "Churned" },
                          ]}
                        />
                      )}

                      {growthState ? (
                        <ChartPlaceholder height={224} />
                      ) : (
                        <>
                          <ChartPanelFigure key={growthRefreshKey} className="h-56">
                            <ResponsiveContainer initialDimension={{ width: 480, height: 224 }} width="100%" height="100%">
                              <BarChart
                                aria-label="Growth accounting chart"
                                data={growthData}
                                stackOffset="sign"
                                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                              >
                                <CartesianGrid {...chartGridProps} />
                                <XAxis {...chartAxisProps} dataKey="label" />
                                <YAxis
                                  {...chartAxisProps}
                                  tickFormatter={(value: number) => formatCompact(value)}
                                  width={chartValueAxisWidth}
                                />
                                <ReferenceLine {...chartReferenceProps} y={0} />
                                <Tooltip
                                  cursor={chartBarCursor}
                                  content={(tooltipProps) => (
                                    <ChartTooltipContent
                                      {...tooltipProps}
                                      valueFormatter={(value) =>
                                        `${formatNumber(Math.abs(value))} accounts`
                                      }
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="new"
                                  name="New"
                                  stackId="growth"
                                  fill={growthColors.new}
                                  radius={[0, 0, 0, 0]}
                                />
                                <Bar
                                  dataKey="resurrected"
                                  name="Resurrected"
                                  stackId="growth"
                                  fill={growthColors.resurrected}
                                  radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                  dataKey="churned"
                                  name="Churned"
                                  stackId="growth"
                                  fill={growthColors.churned}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Monthly growth accounting"
                            columns={[
                              { key: "label", label: "Month" },
                              { key: "new", label: "New", format: (v) => formatNumber(v) },
                              {
                                key: "resurrected",
                                label: "Resurrected",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "churned",
                                label: "Churned",
                                format: (v) => formatNumber(Math.abs(v)),
                              },
                            ]}
                            rows={growthData}
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

        <div className="lg:col-span-6">
          <BlockStateProvider errorMessage={state.errorMessage} state={tableState}>
            <Card className="h-full">
              <CardContent>
                <section className="@container/data-table flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Cohort retention milestones
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Day 1, Day 7, and Day 30 retention benchmarks by weekly signup cohort.
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

                  <DashboardBusy
                    refreshing={isTableBusy}
                    label="Updating cohort milestones"
                  >
                    <div key={tableRefreshKey} className="flex flex-col gap-3 border-t pt-1">
                      <DataTable density="compact" caption="Cohort retention milestones">
                        <DataTableHeader>
                          <DataTableRow>
                            <DataTableHead>Cohort</DataTableHead>
                            <DataTableHead align="end">Users</DataTableHead>
                            <DataTableHead align="end">D1</DataTableHead>
                            <DataTableHead align="end">D7</DataTableHead>
                            <DataTableHead align="end">D30</DataTableHead>
                            <DataTableHead align="end">Health</DataTableHead>
                          </DataTableRow>
                        </DataTableHeader>
                        <DataTableBody>
                          <DataTableStateRows colSpan={6} rows={5} />
                          {!tableState &&
                            milestoneCohorts.map((cohort) => {
                              const health = getCohortHealth(cohort.day30);
                              return (
                                <DataTableRow key={cohort.cohortDate}>
                                  <DataTableCell primary truncate>
                                    <span className="block truncate">{cohort.cohortDate}</span>
                                    <RetentionBar
                                      className="mt-1.5 h-1.5 max-w-28"
                                      value={cohort.day30 / 100}
                                    />
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    {formatNumber(cohort.totalUsers)}
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    {cohort.day1.toFixed(1)}%
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    {cohort.day7.toFixed(1)}%
                                  </DataTableCell>
                                  <DataTableCell align="end">
                                    {cohort.day30.toFixed(1)}%
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

                      <BlockReady className="border-t pt-3 text-sm">
                        <p className="text-muted-foreground border-t pt-3 text-sm">
                          {milestoneCohorts.length > 0
                            ? `Latest cohort (${milestoneCohorts[milestoneCohorts.length - 1].cohortDate}) reached ${milestoneCohorts[milestoneCohorts.length - 1].day30}% Day-30 retention, up from ${milestoneCohorts[0].day30}%.`
                            : "No cohorts recorded for this period."}
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
    </div>
  );
}

export default RetentionView;
