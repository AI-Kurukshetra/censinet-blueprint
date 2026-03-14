'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, useRef, useEffect } from 'react'
import {
  Bell,
  Search,
  ChevronRight,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

interface HeaderProps {
  onMenuClick?: () => void
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  vendors: 'Vendors',
  assessments: 'Assessments',
  compliance: 'Compliance',
  contracts: 'Contracts',
  incidents: 'Incidents',
  documents: 'Documents',
  alerts: 'Alerts',
  'audit-trail': 'Audit Trail',
  settings: 'Settings',
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const profile = useAuth((s) => s.profile)
  const signOut = useAuth((s) => s.signOut)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const orgName = profile?.organizations?.name || ''
  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
    : ''
  const initials = profile
    ? [profile.first_name, profile.last_name]
        .filter(Boolean)
        .map((n) => n!.charAt(0).toUpperCase())
        .join('') || profile.email.charAt(0).toUpperCase()
    : ''

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => ({
      label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: '/' + segments.slice(0, index + 1).join('/'),
      isLast: index === segments.length - 1,
    }))
  }, [pathname])

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                {crumb.isLast ? (
                  <span className="text-lg font-semibold leading-none text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    onClick={() => router.push(crumb.href)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <Button
          variant="outline"
          size="default"
          className="hidden w-64 justify-start text-muted-foreground md:flex"
          onClick={() => {
            /* TODO: open command palette */
          }}
          aria-label="Search"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left text-sm">Search...</span>
          <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            <span className="text-xs">Cmd</span>K
          </kbd>
        </Button>

        {/* Organization name */}
        {orgName && (
          <span className="hidden text-sm font-medium text-muted-foreground xl:block">
            {orgName}
          </span>
        )}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="View notifications"
          onClick={() => router.push('/alerts')}
        >
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </Button>

        {/* User dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-80"
            aria-label="User menu"
            onClick={() => setUserMenuOpen((prev) => !prev)}
          >
            {initials || '?'}
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-md border border-border bg-background py-1 shadow-lg">
              <div className="border-b border-border px-4 py-2">
                <p className="text-sm font-medium">{displayName}</p>
                {profile?.email && (
                  <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                )}
              </div>
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => {
                  setUserMenuOpen(false)
                  router.push('/settings')
                }}
              >
                <Settings className="size-4" />
                Settings
              </button>
              <button
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted"
                onClick={async () => {
                  setUserMenuOpen(false)
                  await signOut()
                  router.push('/login')
                }}
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
