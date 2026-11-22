'use client'

import { useMemo, useState } from 'react'
import {
  BlockReady,
  BlockStateProvider,
  type BlockStateProps,
  getBlockState,
} from '@/components/dashboardblocks/block-state'
import { CountryFlag } from '@/components/dashboardblocks/country-flag'
import {
  DotMap,
  DotMapLegend,
  type DotMapMarker,
} from '@/components/dashboardblocks/geo'
import { KPIValue } from '@/components/dashboardblocks/kpi'
import {
  BlockBusyIndicator,
  ChartRefreshButton,
  DashboardBusy,
  useChartRefresh,
} from '@/components/dashboard-state'
import { formatCompact, formatNumber, formatPercent } from '@/lib/dashboardblocks/format'
import { cn } from '@/lib/utils'

import { Card, CardContent } from '@/components/ui/card'

type GeoRegion = 'All' | 'EMEA' | 'Americas' | 'APAC'

const REGIONS: GeoRegion[] = ['All', 'EMEA', 'Americas', 'APAC']

interface GeoLocation extends DotMapMarker {
  region?: Exclude<GeoRegion, 'All'>
}

interface Geo3Props extends BlockStateProps {
  /** Defaults to a sentence about live distribution across hubs. */
  description?: string
  /** Leave out, or pass none, to show the empty state. */
  locations?: GeoLocation[]
  onRefresh?: () => void | Promise<void>
  refreshing?: boolean
  title: string
  unit: string
}

const exampleProps: Geo3Props = {
  locations: [
    {
      country: 'US',
      id: 'nyc',
      lat: 40.71,
      lon: -74.01,
      name: 'New York',
      region: 'Americas',
      trend: 11.4,
      value: 3_460,
    },
    {
      country: 'GB',
      id: 'lon',
      lat: 51.51,
      lon: -0.13,
      name: 'London',
      region: 'EMEA',
      trend: 9.2,
      value: 2_970,
    },
    {
      country: 'US',
      id: 'sfo',
      lat: 37.77,
      lon: -122.42,
      name: 'San Francisco',
      region: 'Americas',
      trend: 7.8,
      value: 2_840,
    },
    {
      country: 'EG',
      id: 'cai',
      lat: 30.04,
      lon: 31.24,
      name: 'Cairo',
      region: 'EMEA',
      trend: 24.6,
      value: 2_380,
    },
    {
      country: 'IN',
      id: 'blr',
      lat: 12.97,
      lon: 77.59,
      name: 'Bengaluru',
      region: 'APAC',
      trend: 16.5,
      value: 2_120,
    },
    {
      country: 'SA',
      id: 'ruh',
      lat: 24.71,
      lon: 46.68,
      name: 'Riyadh',
      region: 'EMEA',
      trend: 21.8,
      value: 1_940,
    },
    {
      country: 'JP',
      id: 'tyo',
      lat: 35.68,
      lon: 139.69,
      name: 'Tokyo',
      region: 'APAC',
      trend: 6.4,
      value: 1_760,
    },
    {
      country: 'AE',
      id: 'dxb',
      lat: 25.2,
      lon: 55.27,
      name: 'Dubai',
      region: 'EMEA',
      trend: 18.2,
      value: 1_640,
    },
    {
      country: 'DE',
      id: 'ber',
      lat: 52.52,
      lon: 13.4,
      name: 'Berlin',
      region: 'EMEA',
      trend: 5.9,
      value: 1_580,
    },
    {
      country: 'BR',
      id: 'gru',
      lat: -23.55,
      lon: -46.63,
      name: 'São Paulo',
      region: 'Americas',
      trend: 13.1,
      value: 1_310,
    },
    {
      country: 'SG',
      id: 'sin',
      lat: 1.35,
      lon: 103.82,
      name: 'Singapore',
      region: 'APAC',
      trend: 10.3,
      value: 1_240,
    },
    {
      country: 'CA',
      id: 'yyz',
      lat: 43.65,
      lon: -79.38,
      name: 'Toronto',
      region: 'Americas',
      trend: 4.7,
      value: 1_120,
    },
    {
      country: 'AU',
      id: 'syd',
      lat: -33.87,
      lon: 151.21,
      name: 'Sydney',
      region: 'APAC',
      trend: 8.1,
      value: 980,
    },
    {
      country: 'MX',
      id: 'mex',
      lat: 19.43,
      lon: -99.13,
      name: 'Mexico City',
      region: 'Americas',
      trend: 12.0,
      value: 690,
    },
    {
      country: 'NG',
      id: 'los',
      lat: 6.52,
      lon: 3.38,
      name: 'Lagos',
      region: 'EMEA',
      trend: 15.4,
      value: 540,
    },
  ],
  title: 'Active users',
  unit: 'active users',
}

