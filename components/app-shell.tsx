import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { GlobalCommandMenuProvider } from "@/components/app-search";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({
	children,
	pathname = "#/overview",
}: {
	children: React.ReactNode;
	pathname?: string;
}) {
	return (
		<div className="overflow-hidden">
			<SidebarProvider className="relative h-svh">
				<GlobalCommandMenuProvider pathname={pathname}>
					<AppSidebar pathname={pathname} />
					<SidebarInset className="md:peer-data-[variant=inset]:ml-0">
						<AppHeader pathname={pathname} />
						<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
							{children}
						</div>
					</SidebarInset>
				</GlobalCommandMenuProvider>
			</SidebarProvider>
		</div>
	);
}
