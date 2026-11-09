import { useMemo, useState } from 'react'
import type { Rifa } from '@/types'
import { resumo as calcularResumo } from '@/lib/rifa'
import type { DadosBilhete } from '@/hooks/useRifas'
import { Button } from '@/components/ui/Button'
import { ResumoPainel } from '@/components/ResumoPainel'
import { NumberGrid } from '@/components/NumberGrid'
import { TicketModal } from '@/components/TicketModal'
import { Membros } from '@/components/Membros'

interface RifaDetailProps {
  rifa: Rifa
  onVoltar: () => void
  onEditar: () => void
  onRegistrar: (numero: number, dados: DadosBilhete) => void
  onRegistrarLote: (numeros: number[], dados: DadosBilhete) => void
  onMarcarPagosLote: (numeros: number[]) => void
  onLiberar: (numero: number) => void
  onLiberarLote: (numeros: number[]) => void
  meuId: number
  somenteLeitura: boolean
  onAdicionarMembro: (email: string) => Promise<boolean>
  onRemoverMembro: (usuarioId: number) => void
}

export function RifaDetail({
  rifa,
  onVoltar,
  onEditar,
  onRegistrar,
  onRegistrarLote,
  onMarcarPagosLote,
  onLiberar,
  onLiberarLote,
  meuId,
  somenteLeitura,
  onAdicionarMembro,
  onRemoverMembro,
}: RifaDetailProps) {
  const [numeroSelecionado, setNumeroSelecionado] = useState<number | null>(null)
  const resumo = useMemo(() => calcularResumo(rifa), [rifa])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-3">
        <button
          onClick={onVoltar}
          className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Todas as rifas
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-white">{rifa.nome}</h1>
            {rifa.descricao && <p className="mt-1 text-sm text-gray-400">{rifa.descricao}</p>}
          </div>
          {!somenteLeitura && (
            <Button variante="secondary" tamanho="sm" onClick={onEditar} className="shrink-0">
              Editar
            </Button>
          )}
        </div>
      </header>

      <ResumoPainel resumo={resumo} />

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Números</h2>
        <NumberGrid
          rifa={rifa}
          onSelecionarUm={setNumeroSelecionado}
          onRegistrarLote={onRegistrarLote}
          onMarcarPagosLote={onMarcarPagosLote}
          onLiberarLote={onLiberarLote}
        />
      </section>

      <Membros
        rifa={rifa}
        meuId={meuId}
        somenteLeitura={somenteLeitura}
        onAdicionar={onAdicionarMembro}
        onRemover={onRemoverMembro}
      />

      <TicketModal
        rifa={rifa}
        numero={numeroSelecionado}
        onFechar={() => setNumeroSelecionado(null)}
        onRegistrar={onRegistrar}
        onLiberar={onLiberar}
      />
    </div>
  )
}
