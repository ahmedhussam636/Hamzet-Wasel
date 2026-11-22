"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
	PageHeader,
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
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { useUserProfile } from "@/components/user-profile-provider";
import {
	CheckIcon,
	CopyIcon,
	KeyRoundIcon,
	LaptopIcon,
	LogOutIcon,
	PlusIcon,
	RefreshCwIcon,
	ShieldCheckIcon,
	SmartphoneIcon,
	Trash2Icon,
} from "lucide-react";

interface ActiveSession {
	id: string;
	device: string;
	browser: string;
	location: string;
	ip: string;
	lastActive: string;
	current?: boolean;
	kind: "desktop" | "mobile";
}

interface ApiToken {
	id: string;
	name: string;
	prefix: string;
	scopes: string[];
	createdAt: string;
	lastUsed: string;
}

const SESSIONS_KEY = "hamzet-wasel-sessions-v1";
const TOKENS_KEY = "hamzet-wasel-api-tokens-v1";
const SECURITY_FLAGS_KEY = "hamzet-wasel-security-flags-v1";

const INITIAL_SESSIONS: ActiveSession[] = [
	{
		id: "ses-1",
		device: "MacBook Pro 16 · macOS",
		browser: "Chrome 131",
		location: "Cairo, Egypt",
		ip: "197.48.112.19",
		lastActive: "Active now",
		current: true,
		kind: "desktop",
	},
	{
		id: "ses-2",
		device: "iPhone 16 Pro · iOS",
		browser: "Safari Mobile",
		location: "Cairo, Egypt",
		ip: "197.48.112.44",
		lastActive: "2h ago",
		kind: "mobile",
	},
	{
		id: "ses-3",
		device: "ThinkPad X1 · Ubuntu",
		browser: "Firefox 132",
		location: "Dubai, UAE",
		ip: "94.200.51.104",
		lastActive: "Nov 18, 2026",
		kind: "desktop",
	},
];

const INITIAL_TOKENS: ApiToken[] = [
	{
		id: "tok-1",
		name: "CI Telemetry Exporter",
		prefix: "hw_live_91a4••••8c2f",
		scopes: ["analytics:read"],
		createdAt: "Oct 12, 2026",
		lastUsed: "18m ago",
	},
	{
		id: "tok-2",
		name: "CRM Sync Worker",
		prefix: "hw_live_34d9••••1e0a",
		scopes: ["analytics:read", "customers:write"],
		createdAt: "Nov 02, 2026",
		lastUsed: "3h ago",
	},
];

const DEFAULT_CODES = [
	"HW7K-92M4",
	"P3QX-48LN",
	"Z8RT-19VB",
	"M6WC-75JD",
	"K2YN-64HF",
	"V9PL-30SA",
];

function generateRandomCode() {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const part = (len: number) =>
		Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
	return `${part(4)}-${part(4)}`;
}

