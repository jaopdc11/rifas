import { useState } from 'react'
import type { Rifa } from '@/types'
import { statusNumero } from '@/lib/rifa'
import { formatBRL } from '@/lib/format'
import type { DadosBilhete } from '@/hooks/useRifas'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useConfirm } from '@/components/ui/Confirm'

interface TicketModalProps {
  rifa: Rifa
  numero: number | null
  onFechar: () => void
  onRegistrar: (numero: number, dados: DadosBilhete) => void
  onLiberar: (numero: number) => void
}

export function TicketModal({ rifa, numero, onFechar, onRegistrar, onLiberar }: TicketModalProps) {
  const aberto = numero !== null
  const bilhete = numero !== null ? rifa.bilhetes[numero] : undefined

  return aberto ? (
    <ConteudoModal
      // key força reset dos campos ao trocar de número
      key={numero}
      rifa={rifa}
      numero={numero as number}
      onFechar={onFechar}
      onRegistrar={onRegistrar}
      onLiberar={onLiberar}
      bilheteExiste={!!bilhete}
    />
  ) : null
}

interface ConteudoProps {
  rifa: Rifa
  numero: number
  onFechar: () => void
  onRegistrar: (numero: number, dados: DadosBilhete) => void
  onLiberar: (numero: number) => void
  bilheteExiste: boolean
}

function ConteudoModal({ rifa, numero, onFechar, onRegistrar, onLiberar, bilheteExiste }: ConteudoProps) {
  const confirmar = useConfirm()
  const bilhete = rifa.bilhetes[numero]
  const [comprador, setComprador] = useState(bilhete?.comprador ?? '')
  const [contato, setContato] = useState(bilhete?.contato ?? '')
  const [endereco, setEndereco] = useState(bilhete?.endereco ?? '')
  const [pago, setPago] = useState(bilhete?.pago ?? false)
  const [erro, setErro] = useState<string | null>(null)

  const status = statusNumero(rifa, numero)

  function salvar() {
    if (!comprador.trim()) {
      setErro('Informe quem comprou o número.')
      return
    }
    onRegistrar(numero, {
      comprador,
      contato: contato || undefined,
      endereco: endereco || undefined,
      pago,
    })
    onFechar()
  }

  async function liberar() {
    const ok = await confirmar({
      titulo: 'Liberar número',
      mensagem: `Liberar o número ${numero}? A venda registrada será apagada.`,
      confirmarTexto: 'Liberar',
      perigoso: true,
    })
    if (ok) {
      onLiberar(numero)
      onFechar()
    }
  }

  const corStatus =
    status === 'pago'
      ? 'text-emerald-300'
      : status === 'reservado'
        ? 'text-amber-300'
        : 'text-gray-400'

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={
        <span className="flex items-center gap-2">
          Número <span className="font-mono text-accent">{numero}</span>
        </span>
      }
      rodape={
        <>
          {bilheteExiste && (
            <Button variante="danger" tamanho="sm" onClick={liberar} className="mr-auto">
              Liberar número
            </Button>
          )}
          <Button variante="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm">
          Status atual: <span className={`font-medium capitalize ${corStatus}`}>{status}</span>
          <span className="text-gray-500"> · {formatBRL(rifa.precoPorNumero)} por número</span>
        </p>

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
            <span className="block text-xs text-gray-500">
              Desmarcado = reservado (aguardando pagamento)
            </span>
          </span>
        </label>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
      </div>
    </Modal>
  )
}
