"use client";

import { useEffect, useState } from "react";
import { AudienceMix } from "@/components/audience-mix";
import { BrowserShare } from "@/components/browser-share";
import { OnlineNow } from "@/components/online-now";
import { Geo3, geo3ExampleProps } from "@/components/dashboardblocks/geo/geo-03";
import { Heatmap1, heatmap1ExampleProps } from "@/components/dashboardblocks/heatmap/heatmap-01";
import { LineChartKPI1, lineChartKpi1ExampleProps, type LineChartKPI1Props } from "@/components/dashboardblocks/kpi/line-chart-kpi-01";
import { AreaChartKPI2, areaChartKpi2ExampleProps, type AreaChartKPI2Props } from "@/components/dashboardblocks/kpi/area-chart-kpi-02";
import { TopPages } from "@/components/top-pages";
import { TopReferrers } from "@/components/top-referrers";
import { TrafficSourcesChart } from "@/components/traffic-sources-chart";
import { VisitorsChart } from "@/components/visitors-chart";
import { WebVitals } from "@/components/web-vitals";
import { type BlockStatus } from "@/components/dashboard-state";

const newCustomersKPIProps: LineChartKPI1Props = {
	title: "New customers",
	comparison: "last month",
	currentLabel: "This month",
	format: "compact",
	data: [
		{ label: "W1", previous: 320, value: 410 },
		{ label: "W2", previous: 360, value: 440 },
		{ label: "W3", previous: 390, value: 490 },
		{ label: "W4", previous: 410, value: 540 },
	],
};

const activeAccountsKPIProps: AreaChartKPI2Props = {
	title: "Active accounts",
	comparison: "last month",
	format: "compact",
	previous: 13450,
	data: [
		{ label: "W1", value: 3420 },
		{ label: "W2", value: 3680 },
		{ label: "W3", value: 3810 },
		{ label: "W4", value: 4180 },
	],
};

export interface DashboardProps {
	initialStatus?: BlockStatus;
	refreshing?: boolean;
	empty?: boolean;
	errorMessage?: string;
}

export function Dashboard({
	initialStatus,
	refreshing = false,
	empty = false,
	errorMessage,
}: DashboardProps = {}) {
	// Skeleton loading runs briefly on initial load, then resolves to ready state
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
		}, 500);
		return () => clearTimeout(timer);
	}, [initialStatus]);

	const handleRetry = () => {
		setStatus("loading");
		setTimeout(() => setStatus(undefined), 500);
	};

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			{/* Top KPI row */}
			<LineChartKPI1
				{...lineChartKpi1ExampleProps}
				data={empty ? [] : lineChartKpi1ExampleProps.data}
				refreshing={refreshing}
				status={status}
				errorMessage={errorMessage}
			/>
			<AreaChartKPI2
				{...areaChartKpi2ExampleProps}
				data={empty ? [] : areaChartKpi2ExampleProps.data}
				refreshing={refreshing}
				status={status}
				errorMessage={errorMessage}
			/>
			<LineChartKPI1
				{...newCustomersKPIProps}
				data={empty ? [] : newCustomersKPIProps.data}
				refreshing={refreshing}
				status={status}
				errorMessage={errorMessage}
			/>
			<AreaChartKPI2
				{...activeAccountsKPIProps}
				data={empty ? [] : activeAccountsKPIProps.data}
				refreshing={refreshing}
				status={status}
				errorMessage={errorMessage}
			/>

			{/* Existing Dashboard Analytics */}
			<VisitorsChart
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
			<OnlineNow
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
			<TopPages
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
			<div className="md:col-span-2">
				<Geo3
					{...geo3ExampleProps}
					locations={empty ? [] : geo3ExampleProps.locations}
					refreshing={refreshing}
					status={status}
					errorMessage={errorMessage}
				/>
			</div>

			{/* Middle Activity Heatmap */}
			<div className="md:col-span-2 lg:col-span-4">
				<Heatmap1
					{...heatmap1ExampleProps}
					values={empty ? [] : heatmap1ExampleProps.values}
					refreshing={refreshing}
					status={status}
					errorMessage={errorMessage}
				/>
			</div>

			<TrafficSourcesChart
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
			<AudienceMix
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
			<BrowserShare
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
			<TopReferrers
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
			<WebVitals
				status={status}
				refreshing={refreshing}
				empty={empty}
				errorMessage={errorMessage}
				onRetry={handleRetry}
			/>
		</div>
	);
}
