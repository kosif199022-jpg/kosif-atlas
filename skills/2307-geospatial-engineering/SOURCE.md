# geospatial-engineering

Geospatial / GIS engineering team — agents. The geospatial-data-engineer owns spatial data modeling and storage (PostGIS, GiST/SP-GiST indexes, SRID/projection hygiene — EPSG:4326 vs 3857, geometry vs geography), spatial SQL and analysis (ST_ functions, joins, nearest-neighbor, buffers), spatial data quality (validity, validate-at-load), and pipelines (GDAL/OGR, geocoding, routing like OSRM/Valhalla). The mapping-visualization-engineer owns serving and visualization (vector tiles/MVT, pg_tileserv/Martin/Tegola, MapLibre/Mapbox GL styling, the GeoJSON-vs-vector-tile tradeoff). skills, projection + storage/serving decision trees, a dated 2026 stack reference, templates, best-practices, an advisory hook (checks). Seams: warehouse/ELT → data-platform; OLTP → database-engineering; map UI → frontend-engineering. Requires ravenclaude-core@>=0.7.0.

- License: **MIT** (no license file shipped; see the source repository)
- Source: https://github.com/mcorbett51090/ravenclaude/tree/300e672ec81d25d7d6a07345aa7783f7c89d5db7/plugins/geospatial-engineering
- Commit: `300e672ec81d25d7d6a07345aa7783f7c89d5db7`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 1, MCP servers: 0, scripts: 1). Read the scripts before running anything.

Unofficial mirror of the skill text for reference. All rights remain with the original authors under the license above.
