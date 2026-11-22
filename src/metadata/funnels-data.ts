import { FunnelData, MetricStat } from "./types";

export const initialFunnels: FunnelData[] = [
  {
    id: "funnel-onboarding",
    name: "SaaS Onboarding & Activation Funnel",
    totalConversions: 4280,
    overallRate: 34.2,
    steps: [
      { step: 1, name: "Landing Page Visit", visitors: 12500, conversionRate: 100, dropOffRate: 0, avgDuration: "0s" },
      { step: 2, name: "Sign Up Form Submitted", visitors: 8750, conversionRate: 70.0, dropOffRate: 30.0, avgDuration: "1m 12s" },
      { step: 3, name: "Email Verified", visitors: 7420, conversionRate: 84.8, dropOffRate: 15.2, avgDuration: "2m 45s" },
      { step: 4, name: "First Workspace Created", visitors: 5890, conversionRate: 79.4, dropOffRate: 20.6, avgDuration: "4m 10s" },
      { step: 5, name: "Pro Plan Upgraded", visitors: 4280, conversionRate: 72.7, dropOffRate: 27.3, avgDuration: "1d 4h" },
    ],
  },
  {
    id: "funnel-checkout",
    name: "E-Commerce Checkout Flow",
    totalConversions: 6140,
    overallRate: 46.8,
    steps: [
      { step: 1, name: "Product Page Viewed", visitors: 13120, conversionRate: 100, dropOffRate: 0, avgDuration: "0s" },
      { step: 2, name: "Added to Cart", visitors: 9480, conversionRate: 72.3, dropOffRate: 27.7, avgDuration: "45s" },
      { step: 3, name: "Initiated Checkout", visitors: 7890, conversionRate: 83.2, dropOffRate: 16.8, avgDuration: "1m 30s" },
      { step: 4, name: "Payment Completed", visitors: 6140, conversionRate: 77.8, dropOffRate: 22.2, avgDuration: "2m 15s" },
    ],
  },
];

export const funnelMetrics: MetricStat[] = [
  { title: "Overall Conversion Rate", value: "34.2%", change: "+3.8%", trend: "up", description: "from top of funnel to paid" },
  { title: "Average Time to Convert", value: "1.4 days", change: "-8.5%", trend: "up", description: "faster conversion" },
  { title: "Largest Drop-Off Step", value: "Workspace Creation", change: "20.6%", trend: "neutral", description: "step 3 to 4 dropoff" },
  { title: "Monthly Completed Goals", value: "10,420", change: "+16.3%", trend: "up", description: "all funnels combined" },
];
