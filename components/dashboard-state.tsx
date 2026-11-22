"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
	BlockBusy,
	BlockBusyIndicator,
	BlockMessage,
	BlockStateProvider,
	type BlockStateProps,
	type BlockStatus,
	Skeleton,
	SkeletonText,
	getBlockState,
} from "@/components/dashboardblocks/block-state";
import { ChartPlaceholder } from "@/components/dashboardblocks/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircleIcon, InboxIcon, RefreshCwIcon } from "lucide-react";

export interface DashboardBlockStateProps extends BlockStateProps {
	empty?: boolean;
	refreshing?: boolean;
	onRetry?: () => void;
	onRefresh?: () => void;
}

export function usePageBlockState({
	status: initialStatus,
	refreshing = false,
	empty = false,
	errorMessage,
	initialLoadingMs = 450,
}: DashboardBlockStateProps & { initialLoadingMs?: number } = {}) {
	const [status, setStatus] = useState<BlockStatus | undefined>(
		initialStatus ?? "loading"
	);

	useEffect(() => {
		if (initialStatus !== undefined) {
			setStatus(initialStatus);
			return;
		}
		const timer = setTimeout(() => {
			setStatus(undefined);
		}, initialLoadingMs);
		return () => clearTimeout(timer);
	}, [initialStatus, initialLoadingMs]);

	const handleRetry = () => {
		setStatus("loading");
		setTimeout(() => setStatus(undefined), initialLoadingMs);
	};

	return {
		status,
		isLoading: status === "loading",
		isError: status === "error",
		isEmpty: status !== "loading" && status !== "error" && empty,
		refreshing,
		errorMessage,
		handleRetry,
	};
}

export function DashboardEmptyState({
	title = "No data yet",
	description = "There is nothing to display for this period.",
	action,
	icon,
	className,
}: {
	title?: string;
	description?: string;
	action?: ReactNode;
	icon?: ReactNode;
	className?: string;
}) {
	return (
		<BlockMessage
			className={className}
			icon={icon ?? <InboxIcon />}
			title={title}
			description={description}
			action={action}
		/>
	);
}

export function DashboardErrorState({
	title = "Couldn’t load data",
	description = "Something went wrong while fetching this block. Try again in a moment.",
	onRetry,
	className,
}: {
	title?: string;
	description?: string;
	onRetry?: () => void;
	className?: string;
}) {
	return (
		<BlockMessage
			className={className}
			tone="error"
			icon={<AlertCircleIcon />}
			title={title}
			description={description}
			action={
				onRetry ? (
					<Button variant="outline" size="sm" onClick={onRetry}>
						<RefreshCwIcon className="size-3.5" />
						Try again
					</Button>
				) : undefined
			}
		/>
	);
}

export function DashboardListSkeleton({ rows = 5 }: { rows?: number }) {
	return (
		<div className="flex flex-col divide-y divide-border/50 px-6 py-2">
			<span className="sr-only">Loading</span>
			{Array.from({ length: rows }, (_, i) => (
				<div key={i} className="flex items-center justify-between gap-4 py-2.5">
					<SkeletonText className="w-1/2" />
					<SkeletonText className="w-14" />
				</div>
			))}
		</div>
	);
}

export function DashboardStatsSkeleton({ columns = 3 }: { columns?: number }) {
	return (
		<div
			className={
				columns === 4
					? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
					: "grid grid-cols-1 sm:grid-cols-3 gap-6"
			}
		>
			<span className="sr-only">Loading</span>
			{Array.from({ length: columns }, (_, i) => (
				<div key={i} className="flex flex-col gap-2">
					<Skeleton className="h-3.5 w-20" />
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-3 w-32" />
				</div>
			))}
		</div>
	);
}

export function DashboardMetricCardsSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<span className="sr-only">Loading metrics</span>
			{Array.from({ length: count }, (_, i) => (
				<Card key={i} className="dark:bg-card/50">
					<CardHeader className="p-4 pb-2">
						<Skeleton className="h-3.5 w-24" />
						<Skeleton className="h-7 w-20 mt-2" />
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<Skeleton className="h-3.5 w-32" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function DashboardChartSkeleton({ height = 240 }: { height?: number }) {
	return (
		<div className="flex flex-col gap-3">
			<span className="sr-only">Loading</span>
			<ChartPlaceholder height={height} />
		</div>
	);
}

export function DashboardBusy({
	refreshing = false,
	label = "Updating",
	children,
	className,
}: {
	refreshing?: boolean;
	label?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<BlockBusy busy={refreshing} label={label} className={className}>
			{children}
		</BlockBusy>
	);
}

export function useChartRefresh({
	onRefresh,
	durationMs = 650,
}: {
	onRefresh?: () => void | Promise<void>;
	durationMs?: number;
} = {}) {
	const [refreshing, setRefreshing] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const triggerRefresh = async () => {
		if (refreshing) return;
		setRefreshing(true);
		try {
			await onRefresh?.();
		} finally {
			setTimeout(() => {
				setRefreshKey((k) => k + 1);
				setRefreshing(false);
			}, durationMs);
		}
	};

	return { refreshing, refreshKey, triggerRefresh };
}

export function ChartRefreshButton({
	refreshing = false,
	disabled = false,
	compact = false,
	onClick,
	className,
}: {
	refreshing?: boolean;
	disabled?: boolean;
	compact?: boolean;
	onClick: () => void;
	className?: string;
}) {
	return (
		<Button
			type="button"
			variant="outline"
			size={compact ? "icon-sm" : "sm"}
			disabled={disabled || refreshing}
			onClick={onClick}
			title="Refresh chart"
			aria-label="Refresh chart"
			className={
				compact
					? `size-7 shrink-0 cursor-pointer ${className ?? ""}`
					: `h-7 gap-1.5 text-xs shrink-0 cursor-pointer ${className ?? ""}`
			}
		>
			<RefreshCwIcon className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
			{!compact && <span>Refresh</span>}
		</Button>
	);
}

export {
	BlockBusyIndicator,
	BlockStateProvider,
	Skeleton,
	SkeletonText,
	getBlockState,
	type BlockStatus,
};
