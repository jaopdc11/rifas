import { useCallback, useEffect, useState } from 'react'
import type { DadosNovaRifa } from '@/hooks/useRifas'
import { useRifas } from '@/hooks/useRifas'
import { aoSessaoExpirar, api, carregarSessao, salvarSessao, type Sessao } from '@/lib/api'
import { marcarLegadoMigrado, rifasLegadas } from '@/lib/storage'
import { Login } from '@/components/Login'
import { Button } from '@/components/ui/Button'
import { RifaList } from '@/components/RifaList'
import { RifaForm } from '@/components/RifaForm'
import { RifaDetail } from '@/components/RifaDetail'

type View = 'lista' | 'form' | 'detalhe'

export function App() {
  const [sessao, setSessao] = useState<Sessao | null>(() => carregarSessao())

  // Só limpa o local (401 = o servidor já não reconhece a sessão).
  const esquecer = useCallback(() => {
    salvarSessao(null)
    setSessao(null)
  }, [])

  const sair = useCallback(() => {
    api.sair().catch(() => {}) // sem rede: o cookie vence sozinho
    esquecer()
  }, [esquecer])

  useEffect(() => aoSessaoExpirar(esquecer), [esquecer])

  if (!sessao) {
    return (
      <div className="min-h-screen bg-base-950 px-4 py-6 sm:px-6">
        <Login
          onEntrar={(s) => {
            salvarSessao(s)
            setSessao(s)
          }}
        />
      </div>
    )
  }

  // key: troca de conta recria o estado do zero (cache é por usuário).
  return <AppLogado key={sessao.usuario.id} sessao={sessao} onSair={sair} />
}

function AppLogado({ sessao, onSair }: { sessao: Sessao; onSair: () => void }) {
  const meuId = sessao.usuario.id
  const {
    rifas,
    online,
    erro,
    limparErro,
    importar,
    adicionarMembro,
    removerMembro,
    criarRifa,
    atualizarRifa,
    removerRifa,
    registrarBilhete,
    registrarBilhetes,
    marcarPagosLote,
    liberarNumero,
    liberarNumeros,
  } = useRifas(meuId)
  const somenteLeitura = !online
  const [legado, setLegado] = useState(() => rifasLegadas())

  const [view, setView] = useState<View>('lista')
  const [rifaSelecionadaId, setRifaSelecionadaId] = useState<string | null>(null)
  // Quando definido, o form está editando esta rifa; senão, criando uma nova.
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const rifaSelecionada = rifas.find((r) => r.id === rifaSelecionadaId) ?? null
  const rifaEditando = rifas.find((r) => r.id === editandoId) ?? null

  function abrirNova() {
    setEditandoId(null)
    setView('form')
  }

  function abrirEdicao(rifaId: string) {
    setEditandoId(rifaId)
    setView('form')
  }

  function abrirDetalhe(rifaId: string) {
    setRifaSelecionadaId(rifaId)
    setView('detalhe')
  }

  async function salvarForm(dados: DadosNovaRifa) {
    if (editandoId) {
      await atualizarRifa(editandoId, dados)
      // volta para o detalhe se estávamos vendo essa rifa, senão para a lista
      if (rifaSelecionadaId === editandoId) setView('detalhe')
      else setView('lista')
    } else {
      const nova = await criarRifa(dados)
      if (!nova) return // erro já exibido; mantém o form aberto
      setRifaSelecionadaId(nova.id)
      setView('detalhe')
    }
    setEditandoId(null)
  }

  function cancelarForm() {
    // se estávamos editando a rifa aberta no detalhe, volta para ela; senão, lista
    const voltarParaDetalhe = editandoId !== null && editandoId === rifaSelecionadaId
    setEditandoId(null)
    setView(voltarParaDetalhe ? 'detalhe' : 'lista')
  }

  async function enviarLegado() {
    const n = await importar(legado)
    if (n !== null) {
      marcarLegadoMigrado()
      setLegado([])
    }
  }

  async function removerEAtualizar(rifaId: string) {
    await removerRifa(rifaId)
    if (rifaSelecionadaId === rifaId) {
      setRifaSelecionadaId(null)
      setView('lista')
    }
  }

  return (
    <div className="min-h-screen bg-base-950 px-4 py-6 pb-[env(safe-area-inset-bottom)] sm:px-6 sm:py-10">
      <div className="mx-auto mb-4 max-w-3xl space-y-2 empty:hidden">
        {somenteLeitura && (
          <p className="rounded-card border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
            Sem conexão — só leitura. Os dados podem estar desatualizados.
          </p>
        )}
        {erro && (
          <div className="flex items-start justify-between gap-3 rounded-card border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            <span>{erro}</span>
            <button onClick={limparErro} className="shrink-0 text-red-300 hover:text-white" aria-label="Fechar">
              ✕
            </button>
          </div>
        )}
        {legado.length > 0 && view === 'lista' && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-gray-200">
            <span>
              {legado.length} {legado.length === 1 ? 'rifa salva' : 'rifas salvas'} só neste aparelho (versão antiga).
            </span>
            <span className="flex gap-2">
              <Button
                tamanho="sm"
                variante="ghost"
                onClick={() => {
                  marcarLegadoMigrado()
                  setLegado([])
                }}
              >
                Ignorar
              </Button>
              <Button tamanho="sm" onClick={enviarLegado} disabled={somenteLeitura}>
                Enviar pro servidor
              </Button>
            </span>
          </div>
        )}
      </div>

      {view === 'lista' && (
        <RifaList
          rifas={rifas}
          onNova={abrirNova}
          onAbrir={abrirDetalhe}
          onEditar={abrirEdicao}
          onRemover={removerEAtualizar}
          onImportar={importar}
          somenteLeitura={somenteLeitura}
          usuarioNome={sessao.usuario.nome}
          onSair={onSair}
        />
      )}

      {view === 'form' && !somenteLeitura && (
        <RifaForm rifa={rifaEditando ?? undefined} onSalvar={salvarForm} onCancelar={cancelarForm} />
      )}

      {view === 'detalhe' && rifaSelecionada && (
        <RifaDetail
          rifa={rifaSelecionada}
          onVoltar={() => setView('lista')}
          onEditar={() => abrirEdicao(rifaSelecionada.id)}
          onRegistrar={(numero, dados) => registrarBilhete(rifaSelecionada.id, numero, dados)}
          onRegistrarLote={(numeros, dados) => registrarBilhetes(rifaSelecionada.id, numeros, dados)}
          onMarcarPagosLote={(numeros) => marcarPagosLote(rifaSelecionada.id, numeros, true)}
          onLiberar={(numero) => liberarNumero(rifaSelecionada.id, numero)}
          onLiberarLote={(numeros) => liberarNumeros(rifaSelecionada.id, numeros)}
          meuId={meuId}
          somenteLeitura={somenteLeitura}
          onAdicionarMembro={(email) => adicionarMembro(rifaSelecionada.id, email)}
          onRemoverMembro={(usuarioId) => removerMembro(rifaSelecionada.id, usuarioId)}
        />
      )}

      {/* fallback: se o detalhe perdeu a referência, volta à lista */}
      {view === 'detalhe' && !rifaSelecionada && <FallbackVazio onVoltar={() => setView('lista')} />}
    </div>
  )
}

function FallbackVazio({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-gray-400">Rifa não encontrada.</p>
      <button onClick={onVoltar} className="mt-3 text-accent-soft hover:underline">
        Voltar para a lista
      </button>
    </div>
  )
}
