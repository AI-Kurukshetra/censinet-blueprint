'use client'

import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export interface ActivityEntry {
  id: string
  user_name: string
  user_email: string
  action: string
  resource_type: string
  resource_name: string
  created_at: string
}

interface RecentActivityProps {
  activities: ActivityEntry[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getResourceBadgeVariant(
  resourceType: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (resourceType) {
    case 'vendor':
      return 'default'
    case 'assessment':
      return 'secondary'
    case 'incident':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
        >
          <Avatar className="mt-0.5">
            <AvatarFallback>{getInitials(activity.user_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{activity.user_name}</span>
              <Badge variant={getResourceBadgeVariant(activity.resource_type)}>
                {activity.resource_type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {activity.action}{' '}
              <span className="font-medium text-foreground">
                {activity.resource_name}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
