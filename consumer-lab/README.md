# Orbit — Consumer Intelligence Laboratory

Private browser-local consumer analysis, added alongside the repository's existing site without replacing it.

Dashboard: https://connornee-1.github.io/connors-repository/consumer-lab/

## Run

Node 22+: `npm ci`, `npm run dev`. Production: `npm run build`. Tests: `npm test`.

## Connect actual data

No personal data ships with the app. No sample profile is shown. No records persist after reload.

1. Open **Connect data** and download the test extension ZIP. Unzip it.
2. In Chrome open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the unzipped folder containing `manifest.json`.
3. Open the extension popup and click **Approve history access**. This triggers Chrome's optional history permission dialog. Installation and history permission require explicit user action.
4. Reload the dashboard. Choose 7, 30, or 90 days and click **Analyze approved history**.

This is an unpublished development extension, not a verified Chrome Web Store listing. Do not represent it as publicly installable from the Store. Managed Chrome installations may prohibit unpacked extensions. No extension installation was performed by the engineer.

Alternative: Data & privacy → drop/select voluntarily supplied JSON or CSV. Unzip Takeout / ChatGPT exports first. Supported: arrays, `Browser History`, `history`, `records`, `products`, or `conversations` arrays; CSV headers `url,title,time` (time optional). Google Takeout `time_usec` and ISO timestamps are supported. ChatGPT `conversations.json` mapping exports include user-role messages only, remove blockquotes and quoted strings, and label them statements rather than visits. Unmarked copied material cannot be reliably distinguished. Order imports use `kind: "order"`, `title`, `url`, and `time`; retailer-specific exports may require column conversion into this schema. Unsupported formats give an error, never a fabricated fallback.

Catalog schema: `name,url,category,price,image,capturedAt`. JSON or CSV. Price/image/timestamp are optional; a category or price/image field distinguishes catalogs from activity. Product URLs must be HTTP(S). A URL alone can be opened at its source but cannot supply invented product metadata. Price and availability are not independently verified. There is no retailer scraping service or live price API. Images contact the source only after an explicit load click.

## Methods and limitations

All analysis is local deterministic inference, not a trained language model. Taxonomy is in `src/engine.ts`. Category share = category records / all accepted records. Matching is case-insensitive keyword detection in supplied titles and sanitized URLs; first taxonomy match wins. Unclassified records remain in the denominator. Sensitive-keyword matches are omitted entirely; this is conservative but imperfect and is not a complete sensitive-content detector. No sensitive traits or segments are generated. Evidence is a signal, not purchase intent.

Networks cap display at 180 nodes and connect category hubs to websites, literal brand mentions, and user-supplied catalog candidates. Connected-component traversal detects structural communities; hover labels show component membership. Weighted links count supporting records; shared domains create cross-category links. Categories are explainable communities, not psychological identities. Each node exposes its records. Visit timestamps drive radial and weekly views. Missing timestamps are never invented, aggregate `visitCount` is never expanded into fake visits, and imports may overlap; source removal is available to avoid double counting repeated imports. Three proxy shopping tendencies require 20 visit records; other tendencies remain INSUFFICIENT DATA without appropriate purchase evidence. Category confidence is low at 3–9 matches, moderate at 10+; none is statistically calibrated.

Products require at least three matching category records. Match score = min(95, round(40 + 0.45 × category share percentage + min(10, matching records))). This is a heuristic alignment score, not probability. Negative feedback excludes a category from recommendations; uncertain feedback is displayed without boosting the score. Raw observations are preserved until deletion. No products, prices, ratings, or availability are generated.

## Privacy and security

Memory only, no localStorage/IndexedDB, analytics, remote AI API, or automatic product-image loads. URL query strings/fragments are stripped; credentials and non-HTTP(S) URLs rejected. Page titles and URL paths can still contain personal information. The public host receives ordinary asset requests. Only application assets, tests, and distribution material are committed. Never put actual imports in this repository. Tests use artificial fixtures only and are not displayed as a user's profile.

The extension has no standing `history` permission: it requests optional history access from a user gesture in its popup. Chrome warns about the API's full power (including modification), although this code only reads. Only a top-frame content script on the exact authorized origin/path can request history. Each period reads real `getVisits` timestamps, limited to 5,000 URLs / 100,000 visit records and flagged if truncated. No cookies, passwords, account contents, broad host permissions, or activeTab access. Revocation blocks future reads; remove already transferred records in the dashboard or reload. Delete all also invalidates pending app imports/responses.

## Deployment

The repository workflow builds the existing root application, then builds this app into root `dist/consumer-lab`, and deploys the combined artifact to GitHub Pages. Original content remains at its existing routes. `base` is `/connors-repository/consumer-lab/`.

## Extension distribution

Run `python3 scripts/package-extension.py` after extension edits and before build. See `STORE-READINESS.md` and `PRIVACY.md`. ZIP is downloaded from the dashboard, with no fabricated Store link.
