import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger'
type Tamanho = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-colors duration-150 ease-out focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

const variantes: Record<Variante, string> = {
  primary: 'bg-accent text-base-950 hover:bg-accent-soft active:bg-accent shadow-glow-cyan',
  secondary: 'bg-base-700 text-gray-100 hover:bg-base-600',
  ghost: 'bg-transparent text-gray-300 hover:bg-base-800 hover:text-white',
  danger: 'bg-red-500/90 text-white hover:bg-red-500',
}

const tamanhos: Record<Tamanho, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

export function Button({
  variante = 'primary',
  tamanho = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variantes[variante]} ${tamanhos[tamanho]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
