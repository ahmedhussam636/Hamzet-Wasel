"use client";

import { useEffect, useState } from "react";
import {
	PageHeader,
	PageHeaderActions,
	PageHeaderFacts,
	PageHeaderHeading,
	PageHeaderRow,
} from "@/components/dashboardblocks/page-header";
import {
	ConnectionRow,
	CopyButton,
	SettingsRow,
	maskSecret,
	type ConnectionStatus,
} from "@/components/dashboardblocks/settings";
import {
	DashboardBusy,
	DashboardErrorState,
	Skeleton,
	usePageBlockState,
	type DashboardBlockStateProps,
} from "@/components/dashboard-state";
import { useTheme } from "@/components/theme-provider";
import { useUserProfile } from "@/components/user-profile-provider";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
	BellIcon,
	CheckIcon,
	KeyRoundIcon,
	MonitorIcon,
	MoonIcon,
	RefreshCwIcon,
	RotateCcwIcon,
	SlackIcon,
	SunIcon,
	WebhookIcon,
} from "lucide-react";

interface SystemSettingsState {
	defaultLanding: string;
	compactTables: boolean;
	reducedMotion: boolean;
	currency: "USD" | "EUR" | "SAR" | "EGP";
	timeFormat: "24h" | "12h";
	refreshInterval: "30s" | "1m" | "5m" | "manual";
	maskExportPii: boolean;
	weeklyDigest: boolean;
	incidentEscalations: boolean;
	slaBreachAlerts: boolean;
	slackStatus: ConnectionStatus;
	pagerDutyStatus: ConnectionStatus;
	webhookStatus: ConnectionStatus;
	apiKey: string;
	webhookSecret: string;
}

const SETTINGS_STORAGE_KEY = "hamzet-wasel-system-settings-v1";

const DEFAULT_SYSTEM_SETTINGS: SystemSettingsState = {
	defaultLanding: "#/overview",
	compactTables: false,
	reducedMotion: false,
	currency: "USD",
	timeFormat: "24h",
	refreshInterval: "1m",
	maskExportPii: true,
	weeklyDigest: true,
	incidentEscalations: true,
	slaBreachAlerts: true,
	slackStatus: "connected",
	pagerDutyStatus: "connected",
	webhookStatus: "paused",
	apiKey: "hw_live_98a4d21f0c7b4e18b35d2209",
	webhookSecret: "whsec_71e2b09c8a4f6d13c902a5f1",
};

function generateToken(prefix: string) {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let out = prefix;
	for (let i = 0; i < 24; i++) {
		out += chars[Math.floor(Math.random() * chars.length)];
	}
	return out;
}

function loadSystemSettings(): SystemSettingsState {
	if (typeof window === "undefined") return DEFAULT_SYSTEM_SETTINGS;
	try {
		const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return DEFAULT_SYSTEM_SETTINGS;
		return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(raw) };
	} catch {
		return DEFAULT_SYSTEM_SETTINGS;
	}
}

