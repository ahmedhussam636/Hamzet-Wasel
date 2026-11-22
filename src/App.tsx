import { useState, useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import {
	UserProfileProvider,
	useUserProfile,
} from "@/components/user-profile-provider";
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
import { Dashboard } from "@/components/dashboard";
import { EventsView } from "@/components/pages/events-view";
import { FunnelsView } from "@/components/pages/funnels-view";
import { RetentionView } from "@/components/pages/retention-view";
import { FlowsView } from "@/components/pages/flows-view";
import { SegmentsView } from "@/components/pages/segments-view";
import { CohortsView } from "@/components/pages/cohorts-view";
import { ProfilesView } from "@/components/pages/profiles-view";
import { IntegrationsView } from "@/components/pages/integrations-view";
import { SettingsView } from "@/components/pages/settings-view";
import { KanbanView } from "@/components/pages/kanban-view";
import { DevOpsView } from "@/components/pages/devops-view";
import { CustomersView } from "@/components/pages/customers-view";
import { CalendarView } from "@/components/pages/calendar-view";
import { MailView } from "@/components/pages/mail-view";
import { ChatView } from "@/components/pages/chat-view";
import { AccountProfileView } from "@/components/pages/account-profile-view";
import { WorkspaceTeamView } from "@/components/pages/workspace-team-view";
import { SecurityView } from "@/components/pages/security-view";
import { ActivityLogView } from "@/components/pages/activity-log-view";
import { DevOpsPipelinesView } from "@/components/pages/devops-pipelines-view";
import { DevOpsClustersView } from "@/components/pages/devops-clusters-view";
import { DevOpsIncidentsView } from "@/components/pages/devops-incidents-view";
import { DevOpsLogsView } from "@/components/pages/devops-logs-view";
import { DevOpsAuditLogView } from "@/components/pages/devops-audit-log-view";
import { AIView } from "@/components/pages/ai-view";
import { LogInIcon } from "lucide-react";

function AppContent() {
	const { user, signIn } = useUserProfile();
	const [pathname, setPathname] = useState<string>(() => {
		return window.location.hash || "#/overview";
	});

	useEffect(() => {
		const handleHashChange = () => {
			setPathname(window.location.hash || "#/overview");
		};

		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, []);

	if (user.signedOut) {
		const initials = user.name
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.map((p) => p.charAt(0).toUpperCase())
			.slice(0, 2)
			.join("");

		return (
			<div className="flex min-h-svh items-center justify-center bg-background p-4">
				<Card className="w-full max-w-sm dark:bg-transparent">
					<CardHeader className="items-center text-center">
						<Avatar className="size-16 border border-border">
							<AvatarImage
								src={user.avatar || undefined}
								alt={user.name}
								referrerPolicy="no-referrer"
							/>
							<AvatarFallback className="text-base font-medium">
								{initials || "U"}
							</AvatarFallback>
						</Avatar>
						<CardTitle className="pt-2 text-lg">Signed out</CardTitle>
						<CardDescription>
							You signed out of Hamzet Wasel as {user.name} ({user.email}).
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center text-xs text-muted-foreground">
						Your workspace preferences and local changes remain preserved.
					</CardContent>
					<CardFooter className="justify-center border-t pt-4">
						<Button className="w-full" onClick={signIn}>
							<LogInIcon className="size-4" />
							Sign back in as {user.name}
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	const renderCurrentPage = () => {
		switch (pathname) {
			case "#/kanban":
				return <KanbanView />;
			case "#/calendar":
			case "#/calender":
				return <CalendarView />;
			case "#/devops":
				return <DevOpsView />;
			case "#/devops/pipelines":
				return <DevOpsPipelinesView />;
			case "#/devops/clusters":
				return <DevOpsClustersView />;
			case "#/devops/incidents":
				return <DevOpsIncidentsView />;
			case "#/devops/logs":
				return <DevOpsLogsView />;
			case "#/devops/audit-log":
				return <DevOpsAuditLogView />;
			case "#/mail":
				return <MailView />;
			case "#/chat":
				return <ChatView />;
			case "#/ai":
				return <AIView />;
			case "#/customers":
			case "#/customer":
				return <CustomersView />;
			case "#/events":
				return <EventsView />;
			case "#/funnels":
				return <FunnelsView />;
			case "#/retention":
				return <RetentionView />;
			case "#/flows":
				return <FlowsView />;
			case "#/segments":
				return <SegmentsView />;
			case "#/cohorts":
				return <CohortsView />;
			case "#/profiles":
				return <ProfilesView />;
			case "#/integrations":
				return <IntegrationsView />;
			case "#/settings":
				return <SettingsView />;
			case "#/account":
			case "#/profile":
				return <AccountProfileView />;
			case "#/workspace":
			case "#/team":
				return <WorkspaceTeamView />;
			case "#/security":
				return <SecurityView />;
			case "#/activity":
				return <ActivityLogView />;
			case "#/overview":
			case "#":
			case "":
			default:
				return <Dashboard />;
		}
	};

	return <AppShell pathname={pathname}>{renderCurrentPage()}</AppShell>;
}

export default function App() {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<TooltipProvider>
				<UserProfileProvider>
					<AppContent />
				</UserProfileProvider>
			</TooltipProvider>
		</ThemeProvider>
	);
}
