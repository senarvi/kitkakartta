import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchLatestWeatherXml } from '../api/fmi'
import {
  DEFAULT_RAINFALL_TIMESPAN_KEY,
  POLL_INTERVAL_MS,
  RAINFALL_TIMESPAN_OPTIONS,
} from '../constants/weather'
import {
  parseCombinedWeatherObservationsXml,
  selectAggregatedRainfallByStation,
  selectLatestTemperatureByStation,
} from '../parsers/fmiTemperatureParser'

const INITIAL_STATE = {
  temperatureObservations: [],
  rainfallObservations: [],
  isLoading: true,
  errorMessage: '',
  lastUpdatedAt: '',
  didLoadOnce: false,
}

export function useLatestWeatherObservations({
  timespanKey = DEFAULT_RAINFALL_TIMESPAN_KEY,
} = {}) {
  const [state, setState] = useState(INITIAL_STATE)
  const lastSuccessfulStateRef = useRef(INITIAL_STATE)
  const selectedTimespan =
    RAINFALL_TIMESPAN_OPTIONS[timespanKey] ??
    RAINFALL_TIMESPAN_OPTIONS[DEFAULT_RAINFALL_TIMESPAN_KEY]

  useEffect(() => {
    let isDisposed = false
    let activeController = null

    lastSuccessfulStateRef.current = INITIAL_STATE

    const load = async () => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller

      setState({
        ...INITIAL_STATE,
        isLoading: true,
      })

      try {
        const { xmlText, requestedAt } = await fetchLatestWeatherXml({
          signal: controller.signal,
          aggregationHours: selectedTimespan.aggregationHours,
        })

        if (isDisposed || controller.signal.aborted) {
          return
        }

        const parsedObservations = parseCombinedWeatherObservationsXml(xmlText)
        const requestDate = new Date(requestedAt)
        const latestTemperatureObservations = selectLatestTemperatureByStation(parsedObservations, {
          now: requestDate,
        })
        const aggregatedRainfallObservations = selectAggregatedRainfallByStation(parsedObservations, {
          now: requestDate,
          aggregationHours: selectedTimespan.aggregationHours,
        })

        const nextState = {
          temperatureObservations: latestTemperatureObservations,
          rainfallObservations: aggregatedRainfallObservations,
          isLoading: false,
          errorMessage: '',
          lastUpdatedAt: requestedAt,
          didLoadOnce: true,
        }

        lastSuccessfulStateRef.current = nextState
        setState(nextState)
      } catch {
        if (isDisposed || controller.signal.aborted) {
          return
        }

        const cachedState = lastSuccessfulStateRef.current

        setState({
          temperatureObservations: cachedState.temperatureObservations,
          rainfallObservations: cachedState.rainfallObservations,
          isLoading: false,
          errorMessage:
            'Failed to refresh FMI weather observations. Showing latest available data.',
          lastUpdatedAt: cachedState.lastUpdatedAt,
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
    const hasTemperatureData = state.temperatureObservations.length > 0
    const hasRainfallData = state.rainfallObservations.length > 0

    return {
      ...state,
      hasTemperatureData,
      hasRainfallData,
      isTemperatureEmpty: state.didLoadOnce && !state.isLoading && !state.errorMessage && !hasTemperatureData,
      isRainfallEmpty: state.didLoadOnce && !state.isLoading && !state.errorMessage && !hasRainfallData,
      isErrorWithoutAnyData:
        Boolean(state.errorMessage) && !hasTemperatureData && !hasRainfallData,
      timespanKey: selectedTimespan.key,
      unitLabel: selectedTimespan.unitLabel,
      timespanLabel: selectedTimespan.label,
    }
  }, [selectedTimespan.key, selectedTimespan.label, selectedTimespan.unitLabel, state])
}
