import type { ResumoRifa } from '@/types'
import { formatBRL } from '@/lib/format'
import { Card } from '@/components/ui/Card'

interface ResumoPainelProps {
  resumo: ResumoRifa
}

export function ResumoPainel({ resumo }: ResumoPainelProps) {
  const progresso = resumo.total > 0 ? Math.round((resumo.vendidos / resumo.total) * 100) : 0

  return (
    <Card className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">
        <Metrica rotulo="Total" valor={String(resumo.total)} />
        <Metrica rotulo="Vendidos" valor={String(resumo.vendidos)} cor="text-accent-soft" />
        <Metrica rotulo="Livres" valor={String(resumo.livres)} />
      </div>

      <div className="space-y-1.5">
        <div className="h-2 overflow-hidden rounded-full bg-base-900">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progresso}%` }} />
        </div>
        <p className="text-right text-xs text-gray-500">{progresso}% vendidos</p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
        <Metrica rotulo="Arrecadado (pago)" valor={formatBRL(resumo.arrecadado)} cor="text-emerald-300" grande />
        <Metrica rotulo="Pendente (reservado)" valor={formatBRL(resumo.pendente)} cor="text-amber-300" grande />
      </div>

      <p className="text-xs text-gray-500">
        Potencial total se tudo for vendido: {formatBRL(resumo.potencialTotal)}
      </p>
    </Card>
  )
}

function Metrica({
  rotulo,
  valor,
  cor = 'text-white',
  grande = false,
}: {
  rotulo: string
  valor: string
  cor?: string
  grande?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{rotulo}</p>
      <p className={`font-display font-semibold tabular-nums ${cor} ${grande ? 'text-xl' : 'text-2xl'}`}>
        {valor}
      </p>
    </div>
  )
}
