import { formatInteger } from "@/components/formater";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ArrowRightIcon } from "lucide-react";
import {
	BlockBusyIndicator,
	DashboardBusy,
	DashboardEmptyState,
	DashboardErrorState,
	SkeletonText,
	type DashboardBlockStateProps,
} from "@/components/dashboard-state";

const defaultRows = [
	{ host: "news.ycombinator.com", sessions: 1420 },
	{ host: "t.co", sessions: 980 },
	{ host: "github.com", sessions: 760 },
	{ host: "producthunt.com", sessions: 540 },
	{ host: "reddit.com", sessions: 410 },
] as const;

export interface TopReferrersProps extends DashboardBlockStateProps {
	data?: readonly { host: string; sessions: number }[];
}

export function TopReferrers({
	status,
	errorMessage,
	empty,
	refreshing,
	onRetry,
	data = defaultRows,
}: TopReferrersProps = {}) {
	const activeRows = empty ? [] : data;
	const isLoading = status === "loading";
	const isError = status === "error";
	const isEmpty = !isLoading && !isError && activeRows.length === 0;

	return (
		<Card className="relative dark:bg-transparent">
			<CardHeader className="flex flex-row items-start justify-between gap-2">
				<div className="space-y-1">
					<CardTitle className="text-balance">Top referrers</CardTitle>
					<CardDescription className="text-pretty">
						External sites sending the most attributed sessions.
					</CardDescription>
				</div>
				{refreshing && <BlockBusyIndicator label="" />}
			</CardHeader>
			<CardContent
				className={
					isEmpty || isError
						? "p-0 pb-4 border-t"
						: "mask-b-from-50% mask-b-to-100% p-0 pb-2"
				}
			>
				{isError ? (
					<DashboardErrorState
						title="Couldn’t load referrers"
						description={errorMessage ?? "Failed to fetch referrer metrics."}
						onRetry={onRetry}
					/>
				) : isEmpty ? (
					<DashboardEmptyState
						title="No referrers found"
						description="Referral domains will show here once external traffic arrives."
					/>
				) : (
					<DashboardBusy refreshing={refreshing} label="Updating top referrers">
						<Table className="border-t">
							<TableCaption className="sr-only">
								Top referrer domains by attributed sessions.
							</TableCaption>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6" scope="col">
										Host
									</TableHead>
									<TableHead className="pr-6 text-end tabular-nums" scope="col">
										Sessions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading
									? Array.from({ length: 5 }, (_, i) => (
											<TableRow key={i} className="hover:bg-transparent">
												<TableCell className="pl-6">
													<SkeletonText className="w-32" />
												</TableCell>
												<TableCell className="pr-6 text-end">
													<SkeletonText className="w-12 ml-auto" />
												</TableCell>
											</TableRow>
										))
									: activeRows.map((row) => (
											<TableRow className="hover:bg-transparent" key={row.host}>
												<TableCell className="max-w-[220px] truncate pl-6 font-medium">
													<span className="text-xs">{row.host}</span>
												</TableCell>
												<TableCell className="pr-6 text-end text-muted-foreground text-xs tabular-nums">
													{formatInteger(row.sessions)}
												</TableCell>
											</TableRow>
										))}
							</TableBody>
						</Table>
					</DashboardBusy>
				)}
			</CardContent>

			{!isLoading && !isError && !isEmpty && (
				<div className="mask-t-from-30% absolute inset-x-0 bottom-0 flex h-1/5 items-center justify-center bg-background">
					<Button className="relative" variant="ghost" render={<a href="#" />} nativeButton={false}>
						View All
						<ArrowRightIcon aria-hidden="true" />
					</Button>
				</div>
			)}
		</Card>
	);
}
