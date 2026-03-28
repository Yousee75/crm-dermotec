import { forwardRef, useCallback, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

// Inspiré Bright Data : pas de shadow sur les boutons, pill shape, hover = couleur change
const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-primary hover:bg-primary-dark text-white active:scale-[0.97]',
  primary: 'bg-primary hover:bg-primary-dark text-white active:scale-[0.97]',
  secondary: 'bg-accent hover:bg-accent-light text-white active:scale-[0.97]',
  ghost: 'hover:bg-[#F5F5F5] text-[#3A3A3A] active:scale-[0.97]',
  destructive: 'bg-error hover:bg-error/90 text-white active:scale-[0.97]',
  outline: 'border border-border bg-white hover:bg-surface-hover text-text active:scale-[0.97]',
  link: 'text-primary hover:text-primary-dark underline-offset-4 hover:underline p-0 h-auto',
}

// Pill shape (rounded-full) sur md/lg — inspiré Bright Data, Stripe, Linear
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-full gap-1',
  sm: 'h-8 px-3.5 text-xs rounded-full gap-1.5',
  md: 'h-9 px-5 text-sm rounded-full gap-2',
  lg: 'h-11 px-7 text-sm rounded-full gap-2 font-semibold',
  icon: 'h-9 w-9 rounded-full flex items-center justify-center p-0',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, onClick, ...props }, ref) => {
    const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
      // Ripple effect
      const btn = e.currentTarget
      const rect = btn.getBoundingClientRect()
      const ripple = document.createElement('span')
      const diameter = Math.max(rect.width, rect.height)
      ripple.style.width = ripple.style.height = `${diameter}px`
      ripple.style.left = `${e.clientX - rect.left - diameter / 2}px`
      ripple.style.top = `${e.clientY - rect.top - diameter / 2}px`
      ripple.className = 'ripple-effect'
      btn.appendChild(ripple)
      ripple.addEventListener('animationend', () => ripple.remove())
      onClick?.(e)
    }, [onClick])

    return (
      <button
        ref={ref}
        className={cn(
          'ripple-container inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          'disabled:opacity-50 disabled:pointer-events-none',
          'active:scale-[0.97]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin-slow h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize }
