import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchRainfallXml } from '../api/fmi'
import {
  DEFAULT_RAINFALL_TIMESPAN_KEY,
  POLL_INTERVAL_MS,
  RAINFALL_TIMESPAN_OPTIONS,
} from '../constants/weather'
import {
  parseRainfallObservationsXml,
  selectAggregatedRainfallByStation,
} from '../parsers/fmiTemperatureParser'

const INITIAL_STATE = {
  observations: [],
  isLoading: true,
  errorMessage: '',
  lastUpdatedAt: '',
  didLoadOnce: false,
}

export function useLatestRainfall({ timespanKey = DEFAULT_RAINFALL_TIMESPAN_KEY } = {}) {
  const [state, setState] = useState(INITIAL_STATE)
  const lastSuccessfulObservationsRef = useRef([])
  const lastSuccessfulUpdatedAtRef = useRef('')
  const selectedTimespan =
    RAINFALL_TIMESPAN_OPTIONS[timespanKey] ??
    RAINFALL_TIMESPAN_OPTIONS[DEFAULT_RAINFALL_TIMESPAN_KEY]

  useEffect(() => {
    let isDisposed = false
    let activeController = null

    lastSuccessfulObservationsRef.current = []
    lastSuccessfulUpdatedAtRef.current = ''

    const load = async () => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller

      setState({
        ...INITIAL_STATE,
        isLoading: true,
      })

      try {
        const { xmlText, requestedAt } = await fetchRainfallXml({
          signal: controller.signal,
          aggregationHours: selectedTimespan.aggregationHours,
        })

        if (isDisposed || controller.signal.aborted) {
          return
        }

        const parsedObservations = parseRainfallObservationsXml(xmlText)
        const aggregatedObservations = selectAggregatedRainfallByStation(parsedObservations, {
          aggregationHours: selectedTimespan.aggregationHours,
        })

        lastSuccessfulObservationsRef.current = aggregatedObservations
        lastSuccessfulUpdatedAtRef.current = requestedAt

        setState({
          observations: aggregatedObservations,
          isLoading: false,
          errorMessage: '',
          lastUpdatedAt: requestedAt,
          didLoadOnce: true,
        })
      } catch {
        if (isDisposed || controller.signal.aborted) {
          return
        }

        const cachedObservations = lastSuccessfulObservationsRef.current

        setState({
          observations: cachedObservations,
          isLoading: false,
          errorMessage: 'Failed to refresh FMI rainfall observations. Showing latest available data.',
          lastUpdatedAt: cachedObservations.length > 0 ? lastSuccessfulUpdatedAtRef.current : '',
          didLoadOnce: true,
        })
      }
    }

    load()
    const intervalId = window.setInterval(load, POLL_INTERVAL_MS)

    return () => {
      isDisposed = true
      activeController?.abort()
      window.clearInterval(intervalId)
    }
  }, [selectedTimespan.aggregationHours])

  return useMemo(() => {
    const hasData = state.observations.length > 0
    const isEmpty = state.didLoadOnce && !state.isLoading && !state.errorMessage && !hasData
    const isErrorWithoutData = Boolean(state.errorMessage) && !hasData

    return {
      ...state,
      hasData,
      isEmpty,
      isErrorWithoutData,
      timespanKey: selectedTimespan.key,
      unitLabel: selectedTimespan.unitLabel,
      timespanLabel: selectedTimespan.label,
    }
  }, [selectedTimespan.key, selectedTimespan.label, selectedTimespan.unitLabel, state])
}
