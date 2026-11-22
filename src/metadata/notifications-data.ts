import type { Notification } from "@/components/dashboardblocks/activity-feed/activity-feed-03";

const NOW = new Date();
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

export const initialNotifications: Notification[] = [
  {
    action: "mentioned you in",
    actor: {
      name: "Ahmed Mostafa",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    },
    at: minutesAgo(4),
    id: "notif-1",
    mention: true,
    preview: "Can you verify the regional telemetry data for Cairo and Riyadh before deployment?",
    target: "MENA Traffic Report",
    read: false,
  },
  {
    action: "assigned you to review",
    actor: {
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    at: minutesAgo(24),
    id: "notif-2",
    target: "Backend API endpoints schema",
    preview: "Added new active users endpoint /api/dashboard/active-countries.",
    read: false,
  },
  {
    action: "upgraded their subscription to",
    actor: {
      name: "Omar Al-Fassi",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
    },
    at: minutesAgo(58),
    id: "notif-3",
    target: "Enterprise Annual Plan",
    preview: "Payment of $1,200 confirmed via Stripe gateway.",
    read: false,
  },
  {
    action: "replied to your comment on",
    actor: {
      name: "Felix Weber",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    at: minutesAgo(140),
    id: "notif-4",
    mention: true,
    preview: "Updated the DotMap legend and heat color scale in geo-03.",
    target: "Active Users Map",
    read: true,
  },
  {
    action: "deployed a new version to",
    actor: {
      name: "Engineering Bot",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
    },
    at: minutesAgo(360),
    id: "notif-5",
    target: "Production Environment",
    read: true,
  },
];
