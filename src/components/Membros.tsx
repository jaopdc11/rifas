import { useState } from 'react'
import type { Rifa } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useConfirm } from '@/components/ui/Confirm'

interface MembrosProps {
  rifa: Rifa
  meuId: number
  somenteLeitura: boolean
  onAdicionar: (email: string) => Promise<boolean>
  onRemover: (usuarioId: number) => void
}

/** Quem pode mexer nesta rifa. Dono adiciona/remove; membro só pode sair. */
export function Membros({ rifa, meuId, somenteLeitura, onAdicionar, onRemover }: MembrosProps) {
  const [email, setEmail] = useState('')
  const confirmar = useConfirm()
  const membros = rifa.membros ?? []

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (await onAdicionar(email.trim())) setEmail('')
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-white">Quem participa</h2>
      <Card className="space-y-3 p-4">
        <ul className="space-y-2 text-sm">
          {rifa.dono && (
            <li className="flex items-center justify-between gap-2">
              <span className="text-gray-200">
                {rifa.dono.nome} <span className="text-gray-500">{rifa.dono.email}</span>
              </span>
              <span className="text-xs text-accent-soft">dono</span>
            </li>
          )}
          {membros.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2">
              <span className="text-gray-200">
                {m.nome} <span className="text-gray-500">{m.email}</span>
              </span>
              {(rifa.souDono || m.id === meuId) && !somenteLeitura && (
                <Button
                  variante="ghost"
                  tamanho="sm"
                  onClick={async () => {
                    const sair = m.id === meuId
                    const ok = await confirmar({
                      titulo: sair ? 'Sair da rifa' : 'Remover pessoa',
                      mensagem: sair
                        ? `Sair de "${rifa.nome}"? Você deixa de ver esta rifa.`
                        : `Remover ${m.nome} desta rifa?`,
                      confirmarTexto: sair ? 'Sair' : 'Remover',
                      perigoso: true,
                    })
                    if (ok) onRemover(m.id)
                  }}
                >
                  {m.id === meuId ? 'Sair' : 'Remover'}
                </Button>
              )}
            </li>
          ))}
        </ul>

        {rifa.souDono && !somenteLeitura && (
          <form onSubmit={adicionar} className="flex items-end gap-2 border-t border-white/5 pt-3">
            <div className="min-w-0 flex-1">
              <Input
                label="Adicionar pelo e-mail"
                type="email"
                placeholder="a pessoa precisa ter conta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                required
              />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
        )}
      </Card>
    </section>
  )
}
