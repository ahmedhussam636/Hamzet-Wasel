'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BlockStateProvider,
  type BlockStateProps,
  getBlockState,
} from '@/components/dashboardblocks/block-state'
import {
  ChartPlaceholder,
  ChartTooltipContent,
  chartAxisProps,
  chartGridProps,
  chartLineCursor,
  chartReferenceLabel,
  chartReferenceProps,
  chartValueAxisWidth,
  useChartId,
} from '@/components/dashboardblocks/chart'
import { ChartPanelLegend } from '@/components/dashboardblocks/chart-panel'
import { ExportMenu } from '@/components/dashboardblocks/dashboard-header'
import {
  LiveBadge,
  LiveNumber,
  createRandom,
  pushWindow,
  useInterval,
} from '@/components/dashboardblocks/realtime'
import {
  Stat,
  StatGroup,
  StatLabel,
  StatValue,
} from '@/components/dashboardblocks/stat-group'
import { StatusLabel, type StatusTone } from '@/components/dashboardblocks/status-label'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@/components/dashboardblocks/table'
import {
  BlockBusyIndicator,
  ChartRefreshButton,
  DashboardBusy,
  useChartRefresh,
} from '@/components/dashboard-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { downloadCsvReport, downloadPdfComplianceReport } from '@/lib/compliance-export'
import { PauseIcon, PlayIcon } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ResourceSample {
  cpu: number
  memory: number
  tick: number
}

export interface ResourceUsageWidgetProps extends BlockStateProps {
  description?: string
  empty?: boolean
  intervalMs?: number
  onRefresh?: () => void | Promise<void>
  refreshing?: boolean
  serviceFilter?: string | null
  title?: string
}

interface NodeResourceRow {
  cpuPct: number
  memoryGb: number
  memoryPct: number
  node: string
  region: string
  service: string
  status: 'Nominal' | 'Elevated' | 'Critical'
  vcpuUsed: number
}

const SERVICE_CAPACITY: Record<
  string,
  { baseCpu: number; baseMemory: number; totalCores: number; totalMemoryGb: number }
> = {
  ALL: { baseCpu: 44, baseMemory: 67, totalCores: 64, totalMemoryGb: 256 },
  'Web app': { baseCpu: 38, baseMemory: 54, totalCores: 24, totalMemoryGb: 64 },
  API: { baseCpu: 53, baseMemory: 72, totalCores: 24, totalMemoryGb: 96 },
  Payments: { baseCpu: 29, baseMemory: 61, totalCores: 8, totalMemoryGb: 32 },
  Webhooks: { baseCpu: 35, baseMemory: 49, totalCores: 8, totalMemoryGb: 32 },
}

const NODE_PROFILES = [
  {
    cpuOffset: -4.2,
    memOffset: -6.5,
    node: 'eu-west-app-01',
    region: 'eu-west-2',
    service: 'Web app',
    vcpuShare: 0.3,
    memShare: 0.25,
  },
  {
    cpuOffset: 9.4,
    memOffset: 6.2,
    node: 'eu-west-api-02',
    region: 'eu-west-2',
    service: 'API',
    vcpuShare: 0.35,
    memShare: 0.35,
  },
  {
    cpuOffset: -8.6,
    memOffset: -1.8,
    node: 'me-central-pay-01',
    region: 'me-central-1',
    service: 'Payments',
    vcpuShare: 0.2,
    memShare: 0.22,
  },
  {
    cpuOffset: 2.1,
    memOffset: -9.4,
    node: 'us-east-hooks-01',
    region: 'us-east-1',
    service: 'Webhooks',
    vcpuShare: 0.15,
    memShare: 0.18,
  },
] as const

const WINDOW_SIZE = 24
const CHART_HEIGHT = 168
const CHART_RIGHT = 6

