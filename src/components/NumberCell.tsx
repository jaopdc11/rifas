import type { StatusNumero } from '@/types'

interface NumberCellProps {
  numero: number
  status: StatusNumero
  /** Nome do comprador (quando o número não está livre) — exibido no hover. */
  comprador?: string
  /** Telefone/contato do comprador — exibido no hover. */
  contato?: string
  /** No modo de seleção, indica se o número está marcado. */
  selecionado?: boolean
  /** Realça o número escolhido como início de um intervalo (aguardando o fim). */
  marcadoInicio?: boolean
  onClick: (shiftKey: boolean) => void
}

const estilos: Record<StatusNumero, string> = {
  livre: 'bg-base-700 text-gray-300 hover:bg-base-600 border-white/5',
  reservado: 'bg-reservado/20 text-amber-300 border-reservado/40 hover:bg-reservado/30',
  pago: 'bg-pago/20 text-emerald-300 border-pago/40 hover:bg-pago/30',
}

export function NumberCell({
  numero,
  status,
  comprador,
  contato,
  selecionado,
  marcadoInicio,
  onClick,
}: NumberCellProps) {
  const realce = marcadoInicio
    ? 'ring-2 ring-accent-soft ring-offset-2 ring-offset-base-950 animate-pulse'
    : selecionado
      ? 'ring-2 ring-accent ring-offset-2 ring-offset-base-950'
      : ''
  return (
    <div className="group relative hover:z-30">
      <button
        onClick={(e) => onClick(e.shiftKey)}
        className={`flex aspect-square w-full items-center justify-center rounded-lg border font-mono text-sm font-medium tabular-nums transition-colors duration-100 ${estilos[status]} ${realce}`}
        aria-label={`Número ${numero} — ${status}${comprador ? ` — ${comprador}` : ''}${selecionado ? ' — selecionado' : ''}`}
        aria-pressed={selecionado}
      >
        {numero}
      </button>

      {comprador && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden w-max max-w-[11rem] -translate-x-1/2 group-hover:block"
        >
          <div className="rounded-lg border border-white/10 bg-base-950/95 px-2.5 py-1.5 text-left shadow-card backdrop-blur-sm">
            <p className="truncate text-xs font-medium text-white">{comprador}</p>
            {contato ? (
              <p className="mt-0.5 font-mono text-[11px] text-gray-400">{contato}</p>
            ) : (
              <p className="mt-0.5 text-[11px] italic text-gray-500">sem contato</p>
            )}
          </div>
          <div className="mx-auto -mt-1 h-2 w-2 rotate-45 border-b border-r border-white/10 bg-base-950/95" />
        </div>
      )}
    </div>
  )
}
