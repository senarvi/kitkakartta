import {
  FINLAND_BBOX,
  FMI_RADAR_RR1H_STORED_QUERY_ID,
  FMI_RADAR_WMS_BASE_URL,
  FMI_RADAR_WMS_LAYER_RR1H,
  FMI_RAINFALL_PARAMETER,
  FMI_STORED_QUERY_ID,
  FMI_TEMPERATURE_PARAMETER,
  FMI_WFS_BASE_URL,
  RADAR_REQUEST_LOOKBACK_HOURS,
  REQUEST_LOOKBACK_MINUTES,
  REQUEST_TIMESTEP_MINUTES,
} from '../constants/weather'

function toUtcIsoWithoutMilliseconds(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function floorToUtcHour(date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      0,
      0,
      0,
    ),
  )
}

function getCombinedWeatherParameters() {
  return `${FMI_TEMPERATURE_PARAMETER},${FMI_RAINFALL_PARAMETER}`
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

export function buildRainfallRequestUrl({ now = new Date(), aggregationHours = 1 } = {}) {
  const endTime = floorToUtcHour(now)
  const startTime = new Date(endTime.getTime() - aggregationHours * 60 * 60 * 1000)

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'getFeature',
    storedquery_id: FMI_STORED_QUERY_ID,
    bbox: `${FINLAND_BBOX.minLon},${FINLAND_BBOX.minLat},${FINLAND_BBOX.maxLon},${FINLAND_BBOX.maxLat}`,
    parameters: FMI_RAINFALL_PARAMETER,
    // Hourly rainfall (`r_1h`) is aggregated client-side to 12h/24h.
    timestep: '60',
    starttime: toUtcIsoWithoutMilliseconds(startTime),
    endtime: toUtcIsoWithoutMilliseconds(endTime),
  })

  return `${FMI_WFS_BASE_URL}?${params.toString()}`
}

export function buildLatestWeatherRequestUrl({ now = new Date(), aggregationHours = 1 } = {}) {
  const endTime = now
  const startTime = new Date(endTime.getTime() - aggregationHours * 60 * 60 * 1000)

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'getFeature',
    storedquery_id: FMI_STORED_QUERY_ID,
    bbox: `${FINLAND_BBOX.minLon},${FINLAND_BBOX.minLat},${FINLAND_BBOX.maxLon},${FINLAND_BBOX.maxLat}`,
    parameters: getCombinedWeatherParameters(),
    timestep: String(REQUEST_TIMESTEP_MINUTES),
    starttime: toUtcIsoWithoutMilliseconds(startTime),
    endtime: toUtcIsoWithoutMilliseconds(endTime),
  })

  return `${FMI_WFS_BASE_URL}?${params.toString()}`
}

export function buildRadarRr1hMetadataRequestUrl({ now = new Date() } = {}) {
  const endTime = now
  const startTime = new Date(endTime.getTime() - RADAR_REQUEST_LOOKBACK_HOURS * 60 * 60 * 1000)

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'getFeature',
    storedquery_id: FMI_RADAR_RR1H_STORED_QUERY_ID,
    bbox: `${FINLAND_BBOX.minLon},${FINLAND_BBOX.minLat},${FINLAND_BBOX.maxLon},${FINLAND_BBOX.maxLat},epsg::4326`,
    starttime: toUtcIsoWithoutMilliseconds(startTime),
    endtime: toUtcIsoWithoutMilliseconds(endTime),
  })

  return `${FMI_WFS_BASE_URL}?${params.toString()}`
}

export function buildRadarRr1hWmsTileUrl({ timeIso }) {
  const params = [
    'service=WMS',
    'version=1.3.0',
    'request=GetMap',
    `layers=${encodeURIComponent(FMI_RADAR_WMS_LAYER_RR1H)}`,
    'styles=',
    'transparent=true',
    'format=image/png',
    'crs=EPSG:3857',
    'width=1024',
    'height=1024',
    `time=${encodeURIComponent(timeIso)}`,
    'bbox={bbox-epsg-3857}',
  ]

  return `${FMI_RADAR_WMS_BASE_URL}?${params.join('&')}`
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

export async function fetchRainfallXml({ signal, now = new Date(), aggregationHours = 1 } = {}) {
  const url = buildRainfallRequestUrl({ now, aggregationHours })
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`FMI request failed with status ${response.status}`)
  }

  return {
    xmlText: await response.text(),
    requestedAt: now.toISOString(),
  }
}

export async function fetchLatestWeatherXml({
  signal,
  now = new Date(),
  aggregationHours = 1,
} = {}) {
  const url = buildLatestWeatherRequestUrl({ now, aggregationHours })
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`FMI request failed with status ${response.status}`)
  }

  return {
    xmlText: await response.text(),
    requestedAt: now.toISOString(),
  }
}

export async function fetchLatestRadarRr1hMetadataXml({ signal, now = new Date() } = {}) {
  const url = buildRadarRr1hMetadataRequestUrl({ now })
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`FMI radar request failed with status ${response.status}`)
  }

  return {
    xmlText: await response.text(),
    requestedAt: now.toISOString(),
  }
}
