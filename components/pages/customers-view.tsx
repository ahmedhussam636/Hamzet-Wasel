"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BlockReady,
  BlockStateProvider,
  BlockStateRows,
  getBlockState,
} from "@/components/dashboardblocks/block-state";
import {
  ChartHatch,
  ChartPlaceholder,
  ChartTooltipContent,
  chartAxisProps,
  chartBarCursor,
  chartGridProps,
  chartValueAxisWidth,
  useChartId,
} from "@/components/dashboardblocks/chart";
import {
  ChartPanelFigure,
  ChartPanelLegend,
  ChartPanelTable,
} from "@/components/dashboardblocks/chart-panel";
import type { CommandMenuGroup } from "@/components/dashboardblocks/command-menu";
import { CommandMenu2 } from "@/components/dashboardblocks/command-menu/command-menu-02";
import {
  DataTable6,
  SEAT_PRICE,
  STATUS_CONFIG,
  dataTable6ExampleProps,
  type CustomerPlan,
  type CustomerRow,
  type CustomerStatus,
} from "@/components/dashboardblocks/data-table/data-table-06";
import { Details } from "@/components/dashboardblocks/details";
import {
  AreaChartKPI2,
  type AreaChartKPI2Props,
} from "@/components/dashboardblocks/kpi/area-chart-kpi-02";
import {
  LineChartKPI1,
  type LineChartKPI1Props,
} from "@/components/dashboardblocks/kpi/line-chart-kpi-01";
import { KPIValue } from "@/components/dashboardblocks/kpi";
import {
  Leaderboard,
  LeaderboardBar,
  LeaderboardItem,
  LeaderboardLabel,
  LeaderboardRank,
  LeaderboardValue,
} from "@/components/dashboardblocks/leaderboard";
import {
  RecordDetail1,
  type CustomerOrder,
  type RecordDetail1Props,
} from "@/components/dashboardblocks/record-detail/record-detail-01";
import {
  BlockBusyIndicator,
  ChartRefreshButton,
  DashboardBusy,
  useChartRefresh,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/lib/dashboardblocks/format";
import {
  Building2Icon,
  CheckCircle2Icon,
  PlusIcon,
  RotateCcwIcon,
  SendIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STORAGE_KEY = "hamzet-wasel-customers-v1";

const PLAN_OPTIONS: CustomerPlan[] = ["Enterprise", "Team", "Pro", "Free"];
const STATUS_OPTIONS: CustomerStatus[] = ["active", "trial", "past-due", "churned"];

const DEFAULT_CUSTOMERS: CustomerRow[] = dataTable6ExampleProps.rows ?? [];

const mrrKPIProps: AreaChartKPI2Props = {
  title: "Total MRR",
  comparison: "last week",
  format: "currency",
  previous: 7_420,
  data: [
    { label: "Mon", value: 1_120 },
    { label: "Tue", value: 1_190 },
    { label: "Wed", value: 1_150 },
    { label: "Thu", value: 1_240 },
    { label: "Fri", value: 1_310 },
    { label: "Sat", value: 1_040 },
    { label: "Sun", value: 1_180 },
  ],
};

const activeCustomersKPIProps: LineChartKPI1Props = {
  title: "Active accounts",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 184, value: 196 },
    { label: "Tue", previous: 192, value: 204 },
    { label: "Wed", previous: 188, value: 201 },
    { label: "Thu", previous: 198, value: 214 },
    { label: "Fri", previous: 205, value: 222 },
    { label: "Sat", previous: 172, value: 189 },
    { label: "Sun", previous: 168, value: 186 },
  ],
};

const paidSeatsKPIProps: LineChartKPI1Props = {
  title: "Provisioned seats",
  comparison: "last week",
  currentLabel: "This week",
  format: "compact",
  data: [
    { label: "Mon", previous: 1_240, value: 1_310 },
    { label: "Tue", previous: 1_290, value: 1_380 },
    { label: "Wed", previous: 1_270, value: 1_340 },
    { label: "Thu", previous: 1_340, value: 1_430 },
    { label: "Fri", previous: 1_390, value: 1_490 },
    { label: "Sat", previous: 1_180, value: 1_260 },
    { label: "Sun", previous: 1_160, value: 1_240 },
  ],
};

