import { LiveEventItem, MetricStat } from "./types";

export const initialEvents: LiveEventItem[] = [
  {
    id: "evt-901",
    eventName: "subscription_renewed",
    user: { name: "Ahmed Mostafa", email: "ahmed.m@tech.eg", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", countryCode: "EG" },
    path: "/billing/subscription",
    timestamp: "Just now",
    properties: { plan: "Enterprise Annual", amount: "$1,200", currency: "USD" },
    status: "success",
  },
  {
    id: "evt-902",
    eventName: "checkout_completed",
    user: { name: "Sarah Jenkins", email: "sarah.j@acme.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", countryCode: "US" },
    path: "/checkout/success",
    timestamp: "45s ago",
    properties: { items: 3, cartTotal: "$240", gateway: "Stripe" },
    status: "success",
  },
  {
    id: "evt-903",
    eventName: "workspace_created",
    user: { name: "Omar Al-Fassi", email: "omar@riyadhventures.sa", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop", countryCode: "SA" },
    path: "/onboarding/workspace",
    timestamp: "2m ago",
    properties: { members: 8, tier: "Pro", domain: "riyadhventures.sa" },
    status: "success",
  },
  {
    id: "evt-904",
    eventName: "api_key_generated",
    user: { name: "Felix Weber", email: "felix.w@berlin-tech.de", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", countryCode: "DE" },
    path: "/settings/api-tokens",
    timestamp: "4m ago",
    properties: { scope: "read:write", rateLimit: "1000/min" },
    status: "success",
  },
  {
    id: "evt-905",
    eventName: "user_signup",
    user: { name: "Yuki Tanaka", email: "yuki@tokyolab.jp", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", countryCode: "JP" },
    path: "/auth/register",
    timestamp: "6m ago",
    properties: { referral: "google_search", device: "Desktop MacOS" },
    status: "success",
  },
  {
    id: "evt-906",
    eventName: "report_exported",
    user: { name: "Elena Rostova", email: "elena@analytics.co.uk", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop", countryCode: "GB" },
    path: "/reports/retention-cohort",
    timestamp: "8m ago",
    properties: { format: "CSV", records: 48500 },
    status: "success",
  },
  {
    id: "evt-907",
    eventName: "webhook_delivery_failed",
    user: { name: "Webhook Service", email: "system@internal.bot", avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop", countryCode: "US" },
    path: "/api/v1/webhooks/slack",
    timestamp: "11m ago",
    properties: { endpoint: "https://hooks.slack.com/services/...", retryCount: 3, error: "HTTP 504 Gateway Timeout" },
    status: "failed",
  },
];

export const eventStats: MetricStat[] = [
  { title: "Events Processed", value: "1,248,930", change: "+18.4%", trend: "up", description: "last 24 hours" },
  { title: "Average Rate", value: "842 / sec", change: "+5.1%", trend: "up", description: "throughput rate" },
  { title: "Unique Active Users", value: "34,120", change: "+11.3%", trend: "up", description: "triggered events" },
  { title: "Delivery Error Rate", value: "0.04%", change: "-0.01%", trend: "down", description: "within SLA limits" },
];
