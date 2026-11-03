# Chrome Web Store submission preparation

Status: source and test ZIP prepared; NOT submitted, approved, or listed.

Name: Orbit · Local History Connector
Single purpose: Let a consenting user transfer a selected period of their own Chrome history into the Orbit dashboard for private, explainable consumer-behavior analysis.

Short description: Transfer history you explicitly approve into Orbit. Analyze locally, inspect evidence, and revoke access at any time.

Permission justification: optional `history` is necessary to read real URLs and per-visit timestamps in a user-selected period. Requested only by an explicit popup click. No background collection, no modification, no remote upload. No standing history permission or other API permissions. Static content-script match is limited to `https://connornee-1.github.io/connors-repository/consumer-lab/*`. Worker independently validates extension ID, top frame, exact origin and path.

Data handling declarations: browsing history and website content (page titles) are handled locally. No data sale, advertising, creditworthiness, data brokerage, third-party AI transfer, or developer collection. No remote code. No persistent raw data storage. The publisher must review the current Store form carefully and disclose local handling accurately; do not equate “no developer collection” with “does not process browsing history.”

Included assets: manifest, service worker, bridge, popup, and 16/48/128 PNG icons. Package with `python3 scripts/package-extension.py`; `public/orbit-extension.zip` can be loaded unpacked after extraction.

Before submission:
- Set a real publisher support contact and maintain the public privacy policy (PRIVACY.md content must be hosted at a stable public URL).
- Capture Store-required promotional screenshots from the final app using consented or clearly labeled test-only data. Never publish personal history in screenshots.
- Perform real Chrome unpacked installation, declined/granted/revoked permission tests, period selection, and unauthorized-origin tests. Automated mocks are not real Chrome testing.
- Complete current Chrome Web Store developer registration, any applicable fee and terms, privacy declarations, and review submission as publisher. These external approvals are not automated here.
- Add an Install Extension button only after a verified approved listing exists. Keep the temporary unpacked workflow until then.

Store review and managed-browser policies may affect distribution. No Store URL is fabricated in code or documentation.
