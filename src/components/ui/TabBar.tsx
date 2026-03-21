'use client'

import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export function TabBar({ tabs, activeTab, onChange, className }: TabBarProps) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-gray-200 mb-6", className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
            activeTab === tab.id
              ? 'border-[#2EC6F3] text-[#2EC6F3]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}