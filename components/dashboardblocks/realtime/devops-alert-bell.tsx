'use client'

import { useMemo, useRef, useState } from 'react'
import type { AlertSeverity } from '@/components/dashboardblocks/alerts'
import type { DeployStatus } from '@/components/dashboardblocks/deployments'
import { shortSha } from '@/components/dashboardblocks/deployments'
import { LiveBadge, formatAgo, useInterval } from '@/components/dashboardblocks/realtime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { formatRelativeTime } from '@/lib/dashboardblocks/format'
import { cn } from '@/lib/utils'
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  BellIcon,
  CheckCheckIcon,
  CheckIcon,
  PauseIcon,
  PlayIcon,
  RocketIcon,
  ShieldAlertIcon,
  XCircleIcon,
} from 'lucide-react'

export interface DevOpsBellAlertInput {
  acknowledged?: boolean
  firedAt: Date
  id: string
  region?: string
  service: string
  severity: AlertSeverity
  title: string
}

export interface DevOpsBellDeploymentInput {
  author: string
  environment: 'Production' | 'Staging'
  id: string
  message: string
  service: string
  sha: string
  startedAt: Date
  status: DeployStatus
}

export interface DevOpsAlertBellProps {
  alerts: DevOpsBellAlertInput[]
  deployments: DevOpsBellDeploymentInput[]
  disabled?: boolean
  empty?: boolean
  now: Date
  serviceFilter?: string | null
}

type BellCategory = 'alert' | 'deployment'
type BellFilter = 'all' | BellCategory

interface DevOpsBellNotification {
  category: BellCategory
  context: string
  id: string
  isLive?: boolean
  service: string
  severity: AlertSeverity
  timestamp: Date
  title: string
}

const LIVE_EVENT_TEMPLATES: Omit<DevOpsBellNotification, 'id' | 'isLive' | 'timestamp'>[] = [
  {
    category: 'deployment',
    context: 'Production · e91b4c2',
    service: 'Payments',
    severity: 'critical',
    title: 'Deployment failed: Canary health check timed out on payments-worker',
  },
  {
    category: 'alert',
    context: 'eu-west-2 · eu-west-api-02',
    service: 'API',
    severity: 'critical',
    title: 'CPU throttling above 90% for 3 consecutive probes',
  },
  {
    category: 'deployment',
    context: 'Staging · 4a8d10e',
    service: 'Webhooks',
    severity: 'critical',
    title: 'Deployment failed: Rollout aborted after HTTP 502 spike',
  },
  {
    category: 'alert',
    context: 'us-east-1 · Edge ingress',
    service: 'Web app',
    severity: 'warning',
    title: 'Edge cache hit ratio dropped below 82% threshold',
  },
  {
    category: 'alert',
    context: 'me-central-1 · Ledger DB',
    service: 'Payments',
    severity: 'warning',
    title: 'Replica lag exceeded 450 ms during settlement batch',
  },
  {
    category: 'deployment',
    context: 'Production · 6c2f91a',
    service: 'API',
    severity: 'critical',
    title: 'Deployment failed: Readiness probe failed on auth-gateway',
  },
]

function SeverityChip({
  category,
  severity,
}: {
  category: BellCategory
  severity: AlertSeverity
}) {
  if (category === 'deployment') {
    return (
      <Badge
        variant='outline'
        className='border-red-500/30 bg-red-500/12 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300'
      >
        <XCircleIcon data-icon='inline-start' />
        Deploy Failed
      </Badge>
    )
  }

  if (severity === 'critical') {
    return (
      <Badge
        variant='outline'
        className='border-red-500/30 bg-red-500/12 text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300'
      >
        <ShieldAlertIcon data-icon='inline-start' />
        Critical Alert
      </Badge>
    )
  }

  if (severity === 'warning') {
    return (
      <Badge
        variant='outline'
        className='border-amber-500/35 bg-amber-500/12 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300'
      >
        <AlertTriangleIcon data-icon='inline-start' />
        System Warning
      </Badge>
    )
  }

  return (
    <Badge
      variant='outline'
      className='border-sky-500/30 bg-sky-500/12 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300'
    >
      <BellIcon data-icon='inline-start' />
      System Notice
    </Badge>
  )
}

