'use client'

import { useState, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// Simple Tabs (array-based)
// ============================================================

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

interface SimpleTabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

function Tabs({ tabs, defaultTab, onChange, className, variant = 'default' }: SimpleTabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  const handleChange = (tabId: string) => {
    setActive(tabId)
    onChange?.(tabId)
  }

  const baseStyles = 'relative flex items-center gap-1.5 text-sm font-medium transition-all duration-150 whitespace-nowrap'

  const variants = {
    default: {
      container: 'flex gap-1 p-1 bg-gray-100 rounded-lg',
      tab: (isActive: boolean) => cn(
        baseStyles,
        'px-3 py-1.5 rounded-md',
        isActive
          ? 'bg-white text-accent shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      ),
    },
    pills: {
      container: 'flex gap-2',
      tab: (isActive: boolean) => cn(
        baseStyles,
        'px-3 py-1.5 rounded-full',
        isActive
          ? 'bg-primary/10 text-[#1BA8D4]'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      ),
    },
    underline: {
      container: 'flex gap-6 border-b border-gray-200',
      tab: (isActive: boolean) => cn(
        baseStyles,
        'pb-2.5 -mb-px',
        isActive
          ? 'text-accent border-b-2 border-primary'
          : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
      ),
    },
  }

  const v = variants[variant]

  return (
    <div className={cn(v.container, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleChange(tab.id)}
          className={v.tab(active === tab.id)}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span className={cn(
              'ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-medium',
              active === tab.id
                ? 'bg-primary/20 text-[#1BA8D4]'
                : 'bg-gray-200 text-gray-500'
            )}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ============================================================
// Radix-style Tabs (compound components)
// ============================================================

const TabsContext = createContext<{ value: string; onValueChange?: (v: string) => void }>({ value: '' })

interface TabsRootProps {
  value: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

function TabsRoot({ value, onValueChange, className, children }: TabsRootProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex gap-1 p-1 bg-gray-100 rounded-lg', className)}>
      {children}
    </div>
  )
}

function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext)
  const isActive = ctx.value === value
  return (
    <button
      className={cn(
        'relative flex items-center gap-1.5 text-sm font-medium transition-all duration-150 whitespace-nowrap px-3 py-1.5 rounded-md',
        isActive ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700',
        className
      )}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => ctx.onValueChange?.(value)}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}

export { Tabs, TabsRoot, TabsList, TabsTrigger, TabsContent, type Tab }
