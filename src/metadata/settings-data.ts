import { ProjectSettings } from "./types";

export const initialProjectSettings: ProjectSettings = {
  projectName: "Hamzet Wasel Dashboard",
  projectId: "hw_prod_99f2ff",
  environment: "Production",
  apiBaseUrl: "https://api.yourbackend.com/v1",
  publicApiKey: "YOUR_PUBLIC_API_KEY_PLACEHOLDER",
  secretApiKey: "YOUR_SECRET_API_KEY_PLACEHOLDER",
  enableTelemetry: true,
  enableAlerts: true,
  team: [
    {
      id: "mem-1",
      name: "Ahmed Steet",
      email: "ahmedsteet600@gmail.com",
      role: "Owner",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      status: "Active",
    },
    {
      id: "mem-2",
      name: "Shaban Haider",
      email: "shaban@hamzetwasel.com",
      role: "Admin",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
      status: "Active",
    },
    {
      id: "mem-3",
      name: "Engineering Backend Bot",
      email: "backend-api@hamzetwasel.internal",
      role: "Editor",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
      status: "Active",
    },
  ],
};