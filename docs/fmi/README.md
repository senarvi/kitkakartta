## WFS

FMI Open Data WFS service implements the Simple WFS conformance class of the WFS 2.0 specification. The service uses stored queries to select features, areas and times. Stored queries are named and parametrized queries to be used with GetFeature operation.

Useful links:
- FMI Open Data portal: <https://en.ilmatieteenlaitos.fi/open-data>
- FMI Open Data WFS examples and docs: <https://en.ilmatieteenlaitos.fi/open-data-manual-wfs-examples-and-guidelines>

#### Base endpoint

`https://opendata.fmi.fi/wfs`

#### Requesting a [list of stored queries](stored_queries.xml)

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=listStoredQueries`

#### Requesting a [description of stored queries](stored_query_descriptions.xml)

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=describeStoredQueries`

### Weather Observations

For requesting latest station temperatures, we use the `fmi::observations::weather::multipointcoverage` stored query (Instantaneous Weather Observations):

*Real time weather observations from weather stations. Default set contains wind speed, direction, gust, temperature, relative humidity, dew point, pressure reduced to sea level, one hour precipitation amount, visibility and cloud cover. By default, the data is returned from last 12 hour. At least one location parameter (geoid/place/fmisid/wmo/bbox) has to be given. The data is returned as a multi point coverage format.*

#### Requesting last 12 hours for Helsinki

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::multipointcoverage&place=helsinki`

#### Fetching the temperature, rainfall, and relative humidity observations

Parameters that need to be set:

- Limit results to Finland using `bbox=19,59,32,71` (lon,lat; EPSG:4326).
- Request air temperature, hourly rainfall, and relative humidity with `parameters=t2m,r_1h,rh`.
- Set `timestep` to 10. This means that we get observations every 10 minutes, starting from the start of the hour.
- Set `starttime` to 15 minutes before the current time.

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::multipointcoverage&bbox=19,59,32,71&parameters=t2m,r_1h,rh&timestep=10&starttime=<starttime>`

The example response in [weather_example.xml](weather_example.xml) uses a smaller bounding box to make the XML easier to inspect. In `<gmlcov:MultiPointCoverage>`, `<gmlcov:positions>` is a whitespace-separated sequence of 3-tuples (`latitude longitude unixTime`). `<gml:doubleOrNilReasonTupleList>` is the observation value list, where each item maps to one position tuple. With `parameters=t2m,r_1h,rh`, each tuple has three values in that order: temperature first, hourly rainfall second, and relative humidity third.

For each station, we show the last observed temperature. For 12h or 24h total rainfall, we must request hourly rainfall (`r_1h`) over the time window and sum values per station. For relative humidity, we take the average over the time window.

### Rainfall Radar Data

For area-wide rainfall visualization, FMI provides radar composites as `GridSeriesObservation`.

- Precipitation rate: `fmi::radar::composite::rr`
- Precipitation amount 1h: `fmi::radar::composite::rr1h`
- Precipitation amount 12h: `fmi::radar::composite::rr12h`
- Precipitation amount 24h: `fmi::radar::composite::rr24h`

Examples:

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::radar::composite::rr&bbox=19,59,32,71,epsg::4326&starttime=<starttime>&endtime=<endtime>`

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::radar::composite::rr1h&bbox=19,59,32,71,epsg::4326&starttime=<starttime>&endtime=<endtime>`

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::radar::composite::rr12h&bbox=19,59,32,71,epsg::4326&starttime=<starttime>&endtime=<endtime>`

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::radar::composite::rr24h&bbox=19,59,32,71,epsg::4326&starttime=<starttime>&endtime=<endtime>`
