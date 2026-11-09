// Modelo de dados das rifas. Fonte da verdade: rifas-api; localStorage é só cache offline.

export type StatusNumero = 'livre' | 'reservado' | 'pago'

/** Faixa contígua de números, inicio <= fim. */
export interface Faixa {
  inicio: number
  fim: number
}

/**
 * Guardado apenas para números NÃO livres (mapa compacto).
 * A ausência de um bilhete em `Rifa.bilhetes[n]` significa que o número está livre.
 */
export interface Bilhete {
  numero: number
  comprador: string
  contato?: string
  endereco?: string
  pago: boolean
  registradoEm: string
}

export interface Rifa {
  id: string
  nome: string
  descricao?: string
  precoPorNumero: number
  faixas: Faixa[]
  /** chave = número; ausência = livre. */
  bilhetes: Record<number, Bilhete>
  criadaEm: string
  /** Vindos do servidor (ausentes em backups antigos). */
  dono?: Usuario
  membros?: Usuario[]
  souDono?: boolean
}

export interface Usuario {
  id: number
  email: string
  nome: string
}

/** Formato persistido no localStorage (permite migração futura via `versao`). */
export interface EstadoPersistido {
  versao: 1
  rifas: Rifa[]
}

/** Resumo agregado de uma rifa, derivado de faixas + bilhetes. */
export interface ResumoRifa {
  total: number
  vendidos: number
  pagos: number
  reservados: number
  livres: number
  arrecadado: number
  pendente: number
  potencialTotal: number
}
