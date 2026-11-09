// Cache offline (localStorage) + dados legados do app antigo + export/import de backup JSON.
// Fonte da verdade agora é a rifas-api; nada aqui é salvo no servidor sozinho.

import type { EstadoPersistido, Rifa } from '@/types'

/** Chave do app antigo (tudo local). Só lida pra oferecer migração pro servidor. */
const KEY = 'rifas.v1'
const KEY_LEGADO_MIGRADO = 'rifas.v1.migrado'

// ---------- Cache offline, separado por usuário ----------

const keyCache = (usuarioId: number) => `rifas.cache.${usuarioId}`

export function carregarCache(usuarioId: number): Rifa[] {
  try {
    const raw = localStorage.getItem(keyCache(usuarioId))
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    return Array.isArray(parsed) ? (parsed as Rifa[]) : []
  } catch {
    return []
  }
}

export function salvarCache(usuarioId: number, rifas: Rifa[]): void {
  try {
    localStorage.setItem(keyCache(usuarioId), JSON.stringify(rifas))
  } catch {
    /* cota/modo privado: só perde a leitura offline */
  }
}

// ---------- Legado (app só-local) ----------

/** Rifas que ainda estão só neste aparelho e nunca foram enviadas ao servidor. */
export function rifasLegadas(): Rifa[] {
  try {
    if (localStorage.getItem(KEY_LEGADO_MIGRADO)) return []
  } catch {
    return []
  }
  return load()
}

/** Marca o legado como enviado (não apaga o dado antigo, por segurança). */
export function marcarLegadoMigrado(): void {
  try {
    localStorage.setItem(KEY_LEGADO_MIGRADO, new Date().toISOString())
  } catch {
    /* ignora */
  }
}

function load(): Rifa[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<EstadoPersistido>
    if (parsed && Array.isArray(parsed.rifas)) {
      return parsed.rifas.map(normalizarRifa)
    }
  } catch {
    /* localStorage indisponível ou JSON corrompido: começa vazio */
  }
  return []
}

/** Garante a forma esperada mesmo com dados antigos/parciais. */
function normalizarRifa(r: Partial<Rifa>): Rifa {
  return {
    id: r.id ?? '',
    nome: r.nome ?? 'Sem nome',
    descricao: r.descricao,
    precoPorNumero: Number(r.precoPorNumero) || 0,
    faixas: Array.isArray(r.faixas) ? r.faixas : [],
    bilhetes: r.bilhetes && typeof r.bilhetes === 'object' ? r.bilhetes : {},
    criadaEm: r.criadaEm ?? new Date().toISOString(),
  }
}

// ---------- Backup (export / import) ----------

/** Dispara o download de um arquivo .json com todas as rifas. */
export function exportarBackup(rifas: Rifa[]): void {
  const estado: EstadoPersistido = { versao: 1, rifas }
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const data = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `rifas-backup-${data}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface ResultadoImport {
  ok: boolean
  rifas?: Rifa[]
  erro?: string
}

/** Lê e valida um arquivo de backup, devolvendo as rifas contidas. */
export async function importarBackup(file: File): Promise<ResultadoImport> {
  try {
    const texto = await file.text()
    const parsed = JSON.parse(texto) as Partial<EstadoPersistido>
    if (!parsed || !Array.isArray(parsed.rifas)) {
      return { ok: false, erro: 'Arquivo inválido: não contém uma lista de rifas.' }
    }
    return { ok: true, rifas: parsed.rifas.map(normalizarRifa) }
  } catch {
    return { ok: false, erro: 'Não foi possível ler o arquivo (JSON inválido).' }
  }
}
