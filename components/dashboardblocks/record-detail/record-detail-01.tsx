'use client'

import {
  BlockStateProvider,
  BlockStateText,
  type BlockStateProps,
  SkeletonText,
  getBlockState,
} from '@/components/dashboardblocks/block-state'
import {
  ActionsMenu,
  BackLink,
  PageHeader,
  PageHeaderActions,
  type PageHeaderFact,
  PageHeaderFacts,
  PageHeaderHeading,
  PageHeaderRow,
} from '@/components/dashboardblocks/page-header'
import {
  Property,
  PropertyList,
  RecordLayout,
  RecordPlaceholder,
  RecordSection,
} from '@/components/dashboardblocks/record-detail'
import {
  StatusLabel,
  type StatusTone,
} from '@/components/dashboardblocks/status-label'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableRowLink,
} from '@/components/dashboardblocks/table'
import { Tag } from '@/components/dashboardblocks/tag'
import { PersonAvatar } from '@/components/dashboardblocks/team'
import { formatCurrency, joinDetails } from '@/lib/dashboardblocks/format'

import { Button } from '@/components/ui/button'
import { MailIcon, PencilIcon } from 'lucide-react'

type OrderStatus = 'Delivered' | 'Refunded' | 'Shipped'

interface CustomerOrder {
  date: string
  href: string
  id: string
  status: OrderStatus
  total: number
}

interface RecordDetail1Props extends BlockStateProps {
  backLabel?: string
  /** Leave out to show the empty state. */
  customer?: {
    avatar?: string
    email: string
    id?: string
    location: string
    name: string
    notes: string
    phone: string
    plan?: string
    since: string
    status: 'Active' | 'Trial' | 'At risk' | 'Churned'
    tags: string[]
  }
  onBack?: () => void
  onDelete?: () => void
  onEdit?: () => void
  onEmail?: () => void
  onMerge?: () => void
  orders?: CustomerOrder[]
  ordersDescription?: string
  ordersTitle?: string
  stats?: PageHeaderFact[]
}

const exampleProps: RecordDetail1Props = {
  customer: {
    avatar: '/images/avatar-07.webp',
    email: 'jonas@northwind.io',
    location: 'Berlin, Germany',
    name: 'Jonas Weber',
    notes: 'Prefers invoices at the end of the month. Wholesale pricing agreed in May.',
    phone: '+49 30 901820',
    since: 'Mar 14, 2024',
    status: 'Active',
    tags: ['Wholesale', 'EU'],
  },
  orders: [
    { date: 'Sep 24, 2026', href: '#', id: '#1042', status: 'Shipped', total: 652.22 },
    { date: 'Aug 30, 2026', href: '#', id: '#0987', status: 'Delivered', total: 289 },
    { date: 'Aug 2, 2026', href: '#', id: '#0931', status: 'Refunded', total: 94.5 },
    { date: 'Jul 11, 2026', href: '#', id: '#0874', status: 'Delivered', total: 1_210 },
  ],
  stats: [
    { detail: 'Top 5% of customers', label: 'Lifetime value', value: '$4,820' },
    { detail: 'Since Mar 2024', label: 'Orders', value: '12' },
    { label: 'Average order', value: '$401.67' },
    { detail: 'Order #1042', label: 'Last order', value: '3 days ago' },
  ],
}

type CustomerStatus = NonNullable<RecordDetail1Props['customer']>['status']

const CUSTOMER_TONE: Record<CustomerStatus, StatusTone> = {
  Active: 'good',
  'At risk': 'warning',
  Churned: 'neutral',
  Trial: 'info',
}

const ORDER_TONE: Record<OrderStatus, StatusTone> = {
  Delivered: 'good',
  Refunded: 'neutral',
  Shipped: 'info',
}

const money = (value: number) => formatCurrency(value, { precision: 'exact' })

