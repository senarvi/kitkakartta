import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchLatestTemperatureXml } from '../api/fmi'
import { POLL_INTERVAL_MS } from '../constants/weather'
import {
  parseTemperatureObservationsXml,
  selectLatestTemperatureByStation,
} from '../parsers/fmiTemperatureParser'

const INITIAL_STATE = {
  observations: [],
  isLoading: true,
  errorMessage: '',
  lastUpdatedAt: '',
  didLoadOnce: false,
}

export function useLatestTemperatures() {
  const [state, setState] = useState(INITIAL_STATE)
  const lastSuccessfulObservationsRef = useRef([])
  const lastSuccessfulUpdatedAtRef = useRef('')

  useEffect(() => {
    let isDisposed = false
    let activeController = null

    const load = async () => {
      activeController?.abort()
      const controller = new AbortController()
      activeController = controller

      setState((currentState) => ({
        ...currentState,
        isLoading: !currentState.didLoadOnce,
        errorMessage: '',
      }))

      try {
        const { xmlText, requestedAt } = await fetchLatestTemperatureXml({
          signal: controller.signal,
        })

        if (isDisposed || controller.signal.aborted) {
          return
        }

        const parsedObservations = parseTemperatureObservationsXml(xmlText)
        const latestObservations = selectLatestTemperatureByStation(parsedObservations)

        lastSuccessfulObservationsRef.current = latestObservations
        lastSuccessfulUpdatedAtRef.current = requestedAt

        setState({
          observations: latestObservations,
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
          errorMessage: 'Failed to refresh FMI observations. Showing latest available data.',
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
  }, [])

  return useMemo(() => {
    const hasData = state.observations.length > 0
    const isEmpty = state.didLoadOnce && !state.isLoading && !state.errorMessage && !hasData
    const isErrorWithoutData = Boolean(state.errorMessage) && !hasData

    return {
      ...state,
      hasData,
      isEmpty,
      isErrorWithoutData,
    }
  }, [state])
}
