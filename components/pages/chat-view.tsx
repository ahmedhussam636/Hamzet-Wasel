"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardEmptyState } from "@/components/dashboard-state";
import { MessageSquareIcon } from "lucide-react";

export function ChatView() {
  return (
    <div className="flex flex-col gap-5">
      <Card className="dark:bg-transparent border-border/60">
        <CardContent className="flex min-h-[420px] items-center justify-center p-6">
          <DashboardEmptyState
            icon={<MessageSquareIcon />}
            title="No conversations yet"
            description="Your team chat is currently empty. Channels and direct messages will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ChatView;
