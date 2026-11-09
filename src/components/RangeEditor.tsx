import { useState } from 'react'
import type { Faixa } from '@/types'
import { numerosDaRifa, validarFaixas } from '@/lib/rifa'
import { Button } from '@/components/ui/Button'

interface RangeEditorProps {
  faixas: Faixa[]
  onChange: (faixas: Faixa[]) => void
}

export function RangeEditor({ faixas, onChange }: RangeEditorProps) {
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const total = numerosDaRifa(faixas).length

  function adicionar() {
    const i = Number(inicio)
    const f = Number(fim)
    if (inicio.trim() === '' || fim.trim() === '' || !Number.isFinite(i) || !Number.isFinite(f)) {
      setErro('Informe início e fim da faixa.')
      return
    }
    const candidata: Faixa = { inicio: Math.trunc(i), fim: Math.trunc(f) }
    const resultado = validarFaixas([...faixas, candidata])
    if (!resultado.ok) {
      setErro(resultado.erro ?? 'Faixa inválida.')
      return
    }
    onChange([...faixas, candidata].sort((a, b) => a.inicio - b.inicio))
    setInicio('')
    setFim('')
    setErro(null)
  }

  function remover(idx: number) {
    onChange(faixas.filter((_, i) => i !== idx))
    setErro(null)
  }

  const campo =
    'w-full rounded-card border border-white/10 bg-base-900 px-3 py-2.5 text-center text-gray-100 placeholder:text-gray-500 focus:border-accent focus:outline-none'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Faixas de números</span>
        <span className="text-xs text-gray-500">
          {total} {total === 1 ? 'número' : 'números'}
        </span>
      </div>

      {faixas.length > 0 && (
        <ul className="space-y-2">
          {faixas.map((f, idx) => (
            <li
              key={`${f.inicio}-${f.fim}-${idx}`}
              className="flex items-center justify-between rounded-card border border-white/5 bg-base-900 px-3 py-2"
            >
              <span className="font-mono text-sm text-gray-200">
                {f.inicio} <span className="text-gray-500">–</span> {f.fim}
                <span className="ml-2 text-xs text-gray-500">({f.fim - f.inicio + 1})</span>
              </span>
              <button
                onClick={() => remover(idx)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-base-700 hover:text-red-400"
                aria-label={`Remover faixa ${f.inicio}–${f.fim}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <span className="mb-1 block text-xs text-gray-500">Início</span>
          <input
            type="number"
            inputMode="numeric"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
            placeholder="551"
            className={campo}
          />
        </div>
        <span className="pb-2.5 text-gray-500">–</span>
        <div className="flex-1">
          <span className="mb-1 block text-xs text-gray-500">Fim</span>
          <input
            type="number"
            inputMode="numeric"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
            placeholder="560"
            className={campo}
          />
        </div>
        <Button variante="secondary" onClick={adicionar} className="shrink-0">
          Adicionar
        </Button>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}
    </div>
  )
}
