import { describe, expect, it } from 'vitest'
import { parseRadarCompositeMetadataXml } from './fmiRadarParser'

const radarXml = `
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:om="http://www.opengis.net/om/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:omso="http://inspire.ec.europa.eu/schemas/omso/3.0">
  <wfs:member>
    <omso:GridSeriesObservation gml:id="radar-1">
      <om:resultTime>
        <gml:TimeInstant gml:id="result-time-1">
          <gml:timePosition>2026-03-15T10:00:00Z</gml:timePosition>
        </gml:TimeInstant>
      </om:resultTime>
    </omso:GridSeriesObservation>
  </wfs:member>
</wfs:FeatureCollection>
`

describe('parseRadarCompositeMetadataXml', () => {
  it('extracts latest result time from radar response', () => {
    const metadata = parseRadarCompositeMetadataXml(radarXml)

    expect(metadata).toEqual({
      resultTimeIso: '2026-03-15T10:00:00Z',
    })
  })

  it('throws when result time is missing', () => {
    expect(() =>
      parseRadarCompositeMetadataXml(
        '<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"/>',
      ),
    ).toThrow('Missing result time in FMI radar response')
  })
})
