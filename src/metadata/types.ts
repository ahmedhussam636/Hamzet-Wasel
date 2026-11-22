export interface DotMapLocation {
  country?: string;
  id: string;
  lat: number;
  lon: number;
  name: string;
  value: number;
}

export interface CountryUserActivity {
  id?: string;
  country: string;
  countryCode: string;
  city?: string;
  lat: number;
  lng: number;
  users: number;
  color?: string;
  pulse?: boolean;
}

export interface MetricStat {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export interface LiveEventItem {
  id: string;
  eventName: string;
  user: {
    name: string;
    email: string;
    avatar: string;
    countryCode: string;
  };
  path: string;
  timestamp: string;
  properties: Record<string, string | number | boolean>;
  status: "success" | "pending" | "failed";
}

export interface FunnelStep {
  step: number;
  name: string;
  visitors: number;
  conversionRate: number; // percentage from previous step
  dropOffRate: number;
  avgDuration: string;
}

export interface FunnelData {
  id: string;
  name: string;
  totalConversions: number;
  overallRate: number;
  steps: FunnelStep[];
}

export interface RetentionCohort {
  cohortDate: string;
  totalUsers: number;
  day0: number; // 100%
  day1: number;
  day3: number;
  day7: number;
  day14: number;
  day30: number;
}

export interface UserFlowStep {
  id: string;
  page: string;
  views: number;
  exitRate: number;
  nextPages: { path: string; percentage: number }[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  usersCount: number;
  growth: string;
  lastUpdated: string;
  badgeColor: string;
}

export interface CohortItem {
  id: string;
  name: string;
  channel: string;
  userCount: number;
  avgLtv: string;
  retentionRate: string;
  status: "growing" | "stable" | "declining";
}

export interface UserProfileItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  country: string;
  countryCode: string;
  status: "online" | "offline" | "idle";
  sessionsCount: number;
  lastSeen: string;
  totalSpent: string;
  plan: "Free" | "Pro" | "Enterprise";
}

export interface IntegrationService {
  id: string;
  name: string;
  description: string;
  category: "Analytics" | "Messaging" | "CRM" | "Database" | "Storage";
  iconName: string;
  connected: boolean;
  webhookUrl?: string;
  lastSync?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  avatar: string;
  status: "Active" | "Invited";
}

export interface ProjectSettings {
  projectName: string;
  projectId: string;
  environment: "Production" | "Staging" | "Development";
  apiBaseUrl: string;
  publicApiKey: string;
  secretApiKey: string;
  enableTelemetry: boolean;
  enableAlerts: boolean;
  team: TeamMember[];
}
