'use client'

import {
  CommandMenu,
  type CommandMenuGroup,
  CommandMenuTrigger,
} from '@/components/dashboardblocks/command-menu'
import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'
import { CircleUserRoundIcon, ShoppingCartIcon } from "lucide-react"

interface CommandMenu2Props {
  className?: string
  emptyMessage?: string
  onNavigate?: (href: string) => void
  placeholder?: string
  recent?: CommandMenuGroup
  search?: (query: string) => Promise<CommandMenuGroup[]>
  showStatus?: boolean
  title?: string
  triggerClassName?: string
}

const customerIcon = (
  <CircleUserRoundIcon
  />
)

const orderIcon = (
  <ShoppingCartIcon
  />
)

const customers = [
  { email: 'jonas@northwind.io', id: 'c1', name: 'Jonas Weber' },
  { email: 'priya@lumen.dev', id: 'c2', name: 'Priya Nair' },
  { email: 'mateo@fieldnote.co', id: 'c3', name: 'Mateo Silva' },
  { email: 'priya@relay.dev', id: 'c4', name: 'Priya Nair' },
  { email: 'lena@northwind.io', id: 'c5', name: 'Lena Fischer' },
]

const orders = [
  { customer: 'Jonas Weber', id: '1042', total: '$652.22' },
  { customer: 'Priya Nair', id: '1041', total: '$89.00' },
  { customer: 'Priya Nair', id: '1038', total: '$1,210.00' },
  { customer: 'Mateo Silva', id: '1031', total: '$94.50' },
]

const exampleProps: Required<Pick<CommandMenu2Props, 'recent'>> = {
  recent: {
    heading: 'Recently viewed',
    items: [
      {
        description: 'jonas@northwind.io',
        href: '/customers/c1',
        icon: customerIcon,
        id: 'recent-c1',
        label: 'Jonas Weber',
      },
      {
        description: 'Priya Nair',
        href: '/orders/1041',
        icon: orderIcon,
        id: 'recent-1041',
        label: 'Order #1041',
        meta: '$89.00',
      },
    ],
  },
}

async function searchRecords(query: string): Promise<CommandMenuGroup[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const needle = query.toLowerCase()
  const groups: CommandMenuGroup[] = [
    {
      heading: 'Customers',
      items: customers
        .filter((customer) =>
          `${customer.name} ${customer.email}`.toLowerCase().includes(needle),
        )
        .map((customer) => ({
          description: customer.email,
          href: `/customers/${customer.id}`,
          icon: customerIcon,
          id: customer.id,
          label: customer.name,
        })),
    },
    {
      heading: 'Orders',
      items: orders
        .filter((order) =>
          `#${order.id} ${order.customer}`.toLowerCase().includes(needle),
        )
        .map((order) => ({
          description: order.customer,
          href: `/orders/${order.id}`,
          icon: orderIcon,
          id: `order-${order.id}`,
          label: `Order #${order.id}`,
          meta: order.total,
        })),
    },
  ]
  return groups.filter((group) => group.items.length > 0)
}

const CommandMenu2 = (props: CommandMenu2Props) => {
  const [opened, setOpened] = useState<string | null>(null)
  const {
    className,
    emptyMessage,
    onNavigate = (href: string) => setOpened(href),
    placeholder = 'Search customers and orders',
    recent = exampleProps.recent,
    search = searchRecords,
    showStatus = true,
    title = 'Search',
    triggerClassName,
  } = props
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CommandMenuGroup[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latest = useRef(0)

  function changeQuery(next: string) {
    setQuery(next)
    clearTimeout(timer.current)
    const request = ++latest.current
    if (!next.trim()) {
      setLoading(false)
      setResults([])
      return
    }
    setLoading(true)
    timer.current = setTimeout(() => {
      void search(next.trim()).then((groups) => {
        if (request !== latest.current) return
        setResults(groups)
        setLoading(false)
      })
    }, 250)
  }

  return (
    <section className={cn('@container flex flex-col items-center gap-3', className)}>
      <CommandMenuTrigger
        className={triggerClassName}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        shortcut={null}
      />
      {showStatus && (
        <p role='status' className='text-muted-foreground min-h-5 text-sm'>
          {opened && `Opened ${opened}`}
        </p>
      )}
      <CommandMenu
        emptyMessage={emptyMessage}
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={changeQuery}
        groups={query.trim() ? results : [recent]}
        loading={loading}
        onNavigate={onNavigate}
        placeholder={placeholder}
        title={title}
      />
    </section>
  )
}

export { CommandMenu2, exampleProps as commandMenu2ExampleProps, type CommandMenu2Props }
