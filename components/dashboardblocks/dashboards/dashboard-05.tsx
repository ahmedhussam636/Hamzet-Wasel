import {
  Alerts1,
  type Alerts1Props,
} from '@/components/dashboardblocks/alerts/alerts-01'
import {
  BlockBusy,
  BlockStateProvider,
  type BlockStateProps,
} from '@/components/dashboardblocks/block-state'
import { ChartPanel6 } from '@/components/dashboardblocks/chart-panel/chart-panel-06'
import {
  type DateRangePreset,
  DateRangePicker,
  ExportMenu,
  FilterChip,
  FilterMenu,
  getDateRange,
  getPreset,
  getPreviousRange,
} from '@/components/dashboardblocks/dashboard-header'
import {
  type DeployStatus,
  formatDuration,
  shortSha,
} from '@/components/dashboardblocks/deployments'
import { Deployments3 } from '@/components/dashboardblocks/deployments/deployments-03'
import { Deployments4 } from '@/components/dashboardblocks/deployments/deployments-04'
import { Realtime2 } from '@/components/dashboardblocks/realtime/realtime-02'
import { DevOpsAlertBell } from '@/components/dashboardblocks/realtime/devops-alert-bell'
import { ResourceUsageWidget } from '@/components/dashboardblocks/realtime/resource-usage'
import type { StatusLevel, UptimeDay } from '@/components/dashboardblocks/status'
import { Status2 } from '@/components/dashboardblocks/status/status-02'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableStateRows,
} from '@/components/dashboardblocks/table'
import { PersonAvatar } from '@/components/dashboardblocks/team'
import { BlockReady } from '@/components/dashboardblocks/block-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatDate,
  formatDateRange,
  formatNumber,
  formatRelativeTime,
} from '@/lib/dashboardblocks/format'
import { useEffect, useState } from 'react'
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  RotateCcwIcon,
  ServerIcon,
  XCircleIcon,
} from 'lucide-react'

interface Dashboard5Props extends BlockStateProps {
  empty?: boolean
  title: string
  /** The last day of every date range. */
  today: Date
}

const exampleProps: Dashboard5Props = {
  title: 'Platform health',
  today: new Date(Date.UTC(2026, 8, 25)),
}

const DAY = 86_400_000
const HOUR = 3_600_000
const MINUTE = 60_000
const NOW_HOURS = 15

const SERVICES = [
  {
    changeFailureRate: 0.06,
    deploysPerDay: 4.2,
    latency: { p50: 48, p95: 128, p99: 246 },
    leadTimeHours: 14,
    name: 'Web app',
    restoreHours: 1.2,
    share: 0.45,
  },
  {
    changeFailureRate: 0.09,
    deploysPerDay: 2.8,
    latency: { p50: 64, p95: 152, p99: 310 },
    leadTimeHours: 22,
    name: 'API',
    restoreHours: 2.1,
    share: 0.35,
  },
  {
    changeFailureRate: 0.04,
    deploysPerDay: 0.6,
    latency: { p50: 96, p95: 262, p99: 488 },
    leadTimeHours: 46,
    name: 'Payments',
    restoreHours: 3.4,
    share: 0.08,
  },
  {
    changeFailureRate: 0.12,
    deploysPerDay: 1.1,
    latency: { p50: 38, p95: 112, p99: 214 },
    leadTimeHours: 30,
    name: 'Webhooks',
    restoreHours: 0.8,
    share: 0.12,
  },
]

type Service = (typeof SERVICES)[number]
type Percentile = keyof Service['latency']

