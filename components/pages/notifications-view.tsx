"use client";

import { useState } from "react";
import { BackendBanner } from "@/components/backend-banner";
import { ActivityFeed3, type Notification } from "@/components/dashboardblocks/activity-feed/activity-feed-03";
import { initialNotifications } from "@/src/metadata/notifications-data";
import { API_ENDPOINTS } from "@/src/metadata/endpoints";
import {
  DashboardBusy,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";

export function NotificationsView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const handleRead = (readIds: string[]) => {
    setNotifications((prev) =>
      prev.map((item) => (readIds.includes(item.id) ? { ...item, read: true } : item))
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Backend Integration Banner */}
      <BackendBanner
        endpoint={API_ENDPOINTS.notifications.list}
        method="GET"
        description="User notifications, activity mentions, and system alerts stream."
        schemaExample={initialNotifications.slice(0, 2)}
      />

      <DashboardBusy refreshing={state.refreshing} label="Updating notifications">
        <ActivityFeed3
          title="Notifications & Activity Feed"
          now={new Date()}
          notifications={state.isEmpty ? [] : notifications}
          onRead={handleRead}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </DashboardBusy>
    </div>
  );
}

export default NotificationsView;
