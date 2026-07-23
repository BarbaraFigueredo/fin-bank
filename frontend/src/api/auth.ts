import { api } from './client'
import type { LoginResponse, Me, SignupPayload } from './types'

export async function login(login: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/users/login/', { login, password })
  return data
}

export async function logout(): Promise<void> {
  await api.post('/users/logout/')
}

export async function fetchMe(): Promise<Me> {
  const { data } = await api.get<Me>('/users/me/')
  return data
}

export async function signup(payload: SignupPayload): Promise<void> {
  await api.post('/users/', payload)
}
