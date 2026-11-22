import { cn } from "@/lib/utils";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
} from "@/components/ui/field";

export function SettingField({
	label,
	description,
	htmlFor,
	children,
	className,
	...props
}: React.ComponentProps<typeof Field> & {
	label: string;
	description: string;
	htmlFor: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Field
			className={cn(
				"px-(--card-spacing) @md/field-group:has-[>[data-slot=field-content]]:items-center",
				className
			)}
			orientation="responsive"
			{...props}
		>
			<FieldContent>
				<FieldLabel className="font-normal" htmlFor={htmlFor}>
					{label}
				</FieldLabel>
				<FieldDescription className="text-xs">{description}</FieldDescription>
			</FieldContent>
			<FieldContent className="items-end">{children}</FieldContent>
		</Field>
	);
}