const INCIDENTS: {
  daysAgo: number
  note: string
  service: string
  slowdown: number
  status: StatusLevel
  uptime: number
}[] = [
  {
    daysAgo: 0,
    note: 'Elevated error rate in eu-west-1',
    service: 'API',
    slowdown: 1.15,
    status: 'partial',
    uptime: 99.2,
  },
  {
    daysAgo: 0,
    note: 'Slow responses in us-east-1',
    service: 'Web app',
    slowdown: 2.2,
    status: 'degraded',
    uptime: 99.8,
  },
  {
    daysAgo: 3,
    note: 'Elevated 5xx errors for 42 min',
    service: 'API',
    slowdown: 1.9,
    status: 'partial',
    uptime: 97.1,
  },
  {
    daysAgo: 4,
    note: 'Increased latency',
    service: 'API',
    slowdown: 1.3,
    status: 'degraded',
    uptime: 99.6,
  },
  {
    daysAgo: 12,
    note: 'Slow page loads in EU for 25 min',
    service: 'Web app',
    slowdown: 1.4,
    status: 'degraded',
    uptime: 99.4,
  },
  {
    daysAgo: 20,
    note: 'Delayed deliveries for 18 min',
    service: 'Webhooks',
    slowdown: 1.5,
    status: 'degraded',
    uptime: 99.7,
  },
  {
    daysAgo: 31,
    note: 'Full outage for 1 h 6 min',
    service: 'API',
    slowdown: 2.4,
    status: 'major',
    uptime: 95.4,
  },
  {
    daysAgo: 38,
    note: 'Card processor timeouts for 31 min',
    service: 'Payments',
    slowdown: 2.1,
    status: 'partial',
    uptime: 97.9,
  },
  {
    daysAgo: 47,
    note: 'Scheduled database upgrade',
    service: 'Web app',
    slowdown: 1,
    status: 'maintenance',
    uptime: 100,
  },
  {
    daysAgo: 66,
    note: 'Increased latency',
    service: 'API',
    slowdown: 1.3,
    status: 'degraded',
    uptime: 99.8,
  },
]

const ALERTS: (Omit<NonNullable<Alerts1Props['alerts']>[number], 'firedAt'> & {
  minutesAgo: number
})[] = [
  {
    id: 'a1',
    minutesAgo: 4,
    service: 'API',
    region: 'eu-west-1',
    severity: 'critical',
    title: 'Error rate above 5% for 10 minutes',
  },
  {
    id: 'a2',
    minutesAgo: 18,
    service: 'Payments',
    severity: 'critical',
    title: 'Queue backlog over 10,000 jobs',
  },
  {
    id: 'a3',
    minutesAgo: 52,
    service: 'Web app',
    region: 'us-east-1',
    severity: 'warning',
    title: 'p95 response time above 250 ms',
  },
  {
    acknowledged: true,
    id: 'a4',
    minutesAgo: 135,
    service: 'API',
    severity: 'warning',
    title: 'Disk usage above 80%',
  },
  {
    id: 'a5',
    minutesAgo: 210,
    service: 'Webhooks',
    severity: 'warning',
    title: 'Retry queue growing for 30 minutes',
  },
  {
    id: 'a6',
    minutesAgo: 310,
    service: 'Payments',
    severity: 'info',
    title: 'Nightly invoice run took 2× longer than usual',
  },
]

const PIPELINES = [
  {
    medianDuration: 412,
    name: 'web-app',
    runs: 'sssssfsssssssssssssfssssssssss',
    service: 'Web app',
  },
  {
    medianDuration: 2_904,
    name: 'web-e2e',
    runs: 'ssfssffsssfsssssffssssfsssfsss',
    service: 'Web app',
  },
  {
    medianDuration: 538,
    name: 'api',
    runs: 'sssssssssfssssssssssssssssssss',
    service: 'API',
  },
  {
    medianDuration: 1_126,
    name: 'api-e2e',
    runs: 'ssssssssssssssssssffssssssssss',
    service: 'API',
  },
  {
    medianDuration: 1_386,
    name: 'payments',
    runs: 'sssssssssssssssssssssssssssssr',
    service: 'Payments',
  },
  {
    medianDuration: 244,
    name: 'webhooks',
    runs: 'sssfssssssssssfssssssssssfssss',
    service: 'Webhooks',
  },
]

