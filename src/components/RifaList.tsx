import { useRef, useState } from 'react'
import type { Rifa } from '@/types'
import { resumo as calcularResumo } from '@/lib/rifa'
import { formatBRL } from '@/lib/format'
import { exportarBackup, importarBackup } from '@/lib/storage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/Confirm'

interface RifaListProps {
  rifas: Rifa[]
  onNova: () => void
  onAbrir: (rifaId: string) => void
  onEditar: (rifaId: string) => void
  onRemover: (rifaId: string) => void
  /** Envia as rifas pro servidor como novas; devolve quantas foram criadas (null = falhou). */
  onImportar: (rifas: Rifa[]) => Promise<number | null>
  somenteLeitura: boolean
  usuarioNome: string
  onSair: () => void
}

export function RifaList({
  rifas,
  onNova,
  onAbrir,
  onEditar,
  onRemover,
  onImportar,
  somenteLeitura,
  usuarioNome,
  onSair,
}: RifaListProps) {
  const inputFile = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const confirmar = useConfirm()

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reimportar o mesmo arquivo
    if (!file) return
    const res = await importarBackup(file)
    if (!res.ok || !res.rifas) {
      setAviso(res.erro ?? 'Falha ao importar.')
      return
    }
    const total = res.rifas.length
    const ok = await confirmar({
      titulo: 'Importar backup',
      mensagem: `Enviar ${total} ${total === 1 ? 'rifa' : 'rifas'} do backup pro servidor?\n\nElas entram como rifas novas suas. Nada existente é apagado.`,
      confirmarTexto: 'Importar',
    })
    if (ok) {
      const n = await onImportar(res.rifas)
      if (n !== null) setAviso(`${n} ${n === 1 ? 'rifa importada' : 'rifas importadas'}.`)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Rifas</h1>
          <p className="mt-1 text-sm text-gray-400">
            {rifas.length === 0 ? 'Nenhuma rifa ainda.' : `${rifas.length} ${rifas.length === 1 ? 'rifa' : 'rifas'}`}
          </p>
        </div>
        {!somenteLeitura && <Button onClick={onNova}>+ Nova rifa</Button>}
      </header>

      {rifas.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-gray-400">Crie sua primeira rifa para começar a registrar vendas.</p>
          {!somenteLeitura && <Button onClick={onNova}>+ Nova rifa</Button>}
        </Card>
      ) : (
        <div className="space-y-3">
          {rifas.map((rifa) => (
            <RifaCard
              key={rifa.id}
              rifa={rifa}
              somenteLeitura={somenteLeitura}
              onAbrir={() => onAbrir(rifa.id)}
              onEditar={() => onEditar(rifa.id)}
              onRemover={async () => {
                const ok = await confirmar({
                  titulo: 'Excluir rifa',
                  mensagem: `Excluir a rifa "${rifa.nome}"? Esta ação não pode ser desfeita.`,
                  confirmarTexto: 'Excluir',
                  perigoso: true,
                })
                if (ok) onRemover(rifa.id)
              }}
            />
          ))}
        </div>
      )}

      <footer className="space-y-2 border-t border-white/5 pt-5">
        <p className="text-xs text-gray-500">
          Conectado como {usuarioNome}.{' '}
          <button onClick={onSair} className="text-accent-soft hover:underline">
            Sair
          </button>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variante="secondary" tamanho="sm" onClick={() => exportarBackup(rifas)} disabled={rifas.length === 0}>
            Exportar backup
          </Button>
          <Button
            variante="secondary"
            tamanho="sm"
            onClick={() => inputFile.current?.click()}
            disabled={somenteLeitura}
          >
            Importar backup
          </Button>
          <input
            ref={inputFile}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={aoEscolherArquivo}
          />
        </div>
        {aviso && <p className="text-xs text-accent-soft">{aviso}</p>}
      </footer>
    </div>
  )
}

function RifaCard({
  rifa,
  somenteLeitura,
  onAbrir,
  onEditar,
  onRemover,
}: {
  rifa: Rifa
  somenteLeitura: boolean
  onAbrir: () => void
  onEditar: () => void
  onRemover: () => void
}) {
  const r = calcularResumo(rifa)
  const progresso = r.total > 0 ? Math.round((r.vendidos / r.total) * 100) : 0

  return (
    <Card className="overflow-hidden transition-colors hover:border-accent/30">
      <div className="flex items-stretch">
        <button onClick={onAbrir} className="min-w-0 flex-1 p-4 text-left">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="truncate font-display text-lg font-semibold text-white">{rifa.nome}</h2>
            <span className="shrink-0 text-sm font-medium text-emerald-300">{formatBRL(r.arrecadado)}</span>
          </div>
          {rifa.descricao && <p className="mt-0.5 truncate text-sm text-gray-400">{rifa.descricao}</p>}
          {rifa.souDono === false && rifa.dono && <p className="mt-0.5 text-xs text-gray-500">de {rifa.dono.nome}</p>}

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-base-900">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progresso}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {r.vendidos}/{r.total} vendidos
            {r.reservados > 0 && ` · ${r.reservados} reservados`}
            {` · ${formatBRL(rifa.precoPorNumero)} por nº`}
          </p>
        </button>

        {!somenteLeitura && (
          <div className="flex flex-col border-l border-white/5">
            <button
              onClick={onEditar}
              className="flex flex-1 items-center px-3 text-gray-400 transition-colors hover:bg-base-700 hover:text-white"
              aria-label="Editar rifa"
              title="Editar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
            {rifa.souDono !== false && (
              <button
                onClick={onRemover}
                className="flex flex-1 items-center border-t border-white/5 px-3 text-gray-400 transition-colors hover:bg-base-700 hover:text-red-400"
                aria-label="Excluir rifa"
                title="Excluir"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
