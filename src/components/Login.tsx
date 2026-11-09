import { useState } from 'react'
import { api, ErroApi, type Sessao } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

type Etapa = 'entrar' | 'cadastro' | 'codigo'

/** Entrar (e-mail + senha), criar conta, e confirmar o e-mail com o código de 6 dígitos. */
export function Login({ onEntrar }: { onEntrar: (s: Sessao) => void }) {
  const [etapa, setEtapa] = useState<Etapa>('entrar')
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function ir(nova: Etapa) {
    setEtapa(nova)
    setErro(null)
    setAviso(null)
  }

  async function tentar(fn: () => Promise<void>) {
    setErro(null)
    setEnviando(true)
    try {
      await fn()
    } catch (err) {
      if (err instanceof ErroApi && err.precisaConfirmar) {
        ir('codigo')
        setAviso(err.message)
        return
      }
      setErro(err instanceof ErroApi ? err.message : 'Algo deu errado.')
    } finally {
      setEnviando(false)
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (etapa === 'entrar') {
      tentar(async () => onEntrar({ usuario: await api.login(email.trim(), senha) }))
    } else if (etapa === 'cadastro') {
      tentar(async () => {
        await api.cadastro(email.trim(), nome.trim(), senha)
        ir('codigo')
        setAviso(`Mandamos um código de 6 dígitos para ${email.trim()}.`)
      })
    } else {
      tentar(async () => onEntrar({ usuario: await api.confirmar(email.trim(), codigo) }))
    }
  }

  const titulo = { entrar: 'Entre na sua conta', cadastro: 'Criar conta', codigo: 'Confirme seu e-mail' }[etapa]

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold text-white">Rifas</h1>
        <p className="mt-1 text-sm text-gray-400">{titulo}</p>
      </header>

      <Card className="p-5">
        <form onSubmit={enviar} className="space-y-4">
          {etapa === 'codigo' ? (
            <>
              {aviso && <p className="text-sm text-gray-300">{aviso}</p>}
              <Input
                label="Código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                required
                autoFocus
                className="text-center text-2xl tracking-[0.4em]"
              />
            </>
          ) : (
            <>
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                maxLength={254}
              />
              {etapa === 'cadastro' && (
                <Input label="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={120} />
              )}
              <Input
                label="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={etapa === 'cadastro' ? 'new-password' : 'current-password'}
                required
                minLength={etapa === 'cadastro' ? 8 : undefined}
                hint={etapa === 'cadastro' ? 'Pelo menos 8 caracteres.' : undefined}
              />
            </>
          )}
          {erro && <p className="text-sm text-red-400">{erro}</p>}
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? 'Aguarde…' : { entrar: 'Entrar', cadastro: 'Criar conta', codigo: 'Confirmar' }[etapa]}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-gray-400">
        {etapa === 'codigo' ? (
          <>
            Não chegou?{' '}
            <button
              className="text-accent-soft hover:underline"
              disabled={enviando}
              onClick={() =>
                tentar(async () => {
                  await api.reenviar(email.trim())
                  setAviso('Se o cadastro existe, um código novo foi enviado.')
                })
              }
            >
              Reenviar código
            </button>
            {' · '}
            <button className="text-accent-soft hover:underline" onClick={() => ir('entrar')}>
              Voltar
            </button>
          </>
        ) : (
          <>
            {etapa === 'cadastro' ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button
              className="text-accent-soft hover:underline"
              onClick={() => ir(etapa === 'cadastro' ? 'entrar' : 'cadastro')}
            >
              {etapa === 'cadastro' ? 'Entrar' : 'Criar conta'}
            </button>
          </>
        )}
      </p>
    </div>
  )
}
