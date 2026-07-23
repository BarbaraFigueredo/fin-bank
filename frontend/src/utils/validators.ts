import { onlyDigits } from './format'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** Mesma regra de validação de CPF usada no backend (users/validators.py), replicada
 * no cliente só para dar feedback imediato — o backend continua sendo a fonte da verdade. */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11) return false
  if (cpf === cpf[0].repeat(11)) return false

  const digit = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, weight, i) => acc + Number(base[i]) * weight, 0)
    const rest = sum % 11
    return rest < 2 ? '0' : String(11 - rest)
  }

  const firstWeights = [10, 9, 8, 7, 6, 5, 4, 3, 2]
  const first = digit(cpf, firstWeights)
  const secondWeights = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
  const second = digit(cpf + first, secondWeights)

  return cpf[9] === first && cpf[10] === second
}

/** Mesma regra de validação de CNPJ usada no backend, replicada no cliente
 * para dar feedback imediato — o backend continua sendo a fonte da verdade. */
export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14) return false
  if (cnpj === cnpj[0].repeat(14)) return false

  const digit = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, weight, i) => acc + Number(base[i]) * weight, 0)
    const rest = sum % 11
    return rest < 2 ? '0' : String(11 - rest)
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const first = digit(cnpj, firstWeights)
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const second = digit(cnpj + first, secondWeights)

  return cnpj[12] === first && cnpj[13] === second
}

export function isValidDocument(value: string, accountType: 'people' | 'company'): boolean {
  return accountType === 'company' ? isValidCnpj(value) : isValidCpf(value)
}

export function isStrongEnoughPassword(value: string): boolean {
  return value.length >= 8
}
