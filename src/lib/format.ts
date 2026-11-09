// Formatação de moeda em Real (BRL).

const fmtBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatBRL(valor: number): string {
  return fmtBRL.format(Number.isFinite(valor) ? valor : 0)
}
