import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import {
	BlockBusyIndicator,
	DashboardBusy,
	DashboardEmptyState,
	DashboardErrorState,
	DashboardStatsSkeleton,
	type DashboardBlockStateProps,
} from "@/components/dashboard-state";

const defaultVitals = [
	{
		label: "LCP",
		name: "Largest Contentful Paint",
		value: "1.9s",
		delta: 120,
		deltaLabel: "faster vs prior month",
		suffix: "ms",
	},
	{
		label: "INP",
		name: "Interaction to Next Paint",
		value: "142ms",
		delta: 18,
		deltaLabel: "faster vs prior month",
		suffix: "ms",
	},
	{
		label: "CLS",
		name: "Cumulative Layout Shift",
		value: "0.04",
		delta: 0.07,
		deltaLabel: "lower vs prior month",
		suffix: "",
	},
] as const;

export interface WebVitalsProps extends DashboardBlockStateProps {
	data?: readonly {
		label: string;
		name: string;
		value: string;
		delta: number;
		deltaLabel: string;
		suffix: string;
	}[];
}

export function WebVitals({
	status,
	errorMessage,
	empty,
	refreshing,
	onRetry,
	data = defaultVitals,
}: WebVitalsProps = {}) {
	const activeVitals = empty ? [] : data;
	const isLoading = status === "loading";
	const isError = status === "error";
	const isEmpty = !isLoading && !isError && activeVitals.length === 0;

	return (
		<Card className="md:col-span-2 lg:col-span-4 dark:bg-transparent">
			<CardHeader className="border-b flex flex-row items-start justify-between gap-2">
				<div className="space-y-1">
					<CardTitle className="text-balance">Core Web Vitals</CardTitle>
					<CardDescription className="text-pretty">
						Field experience on real sessions, measured at the origin.
					</CardDescription>
				</div>
				{refreshing && <BlockBusyIndicator />}
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<DashboardStatsSkeleton columns={3} />
				) : isError ? (
					<DashboardErrorState
						title="Couldn’t load Web Vitals"
						description={errorMessage ?? "Origin performance metrics are temporarily unavailable."}
						onRetry={onRetry}
					/>
				) : isEmpty ? (
					<DashboardEmptyState
						title="No Web Vitals collected yet"
						description="Core Web Vitals appear once enough real user sessions are sampled."
					/>
				) : (
					<DashboardBusy refreshing={refreshing} label="Updating Core Web Vitals">
						<ul className="grid gap-6 sm:grid-cols-3">
							{activeVitals.map((v) => (
								<li className="flex flex-col gap-1" key={v.label}>
									<p className="text-pretty font-medium text-sm">{v.label}</p>
									<p className="text-pretty text-muted-foreground text-xs">
										{v.name}
									</p>
									<p className="text-balance font-semibold text-2xl tabular-nums">
										{v.value}
									</p>
									<div className="flex items-center gap-1.5 text-pretty text-muted-foreground text-xs">
										<Delta value={v.delta} variant="default">
											<DeltaIcon />
											<DeltaValue suffix={v.suffix} />
										</Delta>
										<span>{v.deltaLabel}</span>
									</div>
								</li>
							))}
						</ul>
					</DashboardBusy>
				)}
			</CardContent>
		</Card>
	);
}
