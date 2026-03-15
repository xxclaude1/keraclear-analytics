import { useState } from 'react'

export default function useTimeFilter(defaultPeriod = '24h') {
  const [period, setPeriod] = useState(defaultPeriod)
  const [customRange, setCustomRange] = useState({ start: null, end: null })

  const getQueryParams = () => {
    if (period === 'custom' && customRange.start) {
      const params = { start: customRange.start }
      if (customRange.end) params.end = customRange.end
      return params
    }
    return { period }
  }

  return { period, setPeriod, customRange, setCustomRange, getQueryParams }
}