const RUN_STATUS: Record<string, DeployStatus> = {
  f: 'failed',
  r: 'running',
  s: 'success',
}

const DEPLOYMENTS: {
  author: string
  duration: number
  environment: 'Production' | 'Staging'
  id: string
  message: string
  minutesAgo: number
  service: string
  sha: string
  status: DeployStatus
}[] = [
  {
    author: 'Ana Lima',
    duration: 94,
    environment: 'Production',
    id: 'd1',
    message: 'Fix currency rounding on invoices',
    minutesAgo: 2,
    service: 'Payments',
    sha: '9f3c2a17b',
    status: 'running',
  },
  {
    author: 'Kenji Mori',
    duration: 187,
    environment: 'Production',
    id: 'd2',
    message: 'Add retry to webhook delivery',
    minutesAgo: 38,
    service: 'Webhooks',
    sha: '41be08d3c',
    status: 'success',
  },
  {
    author: 'Sara Okafor',
    duration: 66,
    environment: 'Production',
    id: 'd3',
    message: 'Upgrade image pipeline',
    minutesAgo: 95,
    service: 'Web app',
    sha: 'c07d9e412',
    status: 'queued',
  },
  {
    author: 'Diego Alvarez',
    duration: 241,
    environment: 'Staging',
    id: 'd4',
    message: 'Paginate the audit log endpoint',
    minutesAgo: 130,
    service: 'API',
    sha: '7a21f0c95',
    status: 'failed',
  },
  {
    author: 'Sara Okafor',
    duration: 143,
    environment: 'Production',
    id: 'd5',
    message: 'Cache pricing page for 60 seconds',
    minutesAgo: 205,
    service: 'Web app',
    sha: 'e5d8b3a01',
    status: 'success',
  },
  {
    author: 'Mei Tanaka',
    duration: 198,
    environment: 'Production',
    id: 'd6',
    message: 'Rate limit token refresh',
    minutesAgo: 280,
    service: 'API',
    sha: '3c9e17d44',
    status: 'success',
  },
  {
    author: 'Kenji Mori',
    duration: 172,
    environment: 'Staging',
    id: 'd7',
    message: 'Sign webhook payloads with rotating keys',
    minutesAgo: 410,
    service: 'Webhooks',
    sha: 'b82f6e0d7',
    status: 'success',
  },
  {
    author: 'Ana Lima',
    duration: 305,
    environment: 'Production',
    id: 'd8',
    message: 'Retry declined cards once after 3DS',
    minutesAgo: 1_520,
    service: 'Payments',
    sha: '5e0a93c62',
    status: 'success',
  },
]

interface Query {
  preset: DateRangePreset
  service: string | null
}

const LATENCY_SLO_MS = 200

const ms = (value: number) => `${formatNumber(value, { maximumFractionDigits: 0 })} ms`

function weigh(services: Service[], value: (service: Service) => number) {
  const total = services.reduce((sum, service) => sum + service.share, 0)
  return (
    services.reduce((sum, service) => sum + service.share * value(service), 0) / total
  )
}

function latencyAt(
  service: Service,
  percentile: Percentile,
  daysAgo: number,
  hour?: number,
) {
  const incident = INCIDENTS.find(
    (item) => item.service === service.name && item.daysAgo === daysAgo,
  )
  const load =
    hour === undefined
      ? 1 + Math.sin(daysAgo / 4 + service.share * 10) * 0.07
      : 0.82 + Math.sin(((hour - 8) / 24) * Math.PI * 2) * 0.18
  const drift = 1 + daysAgo * 0.0012
  return service.latency[percentile] * load * drift * (incident?.slowdown ?? 1)
}