export function SecurityView() {
	const { logActivity } = useUserProfile();

	const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() => {
		if (typeof window === "undefined") return true;
		try {
			const raw = window.localStorage.getItem(SECURITY_FLAGS_KEY);
			return raw ? Boolean(JSON.parse(raw).twoFactorEnabled) : true;
		} catch {
			return true;
		}
	});

	const [passwordUpdatedAt, setPasswordUpdatedAt] = useState<string>(() => {
		if (typeof window === "undefined") return "Nov 04, 2026";
		try {
			const raw = window.localStorage.getItem(SECURITY_FLAGS_KEY);
			return raw ? (JSON.parse(raw).passwordUpdatedAt ?? "Nov 04, 2026") : "Nov 04, 2026";
		} catch {
			return "Nov 04, 2026";
		}
	});

	const [sessions, setSessions] = useState<ActiveSession[]>(() => {
		if (typeof window === "undefined") return INITIAL_SESSIONS;
		try {
			const raw = window.localStorage.getItem(SESSIONS_KEY);
			if (!raw) return INITIAL_SESSIONS;
			const parsed = JSON.parse(raw) as ActiveSession[];
			return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SESSIONS;
		} catch {
			return INITIAL_SESSIONS;
		}
	});

	const [tokens, setTokens] = useState<ApiToken[]>(() => {
		if (typeof window === "undefined") return INITIAL_TOKENS;
		try {
			const raw = window.localStorage.getItem(TOKENS_KEY);
			if (!raw) return INITIAL_TOKENS;
			const parsed = JSON.parse(raw) as ApiToken[];
			return Array.isArray(parsed) ? parsed : INITIAL_TOKENS;
		} catch {
			return INITIAL_TOKENS;
		}
	});

	const [recoveryCodes, setRecoveryCodes] = useState<string[]>(DEFAULT_CODES);
	const [codesDialogOpen, setCodesDialogOpen] = useState(false);

	// Password form
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordFeedback, setPasswordFeedback] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	// Token modal
	const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
	const [tokenName, setTokenName] = useState("");
	const [tokenScopes, setTokenScopes] = useState<string[]>(["analytics:read"]);
	const [revealedToken, setRevealedToken] = useState<string | null>(null);
	const [banner, setBanner] = useState<string | null>(null);

	useEffect(() => {
		try {
			window.localStorage.setItem(
				SECURITY_FLAGS_KEY,
				JSON.stringify({ twoFactorEnabled, passwordUpdatedAt })
			);
		} catch {
			// Ignore storage errors
		}
	}, [twoFactorEnabled, passwordUpdatedAt]);

	useEffect(() => {
		try {
			window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
		} catch {
			// Ignore storage errors
		}
	}, [sessions]);

	useEffect(() => {
		try {
			window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
		} catch {
			// Ignore storage errors
		}
	}, [tokens]);

	const notify = (msg: string) => {
		setBanner(msg);
		window.setTimeout(() => setBanner(null), 3000);
	};

	const passwordStrength = (() => {
		if (!newPassword) return 0;
		let score = 0;
		if (newPassword.length >= 8) score++;
		if (/[A-Z]/.test(newPassword)) score++;
		if (/[0-9]/.test(newPassword)) score++;
		if (/[^A-Za-z0-9]/.test(newPassword)) score++;
		return score;
	})();

	const handlePasswordSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!currentPassword) {
			setPasswordFeedback({ type: "error", text: "Enter your current password." });
			return;
		}
		if (newPassword.length < 8) {
			setPasswordFeedback({
				type: "error",
				text: "New password must be at least 8 characters.",
			});
			return;
		}
		if (newPassword !== confirmPassword) {
			setPasswordFeedback({
				type: "error",
				text: "New password and confirmation do not match.",
			});
			return;
		}
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		const today = new Date().toLocaleDateString("en-US", {
			month: "short",
			day: "2-digit",
			year: "numeric",
		});
		setPasswordUpdatedAt(today);
		setPasswordFeedback({
			type: "success",
			text: "Password updated across active credentials.",
		});
		logActivity({
			category: "Security",
			action: "Updated account password",
			target: "Account credentials",
		});
	};

	const handleToggle2FA = (enabled: boolean) => {
		setTwoFactorEnabled(enabled);
		logActivity({
			category: "Security",
			action: enabled
				? "Enabled two-factor authentication"
				: "Disabled two-factor authentication",
			target: "Authenticator TOTP",
			status: enabled ? "Success" : "Warning",
		});
		notify(
			enabled
				? "Two-factor authentication enabled"
				: "Two-factor authentication disabled"
		);
	};

	const handleRevokeSession = (id: string) => {
		const target = sessions.find((s) => s.id === id);
		if (!target || target.current) return;
		setSessions((prev) => prev.filter((s) => s.id !== id));
		logActivity({
			category: "Security",
			action: "Revoked active session",
			target: `${target.device} (${target.ip})`,
			status: "Warning",
		});
		notify(`Revoked session on ${target.device}`);
	};

	const handleRevokeAllOthers = () => {
		const otherCount = sessions.filter((s) => !s.current).length;
		if (otherCount === 0) return;
		setSessions((prev) => prev.filter((s) => s.current));
		logActivity({
			category: "Security",
			action: "Signed out all other sessions",
			target: `${otherCount} device(s) revoked`,
			status: "Warning",
		});
		notify(`Signed out ${otherCount} other session(s)`);
	};

	const handleCreateToken = (e: FormEvent) => {
		e.preventDefault();
		const cleanName = tokenName.trim();
		if (!cleanName) return;
		const secretSuffix = Math.random().toString(36).slice(2, 10);
		const prefixHex = Math.random().toString(16).slice(2, 6);
		const fullSecret = `hw_live_${prefixHex}${secretSuffix}`;
		const created: ApiToken = {
			id: `tok-${Date.now()}`,
			name: cleanName,
			prefix: `hw_live_${prefixHex}••••${secretSuffix.slice(-4)}`,
			scopes: tokenScopes.length > 0 ? tokenScopes : ["analytics:read"],
			createdAt: "Just now",
			lastUsed: "Never",
		};
		setTokens((prev) => [created, ...prev]);
		setRevealedToken(fullSecret);
		setTokenName("");
		logActivity({
			category: "Security",
			action: "Generated personal API token",
			target: `${cleanName} (${created.scopes.join(", ")})`,
		});
	};

	const handleRevokeToken = (id: string) => {
		const target = tokens.find((t) => t.id === id);
		setTokens((prev) => prev.filter((t) => t.id !== id));
		if (target) {
			logActivity({
				category: "Security",
				action: "Revoked personal API token",
				target: target.name,
				status: "Warning",
			});
			notify(`Revoked API token "${target.name}"`);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader>
				<PageHeaderRow>
					<PageHeaderHeading
						title="Security & Sessions"
						description="Protect your account with strong credentials, two-factor authentication, and scoped API tokens."
					/>
				</PageHeaderRow>
				<PageHeaderFacts
					items={[
						{
							label: "2FA protection",
							value: twoFactorEnabled ? "Enabled" : "Disabled",
							detail: "TOTP authenticator app",
						},
						{
							label: "Active sessions",
							value: sessions.length,
							detail: "Signed-in browsers & devices",
						},
						{
							label: "API tokens",
							value: tokens.length,
							detail: "Personal access credentials",
						},
						{
							label: "Password updated",
							value: passwordUpdatedAt,
							detail: "Last credential rotation",
						},
					]}
				/>
			</PageHeader>

			{banner && (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
					<CheckIcon className="size-4 shrink-0" />
					<span>{banner}</span>
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Password Card */}
				<form onSubmit={handlePasswordSubmit}>
					<Card className="h-full dark:bg-transparent">
						<CardHeader className="border-b">
							<CardTitle className="text-base">Update Password</CardTitle>
							<CardDescription>
								Use at least 8 characters combining letters, numbers, and symbols.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 p-6">
							<div className="space-y-2">
								<Label htmlFor="cur-password">Current password</Label>
								<Input
									id="cur-password"
									type="password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									autoComplete="current-password"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-password">New password</Label>
								<Input
									id="new-password"
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									autoComplete="new-password"
								/>
								{newPassword && (
									<div className="space-y-1 pt-1">
										<div className="grid grid-cols-4 gap-1.5">
											{[1, 2, 3, 4].map((step) => (
												<div
													key={step}
													className={`h-1.5 rounded-full transition-colors ${
														passwordStrength >= step
															? passwordStrength >= 3
																? "bg-emerald-500"
																: "bg-amber-500"
															: "bg-muted"
													}`}
												/>
											))}
										</div>
										<p className="text-xs text-muted-foreground">
											Strength:{" "}
											{passwordStrength <= 1
												? "Weak"
												: passwordStrength === 2
													? "Fair"
													: passwordStrength === 3
														? "Good"
														: "Strong"}
										</p>
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="confirm-password">Confirm new password</Label>
								<Input
									id="confirm-password"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									autoComplete="new-password"
								/>
							</div>
							{passwordFeedback && (
								<p
									className={
										passwordFeedback.type === "error"
											? "text-sm text-destructive"
											: "text-sm text-emerald-600 dark:text-emerald-400"
									}
								>
									{passwordFeedback.text}
								</p>
							)}
						</CardContent>
						<CardFooter className="justify-end border-t px-6 py-4">
							<Button type="submit" size="sm">
								Update password
							</Button>
						</CardFooter>
					</Card>
				</form>

				{/* 2FA Card */}
				<Card className="flex flex-col justify-between dark:bg-transparent">
					<div>
						<CardHeader className="border-b">
							<div className="flex items-center justify-between gap-4">
								<div>
									<CardTitle className="text-base">
										Two-Factor Authentication (2FA)
									</CardTitle>
									<CardDescription>
										Require a one-time verification code from your authenticator app on sign-in.
									</CardDescription>
								</div>
								<Switch
									aria-label="Enable two-factor authentication"
									checked={twoFactorEnabled}
									onCheckedChange={handleToggle2FA}
								/>
							</div>
						</CardHeader>
						<CardContent className="space-y-4 p-6">
							<div className="flex items-start justify-between gap-4 rounded-lg border p-4">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<ShieldCheckIcon className="size-4 text-muted-foreground" />
										<span className="text-sm font-medium text-foreground">
											Authenticator App (TOTP)
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										Compatible with 1Password, Google Authenticator, and Authy.
									</p>
								</div>
								<StatusLabel tone={twoFactorEnabled ? "good" : "warning"}>
									{twoFactorEnabled ? "Active" : "Off"}
								</StatusLabel>
							</div>

							<div className="flex items-center justify-between gap-4 rounded-lg border p-4">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<KeyRoundIcon className="size-4 text-muted-foreground" />
										<span className="text-sm font-medium text-foreground">
											Recovery Backup Codes
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										6 single-use codes stored safely in case you lose access to your device.
									</p>
								</div>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => setCodesDialogOpen(true)}
								>
									View codes
								</Button>
							</div>
						</CardContent>
					</div>
					<CardFooter className="border-t px-6 py-4 text-xs text-muted-foreground">
						Hardware security keys & passkeys can also be enrolled via SSO policy.
					</CardFooter>
				</Card>
			</div>

			{/* Active Sessions */}
			<Card className="dark:bg-transparent">
				<CardHeader className="gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-base">Active Sessions</CardTitle>
						<CardDescription>
							Devices currently authenticated with your workspace credentials.
						</CardDescription>
					</div>
					<Button
						size="sm"
						variant="outline"
						disabled={sessions.filter((s) => !s.current).length === 0}
						onClick={handleRevokeAllOthers}
					>
						<LogOutIcon className="size-4" />
						Sign out other sessions
					</Button>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable>
						<DataTableHeader>
							<DataTableRow>
								<DataTableHead>Device & Browser</DataTableHead>
								<DataTableHead>Location</DataTableHead>
								<DataTableHead>IP Address</DataTableHead>
								<DataTableHead>Last Active</DataTableHead>
								<DataTableHead className="text-right">Action</DataTableHead>
							</DataTableRow>
						</DataTableHeader>
						<DataTableBody>
							{sessions.map((session) => (
								<DataTableRow key={session.id}>
									<DataTableCell>
										<div className="flex items-center gap-2.5">
											{session.kind === "mobile" ? (
												<SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
											) : (
												<LaptopIcon className="size-4 shrink-0 text-muted-foreground" />
											)}
											<div>
												<div className="font-medium text-foreground">
													{session.device}
												</div>
												<div className="text-xs text-muted-foreground">
													{session.browser}
												</div>
											</div>
										</div>
									</DataTableCell>
									<DataTableCell className="text-muted-foreground">
										{session.location}
									</DataTableCell>
									<DataTableCell className="font-mono text-xs text-muted-foreground tabular-nums">
										{session.ip}
									</DataTableCell>
									<DataTableCell>
										{session.current ? (
											<StatusLabel tone="good">{session.lastActive}</StatusLabel>
										) : (
											<span className="text-xs text-muted-foreground tabular-nums">
												{session.lastActive}
											</span>
										)}
									</DataTableCell>
									<DataTableCell className="text-right">
										{session.current ? (
											<span className="text-xs text-muted-foreground">
												This device
											</span>
										) : (
											<Button
												size="xs"
												variant="ghost"
												className="text-destructive hover:text-destructive"
												onClick={() => handleRevokeSession(session.id)}
											>
												Revoke
											</Button>
										)}
									</DataTableCell>
								</DataTableRow>
							))}
						</DataTableBody>
					</DataTable>
				</CardContent>
			</Card>

			{/* API Tokens */}
			<Card className="dark:bg-transparent">
				<CardHeader className="gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle className="text-base">Personal API Tokens</CardTitle>
						<CardDescription>
							Scoped bearer tokens for scripts, telemetry exports, and CI integrations.
						</CardDescription>
					</div>
					<Button
						size="sm"
						onClick={() => {
							setRevealedToken(null);
							setTokenDialogOpen(true);
						}}
					>
						<PlusIcon className="size-4" />
						Generate token
					</Button>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable>
						<DataTableHeader>
							<DataTableRow>
								<DataTableHead>Token Name</DataTableHead>
								<DataTableHead>Prefix</DataTableHead>
								<DataTableHead>Scopes</DataTableHead>
								<DataTableHead>Last Used</DataTableHead>
								<DataTableHead className="text-right">Action</DataTableHead>
							</DataTableRow>
						</DataTableHeader>
						<DataTableBody>
							{tokens.length === 0 ? (
								<DataTableRow>
									<DataTableCell colSpan={5} className="py-10 text-center">
										<p className="font-medium text-foreground text-sm">
											No active API tokens
										</p>
										<p className="text-muted-foreground text-xs mt-1">
											Generate a personal token when you need programmatic access.
										</p>
									</DataTableCell>
								</DataTableRow>
							) : (
								tokens.map((token) => (
									<DataTableRow key={token.id}>
										<DataTableCell className="font-medium text-foreground">
											{token.name}
										</DataTableCell>
										<DataTableCell className="font-mono text-xs text-muted-foreground">
											{token.prefix}
										</DataTableCell>
										<DataTableCell className="text-xs text-muted-foreground">
											{token.scopes.join(" · ")}
										</DataTableCell>
										<DataTableCell className="text-xs text-muted-foreground tabular-nums">
											{token.lastUsed} · created {token.createdAt}
										</DataTableCell>
										<DataTableCell className="text-right">
											<Button
												size="xs"
												variant="ghost"
												className="text-destructive hover:text-destructive"
												onClick={() => handleRevokeToken(token.id)}
											>
												<Trash2Icon className="size-3.5" />
												Revoke
											</Button>
										</DataTableCell>
									</DataTableRow>
								))
							)}
						</DataTableBody>
					</DataTable>
				</CardContent>
			</Card>

			{/* Recovery Codes Dialog */}
			<Dialog open={codesDialogOpen} onOpenChange={setCodesDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Backup recovery codes</DialogTitle>
						<DialogDescription>
							Each code can be used once if your authenticator app is unavailable.
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-4 font-mono text-sm tabular-nums">
						{recoveryCodes.map((code) => (
							<div key={code} className="text-center tracking-wider text-foreground">
								{code}
							</div>
						))}
					</div>
					<DialogFooter className="flex-wrap gap-2 sm:justify-between">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								setRecoveryCodes(Array.from({ length: 6 }, generateRandomCode));
								logActivity({
									category: "Security",
									action: "Regenerated 2FA recovery codes",
									target: "6 backup codes",
								});
							}}
						>
							<RefreshCwIcon className="size-3.5" />
							Regenerate
						</Button>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									void navigator.clipboard?.writeText(recoveryCodes.join("\n"));
									notify("Copied recovery codes to clipboard");
								}}
							>
								<CopyIcon className="size-3.5" />
								Copy all
							</Button>
							<DialogClose render={<Button size="sm" />}>Done</DialogClose>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create API Token Dialog */}
			<Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{revealedToken ? "Token created" : "Generate personal API token"}
						</DialogTitle>
						<DialogDescription>
							{revealedToken
								? "Copy this token now. For your security it will not be displayed again."
								: "Choose a descriptive label and the minimum required scopes."}
						</DialogDescription>
					</DialogHeader>
					{revealedToken ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-3 font-mono text-xs break-all">
								<span>{revealedToken}</span>
								<Button
									size="icon-xs"
									variant="ghost"
									aria-label="Copy token"
									onClick={() => {
										void navigator.clipboard?.writeText(revealedToken);
										notify("Copied new API token");
									}}
								>
									<CopyIcon className="size-3.5" />
								</Button>
							</div>
							<DialogFooter>
								<DialogClose render={<Button size="sm" />}>Close</DialogClose>
							</DialogFooter>
						</div>
					) : (
						<form onSubmit={handleCreateToken} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="token-name">Token name</Label>
								<Input
									id="token-name"
									value={tokenName}
									onChange={(e) => setTokenName(e.target.value)}
									placeholder="e.g. Nightly Warehouse Sync"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label>Permissions</Label>
								<div className="space-y-2 rounded-lg border p-3">
									{[
										{ id: "analytics:read", label: "analytics:read — Read metrics & cohorts" },
										{ id: "customers:write", label: "customers:write — Create & update records" },
										{ id: "webhooks:manage", label: "webhooks:manage — Configure event endpoints" },
									].map((scope) => {
										const checked = tokenScopes.includes(scope.id);
										return (
											<label
												key={scope.id}
												className="flex cursor-pointer items-center gap-2.5 text-sm"
											>
												<Checkbox
													checked={checked}
													onCheckedChange={(val) => {
														setTokenScopes((prev) =>
															val
																? [...prev, scope.id]
																: prev.filter((s) => s !== scope.id)
														);
													}}
												/>
												<span className="text-xs text-foreground">{scope.label}</span>
											</label>
										);
									})}
								</div>
							</div>
							<DialogFooter>
								<DialogClose render={<Button type="button" variant="outline" />}>
									Cancel
								</DialogClose>
								<Button type="submit">Generate token</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default SecurityView;
