"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackendBanner } from "@/components/backend-banner";
import { initialIntegrations, integrationMetrics } from "@/src/metadata/integrations-data";
import { API_ENDPOINTS } from "@/src/metadata/endpoints";
import { IntegrationService } from "@/src/metadata/types";
import {
  PlugIcon,
  MessageSquareIcon,
  CreditCardIcon,
  BoxesIcon,
  ActivityIcon,
  BarChart3Icon,
  GitBranchIcon,
  RadioIcon,
} from "lucide-react";
import {
  DashboardBusy,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardMetricCardsSkeleton,
  Skeleton,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";

export function IntegrationsView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const [integrations, setIntegrations] = useState<IntegrationService[]>(initialIntegrations);
  const activeIntegrations = state.isEmpty ? [] : integrations;

  const getIcon = (name: string) => {
    switch (name) {
      case "MessageSquare":
        return <MessageSquareIcon className="size-5 text-emerald-500" />;
      case "CreditCard":
        return <CreditCardIcon className="size-5 text-sky-500" />;
      case "Boxes":
        return <BoxesIcon className="size-5 text-emerald-400" />;
      case "Activity":
        return <ActivityIcon className="size-5 text-amber-500" />;
      case "BarChart3":
        return <BarChart3Icon className="size-5 text-indigo-500" />;
      case "GitBranch":
        return <GitBranchIcon className="size-5 text-purple-500" />;
      case "Radio":
        return <RadioIcon className="size-5 text-rose-500" />;
      default:
        return <PlugIcon className="size-5 text-primary" />;
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected, lastSync: "Just now" } : item
      )
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Backend Integration Banner */}
      <BackendBanner
        endpoint={API_ENDPOINTS.integrations.list}
        method="GET"
        description="Connected third-party data pipelines, webhooks, and synchronization status."
        schemaExample={initialIntegrations.slice(0, 2)}
      />

      {/* Top Integration Metrics */}
      {state.isLoading ? (
        <DashboardMetricCardsSkeleton count={4} />
      ) : (
        <DashboardBusy refreshing={state.refreshing} label="Updating integration metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {integrationMetrics.map((stat) => (
              <Card key={stat.title} className="dark:bg-card/50">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs">{stat.title}</CardDescription>
                  <CardTitle className="text-2xl font-mono tabular-nums font-semibold mt-1">
                    {state.isError || state.isEmpty ? "—" : stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-emerald-500 font-mono font-medium">
                      {state.isError || state.isEmpty ? "—" : stat.change}
                    </span>
                    <span>{stat.description}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardBusy>
      )}

      {/* Integrations Grid */}
      {state.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="dark:bg-card/40">
              <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <Skeleton className="h-8 w-full" />
                <div className="flex justify-between pt-1 border-t border-border/40">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : state.isError ? (
        <Card className="dark:bg-transparent">
          <CardContent className="p-4">
            <DashboardErrorState
              title="Couldn’t load integrations"
              description={state.errorMessage ?? "Unable to check pipeline connection status."}
              onRetry={props.onRetry ?? state.handleRetry}
            />
          </CardContent>
        </Card>
      ) : activeIntegrations.length === 0 ? (
        <Card className="dark:bg-transparent">
          <CardContent className="p-4">
            <DashboardEmptyState
              title="No integrations available"
              description="Connected third-party pipelines and webhooks will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <DashboardBusy refreshing={state.refreshing} label="Updating integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeIntegrations.map((item) => (
              <Card
                key={item.id}
                className={`transition-all ${
                  item.connected
                    ? "border-border hover:border-emerald-500/50 bg-background/50 dark:bg-card/40"
                    : "border-dashed border-border/70 opacity-75 bg-muted/10"
                }`}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted/50 dark:bg-zinc-900 border border-border/50">
                      {getIcon(item.iconName)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={item.connected ? "outline" : "secondary"}
                    className={`text-[10px] font-mono ${
                      item.connected ? "border-emerald-500/30 text-emerald-500" : "text-muted-foreground"
                    }`}
                  >
                    {item.connected ? "Connected" : "Inactive"}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                    {item.description}
                  </p>

                  {item.webhookUrl && (
                    <div className="p-2 rounded bg-muted/40 font-mono text-[10px] text-muted-foreground truncate border border-border/40">
                      {item.webhookUrl}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.lastSync ? `Synced ${item.lastSync}` : "Not synced"}
                    </span>

                    <Button
                      size="sm"
                      variant={item.connected ? "outline" : "default"}
                      onClick={() => toggleIntegration(item.id)}
                      className="h-7 text-[11px] cursor-pointer"
                    >
                      {item.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DashboardBusy>
      )}
    </div>
  );
}
