import { cn } from "@/lib/utils";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function SettingsSection({
	title,
	description,
	children,
	className,
	...props
}: Omit<React.ComponentProps<typeof Card>, "title"> & {
	title: string;
	description: string;
}) {
	return (
		<Card
			className={cn("gap-0 pb-0 shadow-none dark:ring-0", className)}
			{...props}
		>
			<CardHeader className="border-b">
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			{children}
		</Card>
	);
}
