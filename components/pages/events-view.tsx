"use client";

import { useState, useEffect } from "react";
import { Realtime1, realtime1ExampleProps, type Realtime1Props } from "@/components/dashboardblocks/realtime/realtime-01";
import { Realtime2, realtime2ExampleProps, type Realtime2Props, type ThroughputSample } from "@/components/dashboardblocks/realtime/realtime-02";
import { Realtime3, realtime3ExampleProps, type Realtime3Props, type LiveEvent } from "@/components/dashboardblocks/realtime/realtime-03";
import { Realtime4, realtime4ExampleProps, type Realtime4Props } from "@/components/dashboardblocks/realtime/realtime-04";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PauseIcon, PlayIcon, WifiIcon } from "lucide-react";
import {
  DashboardBusy,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";

export function EventsView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Realtime 1 State: Active Users & Rolling Views
  const [realtime1Data, setRealtime1Data] = useState<Realtime1Props>(realtime1ExampleProps);

  // Realtime 2 State: Throughput Samples
  const [realtime2Data, setRealtime2Data] = useState<Realtime2Props>(realtime2ExampleProps);

  // Realtime 3 State: Live Events Stream
  const [realtime3Data, setRealtime3Data] = useState<Realtime3Props>(realtime3ExampleProps);

  // Realtime 4 State: Today's Metrics
  const [realtime4Data, setRealtime4Data] = useState<Realtime4Props>(realtime4ExampleProps);

  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // 1. Update Realtime 1 (Active users fluctuation & rolling 60-second bars)
      setRealtime1Data((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4;
        const newActiveUsers = Math.max(900, (prev.activeUsers ?? 1284) + delta);
        const currentViews = prev.pageViews ?? [];
        const newViewCount = Math.max(15, Math.floor(25 + Math.random() * 35));
        const updatedViews = currentViews.length > 0 ? [...currentViews.slice(1), newViewCount] : [newViewCount];

        return {
          ...prev,
          activeUsers: newActiveUsers,
          pageViews: updatedViews,
        };
      });

      // 2. Update Realtime 2 (Throughput requests)
      setRealtime2Data((prev) => {
        const currentSamples = prev.samples ?? [];
        if (currentSamples.length === 0) return prev;
        const last = currentSamples[currentSamples.length - 1];
        const newReqs = Math.max(800, Math.floor(last.requests + (Math.random() * 80 - 40)));
        const newErrors = Math.random() > 0.85 ? Math.floor(Math.random() * 5) : 0;
        const newSample: ThroughputSample = { requests: newReqs, errors: newErrors };

        return {
          ...prev,
          samples: [...currentSamples.slice(1), newSample],
        };
      });

      // 3. Update Realtime 3 (Live Event Stream with new occasional events)
      setRealtime3Data((prev) => {
        const now = new Date();
        const shouldAdd = Math.random() > 0.45;
        if (!shouldAdd) {
          return { ...prev, now };
        }

        const sampleEventTypes: Array<{ kind: 'order' | 'signup' | 'message' | 'refund'; label: string; detail: string }> = [
          { kind: 'order', label: `Order #${Math.floor(10480 + Math.random() * 500)}`, detail: `$${(25 + Math.random() * 180).toFixed(2)}, ${Math.floor(1 + Math.random() * 4)} items` },
          { kind: 'signup', label: 'New Pro sign-up', detail: 'Annual subscription via Stripe' },
          { kind: 'message', label: 'Support conversation', detail: 'Priority customer chat connected' },
          { kind: 'signup', label: 'Workspace created', detail: 'Team plan trial started' },
        ];

        const randomTemplate = sampleEventTypes[Math.floor(Math.random() * sampleEventTypes.length)];
        const newEvent: LiveEvent = {
          id: `evt-${Date.now()}`,
          at: now,
          kind: randomTemplate.kind,
          label: randomTemplate.label,
          detail: randomTemplate.detail,
        };

        const existing = prev.events ?? [];
        return {
          ...prev,
          now,
          events: [newEvent, ...existing.slice(0, 15)],
        };
      });

      // 4. Update Realtime 4 (Today orders count slightly increasing over time)
      if (Math.random() > 0.7) {
        setRealtime4Data((prev) => {
          if (!prev.metrics) return prev;
          const updatedMetrics = prev.metrics.map((m) => {
            if (m.id === 'orders') return { ...m, today: m.today + 1 };
            if (m.id === 'revenue') return { ...m, today: m.today + Math.floor(45 + Math.random() * 90) };
            return m;
          });
          return { ...prev, metrics: updatedMetrics };
        });
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  return (
    <div className="flex flex-col gap-4">
      {/* Realtime Stream Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex size-3">
            {isLiveStreaming && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex size-3 rounded-full ${isLiveStreaming ? "bg-emerald-500" : "bg-zinc-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {isLiveStreaming ? "Live Telemetry Active" : "Telemetry Stream Paused"}
              </span>
              <Badge variant="outline" className="text-[11px] font-mono font-medium py-0 h-5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                <WifiIcon className="size-3 mr-1" />
                Real-time
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live updates active. When connected to your backend API, WebSocket, or SSE, pass data directly into these props.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsLiveStreaming((prev) => !prev)}
            className="text-xs gap-1.5 h-8 cursor-pointer"
          >
            {isLiveStreaming ? (
              <>
                <PauseIcon className="size-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <PlayIcon className="size-3.5 fill-current" />
                <span>Resume Stream</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Realtime Grid (2x2) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Realtime1
          {...realtime1Data}
          activeUsers={state.isEmpty ? undefined : realtime1Data.activeUsers}
          pageViews={state.isEmpty ? [] : realtime1Data.pageViews}
          pages={state.isEmpty ? [] : realtime1Data.pages}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <Realtime2
          {...realtime2Data}
          samples={state.isEmpty ? [] : realtime2Data.samples}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <DashboardBusy refreshing={state.refreshing} label="Updating live activity">
          <Realtime3
            {...realtime3Data}
            events={state.isEmpty ? [] : realtime3Data.events}
            status={state.status}
            errorMessage={state.errorMessage}
          />
        </DashboardBusy>
        <Realtime4
          {...realtime4Data}
          metrics={state.isEmpty ? [] : realtime4Data.metrics}
          hourly={state.isEmpty ? [] : realtime4Data.hourly}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>
    </div>
  );
}

export default EventsView;
