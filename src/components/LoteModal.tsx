import { useState } from 'react'
import type { Rifa } from '@/types'
import { formatBRL } from '@/lib/format'
import type { DadosBilhete } from '@/hooks/useRifas'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/** Quando presente, o modal faz parte de uma sequência (edição por comprador). */
export interface SequenciaLote {
  /** Posição do grupo atual na fila (1-based). */
  atual: number
  /** Total de grupos (compradores) na fila. */
  total: number
  /** Rótulo do grupo — nome do comprador. */
  rotulo: string
  /** Pula o grupo atual sem salvar (avança para o próximo). */
  avancar: () => void
}

interface LoteModalProps {
  aberto: boolean
  rifa: Rifa
  numeros: number[]
  onFechar: () => void
  onConfirmar: (dados: DadosBilhete) => void
  /** Valores iniciais dos campos (modo edição de um grupo já existente). */
  iniciais?: DadosBilhete
  sequencia?: SequenciaLote
}

export function LoteModal({ aberto, rifa, numeros, onFechar, onConfirmar, iniciais, sequencia }: LoteModalProps) {
  return aberto ? (
    <Conteudo
      key={numeros.join(',')}
      rifa={rifa}
      numeros={numeros}
      onFechar={onFechar}
      onConfirmar={onConfirmar}
      iniciais={iniciais}
      sequencia={sequencia}
    />
  ) : null
}

function Conteudo({
  rifa,
  numeros,
  onFechar,
  onConfirmar,
  iniciais,
  sequencia,
}: Omit<LoteModalProps, 'aberto'>) {
  const [comprador, setComprador] = useState(iniciais?.comprador ?? '')
  const [contato, setContato] = useState(iniciais?.contato ?? '')
  const [endereco, setEndereco] = useState(iniciais?.endereco ?? '')
  const [pago, setPago] = useState(iniciais?.pago ?? false)
  const [erro, setErro] = useState<string | null>(null)

  const edicao = !!sequencia
  const jaVendidos = numeros.filter((n) => rifa.bilhetes[n])
  const total = numeros.length * rifa.precoPorNumero

  function confirmar() {
    if (!comprador.trim()) {
      setErro('Informe quem comprou os números.')
      return
    }
    onConfirmar({
      comprador,
      contato: contato || undefined,
      endereco: endereco || undefined,
      pago,
    })
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={
        edicao ? (
          <span className="flex items-center gap-2">
            <span className="truncate">{sequencia!.rotulo || 'Sem nome'}</span>
            <span className="shrink-0 rounded-full bg-base-700 px-2 py-0.5 text-xs font-normal text-gray-300">
              {sequencia!.atual} de {sequencia!.total}
            </span>
          </span>
        ) : (
          `Registrar ${numeros.length} números`
        )
      }
      rodape={
        edicao ? (
          <>
            <Button variante="ghost" onClick={sequencia!.avancar}>
              Pular
            </Button>
            <Button onClick={confirmar}>Salvar e seguir</Button>
          </>
        ) : (
          <>
            <Button variante="ghost" onClick={onFechar}>
              Cancelar
            </Button>
            <Button onClick={confirmar}>Registrar {numeros.length}</Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <div>
          {edicao ? (
            <p className="text-sm text-gray-300">
              Editando {numeros.length} {numeros.length === 1 ? 'número' : 'números'} deste comprador.
              <span className="text-gray-500"> As alterações se aplicam a todos eles.</span>
            </p>
          ) : (
            <p className="text-sm text-gray-300">
              Total: <span className="font-medium text-emerald-300">{formatBRL(total)}</span>
              <span className="text-gray-500"> ({formatBRL(rifa.precoPorNumero)} × {numeros.length})</span>
            </p>
          )}
          <p className="mt-1 font-mono text-xs leading-relaxed text-gray-500">{formatarFaixas(numeros)}</p>
        </div>

        {!edicao && jaVendidos.length > 0 && (
          <p className="rounded-card border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            {jaVendidos.length} {jaVendidos.length === 1 ? 'número já tinha' : 'números já tinham'} venda
            registrada e {jaVendidos.length === 1 ? 'será sobrescrito' : 'serão sobrescritos'} com estes dados.
          </p>
        )}

        <Input
          label="Comprador"
          value={comprador}
          onChange={(e) => setComprador(e.target.value)}
          placeholder="Nome de quem comprou"
          autoFocus
        />

        <Input
          label="Contato (opcional)"
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          placeholder="Telefone / WhatsApp"
          inputMode="tel"
        />

        <Input
          label="Endereço (opcional)"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Rua, número, bairro…"
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-card border border-white/10 bg-base-900 px-3 py-3">
          <input
            type="checkbox"
            checked={pago}
            onChange={(e) => setPago(e.target.checked)}
            className="h-5 w-5 accent-pago"
          />
          <span className="text-sm text-gray-200">
            Pago
            <span className="block text-xs text-gray-500">Desmarcado = reservado (aguardando pagamento)</span>
          </span>
        </label>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
      </div>
    </Modal>
  )
}

/** Compacta uma lista ordenada de números em faixas: [1,2,3,7] → "1–3, 7". */
function formatarFaixas(numeros: number[]): string {
  if (numeros.length === 0) return ''
  const ordenados = [...numeros].sort((a, b) => a - b)
  const partes: string[] = []
  let inicio = ordenados[0]
  let anterior = ordenados[0]
  for (let i = 1; i <= ordenados.length; i++) {
    const atual = ordenados[i]
    if (atual === anterior + 1) {
      anterior = atual
      continue
    }
    partes.push(inicio === anterior ? `${inicio}` : `${inicio}–${anterior}`)
    inicio = atual
    anterior = atual
  }
  return partes.join(', ')
}
