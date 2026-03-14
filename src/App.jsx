import Map from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const FINLAND_BOUNDS = [
  [19, 59],
  [32, 71.5],
]

const OSM_RASTER_STYLE = {
  version: 8,
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

function App() {
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
      />
    </main>
  )
}

export default App
