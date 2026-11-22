"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { AppSearch, useGlobalCommandMenu } from "@/components/app-search";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { navLinks } from "@/components/app-shared";
import { NotificationsSheet } from "@/components/notifications-sheet";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
	ArrowLeftIcon,
	KanbanSquareIcon,
	KeyboardIcon,
	SendIcon,
} from "lucide-react";

export function AppHeader({ pathname }: { pathname?: string }) {
	const activeItem = navLinks.find((item) => item.path === pathname);
	const { openShortcutsHelp } = useGlobalCommandMenu();

	const handleGoBack = () => {
		if (activeItem?.parentPath?.startsWith("#/devops")) {
			window.location.hash = activeItem.parentPath;
			return;
		}
		if (window.history.length > 1) {
			window.history.back();
			return;
		}
		window.location.hash = activeItem?.parentPath ?? "#/overview";
	};

	return (
		<header
			className={cn(
				"sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6"
			)}
		>
			<div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
				<CustomSidebarTrigger />
				<Separator
					className="mr-1 h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				{activeItem?.isSubPage && (
					<Button
						type="button"
						size="icon-xs"
						variant="outline"
						onClick={handleGoBack}
						aria-label={`Back to ${activeItem.parentTitle ?? "previous page"}`}
						title={`Back to ${activeItem.parentTitle ?? "previous page"}`}
						className="shrink-0"
					>
						<ArrowLeftIcon className="size-3.5" />
					</Button>
				)}
				<AppBreadcrumbs page={activeItem} />
			</div>
			<div className="flex items-center gap-2 sm:gap-3">
				<AppSearch
					placeholder="Quick jump..."
					className="h-8 w-8 px-0 sm:w-48 sm:px-2.5 sm:justify-start text-muted-foreground font-normal text-xs bg-muted/35"
				/>
				<Button
					size="icon-sm"
					variant="outline"
					title="Keyboard shortcuts (?)"
					aria-label="Keyboard shortcuts"
					onClick={openShortcutsHelp}
				>
					<KeyboardIcon className="size-4" />
				</Button>
				<Button
					size="icon-sm"
					variant={pathname === "#/kanban" ? "default" : "outline"}
					title="Kanban Board"
					onClick={() => {
						window.location.hash =
							pathname === "#/kanban" ? "#/overview" : "#/kanban";
					}}
				>
					<KanbanSquareIcon className="size-4" />
				</Button>
				<Button size="icon-sm" variant="outline">
					<SendIcon />
				</Button>
				<ThemeSwitcher variant="outline" className="" />
				<NotificationsSheet />
			</div>
		</header>
	);
}
