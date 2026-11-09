import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  aberto: boolean
  onFechar: () => void
  titulo?: ReactNode
  children: ReactNode
  /** Conteúdo fixo no rodapé (botões de ação). */
  rodape?: ReactNode
}

export function Modal({ aberto, onFechar, titulo, children, rodape }: ModalProps) {
  // Fecha no Esc e trava o scroll do body enquanto aberto.
  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', onKey)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onFechar}
      role="presentation"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-base-800 shadow-card animate-scale-in sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {titulo && (
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-white">{titulo}</h2>
            <button
              onClick={onFechar}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-base-700 hover:text-white"
              aria-label="Fechar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && (
          <div className="flex items-center justify-end gap-2 border-t border-white/5 px-5 py-4">
            {rodape}
          </div>
        )}
      </div>
    </div>
  )
}
