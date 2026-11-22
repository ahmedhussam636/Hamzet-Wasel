"use client";

import { useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useUserProfile } from "@/components/user-profile-provider";
import { cn } from "@/lib/utils";
import {
	ChevronsUpDownIcon,
	HistoryIcon,
	LogOutIcon,
	ShieldCheckIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "U";
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function NavUser() {
	const { user, signOut } = useUserProfile();
	const { setOpenMobile } = useSidebar();
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

	const initials = getInitials(user.name);

	const navigate = (hash: string) => {
		window.location.hash = hash;
		setOpenMobile(false);
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger
							nativeButton={true}
							render={
								<SidebarMenuButton
									size="lg"
									aria-label={`Account menu for ${user.name}`}
									className="w-full cursor-pointer data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
								/>
							}
						>
							<div className="relative shrink-0">
								<Avatar className="size-8 rounded-lg border border-border/70">
									<AvatarImage
										src={user.avatar || undefined}
										alt={user.name}
										referrerPolicy="no-referrer"
									/>
									<AvatarFallback className="rounded-lg text-xs font-medium">
										{initials}
									</AvatarFallback>
								</Avatar>
								<span
									aria-hidden="true"
									className={cn(
										"absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-sidebar",
										user.status === "online"
											? "bg-emerald-500"
											: user.status === "away"
												? "bg-amber-500"
												: "bg-rose-500"
									)}
								/>
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs text-muted-foreground">
									{user.email}
								</span>
							</div>
							<ChevronsUpDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							side="top"
							align="start"
							sideOffset={8}
							className="w-(--anchor-width) min-w-56 rounded-lg"
						>
							<DropdownMenuGroup>
								<DropdownMenuLabel className="pointer-events-none flex items-center gap-2.5 py-2">
									<Avatar className="isolate size-8 shrink-0 rounded-lg border border-border/70">
										<AvatarImage
											src={user.avatar || undefined}
											alt={user.name}
											referrerPolicy="no-referrer"
										/>
										<AvatarFallback className="rounded-lg text-xs font-medium">
											{initials}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 flex-1">
										<div className="truncate font-medium text-foreground text-sm">
											{user.name}
										</div>
										<div className="truncate text-muted-foreground text-xs font-normal">
											{user.email}
										</div>
									</div>
								</DropdownMenuLabel>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={() => navigate("#/account")}>
									<UserIcon />
									My Profile
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate("#/workspace")}>
									<UsersIcon />
									Workspace & Team
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate("#/security")}>
									<ShieldCheckIcon />
									Security & Sessions
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate("#/activity")}>
									<HistoryIcon />
									Activity Log
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => setLogoutDialogOpen(true)}
								>
									<LogOutIcon />
									Log out
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>

			<AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Sign out of Hamzet Wasel?</AlertDialogTitle>
						<AlertDialogDescription>
							Your local workspace drafts and preferences remain saved on this browser. You can sign back in at any time.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								setLogoutDialogOpen(false);
								setOpenMobile(false);
								signOut();
							}}
						>
							Log out
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
