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

const defaultBrowsers = [
	{ label: "Chrome", share: 58 },
	{ label: "Safari", share: 22 },
	{ label: "Edge", share: 9 },
	{ label: "Firefox", share: 7 },
	{ label: "Other", share: 4 },
] as const;

export interface BrowserShareProps extends DashboardBlockStateProps {
	data?: readonly { label: string; share: number }[];
}

export function BrowserShare({
	status,
	errorMessage,
	empty,
	refreshing: externalRefreshing,
	onRetry,
	onRefresh,
	data = defaultBrowsers,
}: BrowserShareProps = {}) {
	const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
		onRefresh,
	});
	const refreshing = Boolean(externalRefreshing || localRefreshing);

	const activeBrowsers = empty ? [] : data;
	const isLoading = status === "loading";
	const isError = status === "error";
	const isEmpty = !isLoading && !isError && activeBrowsers.length === 0;

	return (
		<Card className="dark:bg-transparent">
			<CardHeader className="border-b flex flex-row items-start justify-between gap-2">
				<div className="space-y-1">
					<CardTitle className="text-balance">Browsers</CardTitle>
					<CardDescription className="text-pretty">
						Share of sessions by primary browser family.
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
						title="Couldn’t load browser share"
						description={errorMessage ?? "Unable to fetch browser distribution."}
						onRetry={onRetry ?? (() => void triggerRefresh())}
					/>
				) : isEmpty ? (
					<DashboardEmptyState
						title="No browser data yet"
						description="Browser analytics will populate once sessions arrive."
					/>
				) : (
					<DashboardBusy
						key={refreshKey}
						refreshing={refreshing}
						label="Updating browser share"
					>
						<ShareBarList aria-label="Sessions by browser">
							{activeBrowsers.map((row) => (
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
