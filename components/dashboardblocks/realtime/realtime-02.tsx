'use client'

import { useEffect, useState } from 'react'
import {
  BlockStateProvider,
  type BlockStateProps,
  getBlockState,
} from '@/components/dashboardblocks/block-state'
import {
  ChartPlaceholder,
  ChartTooltipContent,
  chartActiveDot,
  chartAxisProps,
  chartGridProps,
  chartLastDot,
  chartLineCursor,
  chartReferenceLabel,
  chartReferenceProps,
  chartValueAxisWidth,
  useChartId,
} from '@/components/dashboardblocks/chart'
import {
  LiveBadge,
  LiveNumber,
  RollingBars,
  createRandom,
} from '@/components/dashboardblocks/realtime'
import {
  Stat,
  StatGroup,
  StatLabel,
  StatValue,
} from '@/components/dashboardblocks/stat-group'
import {
  formatCompact,
  formatNumber,
  formatPercent,
} from '@/lib/dashboardblocks/format'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts'

import {
  BlockBusyIndicator,
  ChartRefreshButton,
  DashboardBusy,
  useChartRefresh,
} from '@/components/dashboard-state'
import { Card, CardContent } from '@/components/ui/card'

interface ThroughputSample {
  errors: number
  requests: number
}

interface Realtime2Props extends BlockStateProps {
  description: string
  /** One sample per interval, oldest first. Leave out, or pass none, to show the empty state. */
  samples?: ThroughputSample[]
  /** Seconds between samples. */
  interval?: number
  onRefresh?: () => void | Promise<void>
  refreshing?: boolean
  title: string
}

const CHART_RIGHT = 6
const CHART_HEIGHT = 160
const noSamples: ThroughputSample[] = []

const seed = createRandom(11)
const makeSample = (random: () => number, index: number): ThroughputSample => {
  const wave = index % 28 < 14 ? index % 14 : 14 - (index % 14)
  const requests = Math.round(780 + wave * 16 + random() * 90)
  const spike = random() > 0.93
  return {
    errors: Math.round(requests * (spike ? 0.02 + random() * 0.02 : random() * 0.004)),
    requests,
  }
}

const exampleProps: Realtime2Props = {
  description: 'Requests per second across all regions over the last 5 minutes.',
  samples: Array.from({ length: 60 }, (_, index) => makeSample(seed, index)),
  title: 'Throughput',
}

