import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './card'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'cyan'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({ title, value, icon: Icon, color = 'green', trend }: StatCardProps) {
  const colors = {
    green: 'rgb(var(--whoop-green))',
    red: 'rgb(var(--whoop-red))',
    yellow: 'rgb(var(--whoop-yellow))',
    blue: 'rgb(var(--whoop-blue))',
    purple: 'rgb(var(--whoop-purple))',
    cyan: 'rgb(var(--whoop-cyan))'
  }
  
  const bgColors = {
    green: 'rgb(var(--whoop-green) / 0.1)',
    red: 'rgb(var(--whoop-red) / 0.1)',
    yellow: 'rgb(var(--whoop-yellow) / 0.1)',
    blue: 'rgb(var(--whoop-blue) / 0.1)',
    purple: 'rgb(var(--whoop-purple) / 0.1)',
    cyan: 'rgb(var(--whoop-cyan) / 0.1)'
  }
  
  return (
    <Card elevated>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="whoop-metric-label">{title}</p>
            <p className="whoop-metric mt-2">{value.toLocaleString()}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-[rgb(var(--whoop-green))]' : 'text-[rgb(var(--whoop-red))]'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}% from last month
              </p>
            )}
          </div>
          <div 
            className="p-3 rounded-full" 
            style={{ backgroundColor: bgColors[color] }}
          >
            <Icon className="w-6 h-6" style={{ color: colors[color] }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}