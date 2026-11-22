"use client";
import { CardContent } from "@/components/ui/card";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { StatusIndicator } from "@/components/indicator";
import { SettingField } from "@/components/settings-field";
import { SettingsSection } from "@/components/settings-section";

const statuses = [
	{ value: "online", label: "Online", color: "emerald" },
	{ value: "away", label: "Away", color: "amber" },
	{ value: "offline", label: "Offline", color: "rose" },
] as const;

export function AvailabilitySettings() {
	return (
		<SettingsSection
			description="When and how much work gets routed to you."
			title="Availability"
		>
			<CardContent className="flex-1 px-0 py-(--card-spacing)">
				<FieldGroup className="gap-5">
					<SettingField
						description="Shown to teammates in the queue."
						htmlFor="status"
						label="Status"
					>
						<ToggleGroup
							aria-label="Status"
							defaultValue={["online"]}
							id="status"
							variant="outline"
						>
							{statuses.map((status) => (
								<ToggleGroupItem key={status.value} value={status.value}>
									<StatusIndicator color={status.color} pulse={false} />
									{status.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</SettingField>
					<FieldSeparator />
					<SettingField
						description="Outside these hours you're set to away."
						htmlFor="hours-start"
						label="Working hours"
					>
						<div className="flex items-center gap-2">
							<Input
								aria-label="Start time"
								className="w-32"
								defaultValue="09:00"
								id="hours-start"
								type="time"
							/>
							<span className="text-muted-foreground text-xs">to</span>
							<Input
								aria-label="End time"
								className="w-32"
								defaultValue="17:00"
								type="time"
							/>
						</div>
					</SettingField>

					<FieldSeparator />
					<SettingField
						description="Assign new threads to you automatically."
						htmlFor="auto-assign"
						label="Auto-assign"
						orientation="horizontal"
					>
						<Switch defaultChecked id="auto-assign" />
					</SettingField>
				</FieldGroup>
			</CardContent>
		</SettingsSection>
	);
}
