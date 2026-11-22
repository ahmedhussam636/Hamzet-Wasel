"use client";

import { useMemo, useState } from "react";
import {
	PageHeader,
	PageHeaderActions,
	PageHeaderFacts,
	PageHeaderHeading,
	PageHeaderRow,
} from "@/components/dashboardblocks/page-header";
import { StatusLabel } from "@/components/dashboardblocks/status-label";
import {
	DataTable,
	DataTableBody,
	DataTableCell,
	DataTableHead,
	DataTableHeader,
	DataTableRow,
} from "@/components/dashboardblocks/table";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	useUserProfile,
	type ActivityCategory,
} from "@/components/user-profile-provider";
import { DownloadIcon, SearchIcon } from "lucide-react";

const CATEGORIES: ("All" | ActivityCategory)[] = [
	"All",
	"Account",
	"Security",
	"Team",
	"Data",
];

export function ActivityLogView() {
	const { activityEvents } = useUserProfile();
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<"All" | ActivityCategory>("All");

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return activityEvents.filter((event) => {
			if (category !== "All" && event.category !== category) return false;
			if (!q) return true;
			return (
				event.actor.toLowerCase().includes(q) ||
				event.action.toLowerCase().includes(q) ||
				event.target.toLowerCase().includes(q) ||
				event.location.toLowerCase().includes(q) ||
				event.ip.toLowerCase().includes(q)
			);
		});
	}, [activityEvents, category, search]);

	const securityCount = activityEvents.filter(
		(e) => e.category === "Security"
	).length;
	const warningCount = activityEvents.filter((e) => e.status === "Warning").length;
	const teamCount = activityEvents.filter((e) => e.category === "Team").length;

	const handleExportCsv = () => {
		const header = [
			"Timestamp",
			"Actor",
			"Category",
			"Action",
			"Target",
			"Location",
			"IP",
			"Status",
		];
		const rows = filtered.map((e) => [
			e.timestamp,
			e.actor,
			e.category,
			e.action,
			e.target,
			e.location,
			e.ip,
			e.status,
		]);
		const csv = [header, ...rows]
			.map((cols) =>
				cols.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
			)
			.join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "hamzet-wasel-activity-log.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader>
				<PageHeaderRow>
					<PageHeaderHeading
						title="Activity Log"
						description="Chronological audit trail of profile updates, security actions, team changes, and exports."
					/>
					<PageHeaderActions>
						<Button size="sm" variant="outline" onClick={handleExportCsv}>
							<DownloadIcon className="size-4" />
							Export CSV
						</Button>
					</PageHeaderActions>
				</PageHeaderRow>
				<PageHeaderFacts
					items={[
						{
							label: "Recorded events",
							value: activityEvents.length,
							detail: "Synced across local actions",
						},
						{
							label: "Security events",
							value: securityCount,
							detail: "Sessions, 2FA & credentials",
						},
						{
							label: "Team changes",
							value: teamCount,
							detail: "Invites & role updates",
						},
						{
							label: "Warnings",
							value: warningCount,
							detail: "Revocations & blocked attempts",
						},
					]}
				/>
			</PageHeader>

			<Card className="dark:bg-transparent">
				<CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-base">Audit Events</CardTitle>
						<CardDescription>
							Filter by category or search by actor, resource, or IP address.
						</CardDescription>
					</div>
					<div className="relative w-full sm:w-64">
						<SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search action, actor, IP..."
							className="h-8 pl-8 text-sm"
						/>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="flex flex-wrap items-center gap-1 border-b px-4 py-2.5">
						{CATEGORIES.map((cat) => (
							<button
								key={cat}
								type="button"
								onClick={() => setCategory(cat)}
								className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
									category === cat
										? "bg-secondary text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{cat}
							</button>
						))}
					</div>
					<DataTable>
						<DataTableHeader>
							<DataTableRow>
								<DataTableHead>Timestamp</DataTableHead>
								<DataTableHead>Actor</DataTableHead>
								<DataTableHead>Category</DataTableHead>
								<DataTableHead>Action & Target</DataTableHead>
								<DataTableHead>Location / IP</DataTableHead>
								<DataTableHead>Status</DataTableHead>
							</DataTableRow>
						</DataTableHeader>
						<DataTableBody>
							{filtered.length === 0 ? (
								<DataTableRow>
									<DataTableCell colSpan={6} className="py-10 text-center">
										<p className="font-medium text-foreground text-sm">
											No matching events
										</p>
										<p className="text-muted-foreground text-xs mt-1">
											Adjust your search query or select All categories.
										</p>
									</DataTableCell>
								</DataTableRow>
							) : (
								filtered.map((event) => (
									<DataTableRow key={event.id}>
										<DataTableCell className="font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap">
											{event.timestamp}
										</DataTableCell>
										<DataTableCell className="font-medium text-foreground">
											{event.actor}
										</DataTableCell>
										<DataTableCell className="text-xs text-muted-foreground">
											{event.category}
										</DataTableCell>
										<DataTableCell>
											<div className="font-medium text-foreground">
												{event.action}
											</div>
											<div className="text-xs text-muted-foreground">
												{event.target}
											</div>
										</DataTableCell>
										<DataTableCell className="text-xs text-muted-foreground tabular-nums">
											<div>{event.location}</div>
											<div className="font-mono">{event.ip}</div>
										</DataTableCell>
										<DataTableCell>
											<StatusLabel
												tone={event.status === "Success" ? "good" : "warning"}
											>
												{event.status}
											</StatusLabel>
										</DataTableCell>
									</DataTableRow>
								))
							)}
						</DataTableBody>
					</DataTable>
				</CardContent>
			</Card>
		</div>
	);
}

export default ActivityLogView;
