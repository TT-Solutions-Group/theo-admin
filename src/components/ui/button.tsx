import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-semibold transition-all duration-200 active:scale-95 inline-flex items-center justify-center gap-2'
  
  const variants = {
    primary: 'bg-[rgb(var(--whoop-green))] text-black hover:opacity-90',
    secondary: 'bg-[rgb(var(--card-elevated))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--card))]',
    danger: 'bg-[rgb(var(--whoop-red))] text-white hover:opacity-90',
    ghost: 'bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card))]'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-[12px]',
    md: 'px-6 py-3 text-base rounded-[16px]',
    lg: 'px-8 py-4 text-lg rounded-[20px]'
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
        (disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
}