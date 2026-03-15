import {
  FINLAND_BBOX,
  FMI_STORED_QUERY_ID,
  FMI_TEMPERATURE_PARAMETER,
  FMI_WFS_BASE_URL,
  REQUEST_LOOKBACK_MINUTES,
  REQUEST_TIMESTEP_MINUTES,
} from '../constants/weather'

function toUtcIsoWithoutMilliseconds(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function buildLatestTemperatureRequestUrl(now = new Date()) {
  const startTime = new Date(now.getTime() - REQUEST_LOOKBACK_MINUTES * 60 * 1000)

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'getFeature',
    storedquery_id: FMI_STORED_QUERY_ID,
    bbox: `${FINLAND_BBOX.minLon},${FINLAND_BBOX.minLat},${FINLAND_BBOX.maxLon},${FINLAND_BBOX.maxLat}`,
    parameters: FMI_TEMPERATURE_PARAMETER,
    timestep: String(REQUEST_TIMESTEP_MINUTES),
    starttime: toUtcIsoWithoutMilliseconds(startTime),
  })

  return `${FMI_WFS_BASE_URL}?${params.toString()}`
}

export async function fetchLatestTemperatureXml({ signal, now = new Date() } = {}) {
  const url = buildLatestTemperatureRequestUrl(now)
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`FMI request failed with status ${response.status}`)
  }

  return {
    xmlText: await response.text(),
    requestedAt: now.toISOString(),
  }
}