const EXPORT_FORMATS = [
  { label: 'Export as CSV', value: 'csv' },
  { label: 'Export as PDF', value: 'pdf' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function buildInitialSamples(serviceFilter?: string | null): ResourceSample[] {
  const cap = SERVICE_CAPACITY[serviceFilter ?? 'ALL'] ?? SERVICE_CAPACITY.ALL
  const rng = createRandom(serviceFilter ? serviceFilter.length * 31 + 7 : 42)
  return Array.from({ length: WINDOW_SIZE }, (_, idx) => {
    const wave = Math.sin(idx / 3.2) * 5.5
    const cpu = Number(clamp(cap.baseCpu + wave + (rng() - 0.5) * 6, 12, 95).toFixed(1))
    const memory = Number(
      clamp(cap.baseMemory + Math.cos(idx / 4.5) * 3.5 + (rng() - 0.5) * 3.2, 20, 96).toFixed(1),
    )
    return { cpu, memory, tick: idx }
  })
}

export function ResourceUsageWidget({
  description,
  empty = false,
  errorMessage,
  intervalMs = 2500,
  onRefresh,
  refreshing: externalRefreshing,
  serviceFilter = null,
  status,
  title = 'Resource usage',
}: ResourceUsageWidgetProps) {
  const id = useChartId()
  const [paused, setPaused] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [samples, setSamples] = useState<ResourceSample[]>(() =>
    buildInitialSamples(serviceFilter),
  )

  const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
    onRefresh,
  })
  const isRefreshing = Boolean(externalRefreshing || localRefreshing)

  const capacity = SERVICE_CAPACITY[serviceFilter ?? 'ALL'] ?? SERVICE_CAPACITY.ALL

  useEffect(() => {
    setSamples(buildInitialSamples(serviceFilter))
  }, [serviceFilter])

  useEffect(() => {
    if (!exportNotice) return
    const timer = window.setTimeout(() => setExportNotice(null), 3500)
    return () => window.clearTimeout(timer)
  }, [exportNotice])

  useInterval(
    () => {
      setSamples((current) => {
        const prev = current[current.length - 1] ?? {
          cpu: capacity.baseCpu,
          memory: capacity.baseMemory,
          tick: 0,
        }
        const nextTick = prev.tick + 1
        const jitterCpu = Math.sin(nextTick / 2.4) * 2.8 + (Math.random() - 0.5) * 4.4
        const jitterMem = Math.cos(nextTick / 3.8) * 1.4 + (Math.random() - 0.5) * 2.1
        const nextCpu = Number(
          clamp(prev.cpu * 0.72 + capacity.baseCpu * 0.28 + jitterCpu, 10, 96).toFixed(1),
        )
        const nextMemory = Number(
          clamp(prev.memory * 0.8 + capacity.baseMemory * 0.2 + jitterMem, 18, 96).toFixed(1),
        )
        return pushWindow(current, { cpu: nextCpu, memory: nextMemory, tick: nextTick }, WINDOW_SIZE)
      })
    },
    paused || Boolean(status) || empty ? null : intervalMs,
  )

  const activeSamples = empty ? [] : samples
  const state = getBlockState(status, empty ? [] : activeSamples)

  const latest = activeSamples[activeSamples.length - 1] ?? { cpu: 0, memory: 0, tick: 0 }
  const peakCpu = Math.max(0, ...activeSamples.map((s) => s.cpu))
  const peakMemory = Math.max(0, ...activeSamples.map((s) => s.memory))
  const usedCores = (latest.cpu / 100) * capacity.totalCores
  const usedMemGb = (latest.memory / 100) * capacity.totalMemoryGb

  const chartRows = useMemo(
    () =>
      activeSamples.map((sample, index) => {
        const secondsAgo = Math.round(((activeSamples.length - 1 - index) * intervalMs) / 1000)
        return {
          cpu: sample.cpu,
          label: secondsAgo === 0 ? 'Now' : `${secondsAgo}s ago`,
          memory: sample.memory,
        }
      }),
    [activeSamples, intervalMs],
  )

  const nodeRows = useMemo<NodeResourceRow[]>(() => {
    if (empty || activeSamples.length === 0) return []
    const visibleProfiles = serviceFilter
      ? NODE_PROFILES.filter((p) => p.service === serviceFilter)
      : NODE_PROFILES
    return visibleProfiles.map((profile) => {
      const cpuPct = Number(clamp(latest.cpu + profile.cpuOffset, 8, 96).toFixed(1))
      const memoryPct = Number(clamp(latest.memory + profile.memOffset, 15, 96).toFixed(1))
      const vcpuUsed = Number(((cpuPct / 100) * capacity.totalCores * profile.vcpuShare).toFixed(1))
      const memoryGb = Number(
        ((memoryPct / 100) * capacity.totalMemoryGb * profile.memShare).toFixed(1),
      )
      const rowStatus: NodeResourceRow['status'] =
        cpuPct >= 82 || memoryPct >= 85
          ? 'Critical'
          : cpuPct >= 65 || memoryPct >= 75
            ? 'Elevated'
            : 'Nominal'
      return {
        cpuPct,
        memoryGb,
        memoryPct,
        node: profile.node,
        region: profile.region,
        service: profile.service,
        status: rowStatus,
        vcpuUsed,
      }
    })
  }, [activeSamples.length, capacity.totalCores, capacity.totalMemoryGb, empty, latest.cpu, latest.memory, serviceFilter])

  const handleExport = (format: string) => {
    if (nodeRows.length === 0) return
    const scopeName = serviceFilter ?? 'All services'
    if (format === 'csv') {
      downloadCsvReport({
        filename: 'resource-usage-compliance.csv',
        headers: ['Node', 'Region', 'Service', 'CPU (%)', 'vCPU Used', 'Memory (%)', 'Memory (GB)', 'Status'],
        rows: nodeRows.map((row) => [
          row.node,
          row.region,
          row.service,
          row.cpuPct.toFixed(1),
          row.vcpuUsed.toFixed(1),
          row.memoryPct.toFixed(1),
          row.memoryGb.toFixed(1),
          row.status,
        ]),
      })
      setExportNotice('Exported resource usage to CSV.')
      return
    }
    if (format === 'pdf') {
      downloadPdfComplianceReport({
        filename: 'resource-usage-compliance.pdf',
        title: 'Resource Usage Compliance Report',
        subtitle: `Real-time compute and memory telemetry snapshot for ${scopeName}.`,
        metadata: [
          { label: 'Service Scope', value: scopeName },
          { label: 'Current CPU / Peak', value: `${latest.cpu.toFixed(1)}% / ${peakCpu.toFixed(1)}%` },
          { label: 'Current Memory / Peak', value: `${latest.memory.toFixed(1)}% / ${peakMemory.toFixed(1)}%` },
        ],
        columns: [
          { header: 'Node', width: 22 },
          { header: 'Region', width: 15 },
          { header: 'Service', width: 14 },
          { header: 'CPU %', width: 11, align: 'right' },
          { header: 'vCPU', width: 10, align: 'right' },
          { header: 'Memory %', width: 12, align: 'right' },
          { header: 'Memory GB', width: 12, align: 'right' },
          { header: 'Status', width: 12 },
        ],
        rows: nodeRows.map((row) => [
          row.node,
          row.region,
          row.service,
          `${row.cpuPct.toFixed(1)}%`,
          row.vcpuUsed.toFixed(1),
          `${row.memoryPct.toFixed(1)}%`,
          `${row.memoryGb.toFixed(1)} GB`,
          row.status,
        ]),
      })
      setExportNotice('Exported resource usage compliance PDF.')
    }
  }

  const subtitle =
    description ??
    (serviceFilter
      ? `Real-time CPU and memory telemetry for ${serviceFilter} compute nodes.`
      : 'Real-time CPU utilization and memory allocation across active cluster nodes.')

  return (
    <BlockStateProvider errorMessage={errorMessage} state={state}>
      <Card>
        <CardContent>
          <section className='@container flex flex-col gap-4'>
            <header className='flex flex-wrap items-start justify-between gap-3'>
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h2 className='font-semibold tracking-tight'>{title}</h2>
                <p className='text-muted-foreground text-sm'>{subtitle}</p>
              </div>
              <div className='flex shrink-0 flex-wrap items-center gap-2'>
                {isRefreshing && <BlockBusyIndicator label='' />}
                {!state && <LiveBadge paused={paused} />}
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={Boolean(state)}
                  onClick={() => setPaused((p) => !p)}
                  className='h-8 gap-1 px-2.5 text-xs'
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
                <ExportMenu
                  size='sm'
                  disabled={Boolean(state) || nodeRows.length === 0}
                  formats={EXPORT_FORMATS}
                  onExport={handleExport}
                />
                <ChartRefreshButton
                  compact
                  disabled={status === 'loading'}
                  refreshing={isRefreshing}
                  onClick={() => {
                    setSamples(buildInitialSamples(serviceFilter))
                    void triggerRefresh()
                  }}
                />
              </div>
            </header>

            <DashboardBusy refreshing={isRefreshing} label='Updating resource usage'>
              <div className='flex flex-col gap-4'>
                <StatGroup
                  key={`res-stats-${refreshKey}`}
                  className='grid-cols-2 @md:grid-cols-4'
                >
                  <Stat>
                    <StatLabel>CPU utilization</StatLabel>
                    <StatValue className='text-2xl @md:text-3xl'>
                      <LiveNumber
                        value={latest.cpu}
                        format={(v) => `${v.toFixed(1)}%`}
                      />
                    </StatValue>
                    <span className='text-muted-foreground text-xs tabular-nums'>
                      {usedCores.toFixed(1)} / {capacity.totalCores} vCPU
                    </span>
                  </Stat>
                  <Stat>
                    <StatLabel>Memory allocation</StatLabel>
                    <StatValue className='text-2xl @md:text-3xl'>
                      <LiveNumber
                        value={latest.memory}
                        format={(v) => `${v.toFixed(1)}%`}
                      />
                    </StatValue>
                    <span className='text-muted-foreground text-xs tabular-nums'>
                      {usedMemGb.toFixed(1)} / {capacity.totalMemoryGb} GB
                    </span>
                  </Stat>
                  <Stat>
                    <StatLabel>Peak CPU</StatLabel>
                    <StatValue className='text-2xl'>
                      <LiveNumber value={peakCpu} format={(v) => `${v.toFixed(1)}%`} />
                    </StatValue>
                    <span className='text-muted-foreground text-xs'>Rolling 60s</span>
                  </Stat>
                  <Stat>
                    <StatLabel>Peak memory</StatLabel>
                    <StatValue className='text-2xl'>
                      <LiveNumber value={peakMemory} format={(v) => `${v.toFixed(1)}%`} />
                    </StatValue>
                    <span className='text-muted-foreground text-xs'>Rolling 60s</span>
                  </Stat>
                </StatGroup>

                {state && <ChartPlaceholder height={CHART_HEIGHT} />}
                {!state && (
                  <div className='flex flex-col gap-3'>
                    <div
                      key={`res-chart-${refreshKey}`}
                      aria-hidden
                      className='w-full tabular-nums'
                      style={{ height: CHART_HEIGHT }}
                    >
                      <ResponsiveContainer
                        initialDimension={{ width: 520, height: CHART_HEIGHT }}
                        width='100%'
                        height='100%'
                      >
                        <AreaChart
                          accessibilityLayer={false}
                          data={chartRows}
                          margin={{ top: 8, right: CHART_RIGHT, bottom: 0, left: 0 }}
                        >
                          <defs>
                            <linearGradient id={`${id}-cpu`} x1='0' x2='0' y1='0' y2='1'>
                              <stop
                                offset='0%'
                                stopColor='var(--color-chart-1)'
                                stopOpacity={0.28}
                              />
                              <stop
                                offset='100%'
                                stopColor='var(--color-chart-1)'
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                            <linearGradient id={`${id}-mem`} x1='0' x2='0' y1='0' y2='1'>
                              <stop
                                offset='0%'
                                stopColor='var(--color-chart-2)'
                                stopOpacity={0.25}
                              />
                              <stop
                                offset='100%'
                                stopColor='var(--color-chart-2)'
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...chartGridProps} />
                          <XAxis
                            {...chartAxisProps}
                            dataKey='label'
                            interval='preserveStartEnd'
                            minTickGap={48}
                          />
                          <YAxis
                            {...chartAxisProps}
                            domain={[0, 100]}
                            tickFormatter={(val: number) => `${val}%`}
                            width={chartValueAxisWidth}
                          />
                          <ReferenceLine
                            {...chartReferenceProps}
                            y={80}
                            label={{
                              ...chartReferenceLabel,
                              dy: -4,
                              position: 'insideBottomLeft',
                              value: '80% threshold',
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => (
                              <ChartTooltipContent
                                active={active}
                                label={
                                  (payload?.[0]?.payload as { label?: string } | undefined)
                                    ?.label
                                }
                                payload={payload}
                                valueFormatter={(value) => `${Number(value).toFixed(1)}%`}
                              />
                            )}
                            cursor={chartLineCursor}
                          />
                          <Area
                            dataKey='memory'
                            fill={`url(#${id}-mem)`}
                            isAnimationActive={false}
                            name='Memory'
                            stroke='var(--color-chart-2)'
                            strokeWidth={2}
                            type='monotone'
                          />
                          <Area
                            dataKey='cpu'
                            fill={`url(#${id}-cpu)`}
                            isAnimationActive={false}
                            name='CPU'
                            stroke='var(--color-chart-1)'
                            strokeWidth={2}
                            type='monotone'
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className='border-t pt-2'>
                      <DataTable density='compact' caption='Live node resource usage'>
                        <DataTableHeader>
                          <DataTableRow>
                            <DataTableHead>Node</DataTableHead>
                            <DataTableHead>Service</DataTableHead>
                            <DataTableHead align='end'>CPU</DataTableHead>
                            <DataTableHead align='end'>Memory</DataTableHead>
                            <DataTableHead>State</DataTableHead>
                          </DataTableRow>
                        </DataTableHeader>
                        <DataTableBody>
                          {nodeRows.map((row) => {
                            const tone: StatusTone =
                              row.status === 'Critical'
                                ? 'bad'
                                : row.status === 'Elevated'
                                  ? 'warning'
                                  : 'good'
                            return (
                              <DataTableRow key={row.node}>
                                <DataTableCell primary className='font-mono text-xs'>
                                  {row.node}
                                </DataTableCell>
                                <DataTableCell className='text-muted-foreground text-xs'>
                                  {row.service}
                                </DataTableCell>
                                <DataTableCell align='end' className='font-mono text-xs tabular-nums'>
                                  {row.cpuPct.toFixed(1)}%
                                </DataTableCell>
                                <DataTableCell align='end' className='font-mono text-xs tabular-nums'>
                                  {row.memoryPct.toFixed(1)}%
                                </DataTableCell>
                                <DataTableCell>
                                  <StatusLabel tone={tone}>{row.status}</StatusLabel>
                                </DataTableCell>
                              </DataTableRow>
                            )
                          })}
                        </DataTableBody>
                      </DataTable>
                    </div>

                    <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-3'>
                      <ChartPanelLegend
                        items={[
                          { color: 'var(--color-chart-1)', label: 'CPU utilization' },
                          { color: 'var(--color-chart-2)', label: 'Memory allocation' },
                        ]}
                      />
                      <span className='text-muted-foreground text-xs tabular-nums'>
                        {exportNotice ?? (paused ? 'Stream paused' : 'Sampling every 2.5s')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </DashboardBusy>
          </section>
        </CardContent>
      </Card>
    </BlockStateProvider>
  )
}
