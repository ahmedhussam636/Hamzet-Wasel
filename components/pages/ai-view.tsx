"use client";

import { BlockMessage } from "@/components/dashboardblocks/block-state";
import {
	PageHeader,
	PageHeaderHeading,
	PageHeaderRow,
} from "@/components/dashboardblocks/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BotIcon } from "lucide-react";

export function AIView() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader>
				<PageHeaderRow>
					<PageHeaderHeading
						title="AI"
						description="Automated assistants, copilot rules, and model connections for your workspace."
					/>
				</PageHeaderRow>
			</PageHeader>

			<Card className="dark:bg-transparent">
				<CardContent className="flex min-h-[380px] items-center justify-center p-6">
					<BlockMessage
						icon={<BotIcon />}
						title="No AI workflows configured"
						description="Your workspace doesn't have any active AI assistants or automated prompt pipelines yet."
						action={
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									window.location.hash = "#/integrations";
								}}
							>
								Browse integrations
							</Button>
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

export default AIView;
