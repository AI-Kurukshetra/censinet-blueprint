'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Shield,
  FileText,
  AlertTriangle,
  FolderOpen,
  Bell,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/shared/brand-logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Assessments', href: '/assessments', icon: ClipboardCheck },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Documents', href: '/documents', icon: FolderOpen },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Audit Trail', href: '/audit-trail', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
] as const

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const profile = useAuth((s) => s.profile)
  const signOut = useAuth((s) => s.signOut)

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
    : ''
  const initials = profile
    ? [profile.first_name, profile.last_name]
        .filter(Boolean)
        .map((n) => n!.charAt(0).toUpperCase())
        .join('') || profile.email.charAt(0).toUpperCase()
    : ''
  const roleLabel = profile?.role
    ? profile.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <BrandLogo
          showText={!collapsed}
          className="gap-2.5"
          textClassName="text-xl font-semibold text-sidebar-foreground"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4" role="navigation" aria-label="Main navigation">
        <ul className="space-y-1" role="list">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-primary/15 text-sidebar-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.icon className="size-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="text-base">{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            'w-full text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'justify-center' : 'justify-end'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      {/* User profile */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            'flex items-center gap-3',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-white">
            {initials || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {displayName || 'Loading...'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabel}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={async () => {
                await signOut()
                router.push('/login')
              }}
              className="shrink-0 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
