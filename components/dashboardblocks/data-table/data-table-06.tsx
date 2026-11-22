import type { ReactNode } from 'react'
import {
  BlockReady,
  BlockStateProvider,
  type BlockStateProps,
  getBlockState,
} from '@/components/dashboardblocks/block-state'
import {
  createDataTableColumnHelper,
  createDataTableSelectColumn,
  DataTableContent,
  DataTableFacetFilter,
  type DataTableFacetOption,
  DataTablePagination,
  DataTableReset,
  DataTableSearch,
  DataTableSelectionBar,
  DataTableViewOptions,
  useDataTable,
} from '@/components/dashboardblocks/data-table'
import { Details } from '@/components/dashboardblocks/details'
import {
  StatusLabel,
  type StatusTone,
} from '@/components/dashboardblocks/status-label'
import {
  BlockBusyIndicator,
  ChartRefreshButton,
  DashboardBusy,
  useChartRefresh,
} from '@/components/dashboard-state'
import { formatCurrency, formatDate } from '@/lib/dashboardblocks/format'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DownloadIcon,
  EyeIcon,
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'

type CustomerPlan = 'Enterprise' | 'Free' | 'Pro' | 'Team'
type CustomerStatus = 'active' | 'churned' | 'past-due' | 'trial'

interface CustomerRow {
  company: string
  email: string
  id: string
  /** Monthly recurring revenue, in dollars. */
  mrr: number
  plan: CustomerPlan
  seats: number
  /** ISO date. */
  signedUp: string
  status: CustomerStatus
}

interface DataTable6Props extends BlockStateProps {
  /** Defaults to a sentence counting the accounts and what they pay. */
  description?: string
  headerActions?: ReactNode
  onBulkDelete?: (rows: CustomerRow[]) => void
  onDeleteRow?: (row: CustomerRow) => void
  onEditRow?: (row: CustomerRow) => void
  onEmail?: (rows: CustomerRow[]) => void
  onExport?: (rows: CustomerRow[]) => void
  onRefresh?: () => void | Promise<void>
  onViewRow?: (row: CustomerRow) => void
  pageSize?: number
  refreshing?: boolean
  /** Leave out, or pass none, to show the empty state. */
  rows?: CustomerRow[]
  searchControl?: ReactNode
  title: string
}

const COMPANIES = [
  ['Northwind', 'northwind.io'],
  ['Brightpath', 'brightpath.dev'],
  ['Loop Studio', 'loop.studio'],
  ['Fieldnotes', 'fieldnotes.co'],
  ['Harbor', 'harbor.app'],
  ['Quanta', 'quanta.ai'],
  ['Pinecrest', 'pinecrest.com'],
  ['Juniper Labs', 'juniperlabs.io'],
  ['Sable', 'sable.so'],
  ['Kitefin', 'kitefin.com'],
  ['Mosaic', 'mosaic.design'],
  ['Arcadia', 'arcadia.health'],
  ['Tidewater', 'tidewater.co'],
  ['Emberly', 'emberly.app'],
  ['Cobalt', 'cobalt.sh'],
  ['Wren & Co', 'wren.co'],
  ['Lumen', 'lumen.fm'],
  ['Orbital', 'orbital.dev'],
  ['Parcel', 'parcel.shop'],
  ['Stackwise', 'stackwise.io'],
  ['Verdant', 'verdant.farm'],
  ['Halcyon', 'halcyon.travel'],
]

const PLANS: CustomerPlan[] = ['Pro', 'Team', 'Free', 'Pro', 'Enterprise', 'Team', 'Pro']
const STATUSES: CustomerStatus[] = [
  'active',
  'active',
  'trial',
  'active',
  'past-due',
  'active',
  'churned',
  'trial',
]
const SEAT_PRICE: Record<CustomerPlan, number> = {
  Enterprise: 45,
  Free: 0,
  Pro: 12,
  Team: 24,
}

const exampleProps: DataTable6Props = {
  pageSize: 8,
  rows: COMPANIES.map(([company, domain], index) => {
    const plan = PLANS[index % PLANS.length]
    const status = STATUSES[(index * 3) % STATUSES.length]
    const seats = plan === 'Free' ? 1 + (index % 3) : 3 + ((index * 7) % 38)
    const month = String(1 + ((index * 5) % 12)).padStart(2, '0')
    const day = String(1 + ((index * 11) % 28)).padStart(2, '0')
    return {
      company,
      email: `billing@${domain}`,
      id: `cus_${(1_042 + index * 37).toString(36)}`,
      mrr: status === 'churned' || status === 'trial' ? 0 : seats * SEAT_PRICE[plan],
      plan,
      seats,
      signedUp: `${index % 3 === 0 ? 2024 : 2025}-${month}-${day}`,
      status,
    }
  }),
  title: 'Customers',
}

