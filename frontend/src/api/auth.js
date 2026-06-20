import { api } from './client'

export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data
}

export async function register(email, password, full_name) {
  const { data } = await api.post('/api/auth/register', { email, password, full_name })
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me')
  return data
}

export async function fetchDemoCredentials() {
  const { data } = await api.get('/api/auth/demo-credentials')
  return data
}
