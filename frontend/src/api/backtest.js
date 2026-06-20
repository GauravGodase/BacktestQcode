import { api } from './client'

export async function runBacktest(params) {
  const { data } = await api.post('/api/backtest/run', params)
  return data
}

export async function exportBacktest(params, format) {
  const endpoint = format === 'csv' ? '/api/backtest/export/csv' : '/api/backtest/export/excel'
  const { data } = await api.post(endpoint, params, { responseType: 'blob' })
  return data
}
