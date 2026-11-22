"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
	PageHeader,
	PageHeaderActions,
	PageHeaderHeading,
	PageHeaderRow,
} from "@/components/dashboardblocks/page-header";
import { Details } from "@/components/dashboardblocks/details";
import { StatusIndicator } from "@/components/indicator";
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
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	DEFAULT_USER_PROFILE,
	useUserProfile,
	type UserPresenceStatus,
} from "@/components/user-profile-provider";
import {
	CheckIcon,
	HistoryIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UploadIcon,
	UsersIcon,
} from "lucide-react";

const TIMEZONES = [
	"Africa/Cairo (UTC+2)",
	"Asia/Riyadh (UTC+3)",
	"Asia/Dubai (UTC+4)",
	"Europe/London (UTC+0)",
	"Europe/Berlin (UTC+1)",
	"America/New_York (UTC-5)",
];

const STATUS_OPTIONS: {
	value: UserPresenceStatus;
	label: string;
	color: "emerald" | "amber" | "rose";
}[] = [
	{ value: "online", label: "Online", color: "emerald" },
	{ value: "away", label: "Away", color: "amber" },
	{ value: "offline", label: "Offline", color: "rose" },
];

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "U";
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function AccountProfileView() {
	const { user, updateProfile, resetProfile, logActivity } = useUserProfile();

	const [name, setName] = useState(user.name);
	const [email, setEmail] = useState(user.email);
	const [role, setRole] = useState(user.role);
	const [location, setLocation] = useState(user.location);
	const [timezone, setTimezone] = useState(user.timezone);
	const [bio, setBio] = useState(user.bio);
	const [avatar, setAvatar] = useState(user.avatar);
	const [status, setStatus] = useState<UserPresenceStatus>(user.status);
	const [workingHoursStart, setWorkingHoursStart] = useState(user.workingHoursStart);
	const [workingHoursEnd, setWorkingHoursEnd] = useState(user.workingHoursEnd);
	const [autoAssign, setAutoAssign] = useState(user.autoAssign);
	const [savedMessage, setSavedMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		setName(user.name);
		setEmail(user.email);
		setRole(user.role);
		setLocation(user.location);
		setTimezone(user.timezone);
		setBio(user.bio);
		setAvatar(user.avatar);
		setStatus(user.status);
		setWorkingHoursStart(user.workingHoursStart);
		setWorkingHoursEnd(user.workingHoursEnd);
		setAutoAssign(user.autoAssign);
	}, [user]);

	const hasChanges =
		name !== user.name ||
		email !== user.email ||
		role !== user.role ||
		location !== user.location ||
		timezone !== user.timezone ||
		bio !== user.bio ||
		avatar !== user.avatar ||
		status !== user.status ||
		workingHoursStart !== user.workingHoursStart ||
		workingHoursEnd !== user.workingHoursEnd ||
		autoAssign !== user.autoAssign;

	const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			setErrorMessage("Please select an image smaller than 2 MB.");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				setAvatar(reader.result);
				setErrorMessage(null);
			}
		};
		reader.readAsDataURL(file);
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const trimmedName = name.trim();
		const trimmedEmail = email.trim();
		if (!trimmedName || !trimmedEmail || !trimmedEmail.includes("@")) {
			setErrorMessage("Please enter a valid display name and email address.");
			return;
		}
		setErrorMessage(null);
		updateProfile({
			name: trimmedName,
			email: trimmedEmail,
			role: role.trim() || DEFAULT_USER_PROFILE.role,
			location: location.trim() || DEFAULT_USER_PROFILE.location,
			timezone,
			bio: bio.trim(),
			avatar,
			status,
			workingHoursStart,
			workingHoursEnd,
			autoAssign,
		});
		logActivity({
			category: "Account",
			action: "Updated profile information",
			target: `${trimmedName} (${trimmedEmail})`,
		});
		setSavedMessage("Profile changes saved");
		window.setTimeout(() => setSavedMessage(null), 3000);
	};

	const handleReset = () => {
		resetProfile();
		setErrorMessage(null);
		setSavedMessage("Restored default profile");
		window.setTimeout(() => setSavedMessage(null), 2500);
	};

	const initials = getInitials(name || user.name);
	const activeStatusMeta =
		STATUS_OPTIONS.find((item) => item.value === status) ?? STATUS_OPTIONS[0];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader>
				<PageHeaderRow>
					<PageHeaderHeading
						title="My Profile"
						description="Manage your personal identity, workspace availability, and how teammates see you."
					/>
					<PageHeaderActions>
						<Button
							variant="outline"
							size="sm"
							render={<a href="#/workspace" />}
							nativeButton={false}
						>
							<UsersIcon className="size-4" />
							Workspace & Team
						</Button>
						<Button
							variant="outline"
							size="sm"
							render={<a href="#/security" />}
							nativeButton={false}
						>
							<ShieldCheckIcon className="size-4" />
							Security
						</Button>
						<Button
							variant="outline"
							size="sm"
							render={<a href="#/activity" />}
							nativeButton={false}
						>
							<HistoryIcon className="size-4" />
							Activity Log
						</Button>
					</PageHeaderActions>
				</PageHeaderRow>
			</PageHeader>

			<div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
				{/* Live Identity Preview */}
				<Card className="dark:bg-transparent">
					<CardContent className="flex flex-col gap-5 p-6">
						<div className="flex flex-col items-start gap-4">
							<Avatar className="size-20 border border-border">
								<AvatarImage
									src={avatar || undefined}
									alt={name || user.name}
									referrerPolicy="no-referrer"
								/>
								<AvatarFallback className="text-lg font-medium">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 space-y-1">
								<h2 className="text-lg font-semibold tracking-tight text-foreground">
									{name || user.name}
								</h2>
								<Details className="block text-sm text-muted-foreground">
									<span>{role || user.role}</span>
									<span>{location || user.location}</span>
								</Details>
								<div className="flex items-center gap-2 pt-1 text-xs">
									<StatusIndicator
										color={activeStatusMeta.color}
										pulse={false}
									/>
									<span className="font-medium text-foreground">
										{activeStatusMeta.label}
									</span>
									<span className="text-muted-foreground">
										· {workingHoursStart}–{workingHoursEnd}
									</span>
								</div>
							</div>
						</div>

						{bio && (
							<p className="border-t pt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
								{bio}
							</p>
						)}

						<dl className="divide-y border-t text-sm">
							<div className="flex items-center justify-between gap-3 py-2.5">
								<dt className="text-muted-foreground">Email</dt>
								<dd className="truncate font-medium text-foreground">{email}</dd>
							</div>
							<div className="flex items-center justify-between gap-3 py-2.5">
								<dt className="text-muted-foreground">Timezone</dt>
								<dd className="truncate font-medium text-foreground tabular-nums">
									{timezone.split(" ")[0]}
								</dd>
							</div>
							<div className="flex items-center justify-between gap-3 py-2.5">
								<dt className="text-muted-foreground">Auto-assign</dt>
								<dd className="font-medium text-foreground">
									{autoAssign ? "Enabled" : "Paused"}
								</dd>
							</div>
							<div className="flex items-center justify-between gap-3 py-2.5">
								<dt className="text-muted-foreground">CSAT (30d)</dt>
								<dd className="font-mono font-medium text-foreground tabular-nums">
									94.6%
								</dd>
							</div>
							<div className="flex items-center justify-between gap-3 py-2.5">
								<dt className="text-muted-foreground">Avg reply time</dt>
								<dd className="font-mono font-medium text-foreground tabular-nums">
									4.1m
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				{/* Profile Form */}
				<form onSubmit={handleSubmit}>
					<Card className="dark:bg-transparent">
						<CardHeader className="border-b">
							<CardTitle className="text-base">Personal & Availability Details</CardTitle>
							<CardDescription>
								Changes sync immediately to the sidebar account menu and team directory.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-6">
							<FieldGroup className="gap-5">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div className="flex items-center gap-4">
										<Avatar className="size-14 border border-border">
											<AvatarImage
												src={avatar || undefined}
												alt={name}
												referrerPolicy="no-referrer"
											/>
											<AvatarFallback>{initials}</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-medium text-foreground">
												Profile photo
											</p>
											<p className="text-xs text-muted-foreground">
												PNG or JPG square image up to 2 MB.
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{avatar && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="text-destructive hover:text-destructive"
												onClick={() => setAvatar("")}
											>
												<Trash2Icon className="size-4" />
												Remove
											</Button>
										)}
										<Button
											type="button"
											variant="outline"
											size="sm"
											nativeButton={false}
											render={<label htmlFor="account-avatar-upload" className="cursor-pointer" />}
										>
											<UploadIcon className="size-4" />
											Upload photo
											<input
												id="account-avatar-upload"
												type="file"
												accept="image/*"
												className="sr-only"
												onChange={handleAvatarUpload}
											/>
										</Button>
									</div>
								</div>

								<FieldSeparator />

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="profile-name">Full name</Label>
										<Input
											id="profile-name"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="Your full name"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="profile-email">Work email</Label>
										<Input
											id="profile-email"
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="name@company.com"
											required
										/>
									</div>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="profile-role">Role / Title</Label>
										<Input
											id="profile-role"
											value={role}
											onChange={(e) => setRole(e.target.value)}
											placeholder="e.g. Support Lead"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="profile-location">Location</Label>
										<Input
											id="profile-location"
											value={location}
											onChange={(e) => setLocation(e.target.value)}
											placeholder="e.g. Cairo, Egypt"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="profile-timezone">Timezone</Label>
									<select
										id="profile-timezone"
										value={timezone}
										onChange={(e) => setTimezone(e.target.value)}
										className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
									>
										{TIMEZONES.map((tz) => (
											<option key={tz} value={tz}>
												{tz}
											</option>
										))}
									</select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="profile-bio">Bio</Label>
									<Textarea
										id="profile-bio"
										rows={3}
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										placeholder="Short overview of your responsibilities..."
									/>
								</div>

								<FieldSeparator />

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label>Presence status</Label>
										<ToggleGroup
											value={[status]}
											onValueChange={(vals) => {
												const next = vals[0] as UserPresenceStatus | undefined;
												if (next) setStatus(next);
											}}
											variant="outline"
											aria-label="Presence status"
										>
											{STATUS_OPTIONS.map((item) => (
												<ToggleGroupItem key={item.value} value={item.value}>
													<StatusIndicator color={item.color} pulse={false} />
													{item.label}
												</ToggleGroupItem>
											))}
										</ToggleGroup>
									</div>

									<div className="space-y-2">
										<Label htmlFor="working-hours-start">Working hours</Label>
										<div className="flex items-center gap-2">
											<Input
												id="working-hours-start"
												type="time"
												value={workingHoursStart}
												onChange={(e) => setWorkingHoursStart(e.target.value)}
												className="w-32 tabular-nums"
											/>
											<span className="text-xs text-muted-foreground">to</span>
											<Input
												aria-label="Working hours end"
												type="time"
												value={workingHoursEnd}
												onChange={(e) => setWorkingHoursEnd(e.target.value)}
												className="w-32 tabular-nums"
											/>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
									<div className="space-y-0.5">
										<Label htmlFor="profile-auto-assign">
											Auto-assign incoming conversations
										</Label>
										<p className="text-xs text-muted-foreground">
											Automatically route new support threads to your queue while online.
										</p>
									</div>
									<Switch
										id="profile-auto-assign"
										checked={autoAssign}
										onCheckedChange={setAutoAssign}
									/>
								</div>

								{errorMessage && (
									<p className="text-sm text-destructive" role="alert">
										{errorMessage}
									</p>
								)}
							</FieldGroup>
						</CardContent>
						<CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
							<div className="text-xs text-muted-foreground">
								{savedMessage ? (
									<span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
										<CheckIcon className="size-3.5" />
										{savedMessage}
									</span>
								) : hasChanges ? (
									"You have unsaved changes"
								) : (
									"All profile changes synced"
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button type="button" variant="ghost" onClick={handleReset}>
									Reset defaults
								</Button>
								<Button type="submit" disabled={!hasChanges}>
									Save changes
								</Button>
							</div>
						</CardFooter>
					</Card>
				</form>
			</div>
		</div>
	);
}

export default AccountProfileView;
