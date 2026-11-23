"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

export type UserPresenceStatus = "online" | "away" | "offline";

export interface UserProfile {
	name: string;
	email: string;
	avatar: string;
	role: string;
	location: string;
	timezone: string;
	bio: string;
	status: UserPresenceStatus;
	workingHoursStart: string;
	workingHoursEnd: string;
	autoAssign: boolean;
	signedOut: boolean;
}

export type ActivityCategory = "Account" | "Security" | "Team" | "Data";

export interface AccountActivityItem {
	id: string;
	timestamp: string;
	actor: string;
	category: ActivityCategory;
	action: string;
	target: string;
	location: string;
	ip: string;
	status: "Success" | "Warning";
}

const PROFILE_STORAGE_KEY = "hamzet-wasel-user-profile-v3";
const ACTIVITY_STORAGE_KEY = "hamzet-wasel-account-activity-v1";

export const DEFAULT_USER_PROFILE: UserProfile = {
	name: "Ahmed Steet",
	email: "ahmedsteet600@gmail.com",
	avatar: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png",
	role: "Web Developer & Customer Success Lead",
	location: "Cairo, Egypt",
	timezone: "Africa/Cairo (UTC+2)",
	bio: "Passionate web developer and customer success lead with a focus on creating seamless user experiences.",
	status: "online",
	workingHoursStart: "09:00",
	workingHoursEnd: "17:00",
	autoAssign: true,
	signedOut: false,
};

export const INITIAL_ACTIVITY_EVENTS: AccountActivityItem[] = [
	{
		id: "act-101",
		timestamp: "2026-11-20 13:42",
		actor: "Ahmed Steet",
		category: "Security",
		action: "Verified active session",
		target: "Chrome on macOS · Current browser",
		location: "Cairo, Egypt",
		ip: "197.48.112.19",
		status: "Success",
	},
	{
		id: "act-102",
		timestamp: "2026-11-20 11:18",
		actor: "Ahmed Steet",
		category: "Data",
		action: "Exported customer retention cohorts",
		target: "cohorts-q4-2026.csv",
		location: "Cairo, Egypt",
		ip: "197.48.112.19",
		status: "Success",
	},
	{
		id: "act-103",
		timestamp: "2026-11-19 17:05",
		actor: "Nour El-Din",
		category: "Team",
		action: "Updated workspace role",
		target: "Laila Mansour -> Analyst",
		location: "Riyadh, Saudi Arabia",
		ip: "86.51.140.82",
		status: "Success",
	},
	{
		id: "act-104",
		timestamp: "2026-11-19 09:34",
		actor: "Ahmed Steet",
		category: "Account",
		action: "Updated working availability hours",
		target: "09:00 – 17:00 (Africa/Cairo)",
		location: "Cairo, Egypt",
		ip: "197.48.112.19",
		status: "Success",
	},
	{
		id: "act-105",
		timestamp: "2026-11-18 22:14",
		actor: "System Guard",
		category: "Security",
		action: "Blocked unrecognized sign-in attempt",
		target: "API Token #tok_91a4",
		location: "Frankfurt, Germany",
		ip: "185.199.110.42",
		status: "Warning",
	},
	{
		id: "act-106",
		timestamp: "2026-11-18 15:27",
		actor: "Karim Hassan",
		category: "Team",
		action: "Invited new workspace member",
		target: "omar.farouk@hamzetwasel.com",
		location: "Dubai, UAE",
		ip: "94.200.51.104",
		status: "Success",
	},
	{
		id: "act-107",
		timestamp: "2026-11-17 16:40",
		actor: "Ahmed Steet",
		category: "Data",
		action: "Created behavioral segment",
		target: "High-Intent Trial Accounts",
		location: "Cairo, Egypt",
		ip: "197.48.112.19",
		status: "Success",
	},
];

interface UserProfileContextValue {
	user: UserProfile;
	activityEvents: AccountActivityItem[];
	updateProfile: (patch: Partial<UserProfile>) => void;
	resetProfile: () => void;
	signOut: () => void;
	signIn: () => void;
	logActivity: (entry: {
		category: ActivityCategory;
		action: string;
		target: string;
		status?: "Success" | "Warning";
	}) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

function formatNowTimestamp(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserProfile>(() => {
		if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
		try {
			const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
			if (!raw) return DEFAULT_USER_PROFILE;
			return { ...DEFAULT_USER_PROFILE, ...(JSON.parse(raw) as Partial<UserProfile>) };
		} catch {
			return DEFAULT_USER_PROFILE;
		}
	});

	const [activityEvents, setActivityEvents] = useState<AccountActivityItem[]>(() => {
		if (typeof window === "undefined") return INITIAL_ACTIVITY_EVENTS;
		try {
			const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
			if (!raw) return INITIAL_ACTIVITY_EVENTS;
			const parsed = JSON.parse(raw) as AccountActivityItem[];
			return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ACTIVITY_EVENTS;
		} catch {
			return INITIAL_ACTIVITY_EVENTS;
		}
	});

	useEffect(() => {
		try {
			window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(user));
		} catch {
			// Ignore storage quota errors
		}
	}, [user]);

	useEffect(() => {
		try {
			window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activityEvents));
		} catch {
			// Ignore storage quota errors
		}
	}, [activityEvents]);

	const logActivity = useCallback(
		(entry: {
			category: ActivityCategory;
			action: string;
			target: string;
			status?: "Success" | "Warning";
		}) => {
			setActivityEvents((prev) => [
				{
					id: `act-${Date.now()}`,
					timestamp: formatNowTimestamp(),
					actor: user.name,
					category: entry.category,
					action: entry.action,
					target: entry.target,
					location: user.location || "Cairo, Egypt",
					ip: "197.48.112.19",
					status: entry.status ?? "Success",
				},
				...prev.slice(0, 49),
			]);
		},
		[user.name, user.location]
	);

	const updateProfile = useCallback((patch: Partial<UserProfile>) => {
		setUser((prev) => ({ ...prev, ...patch }));
	}, []);

	const resetProfile = useCallback(() => {
		setUser(DEFAULT_USER_PROFILE);
	}, []);

	const signOut = useCallback(() => {
		setUser((prev) => ({ ...prev, signedOut: true }));
		logActivity({
			category: "Security",
			action: "Signed out of workspace",
			target: user.email,
		});
	}, [logActivity, user.email]);

	const signIn = useCallback(() => {
		setUser((prev) => ({ ...prev, signedOut: false }));
		logActivity({
			category: "Security",
			action: "Signed back in",
			target: user.email,
		});
	}, [logActivity, user.email]);

	return (
		<UserProfileContext.Provider
			value={{
				user,
				activityEvents,
				updateProfile,
				resetProfile,
				signOut,
				signIn,
				logActivity,
			}}
		>
			{children}
		</UserProfileContext.Provider>
	);
}

export function useUserProfile() {
	const ctx = useContext(UserProfileContext);
	if (!ctx) {
		throw new Error("useUserProfile must be used inside UserProfileProvider");
	}
	return ctx;
}
