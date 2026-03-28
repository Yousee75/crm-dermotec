import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'primary' | 'success' | 'warning' | 'error' | 'destructive' | 'info' | 'outline' | 'custom'
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pulse?: boolean
  bounce?: boolean
  color?: string
  bgColor?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#F5F5F5] text-[#3A3A3A]',
  secondary: 'bg-[#F5F5F5] text-[#3A3A3A]',
  primary: 'bg-primary/10 text-primary-dark',
  success: 'bg-[#ECFDF5] text-[#10B981]',
  warning: 'bg-[#FFF3E8] text-[#FF8C42]',
  error: 'bg-[#FFE0EF] text-[#FF2D78]',
  destructive: 'bg-[#FFE0EF] text-[#FF2D78]',
  info: 'bg-[#E0EBF5] text-[#6B8CAE]',
  outline: 'border border-[#EEEEEE] text-[#777777] bg-white',
  custom: '',
}

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1 py-0 text-[9px]',
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-xs',
}

function Badge({ className, variant = 'default', size = 'md', dot, pulse, bounce, color, bgColor, children, style, ...props }: BadgeProps) {
  const customStyle = variant === 'custom' ? { color, backgroundColor: bgColor, ...style } : style
  const isUrgent = variant === 'error' || variant === 'destructive' || variant === 'warning'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap transition-all duration-200',
        variantStyles[variant],
        sizeStyles[size],
        bounce && 'animate-bounceIn',
        isUrgent && pulse && 'relative',
        className
      )}
      style={customStyle}
      {...props}
    >
      {isUrgent && pulse && (
        <span
          className="absolute inset-0 rounded-full animate-pulse-ring opacity-30"
          style={{ backgroundColor: color || 'currentColor' }}
          aria-hidden="true"
        />
      )}
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
