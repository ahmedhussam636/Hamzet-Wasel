"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CommandMenuGroup } from "@/components/dashboardblocks/command-menu";
import { CommandMenu2 } from "@/components/dashboardblocks/command-menu/command-menu-02";
import {
	PageHeader,
	PageHeaderActions,
	PageHeaderFacts,
	PageHeaderHeading,
	PageHeaderRow,
} from "@/components/dashboardblocks/page-header";
import { roleConfig, type Role } from "@/components/dashboardblocks/settings";
import {
	Settings1,
	type Invite,
	type Member,
} from "@/components/dashboardblocks/settings/settings-01";
import { StatusLabel, type StatusTone } from "@/components/dashboardblocks/status-label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserProfile } from "@/components/user-profile-provider";
import {
	CheckIcon,
	CopyIcon,
	MailIcon,
	PlusIcon,
	SendIcon,
	Trash2Icon,
	UserIcon,
} from "lucide-react";

type TeamRole = "Owner" | "Admin" | "Member" | "Viewer";
type MemberStatus = "Active" | "Invited";

interface WorkspaceConfig {
	name: string;
	slug: string;
	region: string;
	retention: string;
}

interface TeamMember {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: TeamRole;
	department: string;
	status: MemberStatus;
	lastActive: string;
	sentAt?: string;
}

const WORKSPACE_STORAGE_KEY = "hamzet-wasel-workspace-config-v1";
const MEMBERS_STORAGE_KEY = "hamzet-wasel-team-members-v2";
const WORKSPACE_SEATS = 25;

const DEFAULT_WORKSPACE: WorkspaceConfig = {
	name: "Hamzet Wasel",
	slug: "hamzet-wasel",
	region: "EMEA · Europe West (London)",
	retention: "365 days",
};

const nowIso = () => new Date().toISOString();
const daysAgoIso = (days: number) =>
	new Date(Date.now() - days * 86_400_000).toISOString();

const INITIAL_MEMBERS: TeamMember[] = [
	{
		id: "mem-1",
		name: "Shaban Haider",
		email: "shaban@hamzetwasel.com",
		role: "Owner",
		department: "Customer Operations",
		status: "Active",
		lastActive: "Online now",
	},
	{
		id: "mem-2",
		name: "Nour El-Din",
		email: "nour@hamzetwasel.com",
		role: "Admin",
		department: "Product Analytics",
		status: "Active",
		lastActive: "12m ago",
	},
	{
		id: "mem-3",
		name: "Karim Hassan",
		email: "karim@hamzetwasel.com",
		role: "Admin",
		department: "Engineering & DevOps",
		status: "Active",
		lastActive: "1h ago",
	},
	{
		id: "mem-4",
		name: "Laila Mansour",
		email: "laila@hamzetwasel.com",
		role: "Member",
		department: "Growth & Retention",
		status: "Active",
		lastActive: "3h ago",
	},
	{
		id: "mem-5",
		name: "Omar Farouk",
		email: "omar.farouk@hamzetwasel.com",
		role: "Member",
		department: "Customer Success",
		status: "Invited",
		lastActive: "Invite sent 2d ago",
		sentAt: daysAgoIso(2),
	},
	{
		id: "mem-6",
		name: "Sara Al-Mansoor",
		email: "sara@hamzetwasel.com",
		role: "Viewer",
		department: "Executive",
		status: "Active",
		lastActive: "Yesterday",
	},
];

const ROLE_FILTERS = ["All", "Owner", "Admin", "Member", "Viewer", "Invited"] as const;

const STATUS_TONE: Record<MemberStatus, StatusTone> = {
	Active: "good",
	Invited: "warning",
};

function toSettingsRole(role: TeamRole): Role {
	switch (role) {
		case "Owner":
			return "owner";
		case "Admin":
			return "admin";
		case "Viewer":
			return "viewer";
		default:
			return "member";
	}
}

