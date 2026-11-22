import type { ReactNode } from "react";
import {
	LayoutDashboardIcon,
	KanbanIcon,
	CalendarIcon,
	ServerIcon,
	ContactIcon,
	ActivityIcon,
	MousePointerClickIcon,
	FunnelIcon,
	RepeatIcon,
	GitBranchIcon,
	LayersIcon,
	UsersIcon,
	ChartPieIcon,
	UserIcon,
	PlugIcon,
	SettingsIcon,
	MailIcon,
	MessageSquareIcon,
	ShieldCheckIcon,
	HistoryIcon,
	GaugeIcon,
	WorkflowIcon,
	CpuIcon,
	AlertTriangleIcon,
	TerminalIcon,
	FileCheck2Icon,
	BotIcon,
} from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	parentTitle?: string;
	parentPath?: string;
	isSubPage?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Platform",
		items: [
			{
				title: "Dashboard",
				path: "#/overview",
				icon: <LayoutDashboardIcon />,
			},
		],
	},
	{
		label: "Workspace & Tasks",
		items: [
			{
				title: "Kanban",
				path: "#/kanban",
				icon: <KanbanIcon />,
			},
			{
				title: "Calendar",
				path: "#/calendar",
				icon: <CalendarIcon />,
			},
			{
				title: "Mail",
				path: "#/mail",
				icon: <MailIcon />,
			},
			{
				title: "Chat",
				path: "#/chat",
				icon: <MessageSquareIcon />,
			},
			{
				title: "AI",
				path: "#/ai",
				icon: <BotIcon />,
			},
		],
	},
	{
		label: "Infrastructure & Ops",
		items: [
			{
				title: "DevOps",
				icon: <ServerIcon />,
				subItems: [
					{
						title: "Overview",
						path: "#/devops",
						icon: <GaugeIcon />,
						parentTitle: "DevOps",
					},
					{
						title: "CI/CD Pipelines",
						path: "#/devops/pipelines",
						icon: <WorkflowIcon />,
						parentTitle: "DevOps",
						parentPath: "#/devops",
						isSubPage: true,
					},
					{
						title: "Clusters & Nodes",
						path: "#/devops/clusters",
						icon: <CpuIcon />,
						parentTitle: "DevOps",
						parentPath: "#/devops",
						isSubPage: true,
					},
					{
						title: "Incidents & On-Call",
						path: "#/devops/incidents",
						icon: <AlertTriangleIcon />,
						parentTitle: "DevOps",
						parentPath: "#/devops",
						isSubPage: true,
					},
					{
						title: "Live Logs",
						path: "#/devops/logs",
						icon: <TerminalIcon />,
						parentTitle: "DevOps",
						parentPath: "#/devops",
						isSubPage: true,
					},
					{
						title: "Audit Log",
						path: "#/devops/audit-log",
						icon: <FileCheck2Icon />,
						parentTitle: "DevOps",
						parentPath: "#/devops",
						isSubPage: true,
					},
				],
			},
		],
	},
	{
		label: "Product Analytics",
		items: [
			{
				title: "Behavior & Events",
				icon: <ActivityIcon />,
				subItems: [
					{
						title: "Live Events",
						path: "#/events",
						icon: <MousePointerClickIcon />,
						parentTitle: "Behavior & Events",
					},
					{
						title: "Funnels",
						path: "#/funnels",
						icon: <FunnelIcon />,
						parentTitle: "Behavior & Events",
					},
					{
						title: "User Flows",
						path: "#/flows",
						icon: <GitBranchIcon />,
						parentTitle: "Behavior & Events",
					},
					{
						title: "Retention",
						path: "#/retention",
						icon: <RepeatIcon />,
						parentTitle: "Behavior & Events",
					},
				],
			},
		],
	},
	{
		label: "Customers & Audiences",
		items: [
			{
				title: "Customers",
				path: "#/customers",
				icon: <ContactIcon />,
			},
			{
				title: "Segmentation",
				icon: <LayersIcon />,
				subItems: [
					{
						title: "Segments",
						path: "#/segments",
						icon: <UsersIcon />,
						parentTitle: "Segmentation",
					},
					{
						title: "Cohorts",
						path: "#/cohorts",
						icon: <ChartPieIcon />,
						parentTitle: "Segmentation",
					},
					{
						title: "Profiles",
						path: "#/profiles",
						icon: <UserIcon />,
						parentTitle: "Segmentation",
					},
				],
			},
		],
	},
	{
		label: "System & Management",
		items: [
			{
				title: "Integrations",
				path: "#/integrations",
				icon: <PlugIcon />,
			},
			{
				title: "Settings",
				path: "#/settings",
				icon: <SettingsIcon />,
			},
		],
	},
];

export const accountPages: SidebarNavItem[] = [
	{
		title: "My Profile",
		path: "#/account",
		icon: <UserIcon />,
		parentTitle: "Account",
		parentPath: "#/overview",
		isSubPage: true,
	},
	{
		title: "Workspace & Team",
		path: "#/workspace",
		icon: <UsersIcon />,
		parentTitle: "Account",
		parentPath: "#/overview",
		isSubPage: true,
	},
	{
		title: "Security & Sessions",
		path: "#/security",
		icon: <ShieldCheckIcon />,
		parentTitle: "Account",
		parentPath: "#/overview",
		isSubPage: true,
	},
	{
		title: "Activity Log",
		path: "#/activity",
		icon: <HistoryIcon />,
		parentTitle: "Account",
		parentPath: "#/overview",
		isSubPage: true,
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...accountPages,
];