export function DevOpsAlertBell({
  alerts,
  deployments,
  disabled = false,
  empty = false,
  now,
  serviceFilter = null,
}: DevOpsAlertBellProps) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<BellFilter>('all')
  const [paused, setPaused] = useState(false)
  const [liveEvents, setLiveEvents] = useState<DevOpsBellNotification[]>([])
  const [liveClock, setLiveClock] = useState<Date>(() => new Date())
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(() => new Set())
  const templateCursor = useRef(0)

  useInterval(
    () => {
      const pool = serviceFilter
        ? LIVE_EVENT_TEMPLATES.filter((t) => t.service === serviceFilter)
        : LIVE_EVENT_TEMPLATES
      const candidates = pool.length > 0 ? pool : LIVE_EVENT_TEMPLATES
      const nextTemplate = candidates[templateCursor.current % candidates.length]
      templateCursor.current += 1
      const currentTime = new Date()
      setLiveClock(currentTime)
      setLiveEvents((prev) => {
        const created: DevOpsBellNotification = {
          ...nextTemplate,
          id: `live-${currentTime.getTime()}-${templateCursor.current}`,
          isLive: true,
          timestamp: currentTime,
        }
        return [created, ...prev].slice(0, 8)
      })
    },
    disabled || empty || paused ? null : 14000,
  )

  const seededEvents = useMemo<DevOpsBellNotification[]>(() => {
    if (empty) return []

    const failedDeploymentItems: DevOpsBellNotification[] = deployments
      .filter((d) => d.status === 'failed')
      .map((d) => ({
        category: 'deployment' as const,
        context: `${d.environment} · ${shortSha(d.sha)} · ${d.author}`,
        id: `deploy-fail-${d.id}`,
        service: d.service,
        severity: 'critical' as const,
        timestamp: d.startedAt,
        title: `Deployment failed: ${d.message}`,
      }))

    const systemAlertItems: DevOpsBellNotification[] = alerts
      .filter((a) => !a.acknowledged)
      .map((a) => ({
        category: 'alert' as const,
        context: a.region ? `${a.region}` : 'Cluster-wide',
        id: `alert-${a.id}`,
        service: a.service,
        severity: a.severity,
        timestamp: a.firedAt,
        title: a.title,
      }))

    return [...failedDeploymentItems, ...systemAlertItems].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    )
  }, [alerts, deployments, empty])

  const allNotifications = useMemo(() => {
    if (empty) return []
    const scopedLive = serviceFilter
      ? liveEvents.filter((item) => item.service === serviceFilter)
      : liveEvents
    return [...scopedLive, ...seededEvents]
  }, [empty, liveEvents, seededEvents, serviceFilter])

  const unreadNotifications = useMemo(
    () => allNotifications.filter((item) => !readIds.has(item.id)),
    [allNotifications, readIds],
  )
  const unreadCount = unreadNotifications.length
  const hasUnreadCriticalOrFailure = unreadNotifications.some(
    (item) => item.category === 'deployment' || item.severity === 'critical',
  )

  const alertCount = allNotifications.filter((n) => n.category === 'alert').length
  const failureCount = allNotifications.filter((n) => n.category === 'deployment').length

  const visibleNotifications = useMemo(() => {
    if (filter === 'all') return allNotifications
    return allNotifications.filter((n) => n.category === filter)
  }, [allNotifications, filter])

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const markAllRead = () => {
    setReadIds(new Set(allNotifications.map((n) => n.id)))
  }

  const navigateFromNotification = (hash: string, id: string) => {
    markRead(id)
    setOpen(false)
    window.location.hash = hash
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        nativeButton={true}
        disabled={disabled}
        render={
          <Button
            type='button'
            variant='outline'
            size='default'
            disabled={disabled}
            aria-label={`DevOps system alerts and deployment failures (${unreadCount} unread)`}
            className='relative gap-2 whitespace-nowrap shrink-0 cursor-pointer'
          >
            <BellIcon className='size-4 text-muted-foreground' />
            <span className='hidden sm:inline'>Alerts</span>
            {unreadCount > 0 && (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold text-white tabular-nums',
                  hasUnreadCriticalOrFailure
                    ? 'bg-red-600 dark:bg-red-500'
                    : 'bg-amber-600 dark:bg-amber-500',
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <SheetContent
        side='right'
        className='flex w-full flex-col gap-0 overflow-hidden bg-background p-0 sm:max-w-md'
      >
        <div className='border-b px-5 pt-5 pb-4 pr-12'>
          <div className='flex items-center justify-between gap-2'>
            <SheetTitle className='text-base font-semibold tracking-tight'>
              DevOps Alerts &amp; Failures
            </SheetTitle>
            {!empty && <LiveBadge paused={paused} />}
          </div>
          <SheetDescription className='mt-1 text-xs'>
            Real-time system alerts and deployment failures
            {serviceFilter ? ` for ${serviceFilter}` : ' across all platform services'}.
          </SheetDescription>

          <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
            <div
              role='tablist'
              aria-label='Filter DevOps notifications'
              className='bg-muted inline-flex items-center rounded-lg p-0.5'
            >
              {(
                [
                  { id: 'all', label: `All (${allNotifications.length})` },
                  { id: 'alert', label: `Alerts (${alertCount})` },
                  { id: 'deployment', label: `Failures (${failureCount})` },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id
                return (
                  <button
                    key={tab.id}
                    type='button'
                    role='tab'
                    aria-selected={active}
                    onClick={() => setFilter(tab.id)}
                    className={cn(
                      'cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                      active
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className='flex items-center gap-1.5'>
              <Button
                type='button'
                variant='outline'
                size='xs'
                onClick={() => setPaused((p) => !p)}
                className='gap-1'
              >
                {paused ? (
                  <>
                    <PlayIcon className='size-3 fill-current' />
                    Resume
                  </>
                ) : (
                  <>
                    <PauseIcon className='size-3 fill-current' />
                    Pause
                  </>
                )}
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='xs'
                disabled={unreadCount === 0}
                onClick={markAllRead}
                className='gap-1'
              >
                <CheckCheckIcon className='size-3.5' />
                Mark all read
              </Button>
            </div>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-5 py-2'>
          {visibleNotifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-2 py-14 text-center'>
              <BellIcon className='size-8 text-muted-foreground/50' />
              <p className='text-sm font-medium text-foreground'>
                No active alerts or deployment failures
              </p>
              <p className='max-w-xs text-xs text-muted-foreground'>
                {filter !== 'all'
                  ? 'No events match the current filter. Switch back to All to inspect all telemetry.'
                  : 'All monitored services and recent deployments are currently healthy.'}
              </p>
              {filter !== 'all' && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setFilter('all')}
                  className='mt-2'
                >
                  Show all events
                </Button>
              )}
            </div>
          ) : (
            <ul className='divide-y divide-border'>
              {visibleNotifications.map((item) => {
                const isRead = readIds.has(item.id)
                const timeLabel = item.isLive
                  ? formatAgo(item.timestamp, liveClock)
                  : formatRelativeTime(item.timestamp, now)
                const destinationHash =
                  item.category === 'deployment'
                    ? '#/devops/pipelines'
                    : '#/devops/incidents'
                const destinationLabel =
                  item.category === 'deployment' ? 'View pipeline' : 'View incident'

                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex flex-col gap-2 py-3.5 transition-opacity',
                      isRead && 'opacity-65',
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <SeverityChip category={item.category} severity={item.severity} />
                      <time
                        dateTime={item.timestamp.toISOString()}
                        className='text-xs text-muted-foreground tabular-nums'
                      >
                        {timeLabel}
                      </time>
                    </div>

                    <p
                      className={cn(
                        'text-sm leading-snug text-foreground',
                        !isRead ? 'font-medium' : 'font-normal text-muted-foreground',
                      )}
                    >
                      {item.title}
                    </p>

                    <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                      <span className='font-medium text-foreground/80'>{item.service}</span>
                      <span aria-hidden='true'>·</span>
                      <span>{item.context}</span>
                    </div>

                    <div className='flex items-center justify-between gap-2 pt-0.5'>
                      <button
                        type='button'
                        onClick={() => navigateFromNotification(destinationHash, item.id)}
                        className='inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-foreground hover:underline'
                      >
                        {item.category === 'deployment' ? (
                          <RocketIcon className='size-3 text-muted-foreground' />
                        ) : (
                          <AlertTriangleIcon className='size-3 text-muted-foreground' />
                        )}
                        {destinationLabel}
                        <ArrowUpRightIcon className='size-3 text-muted-foreground' />
                      </button>

                      {isRead ? (
                        <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                          <CheckIcon className='size-3' />
                          Acknowledged
                        </span>
                      ) : (
                        <Button
                          type='button'
                          variant='ghost'
                          size='xs'
                          onClick={() => markRead(item.id)}
                          className='h-6 px-2 text-xs'
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
