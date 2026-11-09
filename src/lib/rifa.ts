// Funções puras de domínio: derivam números, status e resumo a partir das faixas
// e bilhetes de uma rifa. Sem dependências externas.

import type { Bilhete, Faixa, ResumoRifa, Rifa, StatusNumero } from '@/types'

/** Gera um id curto e único sem libs externas. */
export function id(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // fallback (ambientes sem crypto.randomUUID)
  return 'r-' + Math.abs(hashString(String(performance.now()) + ':' + Math.floor(Math.random() * 1e9))).toString(36)
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}

/**
 * Números existentes na rifa: união de todas as faixas, ordenada asc, sem duplicar.
 * Faixas inválidas (inicio > fim) são ignoradas.
 */
export function numerosDaRifa(faixas: Faixa[]): number[] {
  const set = new Set<number>()
  for (const f of faixas) {
    if (f.inicio > f.fim) continue
    for (let n = f.inicio; n <= f.fim; n++) set.add(n)
  }
  return [...set].sort((a, b) => a - b)
}

/** Quantidade total de números sem materializar o array (mais barato p/ resumo). */
export function totalNumeros(faixas: Faixa[]): number {
  return numerosDaRifa(faixas).length
}

export function statusNumero(rifa: Rifa, numero: number): StatusNumero {
  const b = rifa.bilhetes[numero]
  if (!b) return 'livre'
  return b.pago ? 'pago' : 'reservado'
}

export function resumo(rifa: Rifa): ResumoRifa {
  const total = totalNumeros(rifa.faixas)
  let pagos = 0
  let reservados = 0
  for (const numeroStr of Object.keys(rifa.bilhetes)) {
    const b = rifa.bilhetes[Number(numeroStr)]
    if (b.pago) pagos++
    else reservados++
  }
  const vendidos = pagos + reservados
  const livres = Math.max(0, total - vendidos)
  const preco = rifa.precoPorNumero
  return {
    total,
    vendidos,
    pagos,
    reservados,
    livres,
    arrecadado: pagos * preco,
    pendente: reservados * preco,
    potencialTotal: total * preco,
  }
}

/** Valida uma lista de faixas: cada inicio <= fim e sem sobreposição entre faixas. */
export interface ResultadoValidacaoFaixas {
  ok: boolean
  erro?: string
}

export function validarFaixas(faixas: Faixa[]): ResultadoValidacaoFaixas {
  if (faixas.length === 0) {
    return { ok: false, erro: 'Adicione pelo menos uma faixa de números.' }
  }
  for (const f of faixas) {
    if (!Number.isInteger(f.inicio) || !Number.isInteger(f.fim)) {
      return { ok: false, erro: 'Os números das faixas devem ser inteiros.' }
    }
    if (f.inicio < 0 || f.fim < 0) {
      return { ok: false, erro: 'Os números não podem ser negativos.' }
    }
    if (f.inicio > f.fim) {
      return { ok: false, erro: `Faixa inválida: ${f.inicio}–${f.fim} (início maior que fim).` }
    }
  }
  // sobreposição: ordena por início e checa interseção com a anterior
  const ordenadas = [...faixas].sort((a, b) => a.inicio - b.inicio)
  for (let i = 1; i < ordenadas.length; i++) {
    const prev = ordenadas[i - 1]
    const cur = ordenadas[i]
    if (cur.inicio <= prev.fim) {
      return {
        ok: false,
        erro: `As faixas ${prev.inicio}–${prev.fim} e ${cur.inicio}–${cur.fim} se sobrepõem.`,
      }
    }
  }
  return { ok: true }
}

/**
 * Bilhetes existentes que ficariam FORA das novas faixas (perdas ao editar faixas).
 * Útil para avisar o usuário antes de remover faixas que contêm vendas.
 */
export function bilhetesForaDasFaixas(rifa: Rifa, novasFaixas: Faixa[]): Bilhete[] {
  const validos = new Set(numerosDaRifa(novasFaixas))
  const fora: Bilhete[] = []
  for (const numeroStr of Object.keys(rifa.bilhetes)) {
    const numero = Number(numeroStr)
    if (!validos.has(numero)) fora.push(rifa.bilhetes[numero])
  }
  return fora.sort((a, b) => a.numero - b.numero)
}