export function SettingsView(props: DashboardBlockStateProps = {}) {
	const state = usePageBlockState(props);
	const { theme, resolvedTheme, setTheme } = useTheme();
	const { logActivity } = useUserProfile();

	const [settings, setSettings] = useState<SystemSettingsState>(loadSystemSettings);
	const [notice, setNotice] = useState<string | null>(null);
	const [confirmReset, setConfirmReset] = useState(false);

	useEffect(() => {
		try {
			window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
		} catch {
			// Ignore storage errors
		}
	}, [settings]);

	useEffect(() => {
		if (!notice) return;
		const timer = window.setTimeout(() => setNotice(null), 3200);
		return () => window.clearTimeout(timer);
	}, [notice]);

	const updateSetting = <K extends keyof SystemSettingsState>(
		key: K,
		value: SystemSettingsState[K],
		activityLabel?: string,
		category: "Account" | "Security" | "Team" | "Data" = "Account"
	) => {
		setSettings((prev) => ({ ...prev, [key]: value }));
		if (activityLabel) {
			logActivity({
				category,
				action: activityLabel,
				target: String(value),
			});
		}
		setNotice("Preferences saved");
	};

	const activeChannelCount = [
		settings.slackStatus,
		settings.pagerDutyStatus,
		settings.webhookStatus,
	].filter((s) => s === "connected").length;

	const handleResetDefaults = () => {
		if (!confirmReset) {
			setConfirmReset(true);
			return;
		}
		setSettings(DEFAULT_SYSTEM_SETTINGS);
		setTheme("system");
		setConfirmReset(false);
		logActivity({
			category: "Account",
			action: "Restored default system preferences",
			target: "Application settings",
		});
		setNotice("Restored default system settings");
	};

	const selectClasses =
		"flex h-9 min-w-44 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

	return (
		<div className="flex flex-col gap-6">
			<PageHeader>
				<PageHeaderRow>
					<PageHeaderHeading
						title="Settings"
						description="Configure application appearance, data formatting, alert routing, and API credentials."
					/>
					<PageHeaderActions>
						{confirmReset ? (
							<div className="flex items-center gap-2">
								<Button
									type="button"
									size="sm"
									variant="destructive"
									onClick={handleResetDefaults}
								>
									Confirm reset
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => setConfirmReset(false)}
								>
									Cancel
								</Button>
							</div>
						) : (
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={handleResetDefaults}
							>
								<RotateCcwIcon className="size-3.5" />
								Restore defaults
							</Button>
						)}
					</PageHeaderActions>
				</PageHeaderRow>
				<PageHeaderFacts
					items={[
						{
							label: "Active theme",
							value:
								theme === "system"
									? `System (${resolvedTheme === "dark" ? "Dark" : "Light"})`
									: theme === "dark"
										? "Dark"
										: "Light",
							detail: "Applied across all dashboards",
						},
						{
							label: "Currency & clock",
							value: `${settings.currency} · ${settings.timeFormat}`,
							detail: "Formatting for KPIs & exports",
						},
						{
							label: "Alert channels",
							value: `${activeChannelCount} / 3`,
							detail: "Active incident destinations",
						},
						{
							label: "Auto-refresh",
							value:
								settings.refreshInterval === "manual"
									? "Manual"
									: `Every ${settings.refreshInterval}`,
							detail: "Telemetry polling interval",
						},
					]}
				/>
			</PageHeader>

			{notice && (
				<div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
					<CheckIcon className="size-4 shrink-0" />
					<span>{notice}</span>
				</div>
			)}

			{state.isLoading ? (
				<div className="grid gap-4 lg:grid-cols-2">
					{Array.from({ length: 4 }, (_, index) => (
						<Card key={index} className="dark:bg-transparent">
							<CardContent className="space-y-4 p-6">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : state.isError ? (
				<Card className="dark:bg-transparent">
					<CardContent className="p-4">
						<DashboardErrorState
							title="Couldn’t load settings"
							description={
								state.errorMessage ?? "Unable to load application preferences."
							}
							onRetry={props.onRetry ?? state.handleRetry}
						/>
					</CardContent>
				</Card>
			) : (
				<DashboardBusy refreshing={state.refreshing} label="Updating settings">
					<div className="grid gap-5 lg:grid-cols-2">
						{/* Appearance & Navigation */}
						<Card className="dark:bg-transparent">
							<CardHeader className="border-b">
								<CardTitle className="text-base">Appearance & Navigation</CardTitle>
								<CardDescription>
									Control color theme, workspace density, and initial view on launch.
								</CardDescription>
							</CardHeader>
							<CardContent className="@container divide-y p-6">
								<SettingsRow
									className="pb-4"
									label="Color theme"
									description="Select light, dark, or match your operating system."
								>
									<div
										role="radiogroup"
										aria-label="Color theme"
										className="bg-muted inline-flex items-center rounded-lg p-0.5"
									>
										{(
											[
												{ id: "light", label: "Light", icon: SunIcon },
												{ id: "dark", label: "Dark", icon: MoonIcon },
												{ id: "system", label: "System", icon: MonitorIcon },
											] as const
										).map((option) => {
											const Icon = option.icon;
											const active = (theme ?? "system") === option.id;
											return (
												<button
													key={option.id}
													type="button"
													role="radio"
													aria-checked={active}
													onClick={() => {
														setTheme(option.id);
														setNotice(`Theme set to ${option.label}`);
													}}
													className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
														active
															? "bg-background text-foreground shadow-xs"
															: "text-muted-foreground hover:text-foreground"
													}`}
												>
													<Icon className="size-3.5" />
													{option.label}
												</button>
											);
										})}
									</div>
								</SettingsRow>

								<SettingsRow
									className="py-4"
									label="Default landing page"
									description="View shown first when opening the workspace."
								>
									<select
										aria-label="Default landing page"
										value={settings.defaultLanding}
										onChange={(e) =>
											updateSetting(
												"defaultLanding",
												e.target.value,
												"Changed default landing page"
											)
										}
										className={selectClasses}
									>
										<option value="#/overview">Dashboard Overview</option>
										<option value="#/devops">DevOps Overview</option>
										<option value="#/events">Live Events</option>
										<option value="#/customers">Customers</option>
									</select>
								</SettingsRow>

								<SettingsRow
									className="py-4"
									label="Compact data tables"
									description="Use tighter row padding across analytics and operations grids."
								>
									<Switch
										aria-label="Compact data tables"
										checked={settings.compactTables}
										onCheckedChange={(checked) =>
											updateSetting("compactTables", checked)
										}
									/>
								</SettingsRow>

								<SettingsRow
									className="pt-4"
									label="Reduce chart transitions"
									description="Minimize animated transitions when refreshing telemetry panels."
								>
									<Switch
										aria-label="Reduce chart transitions"
										checked={settings.reducedMotion}
										onCheckedChange={(checked) =>
											updateSetting("reducedMotion", checked)
										}
									/>
								</SettingsRow>
							</CardContent>
						</Card>

						{/* Formatting & Data Governance */}
						<Card className="dark:bg-transparent">
							<CardHeader className="border-b">
								<CardTitle className="text-base">
									Formatting & Data Governance
								</CardTitle>
								<CardDescription>
									Standardize currency units, clock formatting, polling cadence, and export privacy.
								</CardDescription>
							</CardHeader>
							<CardContent className="@container divide-y p-6">
								<SettingsRow
									className="pb-4"
									label="Reporting currency"
									description="Used across revenue KPIs, cohorts, and billing metrics."
								>
									<select
										aria-label="Reporting currency"
										value={settings.currency}
										onChange={(e) =>
											updateSetting(
												"currency",
												e.target.value as SystemSettingsState["currency"],
												"Updated reporting currency",
												"Data"
											)
										}
										className={selectClasses}
									>
										<option value="USD">USD ($) · US Dollar</option>
										<option value="EUR">EUR (€) · Euro</option>
										<option value="SAR">SAR (﷼) · Saudi Riyal</option>
										<option value="EGP">EGP (£) · Egyptian Pound</option>
									</select>
								</SettingsRow>

								<SettingsRow
									className="py-4"
									label="Timestamp format"
									description="Clock display across logs, incidents, and audit timelines."
								>
									<select
										aria-label="Timestamp format"
										value={settings.timeFormat}
										onChange={(e) =>
											updateSetting(
												"timeFormat",
												e.target.value as SystemSettingsState["timeFormat"]
											)
										}
										className={selectClasses}
									>
										<option value="24h">24-hour (ISO 8601)</option>
										<option value="12h">12-hour (AM / PM)</option>
									</select>
								</SettingsRow>

								<SettingsRow
									className="py-4"
									label="Telemetry auto-refresh"
									description="Polling frequency for live pipelines, logs, and event charts."
								>
									<select
										aria-label="Telemetry auto-refresh"
										value={settings.refreshInterval}
										onChange={(e) =>
											updateSetting(
												"refreshInterval",
												e.target.value as SystemSettingsState["refreshInterval"]
											)
										}
										className={selectClasses}
									>
										<option value="30s">Every 30 seconds</option>
										<option value="1m">Every 1 minute</option>
										<option value="5m">Every 5 minutes</option>
										<option value="manual">Manual refresh only</option>
									</select>
								</SettingsRow>

								<SettingsRow
									className="pt-4"
									label="Mask PII in CSV exports"
									description="Hash customer email addresses when exporting cohorts or customer tables."
								>
									<Switch
										aria-label="Mask PII in CSV exports"
										checked={settings.maskExportPii}
										onCheckedChange={(checked) =>
											updateSetting(
												"maskExportPii",
												checked,
												"Updated CSV PII masking policy",
												"Security"
											)
										}
									/>
								</SettingsRow>
							</CardContent>
						</Card>

						{/* Alerts & Connected Channels */}
						<Card className="dark:bg-transparent">
							<CardHeader className="border-b">
								<CardTitle className="text-base">
									Alerts & Escalation Channels
								</CardTitle>
								<CardDescription>
									Manage automated threshold triggers and external incident destinations.
								</CardDescription>
							</CardHeader>
							<CardContent className="@container divide-y p-6">
								<SettingsRow
									className="pb-3.5"
									label="Weekly executive digest"
									description="Summary of revenue, active retention, and incident SLAs every Monday."
								>
									<Switch
										aria-label="Weekly executive digest"
										checked={settings.weeklyDigest}
										onCheckedChange={(checked) =>
											updateSetting("weeklyDigest", checked)
										}
									/>
								</SettingsRow>

								<SettingsRow
									className="py-3.5"
									label="Critical incident escalations"
									description="Dispatch P1 outages and cluster degradation immediately to on-call."
								>
									<Switch
										aria-label="Critical incident escalations"
										checked={settings.incidentEscalations}
										onCheckedChange={(checked) =>
											updateSetting("incidentEscalations", checked)
										}
									/>
								</SettingsRow>

								<SettingsRow
									className="py-3.5"
									label="SLA latency threshold alerts"
									description="Notify when p95 gateway latency exceeds 450ms for 5 minutes."
								>
									<Switch
										aria-label="SLA latency threshold alerts"
										checked={settings.slaBreachAlerts}
										onCheckedChange={(checked) =>
											updateSetting("slaBreachAlerts", checked)
										}
									/>
								</SettingsRow>

								<div className="pt-2">
									<ConnectionRow
										name="Slack · #ops-incidents"
										status={settings.slackStatus}
										description="Posts deployment updates and P1/P2 incident threads."
										logo={
											<span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border">
												<SlackIcon className="size-4" />
											</span>
										}
										actions={
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() =>
													updateSetting(
														"slackStatus",
														settings.slackStatus === "connected"
															? "paused"
															: "connected",
														"Toggled Slack alert channel"
													)
												}
											>
												{settings.slackStatus === "connected" ? "Pause" : "Resume"}
											</Button>
										}
									/>
									<ConnectionRow
										name="PagerDuty · Primary On-Call"
										status={settings.pagerDutyStatus}
										description="Pages engineering responders when production health drops."
										logo={
											<span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border">
												<BellIcon className="size-4" />
											</span>
										}
										actions={
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() =>
													updateSetting(
														"pagerDutyStatus",
														settings.pagerDutyStatus === "connected"
															? "paused"
															: "connected",
														"Toggled PagerDuty escalation"
													)
												}
											>
												{settings.pagerDutyStatus === "connected"
													? "Pause"
													: "Resume"}
											</Button>
										}
									/>
									<ConnectionRow
										name="Signed Webhook Dispatcher"
										status={settings.webhookStatus}
										description="Streams audit and pipeline events to https://hooks.internal.hamzetwasel.com."
										logo={
											<span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border">
												<WebhookIcon className="size-4" />
											</span>
										}
										actions={
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() =>
													updateSetting(
														"webhookStatus",
														settings.webhookStatus === "connected"
															? "paused"
															: "connected",
														"Toggled webhook dispatcher"
													)
												}
											>
												{settings.webhookStatus === "connected"
													? "Pause"
													: "Enable"}
											</Button>
										}
									/>
								</div>
							</CardContent>
						</Card>

						{/* API Credentials & Local Storage */}
						<Card className="dark:bg-transparent">
							<CardHeader className="border-b">
								<CardTitle className="text-base">
									API Credentials & Diagnostics
								</CardTitle>
								<CardDescription>
									Inspect workspace ingestion tokens, rotate webhook secrets, or clear local drafts.
								</CardDescription>
							</CardHeader>
							<CardContent className="@container divide-y p-6">
								<SettingsRow
									className="pb-4"
									label="Telemetry ingestion key"
									description="Used by SDK clients and backend collectors to stream events."
								>
									<div className="flex items-center gap-1.5">
										<code className="bg-muted rounded-md border px-2.5 py-1 font-mono text-xs tabular-nums">
											{maskSecret(settings.apiKey, 10)}
										</code>
										<CopyButton label="Copy API key" value={settings.apiKey} />
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() =>
												updateSetting(
													"apiKey",
													generateToken("hw_live_"),
													"Rotated telemetry API key",
													"Security"
												)
											}
										>
											<RefreshCwIcon className="size-3.5" />
											Rotate
										</Button>
									</div>
								</SettingsRow>

								<SettingsRow
									className="py-4"
									label="Webhook signing secret"
									description="Verifies HMAC-SHA256 signatures on outbound webhook payloads."
								>
									<div className="flex items-center gap-1.5">
										<code className="bg-muted rounded-md border px-2.5 py-1 font-mono text-xs tabular-nums">
											{maskSecret(settings.webhookSecret, 8)}
										</code>
										<CopyButton
											label="Copy webhook secret"
											value={settings.webhookSecret}
										/>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() =>
												updateSetting(
													"webhookSecret",
													generateToken("whsec_"),
													"Rotated webhook signing secret",
													"Security"
												)
											}
										>
											<KeyRoundIcon className="size-3.5" />
											Rotate
										</Button>
									</div>
								</SettingsRow>

								<SettingsRow
									className="pt-4"
									label="Clear local view filters"
									description="Reset cached table filters and temporary drafts stored in this browser."
								>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => {
											logActivity({
												category: "Data",
												action: "Cleared temporary browser filter cache",
												target: "Local storage cache",
											});
											setNotice("Temporary view cache cleared");
										}}
									>
										Clear cache
									</Button>
								</SettingsRow>
							</CardContent>
						</Card>
					</div>
				</DashboardBusy>
			)}
		</div>
	);
}

export default SettingsView;
