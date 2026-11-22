"use client";

import type { CommandMenuGroup } from "@/components/dashboardblocks/command-menu";
import { CommandMenu2 } from "@/components/dashboardblocks/command-menu/command-menu-02";
import { dataTable6ExampleProps } from "@/components/dashboardblocks/data-table/data-table-06";
import { initialProfiles } from "@/src/metadata/profiles-data";
import { initialSegments } from "@/src/metadata/segments-data";
import { formatCurrency } from "@/lib/dashboardblocks/format";
import { Building2Icon, CircleUserRoundIcon, UsersIcon } from "lucide-react";

const customerRows = dataTable6ExampleProps.rows ?? [];

const recentRecords: CommandMenuGroup = {
	heading: "Recent records",
	items: [
		...customerRows.slice(0, 3).map((row) => ({
			description: `${row.email} · ${row.plan} (${row.status})`,
			href: "#/customers",
			icon: <Building2Icon />,
			id: `recent-customer-${row.id}`,
			label: row.company,
			meta: row.mrr > 0 ? `${formatCurrency(row.mrr)}/mo` : row.plan,
		})),
		...initialProfiles.slice(0, 2).map((profile) => ({
			description: `${profile.email} · ${profile.country}`,
			href: "#/profiles",
			icon: <CircleUserRoundIcon />,
			id: `recent-profile-${profile.id}`,
			label: profile.name,
			meta: profile.totalSpent,
		})),
	],
};

async function searchAllRecords(query: string): Promise<CommandMenuGroup[]> {
	const needle = query.trim().toLowerCase();
	if (!needle) return [recentRecords];

	const customerItems = customerRows
		.filter((row) =>
			`${row.company} ${row.email} ${row.plan} ${row.status} ${row.id}`
				.toLowerCase()
				.includes(needle)
		)
		.map((row) => ({
			description: `${row.email} · ${row.plan} (${row.status})`,
			href: "#/customers",
			icon: <Building2Icon />,
			id: `record-customer-${row.id}`,
			label: row.company,
			meta: row.mrr > 0 ? `${formatCurrency(row.mrr)}/mo` : row.plan,
		}));

	const profileItems = initialProfiles
		.filter((profile) =>
			`${profile.name} ${profile.email} ${profile.country} ${profile.plan} ${profile.id}`
				.toLowerCase()
				.includes(needle)
		)
		.map((profile) => ({
			description: `${profile.email} · ${profile.country}`,
			href: "#/profiles",
			icon: <CircleUserRoundIcon />,
			id: `record-profile-${profile.id}`,
			label: profile.name,
			meta: profile.totalSpent,
		}));

	const segmentItems = initialSegments
		.filter((segment) =>
			`${segment.name} ${segment.description} ${segment.criteria}`
				.toLowerCase()
				.includes(needle)
		)
		.map((segment) => ({
			description: segment.description,
			href: "#/segments",
			icon: <UsersIcon />,
			id: `record-segment-${segment.id}`,
			label: segment.name,
			meta: `${segment.usersCount.toLocaleString()} users`,
		}));

	const groups: CommandMenuGroup[] = [
		{ heading: "Customers", items: customerItems },
		{ heading: "User Profiles", items: profileItems },
		{ heading: "Audience Segments", items: segmentItems },
	];

	return groups.filter((group) => group.items.length > 0);
}

export function RecordSearch() {
	return (
		<CommandMenu2
			emptyMessage="No matching records found."
			onNavigate={(href) => {
				window.location.hash = href;
			}}
			placeholder="Search records..."
			recent={recentRecords}
			search={searchAllRecords}
			showStatus={false}
			title="Record Search"
			triggerClassName="sm:w-52 md:w-64 justify-start text-muted-foreground font-normal"
		/>
	);
}
