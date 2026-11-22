"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import {
	CommandMenu,
	CommandMenuTrigger,
	type CommandMenuGroup,
} from "@/components/dashboardblocks/command-menu";
import { accountPages, navGroups } from "@/components/app-shared";
import { useTheme } from "@/components/theme-provider";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useSidebar } from "@/components/ui/sidebar";
import { KeyboardIcon, PanelLeftIcon, SunMoonIcon } from "lucide-react";

const PAGE_SHORTCUTS: Record<string, { chord: string; key: string; label: string }> = {
	"#/overview": { chord: "G D", key: "d", label: "Dashboard" },
	"#/kanban": { chord: "G K", key: "k", label: "Kanban" },
	"#/calendar": { chord: "G L", key: "l", label: "Calendar" },
	"#/devops": { chord: "G V", key: "v", label: "DevOps" },
	"#/mail": { chord: "G M", key: "m", label: "Mail" },
	"#/chat": { chord: "G H", key: "h", label: "Chat" },
	"#/ai": { chord: "G N", key: "n", label: "AI" },
	"#/events": { chord: "G E", key: "e", label: "Live Events" },
	"#/funnels": { chord: "G F", key: "f", label: "Funnels" },
	"#/flows": { chord: "G W", key: "w", label: "User Flows" },
	"#/retention": { chord: "G R", key: "r", label: "Retention" },
	"#/customers": { chord: "G C", key: "c", label: "Customers" },
	"#/segments": { chord: "G S", key: "s", label: "Segments" },
	"#/cohorts": { chord: "G O", key: "o", label: "Cohorts" },
	"#/profiles": { chord: "G P", key: "p", label: "Profiles" },
	"#/integrations": { chord: "G I", key: "i", label: "Integrations" },
	"#/settings": { chord: "G ,", key: ",", label: "Settings" },
	"#/account": { chord: "G A", key: "a", label: "My Profile" },
	"#/workspace": { chord: "G T", key: "t", label: "Workspace & Team" },
	"#/security": { chord: "G Y", key: "y", label: "Security & Sessions" },
	"#/activity": { chord: "G U", key: "u", label: "Activity Log" },
};

const CHORD_TO_ROUTE = Object.fromEntries(
	Object.entries(PAGE_SHORTCUTS).map(([path, info]) => [info.key, path])
);

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if (target.isContentEditable) return true;
	return Boolean(target.closest('[contenteditable="true"], [role="textbox"]'));
}

interface GlobalCommandMenuContextValue {
	open: boolean;
	openMenu: () => void;
	setOpen: (open: boolean) => void;
	openShortcutsHelp: () => void;
}

const GlobalCommandMenuContext = createContext<GlobalCommandMenuContextValue | null>(
	null
);

export function useGlobalCommandMenu() {
	const ctx = useContext(GlobalCommandMenuContext);
	if (!ctx) {
		throw new Error(
			"useGlobalCommandMenu must be used inside GlobalCommandMenuProvider"
		);
	}
	return ctx;
}

