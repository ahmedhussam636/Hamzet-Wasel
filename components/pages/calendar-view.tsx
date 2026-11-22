"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BlockStateProvider,
  BlockStateText,
  getBlockState,
} from "@/components/dashboardblocks/block-state";
import {
  type CalendarEvent,
  CalendarEventDetails,
  CalendarEventList,
  CalendarLegend,
  CalendarMonthView,
  CalendarWeekView,
  formatDayRange,
  getEventsForDay,
  getWeekDays,
  startOfMonth,
} from "@/components/dashboardblocks/calendar";
import { calendar2ExampleProps } from "@/components/dashboardblocks/calendar/calendar-02";
import type { CommandMenuGroup } from "@/components/dashboardblocks/command-menu";
import { CommandMenu2 } from "@/components/dashboardblocks/command-menu/command-menu-02";
import {
  EventRow,
  MonthCalendar,
  addDays,
  formatDuration,
  formatTimeRange,
  getDay,
  groupByDay,
} from "@/components/dashboardblocks/schedule";
import {
  BlockBusyIndicator,
  ChartRefreshButton,
  DashboardBusy,
  DashboardEmptyState,
  DashboardErrorState,
  Skeleton,
  useChartRefresh,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { dayIn, formatDate, zonedParts } from "@/lib/dashboardblocks/format";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";

const STORAGE_KEY = "hamzet-wasel-calendar-events-v1";
const DAY_MS = 86_400_000;

type CalendarViewMode = "week" | "month" | "agenda";

interface SerializedCalendarEvent extends Omit<CalendarEvent, "start" | "end"> {
  start: string;
  end?: string;
}

function getAlignedBaseEvents(referenceNow: Date): CalendarEvent[] {
  const sampleToday = getDay(calendar2ExampleProps.now, "UTC");
  const currentToday = getDay(referenceNow, "UTC");
  const diffDays = Math.round((currentToday.getTime() - sampleToday.getTime()) / DAY_MS);
  // Shift by whole weeks so weekday alignment (Mon-Fri standups, etc.) stays intact
  const weekAlignedShiftMs = Math.round(diffDays / 7) * 7 * DAY_MS;

  return (calendar2ExampleProps.events ?? []).map((event) => ({
    ...event,
    start: new Date(event.start.getTime() + weekAlignedShiftMs),
    end: event.end ? new Date(event.end.getTime() + weekAlignedShiftMs) : undefined,
  }));
}

function loadStoredEvents(fallbackEvents: CalendarEvent[]): CalendarEvent[] {
  if (typeof window === "undefined") return fallbackEvents;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackEvents;
    const parsed = JSON.parse(raw) as SerializedCalendarEvent[];
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        start: new Date(item.start),
        end: item.end ? new Date(item.end) : undefined,
      }));
    }
  } catch {
    // Ignore storage read errors
  }
  return fallbackEvents;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date): string {
  const { hour, minute } = zonedParts(date, "UTC");
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseUtcDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1, hh || 0, mm || 0));
}

interface EventFormState {
  title: string;
  calendar: string;
  allDay: boolean;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  attendeesText: string;
  description: string;
}

