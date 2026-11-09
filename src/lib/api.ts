// Cliente da rifas-api (VPS). O front continua no GH Pages; só os dados moram no servidor.

import type { Rifa, Usuario } from '@/types'

const BASE = (import.meta.env.VITE_API_URL ?? 'https://rifas.api.jaopd.dev').replace(/\/$/, '')
// A sessão é um cookie HttpOnly (o JS não vê). Aqui fica só a última identidade,
// pra o app abrir sem rede em modo leitura.
const KEY_SESSAO = 'rifas.sessao'

export interface Sessao {
  usuario: Usuario
}

export function carregarSessao(): Sessao | null {
  try {
    const raw = localStorage.getItem(KEY_SESSAO)
    return raw ? (JSON.parse(raw) as Sessao) : null
  } catch {
    return null
  }
}

export function salvarSessao(s: Sessao | null): void {
  try {
    if (s) localStorage.setItem(KEY_SESSAO, JSON.stringify(s))
    else localStorage.removeItem(KEY_SESSAO)
  } catch {
    /* sem storage: sessão vive só na memória */
  }
}

/** Erro HTTP da API. `rede` = não chegou no servidor (offline, DNS, CORS). */
export class ErroApi extends Error {
  constructor(
    mensagem: string,
    public status: number,
    public numeros?: number[],
    public rede = false,
    public precisaConfirmar = false,
  ) {
    super(mensagem)
  }
}

let aoExpirar: () => void = () => {}

/** Chamado quando a API responde 401 no meio do uso: volta pro login. */
export function aoSessaoExpirar(fn: () => void) {
  aoExpirar = fn
}

async function req<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + caminho, {
      method: metodo,
      credentials: 'include',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi('Sem conexão com o servidor.', 0, undefined, true)
  }
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.status !== 'success') {
    if (res.status === 401 && !caminho.startsWith('/auth/')) aoExpirar()
    const det = json?.detail
    if (typeof det === 'string') throw new ErroApi(det, res.status)
    if (det && typeof det === 'object' && 'mensagem' in det) {
      throw new ErroApi(det.mensagem, res.status, det.numeros, false, !!det.precisaConfirmar)
    }
    throw new ErroApi(`Erro ${res.status} no servidor.`, res.status)
  }
  return json.data as T
}

export interface DadosBilheteApi {
  comprador: string
  contato?: string
  endereco?: string
  pago: boolean
}

export const api = {
  cadastro: (email: string, nome: string, senha: string) =>
    req<{ email: string }>('POST', '/auth/cadastro', { email, nome, senha }),
  confirmar: (email: string, codigo: string) => req<Usuario>('POST', '/auth/confirmar', { email, codigo }),
  reenviar: (email: string) => req<{ enviado: true }>('POST', '/auth/reenviar', { email }),
  login: (email: string, senha: string) => req<Usuario>('POST', '/auth/login', { email, senha }),
  sair: () => req<{ saiu: true }>('POST', '/auth/sair', {}),
  eu: () => req<Usuario>('GET', '/auth/eu'),

  listar: () => req<Rifa[]>('GET', '/rifas'),
  criar: (d: Pick<Rifa, 'nome' | 'descricao' | 'precoPorNumero' | 'faixas'>) => req<Rifa>('POST', '/rifas', d),
  editar: (id: string, d: Partial<Pick<Rifa, 'nome' | 'descricao' | 'precoPorNumero' | 'faixas'>>) =>
    req<Rifa>('PATCH', `/rifas/${id}`, d),
  apagar: (id: string) => req<{ apagada: true }>('DELETE', `/rifas/${id}`),

  registrar: (id: string, numeros: number[], dados: DadosBilheteApi, sobrescrever: boolean) =>
    req<Rifa>('PUT', `/rifas/${id}/bilhetes`, { numeros, dados, sobrescrever }),
  marcarPagos: (id: string, numeros: number[], pago: boolean) =>
    req<Rifa>('PATCH', `/rifas/${id}/bilhetes/pago`, { numeros, pago }),
  liberar: (id: string, numeros: number[]) => req<Rifa>('POST', `/rifas/${id}/bilhetes/liberar`, { numeros }),

  addMembro: (id: string, email: string) => req<Rifa>('POST', `/rifas/${id}/membros`, { email }),
  rmMembro: (id: string, usuarioId: number) => req<Rifa>('DELETE', `/rifas/${id}/membros/${usuarioId}`),

  importar: (rifas: Rifa[]) => req<Rifa[]>('POST', '/importar', { versao: 1, rifas }),
}
