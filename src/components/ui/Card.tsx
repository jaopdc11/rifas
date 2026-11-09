import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-white/5 bg-base-800 shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
