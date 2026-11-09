import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export interface OpcoesConfirm {
  titulo?: ReactNode
  mensagem: ReactNode
  confirmarTexto?: string
  cancelarTexto?: string
  /** Botão de confirmação em vermelho (ações destrutivas). */
  perigoso?: boolean
}

type FnConfirm = (opcoes: OpcoesConfirm) => Promise<boolean>

const ConfirmContext = createContext<FnConfirm | null>(null)

/**
 * Substitui o window.confirm por um modal no visual do app.
 * Uso: `const confirmar = useConfirm(); if (await confirmar({ mensagem })) { ... }`
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opcoes, setOpcoes] = useState<OpcoesConfirm | null>(null)
  const resolverRef = useRef<((v: boolean) => void) | null>(null)

  const confirmar = useCallback<FnConfirm>((opts) => {
    setOpcoes(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const fechar = useCallback((resultado: boolean) => {
    resolverRef.current?.(resultado)
    resolverRef.current = null
    setOpcoes(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <Modal
        aberto={opcoes !== null}
        onFechar={() => fechar(false)}
        titulo={opcoes?.titulo ?? 'Confirmar'}
        rodape={
          <>
            <Button variante="ghost" onClick={() => fechar(false)}>
              {opcoes?.cancelarTexto ?? 'Cancelar'}
            </Button>
            <Button variante={opcoes?.perigoso ? 'danger' : 'primary'} onClick={() => fechar(true)}>
              {opcoes?.confirmarTexto ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{opcoes?.mensagem}</p>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): FnConfirm {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm precisa estar dentro de <ConfirmProvider>')
  return ctx
}
