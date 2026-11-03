# Verification record

- Root repository TypeScript check and production build: passed; existing application preserved.
- Laboratory TypeScript check and Vite production build: passed.
- Automated tests: eight passing, covering JSON/CSV/Takeout parsing, user-only ChatGPT imports, quote removal, timestamps, URL sanitization, sensitive keyword exclusion, absent metadata, evidence thresholds, negative feedback, graph topology/brand evidence/node cap, extension sender/path/frame validation, optional permission gating, period validation, real-visit filtering, and revocation.
- Network stress fixture: 10,000 synthetic distinct domains, capped at 180 visible nodes. Records are retained for evidence; counting uses maps and sets rather than repeated full scans.
- Browser checks: all nine sections navigate; empty dashboard, consent dialog, mobile layout at 390×844, light/dark modes, multi-file import (32 labeled synthetic records and one synthetic product), graph-node evidence, individual record deletion (8 → 7), recommendation score/explanation, negative preference feedback removing the recommendation, and delete-all returning to zero records/products passed. No real user records supplied or accessed.
- Dependency audits: zero reported vulnerabilities in root and laboratory after Vite update.
- Extension tests use mocked Chrome APIs. No real unpacked extension installation, native Chrome permission dialog, or real history transfer has been performed without the user's separate approval.
- Chrome Web Store review, live product price verification and arbitrary retailer scraping are not claimed.

Synthetic QA files remain outside the repository and are never bundled into the public app. Reload clears all browser test data. Check the deployment workflow for live GitHub Pages status.
