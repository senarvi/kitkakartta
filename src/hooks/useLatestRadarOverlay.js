import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildRadarRr1hWmsTileUrl,
  fetchLatestRadarRr1hMetadataXml,
} from '../api/fmi'
import { POLL_INTERVAL_MS } from '../constants/weather'
import { parseRadarCompositeMetadataXml } from '../parsers/fmiRadarParser'

const INITIAL_STATE = {
  tileUrl: '',
  lastUpdatedAt: '',
  isLoading: true,
  errorMessage: '',
  didLoadOnce: false,
}

export function useLatestRadarOverlay() {
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
        const { xmlText } = await fetchLatestRadarRr1hMetadataXml({
          signal: controller.signal,
        })

        if (isDisposed || controller.signal.aborted) {
          return
        }

        const { resultTimeIso } = parseRadarCompositeMetadataXml(xmlText)
        const tileUrl = buildRadarRr1hWmsTileUrl({
          timeIso: resultTimeIso,
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
  }, [])

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
