import { RetentionCohort, MetricStat } from "./types";

export const initialRetentionCohorts: RetentionCohort[] = [
  { cohortDate: "Oct 06 - Oct 12", totalUsers: 3420, day0: 100, day1: 78.4, day3: 65.2, day7: 54.8, day14: 48.2, day30: 42.1 },
  { cohortDate: "Oct 13 - Oct 19", totalUsers: 3890, day0: 100, day1: 81.2, day3: 68.7, day7: 58.1, day14: 51.4, day30: 45.6 },
  { cohortDate: "Oct 20 - Oct 26", totalUsers: 4120, day0: 100, day1: 83.5, day3: 71.3, day7: 61.2, day14: 54.8, day30: 48.9 },
  { cohortDate: "Oct 27 - Nov 02", totalUsers: 4560, day0: 100, day1: 85.1, day3: 73.9, day7: 64.5, day14: 57.2, day30: 51.3 },
  { cohortDate: "Nov 03 - Nov 09", totalUsers: 4820, day0: 100, day1: 86.8, day3: 75.4, day7: 66.8, day14: 59.5, day30: 53.8 },
];

export const retentionMetrics: MetricStat[] = [
  { title: "Day 1 Retention", value: "86.8%", change: "+5.6%", trend: "up", description: "current weekly cohort" },
  { title: "Day 7 Retention", value: "66.8%", change: "+4.1%", trend: "up", description: "strong habit formation" },
  { title: "Day 30 Retention", value: "53.8%", change: "+6.8%", trend: "up", description: "industry benchmark: 35%" },
  { title: "Monthly Churn Rate", value: "2.1%", change: "-0.4%", trend: "down", description: "steady decline in churn" },
];
