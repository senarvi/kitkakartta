import { useMemo, useState } from 'react'
import Map, { Layer, Source } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { TemperatureLayerToggle } from './components/TemperatureLayerToggle'
import { FINLAND_BOUNDS } from './constants/weather'
import { useLatestTemperatures } from './hooks/useLatestTemperatures'

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

function formatTemperature(temperatureC) {
  const rounded = Math.round(temperatureC * 10) / 10
  return `${rounded.toFixed(1)} °C`
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
  const [isTemperatureLayerVisible, setIsTemperatureLayerVisible] = useState(true)
  const {
    observations,
    errorMessage,
    isLoading,
    isEmpty,
    isErrorWithoutData,
    lastUpdatedAt,
  } = useLatestTemperatures()

  const visibleObservations = useMemo(
    () => (isTemperatureLayerVisible ? observations : []),
    [isTemperatureLayerVisible, observations],
  )

  const temperatureGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: visibleObservations.map((observation) => ({
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
    [visibleObservations],
  )

  return (
    <main className="relative h-dvh w-full">
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: 26,
          latitude: 64.5,
          zoom: 4.6,
        }}
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
        {visibleObservations.length > 0 && (
          <Source id="temperature-source" type="geojson" data={temperatureGeoJson}>
            <Layer {...TEMPERATURE_POINT_LAYER} />
            <Layer {...TEMPERATURE_LABEL_LAYER} />
          </Source>
        )}
      </Map>

      <section className="pointer-events-none absolute left-3 top-3 z-10 w-[min(28rem,calc(100%-1.5rem))] space-y-2">
        <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h1 className="m-0 text-sm font-semibold text-slate-900">FMI Station Temperature</h1>
            <TemperatureLayerToggle
              isVisible={isTemperatureLayerVisible}
              onToggle={() => setIsTemperatureLayerVisible((visible) => !visible)}
            />
          </div>
          <p className="mt-2 text-xs text-slate-700">
            Last updated: <span className="font-medium">{formatLastUpdatedAt(lastUpdatedAt)}</span>
          </p>
          <p className="mt-1 text-xs text-slate-700">Unit: °C</p>
        </div>

        {isLoading && (
          <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm backdrop-blur">
            Loading latest observations...
          </div>
        )}

        {errorMessage && !isErrorWithoutData && (
          <div className="pointer-events-auto rounded-lg border border-amber-300 bg-amber-50/95 p-3 text-sm text-amber-900 shadow-sm backdrop-blur">
            {errorMessage}
          </div>
        )}

        {isEmpty && (
          <div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm backdrop-blur">
            No recent observations found in the current time window.
          </div>
        )}

        {isErrorWithoutData && (
          <div className="pointer-events-auto rounded-lg border border-rose-300 bg-rose-50/95 p-3 text-sm text-rose-900 shadow-sm backdrop-blur">
            Unable to load temperature observations right now.
          </div>
        )}
      </section>
    </main>
  )
}

export default App
