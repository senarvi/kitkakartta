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

### Temperature Data

For requesting latest station temperatures, we use the `fmi::observations::weather::multipointcoverage` stored query (Instantaneous Weather Observations):

*Real time weather observations from weather stations. Default set contains wind speed, direction, gust, temperature, relative humidity, dew point, pressure reduced to sea level, one hour precipitation amount, visibility and cloud cover. By default, the data is returned from last 12 hour. At least one location parameter (geoid/place/fmisid/wmo/bbox) has to be given. The data is returned as a multi point coverage format.*

#### Requesting last 12 hours for Helsinki

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::multipointcoverage&place=helsinki`

#### Fetching the latest observations

Parameters that need to be set:

- Limit results to Finland using `bbox=19,59,32,71` (lon,lat; EPSG:4326).
- Request air temperature with `parameters=t2m`.
- Set `timestep` to 10. This means that we get observations every 10 minutes, starting from the start of the hour.
- Set `starttime` to 15 minutes before the current time.

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::multipointcoverage&bbox=19,59,32,71&parameters=t2m&timestep=10&starttime=<starttime>`

The example response in [temperature_example.xml](temperature_example.xml) uses a smaller bounding box to make the XML easier to inspect. In `<gmlcov:MultiPointCoverage>`, `<gmlcov:positions>` is a whitespace-separated sequence of 3-tuples (`latitude longitude unixTime`). `<gml:doubleOrNilReasonTupleList>` is the observation value list, where each item maps to one position tuple (for this query, one `t2m` value per tuple). Depending on timing, a station may return one or two values. In the application logic, we keep only the newest value per station.

### Rainfall Data

Rainfall can be fetched either as station observations (point values) or as radar composites (grid coverage).

#### 1. Station rainfall observations (`fmi::observations::weather::multipointcoverage`)

For station-based values, use the same weather observation stored query as temperature and request the rainfall parameter `r_1h`.

Example (latest hourly rainfall amount from stations in Finland):

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::multipointcoverage&bbox=19,59,32,71&parameters=r_1h&timestep=10&starttime=<starttime>`

Notes:

- `r_1h` is recognized by this query.
- For 12h or 24h totals, request hourly rainfall (`r_1h`) over a wider time window and sum values per station in application logic.

Example request window for client-side 12h aggregation (hourly steps):

`https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::observations::weather::multipointcoverage&bbox=19,59,32,71&parameters=r_1h&timestep=60&starttime=<starttime>`

#### 2. Radar precipitation composites (`fmi::radar::composite::*`)

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

In practice:

- Use station `r_1h` when you need exact per-station values and labels.
- Use radar composites when you need continuous map coverage.
- A combined view (radar background + station labels) is the most informative.

