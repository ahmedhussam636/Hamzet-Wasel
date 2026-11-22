import { Fragment } from "react";
import { CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { SettingField } from "@/components/settings-field";
import { SettingsSection } from "@/components/settings-section";

const methods = ["Email", "Push", "Desktop"] as const;

type Method = (typeof methods)[number];

const events: {
	id: string;
	label: string;
	description: string;
	enabled: Method[];
}[] = [
	{
		id: "assigned",
		label: "Conversation assigned",
		description: "A thread is routed to you.",
		enabled: ["Email", "Push", "Desktop"],
	},
	{
		id: "reply",
		label: "Customer replied",
		description: "New message on your open threads.",
		enabled: ["Push", "Desktop"],
	},
	{
		id: "mention",
		label: "Mentioned",
		description: "A teammate @mentions you in a note.",
		enabled: ["Email", "Push"],
	},
	{
		id: "sla",
		label: "SLA at risk",
		description: "A reply is due in under 15 minutes.",
		enabled: ["Email", "Push", "Desktop"],
	},
];

export function NotificationSettings() {
	return (
		<SettingsSection
			description="Pick how you hear about each event."
			title="Notifications"
		>
			<CardContent className="flex-1 px-0 py-(--card-spacing)">
				<FieldGroup className="gap-5">
					<div className="flex justify-end px-(--card-spacing)">
						<div className="grid w-56 grid-cols-3 justify-items-center gap-2">
							{methods.map((method) => (
								<span className="text-muted-foreground text-xs" key={method}>
									{method}
								</span>
							))}
						</div>
					</div>
					{events.map((event, index) => (
						<Fragment key={event.id}>
							{index > 0 && <FieldSeparator />}
							<SettingField
								description={event.description}
								htmlFor={`${event.id}-email`}
								label={event.label}
							>
								<div className="grid w-56 grid-cols-3 justify-items-center gap-2">
									{methods.map((method) => (
										<Checkbox
											aria-label={`${event.label} via ${method}`}
											defaultChecked={event.enabled.includes(method)}
											id={`${event.id}-${method.toLowerCase()}`}
											key={method}
										/>
									))}
								</div>
							</SettingField>
						</Fragment>
					))}
				</FieldGroup>
			</CardContent>
		</SettingsSection>
	);
}
