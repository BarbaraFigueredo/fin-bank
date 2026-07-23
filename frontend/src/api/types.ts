export type UserType = 'people' | 'company'

export interface Me {
  id: number
  username: string
  first_name: string
  last_name: string
  cpf_cnpj: string
  email: string
  amount: string
  account_type: UserType
}

export interface LoginResponse {
  token: string
  user: Me
}

export interface PublicUser {
  id: number
  first_name: string
  last_name: string
}

export interface Transaction {
  id: number
  amount: string
  date: string
  direction: 'in' | 'out'
  counterpart_name: string
  counterpart_id: number
}

export interface SignupPayload {
  user: {
    username: string
    first_name: string
    last_name: string
    cpf_cnpj: string
    email: string
    password: string
  }
  type_user: {
    type: UserType
  }
}

export interface ApiErrorBody {
  error?: string | Record<string, string[]>
  errors?: string
}
