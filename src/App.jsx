import { useEffect, useMemo, useState } from 'react'
import Map, { Layer, Source } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RadarLayerToggle } from './components/RadarLayerToggle'
import { RainfallLayerToggle } from './components/RainfallLayerToggle'
import { RainfallTimespanToggle } from './components/RainfallTimespanToggle'
import { TemperatureLayerToggle } from './components/TemperatureLayerToggle'
import {
  DEFAULT_RAINFALL_TIMESPAN_KEY,
  FINLAND_BOUNDS,
  RAINFALL_TIMESPAN_OPTIONS,
} from './constants/weather'
import { useLatestWeatherObservations } from './hooks/useLatestWeatherObservations'
import { useLatestRadarOverlay } from './hooks/useLatestRadarOverlay'

const OSM_RASTER_STYLE = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    },
  },
  layers: [
    {
      id: 'osm-raster',
      type: 'raster',
      source: 'osm',
    },
  ],
}

const DEFAULT_VIEW_STATE = {
  longitude: 25,
  latitude: 60.6,
  zoom: 6.2,
}

const USER_LOCATION_DEFAULT_ZOOM = 7

const TEMPERATURE_POINT_LAYER = {
  id: 'temperature-point-layer',
  type: 'circle',
  source: 'temperature-source',
  paint: {
    'circle-radius': 3,
    'circle-color': '#0f172a',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
}

const TEMPERATURE_LABEL_LAYOUT = {
  'text-field': ['get', 'label'],
  'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
  'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11.5, 8, 13.5],
  'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
  'text-radial-offset': 0.7,
  'text-justify': 'auto',
  'text-allow-overlap': false,
  'text-ignore-placement': false,
}

const TEMPERATURE_LABEL_LAYER = {
  id: 'temperature-label-layer',
  type: 'symbol',
  source: 'temperature-source',
  layout: TEMPERATURE_LABEL_LAYOUT,
  paint: {
    'text-color': '#350717',
    'text-halo-color': '#fbffef',
    'text-halo-width': 3.0,
    'text-halo-blur': 0.7,
  },
}

const RAINFALL_POINT_LAYER = {
  id: 'rainfall-point-layer',
  type: 'circle',
  source: 'rainfall-source',
  paint: {
    'circle-radius': 3,
    'circle-color': '#14532d',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#dcfce7',
  },
}

const RAINFALL_LABEL_LAYOUT = {
  'text-field': ['get', 'label'],
  'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
  'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 8, 13],
  'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
  'text-radial-offset': 0.75,
  'text-justify': 'auto',
  'text-allow-overlap': false,
  'text-ignore-placement': false,
}

const RAINFALL_LABEL_LAYER = {
  id: 'rainfall-label-layer',
  type: 'symbol',
  source: 'rainfall-source',
  layout: RAINFALL_LABEL_LAYOUT,
  paint: {
    'text-color': '#064e3b',
    'text-halo-color': '#ecfdf5',
    'text-halo-width': 2.5,
    'text-halo-blur': 0.5,
  },
}

const RADAR_RASTER_LAYER = {
  id: 'radar-raster-layer',
  type: 'raster',
  source: 'radar-source',
  paint: {
    'raster-opacity': 0.3,
    'raster-resampling': 'linear',
  },
}

function formatTemperature(temperatureC) {
  const rounded = Math.round(temperatureC * 10) / 10
  return `${rounded.toFixed(1)} °C`
}

function formatRainfall(rainfallAmountMm, unitLabel) {
  const rounded = Math.round(rainfallAmountMm * 10) / 10
  return `${rounded.toFixed(1)} ${unitLabel}`
}

function formatLastUpdatedAt(isoString) {
  if (!isoString) {
    return 'No successful updates yet'
  }

  return new Date(isoString).toLocaleString('fi-FI', {
    timeZone: 'Europe/Helsinki',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE)
  const [isRadarLayerVisible, setIsRadarLayerVisible] = useState(false)
  const [isTemperatureLayerVisible, setIsTemperatureLayerVisible] = useState(true)
  const [isRainfallLayerVisible, setIsRainfallLayerVisible] = useState(true)
  const [rainfallTimespanKey, setRainfallTimespanKey] = useState(DEFAULT_RAINFALL_TIMESPAN_KEY)
  const rainfallTimespanOptions = useMemo(
    () => [
      RAINFALL_TIMESPAN_OPTIONS['1h'],
      RAINFALL_TIMESPAN_OPTIONS['12h'],
      RAINFALL_TIMESPAN_OPTIONS['24h'],
    ],
    [],
  )
  const {
    temperatureObservations,
    rainfallObservations,
    errorMessage: weatherErrorMessage,
    isLoading: isWeatherLoading,
    isTemperatureEmpty,
    isRainfallEmpty,
    isErrorWithoutAnyData,
    lastUpdatedAt: weatherLastUpdatedAt,
    unitLabel: rainfallUnitLabel,
  } = useLatestWeatherObservations({
    timespanKey: rainfallTimespanKey,
  })
  const {
    tileUrl: radarTileUrl,
    isLoading: isRadarLoading,
    errorMessage: radarErrorMessage,
    isErrorWithoutData: isRadarErrorWithoutData,
    hasData: hasRadarData,
  } = useLatestRadarOverlay({
    timespanKey: rainfallTimespanKey,
  })

  const visibleTemperatureObservations = useMemo(
    () => (isTemperatureLayerVisible ? temperatureObservations : []),
    [isTemperatureLayerVisible, temperatureObservations],
  )

  const visibleRainfallObservations = useMemo(
    () => (isRainfallLayerVisible ? rainfallObservations : []),
    [isRainfallLayerVisible, rainfallObservations],
  )

  const temperatureGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: visibleTemperatureObservations.map((observation) => ({
        type: 'Feature',
        id: `${observation.stationId}-${observation.observedAtEpochMs}`,
        geometry: {
          type: 'Point',
          coordinates: [observation.longitude, observation.latitude],
        },
        properties: {
          stationId: observation.stationId,
          stationName: observation.stationName,
          observedAtIso: observation.observedAtIso,
          temperatureC: observation.temperatureC,
          label: formatTemperature(observation.temperatureC),
        },
      })),
    }),
    [visibleTemperatureObservations],
  )

  const rainfallGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: visibleRainfallObservations.map((observation) => ({
        type: 'Feature',
        id: `${observation.stationId}-${observation.observedAtEpochMs}`,
        geometry: {
          type: 'Point',
          coordinates: [observation.longitude, observation.latitude],
        },
        properties: {
          stationId: observation.stationId,
          stationName: observation.stationName,
          observedAtIso: observation.observedAtIso,
          rainfallAmountMm: observation.rainfallAmountMm,
          label: formatRainfall(observation.rainfallAmountMm, rainfallUnitLabel),
        },
      })),
    }),
    [rainfallUnitLabel, visibleRainfallObservations],
  )

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    let isCancelled = false

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isCancelled) {
          return
        }

        setViewState((previousViewState) => ({
          ...previousViewState,
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: Math.max(previousViewState.zoom, USER_LOCATION_DEFAULT_ZOOM),
        }))
      },
      () => {
        // Keep default Finland-centered view when geolocation is denied or unavailable.
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      },
    )

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <main className="relative h-dvh w-full">
      <Map
        mapLib={maplibregl}
        longitude={viewState.longitude}
        latitude={viewState.latitude}
        zoom={viewState.zoom}
        onMove={(event) => setViewState(event.viewState)}
        mapStyle={OSM_RASTER_STYLE}
        maxBounds={FINLAND_BOUNDS}
        minZoom={4}
        maxZoom={9}
        dragRotate={false}
        touchZoomRotate={false}
        pitchWithRotate={false}
        attributionControl
        reuseMaps
        style={{ width: '100%', height: '100%' }}
      >
        {isRadarLayerVisible && hasRadarData && (
          <Source id="radar-source" type="raster" tiles={[radarTileUrl]} tileSize={1024}>
            <Layer {...RADAR_RASTER_LAYER} />
          </Source>
        )}
        {visibleTemperatureObservations.length > 0 && (
          <Source id="temperature-source" type="geojson" data={temperatureGeoJson}>
            <Layer {...TEMPERATURE_POINT_LAYER} />
            <Layer {...TEMPERATURE_LABEL_LAYER} />
          </Source>
        )}
        {visibleRainfallObservations.length > 0 && (
          <Source id="rainfall-source" type="geojson" data={rainfallGeoJson}>
            <Layer {...RAINFALL_POINT_LAYER} />
            <Layer {...RAINFALL_LABEL_LAYER} />
          </Source>
        )}
      </Map>

      <section className="pointer-events-none absolute left-3 top-3 z-10 space-y-2">
        <div className="pointer-events-auto inline-block rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <TemperatureLayerToggle
              isVisible={isTemperatureLayerVisible}
              onToggle={() => setIsTemperatureLayerVisible((visible) => !visible)}
            />
            <RainfallLayerToggle
              isVisible={isRainfallLayerVisible}
              onToggle={() => setIsRainfallLayerVisible((visible) => !visible)}
            />
            <RadarLayerToggle
              isVisible={isRadarLayerVisible}
              onToggle={() => setIsRadarLayerVisible((visible) => !visible)}
            />
          </div>
          <RainfallTimespanToggle
            selectedKey={rainfallTimespanKey}
            options={rainfallTimespanOptions}
            onSelect={setRainfallTimespanKey}
          />
          <p className="mt-2 text-xs text-slate-700">
            Updated:{' '}
            <span className="font-medium">{formatLastUpdatedAt(weatherLastUpdatedAt)}</span>
          </p>
        </div>

        {isWeatherLoading && (
          <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm backdrop-blur">
            Loading latest weather observations...
          </div>
        )}

        {isRadarLayerVisible && isRadarLoading && (
          <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm backdrop-blur">
            Loading latest radar overlay...
          </div>
        )}

        {weatherErrorMessage && !isErrorWithoutAnyData && (
          <div className="pointer-events-auto rounded-lg border border-amber-300 bg-amber-50/95 p-3 text-sm text-amber-900 shadow-sm backdrop-blur">
            {weatherErrorMessage}
          </div>
        )}

        {isRadarLayerVisible && radarErrorMessage && !isRadarErrorWithoutData && (
          <div className="pointer-events-auto rounded-lg border border-amber-300 bg-amber-50/95 p-3 text-sm text-amber-900 shadow-sm backdrop-blur">
            {radarErrorMessage}
          </div>
        )}

        {isTemperatureEmpty && (
          <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm backdrop-blur">
            No recent temperature observations found in the current time window.
          </div>
        )}

        {isRainfallEmpty && (
          <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm backdrop-blur">
            No recent rainfall observations found in the selected window.
          </div>
        )}

        {isErrorWithoutAnyData && (
          <div className="pointer-events-auto rounded-lg border border-rose-300 bg-rose-50/95 p-3 text-sm text-rose-900 shadow-sm backdrop-blur">
            Unable to load weather observations right now.
          </div>
        )}

        {isRadarLayerVisible && isRadarErrorWithoutData && (
          <div className="pointer-events-auto rounded-lg border border-rose-300 bg-rose-50/95 p-3 text-sm text-rose-900 shadow-sm backdrop-blur">
            Unable to load radar overlay right now.
          </div>
        )}
      </section>
    </main>
  )
}

export default App
