"use client";
import { useEffect, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { SettingField } from "@/components/settings-field";
import { SettingsSection } from "@/components/settings-section";

const defaultSrc = "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png";

export function ProfileSettings() {
	return (
		<SettingsSection
			description="How you appear to teammates and customers."
			title="Profile"
		>
			<CardContent className="flex-1 px-0 py-(--card-spacing)">
				<FieldGroup className="gap-5">
					<SettingField
						className="[&>[data-slot=field-content]:last-child]:w-full"
						description="Click to upload a square image, at least 256px."
						htmlFor="avatar"
						label="Your Avatar"
						orientation="horizontal"
					>
						<SettingsAvatar />
					</SettingField>
					<FieldSeparator />
					<SettingField
						description="Used in comments, invoices, and the sidebar."
						htmlFor="display-name"
						label="Display name"
					>
						<Input
							autoComplete="name"
							defaultValue="Ahmed Steet"
							id="display-name"
						/>
					</SettingField>
					<FieldSeparator />
					<SettingField
						description="Sign-in and billing receipts go here."
						htmlFor="email"
						label="Primary Email"
					>
						<Input
							autoComplete="email"
							defaultValue="ahmedsteet600@gmail.com"
							id="email"
							type="email"
						/>
					</SettingField>
				</FieldGroup>
			</CardContent>
			<CardFooter className="justify-end gap-2 border-t">
				<Button type="button" variant="ghost">
					Cancel
				</Button>
				<Button type="button">Save changes</Button>
			</CardFooter>
		</SettingsSection>
	);
}

function SettingsAvatar() {
	const [src, setSrc] = useState(defaultSrc);

	useEffect(() => {
		if (!src.startsWith("blob:")) {
			return;
		}
		return () => URL.revokeObjectURL(src);
	}, [src]);

	return (
		<div className="flex w-full items-center justify-between gap-4">
			<Avatar className="size-16">
				<AvatarImage alt="" src={src} />
				<AvatarFallback></AvatarFallback>
			</Avatar>
			<div className="flex items-center">
				<Button
					className="text-destructive"
					disabled={!src}
					onClick={() => setSrc("")}
					type="button"
					variant="link"
				>
					Delete
				</Button>
				<Button variant="link" render={<label className="cursor-pointer" htmlFor="avatar" />} nativeButton={false}>Update
                						<input
                							accept="image/*"
                							className="sr-only"
                							id="avatar"
                							onChange={(event) => {
                								const file = event.target.files?.[0];
                								if (!file) {
                									return;
                								}
                								setSrc(URL.createObjectURL(file));
                							}}
                							type="file"
                						/></Button>
			</div>
		</div>
	);
}
