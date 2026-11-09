import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

const campoBase =
  'w-full rounded-card border border-white/10 bg-base-900 px-3 py-2.5 text-gray-100 placeholder:text-gray-500 transition-colors focus:border-accent focus:outline-none'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  hint?: ReactNode
}

export function Input({ label, hint, className = '', id, ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>}
      <input id={id} className={`${campoBase} ${className}`} {...props} />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
}

export function Textarea({ label, hint, className = '', ...props }: TextareaProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>}
      <textarea className={`${campoBase} resize-none ${className}`} {...props} />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  )
}
