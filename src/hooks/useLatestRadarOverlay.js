import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildRadarWmsTileUrl,
  fetchLatestRadarMetadataXml,
} from '../api/fmi'
import { DEFAULT_RAINFALL_TIMESPAN_KEY, POLL_INTERVAL_MS } from '../constants/weather'
import { parseRadarCompositeMetadataXml } from '../parsers/fmiRadarParser'

const INITIAL_STATE = {
  tileUrl: '',
  lastUpdatedAt: '',
  isLoading: true,
  errorMessage: '',
  didLoadOnce: false,
}

export function useLatestRadarOverlay({ timespanKey = DEFAULT_RAINFALL_TIMESPAN_KEY } = {}) {
  const [state, setState] = useState(INITIAL_STATE)
  const lastSuccessfulStateRef = useRef(INITIAL_STATE)

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
        const { xmlText } = await fetchLatestRadarMetadataXml({
          signal: controller.signal,
          timespanKey,
        })

        if (isDisposed || controller.signal.aborted) {
          return
        }

        const { resultTimeIso } = parseRadarCompositeMetadataXml(xmlText)
        const tileUrl = buildRadarWmsTileUrl({
          timeIso: resultTimeIso,
          timespanKey,
        })

        const nextState = {
          tileUrl,
          lastUpdatedAt: resultTimeIso,
          isLoading: false,
          errorMessage: '',
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
          tileUrl: cachedState.tileUrl,
          lastUpdatedAt: cachedState.lastUpdatedAt,
          isLoading: false,
          errorMessage: 'Failed to refresh FMI radar overlay. Showing latest available radar image.',
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
  }, [timespanKey])

  return useMemo(() => {
    const hasData = Boolean(state.tileUrl)

    return {
      ...state,
      hasData,
      isEmpty: state.didLoadOnce && !state.isLoading && !state.errorMessage && !hasData,
      isErrorWithoutData: Boolean(state.errorMessage) && !hasData,
    }
  }, [state])
}
