function getElementsByLocalName(node, localName) {
  return Array.from(node.getElementsByTagNameNS('*', localName))
}

function getTextContent(element) {
  return element?.textContent?.trim() ?? ''
}

export function parseRadarCompositeMetadataXml(xmlText) {
  const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const parserErrorNode = xmlDoc.querySelector('parsererror')

  if (parserErrorNode) {
    throw new Error('Failed to parse FMI radar XML response')
  }

  const resultTimeNode = getElementsByLocalName(xmlDoc, 'resultTime')[0] ?? null
  const timePositionNode = resultTimeNode
    ? getElementsByLocalName(resultTimeNode, 'timePosition')[0] ?? null
    : null

  const resultTimeIso = getTextContent(timePositionNode)

  if (!resultTimeIso) {
    throw new Error('Missing result time in FMI radar response')
  }

  return {
    resultTimeIso,
  }
}
