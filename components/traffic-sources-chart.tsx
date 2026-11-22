"use client";

import { formatCompactNumber } from "@/components/formater";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ShareBarList,
	ShareBarListContent,
	ShareBarListFill,
	ShareBarListItem,
	ShareBarListLabel,
	ShareBarListValue,
} from "@/components/share-bar-list";
import {
	BlockBusyIndicator,
	ChartRefreshButton,
	DashboardBusy,
	DashboardEmptyState,
	DashboardErrorState,
	DashboardListSkeleton,
	useChartRefresh,
	type DashboardBlockStateProps,
} from "@/components/dashboard-state";

const defaultChartData = [
	{ source: "Organic search", sessions: 4120 },
	{ source: "Direct", sessions: 2890 },
	{ source: "Referral", sessions: 1640 },
	{ source: "Paid social", sessions: 980 },
	{ source: "Email", sessions: 620 },
] as const;

export interface TrafficSourcesChartProps extends DashboardBlockStateProps {
	data?: readonly { source: string; sessions: number }[];
}

export function TrafficSourcesChart({
	status,
	errorMessage,
	empty,
	refreshing: externalRefreshing,
	onRetry,
	onRefresh,
	data = defaultChartData,
}: TrafficSourcesChartProps = {}) {
	const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
		onRefresh,
	});
	const refreshing = Boolean(externalRefreshing || localRefreshing);

	const activeData = empty ? [] : data;
	const maxSessions = activeData.length
		? Math.max(...activeData.map((d) => d.sessions))
		: 0;

	function barWidthPercent(sessions: number) {
		if (maxSessions <= 0) {
			return 0;
		}
		return (sessions / maxSessions) * 75;
	}

	const isLoading = status === "loading";
	const isError = status === "error";
	const isEmpty = !isLoading && !isError && activeData.length === 0;

	return (
		<Card className="dark:bg-transparent">
			<CardHeader className="border-b flex flex-row items-start justify-between gap-2">
				<div className="space-y-1">
					<CardTitle className="text-balance">Sessions by source</CardTitle>
					<CardDescription className="text-pretty">
						Attributed sessions in the last 12 months.
					</CardDescription>
				</div>
				<div className="flex items-center gap-1.5">
					{refreshing && <BlockBusyIndicator label="" />}
					<ChartRefreshButton
						compact
						disabled={isLoading}
						refreshing={refreshing}
						onClick={() => void triggerRefresh()}
					/>
				</div>
			</CardHeader>
			<CardContent className="p-0 py-1">
				{isLoading ? (
					<DashboardListSkeleton rows={5} />
				) : isError ? (
					<DashboardErrorState
						title="Couldn’t load traffic sources"
						description={errorMessage ?? "Unable to load source attribution."}
						onRetry={onRetry ?? (() => void triggerRefresh())}
					/>
				) : isEmpty ? (
					<DashboardEmptyState
						title="No traffic sources yet"
						description="Attributed sessions will appear here once recorded."
					/>
				) : (
					<DashboardBusy
						key={refreshKey}
						refreshing={refreshing}
						label="Updating traffic sources"
					>
						<ShareBarList aria-label="Sessions by traffic source">
							{activeData.map((row) => (
								<ShareBarListItem
									key={row.source}
									value={barWidthPercent(row.sessions)}
								>
									<ShareBarListContent>
										<ShareBarListLabel>{row.source}</ShareBarListLabel>
										<ShareBarListValue>
											{formatCompactNumber(row.sessions)}
										</ShareBarListValue>
									</ShareBarListContent>
									<ShareBarListFill />
								</ShareBarListItem>
							))}
						</ShareBarList>
					</DashboardBusy>
				)}
			</CardContent>
		</Card>
	);
}
