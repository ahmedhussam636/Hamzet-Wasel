"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardEmptyState } from "@/components/dashboard-state";
import { MailIcon } from "lucide-react";

export function MailView() {
  return (
    <div className="flex flex-col gap-5">
      <Card className="dark:bg-transparent border-border/60">
        <CardContent className="flex min-h-[420px] items-center justify-center p-6">
          <DashboardEmptyState
            icon={<MailIcon />}
            title="No messages yet"
            description="Your workspace inbox is currently empty. Incoming emails and threads will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default MailView;