export function GlobalCommandMenuProvider({
	children,
	pathname = "#/overview",
}: {
	children: ReactNode;
	pathname?: string;
}) {
	const [open, setOpen] = useState(false);
	const [shortcutsOpen, setShortcutsOpen] = useState(false);
	const { setOpenMobile, toggleSidebar } = useSidebar();
	const { resolvedTheme, setTheme } = useTheme();
	const awaitingChordRef = useRef(false);
	const chordTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const openMenu = useCallback(() => {
		setShortcutsOpen(false);
		setOpen(true);
	}, []);

	const openShortcutsHelp = useCallback(() => {
		setOpen(false);
		setShortcutsOpen(true);
	}, []);

	const navigateTo = useCallback(
		(href: string) => {
			window.location.hash = href;
			setOpen(false);
			setOpenMobile(false);
		},
		[setOpenMobile]
	);

	useEffect(() => {
		const clearChord = () => {
			awaitingChordRef.current = false;
			if (chordTimerRef.current) {
				clearTimeout(chordTimerRef.current);
				chordTimerRef.current = undefined;
			}
		};

		const onKeyDown = (event: KeyboardEvent) => {
			const key = event.key?.toLowerCase();
			if (!key) return;

			// Global Cmd+K / Ctrl+K toggles the command menu from any view or field
			if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key === "k") {
				event.preventDefault();
				clearChord();
				setShortcutsOpen(false);
				setOpen((prev) => !prev);
				return;
			}

			// Bare single-key & chord shortcuts only fire outside editable fields & open modals
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (isEditableTarget(event.target)) return;
			if (open || shortcutsOpen) return;
			if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

			if (awaitingChordRef.current) {
				const targetRoute = CHORD_TO_ROUTE[key];
				clearChord();
				if (targetRoute) {
					event.preventDefault();
					navigateTo(targetRoute);
				}
				return;
			}

			if (key === "/") {
				event.preventDefault();
				openMenu();
				return;
			}

			if (event.key === "?") {
				event.preventDefault();
				openShortcutsHelp();
				return;
			}

			if (key === "g" && !event.shiftKey) {
				awaitingChordRef.current = true;
				chordTimerRef.current = setTimeout(clearChord, 900);
			}
		};

		window.addEventListener("keydown", onKeyDown, { capture: true });
		return () => {
			clearChord();
			window.removeEventListener("keydown", onKeyDown, { capture: true });
		};
	}, [navigateTo, open, openMenu, openShortcutsHelp, shortcutsOpen]);

	const groups: CommandMenuGroup[] = useMemo(() => {
		const pageItems = navGroups.flatMap((group) =>
			group.items.flatMap((item) => {
				if (item.subItems?.length) {
					return item.subItems
						.filter((sub) => Boolean(sub.path))
						.map((sub) => {
							const path = sub.path!;
							const shortcutInfo = PAGE_SHORTCUTS[path];
							return {
								description: `${group.label} · ${item.title}`,
								href: path,
								icon: sub.icon,
								id: `nav-${path}`,
								keywords: [group.label, item.title, sub.title, path.replace("#/", "")],
								label: sub.title,
								meta: pathname === path ? "Current" : undefined,
								shortcut: shortcutInfo?.chord,
							};
						});
				}
				if (!item.path) return [];
				const path = item.path;
				const shortcutInfo = PAGE_SHORTCUTS[path];
				return [
					{
						description: group.label,
						href: path,
						icon: item.icon,
						id: `nav-${path}`,
						keywords: [group.label, item.title, path.replace("#/", "")],
						label: item.title,
						meta: pathname === path ? "Current" : undefined,
						shortcut: shortcutInfo?.chord,
					},
				];
			})
		);

		const accountItems = accountPages.map((page) => {
			const path = page.path!;
			const shortcutInfo = PAGE_SHORTCUTS[path];
			return {
				description: "Account & Workspace",
				href: path,
				icon: page.icon,
				id: `account-${path}`,
				keywords: ["account", "profile", page.title, path.replace("#/", "")],
				label: page.title,
				meta: pathname === path ? "Current" : undefined,
				shortcut: shortcutInfo?.chord,
			};
		});

		return [
			{
				heading: "Pages",
				items: pageItems,
			},
			{
				heading: "Account",
				items: accountItems,
			},
			{
				heading: "Workspace actions",
				items: [
					{
						id: "action-toggle-theme",
						icon: <SunMoonIcon />,
						keywords: ["theme", "dark", "light", "appearance", "mode"],
						label:
							resolvedTheme === "dark"
								? "Switch to light theme"
								: "Switch to dark theme",
						onSelect: () => {
							setTheme(resolvedTheme === "dark" ? "light" : "dark");
							setOpenMobile(false);
						},
					},
					{
						id: "action-toggle-sidebar",
						icon: <PanelLeftIcon />,
						keywords: ["sidebar", "navigation", "collapse", "expand"],
						label: "Toggle navigation sidebar",
						shortcut: "⌘B",
						onSelect: () => {
							toggleSidebar();
						},
					},
					{
						id: "action-keyboard-shortcuts",
						icon: <KeyboardIcon />,
						keywords: ["help", "keys", "hotkeys", "cheatsheet"],
						label: "View keyboard shortcuts",
						shortcut: "?",
						onSelect: () => {
							setShortcutsOpen(true);
						},
					},
				],
			},
		];
	}, [pathname, resolvedTheme, setOpenMobile, setTheme, toggleSidebar]);

	const value = useMemo(
		() => ({
			open,
			openMenu,
			setOpen,
			openShortcutsHelp,
		}),
		[open, openMenu, openShortcutsHelp]
	);

	return (
		<GlobalCommandMenuContext.Provider value={value}>
			{children}
			<CommandMenu
				emptyMessage="No matching pages or actions found."
				groups={groups}
				onNavigate={navigateTo}
				onOpenChange={setOpen}
				open={open}
				placeholder="Jump to any page or run an action..."
				title="Command menu"
			/>
			<Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Keyboard shortcuts</DialogTitle>
						<DialogDescription>
							Navigate across Hamzet Wasel views without leaving the keyboard.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-5 border-t pt-4 text-sm">
						<div className="flex flex-col gap-2">
							<h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
								General
							</h3>
							<div className="grid gap-2">
								<div className="flex items-center justify-between gap-4">
									<span>Open / close command menu</span>
									<KbdGroup>
										<Kbd>⌘K</Kbd>
										<span className="text-muted-foreground text-xs">/</span>
										<Kbd>Ctrl+K</Kbd>
									</KbdGroup>
								</div>
								<div className="flex items-center justify-between gap-4">
									<span>Quick search</span>
									<Kbd>/</Kbd>
								</div>
								<div className="flex items-center justify-between gap-4">
									<span>Toggle navigation sidebar</span>
									<KbdGroup>
										<Kbd>⌘B</Kbd>
										<span className="text-muted-foreground text-xs">/</span>
										<Kbd>Ctrl+B</Kbd>
									</KbdGroup>
								</div>
								<div className="flex items-center justify-between gap-4">
									<span>Keyboard shortcuts</span>
									<Kbd>?</Kbd>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
								Go to page (press G then key)
							</h3>
							<div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
								{Object.values(PAGE_SHORTCUTS).map((item) => (
									<div
										key={item.chord}
										className="flex items-center justify-between gap-2 text-xs"
									>
										<span className="text-muted-foreground truncate">
											{item.label}
										</span>
										<KbdGroup className="shrink-0">
											<Kbd>G</Kbd>
											<Kbd>{item.key.toUpperCase()}</Kbd>
										</KbdGroup>
									</div>
								))}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</GlobalCommandMenuContext.Provider>
	);
}

export function AppSearch({
	className,
	placeholder = "Search...",
	shortcut = "⌘K",
}: {
	className?: string;
	placeholder?: string;
	shortcut?: string | null;
}) {
	const { openMenu } = useGlobalCommandMenu();
	return (
		<CommandMenuTrigger
			className={
				className ??
				"w-full sm:w-full justify-start text-muted-foreground font-normal bg-background/60"
			}
			onClick={openMenu}
			placeholder={placeholder}
			shortcut={shortcut}
		/>
	);
}
