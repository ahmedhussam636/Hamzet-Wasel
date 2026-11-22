import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { AppSearch } from "@/components/app-search";
import { navGroups, type SidebarNavItem } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import { CustomTrigger } from "@/components/custom-trigger";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function NavMenuItem({ item, pathname }: { item: SidebarNavItem; pathname?: string }) {
	const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
	const isSubActive = Boolean(item.subItems?.some((sub) => sub.path === pathname));
	const isActive = item.path === pathname || isSubActive;
	const [isOpen, setIsOpen] = useState(isSubActive);

	useEffect(() => {
		if (isSubActive) {
			setIsOpen(true);
		}
	}, [isSubActive]);

	if (!hasSubItems) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					isActive={isActive}
					tooltip={item.title}
					render={<a href={item.path} />}
				>
					{item.icon}
					<span>{item.title}</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={isActive}
				tooltip={item.title}
				onClick={() => setIsOpen((prev) => !prev)}
				className="cursor-pointer select-none"
			>
				{item.icon}
				<span className="flex-1 text-left">{item.title}</span>
				<ChevronDownIcon
					className={cn(
						"size-4 shrink-0 transition-transform duration-200 text-muted-foreground",
						isOpen ? "rotate-0" : "-rotate-90"
					)}
				/>
			</SidebarMenuButton>
			{isOpen && item.subItems && (
				<SidebarMenuSub>
					{item.subItems.map((subItem) => (
						<SidebarMenuSubItem key={subItem.title}>
							<SidebarMenuSubButton
								isActive={subItem.path === pathname}
								size="sm"
								render={<a href={subItem.path} />}
							>
								{subItem.icon && (
									<span className="[&>svg]:size-3.5 size-3.5 shrink-0 flex items-center justify-center text-muted-foreground">
										{subItem.icon}
									</span>
								)}
								<span>{subItem.title}</span>
							</SidebarMenuSubButton>
						</SidebarMenuSubItem>
					))}
				</SidebarMenuSub>
			)}
		</SidebarMenuItem>
	);
}

export function AppSidebar({ pathname }: { pathname?: string }) {
	return (
		<Sidebar
			className={cn(
				"transition-[left,right,top,width] group-data-[collapsible=offcanvas]:top-[calc(var(--app-header-height)*0.5)]"
			)}
			collapsible="offcanvas"
			variant="sidebar"
		>
			<SidebarHeader className="h-(--app-header-height,3rem) flex-row items-center justify-between">
				<Button variant="ghost" render={<a href="#/overview" />} nativeButton={false}>
					<span className="font-semibold tracking-tight">Hamzet Wasel</span>
				</Button>
				<CustomTrigger place="sidebar" />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<AppSearch />
				</SidebarGroup>
				{navGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none text-xs font-medium text-muted-foreground/80 tracking-wider uppercase">
							{group.label}
						</SidebarGroupLabel>
						<SidebarMenu>
							{group.items.map((item) => (
								<NavMenuItem key={item.title} item={item} pathname={pathname} />
							))}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter className="border-t border-sidebar-border/60 p-2">
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
