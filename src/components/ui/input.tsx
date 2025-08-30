import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[rgb(var(--secondary-foreground))] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`whoop-input ${error ? 'border-[rgb(var(--whoop-red))]' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-[rgb(var(--whoop-red))]">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'