function deliveryAt(service: Service, daysAgo: number, today: Date) {
  const weekday = new Date(today.getTime() - daysAgo * DAY).getUTCDay()
  const weekend = weekday === 0 || weekday === 6
  const wobble = Math.sin(daysAgo / 6 + service.share * 7)
  const drift = 1 + daysAgo * 0.004
  const deploys = service.deploysPerDay * (weekend ? 0.2 : 1.32) * (1 + wobble * 0.15)
  return {
    changeFailureRate: service.changeFailureRate * (1 + wobble * 0.2) * drift,
    deploys,
    leadTimeHours: service.leadTimeHours * (1 - wobble * 0.1) * drift,
    restoreHours: service.restoreHours * (1 + wobble * 0.25) * drift,
  }
}

function doraFor(services: Service[], days: number, shift: number, today: Date) {
  let deploys = 0
  let failures = 0
  let leadTime = 0
  let restore = 0
  for (const service of services) {
    for (let daysAgo = shift; daysAgo < shift + days; daysAgo++) {
      const day = deliveryAt(service, daysAgo, today)
      deploys += day.deploys
      failures += day.deploys * day.changeFailureRate
      leadTime += day.deploys * day.leadTimeHours
      restore += day.deploys * day.changeFailureRate * day.restoreHours
    }
  }
  return {
    changeFailureRate: failures / deploys,
    deploysPerDay: deploys / days,
    leadTimeHours: leadTime / deploys,
    restoreHours: restore / failures,
  }
}

function uptimeDays(service: string, today: Date): UptimeDay[] {
  return Array.from({ length: 90 }, (_, index) => {
    const daysAgo = 89 - index
    const incident = INCIDENTS.find(
      (item) => item.service === service && item.daysAgo === daysAgo,
    )
    return {
      label: formatDate(new Date(today.getTime() - daysAgo * DAY), 'date'),
      note: incident?.note,
      status: incident?.status ?? 'operational',
      uptime: incident?.uptime ?? 100,
    }
  })
}

function buildOpsData({ preset, service }: Query, today: Date) {
  const hourly = preset === 'today'
  const days = getPreset(preset).days
  const range = getDateRange(preset, today)
  const previousRange = getPreviousRange(range)
  const services = service ? SERVICES.filter((item) => item.name === service) : SERVICES

  const point = (daysAgo: number, hour?: number) => ({
    p50: Math.round(weigh(services, (item) => latencyAt(item, 'p50', daysAgo, hour))),
    p95: Math.round(weigh(services, (item) => latencyAt(item, 'p95', daysAgo, hour))),
    p99: Math.round(weigh(services, (item) => latencyAt(item, 'p99', daysAgo, hour))),
  })
  const latency = hourly
    ? Array.from({ length: NOW_HOURS + 1 }, (_, hour) => ({
        label: `${String(hour).padStart(2, '0')}:00`,
        ...point(0, hour),
      }))
    : Array.from({ length: days }, (_, index) => {
        const daysAgo = days - 1 - index
        return {
          label: formatDate(new Date(today.getTime() - daysAgo * DAY), 'day'),
          ...point(daysAgo),
        }
      })
  const latencyPrevious = hourly ? point(1, NOW_HOURS).p95 : point(1).p95

  const now = new Date(today.getTime() + NOW_HOURS * HOUR)
  const matches = (item: { service: string }) => !service || item.service === service

  return {
    alerts: ALERTS.filter(matches).map(({ minutesAgo, ...alert }) => ({
      ...alert,
      firedAt: new Date(now.getTime() - minutesAgo * MINUTE),
    })),
    deployments: DEPLOYMENTS.filter(matches)
      .slice(0, 6)
      .map(({ minutesAgo, ...deployment }) => ({
        ...deployment,
        startedAt: new Date(now.getTime() - minutesAgo * MINUTE),
      })),
    dora: {
      current: doraFor(services, days, 0, today),
      previous: doraFor(services, days, days, today),
    },
    latency,
    latencyPrevious,
    now,
    pipelines: PIPELINES.filter(matches).map((pipeline) => ({
      medianDuration: pipeline.medianDuration,
      name: pipeline.name,
      runs: pipeline.runs.split('').map((run) => RUN_STATUS[run]),
    })),
    previousLabel: hourly ? 'yesterday' : formatDateRange(previousRange),
    uptime: services.map((item) => ({
      days: uptimeDays(item.name, today),
      name: item.name,
    })),
  }
}