const RecordDetail1 = (props: RecordDetail1Props) => {
  const {
    backLabel = 'Customers',
    customer,
    onBack,
    onDelete,
    onEdit,
    onEmail,
    onMerge,
    orders = [],
    ordersDescription,
    ordersTitle = 'Recent orders',
    stats = [],
    errorMessage,
    status,
  } = props
  const state = getBlockState(status, customer)
  const ready = customer !== undefined && state === undefined
  const spent = orders
    .filter((order) => order.status !== 'Refunded')
    .reduce((sum, order) => sum + order.total, 0)

  const menuItems = [
    ...(onEmail ? [{ label: 'Send email', onSelect: onEmail }] : []),
    ...(onMerge ? [{ label: 'Merge customer', onSelect: onMerge }] : []),
    ...(onDelete
      ? [
          {
            label: 'Delete customer',
            onSelect: onDelete,
            variant: 'destructive' as const,
          },
        ]
      : []),
  ]

  return (
    <BlockStateProvider errorMessage={errorMessage} state={state}>
      <div className='flex flex-col gap-8'>
        <PageHeader>
          <BackLink href={onBack ? undefined : '#'} onClick={onBack}>
            {backLabel}
          </BackLink>
          <PageHeaderRow className='@2xl/page-header:items-end'>
            {ready ? (
              <PageHeaderHeading
                title={customer.name}
                description={joinDetails(customer.email, customer.location)}
                badge={
                  <StatusLabel tone={CUSTOMER_TONE[customer.status]}>
                    {customer.status}
                  </StatusLabel>
                }
                media={<PersonAvatar className='size-12' person={customer} size='lg' />}
              />
            ) : (
              <PageHeaderHeading
                title={<BlockStateText variant='short' />}
                description={state === 'loading' && <SkeletonText className='w-56' />}
              />
            )}
            <PageHeaderActions>
              {onEmail && (
                <Button variant='outline' disabled={!ready} onClick={onEmail}>
                  <MailIcon data-icon='inline-start' />
                  Email
                </Button>
              )}
              {onEdit && (
                <Button variant='outline' disabled={!ready} onClick={onEdit}>
                  <PencilIcon data-icon='inline-start' />
                  Edit
                </Button>
              )}
              {menuItems.length > 0 && (
                <ActionsMenu disabled={!ready} items={menuItems} />
              )}
            </PageHeaderActions>
          </PageHeaderRow>
          {ready && <PageHeaderFacts items={stats} />}
          {state === 'loading' && stats.length > 0 && (
            <PageHeaderFacts
              items={stats.map((fact) => ({
                label: fact.label,
                value: <SkeletonText className='w-16' />,
              }))}
            />
          )}
        </PageHeader>
        <RecordPlaceholder aside={['Details', 'Notes']} sections={[ordersTitle]} />
        {ready && (
          <RecordLayout
            aside={
              <>
                <RecordSection title='Details'>
                  <PropertyList>
                    {customer.id && (
                      <Property label='Account ID'>
                        <span className='font-mono text-xs tabular-nums'>
                          {customer.id}
                        </span>
                      </Property>
                    )}
                    <Property label='Email'>
                      <a
                        href={`mailto:${customer.email}`}
                        className='underline-offset-4 hover:underline'
                      >
                        {customer.email}
                      </a>
                    </Property>
                    <Property label='Phone'>{customer.phone}</Property>
                    <Property label='Location'>{customer.location}</Property>
                    {customer.plan && <Property label='Plan'>{customer.plan}</Property>}
                    <Property label='Customer since'>{customer.since}</Property>
                    <Property label='Tags'>
                      <span className='flex flex-wrap gap-1'>
                        {customer.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </span>
                    </Property>
                  </PropertyList>
                </RecordSection>
                <RecordSection title='Notes'>
                  <p className='text-muted-foreground text-sm'>{customer.notes}</p>
                </RecordSection>
              </>
            }
          >
            <RecordSection
              description={
                ordersDescription ??
                `The last ${orders.length} records, ${money(spent)} after refunds.`
              }
              title={ordersTitle}
            >
              <DataTable caption={ordersTitle}>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Reference</DataTableHead>
                    <DataTableHead>Date</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead align='end'>Total</DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {orders.map((order) => (
                    <DataTableRow key={order.id}>
                      <DataTableCell primary>
                        {order.href === '#' ? (
                          <span className='font-mono text-xs tabular-nums'>
                            {order.id}
                          </span>
                        ) : (
                          <DataTableRowLink href={order.href}>{order.id}</DataTableRowLink>
                        )}
                      </DataTableCell>
                      <DataTableCell className='text-muted-foreground whitespace-nowrap'>
                        {order.date}
                      </DataTableCell>
                      <DataTableCell>
                        <StatusLabel tone={ORDER_TONE[order.status]}>
                          {order.status}
                        </StatusLabel>
                      </DataTableCell>
                      <DataTableCell align='end'>{money(order.total)}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </RecordSection>
          </RecordLayout>
        )}
      </div>
    </BlockStateProvider>
  )
}

export {
  RecordDetail1,
  exampleProps as recordDetail1ExampleProps,
  type CustomerOrder,
  type RecordDetail1Props,
}
