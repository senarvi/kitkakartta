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

const radarCacheByTimespanKey = new Map()

export function useLatestRadarOverlay({ timespanKey = DEFAULT_RAINFALL_TIMESPAN_KEY } = {}) {
  const [state, setState] = useState(INITIAL_STATE)
  const lastSuccessfulStateRef = useRef(INITIAL_STATE)

  useEffect(() => {
    let isDisposed = false
    let activeController = null

    const getFreshCachedState = () => {
      const cachedEntry = radarCacheByTimespanKey.get(timespanKey)

      if (!cachedEntry) {
        return null
      }

      const isFresh = Date.now() - cachedEntry.fetchedAtEpochMs < POLL_INTERVAL_MS
      return isFresh ? cachedEntry.state : null
    }

    const load = async () => {
      const freshCachedState = getFreshCachedState()

      if (freshCachedState) {
        lastSuccessfulStateRef.current = freshCachedState
        setState(freshCachedState)
        return
      }

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
        radarCacheByTimespanKey.set(timespanKey, {
          state: nextState,
          fetchedAtEpochMs: Date.now(),
        })
        setState(nextState)
      } catch {
        if (isDisposed || controller.signal.aborted) {
          return
        }

        const cachedEntry = radarCacheByTimespanKey.get(timespanKey)
        const cachedState = cachedEntry?.state ?? lastSuccessfulStateRef.current

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
