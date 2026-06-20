import { api } from './client'

export async function fetchDataStatus() {
  const { data } = await api.get('/api/data/status')
  return data
}

export async function startDataLoad(mode = 'minimal') {
  const { data } = await api.post('/api/data/load', { mode })
  return data
}

export async function waitForDataReady({ intervalMs = 2000, timeoutMs = 120000 } = {}) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const status = await fetchDataStatus()
    if (status.ready) return status
    if (status.load_error) throw new Error(status.load_error)
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Data load timed out. Please try again from the Market Data tab.')
}
