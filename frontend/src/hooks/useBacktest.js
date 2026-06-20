import { useCallback, useState } from 'react'
import { exportBacktest, runBacktest } from '../api/backtest'
import { formatApiError } from '../api/client'

export function useBacktest() {
  const [result, setResult] = useState(null)
  const [lastParams, setLastParams] = useState(null)
  const [lastParamsKey, setLastParamsKey] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (params) => {
    const paramsKey = JSON.stringify(params)
    if (lastParamsKey === paramsKey && result !== null) {
      return result
    }

    setLoading(true)
    setError(null)
    try {
      const data = await runBacktest(params)
      setResult(data)
      setLastParams(params)
      setLastParamsKey(paramsKey)
      return data
    } catch (err) {
      const message = formatApiError(err)
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [lastParamsKey, result])

  const exportResults = useCallback(async (format) => {
    if (!lastParams) return
    const blob = await exportBacktest(lastParams, format)
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.download = format === 'csv' ? 'equity_curve.csv' : 'backtest_results.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
  }, [lastParams])

  return { result, lastParams, loading, error, execute, exportResults, setError }
}