export function CalendarView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const {
    refreshing: calendarRefreshing,
    refreshKey,
    triggerRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => getDay(now, "UTC"), [now]);
  const defaultEvents = useMemo(() => getAlignedBaseEvents(now), [now]);
  const calendars = calendar2ExampleProps.calendars;
  const calendarColorMap = useMemo(
    () => new Map(calendars.map((c) => [c.name, c.color])),
    [calendars]
  );

  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    loadStoredEvents(defaultEvents)
  );
  const [hasModified, setHasModified] = useState(false);
  const [view, setView] = useState<CalendarViewMode>("week");
  const [anchor, setAnchor] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [miniMonth, setMiniMonth] = useState<Date>(() => startOfMonth(today));
  const [hiddenCalendars, setHiddenCalendars] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(() => {
    const nextUpcoming = [...events]
      .filter((e) => !e.allDay && (e.end ?? e.start) >= today)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    return nextUpcoming?.id ?? events[0]?.id;
  });

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formState, setFormState] = useState<EventFormState>({
    title: "",
    calendar: calendars[0]?.name ?? "Product",
    allDay: false,
    date: toDateInputValue(today),
    endDate: toDateInputValue(today),
    startTime: "10:00",
    endTime: "11:00",
    location: "",
    attendeesText: "",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const serialized: SerializedCalendarEvent[] = events.map((event) => ({
        ...event,
        start: event.start.toISOString(),
        end: event.end?.toISOString(),
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch {
      // Ignore storage write errors
    }
  }, [events]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const activeEvents = useMemo(
    () => (state.isEmpty ? [] : events),
    [state.isEmpty, events]
  );

  const visibleEvents = useMemo(
    () =>
      activeEvents.filter(
        (event) => !event.calendar || !hiddenCalendars.includes(event.calendar)
      ),
    [activeEvents, hiddenCalendars]
  );

  const weekDays = useMemo(() => getWeekDays(anchor, 0), [anchor]);
  const monthStart = useMemo(() => startOfMonth(anchor), [anchor]);
  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedId),
    [visibleEvents, selectedId]
  );

  const selectedDayEvents = useMemo(
    () => getEventsForDay(visibleEvents, selectedDay, "UTC"),
    [visibleEvents, selectedDay]
  );

  const periodStats = useMemo(() => {
    if (view === "week") {
      const weekEnd = addDays(weekDays[6], 1);
      const inWeek = visibleEvents.filter((event) => {
        const day = getDay(event.start, "UTC");
        return day >= weekDays[0] && day < weekEnd;
      });
      const timed = inWeek.filter((e) => !e.allDay && e.end);
      const minutes = timed.reduce(
        (sum, e) => sum + ((e.end ?? e.start).getTime() - e.start.getTime()) / 60_000,
        0
      );
      return {
        title: formatDayRange(weekDays[0], weekDays[6]),
        description:
          inWeek.length === 0
            ? "Nothing scheduled this week."
            : `${timed.length} timed ${timed.length === 1 ? "meeting" : "meetings"} (${formatDuration(new Date(0), new Date(minutes * 60_000))}) · ${inWeek.length} total events.`,
      };
    }

    if (view === "month") {
      const monthEvents = visibleEvents.filter((event) => {
        const d = getDay(event.start, "UTC");
        return (
          d.getUTCFullYear() === monthStart.getUTCFullYear() &&
          d.getUTCMonth() === monthStart.getUTCMonth()
        );
      });
      return {
        title: formatDate(monthStart, "month-year"),
        description:
          monthEvents.length === 0
            ? "No events scheduled this month."
            : `${monthEvents.length} scheduled ${monthEvents.length === 1 ? "event" : "events"} in ${formatDate(monthStart, "month-year")}.`,
      };
    }

    const upcoming = visibleEvents.filter(
      (event) => (event.end ?? event.start) >= anchor
    );
    return {
      title: `Agenda from ${formatDate(anchor, "day")}`,
      description:
        upcoming.length === 0
          ? "No upcoming events from this date."
          : `${upcoming.length} upcoming ${upcoming.length === 1 ? "event" : "events"} across ${calendars.length - hiddenCalendars.length} active calendars.`,
    };
  }, [view, weekDays, visibleEvents, monthStart, anchor, calendars.length, hiddenCalendars.length]);

  const agendaDays = useMemo(() => {
    const windowEnd = addDays(anchor, 21);
    const windowEvents = visibleEvents.filter((event) => {
      const day = getDay(event.start, "UTC");
      return day >= anchor && day < windowEnd;
    });
    return groupByDay(windowEvents, now, "UTC");
  }, [visibleEvents, anchor, now]);

  const jumpToDay = (day: Date) => {
    setAnchor(day);
    setSelectedDay(day);
    setMiniMonth(startOfMonth(day));
  };

  const selectAndFocusEvent = (event: CalendarEvent) => {
    const day = getDay(event.start, "UTC");
    setAnchor(day);
    setSelectedDay(day);
    setMiniMonth(startOfMonth(day));
    setSelectedId(event.id);
    if (event.calendar && hiddenCalendars.includes(event.calendar)) {
      setHiddenCalendars((prev) => prev.filter((name) => name !== event.calendar));
    }
  };

  const recentEventsGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Upcoming events",
      items: [...activeEvents]
        .filter((e) => (e.end ?? e.start) >= today)
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 5)
        .map((event) => ({
          id: `recent-event-${event.id}`,
          label: event.title,
          description: `${formatDate(event.start, "weekday-day")} · ${
            event.allDay ? "All day" : formatTimeRange(event.start, event.end, "UTC")
          }${event.location ? ` · ${event.location}` : ""}`,
          meta: event.calendar,
          icon: <CalendarIcon />,
          onSelect: () => selectAndFocusEvent(event),
        })),
    }),
    [activeEvents, today]
  );

  const searchEvents = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentEventsGroup];

    const matches = activeEvents.filter((event) =>
      [
        event.title,
        event.calendar,
        event.location,
        event.description,
        ...(event.attendees?.map((a) => a.name) ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );

    if (matches.length === 0) return [];

    return [
      {
        heading: "Matching events",
        items: matches.slice(0, 12).map((event) => ({
          id: `search-event-${event.id}`,
          label: event.title,
          description: `${formatDate(event.start, "weekday-day")} · ${
            event.allDay ? "All day" : formatTimeRange(event.start, event.end, "UTC")
          }${event.location ? ` · ${event.location}` : ""}`,
          meta: event.calendar,
          icon: <CalendarIcon />,
          onSelect: () => selectAndFocusEvent(event),
        })),
      },
    ];
  };

  const toggleCalendar = (name: string) => {
    setHiddenCalendars((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const openCreateDialog = (targetDate: Date = selectedDay) => {
    const isoDate = toDateInputValue(targetDate);
    setEditingEvent(null);
    setFormState({
      title: "",
      calendar: calendars[0]?.name ?? "Product",
      allDay: false,
      date: isoDate,
      endDate: isoDate,
      startTime: "10:00",
      endTime: "11:00",
      location: "",
      attendeesText: "",
      description: "",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    const startIso = toDateInputValue(event.start);
    const endRaw = event.end ?? event.start;
    const endDateIso =
      event.allDay && event.end
        ? toDateInputValue(addDays(getDay(event.end, "UTC"), -1))
        : toDateInputValue(endRaw);

    setEditingEvent(event);
    setFormState({
      title: event.title,
      calendar: event.calendar ?? calendars[0]?.name ?? "Product",
      allDay: Boolean(event.allDay),
      date: startIso,
      endDate: endDateIso < startIso ? startIso : endDateIso,
      startTime: toTimeInputValue(event.start),
      endTime: toTimeInputValue(endRaw),
      location: event.location ?? "",
      attendeesText: event.attendees?.map((a) => a.name).join(", ") ?? "",
      description: event.description ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveEvent = (e: FormEvent) => {
    e.preventDefault();
    const title = formState.title.trim();
    if (!title) {
      setFormError("Event title is required.");
      return;
    }

    let start: Date;
    let end: Date;
    if (formState.allDay) {
      start = parseUtcDateAndTime(formState.date, "00:00");
      const lastDay = parseUtcDateAndTime(
        formState.endDate >= formState.date ? formState.endDate : formState.date,
        "00:00"
      );
      end = addDays(lastDay, 1);
    } else {
      start = parseUtcDateAndTime(formState.date, formState.startTime);
      end = parseUtcDateAndTime(formState.date, formState.endTime);
      if (end <= start) {
        end = new Date(start.getTime() + 30 * 60_000);
      }
    }

    const attendees = formState.attendeesText
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    const color =
      calendarColorMap.get(formState.calendar) ?? "var(--color-chart-2)";

    if (editingEvent) {
      const updated: CalendarEvent = {
        ...editingEvent,
        title,
        calendar: formState.calendar,
        color,
        allDay: formState.allDay,
        start,
        end,
        location: formState.location.trim() || undefined,
        description: formState.description.trim() || undefined,
        attendees: attendees.length > 0 ? attendees : undefined,
      };
      setEvents((prev) =>
        prev.map((item) => (item.id === editingEvent.id ? updated : item))
      );
      selectAndFocusEvent(updated);
      setNotice(`Updated "${title}".`);
    } else {
      const created: CalendarEvent = {
        id: `evt-${Date.now().toString(36)}`,
        title,
        calendar: formState.calendar,
        color,
        allDay: formState.allDay,
        start,
        end,
        location: formState.location.trim() || undefined,
        description: formState.description.trim() || undefined,
        attendees: attendees.length > 0 ? attendees : undefined,
      };
      setEvents((prev) => [...prev, created]);
      selectAndFocusEvent(created);
      setNotice(`Scheduled "${title}".`);
    }

    setHasModified(true);
    setFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setEvents((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(undefined);
    setHasModified(true);
    setNotice(`Removed "${deleteTarget.title}" from calendar.`);
    setDeleteTarget(null);
  };

  const handleResetEvents = () => {
    setEvents(defaultEvents);
    setHiddenCalendars([]);
    setHasModified(false);
    jumpToDay(today);
    setNotice("Restored sample schedule.");
  };

  const closeDetails = () => {
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-event-id="${selectedId}"]`)
      ?.focus();
    setSelectedId(undefined);
  };

  const blockState = getBlockState(state.status, activeEvents);
  const isBusy = Boolean(state.refreshing || calendarRefreshing);

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <div
          role="status"
          className="bg-muted/60 border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
        >
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <BlockStateProvider errorMessage={state.errorMessage} state={blockState}>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <section className="@container flex flex-col gap-4 [--calendar-surface:var(--color-card)]">
              {/* Top Header Row: Title & Primary Actions */}
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 aria-live="polite" className="font-semibold tracking-tight">
                    {periodStats.title}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {blockState ? <BlockStateText /> : periodStats.description}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isBusy && <BlockBusyIndicator />}
                  {hasModified && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetEvents}
                      className="h-8 gap-1.5 text-xs whitespace-nowrap"
                    >
                      <RotateCcwIcon className="size-3.5" />
                      Reset
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={state.isLoading}
                    onClick={() => openCreateDialog(selectedDay)}
                    className="h-8 gap-1.5 text-xs whitespace-nowrap"
                  >
                    <PlusIcon className="size-3.5" />
                    New event
                  </Button>
                  <ChartRefreshButton
                    disabled={state.isLoading}
                    refreshing={isBusy}
                    onClick={() => void triggerRefresh()}
                    className="h-8 px-2.5"
                  />
                </div>
              </header>

              {/* Second Row: Date Navigation, View Switcher & Event Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => jumpToDay(today)}
                    className="h-8"
                  >
                    Today
                  </Button>
                  <ButtonGroup>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={view === "month" ? "Previous month" : "Previous week"}
                      onClick={() => {
                        const next =
                          view === "month"
                            ? startOfMonth(monthStart, -1)
                            : addDays(anchor, -7);
                        jumpToDay(next);
                      }}
                    >
                      <ChevronLeftIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={view === "month" ? "Next month" : "Next week"}
                      onClick={() => {
                        const next =
                          view === "month"
                            ? startOfMonth(monthStart, 1)
                            : addDays(anchor, 7);
                        jumpToDay(next);
                      }}
                    >
                      <ChevronRightIcon />
                    </Button>
                  </ButtonGroup>
                  <Tabs
                    value={view}
                    onValueChange={(next) => setView(next as CalendarViewMode)}
                  >
                    <TabsList aria-label="Calendar view">
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                      <TabsTrigger value="agenda">Agenda</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <CommandMenu2
                  className="w-full sm:w-auto items-stretch"
                  emptyMessage="No matching calendar events found."
                  placeholder="Search events..."
                  recent={recentEventsGroup}
                  search={searchEvents}
                  showStatus={false}
                  title="Search calendar"
                  triggerClassName="h-8 w-full sm:w-64 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
                />
              </div>

              <DashboardBusy refreshing={isBusy} label="Updating calendar events">
                {state.isLoading ? (
                  <div className="grid gap-6 border-t pt-4 @5xl:grid-cols-[minmax(0,1fr)_18rem]">
                    <Skeleton className="h-[32rem] w-full rounded-lg" />
                    <div className="flex flex-col gap-4">
                      <Skeleton className="h-64 w-full rounded-lg" />
                      <Skeleton className="h-36 w-full rounded-lg" />
                    </div>
                  </div>
                ) : state.isError ? (
                  <DashboardErrorState
                    title="Couldn’t load calendar"
                    description={
                      state.errorMessage ??
                      "Unable to fetch scheduled events right now."
                    }
                    onRetry={props.onRetry ?? state.handleRetry}
                  />
                ) : activeEvents.length === 0 ? (
                  <DashboardEmptyState
                    title="No events scheduled"
                    description="Create a meeting, focus block, or milestone to populate your calendar."
                    action={
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openCreateDialog(today)}
                      >
                        <PlusIcon className="size-3.5" />
                        New event
                      </Button>
                    }
                  />
                ) : (
                  <div
                    key={refreshKey}
                    ref={containerRef}
                    className="grid gap-6 border-t pt-4 @5xl:grid-cols-[minmax(0,1fr)_18.5rem]"
                  >
                    {/* Main Calendar Stage */}
                    <div className="min-w-0">
                      {view === "week" && (
                        <CalendarWeekView
                          days={weekDays}
                          events={visibleEvents}
                          now={now}
                          onSelectEvent={(event) => {
                            setSelectedId(event.id);
                            setSelectedDay(getDay(event.start, "UTC"));
                          }}
                          selectedEventId={selectedId}
                          timeZone="UTC"
                          minColumnWidth="5.5rem"
                          className="h-[34rem]"
                        />
                      )}

                      {view === "month" && (
                        <CalendarMonthView
                          events={visibleEvents}
                          label={formatDate(monthStart, "month-year")}
                          month={monthStart}
                          now={now}
                          onMonthChange={(nextMonth) => setAnchor(nextMonth)}
                          onSelectDay={(day) => {
                            setSelectedDay(day);
                            setSelectedId(undefined);
                          }}
                          onSelectEvent={(event) => {
                            setSelectedId(event.id);
                            setSelectedDay(getDay(event.start, "UTC"));
                          }}
                          onShowMore={(day) => {
                            setSelectedDay(day);
                            setSelectedId(undefined);
                          }}
                          selectedDay={selectedDay}
                          selectedEventId={selectedId}
                          timeZone="UTC"
                        />
                      )}

                      {view === "agenda" && (
                        <div className="flex max-h-[34rem] flex-col gap-5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                          {agendaDays.length === 0 ? (
                            <DashboardEmptyState
                              title="Nothing upcoming in this 3-week window"
                              description="Use Next/Previous to browse other weeks, or schedule a new event."
                              action={
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => openCreateDialog(anchor)}
                                >
                                  <PlusIcon className="size-3.5" />
                                  Schedule event
                                </Button>
                              }
                            />
                          ) : (
                            agendaDays.map((group) => (
                              <section key={group.key} className="flex flex-col gap-2">
                                <header className="flex items-center justify-between border-b pb-1.5">
                                  <h3 className="text-sm font-semibold tracking-tight">
                                    {group.label}
                                  </h3>
                                  <span className="text-muted-foreground text-xs tabular-nums">
                                    {group.events.length}{" "}
                                    {group.events.length === 1 ? "event" : "events"}
                                  </span>
                                </header>
                                <ul className="flex flex-col divide-y">
                                  {group.events.map((event) => (
                                    <EventRow
                                      key={event.id}
                                      event={event}
                                      now={now}
                                      selected={event.id === selectedId}
                                      timeZone="UTC"
                                      className="rounded-md px-2 py-2"
                                      action={
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setSelectedId(event.id)}
                                          className="h-7 text-xs"
                                        >
                                          Details
                                        </Button>
                                      }
                                    />
                                  ))}
                                </ul>
                              </section>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Sidebar: Mini Month, Calendar Filters, Event Details / Day Agenda */}
                    <aside className="flex min-w-0 flex-col gap-5 border-t pt-4 @5xl:border-t-0 @5xl:border-l @5xl:pt-0 @5xl:pl-6">
                      {/* Mini Month Picker */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold tracking-tight">
                            {formatDate(miniMonth, "month-year")}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMiniMonth(startOfMonth(miniMonth, -1))
                              }
                              className="h-6 px-1.5 text-xs"
                              aria-label="Previous mini calendar month"
                            >
                              ‹
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMiniMonth(startOfMonth(miniMonth, 1))
                              }
                              className="h-6 px-1.5 text-xs"
                              aria-label="Next mini calendar month"
                            >
                              ›
                            </Button>
                          </div>
                        </div>
                        <MonthCalendar
                          events={visibleEvents}
                          label={formatDate(miniMonth, "month-year")}
                          month={miniMonth}
                          now={now}
                          onMonthChange={setMiniMonth}
                          onSelect={(day) => {
                            jumpToDay(day);
                            setSelectedId(undefined);
                          }}
                          selected={selectedDay}
                          timeZone="UTC"
                        />
                      </div>

                      {/* Interactive Calendar Filters */}
                      <div className="flex flex-col gap-1.5 border-t pt-4">
                        <span className="text-muted-foreground text-xs font-medium">
                          Calendars
                        </span>
                        <CalendarLegend
                          calendars={calendars}
                          hidden={hiddenCalendars}
                          onToggle={toggleCalendar}
                          className="flex-col gap-0.5"
                        />
                      </div>

                      {/* Event Details or Selected Day Schedule */}
                      <div className="min-w-0 border-t pt-4">
                        {selectedEvent ? (
                          <CalendarEventDetails
                            event={selectedEvent}
                            timeZone="UTC"
                            onClose={closeDetails}
                            actions={
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(selectedEvent)}
                                  className="h-7 gap-1.5 text-xs"
                                >
                                  <PencilIcon className="size-3" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeleteTarget(selectedEvent)}
                                  className="h-7 gap-1.5 text-xs"
                                >
                                  <Trash2Icon className="size-3" />
                                  Delete
                                </Button>
                              </>
                            }
                          />
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold tracking-tight">
                                  {dayIn(selectedDay, "UTC") === dayIn(today, "UTC")
                                    ? "Today's schedule"
                                    : formatDate(selectedDay, "weekday-day")}
                                </h3>
                                <p className="text-muted-foreground text-xs tabular-nums">
                                  {selectedDayEvents.length}{" "}
                                  {selectedDayEvents.length === 1 ? "event" : "events"}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openCreateDialog(selectedDay)}
                                className="h-7 gap-1 text-xs"
                              >
                                <PlusIcon className="size-3" />
                                Add
                              </Button>
                            </div>
                            <CalendarEventList
                              events={selectedDayEvents}
                              now={now}
                              onSelectEvent={(event) => setSelectedId(event.id)}
                              selectedEventId={selectedId}
                              timeZone="UTC"
                              emptyLabel="No events scheduled for this day."
                            />
                          </div>
                        )}
                      </div>
                    </aside>
                  </div>
                )}
              </DashboardBusy>
            </section>
          </CardContent>
        </Card>
      </BlockStateProvider>

      {/* Create / Edit Event Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? `Edit "${editingEvent.title}"` : "New calendar event"}
              </DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? "Update event schedule, calendar category, or attendees."
                  : "Schedule a meeting, customer call, or focus block."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Q4 Product Sync"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-calendar">Calendar</Label>
                  <select
                    id="event-calendar"
                    value={formState.calendar}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, calendar: e.target.value }))
                    }
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.name} value={cal.name}>
                        {cal.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={formState.allDay}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({
                          ...prev,
                          allDay: Boolean(checked),
                        }))
                      }
                    />
                    <span>All-day event</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-date">
                    {formState.allDay ? "Start date" : "Date"}
                  </Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={formState.date}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        date: e.target.value,
                        endDate:
                          prev.endDate < e.target.value ? e.target.value : prev.endDate,
                      }))
                    }
                  />
                </div>

                {formState.allDay ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="event-end-date">End date</Label>
                    <Input
                      id="event-end-date"
                      type="date"
                      value={formState.endDate}
                      min={formState.date}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="event-start">Start</Label>
                      <Input
                        id="event-start"
                        type="time"
                        value={formState.startTime}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="event-end">End</Label>
                      <Input
                        id="event-end"
                        type="time"
                        value={formState.endTime}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-location">Location or meeting link</Label>
                <Input
                  id="event-location"
                  value={formState.location}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Zoom, Room 4B, or Google Meet"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-attendees">Attendees (comma-separated)</Label>
                <Input
                  id="event-attendees"
                  value={formState.attendeesText}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      attendeesText: e.target.value,
                    }))
                  }
                  placeholder="Maya Lindqvist, Priya Raman"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-description">Notes</Label>
                <Textarea
                  id="event-description"
                  rows={2}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Agenda items or meeting context..."
                />
              </div>

              {formError && (
                <p className="text-destructive text-xs font-medium">{formError}</p>
              )}
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editingEvent ? "Save changes" : "Schedule event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete “{deleteTarget?.title ?? "event"}”?</DialogTitle>
            <DialogDescription>
              This removes the event from your calendar schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalendarView;
