import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  parseRainfallObservationsXml,
  selectAggregatedRainfallByStation,
  parseTemperatureObservationsXml,
  selectLatestTemperatureByStation,
} from './fmiTemperatureParser'

const exampleXml = readFileSync('docs/fmi/temperature_example.xml', 'utf8')

const minimalXml = `
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:target="http://xml.fmi.fi/namespace/om/atmosphericfeatures/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
  <target:Location gml:id="obsloc-fmisid-123-pos">
    <gml:identifier codeSpace="http://xml.fmi.fi/namespace/stationcode/fmisid">123</gml:identifier>
    <gml:name codeSpace="http://xml.fmi.fi/namespace/locationcode/name">Test Station</gml:name>
    <target:representativePoint xlink:href="#point-123"/>
  </target:Location>
  <gml:Point gml:id="point-123">
    <gml:pos>60.1 24.9</gml:pos>
  </gml:Point>
  <gmlcov:positions>
    60.1 24.9 1700000000
  </gmlcov:positions>
  <gml:doubleOrNilReasonTupleList>
    2.6
  </gml:doubleOrNilReasonTupleList>
</wfs:FeatureCollection>
`

const malformedValueXml = `
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0" xmlns:target="http://xml.fmi.fi/namespace/om/atmosphericfeatures/1.1" xmlns:xlink="http://www.w3.org/1999/xlink">
  <target:Location gml:id="obsloc-fmisid-123-pos">
    <gml:identifier codeSpace="http://xml.fmi.fi/namespace/stationcode/fmisid">123</gml:identifier>
    <gml:name codeSpace="http://xml.fmi.fi/namespace/locationcode/name">Test Station</gml:name>
    <target:representativePoint xlink:href="#point-123"/>
  </target:Location>
  <gml:Point gml:id="point-123">
    <gml:pos>60.1 24.9</gml:pos>
  </gml:Point>
  <gmlcov:positions>
    60.1 24.9 1700000000
  </gmlcov:positions>
  <gml:doubleOrNilReasonTupleList>
    NaN
  </gml:doubleOrNilReasonTupleList>
</wfs:FeatureCollection>
`

describe('parseTemperatureObservationsXml', () => {
  it('parses observations from FMI multipoint coverage XML', () => {
    const observations = parseTemperatureObservationsXml(exampleXml)

    expect(observations.length).toBeGreaterThan(0)
    expect(observations[0]).toMatchObject({
      stationId: expect.any(String),
      stationName: expect.any(String),
      longitude: expect.any(Number),
      latitude: expect.any(Number),
      temperatureC: expect.any(Number),
      observedAtEpochMs: expect.any(Number),
    })
  })

  it('normalizes coordinates as longitude, latitude', () => {
    const observations = parseTemperatureObservationsXml(minimalXml)
    expect(observations).toHaveLength(1)
    expect(observations[0].longitude).toBe(24.9)
    expect(observations[0].latitude).toBe(60.1)
  })

  it('skips malformed values', () => {
    const observations = parseTemperatureObservationsXml(malformedValueXml)
    expect(observations).toHaveLength(0)
  })

  it('returns empty list for empty response', () => {
    const observations = parseTemperatureObservationsXml('<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0"/>')
    expect(observations).toEqual([])
  })
})

describe('selectLatestTemperatureByStation', () => {
  it('keeps only newest observation per station and filters stale data', () => {
    const now = new Date('2026-03-15T08:00:00Z')

    const selected = selectLatestTemperatureByStation(
      [
        {
          stationId: '101',
          stationName: 'A',
          longitude: 24,
          latitude: 60,
          temperatureC: 1,
          observedAtEpochMs: Date.parse('2026-03-15T07:10:00Z'),
        },
        {
          stationId: '101',
          stationName: 'A',
          longitude: 24,
          latitude: 60,
          temperatureC: 2,
          observedAtEpochMs: Date.parse('2026-03-15T07:50:00Z'),
        },
        {
          stationId: '202',
          stationName: 'B',
          longitude: 25,
          latitude: 61,
          temperatureC: 5,
          observedAtEpochMs: Date.parse('2026-03-15T07:20:00Z'),
        },
      ],
      {
        now,
        staleThresholdMs: 30 * 60 * 1000,
      },
    )

    expect(selected).toHaveLength(1)
    expect(selected[0]).toMatchObject({
      stationId: '101',
      temperatureC: 2,
    })
  })
})

describe('parseRainfallObservationsXml', () => {
  it('parses rainfall observations from FMI multipoint coverage XML', () => {
    const observations = parseRainfallObservationsXml(minimalXml)

    expect(observations).toHaveLength(1)
    expect(observations[0]).toMatchObject({
      stationId: '123',
      stationName: 'Test Station',
      longitude: 24.9,
      latitude: 60.1,
      rainfallAmount1hMm: 2.6,
    })
  })
})

describe('selectAggregatedRainfallByStation', () => {
  it('aggregates hourly rainfall for the selected window per station', () => {
    const now = new Date('2026-03-15T12:00:00Z')

    const selected = selectAggregatedRainfallByStation(
      [
        {
          stationId: '101',
          stationName: 'A',
          longitude: 24,
          latitude: 60,
          rainfallAmount1hMm: 1.2,
          observedAtEpochMs: Date.parse('2026-03-15T11:00:00Z'),
          observedAtIso: '2026-03-15T11:00:00Z',
        },
        {
          stationId: '101',
          stationName: 'A',
          longitude: 24,
          latitude: 60,
          rainfallAmount1hMm: 2.3,
          observedAtEpochMs: Date.parse('2026-03-15T10:00:00Z'),
          observedAtIso: '2026-03-15T10:00:00Z',
        },
        {
          stationId: '101',
          stationName: 'A',
          longitude: 24,
          latitude: 60,
          rainfallAmount1hMm: 9.9,
          observedAtEpochMs: Date.parse('2026-03-14T23:00:00Z'),
          observedAtIso: '2026-03-14T23:00:00Z',
        },
      ],
      {
        now,
        aggregationHours: 12,
      },
    )

    expect(selected).toHaveLength(1)
    expect(selected[0]).toMatchObject({
      stationId: '101',
      rainfallAmountMm: 3.5,
      observedAtIso: '2026-03-15T11:00:00Z',
    })
  })
})