const Geo3 = (props: Geo3Props) => {
  const {
    locations = [],
    errorMessage,
    onRefresh,
    refreshing: externalRefreshing,
    status,
    title,
    unit,
  } = props
  const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
    onRefresh,
  })
  const [region, setRegion] = useState<GeoRegion>('All')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAllHubs, setShowAllHubs] = useState(false)

  const isRefreshing = Boolean(externalRefreshing || localRefreshing)
  const state = getBlockState(status, locations)
  const unitName = unit.charAt(0).toUpperCase() + unit.slice(1)

  const globalTotal = useMemo(
    () => locations.reduce((sum, location) => sum + location.value, 0),
    [locations],
  )

  const hasRegions = useMemo(
    () => locations.some((location) => Boolean(location.region)),
    [locations],
  )

  const filteredLocations = useMemo(() => {
    const list =
      region === 'All' || !hasRegions
        ? locations
        : locations.filter((location) => location.region === region)
    return [...list].sort((a, b) => b.value - a.value)
  }, [hasRegions, locations, region])

  const total = useMemo(
    () => filteredLocations.reduce((sum, location) => sum + location.value, 0),
    [filteredLocations],
  )
  const max = Math.max(0, ...filteredLocations.map((location) => location.value))
  const countryCount = useMemo(
    () =>
      new Set(
        filteredLocations
          .map((location) => location.country)
          .filter((country): country is string => Boolean(country)),
      ).size,
    [filteredLocations],
  )

  const topHub = filteredLocations[0]
  const fastestHub = useMemo(() => {
    const withTrend = filteredLocations.filter(
      (location): location is GeoLocation & { trend: number } =>
        typeof location.trend === 'number',
    )
    if (!withTrend.length) return undefined
    return [...withTrend].sort((a, b) => b.trend - a.trend)[0]
  }, [filteredLocations])

  const selectedLocation = useMemo(
    () => filteredLocations.find((location) => location.id === selectedId) ?? null,
    [filteredLocations, selectedId],
  )

  const activeId = selectedLocation?.id ?? hoveredId
  const rippleIds = useMemo(() => {
    const ids = filteredLocations.slice(0, 2).map((location) => location.id)
    if (selectedLocation && !ids.includes(selectedLocation.id)) {
      ids.push(selectedLocation.id)
    }
    return ids
  }, [filteredLocations, selectedLocation])

  const displayedHubs = showAllHubs
    ? filteredLocations
    : filteredLocations.slice(0, 6)

  const share = (value: number, denominator = total) =>
    formatPercent(denominator > 0 ? value / denominator : 0, {
      maximumFractionDigits: 0,
    })

  const {
    description = props.description ??
      'Live distribution of active users across major global & MENA hubs.',
  } = props

  const handleRegionChange = (nextRegion: GeoRegion) => {
    setRegion(nextRegion)
    setHoveredId(null)
    if (selectedId) {
      const stillVisible =
        nextRegion === 'All' ||
        locations.some(
          (location) => location.id === selectedId && location.region === nextRegion,
        )
      if (!stillVisible) setSelectedId(null)
    }
  }

  return (
    <BlockStateProvider errorMessage={errorMessage} state={state}>
      <Card>
        <CardContent>
          <section className='@container flex flex-col gap-4'>
            <header className='flex flex-wrap items-start justify-between gap-3'>
              <div className='flex min-w-0 flex-col gap-0.5'>
                <h2 className='font-semibold tracking-tight'>{title}</h2>
                <BlockReady className='text-sm'>
                  {description && (
                    <p className='text-muted-foreground text-sm'>{description}</p>
                  )}
                </BlockReady>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
                {isRefreshing && <BlockBusyIndicator />}
                <ChartRefreshButton
                  disabled={status === 'loading'}
                  refreshing={isRefreshing}
                  onClick={() => void triggerRefresh()}
                />
              </div>
            </header>

            <DashboardBusy refreshing={isRefreshing} label={`Updating ${title}`}>
              <div className='flex flex-col gap-4'>
                {hasRegions && (
                  <BlockReady>
                    <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-3'>
                      <div
                        role='tablist'
                        aria-label='Filter map by region'
                        className='bg-muted/60 inline-flex items-center rounded-md border p-0.5'
                      >
                        {REGIONS.map((item) => {
                          const active = region === item
                          return (
                            <button
                              key={item}
                              type='button'
                              role='tab'
                              aria-selected={active}
                              onClick={() => handleRegionChange(item)}
                              className={cn(
                                'cursor-pointer rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
                                active
                                  ? 'bg-background text-foreground shadow-xs'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {item}
                            </button>
                          )
                        })}
                      </div>
                      <span className='text-muted-foreground text-xs tabular-nums'>
                        {region === 'All'
                          ? `${countryCount} countries · ${filteredLocations.length} cities`
                          : `${share(total, globalTotal)} of global traffic`}
                      </span>
                    </div>
                  </BlockReady>
                )}

                <dl
                  className={cn(
                    'grid grid-cols-1 gap-4 sm:grid-cols-3',
                    !hasRegions && 'border-t pt-4',
                  )}
                >
                  <div className='flex flex-col gap-0.5'>
                    <dt className='text-muted-foreground text-xs font-medium'>
                      {state
                        ? unitName
                        : region === 'All'
                          ? `Global ${unit}`
                          : `${region} ${unit}`}
                    </dt>
                    <dd className='flex flex-col gap-0.5'>
                      <KPIValue
                        key={`kpi-${region}-${refreshKey}`}
                        value={total}
                        format={(value) => formatNumber(value)}
                      />
                      <BlockReady>
                        <span className='text-muted-foreground text-xs tabular-nums'>
                          {filteredLocations.length} hubs · {countryCount} countries
                        </span>
                      </BlockReady>
                    </dd>
                  </div>

                  <BlockReady>
                    <div className='flex flex-col gap-0.5'>
                      <dt className='text-muted-foreground text-xs font-medium'>
                        Top hub
                      </dt>
                      {topHub ? (
                        <dd className='flex flex-col gap-0.5'>
                          <span className='flex items-center gap-1.5 text-sm font-semibold tracking-tight'>
                            <CountryFlag code={topHub.country} className='w-auto' />
                            <span className='truncate'>{topHub.name}</span>
                          </span>
                          <span className='text-muted-foreground text-xs tabular-nums'>
                            {formatNumber(topHub.value)} ({share(topHub.value)})
                          </span>
                        </dd>
                      ) : (
                        <dd className='text-muted-foreground text-sm'>—</dd>
                      )}
                    </div>
                  </BlockReady>

                  <BlockReady>
                    <div className='flex flex-col gap-0.5'>
                      <dt className='text-muted-foreground text-xs font-medium'>
                        {selectedLocation ? 'Pinned hub' : 'Fastest growing'}
                      </dt>
                      {selectedLocation ? (
                        <dd className='flex flex-col gap-0.5'>
                          <span className='flex items-center gap-1.5 text-sm font-semibold tracking-tight'>
                            <CountryFlag
                              code={selectedLocation.country}
                              className='w-auto'
                            />
                            <span className='truncate'>{selectedLocation.name}</span>
                          </span>
                          <span className='text-muted-foreground text-xs tabular-nums'>
                            {formatNumber(selectedLocation.value)} (
                            {share(selectedLocation.value)})
                            {typeof selectedLocation.trend === 'number' &&
                              ` · +${selectedLocation.trend.toFixed(1)}%`}
                          </span>
                        </dd>
                      ) : fastestHub ? (
                        <dd className='flex flex-col gap-0.5'>
                          <span className='flex items-center gap-1.5 text-sm font-semibold tracking-tight'>
                            <CountryFlag code={fastestHub.country} className='w-auto' />
                            <span className='truncate'>{fastestHub.name}</span>
                          </span>
                          <span className='text-xs tabular-nums'>
                            <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                              +{fastestHub.trend.toFixed(1)}%
                            </span>
                            <span className='text-muted-foreground'>
                              {' '}
                              · {formatCompact(fastestHub.value)} {unit}
                            </span>
                          </span>
                        </dd>
                      ) : (
                        <dd className='text-muted-foreground text-sm'>—</dd>
                      )}
                    </div>
                  </BlockReady>
                </dl>

                <div className='bg-muted/20 rounded-lg border px-3 pt-3 pb-2.5'>
                  <DotMap
                    key={`map-${region}-${refreshKey}`}
                    activeId={activeId}
                    describe={(location) =>
                      `${location.name}: ${formatNumber(location.value)} ${unit}, ${share(location.value)}`
                    }
                    footer={
                      <div className='flex w-full flex-wrap items-center justify-between gap-2'>
                        <DotMapLegend max={max} />
                        <BlockReady>
                          {selectedLocation ? (
                            <button
                              type='button'
                              onClick={() => setSelectedId(null)}
                              className='text-muted-foreground hover:text-foreground cursor-pointer text-xs underline underline-offset-4'
                            >
                              Clear pin ({selectedLocation.name})
                            </button>
                          ) : (
                            <span className='text-muted-foreground text-xs'>
                              Hover or click a hub to inspect
                            </span>
                          )}
                        </BlockReady>
                      </div>
                    }
                    label={`${title}, by city`}
                    markers={filteredLocations}
                    max={max}
                    nameHeader='City'
                    onActiveChange={(marker) => setHoveredId(marker?.id ?? null)}
                    onSelectMarker={(marker) =>
                      setSelectedId((prev) => (prev === marker.id ? null : marker.id))
                    }
                    rippleIds={rippleIds}
                    showGrid
                    showShare
                    valueHeader={unitName}
                  />
                </div>

                <BlockReady>
                  {filteredLocations.length > 0 && (
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center justify-between gap-2'>
                        <h3 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                          {region === 'All' ? 'Top hubs' : `${region} hubs`}
                        </h3>
                        {filteredLocations.length > 6 && (
                          <button
                            type='button'
                            onClick={() => setShowAllHubs((prev) => !prev)}
                            className='text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium'
                          >
                            {showAllHubs
                              ? 'Show top 6'
                              : `Show all (${filteredLocations.length})`}
                          </button>
                        )}
                      </div>
                      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                        {displayedHubs.map((location, index) => {
                          const isSelected = selectedId === location.id
                          const isHovered = hoveredId === location.id
                          const ratio =
                            max > 0 ? Math.max(6, (location.value / max) * 100) : 0
                          return (
                            <button
                              key={location.id}
                              type='button'
                              aria-pressed={isSelected}
                              onPointerEnter={() => setHoveredId(location.id)}
                              onPointerLeave={() =>
                                setHoveredId((prev) =>
                                  prev === location.id ? null : prev,
                                )
                              }
                              onClick={() =>
                                setSelectedId((prev) =>
                                  prev === location.id ? null : location.id,
                                )
                              }
                              className={cn(
                                'flex cursor-pointer flex-col gap-1.5 rounded-md border px-2.5 py-2 text-left transition-colors',
                                isSelected
                                  ? 'border-foreground/30 bg-muted/50'
                                  : isHovered
                                    ? 'bg-muted/35'
                                    : 'bg-background hover:bg-muted/30',
                              )}
                            >
                              <div className='flex items-center justify-between gap-2'>
                                <span className='flex min-w-0 items-center gap-1.5'>
                                  <span className='text-muted-foreground w-4 shrink-0 text-[11px] tabular-nums'>
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <CountryFlag
                                    code={location.country}
                                    className='w-auto'
                                  />
                                  <span className='truncate text-xs font-medium'>
                                    {location.name}
                                  </span>
                                </span>
                                <span className='flex shrink-0 items-center gap-1.5 text-xs tabular-nums'>
                                  {typeof location.trend === 'number' && (
                                    <span
                                      className={cn(
                                        'text-[11px] font-medium',
                                        location.trend >= 0
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400',
                                      )}
                                    >
                                      {location.trend >= 0 ? '+' : ''}
                                      {location.trend.toFixed(0)}%
                                    </span>
                                  )}
                                  <span className='font-semibold'>
                                    {formatCompact(location.value)}
                                  </span>
                                  <span className='text-muted-foreground text-[11px]'>
                                    {share(location.value)}
                                  </span>
                                </span>
                              </div>
                              <div className='bg-muted h-1 w-full overflow-hidden rounded-full'>
                                <div
                                  className='h-full rounded-full transition-[width] duration-300'
                                  style={{
                                    backgroundColor: isSelected
                                      ? 'var(--color-chart-1)'
                                      : 'var(--color-chart-2)',
                                    width: `${ratio}%`,
                                  }}
                                />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </BlockReady>
              </div>
            </DashboardBusy>
          </section>
        </CardContent>
      </Card>
    </BlockStateProvider>
  )
}

export { Geo3, exampleProps as geo3ExampleProps, type Geo3Props, type GeoLocation }
