import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { SettingField } from "@/components/settings-field";
import { SettingsSection } from "@/components/settings-section";

export function DangerSettings() {
	return (
		<SettingsSection
			className="lg:col-span-4"
			description="Irreversible and destructive actions."
			title="Danger zone"
		>
			<CardContent className="flex-1 px-0 py-(--card-spacing)">
				<FieldGroup className="gap-5">
					<SettingField
						description="End every signed-in session except this one."
						htmlFor="sign-out-sessions"
						label="Sessions"
						orientation="horizontal"
					>
						<Button
							id="sign-out-sessions"
							size="sm"
							type="button"
							variant="outline"
						>
							Sign out all
						</Button>
					</SettingField>
					<FieldSeparator />
					<SettingField
						description="Remove your account and assigned threads."
						htmlFor="delete-account"
						label="Delete account"
						orientation="horizontal"
					>
						<AlertDialog>
							<AlertDialogTrigger render={<Button id="delete-account" size="sm" type="button" variant="destructive" />}>Delete
                            								</AlertDialogTrigger>
							<AlertDialogContent size="sm">
								<AlertDialogHeader>
									<AlertDialogTitle>Delete your account?</AlertDialogTitle>
									<AlertDialogDescription>
										This permanently removes your profile, open conversations
										assigned to you, and notification preferences. This cannot
										be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction variant="destructive">
										Delete account
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</SettingField>
				</FieldGroup>
			</CardContent>
		</SettingsSection>
	);
}
