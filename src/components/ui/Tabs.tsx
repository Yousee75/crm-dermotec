'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
}

function Tabs({ tabs, defaultTab, onChange, className, variant = 'default' }: TabsProps) {
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
          ? 'bg-white text-[#082545] shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      ),
    },
    pills: {
      container: 'flex gap-2',
      tab: (isActive: boolean) => cn(
        baseStyles,
        'px-3 py-1.5 rounded-full',
        isActive
          ? 'bg-[#2EC6F3]/10 text-[#1BA8D4]'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      ),
    },
    underline: {
      container: 'flex gap-6 border-b border-gray-200',
      tab: (isActive: boolean) => cn(
        baseStyles,
        'pb-2.5 -mb-px',
        isActive
          ? 'text-[#082545] border-b-2 border-[#2EC6F3]'
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
                ? 'bg-[#2EC6F3]/20 text-[#1BA8D4]'
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

export { Tabs, type Tab }
