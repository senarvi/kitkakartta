import { STALE_THRESHOLD_MS } from '../constants/weather'

function getElementsByLocalName(node, localName) {
  return Array.from(node.getElementsByTagNameNS('*', localName))
}

function getFirstElementByLocalName(node, localName) {
  return getElementsByLocalName(node, localName)[0] ?? null
}

function getAttr(element, attrName) {
  return element?.getAttribute(attrName) ?? ''
}

function getTextContent(element) {
  return element?.textContent?.trim() ?? ''
}

function parseNumberTokens(text) {
  return text
    .trim()
    .split(/\s+/)
    .map((token) => Number(token))
}

function parsePositionTuples(positionsText) {
  const values = parseNumberTokens(positionsText)
  const tuples = []

  for (let index = 0; index + 2 < values.length; index += 3) {
    tuples.push({
      latitude: values[index],
      longitude: values[index + 1],
      unixTimeSeconds: values[index + 2],
    })
  }

  return tuples
}

function parseStationMetadata(doc) {
  const stationByPointId = new Map()
  const pointsInOrder = []
  const stationByCoordinateKey = new Map()

  for (const locationNode of getElementsByLocalName(doc, 'Location')) {
    const identifierNodes = getElementsByLocalName(locationNode, 'identifier')
    const fmisidIdentifier = identifierNodes.find((identifierNode) =>
      getAttr(identifierNode, 'codeSpace').includes('stationcode/fmisid'),
    )

    const nameNodes = getElementsByLocalName(locationNode, 'name')
    const stationNameNode = nameNodes.find((nameNode) =>
      getAttr(nameNode, 'codeSpace').includes('locationcode/name'),
    )

    const representativePointNode = getFirstElementByLocalName(locationNode, 'representativePoint')
    const pointHref = getAttr(representativePointNode, 'xlink:href')
    const pointId = pointHref.replace('#', '')

    stationByPointId.set(pointId, {
      stationId: getTextContent(fmisidIdentifier) || pointId,
      stationName: getTextContent(stationNameNode) || 'Unknown station',
    })
  }

  for (const pointNode of getElementsByLocalName(doc, 'Point')) {
    const pointId = getAttr(pointNode, 'gml:id') || getAttr(pointNode, 'id')
    const posNode = getFirstElementByLocalName(pointNode, 'pos')
    const [latitude, longitude] = parseNumberTokens(getTextContent(posNode))

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue
    }

    const station = stationByPointId.get(pointId) ?? {
      stationId: pointId || `${latitude},${longitude}`,
      stationName: getTextContent(getFirstElementByLocalName(pointNode, 'name')) || 'Unknown station',
    }

    const enrichedStation = {
      ...station,
      latitude,
      longitude,
    }

    pointsInOrder.push(enrichedStation)
    stationByCoordinateKey.set(`${latitude}|${longitude}`, enrichedStation)
  }

  return {
    pointsInOrder,
    stationByCoordinateKey,
  }
}

