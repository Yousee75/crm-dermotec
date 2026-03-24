import { cn } from '@/lib/utils'
import { Button } from './Button'
import { UsersThree, CalendarBlank, MagnifyingGlass, ChatCircle } from '@phosphor-icons/react'

interface EmptyStateProps {
  icon?: React.ReactNode
  /** Illustration SVG (prioritaire sur icon si fourni) */
  illustration?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  className?: string
  /** Context pour icône par défaut automatique */
  context?: 'contacts' | 'formations' | 'messages' | 'search' | 'default'
}

function EmptyState({ icon, illustration, title, description, action, className, context = 'default' }: EmptyStateProps) {
  // Icônes par défaut selon le contexte
  const getDefaultIcon = () => {
    switch (context) {
      case 'contacts':
        return <UsersThree size={32} />
      case 'formations':
        return <CalendarBlank size={32} />
      case 'messages':
        return <ChatCircle size={32} />
      case 'search':
        return <MagnifyingGlass size={32} />
      default:
        return <MagnifyingGlass size={32} />
    }
  }

  const iconToDisplay = illustration || icon || getDefaultIcon()

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {illustration ? (
        <div className="mb-4">
          {illustration}
        </div>
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-surface-tinted flex items-center justify-center mb-4 text-primary">
          {iconToDisplay}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-muted max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button
          variant="primary"
          size="md"
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState }
