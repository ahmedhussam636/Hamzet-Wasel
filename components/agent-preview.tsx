import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { StatusIndicator } from "@/components/indicator";

const stats = [
	{ label: "CSAT", value: "94%" },
	{ label: "Assigned", value: "6" },
	{ label: "Reply", value: "4.1m" },
] as const;

export function AgentPreview() {
	return (
		<Card className="h-full gap-0 shadow-none dark:ring-0">
			<CardHeader>
				<Badge variant="secondary">Public Preview</Badge>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col items-start justify-center px-(--card-spacing) py-8">
				<Avatar className="size-20">
					<AvatarImage alt="" src="https://github.com/shabanhr.png" />
					<AvatarFallback>SH</AvatarFallback>
				</Avatar>
				<p className="mt-4 text-balance font-heading font-medium text-xl">
					Shaban Haider
				</p>
				<p className="mt-1 text-pretty text-muted-foreground text-sm">
					Support lead · Karachi
				</p>
				<div className="mt-3 flex items-center gap-1.5 text-xs">
					<StatusIndicator color="emerald" />
					<span>Online</span>
					<span className="truncate text-muted-foreground">
						· typically replies in 4.1m
					</span>
				</div>
				{/* <blockquote className="mt-6 w-full text-pretty rounded-lg border bg-muted/40 p-3 text-left text-sm">
					Hi, I&apos;m Shaban. I&apos;ll take it from here.
				</blockquote> */}
			</CardContent>
			<CardFooter className="grid w-full grid-cols-3 divide-x border-t">
				{stats.map((stat) => (
					<div className="flex flex-col gap-1 ps-4" key={stat.label}>
						<p className="text-[10px] text-mono text-muted-foreground">
							{stat.label}
						</p>
						<p className="font-medium text-sm tabular-nums">{stat.value}</p>
					</div>
				))}
			</CardFooter>
		</Card>
	);
}