const STATUS_CONFIG: Record<CustomerStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'good' },
  churned: { label: 'Churned', tone: 'neutral' },
  'past-due': { label: 'Past due', tone: 'bad' },
  trial: { label: 'Trial', tone: 'info' },
}

const STATUS_OPTIONS: DataTableFacetOption[] = (
  ['active', 'trial', 'past-due', 'churned'] as const
).map((status) => ({ label: STATUS_CONFIG[status].label, value: status }))

const PLAN_OPTIONS: DataTableFacetOption[] = ['Free', 'Pro', 'Team', 'Enterprise'].map(
  (plan) => ({ label: plan, value: plan }),
)

const summarize = (rows: CustomerRow[]) => {
  const paying = rows.filter((row) => row.mrr > 0)
  const total = paying.reduce((sum, row) => sum + row.mrr, 0)
  const accounts = `${rows.length} ${rows.length === 1 ? 'account' : 'accounts'}`
  return `${accounts}, ${paying.length} of them paying ${formatCurrency(total)} a month.`
}

const CSV_COLUMNS: (keyof CustomerRow)[] = [
  'id',
  'company',
  'email',
  'status',
  'plan',
  'seats',
  'mrr',
  'signedUp',
]

// Spreadsheets run a cell that starts with one of these as a formula, and names and emails come from your customers.
const FORMULA_START = /^[=+\-@\t\r]/

