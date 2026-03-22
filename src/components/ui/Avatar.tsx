import { cn } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  src?: string
  size?: AvatarSize
  color?: string
  status?: 'online' | 'offline' | 'busy' | 'away'
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[9px]', status: 'w-2 h-2 border' },
  sm: { container: 'w-8 h-8', text: 'text-[10px]', status: 'w-2.5 h-2.5 border-[1.5px]' },
  md: { container: 'w-10 h-10', text: 'text-xs', status: 'w-3 h-3 border-2' },
  lg: { container: 'w-12 h-12', text: 'text-sm', status: 'w-3.5 h-3.5 border-2' },
  xl: { container: 'w-16 h-16', text: 'text-lg', status: 'w-4 h-4 border-2' },
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
}

function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getColorFromName(name: string): string {
  const colors = [
    'var(--color-primary)', '#8B5CF6', '#F59E0B', '#22C55E', '#EF4444',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#3B82F6',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function Avatar({ name = '?', src, size = 'md', color, status, className, ...props }: AvatarProps) {
  const s = sizeStyles[size]
  const bgColor = color || getColorFromName(name)
  const initials = getInitialsFromName(name)

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(s.container, 'rounded-full object-cover ring-2 ring-white')}
        />
      ) : (
        <div
          className={cn(
            s.container,
            'rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white',
            s.text
          )}
          style={{ backgroundColor: bgColor }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-white',
            statusColors[status],
            s.status
          )}
        />
      )}
    </div>
  )
}

function AvatarGroup({ children, max = 4, className }: { children: React.ReactNode; max?: number; className?: string }) {
  const items = Array.isArray(children) ? children : [children]
  const shown = items.slice(0, max)
  const overflow = items.length - max

  return (
    <div className={cn('flex -space-x-2', className)}>
      {shown}
      {overflow > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-500">
          +{overflow}
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarGroup }
