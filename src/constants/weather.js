export const FMI_WFS_BASE_URL = 'https://opendata.fmi.fi/wfs'
export const FMI_STORED_QUERY_ID = 'fmi::observations::weather::multipointcoverage'
export const FMI_TEMPERATURE_PARAMETER = 't2m'
export const FMI_RAINFALL_PARAMETER = 'r_1h'
export const FMI_RELATIVE_HUMIDITY_PARAMETER = 'rh'
export const FMI_RADAR_WMS_BASE_URL = 'https://openwms.fmi.fi/geoserver/Radar/wms'

export const RADAR_PRODUCT_BY_TIMESPAN_KEY = {
  '1h': {
    storedQueryId: 'fmi::radar::composite::rr1h',
    wmsLayer: 'Radar:suomi_rr1h_eureffin',
  },
  '12h': {
    storedQueryId: 'fmi::radar::composite::rr12h',
    wmsLayer: 'Radar:suomi_rr12h_eureffin',
  },
  '24h': {
    storedQueryId: 'fmi::radar::composite::rr24h',
    wmsLayer: 'Radar:suomi_rr24h_eureffin',
  },
}

export const RAINFALL_TIMESPAN_OPTIONS = {
  '1h': {
    key: '1h',
    label: '1h',
    aggregationHours: 1,
    unitLabel: 'mm',
  },
  '12h': {
    key: '12h',
    label: '12h',
    aggregationHours: 12,
    unitLabel: 'mm',
  },
  '24h': {
    key: '24h',
    label: '24h',
    aggregationHours: 24,
    unitLabel: 'mm',
  },
}

export const DEFAULT_RAINFALL_TIMESPAN_KEY = '1h'

export const FINLAND_BBOX = {
  minLon: 19,
  minLat: 59,
  maxLon: 32,
  maxLat: 71,
}

export const FINLAND_BOUNDS = [
  [FINLAND_BBOX.minLon, FINLAND_BBOX.minLat],
  [FINLAND_BBOX.maxLon, 71.5],
]

export const REQUEST_LOOKBACK_MINUTES = 15
export const REQUEST_TIMESTEP_MINUTES = 10
export const RADAR_REQUEST_LOOKBACK_HOURS = 2
export const POLL_INTERVAL_MS = 10 * 60 * 1000
export const STALE_THRESHOLD_MS = 30 * 60 * 1000