const expansionKPIProps: AreaChartKPI2Props = {
  title: "Seat expansion MRR",
  comparison: "last week",
  format: "currency",
  previous: 2_380,
  data: [
    { label: "Mon", value: 340 },
    { label: "Tue", value: 410 },
    { label: "Wed", value: 365 },
    { label: "Thu", value: 460 },
    { label: "Fri", value: 520 },
    { label: "Sat", value: 295 },
    { label: "Sun", value: 380 },
  ],
};

function computeMrr(plan: CustomerPlan, seats: number, status: CustomerStatus): number {
  if (status === "churned" || status === "trial") return 0;
  return Math.max(0, seats) * SEAT_PRICE[plan];
}

const CUSTOMER_LOCATIONS = [
  "Cairo, Egypt",
  "Riyadh, Saudi Arabia",
  "Dubai, UAE",
  "London, UK",
  "Berlin, Germany",
  "New York, USA",
  "Toronto, Canada",
  "Singapore",
];

function hashCustomerId(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function mapRecordStatus(
  status: CustomerStatus
): NonNullable<RecordDetail1Props["customer"]>["status"] {
  switch (status) {
    case "active":
      return "Active";
    case "trial":
      return "Trial";
    case "past-due":
      return "At risk";
    case "churned":
      return "Churned";
  }
}

function buildCustomerRecordDetail(customer: CustomerRow): {
  customer: NonNullable<RecordDetail1Props["customer"]>;
  orders: CustomerOrder[];
  stats: NonNullable<RecordDetail1Props["stats"]>;
} {
  const seed = hashCustomerId(customer.id);
  const location = CUSTOMER_LOCATIONS[seed % CUSTOMER_LOCATIONS.length];
  const phoneSuffix = String(1000 + (seed % 8999));
  const since = formatDate(new Date(customer.signedUp), "date");
  const baseTotal =
    customer.mrr > 0
      ? customer.mrr
      : Math.max(24, customer.seats * Math.max(12, SEAT_PRICE[customer.plan]));

  const invoiceMonths = ["Oct 1, 2026", "Sep 1, 2026", "Aug 1, 2026", "Jul 1, 2026"];
  const orders: CustomerOrder[] = invoiceMonths.map((date, idx) => {
    const invNumber = 4080 - ((seed % 300) + idx * 17);
    const status: CustomerOrder["status"] =
      idx === 0 && customer.status === "past-due"
        ? "Shipped"
        : idx === 2 && customer.status === "churned"
          ? "Refunded"
          : "Delivered";
    const multiplier = idx === 0 ? 1 : idx === 1 ? 1 : idx === 2 ? 0.85 : 0.85;
    return {
      date,
      href: "#",
      id: `INV-${invNumber}`,
      status,
      total: Number((baseTotal * multiplier).toFixed(2)),
    };
  });

  const lifetimeValue = customer.mrr > 0 ? customer.mrr * 8 : baseTotal * 2;
  const seatRate = SEAT_PRICE[customer.plan];

  return {
    customer: {
      email: customer.email,
      id: customer.id,
      location,
      name: customer.company,
      notes:
        customer.status === "past-due"
          ? `Invoice settlement pending follow-up for ${customer.seats} provisioned seats. Contact billing before renewal cycle.`
          : customer.status === "trial"
            ? `Active workspace evaluation on ${customer.plan} tier with ${customer.seats} team seats.`
            : `${customer.plan} workspace provisioned with ${customer.seats} active ${customer.seats === 1 ? "seat" : "seats"} at ${formatCurrency(seatRate)}/seat/mo.`,
      phone: `+20 10 ${String(20 + (seed % 70))}${phoneSuffix}`,
      plan: customer.plan,
      since,
      status: mapRecordStatus(customer.status),
      tags: [
        customer.plan,
        `${customer.seats} ${customer.seats === 1 ? "seat" : "seats"}`,
        customer.mrr >= 500 ? "Key Account" : "Self-Serve",
      ],
    },
    orders,
    stats: [
      {
        detail: `${customer.seats} seats · ${formatCurrency(seatRate)}/seat`,
        label: "Monthly MRR",
        value: formatCurrency(customer.mrr),
      },
      {
        detail: `${customer.plan} tier`,
        label: "Annual run rate",
        value: formatCurrency(customer.mrr * 12),
      },
      {
        detail: `Since ${since}`,
        label: "Lifetime spend",
        value: formatCurrency(lifetimeValue),
      },
      {
        detail: orders[0]?.date ?? "—",
        label: "Latest invoice",
        value: orders[0]?.id ?? "—",
      },
    ],
  };
}

function loadStoredCustomers(): CustomerRow[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOMERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_CUSTOMERS;
}

interface CustomerFormState {
  company: string;
  email: string;
  plan: CustomerPlan;
  seats: number;
  status: CustomerStatus;
}

const EMPTY_FORM: CustomerFormState = {
  company: "",
  email: "",
  plan: "Pro",
  seats: 5,
  status: "active",
};

export function CustomersView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const hatchId = useChartId();

  const {
    refreshing: revenueRefreshing,
    refreshKey: revenueRefreshKey,
    triggerRefresh: triggerRevenueRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });
  const {
    refreshing: breakdownRefreshing,
    refreshKey: breakdownRefreshKey,
    triggerRefresh: triggerBreakdownRefresh,
  } = useChartRefresh({ onRefresh: props.onRefresh });

  const [customers, setCustomers] = useState<CustomerRow[]>(loadStoredCustomers);
  const [hasModified, setHasModified] = useState(false);

  // Dialog states
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [formState, setFormState] = useState<CustomerFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const [emailTargets, setEmailTargets] = useState<CustomerRow[] | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [deleteTargets, setDeleteTargets] = useState<CustomerRow[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    } catch {
      // Ignore storage write errors
    }
  }, [customers]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const activeCustomersList = state.isEmpty ? [] : customers;

  const summary = useMemo(() => {
    let totalMrr = 0;
    let activeMrr = 0;
    let pastDueMrr = 0;
    let payingAccounts = 0;
    let totalSeats = 0;
    let activeCount = 0;
    let trialCount = 0;
    let pastDueCount = 0;
    let churnedCount = 0;

    for (const customer of activeCustomersList) {
      totalMrr += customer.mrr;
      totalSeats += customer.seats;
      if (customer.mrr > 0) payingAccounts += 1;
      if (customer.status === "active") {
        activeCount += 1;
        activeMrr += customer.mrr;
      } else if (customer.status === "trial") {
        trialCount += 1;
      } else if (customer.status === "past-due") {
        pastDueCount += 1;
        pastDueMrr += customer.mrr;
      } else if (customer.status === "churned") {
        churnedCount += 1;
      }
    }

    const arpa = payingAccounts > 0 ? Math.round(totalMrr / payingAccounts) : 0;

    return {
      totalMrr,
      activeMrr,
      pastDueMrr,
      payingAccounts,
      totalSeats,
      arpa,
      activeCount,
      trialCount,
      pastDueCount,
      churnedCount,
    };
  }, [activeCustomersList]);

  const planBreakdown = useMemo(() => {
    if (activeCustomersList.length === 0) return [];
    const totalMrr = Math.max(summary.totalMrr, 1);

    return PLAN_OPTIONS.map((plan) => {
      const rows = activeCustomersList.filter((c) => c.plan === plan);
      const activeMrr = rows
        .filter((c) => c.status === "active")
        .reduce((acc, c) => acc + c.mrr, 0);
      const pastDueMrr = rows
        .filter((c) => c.status === "past-due")
        .reduce((acc, c) => acc + c.mrr, 0);
      const totalPlanMrr = activeMrr + pastDueMrr;
      const seats = rows.reduce((acc, c) => acc + c.seats, 0);
      return {
        plan,
        accounts: rows.length,
        seats,
        activeMrr,
        pastDueMrr,
        totalMrr: totalPlanMrr,
        sharePct: (totalPlanMrr / totalMrr) * 100,
      };
    });
  }, [activeCustomersList, summary.totalMrr]);

  const rankedPlans = useMemo(() => {
    return [...planBreakdown].sort((a, b) => b.totalMrr - a.totalMrr || b.accounts - a.accounts);
  }, [planBreakdown]);

  const revenueBlockState = getBlockState(state.status, planBreakdown);
  const breakdownBlockState = getBlockState(state.status, rankedPlans);
  const isRevenueBusy = Boolean(state.refreshing || revenueRefreshing);
  const isBreakdownBusy = Boolean(state.refreshing || breakdownRefreshing);

  const recentCustomerGroup = useMemo<CommandMenuGroup>(
    () => ({
      heading: "Top & recent accounts",
      items: activeCustomersList.slice(0, 5).map((row) => ({
        id: `recent-customer-${row.id}`,
        label: row.company,
        description: `${row.email} · ${row.plan} (${STATUS_CONFIG[row.status].label})`,
        meta: row.mrr > 0 ? `${formatCurrency(row.mrr)}/mo` : row.plan,
        icon: <Building2Icon />,
        onSelect: () => setViewingCustomer(row),
      })),
    }),
    [activeCustomersList]
  );

  const searchCustomers = async (query: string): Promise<CommandMenuGroup[]> => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [recentCustomerGroup];

    const matches = activeCustomersList.filter((row) =>
      `${row.company} ${row.email} ${row.plan} ${row.status} ${row.id}`
        .toLowerCase()
        .includes(needle)
    );

    if (matches.length === 0) return [];

    return [
      {
        heading: "Customers",
        items: matches.map((row) => ({
          id: `search-customer-${row.id}`,
          label: row.company,
          description: `${row.email} · ${row.plan} (${STATUS_CONFIG[row.status].label})`,
          meta: row.mrr > 0 ? `${formatCurrency(row.mrr)}/mo` : row.plan,
          icon: <Building2Icon />,
          onSelect: () => setViewingCustomer(row),
        })),
      },
    ];
  };

  const openCreateDialog = () => {
    setEditingCustomer(null);
    setFormState(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditDialog = (customer: CustomerRow) => {
    setEditingCustomer(customer);
    setFormState({
      company: customer.company,
      email: customer.email,
      plan: customer.plan,
      seats: customer.seats,
      status: customer.status,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSaveCustomer = (e: FormEvent) => {
    e.preventDefault();
    const company = formState.company.trim();
    const email = formState.email.trim();
    const seats = Math.max(1, Number(formState.seats) || 1);

    if (!company) {
      setFormError("Company name is required.");
      return;
    }
    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid billing email address.");
      return;
    }

    const mrr = computeMrr(formState.plan, seats, formState.status);

    if (editingCustomer) {
      const updated: CustomerRow = {
        ...editingCustomer,
        company,
        email,
        plan: formState.plan,
        seats,
        status: formState.status,
        mrr,
      };
      setCustomers((prev) =>
        prev.map((row) => (row.id === editingCustomer.id ? updated : row))
      );
      setViewingCustomer((current) =>
        current?.id === editingCustomer.id ? updated : current
      );
      setNotice(`Updated ${company} account.`);
    } else {
      const newCustomer: CustomerRow = {
        id: `cus_${Date.now().toString(36)}`,
        company,
        email,
        plan: formState.plan,
        seats,
        status: formState.status,
        mrr,
        signedUp: new Date().toISOString().slice(0, 10),
      };
      setCustomers((prev) => [newCustomer, ...prev]);
      setNotice(`Added ${company} to customers.`);
    }

    setHasModified(true);
    setFormOpen(false);
  };

  const openEmailDialog = (rows: CustomerRow[]) => {
    setEmailTargets(rows);
    setEmailSubject(
      rows.length === 1
        ? `Account update for ${rows[0].company}`
        : `Update for ${rows.length} customer accounts`
    );
    setEmailBody(
      rows.length === 1
        ? `Hi ${rows[0].company} team,\n\nSharing a quick update regarding your ${rows[0].plan} workspace (${rows[0].seats} seats).\n\nBest regards,\nHamzet Wasel Billing`
        : `Hello,\n\nSharing an important update regarding your Hamzet Wasel subscription.\n\nBest regards,\nHamzet Wasel Billing`
    );
  };

  const handleSendEmail = (e: FormEvent) => {
    e.preventDefault();
    if (!emailTargets || emailTargets.length === 0) return;
    const count = emailTargets.length;
    setEmailTargets(null);
    setNotice(
      count === 1
        ? `Message queued for ${emailTargets[0].email}.`
        : `Message queued for ${count} customer accounts.`
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTargets || deleteTargets.length === 0) return;
    const ids = new Set(deleteTargets.map((row) => row.id));
    setCustomers((prev) => prev.filter((row) => !ids.has(row.id)));
    if (viewingCustomer && ids.has(viewingCustomer.id)) {
      setViewingCustomer(null);
    }
    setHasModified(true);
    setNotice(
      deleteTargets.length === 1
        ? `Removed ${deleteTargets[0].company} from directory.`
        : `Removed ${deleteTargets.length} customers from directory.`
    );
    setDeleteTargets(null);
  };

  const handleResetCustomers = () => {
    setCustomers(DEFAULT_CUSTOMERS);
    setHasModified(false);
    setNotice("Restored sample customer directory.");
  };

  const previewMrr = computeMrr(
    formState.plan,
    Math.max(1, Number(formState.seats) || 1),
    formState.status
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Subtle action confirmation notice */}
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

      {/* Selected Customer Record Detail View (RecordDetail1) */}
      {viewingCustomer ? (
        <Card>
          <CardContent className="pt-6">
            <RecordDetail1
              {...buildCustomerRecordDetail(viewingCustomer)}
              backLabel="Customers"
              onBack={() => setViewingCustomer(null)}
              onEdit={() => openEditDialog(viewingCustomer)}
              onEmail={() => openEmailDialog([viewingCustomer])}
              onDelete={() => setDeleteTargets([viewingCustomer])}
              ordersTitle="Recent invoices"
              status={state.status}
              errorMessage={state.errorMessage}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top KPI Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AreaChartKPI2
          {...mrrKPIProps}
          data={state.isEmpty ? [] : mrrKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...activeCustomersKPIProps}
          data={state.isEmpty ? [] : activeCustomersKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <LineChartKPI1
          {...paidSeatsKPIProps}
          data={state.isEmpty ? [] : paidSeatsKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
        <AreaChartKPI2
          {...expansionKPIProps}
          data={state.isEmpty ? [] : expansionKPIProps.data}
          refreshing={state.refreshing}
          status={state.status}
          errorMessage={state.errorMessage}
        />
      </div>

      {/* Middle Row: MRR by Plan Chart + Plan Distribution Leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <BlockStateProvider
            errorMessage={state.errorMessage}
            state={revenueBlockState}
          >
            <Card className="h-full">
              <CardContent>
                <section className="@container flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Monthly recurring revenue by plan
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Active and past-due recurring billing across subscription tiers.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isRevenueBusy && <BlockBusyIndicator />}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isRevenueBusy}
                        onClick={() => void triggerRevenueRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy
                    refreshing={isRevenueBusy}
                    label="Updating customer revenue"
                  >
                    <div className="flex flex-col gap-4">
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 @lg:grid-cols-3 @lg:items-start">
                        <div className="col-span-2 flex flex-col gap-1 @lg:col-span-1">
                          <dt className="text-muted-foreground text-sm">Monthly MRR</dt>
                          <dd>
                            <KPIValue
                              value={summary.totalMrr}
                              format={(v) => formatCurrency(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {formatNumber(summary.payingAccounts)} paying of{" "}
                              {formatNumber(activeCustomersList.length)} accounts
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">
                            Avg. revenue / account
                          </dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.arpa}
                              format={(v) => formatCurrency(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {formatNumber(summary.totalSeats)} total seats
                            </dd>
                          </BlockReady>
                        </div>

                        <div className="flex flex-col gap-1">
                          <dt className="text-muted-foreground text-sm">Past-due MRR</dt>
                          <dd>
                            <KPIValue
                              className="text-2xl"
                              value={summary.pastDueMrr}
                              format={(v) => formatCurrency(v)}
                            />
                          </dd>
                          <BlockReady className="text-xs">
                            <dd className="text-muted-foreground text-xs tabular-nums">
                              {formatNumber(summary.pastDueCount)} accounts needing follow-up
                            </dd>
                          </BlockReady>
                        </div>
                      </dl>

                      {(!revenueBlockState || revenueBlockState === "loading") && (
                        <ChartPanelLegend
                          items={[
                            { color: "var(--color-chart-2)", label: "Active MRR" },
                            {
                              color: "var(--color-chart-5)",
                              label: "Past-due MRR",
                              shape: "hatched",
                            },
                          ]}
                        />
                      )}

                      {revenueBlockState ? (
                        <ChartPlaceholder height={224} />
                      ) : (
                        <>
                          <ChartPanelFigure key={revenueRefreshKey} className="h-56">
                            <ResponsiveContainer initialDimension={{ width: 480, height: 224 }} width="100%" height="100%">
                              <BarChart
                                aria-label="Monthly recurring revenue by plan"
                                data={planBreakdown}
                                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                              >
                                <defs>
                                  <ChartHatch
                                    color="var(--color-chart-5)"
                                    id={hatchId}
                                  />
                                </defs>
                                <CartesianGrid {...chartGridProps} />
                                <XAxis {...chartAxisProps} dataKey="plan" />
                                <YAxis
                                  {...chartAxisProps}
                                  tickFormatter={(value: number) =>
                                    `$${formatCompact(value)}`
                                  }
                                  width={chartValueAxisWidth}
                                />
                                <Tooltip
                                  cursor={chartBarCursor}
                                  content={(tooltipProps) => (
                                    <ChartTooltipContent
                                      {...tooltipProps}
                                      valueFormatter={(value) => formatCurrency(value)}
                                    />
                                  )}
                                />
                                <Bar
                                  dataKey="activeMrr"
                                  name="Active MRR"
                                  stackId="mrr"
                                  fill="var(--color-chart-2)"
                                  radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                  dataKey="pastDueMrr"
                                  name="Past-due MRR"
                                  stackId="mrr"
                                  fill={`url(#${hatchId})`}
                                  radius={[4, 4, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartPanelFigure>
                          <ChartPanelTable
                            caption="Customer MRR breakdown by plan"
                            columns={[
                              { key: "plan", label: "Plan" },
                              {
                                key: "accounts",
                                label: "Accounts",
                                format: (v) => formatNumber(v),
                              },
                              {
                                key: "activeMrr",
                                label: "Active MRR",
                                format: (v) => formatCurrency(v),
                              },
                              {
                                key: "pastDueMrr",
                                label: "Past-due MRR",
                                format: (v) => formatCurrency(v),
                              },
                            ]}
                            rows={planBreakdown}
                          />
                        </>
                      )}
                    </div>
                  </DashboardBusy>
                </section>
              </CardContent>
            </Card>
          </BlockStateProvider>
        </div>

        <div className="lg:col-span-5">
          <BlockStateProvider
            errorMessage={state.errorMessage}
            state={breakdownBlockState}
          >
            <Card className="h-full">
              <CardContent>
                <section className="@container flex h-full flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h2 className="font-semibold tracking-tight">
                        Plan mix &amp; account health
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Share of recurring revenue and seat footprint by plan.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isBreakdownBusy && <BlockBusyIndicator />}
                      <ChartRefreshButton
                        disabled={state.isLoading}
                        refreshing={isBreakdownBusy}
                        onClick={() => void triggerBreakdownRefresh()}
                      />
                    </div>
                  </header>

                  <DashboardBusy
                    refreshing={isBreakdownBusy}
                    label="Updating plan distribution"
                  >
                    <div className="flex flex-col gap-4 border-t pt-3">
                      <BlockStateRows rows={4} />
                      {!breakdownBlockState && (
                        <Leaderboard key={breakdownRefreshKey}>
                          {rankedPlans.map((item, index) => (
                            <LeaderboardItem key={item.plan} size="lg">
                              <LeaderboardRank variant="badge" medal rank={index + 1} />
                              <LeaderboardBar value={item.sharePct} delay={index * 60} />
                              <LeaderboardLabel>
                                <p className="truncate font-medium">{item.plan}</p>
                                <Details className="text-muted-foreground block truncate text-xs">
                                  <span>
                                    {item.accounts}{" "}
                                    {item.accounts === 1 ? "account" : "accounts"}
                                  </span>
                                  <span>
                                    {formatNumber(item.seats)}{" "}
                                    {item.seats === 1 ? "seat" : "seats"}
                                  </span>
                                </Details>
                              </LeaderboardLabel>
                              <LeaderboardValue className="text-sm">
                                <span>{formatCurrency(item.totalMrr)}</span>
                                <span className="text-muted-foreground block text-xs font-normal">
                                  {formatPercent(item.sharePct / 100, {
                                    maximumFractionDigits: 1,
                                  })}
                                </span>
                              </LeaderboardValue>
                            </LeaderboardItem>
                          ))}
                        </Leaderboard>
                      )}

                      <BlockReady className="border-t pt-3 text-sm">
                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-3 text-xs tabular-nums">
                          <span>{summary.activeCount} Active</span>
                          <span aria-hidden="true">·</span>
                          <span>{summary.trialCount} Trial</span>
                          <span aria-hidden="true">·</span>
                          <span>{summary.pastDueCount} Past due</span>
                          <span aria-hidden="true">·</span>
                          <span>{summary.churnedCount} Churned</span>
                        </div>
                      </BlockReady>
                    </div>
                  </DashboardBusy>
                </section>
              </CardContent>
            </Card>
          </BlockStateProvider>
        </div>
      </div>

      {/* Customer Directory Table */}
      <Card>
        <CardContent className="overflow-x-auto">
          <DataTable6
            title="Customer directory"
            pageSize={8}
            rows={activeCustomersList}
            refreshing={state.refreshing}
            status={state.status}
            errorMessage={state.errorMessage}
            onRefresh={props.onRefresh}
            onViewRow={(row) => setViewingCustomer(row)}
            onEditRow={openEditDialog}
            onEmail={openEmailDialog}
            onDeleteRow={(row) => setDeleteTargets([row])}
            onBulkDelete={(rows) => setDeleteTargets(rows)}
            searchControl={
              <CommandMenu2
                className="w-full @2xl/data-table:w-auto items-stretch"
                emptyMessage="No matching customers found."
                placeholder="Search customers..."
                recent={recentCustomerGroup}
                search={searchCustomers}
                showStatus={false}
                title="Search customers"
                triggerClassName="h-8 w-full @2xl/data-table:w-56 justify-start text-muted-foreground font-normal max-sm:aspect-auto max-sm:px-2.5"
              />
            }
            headerActions={
              <>
                {hasModified && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCustomers}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <RotateCcwIcon className="size-3.5" />
                    Reset
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={state.isLoading}
                  onClick={openCreateDialog}
                  className="h-7 gap-1.5 text-xs"
                >
                  <PlusIcon className="size-3.5" />
                  Add customer
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>
        </>
      )}

      {/* Add / Edit Customer Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveCustomer} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? `Edit ${editingCustomer.company}` : "Add customer"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Update subscription plan, provisioned seats, or billing status."
                  : "Create a new customer workspace account in the directory."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer-company">Company name</Label>
                <Input
                  id="customer-company"
                  value={formState.company}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, company: e.target.value }))
                  }
                  placeholder="Acme Corp"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer-email">Billing email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={formState.email}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="billing@acme.io"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customer-plan">Plan</Label>
                  <select
                    id="customer-plan"
                    value={formState.plan}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        plan: e.target.value as CustomerPlan,
                      }))
                    }
                    className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                  >
                    {PLAN_OPTIONS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan} (${SEAT_PRICE[plan]}/seat)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="customer-seats">Seats</Label>
                  <Input
                    id="customer-seats"
                    type="number"
                    min={1}
                    max={1000}
                    value={formState.seats}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        seats: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer-status">Billing status</Label>
                <select
                  id="customer-status"
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: e.target.value as CustomerStatus,
                    }))
                  }
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                <span className="text-muted-foreground">Calculated Monthly MRR</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatCurrency(previewMrr)}
                </span>
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
                {editingCustomer ? "Save changes" : "Create customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* In-app Email Composer Dialog */}
      <Dialog
        open={Boolean(emailTargets)}
        onOpenChange={(open) => {
          if (!open) setEmailTargets(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Send customer email</DialogTitle>
              <DialogDescription>
                {emailTargets && emailTargets.length === 1
                  ? `Sending to ${emailTargets[0].company} (${emailTargets[0].email})`
                  : `Sending to ${emailTargets?.length ?? 0} selected billing contacts`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-recipients">Recipients</Label>
                <Input
                  id="email-recipients"
                  readOnly
                  value={emailTargets?.map((row) => row.email).join(", ") ?? ""}
                  className="text-muted-foreground text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email-body">Message</Label>
                <Textarea
                  id="email-body"
                  required
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                <SendIcon className="size-3.5" />
                Send message
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTargets)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargets(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {deleteTargets && deleteTargets.length > 1
                ? `Delete ${deleteTargets.length} customers?`
                : `Delete ${deleteTargets?.[0]?.company ?? "customer"}?`}
            </DialogTitle>
            <DialogDescription>
              This removes the selected{" "}
              {deleteTargets && deleteTargets.length > 1 ? "accounts" : "account"} from the
              customer directory and recalculates plan totals.
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

export default CustomersView;