function parseWeatherObservationsXml(xmlText, { valuePropertyName }) {
  const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const parserErrorNode = xmlDoc.querySelector('parsererror')

  if (parserErrorNode) {
    throw new Error('Failed to parse FMI XML response')
  }

  const observations = []
  const { pointsInOrder, stationByCoordinateKey } = parseStationMetadata(xmlDoc)
  const positionsNodes = getElementsByLocalName(xmlDoc, 'positions')
  const valueListNodes = getElementsByLocalName(xmlDoc, 'doubleOrNilReasonTupleList')

  for (let coverageIndex = 0; coverageIndex < positionsNodes.length; coverageIndex += 1) {
    const positionsNode = positionsNodes[coverageIndex]
    const valueListNode = valueListNodes[coverageIndex]

    if (!positionsNode || !valueListNode) {
      continue
    }

    const tuples = parsePositionTuples(getTextContent(positionsNode))
    const values = getTextContent(valueListNode).split(/\s+/).filter(Boolean)
    const tupleCount = Math.min(tuples.length, values.length)

    for (let index = 0; index < tupleCount; index += 1) {
      const tuple = tuples[index]
      const measurementValue = Number(values[index])

      if (!Number.isFinite(tuple.latitude) || !Number.isFinite(tuple.longitude)) {
        continue
      }

      if (!Number.isFinite(tuple.unixTimeSeconds) || !Number.isFinite(measurementValue)) {
        continue
      }

      const fallbackStation = pointsInOrder[index]
      const station =
        stationByCoordinateKey.get(`${tuple.latitude}|${tuple.longitude}`) ??
        fallbackStation ?? {
          stationId: `${tuple.latitude}|${tuple.longitude}`,
          stationName: 'Unknown station',
        }

      const observedAtEpochMs = tuple.unixTimeSeconds * 1000

      observations.push({
        stationId: station.stationId,
        stationName: station.stationName,
        // Internal convention is always longitude, latitude.
        longitude: tuple.longitude,
        latitude: tuple.latitude,
        [valuePropertyName]: measurementValue,
        observedAtEpochMs,
        observedAtIso: new Date(observedAtEpochMs).toISOString(),
      })
    }
  }

  return observations
}

export function parseTemperatureObservationsXml(xmlText) {
  return parseWeatherObservationsXml(xmlText, {
    valuePropertyName: 'temperatureC',
  })
}

export function parseRainfallObservationsXml(xmlText) {
  return parseWeatherObservationsXml(xmlText, {
    valuePropertyName: 'rainfallAmount1hMm',
  })
}

export function selectLatestTemperatureByStation(
  observations,
  { now = new Date(), staleThresholdMs = STALE_THRESHOLD_MS } = {},
) {
  const latestByStationId = new Map()

  for (const observation of observations) {
    const latest = latestByStationId.get(observation.stationId)
    if (!latest || observation.observedAtEpochMs > latest.observedAtEpochMs) {
      latestByStationId.set(observation.stationId, observation)
    }
  }

  const nowMs = now.getTime()

  return Array.from(latestByStationId.values())
    .filter((observation) => nowMs - observation.observedAtEpochMs <= staleThresholdMs)
    .sort((left, right) => left.stationName.localeCompare(right.stationName, 'fi'))
}

export function selectAggregatedRainfallByStation(
  observations,
  { now = new Date(), aggregationHours = 1 } = {},
) {
  const windowMs = aggregationHours * 60 * 60 * 1000
  const windowStartMs = now.getTime() - windowMs
  const aggregatedByStation = new Map()

  for (const observation of observations) {
    if (observation.observedAtEpochMs < windowStartMs) {
      continue
    }

    if (!Number.isFinite(observation.rainfallAmount1hMm)) {
      continue
    }

    const current = aggregatedByStation.get(observation.stationId)

    if (!current) {
      aggregatedByStation.set(observation.stationId, {
        stationId: observation.stationId,
        stationName: observation.stationName,
        longitude: observation.longitude,
        latitude: observation.latitude,
        rainfallAmountMm: observation.rainfallAmount1hMm,
        observedAtEpochMs: observation.observedAtEpochMs,
        observedAtIso: observation.observedAtIso,
      })
      continue
    }

    current.rainfallAmountMm += observation.rainfallAmount1hMm

    if (observation.observedAtEpochMs > current.observedAtEpochMs) {
      current.observedAtEpochMs = observation.observedAtEpochMs
      current.observedAtIso = observation.observedAtIso
      current.longitude = observation.longitude
      current.latitude = observation.latitude
      current.stationName = observation.stationName
    }
  }

  return Array.from(aggregatedByStation.values())
    .map((observation) => ({
      ...observation,
      rainfallAmountMm: Math.round(observation.rainfallAmountMm * 10) / 10,
    }))
    .sort((left, right) => left.stationName.localeCompare(right.stationName, 'fi'))
}