function fromSettingsRole(role: Role): TeamRole {
	switch (role) {
		case "owner":
			return "Owner";
		case "admin":
			return "Admin";
		case "viewer":
			return "Viewer";
		default:
			return "Member";
	}
}

function initialsFor(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "M";
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function nameFromEmail(email: string) {
	const local = email.split("@")[0] ?? "Member";
	return local
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function WorkspaceTeamView() {
	const { user, logActivity } = useUserProfile();
	const [now] = useState<Date>(() => new Date());

	const [workspace, setWorkspace] = useState<WorkspaceConfig>(() => {
		if (typeof window === "undefined") return DEFAULT_WORKSPACE;
		try {
			const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
			return raw ? { ...DEFAULT_WORKSPACE, ...JSON.parse(raw) } : DEFAULT_WORKSPACE;
		} catch {
			return DEFAULT_WORKSPACE;
		}
	});

	const [members, setMembers] = useState<TeamMember[]>(() => {
		if (typeof window === "undefined") return INITIAL_MEMBERS;
		try {
			const raw = window.localStorage.getItem(MEMBERS_STORAGE_KEY);
			if (!raw) return INITIAL_MEMBERS;
			const parsed = JSON.parse(raw) as TeamMember[];
			return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MEMBERS;
		} catch {
			return INITIAL_MEMBERS;
		}
	});

	const [roleFilter, setRoleFilter] =
		useState<(typeof ROLE_FILTERS)[number]>("All");
	const [workspaceSaved, setWorkspaceSaved] = useState(false);
	const [inviteOpen, setInviteOpen] = useState(false);
	const [inviteName, setInviteName] = useState("");
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<TeamRole>("Member");
	const [inviteDept, setInviteDept] = useState("Product Analytics");
	const [inviteError, setInviteError] = useState<string | null>(null);
	const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);

	useEffect(() => {
		try {
			window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
		} catch {
			// Ignore storage errors
		}
	}, [workspace]);

	useEffect(() => {
		try {
			window.localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
		} catch {
			// Ignore storage errors
		}
	}, [members]);

	const syncedMembers = useMemo(
		() =>
			members.map((m) =>
				m.id === "mem-1"
					? {
							...m,
							name: user.name,
							email: user.email,
							avatar: user.avatar || m.avatar,
					  }
					: m
			),
		[members, user.name, user.email, user.avatar]
	);

	const selectedMember = useMemo(
		() => syncedMembers.find((m) => m.id === selectedMemberId) ?? null,
		[syncedMembers, selectedMemberId]
	);

	const filteredMembers = useMemo(() => {
		return syncedMembers.filter((m) => {
			if (roleFilter === "All") return true;
			if (roleFilter === "Invited") return m.status === "Invited";
			return m.role === roleFilter;
		});
	}, [syncedMembers, roleFilter]);

	const settingsMembers: Member[] = useMemo(
		() =>
			filteredMembers
				.filter((m) => m.status === "Active")
				.map((m) => ({
					id: m.id,
					name: m.name,
					email: m.email,
					avatar: m.avatar,
					role: toSettingsRole(m.role),
				})),
		[filteredMembers]
	);

	const settingsInvites: Invite[] = useMemo(
		() =>
			filteredMembers
				.filter((m) => m.status === "Invited")
				.map((m) => ({
					id: m.id,
					email: m.email,
					role: toSettingsRole(m.role),
					sentAt: m.sentAt ? new Date(m.sentAt) : now,
				})),
		[filteredMembers, now]
	);

	const activeCount = syncedMembers.filter((m) => m.status === "Active").length;
	const invitedCount = syncedMembers.filter((m) => m.status === "Invited").length;
	const adminCount = syncedMembers.filter(
		(m) => m.role === "Owner" || m.role === "Admin"
	).length;

	const filterCounts = useMemo(
		() => ({
			All: syncedMembers.length,
			Owner: syncedMembers.filter((m) => m.role === "Owner").length,
			Admin: syncedMembers.filter((m) => m.role === "Admin").length,
			Member: syncedMembers.filter((m) => m.role === "Member").length,
			Viewer: syncedMembers.filter((m) => m.role === "Viewer").length,
			Invited: invitedCount,
		}),
		[syncedMembers, invitedCount]
	);

	const recentMembersGroup = useMemo<CommandMenuGroup>(
		() => ({
			heading: "Workspace members",
			items: syncedMembers.slice(0, 6).map((member) => ({
				id: `recent-member-${member.id}`,
				label: member.name,
				description: `${member.email} · ${member.department}`,
				meta: member.status === "Invited" ? "Invited" : member.role,
				icon: <UserIcon />,
				onSelect: () => setSelectedMemberId(member.id),
			})),
		}),
		[syncedMembers]
	);

	const searchTeamMembers = async (query: string): Promise<CommandMenuGroup[]> => {
		const needle = query.trim().toLowerCase();
		if (!needle) return [recentMembersGroup];
		const matches = syncedMembers.filter((member) =>
			`${member.name} ${member.email} ${member.department} ${member.role} ${member.status}`
				.toLowerCase()
				.includes(needle)
		);
		if (matches.length === 0) return [];
		return [
			{
				heading: "Matching teammates",
				items: matches.slice(0, 10).map((member) => ({
					id: `search-member-${member.id}`,
					label: member.name,
					description: `${member.email} · ${member.department}`,
					meta: member.status === "Invited" ? "Invited" : member.role,
					icon: <UserIcon />,
					onSelect: () => setSelectedMemberId(member.id),
				})),
			},
		];
	};

	const showBanner = (msg: string) => {
		setFeedback(msg);
		window.setTimeout(() => setFeedback(null), 3000);
	};

	const handleSaveWorkspace = (e: FormEvent) => {
		e.preventDefault();
		logActivity({
			category: "Team",
			action: "Updated workspace configuration",
			target: `${workspace.name} (${workspace.region})`,
		});
		setWorkspaceSaved(true);
		window.setTimeout(() => setWorkspaceSaved(false), 2500);
	};

	const addInvitedMember = ({
		name,
		email,
		role,
		department,
	}: {
		name: string;
		email: string;
		role: TeamRole;
		department: string;
	}) => {
		const cleanEmail = email.trim().toLowerCase();
		if (syncedMembers.some((m) => m.email.toLowerCase() === cleanEmail)) {
			return false;
		}
		const created: TeamMember = {
			id: `mem-${Date.now()}`,
			name: name.trim() || nameFromEmail(cleanEmail),
			email: cleanEmail,
			role,
			department: department.trim() || "Operations",
			status: "Invited",
			lastActive: "Invite sent just now",
			sentAt: nowIso(),
		};
		setMembers((prev) => [created, ...prev]);
		logActivity({
			category: "Team",
			action: "Invited workspace member",
			target: `${cleanEmail} (${role})`,
		});
		showBanner(`Invitation sent to ${cleanEmail}`);
		return true;
	};

	const handleInviteSubmit = (e: FormEvent) => {
		e.preventDefault();
		const cleanName = inviteName.trim();
		const cleanEmail = inviteEmail.trim().toLowerCase();
		if (!cleanName || !cleanEmail.includes("@")) {
			setInviteError("Enter a valid member name and email address.");
			return;
		}
		const created = addInvitedMember({
			name: cleanName,
			email: cleanEmail,
			role: inviteRole,
			department: inviteDept,
		});
		if (!created) {
			setInviteError("A team member with this email already exists.");
			return;
		}
		setInviteOpen(false);
		setInviteName("");
		setInviteEmail("");
		setInviteRole("Member");
		setInviteError(null);
	};

	const handleRoleChange = (id: string, nextRole: Role) => {
		const mappedRole = fromSettingsRole(nextRole);
		const target = syncedMembers.find((m) => m.id === id);
		setMembers((prev) =>
			prev.map((m) => (m.id === id ? { ...m, role: mappedRole } : m))
		);
		if (target) {
			logActivity({
				category: "Team",
				action: "Changed member role",
				target: `${target.name} -> ${mappedRole}`,
			});
			showBanner(`Updated ${target.name} to ${roleConfig[nextRole].label}`);
		}
	};

	const handleRemoveMember = (id: string) => {
		const target = syncedMembers.find((m) => m.id === id);
		if (!target || target.role === "Owner") return;
		setMembers((prev) => prev.filter((m) => m.id !== id));
		if (selectedMemberId === id) setSelectedMemberId(null);
		logActivity({
			category: "Team",
			action: "Removed workspace member",
			target: target.email,
			status: "Warning",
		});
		showBanner(`Removed ${target.name} from workspace`);
	};

	const handleResendInvite = (id: string) => {
		const target = syncedMembers.find((m) => m.id === id);
		if (!target) return;
		setMembers((prev) =>
			prev.map((m) =>
				m.id === id
					? { ...m, sentAt: nowIso(), lastActive: "Invite resent just now" }
					: m
			)
		);
		logActivity({
			category: "Team",
			action: "Resent workspace invitation",
			target: target.email,
		});
		showBanner(`Resent invite to ${target.email}`);
	};

	const handleRevokeInvite = (id: string) => {
		const target = syncedMembers.find((m) => m.id === id);
		if (!target) return;
		setMembers((prev) => prev.filter((m) => m.id !== id));
		if (selectedMemberId === id) setSelectedMemberId(null);
		logActivity({
			category: "Team",
			action: "Revoked pending invitation",
			target: target.email,
			status: "Warning",
		});
		showBanner(`Revoked invitation for ${target.email}`);
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader>
				<PageHeaderRow>
					<PageHeaderHeading
						title="Workspace & Team"
						description="Configure organization defaults, manage member seats, and control workspace access roles."
					/>
					<PageHeaderActions>
						<Button size="sm" onClick={() => setInviteOpen(true)}>
							<PlusIcon className="size-4" />
							Invite member
						</Button>
					</PageHeaderActions>
				</PageHeaderRow>
				<PageHeaderFacts
					items={[
						{
							label: "Total members",
							value: syncedMembers.length,
							detail: "Across all departments",
						},
						{
							label: "Active seats",
							value: activeCount,
							detail: "Signed in within 7 days",
						},
						{
							label: "Pending invites",
							value: invitedCount,
							detail: "Awaiting acceptance",
						},
						{
							label: "Admins & Owners",
							value: adminCount,
							detail: "Full workspace permissions",
						},
					]}
				/>
			</PageHeader>

			{feedback && (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
					<CheckIcon className="size-4 shrink-0" />
					<span>{feedback}</span>
				</div>
			)}

			<form onSubmit={handleSaveWorkspace}>
				<Card className="dark:bg-transparent">
					<CardHeader className="border-b">
						<CardTitle className="text-base">Workspace Identity & Data Policy</CardTitle>
						<CardDescription>
							Organization name, URL slug, primary data residency, and analytics retention.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
						<div className="space-y-2">
							<Label htmlFor="ws-name">Workspace name</Label>
							<Input
								id="ws-name"
								value={workspace.name}
								onChange={(e) =>
									setWorkspace((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ws-slug">Workspace slug</Label>
							<Input
								id="ws-slug"
								value={workspace.slug}
								onChange={(e) =>
									setWorkspace((prev) => ({ ...prev, slug: e.target.value }))
								}
								className="font-mono text-sm"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ws-region">Primary region</Label>
							<select
								id="ws-region"
								value={workspace.region}
								onChange={(e) =>
									setWorkspace((prev) => ({ ...prev, region: e.target.value }))
								}
								className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							>
								<option value="EMEA · Europe West (London)">
									EMEA · Europe West (London)
								</option>
								<option value="MENA · Middle East (Dammam)">
									MENA · Middle East (Dammam)
								</option>
								<option value="US East · Virginia">US East · Virginia</option>
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ws-retention">Event retention</Label>
							<select
								id="ws-retention"
								value={workspace.retention}
								onChange={(e) =>
									setWorkspace((prev) => ({ ...prev, retention: e.target.value }))
								}
								className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							>
								<option value="90 days">90 days</option>
								<option value="180 days">180 days</option>
								<option value="365 days">365 days</option>
								<option value="730 days">730 days</option>
							</select>
						</div>
					</CardContent>
					<CardFooter className="flex items-center justify-between border-t px-6 py-3.5">
						<span className="text-xs text-muted-foreground">
							{workspaceSaved ? (
								<span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
									<CheckIcon className="size-3.5" />
									Workspace settings saved
								</span>
							) : (
								"Data residency applies to new analytics events and exports."
							)}
						</span>
						<Button type="submit" size="sm">
							Save workspace
						</Button>
					</CardFooter>
				</Card>
			</form>

			<Card className="dark:bg-transparent">
				<CardHeader className="border-b">
					<CardTitle className="text-base">Team Directory</CardTitle>
					<CardDescription>
						Invite teammates, adjust workspace roles, and manage pending invitations.{" "}
						<span className="tabular-nums">
							{syncedMembers.length} of {WORKSPACE_SEATS} seats used.
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-5 p-6">
					{/* Toolbar: CommandMenu2 Search + Role Filter Tabs */}
					<div className="flex flex-wrap items-center justify-between gap-3">
						<CommandMenu2
							className="w-full items-stretch sm:w-auto"
							emptyMessage="No matching team members found."
							placeholder="Search members by name, email, role..."
							recent={recentMembersGroup}
							search={searchTeamMembers}
							showStatus={false}
							title="Search team directory"
							triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
						/>

						<div
							role="tablist"
							aria-label="Filter team members by role"
							className="bg-muted inline-flex flex-wrap items-center rounded-lg p-0.5"
						>
							{ROLE_FILTERS.map((filter) => {
								const active = roleFilter === filter;
								return (
									<button
										key={filter}
										type="button"
										role="tab"
										aria-selected={active}
										onClick={() => setRoleFilter(filter)}
										className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
											active
												? "bg-background text-foreground shadow-xs"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										{filter} ({filterCounts[filter]})
									</button>
								);
							})}
						</div>
					</div>

					<div className="border-t pt-5">
						<Settings1
							hideHeader
							title="Team Directory"
							description="Invite people to the workspace and choose what they can do."
							currentMemberId="mem-1"
							now={now}
							seats={WORKSPACE_SEATS}
							totalSeatsUsed={syncedMembers.length}
							members={settingsMembers}
							invites={settingsInvites}
							emptyMembersMessage={
								roleFilter === "Invited"
									? "Showing pending invitations only."
									: `No active members with role ${roleFilter}.`
							}
							onInvite={(email, role) => {
								addInvitedMember({
									name: nameFromEmail(email),
									email,
									role: fromSettingsRole(role),
									department: "Operations",
								});
							}}
							onRoleChange={handleRoleChange}
							onRemoveMember={handleRemoveMember}
							onResendInvite={handleResendInvite}
							onRevokeInvite={handleRevokeInvite}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Member Inspector Dialog (opened from CommandMenu2 search) */}
			<Dialog
				open={selectedMember !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedMemberId(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					{selectedMember && (
						<>
							<DialogHeader>
								<div className="flex items-center gap-3">
									<Avatar className="size-10 border border-border">
										<AvatarImage
											src={selectedMember.avatar || undefined}
											alt={selectedMember.name}
											referrerPolicy="no-referrer"
										/>
										<AvatarFallback className="text-xs font-medium">
											{initialsFor(selectedMember.name)}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0">
										<DialogTitle className="truncate">
											{selectedMember.name}
										</DialogTitle>
										<DialogDescription className="truncate">
											{selectedMember.email}
										</DialogDescription>
									</div>
								</div>
							</DialogHeader>
							<div className="space-y-4 border-t pt-4 text-sm">
								<div className="grid grid-cols-2 gap-3">
									<div>
										<span className="text-muted-foreground block text-xs">
											Department
										</span>
										<span className="font-medium">{selectedMember.department}</span>
									</div>
									<div>
										<span className="text-muted-foreground block text-xs">
											Status
										</span>
										<StatusLabel tone={STATUS_TONE[selectedMember.status]}>
											{selectedMember.status}
										</StatusLabel>
									</div>
									<div>
										<span className="text-muted-foreground block text-xs">
											Role
										</span>
										<span className="font-medium">{selectedMember.role}</span>
									</div>
									<div>
										<span className="text-muted-foreground block text-xs">
											Activity
										</span>
										<span className="text-muted-foreground tabular-nums">
											{selectedMember.lastActive}
										</span>
									</div>
								</div>

								{selectedMember.role !== "Owner" &&
									selectedMember.id !== "mem-1" && (
										<div className="space-y-1.5 border-t pt-3">
											<Label htmlFor="inspect-member-role">
												Workspace permission role
											</Label>
											<select
												id="inspect-member-role"
												value={selectedMember.role}
												onChange={(e) =>
													handleRoleChange(
														selectedMember.id,
														toSettingsRole(e.target.value as TeamRole)
													)
												}
												className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
											>
												<option value="Admin">Admin</option>
												<option value="Member">Member</option>
												<option value="Viewer">Viewer</option>
											</select>
										</div>
									)}
							</div>
							<DialogFooter className="flex-wrap gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => {
										void navigator.clipboard?.writeText(selectedMember.email);
										showBanner(`Copied ${selectedMember.email}`);
									}}
								>
									<CopyIcon className="size-3.5" />
									Copy email
								</Button>
								{selectedMember.status === "Invited" && (
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => handleResendInvite(selectedMember.id)}
									>
										<SendIcon className="size-3.5" />
										Resend invite
									</Button>
								)}
								{selectedMember.role !== "Owner" &&
									selectedMember.id !== "mem-1" && (
										<Button
											type="button"
											size="sm"
											variant="destructive"
											onClick={() => handleRemoveMember(selectedMember.id)}
										>
											<Trash2Icon className="size-3.5" />
											Remove
										</Button>
									)}
								<DialogClose render={<Button size="sm" />}>Close</DialogClose>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Invite team member</DialogTitle>
						<DialogDescription>
							Send an invitation link to collaborate in {workspace.name}.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleInviteSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="invite-name">Full name</Label>
							<Input
								id="invite-name"
								value={inviteName}
								onChange={(e) => setInviteName(e.target.value)}
								placeholder="e.g. Tariq Al-Harbi"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="invite-email">Work email</Label>
							<Input
								id="invite-email"
								type="email"
								value={inviteEmail}
								onChange={(e) => setInviteEmail(e.target.value)}
								placeholder="tariq@hamzetwasel.com"
								required
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="invite-role">Role</Label>
								<select
									id="invite-role"
									value={inviteRole}
									onChange={(e) => setInviteRole(e.target.value as TeamRole)}
									className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="Admin">Admin</option>
									<option value="Member">Member</option>
									<option value="Viewer">Viewer</option>
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="invite-dept">Department</Label>
								<Input
									id="invite-dept"
									value={inviteDept}
									onChange={(e) => setInviteDept(e.target.value)}
									placeholder="Product Analytics"
								/>
							</div>
						</div>
						{inviteError && (
							<p className="text-sm text-destructive" role="alert">
								{inviteError}
							</p>
						)}
						<DialogFooter>
							<DialogClose render={<Button type="button" variant="outline" />}>
								Cancel
							</DialogClose>
							<Button type="submit">
								<MailIcon className="size-3.5" />
								Send invite
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default WorkspaceTeamView;