const csvCell = (value: string | number) => {
  const text =
    typeof value === 'string' && FORMULA_START.test(value) ? `'${value}` : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const downloadCsv = (rows: CustomerRow[]) => {
  const csv = [CSV_COLUMNS, ...rows.map((row) => CSV_COLUMNS.map((key) => row[key]))]
    .map((line) => line.map(csvCell).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'customers.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const openMailto = (rows: CustomerRow[]) => {
  window.location.href = `mailto:?bcc=${rows.map((row) => row.email).join(',')}`
}

const noRows: CustomerRow[] = []

const columnHelper = createDataTableColumnHelper<CustomerRow>()

function buildColumns(options: {
  onDeleteRow?: (row: CustomerRow) => void
  onEditRow?: (row: CustomerRow) => void
  onEmail?: (rows: CustomerRow[]) => void
  onViewRow?: (row: CustomerRow) => void
}) {
  const { onDeleteRow, onEditRow, onEmail, onViewRow } = options
  const hasRowActions = Boolean(onViewRow || onEditRow || onDeleteRow || onEmail)

  const baseColumns = [
    createDataTableSelectColumn<CustomerRow>({ getRowLabel: (row) => row.company }),
    columnHelper.accessor('company', {
      cell: ({ row }) => {
        const customer = row.original
        if (onViewRow) {
          return (
            <button
              type='button'
              onClick={() => onViewRow(customer)}
              className='group block w-full cursor-pointer text-left focus-visible:outline-none'
            >
              <span className='block truncate font-medium group-hover:underline'>
                {customer.company}
              </span>
              <span className='text-muted-foreground block truncate text-xs font-normal'>
                {customer.email}
              </span>
            </button>
          )
        }
        return (
          <>
            <span className='block truncate'>{customer.company}</span>
            <span className='text-muted-foreground block truncate text-xs font-normal'>
              {customer.email}
            </span>
          </>
        )
      },
      enableHiding: false,
      header: 'Customer',
      meta: { primary: true, truncate: true },
    }),
    columnHelper.accessor('status', {
      cell: ({ getValue }) => {
        const status = STATUS_CONFIG[getValue()]
        return <StatusLabel tone={status.tone}>{status.label}</StatusLabel>
      },
      enableGlobalFilter: false,
      enableSorting: false,
      header: 'Status',
      meta: { cellClassName: 'whitespace-nowrap' },
    }),
    columnHelper.accessor('plan', {
      cell: ({ row }) => (
        <Details className='text-muted-foreground'>
          <span className='text-foreground'>{row.original.plan}</span>
          {`${row.original.seats} ${row.original.seats === 1 ? 'seat' : 'seats'}`}
        </Details>
      ),
      header: 'Plan',
      meta: { cellClassName: 'whitespace-nowrap' },
    }),
    columnHelper.accessor('seats', {
      enableGlobalFilter: false,
      header: 'Seats',
      meta: { align: 'end' },
    }),
    columnHelper.accessor('mrr', {
      cell: ({ getValue }) => formatCurrency(getValue()),
      enableGlobalFilter: false,
      header: 'MRR',
      meta: { align: 'end' },
    }),
    columnHelper.accessor('signedUp', {
      cell: ({ getValue }) => formatDate(new Date(getValue()), 'date'),
      enableGlobalFilter: false,
      header: 'Signed up',
      meta: { align: 'end' },
      sortDescFirst: true,
    }),
  ]

  if (!hasRowActions) {
    return columnHelper.columns(baseColumns)
  }

  return columnHelper.columns([
    ...baseColumns,
    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: '',
      meta: { align: 'end', cellClassName: 'w-10' },
      cell: ({ row }) => {
        const customer = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Actions for ${customer.company}`}
                  className='size-7 cursor-pointer'
                />
              }
            >
              <MoreHorizontalIcon className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuGroup>
                <DropdownMenuLabel>{customer.company}</DropdownMenuLabel>
                {onViewRow && (
                  <DropdownMenuItem onClick={() => onViewRow(customer)}>
                    <EyeIcon className='size-3.5' />
                    View details
                  </DropdownMenuItem>
                )}
                {onEditRow && (
                  <DropdownMenuItem onClick={() => onEditRow(customer)}>
                    <PencilIcon className='size-3.5' />
                    Edit account
                  </DropdownMenuItem>
                )}
                {onEmail && (
                  <DropdownMenuItem onClick={() => onEmail([customer])}>
                    <MailIcon className='size-3.5' />
                    Send email
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              {onDeleteRow && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => onDeleteRow(customer)}
                    >
                      <Trash2Icon className='size-3.5' />
                      Delete customer
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }),
  ])
}

const DataTable6 = (props: DataTable6Props) => {
  const {
    headerActions,
    onBulkDelete,
    onDeleteRow,
    onEditRow,
    onEmail = openMailto,
    onExport = downloadCsv,
    onRefresh,
    onViewRow,
    pageSize = 8,
    refreshing: externalRefreshing,
    rows = noRows,
    searchControl,
    errorMessage,
    status,
    title,
  } = props
  const { description = summarize(rows) } = props
  const { refreshing: localRefreshing, refreshKey, triggerRefresh } = useChartRefresh({
    onRefresh,
  })
  const isRefreshing = Boolean(externalRefreshing || localRefreshing)

  const columns = buildColumns({
    onDeleteRow,
    onEditRow,
    onEmail,
    onViewRow,
  })

  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    initialState: {
      columnVisibility: { seats: false },
      sorting: [{ desc: true, id: 'mrr' }],
    },
    pageSize,
  })
  const selected = table.getSelectedRowModel().rows.map((row) => row.original)

  return (
    <BlockStateProvider errorMessage={errorMessage} state={getBlockState(status, rows)}>
      <section className='@container/data-table flex flex-col gap-3'>
        <header className='flex flex-wrap items-start justify-between gap-3'>
          <div className='flex min-w-0 flex-col gap-0.5'>
            <h2 className='font-semibold tracking-tight'>{title}</h2>
            <BlockReady className='text-sm'>
              <p className='text-muted-foreground text-sm'>{description}</p>
            </BlockReady>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            {isRefreshing && <BlockBusyIndicator />}
            {headerActions}
            <ChartRefreshButton
              disabled={status === 'loading'}
              refreshing={isRefreshing}
              onClick={() => void triggerRefresh()}
            />
          </div>
        </header>
        <DashboardBusy refreshing={isRefreshing} label={`Updating ${title.toLowerCase()}`}>
          <div key={refreshKey} className='flex flex-col gap-3'>
            <div className='flex min-h-9 flex-wrap items-center gap-2'>
              {selected.length > 0 ? (
                <DataTableSelectionBar className='w-full' table={table}>
                  <Button variant='outline' size='sm' onClick={() => onExport(selected)}>
                    <DownloadIcon />
                    Export
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => onEmail(selected)}>
                    <MailIcon />
                    Email
                  </Button>
                  {onBulkDelete && (
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => {
                        onBulkDelete(selected)
                        table.resetRowSelection()
                      }}
                    >
                      <Trash2Icon />
                      Delete
                    </Button>
                  )}
                </DataTableSelectionBar>
              ) : (
                <>
                  {searchControl ?? (
                    <DataTableSearch table={table} placeholder='Search customers' />
                  )}
                  <DataTableFacetFilter
                    table={table}
                    columnId='status'
                    options={STATUS_OPTIONS}
                  />
                  <DataTableFacetFilter
                    table={table}
                    columnId='plan'
                    options={PLAN_OPTIONS}
                  />
                  <DataTableReset table={table} />
                  <div className='ml-auto flex items-center gap-2'>
                    <DataTableViewOptions table={table} />
                  </div>
                </>
              )}
            </div>
            <DataTableContent
              caption={`${title}: ${description}`}
              loadingRows={pageSize}
              table={table}
            />
            <DataTablePagination
              className='border-t pt-3'
              pageSizeOptions={[8, 16, 24]}
              table={table}
            />
          </div>
        </DashboardBusy>
      </section>
    </BlockStateProvider>
  )
}

export {
  DataTable6,
  exampleProps as dataTable6ExampleProps,
  SEAT_PRICE,
  STATUS_CONFIG,
  type CustomerPlan,
  type CustomerRow,
  type CustomerStatus,
  type DataTable6Props,
}