const THROUGHPUT = Array.from({ length: 60 }, (_, index) => {
  const wave = index % 28 < 14 ? index % 14 : 14 - (index % 14)
  const requests = 780 + wave * 16 + ((index * 37) % 11) * 9
  return { errors: Math.round(requests * (index % 17 === 5 ? 0.021 : 0.0018)), requests }
})

function DeploymentStatusBadge({ status }: { status: DeployStatus }) {
  switch (status) {
    case 'success':
      return (
        <Badge
          variant='outline'
          className='border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'
        >
          <CheckCircle2Icon data-icon='inline-start' />
          Success
        </Badge>
      )
    case 'running':
    case 'queued':
      return (
        <Badge
          variant='outline'
          className='border-amber-500/35 bg-amber-500/12 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300'
        >
          <ClockIcon data-icon='inline-start' />
          Pending
        </Badge>
      )
    case 'failed':
      return (
        <Badge
          variant='outline'
          className='border-red-500/30 bg-red-500/12 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300'
        >
          <XCircleIcon data-icon='inline-start' />
          Failed
        </Badge>
      )
    case 'rolled-back':
      return (
        <Badge
          variant='outline'
          className='border-orange-500/30 bg-orange-500/12 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300'
        >
          <RotateCcwIcon data-icon='inline-start' />
          Rolled back
        </Badge>
      )
  }
}

