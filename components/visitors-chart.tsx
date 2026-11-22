"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatInteger } from "@/components/formater";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import {
	BlockBusyIndicator,
	ChartRefreshButton,
	DashboardBusy,
	DashboardChartSkeleton,
	DashboardEmptyState,
	DashboardErrorState,
	Skeleton,
	useChartRefresh,
	type DashboardBlockStateProps,
} from "@/components/dashboard-state";

const defaultChartData = [
	{ month: "January", visitors: 555 },
	{ month: "February", visitors: 904 },
	{ month: "March", visitors: 727 },
	{ month: "April", visitors: 801 },
	{ month: "May", visitors: 942 },
	{ month: "June", visitors: 1048 },
	{ month: "July", visitors: 702 },
	{ month: "August", visitors: 1103 },
	{ month: "September", visitors: 879 },
	{ month: "October", visitors: 1046 },
	{ month: "November", visitors: 1407 },
	{ month: "December", visitors: 548 },
];

const chartConfig = {
	visitors: {
		label: "Visitors",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export interface VisitorsChartProps extends DashboardBlockStateProps {
	data?: { month: string; visitors: number }[];
}

export function VisitorsChart({
	status,
	errorMessage,
	empty,
	refreshing: externalRefreshing,
	onRetry,
	onRefresh,
	data = defaultChartData,
}: VisitorsChartProps = {}) {
	const gradientId = `visitors-area-${useId().replace(/:/g, "")}`;
	const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
		onRefresh,
	});
	const refreshing = Boolean(externalRefreshing || localRefreshing);

	const activeData = empty ? [] : data;
	const totalVisitors = activeData.reduce((sum, row) => sum + row.visitors, 0);
	const isLoading = status === "loading";
	const isError = status === "error";
	const isEmpty = !isLoading && !isError && activeData.length === 0;

	return (
		<Card className="md:col-span-2 lg:col-span-3 dark:bg-transparent">
			<CardHeader className="flex flex-row items-start justify-between gap-2">
				<div className="flex flex-col gap-1.5">
					<CardTitle className="font-mono text-2xl tabular-nums">
						{isLoading ? (
							<Skeleton className="h-8 w-28" />
						) : isError || isEmpty ? (
							"—"
						) : (
							formatInteger(totalVisitors)
						)}
					</CardTitle>
					<CardDescription className="text-pretty">
						Total visitors in the last 12 months.
					</CardDescription>
				</div>
				<div className="flex items-center gap-2.5">
					{refreshing && <BlockBusyIndicator />}
					{!isLoading && !isError && !isEmpty && (
						<Delta value={7.2} variant="badge">
							<DeltaIcon variant="trend" />
							<DeltaValue suffix="%" />
							<span className="hidden sm:inline">vs prior 12 months</span>
						</Delta>
					)}
					<ChartRefreshButton
						disabled={isLoading}
						refreshing={refreshing}
						onClick={() => void triggerRefresh()}
					/>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<DashboardChartSkeleton height={240} />
				) : isError ? (
					<DashboardErrorState
						title="Couldn’t load visitors"
						description={errorMessage ?? "The analytics query failed. Try refreshing."}
						onRetry={onRetry ?? (() => void triggerRefresh())}
					/>
				) : isEmpty ? (
					<DashboardEmptyState
						title="No visitor data yet"
						description="Visitor traffic will appear here once sessions are recorded."
					/>
				) : (
					<DashboardBusy refreshing={refreshing} label="Updating visitors chart">
						<ChartContainer
							key={refreshKey}
							className="aspect-auto h-60 w-full"
							config={chartConfig}
						>
							<AreaChart
								accessibilityLayer
								data={activeData}
								margin={{
									left: 12,
									right: 12,
								}}
							>
								<defs>
									<linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
										<stop
											offset="0%"
											stopColor="var(--color-visitors)"
											stopOpacity={0.35}
										/>
										<stop
											offset="100%"
											stopColor="var(--color-visitors)"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid vertical={false} />
								<XAxis
									axisLine={false}
									dataKey="month"
									tickFormatter={(value) => String(value).slice(0, 3)}
									tickLine={false}
									tickMargin={8}
								/>
								<ChartTooltip
									content={<ChartTooltipContent indicator="dashed" />}
									cursor={{
										stroke: "var(--color-visitors)",
										strokeDasharray: "3 3",
										strokeLinecap: "round",
									}}
									wrapperStyle={{ outline: "none" }}
								/>
								<Area
									dataKey="visitors"
									dot={{
										fill: "var(--color-visitors)",
										r: 2.5,
										strokeWidth: 2,
									}}
									fill={`url(#${gradientId})`}
									isAnimationActive={refreshKey > 0}
									name={chartConfig.visitors.label}
									stroke="var(--color-visitors)"
									strokeWidth={2}
									type="linear"
								/>
							</AreaChart>
						</ChartContainer>
					</DashboardBusy>
				)}
			</CardContent>
		</Card>
	);
}
