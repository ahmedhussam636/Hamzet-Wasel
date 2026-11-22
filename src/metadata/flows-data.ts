import { UserFlowStep, MetricStat } from "./types";

export const initialUserFlows: UserFlowStep[] = [
  {
    id: "step-1",
    page: "Landing Page (/)",
    views: 45200,
    exitRate: 18.5,
    nextPages: [
      { path: "/features", percentage: 38 },
      { path: "/pricing", percentage: 32 },
      { path: "/auth/signup", percentage: 22 },
      { path: "/blog", percentage: 8 },
    ],
  },
  {
    id: "step-2",
    page: "Pricing Table (/pricing)",
    views: 28400,
    exitRate: 14.2,
    nextPages: [
      { path: "/auth/signup?plan=pro", percentage: 54 },
      { path: "/contact-sales", percentage: 26 },
      { path: "/docs/faq", percentage: 12 },
      { path: "/", percentage: 8 },
    ],
  },
  {
    id: "step-3",
    page: "Sign Up (/auth/signup)",
    views: 19800,
    exitRate: 12.1,
    nextPages: [
      { path: "/onboarding/welcome", percentage: 82 },
      { path: "/auth/login", percentage: 11 },
      { path: "/pricing", percentage: 7 },
    ],
  },
  {
    id: "step-4",
    page: "Dashboard Overview (/overview)",
    views: 16200,
    exitRate: 5.4,
    nextPages: [
      { path: "/events", percentage: 35 },
      { path: "/funnels", percentage: 28 },
      { path: "/settings", percentage: 22 },
      { path: "/profiles", percentage: 15 },
    ],
  },
];

export const flowMetrics: MetricStat[] = [
  { title: "Average Journey Depth", value: "4.8 pages", change: "+0.6", trend: "up", description: "per engaged session" },
  { title: "Key Exit Point", value: "/blog/archive", change: "28.4%", trend: "neutral", description: "informational bounce" },
  { title: "Signup Conversion Path", value: "Home → Pricing → App", change: "42.1%", trend: "up", description: "dominant path" },
  { title: "Loopback Sessions", value: "8.2%", change: "-1.5%", trend: "down", description: "improved navigation clarity" },
];
