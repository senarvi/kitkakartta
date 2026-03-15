# Kitkakartta

Kitkakartta is a web tool that visualizes weather observations on a map of Finland.

The application can show:
- Current temperature values at FMI measurement stations.
- Rainfall amount for the selected period (1, 12, or 24) hours at each location.
- Radar raster overlay that reflects the precipitation intensity during the same time period.

Data is fetched from the Finnish Meteorological Institute (FMI) Open Data API.

## Development

Install the dependencies:

```bash
npm install
```

Start a local development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

This repository is configured for GitHub Pages deployment using [GitHub Actions](.github/workflows/deploy-pages.yml).

Required GitHub repository settings:

1. Open `Settings -> Pages`.
2. Set `Source` to `GitHub Actions`.
3. Ensure the default branch is `main`.

Every push to `main` builds and deploys the `dist/` output.
