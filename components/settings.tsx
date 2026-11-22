import { AgentPreview } from "@/components/agent-preview";
import { AvailabilitySettings } from "@/components/availability-settings";
import { DangerSettings } from "@/components/danger-settings";
import { NotificationSettings } from "@/components/notification-settings";
import { ProfileSettings } from "@/components/profile-settings";

export function Settings() {
	return (
		<div className="flex w-full flex-col gap-4">
			<div className="grid w-full gap-4 lg:grid-cols-2 xl:grid-cols-[.3fr_1fr]">
				<AgentPreview />
				<ProfileSettings />
			</div>
			<div className="grid w-full gap-4 xl:grid-cols-2">
				<AvailabilitySettings />
				<NotificationSettings />
			</div>
			<DangerSettings />
		</div>
	);
}
