import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'primary' | 'success' | 'warning' | 'error' | 'destructive' | 'info' | 'outline' | 'custom'
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pulse?: boolean
  color?: string
  bgColor?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  secondary: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary/10 text-primary-dark',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  destructive: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  outline: 'border border-gray-200 text-gray-600 bg-white',
  custom: '',
}

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1 py-0 text-[9px]',
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-xs',
}

function Badge({ className, variant = 'default', size = 'md', dot, pulse, color, bgColor, children, style, ...props }: BadgeProps) {
  const customStyle = variant === 'custom' ? { color, backgroundColor: bgColor, ...style } : style

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      style={customStyle}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          pulse && 'animate-pulse-soft',
        )} style={{ backgroundColor: color || 'currentColor' }} />
      )}
      {children}
    </span>
  )
}

function StatusBadge({ status, label, color }: { status: string; label: string; color: string }) {
  return (
    <Badge
      variant="custom"
      size="md"
      dot
      bgColor={`${color}15`}
      color={color}
    >
      {label}
    </Badge>
  )
}

export { Badge, StatusBadge, type BadgeVariant }