const Realtime2 = (props: Realtime2Props) => {
  const {
    description,
    interval = 5,
    onRefresh,
    refreshing: externalRefreshing,
    samples = noSamples,
    errorMessage,
    status,
    title,
  } = props
  const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
    onRefresh,
  })
  const isRefreshing = Boolean(externalRefreshing || localRefreshing)
  const [animateRestart, setAnimateRestart] = useState(false)

  useEffect(() => {
    if (refreshKey === 0) return
    setAnimateRestart(true)
    const timer = setTimeout(() => setAnimateRestart(false), 900)
    return () => clearTimeout(timer)
  }, [refreshKey])

  const id = useChartId()
  const state = getBlockState(status, samples)

  const latest = samples[samples.length - 1] ?? { errors: 0, requests: 0 }
  const peak = Math.max(0, ...samples.map((sample) => sample.requests))
  const totals = samples.reduce(
    (sum, sample) => ({
      errors: sum.errors + sample.errors,
      requests: sum.requests + sample.requests,
    }),
    { errors: 0, requests: 0 },
  )
  const errorRate = totals.requests > 0 ? totals.errors / totals.requests : 0
  const average = samples.length > 0 ? totals.requests / samples.length : 0
  const labels = samples.map((_, index) => {
    const seconds = (samples.length - 1 - index) * interval
    return seconds === 0 ? 'Now' : `${seconds}s ago`
  })
  const rows = samples.map((sample, index) => ({ ...sample, label: labels[index] }))
  const minutes = Math.round((samples.length * interval) / 60)

  return (
    <BlockStateProvider errorMessage={errorMessage} state={state}>
      <Card>
        <CardContent>
          <section className='@container flex flex-col gap-4'>
            <header className='flex items-start justify-between gap-3'>
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h2 className='font-semibold tracking-tight'>{title}</h2>
                <p className='text-muted-foreground text-sm'>{description}</p>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
                {isRefreshing && <BlockBusyIndicator label='' />}
                {!state && <LiveBadge />}
                <ChartRefreshButton
                  compact
                  disabled={status === 'loading'}
                  refreshing={isRefreshing}
                  onClick={() => void triggerRefresh()}
                />
              </div>
            </header>
            <DashboardBusy refreshing={isRefreshing} label={`Updating ${title}`}>
              <div className='flex flex-col gap-4'>
                <StatGroup key={`stats-${refreshKey}`} className='grid-cols-2 @md:grid-cols-[2fr_1fr_1fr]'>
                  <Stat className='col-span-2 @md:col-span-1'>
                    <StatLabel>Requests per second</StatLabel>
                    <StatValue>
                      <LiveNumber value={latest.requests} />
                    </StatValue>
                  </Stat>
                  <Stat className='justify-end'>
                    <StatLabel>Peak, {minutes} min</StatLabel>
                    <StatValue className='text-2xl'>
                      <LiveNumber value={peak} />
                    </StatValue>
                  </Stat>
                  <Stat className='justify-end'>
                    <StatLabel>Error rate</StatLabel>
                    <StatValue className='text-2xl'>
                      <LiveNumber
                        format={(value) => formatPercent(value, { maximumFractionDigits: 2 })}
                        value={errorRate}
                      />
                    </StatValue>
                  </Stat>
                </StatGroup>
                {state && <ChartPlaceholder height={CHART_HEIGHT} />}
                {!state && (
                  <div
                    key={`chart-${refreshKey}`}
                    aria-hidden
                    className='w-full tabular-nums'
                    style={{ height: CHART_HEIGHT }}
                  >
                    <ResponsiveContainer initialDimension={{ width: 480, height: CHART_HEIGHT }} width='100%' height='100%'>
                  <AreaChart
                    accessibilityLayer={false}
                    data={rows}
                    margin={{ top: 8, right: CHART_RIGHT, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id={`${id}-fill`} x1='0' x2='0' y1='0' y2='1'>
                        <stop
                          offset='0%'
                          stopColor='var(--color-chart-2)'
                          stopOpacity={0.35}
                        />
                        <stop
                          offset='100%'
                          stopColor='var(--color-chart-2)'
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...chartGridProps} />
                    <YAxis
                      {...chartAxisProps}
                      domain={[0, 'auto']}
                      tickFormatter={formatCompact}
                      width={chartValueAxisWidth}
                    />
                    <ReferenceLine
                      {...chartReferenceProps}
                      y={average}
                      label={{
                        ...chartReferenceLabel,
                        dy: -6,
                        position: 'insideBottomLeft',
                        value: `avg ${formatNumber(Math.round(average))}/s`,
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
                          valueFormatter={(value) => `${formatNumber(value)}/s`}
                        />
                      )}
                      cursor={chartLineCursor}
                    />
                    <Area
                      activeDot={chartActiveDot}
                      dataKey='requests'
                      dot={chartLastDot(rows.length, 'var(--color-chart-2)')}
                      fill={`url(#${id}-fill)`}
                      isAnimationActive={animateRestart}
                      name='Requests'
                      stroke='var(--color-chart-2)'
                      strokeWidth={2}
                      type='monotone'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div
              className='flex flex-col gap-1'
              style={{ paddingLeft: chartValueAxisWidth, paddingRight: CHART_RIGHT }}
            >
              <span className='text-muted-foreground text-xs'>Errors per second</span>
              <RollingBars
                key={`errors-${refreshKey}`}
                color='var(--color-destructive)'
                formatter={(value) => `${formatNumber(value)}/s`}
                height={32}
                highlightLatest={false}
                labels={labels}
                values={samples.map((sample) => sample.errors)}
              />
              {!state && (
                <div
                  aria-hidden
                  className='text-muted-foreground flex justify-between text-xs'
                >
                  <span>{minutes} min ago</span>
                  <span>Now</span>
                </div>
              )}
            </div>
            {!state && (
              <p className='sr-only'>
                {`Latest: ${formatNumber(latest.requests)} requests and ${formatNumber(latest.errors)} errors per second. Peak ${formatNumber(peak)} and average ${formatNumber(Math.round(average))} requests per second in the last ${minutes} minutes.`}
              </p>
            )}
              </div>
            </DashboardBusy>
          </section>
        </CardContent>
      </Card>
    </BlockStateProvider>
  )
}

export {
  Realtime2,
  exampleProps as realtime2ExampleProps,
  type Realtime2Props,
  type ThroughputSample,
}
