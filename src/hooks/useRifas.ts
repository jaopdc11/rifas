// Estado das rifas sincronizado com a rifas-api.
// Cada ação chama o servidor e aplica a resposta; o resultado vira cache no
// localStorage pra leitura offline. Sem rede = só leitura.

import { useCallback, useEffect, useState } from 'react'
import type { Faixa, Rifa } from '@/types'
import { api, ErroApi } from '@/lib/api'
import { carregarCache, salvarCache } from '@/lib/storage'

export interface DadosNovaRifa {
  nome: string
  descricao?: string
  precoPorNumero: number
  faixas: Faixa[]
}

export interface DadosBilhete {
  comprador: string
  contato?: string
  endereco?: string
  pago: boolean
}

export function useRifas(usuarioId: number) {
  const [rifas, setRifas] = useState<Rifa[]>(() => carregarCache(usuarioId))
  const [online, setOnline] = useState(() => navigator.onLine)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const aplicar = useCallback(
    (fn: (prev: Rifa[]) => Rifa[]) => {
      setRifas((prev) => {
        const novas = fn(prev)
        salvarCache(usuarioId, novas)
        return novas
      })
    },
    [usuarioId],
  )

  const trocar = useCallback(
    (r: Rifa) => aplicar((prev) => prev.map((x) => (x.id === r.id ? r : x))),
    [aplicar],
  )

  const tratar = useCallback((e: unknown) => {
    if (e instanceof ErroApi) {
      if (e.rede) setOnline(false)
      const lista = e.numeros?.length ? ` (${e.numeros.slice(0, 20).join(', ')})` : ''
      setErro(e.message + lista)
    } else {
      setErro('Algo deu errado.')
    }
  }, [])

  const recarregar = useCallback(async () => {
    try {
      const lista = await api.listar()
      aplicar(() => lista)
      setOnline(true)
    } catch (e) {
      if (e instanceof ErroApi && e.rede) setOnline(false)
      else tratar(e)
    } finally {
      setCarregando(false)
    }
  }, [aplicar, tratar])

  useEffect(() => {
    recarregar()
    const voltou = () => recarregar()
    const caiu = () => setOnline(false)
    // Atualiza ao voltar pro app: outra pessoa pode ter vendido números.
    const visivel = () => document.visibilityState === 'visible' && recarregar()
    window.addEventListener('online', voltou)
    window.addEventListener('offline', caiu)
    document.addEventListener('visibilitychange', visivel)
    return () => {
      window.removeEventListener('online', voltou)
      window.removeEventListener('offline', caiu)
      document.removeEventListener('visibilitychange', visivel)
    }
  }, [recarregar])

  /** Roda uma ação no servidor; devolve null se falhou (erro já exibido). */
  const executar = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setErro(null)
      if (!navigator.onLine) {
        setOnline(false)
        setErro('Sem conexão — só leitura.')
        return null
      }
      try {
        return await fn()
      } catch (e) {
        tratar(e)
        // 409 = alguém mexeu antes: puxa o estado novo pra tela refletir.
        if (e instanceof ErroApi && e.status === 409) recarregar()
        return null
      }
    },
    [tratar, recarregar],
  )

  const criarRifa = useCallback(
    async (dados: DadosNovaRifa): Promise<Rifa | null> => {
      const nova = await executar(() =>
        api.criar({ ...dados, nome: dados.nome.trim(), descricao: dados.descricao?.trim() || undefined }),
      )
      if (nova) aplicar((prev) => [nova, ...prev])
      return nova
    },
    [executar, aplicar],
  )

  const atualizarRifa = useCallback(
    async (rifaId: string, patch: Partial<DadosNovaRifa>) => {
      const r = await executar(() => api.editar(rifaId, patch))
      if (r) trocar(r)
    },
    [executar, trocar],
  )

  const removerRifa = useCallback(
    async (rifaId: string) => {
      const ok = await executar(() => api.apagar(rifaId).then(() => true))
      if (ok) aplicar((prev) => prev.filter((r) => r.id !== rifaId))
    },
    [executar, aplicar],
  )

  const registrarBilhetes = useCallback(
    async (rifaId: string, numeros: number[], dados: DadosBilhete) => {
      // Se a tela já mostrava algum desses números ocupado, é edição consciente.
      // Se estavam livres e alguém vendeu nesse meio-tempo, o servidor responde 409.
      const atual = rifas.find((r) => r.id === rifaId)
      const sobrescrever = numeros.some((n) => atual?.bilhetes[n])
      const r = await executar(() => api.registrar(rifaId, numeros, dados, sobrescrever))
      if (r) trocar(r)
    },
    [rifas, executar, trocar],
  )

  const registrarBilhete = useCallback(
    (rifaId: string, numero: number, dados: DadosBilhete) => registrarBilhetes(rifaId, [numero], dados),
    [registrarBilhetes],
  )

  const marcarPagosLote = useCallback(
    async (rifaId: string, numeros: number[], pago: boolean) => {
      const r = await executar(() => api.marcarPagos(rifaId, numeros, pago))
      if (r) trocar(r)
    },
    [executar, trocar],
  )

  const liberarNumeros = useCallback(
    async (rifaId: string, numeros: number[]) => {
      const r = await executar(() => api.liberar(rifaId, numeros))
      if (r) trocar(r)
    },
    [executar, trocar],
  )

  const liberarNumero = useCallback(
    (rifaId: string, numero: number) => liberarNumeros(rifaId, [numero]),
    [liberarNumeros],
  )

  /** Envia rifas de um backup pro servidor como rifas NOVAS (não substitui nada). */
  const importar = useCallback(
    async (novas: Rifa[]): Promise<number | null> => {
      const criadas = await executar(() => api.importar(novas))
      if (!criadas) return null
      aplicar((prev) => [...criadas, ...prev])
      return criadas.length
    },
    [executar, aplicar],
  )

  const adicionarMembro = useCallback(
    async (rifaId: string, email: string): Promise<boolean> => {
      const r = await executar(() => api.addMembro(rifaId, email))
      if (r) trocar(r)
      return !!r
    },
    [executar, trocar],
  )

  const removerMembro = useCallback(
    async (rifaId: string, membroId: number) => {
      const r = await executar(() => api.rmMembro(rifaId, membroId))
      if (!r) return
      if (membroId === usuarioId) aplicar((prev) => prev.filter((x) => x.id !== rifaId))
      else trocar(r)
    },
    [executar, trocar, aplicar, usuarioId],
  )

  return {
    rifas,
    online,
    carregando,
    erro,
    limparErro: () => setErro(null),
    recarregar,
    criarRifa,
    atualizarRifa,
    removerRifa,
    registrarBilhete,
    registrarBilhetes,
    marcarPagosLote,
    liberarNumero,
    liberarNumeros,
    importar,
    adicionarMembro,
    removerMembro,
  }
}
