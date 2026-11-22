import {
  CommandMenu,
  type CommandMenuGroup,
  CommandMenuTrigger,
  useCommandMenuShortcut,
} from '@/components/dashboardblocks/command-menu'
import { cn } from '@/lib/utils'
import { type ReactNode, useCallback, useState } from 'react'
import { LayoutDashboardIcon, ShoppingCartIcon, UsersIcon, CreditCardIcon, PlusIcon, UserPlusIcon, DownloadIcon } from "lucide-react"

interface CommandMenu1Props {
  className?: string
  groups?: CommandMenuGroup[]
  onAction?: (id: string) => void
  onNavigate?: (href: string) => void
  placeholder?: string
  /** Opens the menu with ⌘ or Ctrl and this key. */
  shortcutKey?: string
  showStatus?: boolean
  triggerClassName?: string
  triggerPlaceholder?: string
}

const exampleProps: CommandMenu1Props = { shortcutKey: '/' }

const pages: CommandMenuGroup = {
  heading: 'Pages',
  items: [
    {
      href: '/',
      icon: (
        <LayoutDashboardIcon
        />
      ),
      id: 'page-overview',
      keywords: ['home', 'dashboard'],
      label: 'Overview',
    },
    {
      href: '/orders',
      icon: (
        <ShoppingCartIcon
        />
      ),
      id: 'page-orders',
      keywords: ['sales', 'purchases'],
      label: 'Orders',
    },
    {
      href: '/customers',
      icon: (
        <UsersIcon
        />
      ),
      id: 'page-customers',
      keywords: ['people', 'contacts'],
      label: 'Customers',
    },
    {
      href: '/settings/billing',
      icon: (
        <CreditCardIcon
        />
      ),
      id: 'page-billing',
      keywords: ['invoices', 'plan', 'payment'],
      label: 'Billing',
    },
  ],
}

const actions: { icon: ReactNode; id: string; label: string; shortcut?: string }[] = [
  {
    icon: (
      <PlusIcon
      />
    ),
    id: 'new-order',
    label: 'Create order',
    shortcut: '⌘N',
  },
  {
    icon: (
      <UserPlusIcon
      />
    ),
    id: 'invite',
    label: 'Invite a teammate',
  },
  {
    icon: (
      <DownloadIcon
      />
    ),
    id: 'export-customers',
    label: 'Export customers',
  },
]

const CommandMenu1 = (props: CommandMenu1Props) => {
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const {
    className,
    groups: customGroups,
    onAction = (id: string) =>
      setLastCommand(actions.find((action) => action.id === id)?.label ?? id),
    onNavigate = (href: string) => setLastCommand(`Go to ${href}`),
    placeholder = 'Search pages and actions',
    shortcutKey = 'k',
    showStatus = true,
    triggerClassName,
    triggerPlaceholder = 'Search or run a command',
  } = props
  const [open, setOpen] = useState(false)
  const openMenu = useCallback(() => setOpen(true), [])
  useCommandMenuShortcut(openMenu, shortcutKey)

  const groups: CommandMenuGroup[] = customGroups ?? [
    pages,
    {
      heading: 'Actions',
      items: actions.map((action) => ({
        ...action,
        onSelect: () => onAction(action.id),
      })),
    },
  ]

  return (
    <section className={cn('@container flex flex-col items-center gap-3', className)}>
      <CommandMenuTrigger
        className={triggerClassName}
        onClick={openMenu}
        placeholder={triggerPlaceholder}
        shortcut={`⌘${shortcutKey.toUpperCase()}`}
      />
      {showStatus && (
        <p role='status' className='text-muted-foreground min-h-5 text-sm'>
          {lastCommand && `Last command: ${lastCommand}.`}
        </p>
      )}
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        onNavigate={onNavigate}
        placeholder={placeholder}
      />
    </section>
  )
}

export { CommandMenu1, exampleProps as commandMenu1ExampleProps, type CommandMenu1Props }
