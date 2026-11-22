"use client";

import { useState } from "react";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ActivityFeed3, type Notification } from "@/components/dashboardblocks/activity-feed/activity-feed-03";
import { initialNotifications } from "@/src/metadata/notifications-data";
import { BellIcon } from "lucide-react";

export function NotificationsSheet() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRead = (readIds: string[]) => {
    setNotifications((prev) =>
      prev.map((item) => (readIds.includes(item.id) ? { ...item, read: true } : item))
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        nativeButton={true}
        render={
          <Button
            aria-label="Notifications"
            size="icon-sm"
            variant="outline"
            className="relative cursor-pointer"
          >
            <BellIcon className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 font-mono text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto bg-background">
        <SheetTitle className="sr-only">Notifications</SheetTitle>
        <SheetDescription className="sr-only">Recent activity and notification feed</SheetDescription>
        <div className="p-4 pt-10">
          <ActivityFeed3
            title="Notifications"
            now={new Date()}
            notifications={notifications}
            onRead={handleRead}
            className="border-0 shadow-none bg-transparent"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationsSheet;
