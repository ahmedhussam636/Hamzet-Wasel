"use client";

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

const defaultSegments = [
	{ label: "Returning visitors", share: 54 },
	{ label: "New visitors", share: 41 },
	{ label: "Logged-in users", share: 5 },
] as const;

export interface AudienceMixProps extends DashboardBlockStateProps {
	data?: readonly { label: string; share: number }[];
}

export function AudienceMix({
	status,
	errorMessage,
	empty,
	refreshing: externalRefreshing,
	onRetry,
	onRefresh,
	data = defaultSegments,
}: AudienceMixProps = {}) {
	const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
		onRefresh,
	});
	const refreshing = Boolean(externalRefreshing || localRefreshing);

	const activeSegments = empty ? [] : data;
	const isLoading = status === "loading";
	const isError = status === "error";
	const isEmpty = !isLoading && !isError && activeSegments.length === 0;

	return (
		<Card className="dark:bg-transparent">
			<CardHeader className="border-b flex flex-row items-start justify-between gap-2">
				<div className="space-y-1">
					<CardTitle className="text-balance">Audience mix</CardTitle>
					<CardDescription className="text-pretty">
						Session split by familiarity in the last 12 months.
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
					<DashboardListSkeleton rows={3} />
				) : isError ? (
					<DashboardErrorState
						title="Couldn’t load audience mix"
						description={errorMessage ?? "Unable to load visitor familiarity data."}
						onRetry={onRetry ?? (() => void triggerRefresh())}
					/>
				) : isEmpty ? (
					<DashboardEmptyState
						title="No audience data yet"
						description="Audience mix breakdown will appear once sessions are tracked."
					/>
				) : (
					<DashboardBusy
						key={refreshKey}
						refreshing={refreshing}
						label="Updating audience mix"
					>
						<ShareBarList aria-label="Audience segments by share of sessions">
							{activeSegments.map((row) => (
								<ShareBarListItem key={row.label} value={row.share}>
									<ShareBarListContent>
										<ShareBarListLabel>{row.label}</ShareBarListLabel>
										<ShareBarListValue>{row.share}%</ShareBarListValue>
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
