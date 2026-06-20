import { useCallback, useEffect, useState } from 'react'
import { fetchDataStatus } from '../api/data'

export function useDataStatus(pollWhileLoading = true) {
  const [dataStatus, setDataStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const status = await fetchDataStatus()
      setDataStatus(status)
      return status
    } catch {
      setDataStatus(null)
      return null
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!pollWhileLoading || !dataStatus?.loading) return undefined

    const interval = setInterval(refresh, 2500)
    return () => clearInterval(interval)
  }, [dataStatus?.loading, pollWhileLoading, refresh])

  const dataReady = dataStatus?.ready ?? (dataStatus?.price_rows > 0 && dataStatus?.fundamental_rows > 0)

  return { dataStatus, dataReady, statusLoading, refresh }
}
