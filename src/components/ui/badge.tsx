import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'cyan' | 'default'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    green: 'whoop-badge-green',
    red: 'whoop-badge-red',
    yellow: 'whoop-badge-yellow',
    blue: 'whoop-badge-blue',
    purple: 'bg-[rgb(var(--whoop-purple))/0.2] text-[rgb(var(--whoop-purple))]',
    cyan: 'bg-[rgb(var(--whoop-cyan))/0.2] text-[rgb(var(--whoop-cyan))]',
    default: 'bg-[rgb(var(--card-elevated))] text-[rgb(var(--foreground))]'
  }
  
  return (
    <span className={`whoop-badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}