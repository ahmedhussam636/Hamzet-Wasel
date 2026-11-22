"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { StatusIndicator } from "@/components/indicator";
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
	Skeleton,
	useChartRefresh,
	type DashboardBlockStateProps,
} from "@/components/dashboard-state";

const defaultDevices = [
	{ label: "Mobile", share: 65 },
	{ label: "Desktop", share: 33 },
	{ label: "Tablet", share: 2 },
] as const;

export interface OnlineNowProps extends DashboardBlockStateProps {
	count?: number;
	devices?: readonly { label: string; share: number }[];
}

export function OnlineNow({
	status,
	errorMessage,
	empty,
	refreshing: externalRefreshing,
	onRetry,
	onRefresh,
	count = 94,
	devices = defaultDevices,
}: OnlineNowProps = {}) {
	const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
		onRefresh,
	});
	const refreshing = Boolean(externalRefreshing || localRefreshing);

	const activeDevices = empty ? [] : devices;
	const isLoading = status === "loading";
	const isError = status === "error";
	const isEmpty = !isLoading && !isError && activeDevices.length === 0;

	return (
		<Card className="gap-0 pb-0 md:col-span-2 lg:col-span-1 dark:bg-transparent">
			<CardHeader className="flex flex-row items-start justify-between gap-2 border-b">
				<div className="flex min-w-0 flex-col gap-0">
					<CardTitle className="font-mono text-2xl tabular-nums">
						{isLoading ? (
							<Skeleton className="h-8 w-14 mb-1" />
						) : isError || isEmpty ? (
							"—"
						) : (
							count
						)}
					</CardTitle>
					<CardDescription>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										className={cn(
											"cursor-help px-1 py-px font-normal text-muted-foreground",
											"hover:underline-0"
										)}
										type="button"
										variant="link"
									/>
								}
							>
								<StatusIndicator />
								<span>visitors online</span>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								In the last 5 minutes.
							</TooltipContent>
						</Tooltip>
					</CardDescription>
				</div>
				<div className="flex items-center gap-1.5">
					{refreshing && <BlockBusyIndicator label="" />}
					{!isLoading && !isError && !isEmpty && (
						<Delta value={14.8} variant="badge">
							<DeltaIcon variant="trend" />
							<DeltaValue suffix="%" />
						</Delta>
					)}
					<ChartRefreshButton
						compact
						disabled={isLoading}
						refreshing={refreshing}
						onClick={() => void triggerRefresh()}
					/>
				</div>
			</CardHeader>
			<CardContent
				className={cn("relative flex h-full items-center px-0 py-2")}
			>
				{isLoading ? (
					<div className="w-full">
						<DashboardListSkeleton rows={3} />
					</div>
				) : isError ? (
					<div className="w-full">
						<DashboardErrorState
							title="Couldn’t load live count"
							description={errorMessage ?? "Connection to live telemetry failed."}
							onRetry={onRetry ?? (() => void triggerRefresh())}
						/>
					</div>
				) : isEmpty ? (
					<div className="w-full">
						<DashboardEmptyState
							title="No active visitors"
							description="Active device breakdown appears here when visitors are online."
						/>
					</div>
				) : (
					<DashboardBusy
						key={refreshKey}
						refreshing={refreshing}
						label="Updating online visitors"
						className="w-full"
					>
						<ShareBarList>
							{activeDevices.map((d) => (
								<ShareBarListItem key={d.label} value={d.share}>
									<ShareBarListContent>
										<ShareBarListLabel>{d.label}</ShareBarListLabel>
										<ShareBarListValue>{d.share}%</ShareBarListValue>
									</ShareBarListContent>
									<ShareBarListFill data-online-bar />
								</ShareBarListItem>
							))}
						</ShareBarList>
					</DashboardBusy>
				)}
			</CardContent>
		</Card>
	);
}
