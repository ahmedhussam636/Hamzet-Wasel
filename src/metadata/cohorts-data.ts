import { CohortItem, MetricStat } from "./types";

export const initialCohorts: CohortItem[] = [
  { id: "coh-1", name: "Google Organic Search Acquisition", channel: "Organic Search", userCount: 18450, avgLtv: "$480", retentionRate: "62.4%", status: "growing" },
  { id: "coh-2", name: "LinkedIn B2B Advertising", channel: "Paid Social", userCount: 9280, avgLtv: "$790", retentionRate: "68.9%", status: "growing" },
  { id: "coh-3", name: "Direct Word-of-Mouth & Brand", channel: "Direct Traffic", userCount: 14120, avgLtv: "$640", retentionRate: "74.1%", status: "stable" },
  { id: "coh-4", name: "Product Hunt & Launch Events", channel: "Referral Community", userCount: 6840, avgLtv: "$310", retentionRate: "48.2%", status: "stable" },
  { id: "coh-5", name: "Newsletter & Content Sponsorship", channel: "Email / Affiliate", userCount: 4210, avgLtv: "$520", retentionRate: "55.8%", status: "declining" },
];

export const cohortMetrics: MetricStat[] = [
  { title: "Highest LTV Channel", value: "LinkedIn B2B", change: "$790", trend: "up", description: "strongest enterprise tier" },
  { title: "Best Retention Rate", value: "Direct Traffic", change: "74.1%", trend: "up", description: "brand loyal customer base" },
  { title: "Blended Acquisition Cost", value: "$42 / user", change: "-12.5%", trend: "down", description: "lower acquisition cost" },
  { title: "Active Tracked Cohorts", value: "28 cohorts", change: "+4 new", trend: "up", description: "across all acquisition funnels" },
];
