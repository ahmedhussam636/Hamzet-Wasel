import { AudienceSegment, MetricStat } from "./types";

export const initialSegments: AudienceSegment[] = [
  {
    id: "seg-1",
    name: "Power Users (Daily Active)",
    description: "Users who log in at least 5 days a week and trigger 50+ actions per session.",
    criteria: "sessions >= 20/mo AND actions_per_session > 50",
    usersCount: 14850,
    growth: "+18.2%",
    lastUpdated: "10m ago",
    badgeColor: "emerald",
  },
  {
    id: "seg-2",
    name: "MENA & Arab Region Users",
    description: "High-engagement enterprise and consumer accounts located across Egypt, Saudi Arabia, UAE, and Qatar.",
    criteria: "country_code IN ['EG', 'SA', 'AE', 'QA', 'KW']",
    usersCount: 9950,
    growth: "+26.4%",
    lastUpdated: "25m ago",
    badgeColor: "sky",
  },
  {
    id: "seg-3",
    name: "Enterprise Plan Leads",
    description: "Workspaces with 10+ team members on trial or free tier approaching upgrade limits.",
    criteria: "team_members >= 10 AND plan == 'Free' AND days_active >= 14",
    usersCount: 4210,
    growth: "+12.8%",
    lastUpdated: "1h ago",
    badgeColor: "indigo",
  },
  {
    id: "seg-4",
    name: "At-Risk Churn Segment",
    description: "Subscribed customers whose activity dropped by more than 60% in the last 14 days.",
    criteria: "paid_status == true AND activity_drop >= 60% AND days_inactive >= 10",
    usersCount: 840,
    growth: "-4.2%",
    lastUpdated: "2h ago",
    badgeColor: "rose",
  },
  {
    id: "seg-5",
    name: "New Signups (Last 7 Days)",
    description: "Recently onboarded users undergoing initial setup and product discovery.",
    criteria: "signup_date >= now() - 7d",
    usersCount: 7620,
    growth: "+21.5%",
    lastUpdated: "5m ago",
    badgeColor: "amber",
  },
];

export const segmentMetrics: MetricStat[] = [
  { title: "Total Segmented Users", value: "37,470", change: "+15.8%", trend: "up", description: "across 5 active segments" },
  { title: "Fastest Growing", value: "MENA Region", change: "+26.4%", trend: "up", description: "highest regional momentum" },
  { title: "At-Risk Recoveries", value: "68.2%", change: "+5.1%", trend: "up", description: "re-engaged via campaigns" },
  { title: "Avg. Segment Value", value: "$184 / mo", change: "+9.2%", trend: "up", description: "blended ARPU" },
];