const Dashboard5 = (props: Dashboard5Props) => {
  const { empty = false, errorMessage, status, title, today } = props
  const [query, setQuery] = useState<Query>({ preset: '30d', service: null })
  const [displayedQuery, setDisplayedQuery] = useState(query)
  const [envFilter, setEnvFilter] = useState<'All' | 'Production' | 'Staging'>('All')
  const busy = displayedQuery !== query

  useEffect(() => {
    if (displayedQuery === query) return
    const timer = setTimeout(() => setDisplayedQuery(query), 500)
    return () => clearTimeout(timer)
  }, [query, displayedQuery])

  const update = (patch: Partial<Query>) =>
    setQuery((current) => ({ ...current, ...patch }))
  const data = buildOpsData(displayedQuery, today)
  const range = getDateRange(query.preset, today)
  const visibleDeployments = data.deployments.filter((item) =>
    envFilter === 'All' ? true : item.environment === envFilter,
  )

  return (
    <BlockStateProvider
      errorMessage={errorMessage}
      state={status ?? (empty ? 'empty' : undefined)}
    >
      <div className='@container flex w-full flex-col gap-8'>
        <header className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <h1 className='min-w-0 text-2xl font-semibold tracking-tight'>{title}</h1>
            <div className='flex shrink-0 items-center gap-2'>
              <DevOpsAlertBell
                alerts={empty ? [] : data.alerts}
                deployments={empty ? [] : data.deployments}
                disabled={status !== undefined || empty}
                empty={empty}
                now={data.now}
                serviceFilter={displayedQuery.service}
              />
              <ExportMenu disabled={status !== undefined || empty} onExport={() => {}} />
            </div>
          </div>
          <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
            <p className='text-muted-foreground min-w-0 leading-relaxed'>
              Showing{' '}
              <DateRangePicker
                onValueChange={(preset) => update({ preset })}
                today={today}
                value={query.preset}
                variant='inline'
              />
              <span aria-live='polite'>
                , {formatDateRange(range)}, compared with{' '}
                {formatDateRange(getPreviousRange(range))}.
              </span>
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              {query.service && (
                <FilterChip
                  field='Service'
                  value={query.service}
                  onRemove={() => update({ service: null })}
                />
              )}
              <FilterMenu
                allLabel='All services'
                label='Service'
                onValueChange={(service) => update({ service })}
                options={SERVICES.map((item) => item.name)}
                value={query.service}
              >
                <ServerIcon
                />
                {query.service ? 'Change service' : 'Filter by service'}
              </FilterMenu>
            </div>
          </div>
        </header>
        <div className='flex flex-col gap-4'>
          <div className='grid gap-4 @5xl:grid-cols-2'>
            <Realtime2
              errorMessage={errorMessage}
              status={status}
              description='Requests per second across every service, over the last 5 minutes.'
              samples={empty ? [] : THROUGHPUT}
              title='Throughput'
            />
            <ResourceUsageWidget
              empty={empty}
              errorMessage={errorMessage}
              serviceFilter={displayedQuery.service}
              status={status}
              title='Resource usage'
            />
          </div>
          <BlockBusy
            busy={busy}
            label='Updating the dashboard'
            className='grid gap-4 @4xl:grid-cols-3'
          >
            <div className='grid @4xl:col-span-3'>
              <Deployments3
                errorMessage={errorMessage}
                status={status}
                comparison={
                  displayedQuery.preset === 'today'
                    ? 'yesterday'
                    : `in the ${getPreset(displayedQuery.preset).days} days before`
                }
                current={empty ? undefined : data.dora.current}
                previous={empty ? undefined : data.dora.previous}
                title='Delivery performance'
              />
            </div>
            <div className='grid @4xl:col-span-2'>
              <ChartPanel6
                errorMessage={errorMessage}
                status={status}
                comparison={
                  displayedQuery.preset === 'today'
                    ? 'this time yesterday'
                    : 'the day before'
                }
                data={empty ? [] : data.latency}
                description='Half of all requests finish within p50, and all but the slowest 1% within p99.'
                formatter={ms}
                headline='p95'
                labelHeading={displayedQuery.preset === 'today' ? 'Hour' : 'Day'}
                limit={{ label: 'SLO', value: LATENCY_SLO_MS }}
                percentiles={[
                  { key: 'p50', label: 'p50' },
                  { key: 'p95', label: 'p95' },
                  { key: 'p99', label: 'p99' },
                ]}
                previous={empty ? undefined : data.latencyPrevious}
                title='Response time'
              />
            </div>
            <Alerts1
              errorMessage={errorMessage}
              status={status}
              alerts={empty ? [] : data.alerts}
              now={data.now}
              title='Open alerts'
            />
            <div className='grid @4xl:col-span-2'>
              <Status2
                errorMessage={errorMessage}
                status={status}
                services={empty ? [] : data.uptime}
                title='Uptime, last 90 days'
              />
            </div>
            <Deployments4
              errorMessage={errorMessage}
              status={status}
              pipelines={empty ? [] : data.pipelines}
              title='Build health'
            />
            <div className='grid @4xl:col-span-3'>
              <BlockStateProvider
                errorMessage={errorMessage}
                state={status ?? (empty ? 'empty' : undefined)}
              >
                <Card>
                  <CardContent className='overflow-x-auto'>
                    <section className='@container/data-table flex flex-col gap-4'>
                      <header className='flex flex-wrap items-start justify-between gap-3'>
                        <div className='flex min-w-0 flex-col gap-0.5'>
                          <h2 className='font-semibold tracking-tight'>
                            Recent deployments
                          </h2>
                          <BlockReady className='text-sm'>
                            <p className='text-muted-foreground text-sm'>
                              {visibleDeployments.length} recent{' '}
                              {visibleDeployments.length === 1
                                ? 'deployment'
                                : 'deployments'}{' '}
                              across active environments.
                            </p>
                          </BlockReady>
                        </div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <div
                            role='tablist'
                            aria-label='Filter deployments by environment'
                            className='bg-muted inline-flex items-center rounded-lg p-0.5'
                          >
                            {(['All', 'Production', 'Staging'] as const).map((env) => {
                              const active = envFilter === env
                              return (
                                <button
                                  key={env}
                                  type='button'
                                  role='tab'
                                  aria-selected={active}
                                  onClick={() => setEnvFilter(env)}
                                  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                                    active
                                      ? 'bg-background text-foreground shadow-xs'
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {env}
                                </button>
                              )
                            })}
                          </div>
                          <a
                            href='#/devops/pipelines'
                            className='inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap'
                          >
                            CI/CD Pipelines
                            <ArrowUpRightIcon className='size-3.5 text-muted-foreground' />
                          </a>
                        </div>
                      </header>

                      <div className='border-t pt-1'>
                        <DataTable density='compact' caption='Recent deployments'>
                          <DataTableHeader>
                            <DataTableRow>
                              <DataTableHead>Deployment</DataTableHead>
                              <DataTableHead>Service</DataTableHead>
                              <DataTableHead>Environment</DataTableHead>
                              <DataTableHead>Status</DataTableHead>
                              <DataTableHead align='end'>Duration</DataTableHead>
                              <DataTableHead align='end'>Timestamp</DataTableHead>
                            </DataTableRow>
                          </DataTableHeader>
                          <DataTableBody>
                            <DataTableStateRows colSpan={6} rows={5} />
                            {!status && !empty && visibleDeployments.length === 0 && (
                              <DataTableRow>
                                <DataTableCell
                                  colSpan={6}
                                  className='py-8 text-center text-sm text-muted-foreground'
                                >
                                  No deployments found for {envFilter}.
                                </DataTableCell>
                              </DataTableRow>
                            )}
                            {!status &&
                              !empty &&
                              visibleDeployments.map((deployment) => (
                                <DataTableRow key={deployment.id}>
                                  <DataTableCell primary truncate>
                                    <div className='flex items-center gap-2.5'>
                                      <PersonAvatar
                                        person={{ name: deployment.author }}
                                        size='sm'
                                      />
                                      <div className='min-w-0'>
                                        <span className='block truncate font-medium text-foreground'>
                                          {deployment.message}
                                        </span>
                                        <span className='text-muted-foreground block text-xs font-normal'>
                                          <span className='font-mono'>
                                            {shortSha(deployment.sha)}
                                          </span>{' '}
                                          · {deployment.author}
                                        </span>
                                      </div>
                                    </div>
                                  </DataTableCell>
                                  <DataTableCell className='text-muted-foreground'>
                                    {deployment.service}
                                  </DataTableCell>
                                  <DataTableCell className='font-medium'>
                                    {deployment.environment}
                                  </DataTableCell>
                                  <DataTableCell>
                                    <DeploymentStatusBadge status={deployment.status} />
                                  </DataTableCell>
                                  <DataTableCell align='end' className='tabular-nums'>
                                    {formatDuration(deployment.duration)}
                                  </DataTableCell>
                                  <DataTableCell align='end' className='tabular-nums'>
                                    <div className='flex flex-col items-end'>
                                      <time
                                        dateTime={deployment.startedAt.toISOString()}
                                        className='text-sm text-foreground'
                                      >
                                        {formatRelativeTime(deployment.startedAt, data.now)}
                                      </time>
                                      <span className='text-muted-foreground text-xs'>
                                        {deployment.startedAt.toISOString().slice(11, 16)}{' '}
                                        UTC
                                      </span>
                                    </div>
                                  </DataTableCell>
                                </DataTableRow>
                              ))}
                          </DataTableBody>
                        </DataTable>
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </BlockStateProvider>
            </div>
          </BlockBusy>
        </div>
      </div>
    </BlockStateProvider>
  )
}

export { Dashboard5, exampleProps as dashboard5ExampleProps, type Dashboard5Props }
