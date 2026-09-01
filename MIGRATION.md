# Migrating Off ArcGIS Online: PostGIS + Custom Backend

## Status of the trigger for this doc

This plan was requested on the premise that ArcGIS Online is changing licensing to require every viewer — not just editors — to have their own named Esri account. **I searched Esri's own documentation and blog and could not confirm that.** What I *did* confirm:

- Legacy Esri Developer API keys (basemaps/geocoding/routing via `developers.arcgis.com`) retire June 2026 — doesn't apply here, this app uses no API key today.
- Esri has been moving ArcGIS Pro and other desktop seats from concurrent-use to Named User licensing — this is about **the client's own Pro editing seat**, not public viewers.
- "Allow anonymous access to your organization" is still a live, documented ArcGIS Online setting with no retirement notice.

Get the actual source from the client (a link, an email from his Esri rep) before treating this as confirmed — "my Pro license needs to be Named User" and "every one of my public viewers needs an Esri account" are very different problems, and only one of them justifies this migration. That said, everything below is worth doing on cost/vendor-independence grounds regardless of which one it turns out to be.

## Current architecture (what this app actually depends on today)

Traced directly from `desktop/scripts.js` / `mobile/mobile.js`:

- **`esri/WebMap`** loaded via `portalItem: { id: configVars.webmapId }` — one hosted WebMap item per town, each baking in its own basemap/imagery layers. Basemap sourcing is invisible to this repo; it lives entirely in each WebMap item on ArcGIS Online and needs auditing town-by-town if basemaps are also leaving Esri.
- **Three hosted Feature Services per town**, referenced by config keys `masterTable`, `condoLayer`, `noCondoLayer` (see `README.md`'s "Backend ArcGIS service requirements" section for the full 39-field schema traced from the code). `masterTable` is queried as a plain attribute table (`returnGeometry: false`); `condoLayer`/`noCondoLayer` are the spatial layers.
- **`esri/widgets/Print`** — instantiated with no explicit `printServiceUrl`. That means it's using the *default* export-web-map print service tied to the portal context, which is an ArcGIS Online/Enterprise-hosted service consuming credits. This is a hidden Esri dependency that a full migration must explicitly replace or keep.
- **`esri/widgets/Locate`, `esri/widgets/BasemapLayerList`, `esri/widgets/Bookmarks`, `esri/widgets/Legend`, `esri/widgets/DistanceMeasurement2D`, `esri/widgets/AreaMeasurement2D`, `esri/Sketch`** — all client-side only, no service dependency beyond the WebMap's own layers. These can stay as-is.
- **19+ towns, one shared codebase, one AGOL org** — the client edits in ArcGIS Pro and publishes to hosted feature layers your app queries directly by URL, per the per-town JSON config system.

## What actually needs to move vs. what can stay

| Piece | Verdict |
| --- | --- |
| Parcel attribute/geometry data (`masterTable`, `condoLayer`, `noCondoLayer`) | **Move** — this is the actual target of the migration: your data, off Esri's hosting. |
| ArcGIS Maps SDK for JavaScript (client library) | **Keep** — you already said this, and it's the right call. `MapView`, `GraphicsLayer`, `Sketch`, the measurement/legend/bookmarks widgets, and `Graphic` rendering all work with zero dependency on ArcGIS Online once they're not pointed at hosted services. |
| Basemap/imagery | **Audit, decide separately.** Needs its own inventory (see below) — it's a separable decision from the parcel-data migration. |
| Print/export | **Needs a replacement decision** — see the Print section below. It's currently a hidden AGOL dependency. |
| Client's Pro editing workflow | **Recommend: keep unchanged, at least for phase 1.** See sync pipeline below. |

## Proposed target architecture

A hybrid, not one-size-fits-all, because the app has two genuinely different data-access patterns:

1. **The always-visible parcel boundary layer** (every parcel outline drawn on the map at the current viewport) — this wants to be **vector tiles**. Generate them from PostGIS at publish time (`pg_tileserv`, or a build step with `ogr2ogr`/`tippecanoe`), serve as static `.pbf` tiles, and render with `esri/layers/VectorTileLayer`. This scales regardless of how many parcels a town has and requires no live backend query per pan/zoom.
   - *Simpler fallback if per-town parcel counts are modest* (check actual counts — CT towns here are mostly small, likely low thousands of parcels): `esri/layers/GeoJSONLayer` pointed at a static GeoJSON file per town, regenerated on each data sync. Less infrastructure than tiles, works fine until a town's dataset gets large enough that a multi-MB GeoJSON download becomes a real problem.
2. **Ad hoc attribute/spatial queries** (search, suggestions, click-select, buffer/abutters, numeric-range filters) — this wants a **purpose-built REST API**, not an attempt to replicate Esri's REST Feature Service query protocol. Replicating that protocol (WHERE-clause parsing, spatial relationship operators, Esri JSON, pagination tokens) is a real, nontrivial engineering project on its own — not worth it just to keep `FeatureLayer.queryFeatures()` calls unchanged. Build your own endpoints instead and change the call sites (cataloged below).

This keeps the rewrite scoped to *query call sites*, not the whole rendering pipeline — `addPolygons()` and friends already build `Graphic` objects manually from query results rather than relying on `FeatureLayer`'s automatic rendering, so a good chunk of the existing rendering code barely changes.

## PostGIS data model

One shared schema is simpler to operate than 19+ per-town databases, given this is already a single-codebase multi-tenant app:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for fast LIKE '%term%' search

CREATE TABLE parcels (
  id            bigserial PRIMARY KEY,
  town          text NOT NULL,          -- e.g. 'washingtonct' - matches existing config naming
  gis_link      text NOT NULL,          -- PRIMARY JOIN KEY - see README's field reference
  uniqueid      text,
  objectid      integer,
  owner         text,
  co_owner      text,
  location      text,
  street_name   text,
  mbl           text,
  mailing_address_1 text,
  mailing_address_2 text,
  mailing_city  text,
  mail_state    text,
  mailing_zip   text,
  parcel_type   text,
  parcel_primary_use text,
  building_use_code  text,
  building_type text,
  design_type   text,
  zoning        text,
  neighborhood  text,
  total_acres   numeric,
  land_type     text,
  land_type_rate text,
  influence_type text,
  influence_factor numeric,
  functional_obs text,
  external_obs  text,
  assessed_total numeric,
  appraised_total numeric,
  prior_assessed_total numeric,
  prior_appraised_total numeric,
  prior_assessment_year integer,
  sale_date     date,
  sale_price    numeric,
  vol_page      text,
  image_path    text,
  acctnum       text,
  map           text,
  lat           double precision,
  lon           double precision,
  match_status  text,
  account_type  text,
  is_condo      boolean NOT NULL DEFAULT false,   -- replaces separate condoLayer/noCondoLayer services
  geom          geometry(MultiPolygon, 4326),     -- confirm actual source SRID before assuming 4326
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX parcels_geom_gix ON parcels USING GIST (geom);
CREATE INDEX parcels_town_gis_link_idx ON parcels (town, gis_link);
CREATE INDEX parcels_owner_trgm_idx ON parcels USING GIN (owner gin_trgm_ops);
CREATE INDEX parcels_location_trgm_idx ON parcels USING GIN (location gin_trgm_ops);
CREATE INDEX parcels_co_owner_trgm_idx ON parcels USING GIN (co_owner gin_trgm_ops);
CREATE INDEX parcels_mbl_trgm_idx ON parcels USING GIN (mbl gin_trgm_ops);
```

Notes:
- **Confirm the real SRID** from the AGOL service metadata before building this — don't assume WGS84 (4326). CT data is commonly in a State Plane projection; you'll want to store in the native SRID and let the API/client handle reprojection, or standardize on 4326 at ingest time.
- The `pg_trgm` GIN indexes are what make the app's existing `WHERE Owner LIKE '%searchTerm%'`-style fuzzy search fast at scale — a plain B-tree index doesn't help leading-wildcard `LIKE` queries.
- `is_condo` replaces the current `condoLayer`/`noCondoLayer` service-pair split with a single filterable column — simpler than maintaining two physical tables per town.

## Data sync pipeline: don't change the client's workflow (yet)

The client keeps editing in ArcGIS Pro and publishing to AGOL exactly as he does now. Add a scheduled job (Python, using either the `arcgis` Python API or plain authenticated REST calls) that pulls the latest features from his hosted layers and upserts into PostGIS — matching the "CAMA update nightly" cadence already promised in the app's own disclaimer text (`parcelUpdateDate`/`showParcelUpdateDate` config keys).

This is deliberately the lowest-disruption option:
- Zero workflow change for the client.
- The **public app** stops depending on AGOL entirely (queries hit your PostGIS-backed API instead) — which is the part that matters if the "every viewer needs an account" concern is real.
- His own Pro/AGOL setup still needs *his own* Esri license, which is unavoidable if he wants to keep using Pro — but that's one named account, not "every town resident."

Alternative (not recommended for phase 1): have him edit directly against PostGIS via Pro's enterprise geodatabase connection or QGIS. Bigger workflow change, and depending on how you want edit versioning/conflict handling to work, this can reintroduce Esri licensing anyway (ArcGIS Enterprise for a managed geodatabase). Revisit this only after the AGOL-as-staging pipeline has proven itself.

## Backend API design

FastAPI is a good fit — async, automatic OpenAPI docs (useful since you'll want to document this for whoever else touches it later), and solid PostGIS support via `GeoAlchemy2` or raw `asyncpg` + `ST_AsGeoJSON`. Return GeoJSON `FeatureCollection`s everywhere so the frontend can feed results straight into `Graphic`/`GeoJSONLayer` without a translation layer.

Sketch of the endpoints needed to cover what the app does today (mapped to the existing query call sites cataloged in the README):

| Endpoint | Replaces |
| --- | --- |
| `GET /api/{town}/parcels/suggest?q=...` | The grouped-by-field suggestions query (`Street_Name`/`MBL`/`Location`/`Co_Owner`/`Uniqueid`/`Owner`/`GIS_LINK` `LIKE` search) — return results already grouped by field to match the UI you just built. |
| `GET /api/{town}/parcels/search?q=...` | The full results-list query (`queryRelatedFeatureRecords`/`runQuery`). |
| `GET /api/{town}/parcels/{gis_link}` | Single-parcel detail lookup (`clickDetailsPanel`, click-to-select `handleClick`/`handleDetailsClick`). |
| `POST /api/{town}/parcels/within` `{geometry, distance, units}` | Buffer/abutters query (`queryAttDetailsBuffer`) — do the geodesic buffer server-side with `ST_Buffer`/`ST_DWithin` on geography, or accept a pre-computed buffer polygon from the client (matches current client-side `geometryEngineAsync.geodesicBuffer()` usage) and just do the `ST_Intersects` filter server-side. |
| `GET /api/{town}/parcels/filter?field=...&min=...&max=...` | Numeric range filters (Assessed/Appraised Total, Total Acres, Sale Date/Price). |
| `GET /api/{town}/tiles/{z}/{x}/{y}.pbf` (if going the vector-tile route) | The always-on parcel boundary layer. |

Every endpoint takes `town` as a path segment so the multi-tenant model stays intact — no per-town database/service duplication needed, just a `WHERE town = $1` on every query.

## Frontend changes required

The rendering side changes less than you'd expect, because a lot of it (`addPolygons`, `buildResultRow`, etc.) already manually constructs `Graphic` objects from query results rather than relying on live `FeatureLayer` auto-rendering. The actual rewrite surface is the **query-triggering code**:

- `noCondosLayer`/`CondosLayer`/`CondosTable`/`noCondosTable` — these `new FeatureLayer({ url: ... })` instantiations go away for query purposes. The base parcel boundary layer becomes a `VectorTileLayer`/`GeoJSONLayer` instead; the table becomes nothing (just an API base URL).
- Every `X.queryFeatures(query)` call (the 15+ sites already cataloged when we centralized `enableSelectClick`/`enableDetailsClick`, plus the suggestions/search/abutters/filter code) becomes a `fetch(apiUrl).then(r => r.json())` call against your API, feeding the same downstream `processFeatures`/`buildResultRow`/`highlightAbuttingParcels` functions that already exist.
- Click-to-select (`handleClick`/`handleDetailsClick`) currently does `layer.queryFeatures()` with the click point as the query geometry — becomes a `POST` to `/api/{town}/parcels/within` with a tiny buffer around the click point, or a dedicated point-in-polygon endpoint.
- Per-town config (`masterTable`, `condoLayer`, `noCondoLayer` keys) becomes a single `apiBaseUrl` + `town` slug per config file — actually *simplifies* the JSON config schema.

## Authentication & access control

Recommendation: **the public viewer stays fully anonymous, same as today.** That's the entire point if the AGOL concern turns out to be real — town residents shouldn't need an account with you any more than they need one with Esri. Put the "login" you mentioned wanting to build somewhere else:

- A small **admin/ops interface** for managing the sync pipeline (trigger a manual re-sync, see last-sync status per town, spot-check data) — this is a reasonable thing to gate with real auth, and it's for you/the client, not the public.
- If abuse/scraping of the public API becomes a concern, handle it with rate-limiting and CORS restrictions rather than user accounts — keeps the "no login" promise intact for legitimate users.

If there's a reason the public API itself needs gating (something not yet mentioned), that changes this section significantly — worth confirming before building anything.

## Print/export replacement

`esri/widgets/Print` with no explicit `printServiceUrl` is currently riding on a default AGOL/Enterprise-hosted print service — a real, easy-to-miss Esri dependency. Options once you're off AGOL:
- Self-host an ArcGIS Server / Enterprise print service — reintroduces a (smaller, self-hosted) Esri dependency, likely not what you want if the goal is getting off Esri.
- Replace with a client-side "poor man's print": `view.takeScreenshot()` (built into the JS SDK, no service required) + a library like `jsPDF` to lay out the title/logo/scale bar/disclaimer you already generate for the custom print path. This matches what the app already does for its custom high-res export per the README, so there's a real chance most of this exists already — worth checking the existing custom print flow's implementation before assuming a rewrite is needed here.

## Basemap/imagery sourcing

Not resolved by this doc — it depends on what's actually configured in each town's WebMap item on AGOL, which isn't visible from this repo. Needs a separate inventory pass: for each of the 19+ towns, open the WebMap in AGOL and note whether its basemap is an Esri-hosted service (World Imagery, Streets, etc. — metered, needs an API key or org login going forward) or the client's own hosted imagery. If it's the former, decide separately whether to keep paying Esri just for basemap tiles (a much smaller commitment than hosting all parcel data there) or replace with an open alternative (self-hosted orthoimagery if the client already has it, or a provider like MapTiler/Stadia Maps for street basemaps).

## Suggested rollout

Not a big-bang cutover:

1. **Phase 1 — build in parallel, no user-facing change.** Stand up PostGIS, the sync pipeline, and the read-only API alongside the existing AGOL setup. Validate data parity (row counts, spot-check field values, confirm `GIS_LINK` join integrity) before anything touches the live app.
2. **Phase 2 — one pilot town.** Pick a small town, point its config at the new API, run it in parallel with the AGOL version (different URL) so you can compare side-by-side before it's the only option.
3. **Phase 3 — roll out town-by-town.** Lower risk than converting all 19+ at once; each town's config is already isolated, so this fits the existing architecture.
4. **Phase 4 — decommission.** Drop the AGOL hosted feature services once every town is migrated and stable. Keep or drop AGOL/Esri account access entirely depending on what the basemap-sourcing decision above lands on.

## Open questions to resolve before starting

- Get the actual source for the licensing claim from the client.
- Confirm the real SRID of the source parcel geometry.
- Get actual per-town parcel counts (decides vector tiles vs. plain GeoJSON).
- Inventory each town's WebMap basemap/imagery source.
- Confirm whether the app's existing custom print/export path already avoids the default Esri print service, or genuinely depends on it.
- Decide who owns/hosts the new Python backend and PostGIS instance (infra, backups, uptime expectations for something serving 19+ towns publicly).
