import { useState } from 'react'
import type { Faixa, Rifa } from '@/types'
import { bilhetesForaDasFaixas, validarFaixas } from '@/lib/rifa'
import type { DadosNovaRifa } from '@/hooks/useRifas'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useConfirm } from '@/components/ui/Confirm'
import { RangeEditor } from '@/components/RangeEditor'

interface RifaFormProps {
  /** Quando presente, o formulário edita uma rifa existente. */
  rifa?: Rifa
  onSalvar: (dados: DadosNovaRifa) => void
  onCancelar: () => void
}

export function RifaForm({ rifa, onSalvar, onCancelar }: RifaFormProps) {
  const editando = !!rifa
  const [nome, setNome] = useState(rifa?.nome ?? '')
  const [descricao, setDescricao] = useState(rifa?.descricao ?? '')
  const [preco, setPreco] = useState(rifa ? String(rifa.precoPorNumero) : '')
  const [faixas, setFaixas] = useState<Faixa[]>(rifa?.faixas ?? [])
  const [erro, setErro] = useState<string | null>(null)
  const confirmar = useConfirm()

  async function salvar() {
    const nomeTrim = nome.trim()
    if (!nomeTrim) {
      setErro('Dê um nome para a rifa.')
      return
    }
    const precoNum = Number(preco.replace(',', '.'))
    if (!Number.isFinite(precoNum) || precoNum <= 0) {
      setErro('Informe um preço por número maior que zero.')
      return
    }
    const valida = validarFaixas(faixas)
    if (!valida.ok) {
      setErro(valida.erro ?? 'Faixas inválidas.')
      return
    }
    // Ao editar, avisa se vendas existentes ficariam fora das novas faixas.
    if (editando && rifa) {
      const perdidos = bilhetesForaDasFaixas(rifa, faixas)
      if (perdidos.length > 0) {
        const lista = perdidos.map((b) => b.numero).join(', ')
        const ok = await confirmar({
          titulo: 'Vendas fora das faixas',
          mensagem: `Estes números já têm venda registrada e ficariam fora das faixas: ${lista}.\n\nContinuar mesmo assim? As vendas desses números serão apagadas.`,
          confirmarTexto: 'Continuar',
          perigoso: true,
        })
        if (!ok) return
      }
    }

    onSalvar({
      nome: nomeTrim,
      descricao: descricao.trim() || undefined,
      precoPorNumero: precoNum,
      faixas,
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header className="space-y-1">
        <button
          onClick={onCancelar}
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar
        </button>
        <h1 className="font-display text-2xl font-semibold text-white">
          {editando ? 'Editar rifa' : 'Nova rifa'}
        </h1>
      </header>

      <Input
        label="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Rifa do Terreiro"
        autoFocus={!editando}
      />

      <Textarea
        label="Descrição (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Sorteio da feijoada, prêmio: cesta..."
        rows={2}
      />

      <Input
        label="Preço por número (R$)"
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
        placeholder="5,00"
      />

      <RangeEditor faixas={faixas} onChange={setFaixas} />

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variante="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button onClick={salvar}>{editando ? 'Salvar alterações' : 'Criar rifa'}</Button>
      </div>
    </div>
  )
}
