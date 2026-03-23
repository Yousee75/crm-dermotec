import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div>
        <h1
          className="text-2xl font-bold text-accent tracking-tight"
         
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

export { PageHeader }
