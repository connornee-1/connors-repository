import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
let handler: any;
let granted = false;
let searches = 0;
(globalThis as any).chrome = {
  runtime: { id: "test", onMessage: { addListener: () => {} } },
  permissions: {
    contains: async () => granted,
    remove: async () => {
      granted = false;
    },
  },
  history: {
    search: async () => {
      searches++;
      return [
        { url: "https://example.com/laptop?secret=1", title: "Fixture laptop" },
      ];
    },
    getVisits: async () => [{ visitTime: Date.now() - 1000 }, { visitTime: 1 }],
  },
};
test("extension sender, approval, period, per-visit filtering and revocation boundaries", async () => {
  const mod = await import("../extension/worker.js");
  handler = mod.handle;
  const sender = {
    id: "test",
    url: "https://connornee-1.github.io/connors-repository/consumer-lab/",
    frameId: 0,
  };
  assert.match(
    (
      await handler(
        { type: "HISTORY", days: 7 },
        { ...sender, url: "https://evil.example/" },
      )
    ).error,
    /Unauthorized/,
  );
  assert.match(
    (await handler({ type: "HISTORY", days: 7 }, { ...sender, frameId: 1 }))
      .error,
    /Unauthorized/,
  );
  assert.match(
    (await handler({ type: "HISTORY", days: 7 }, sender)).error,
    /approve/,
  );
  assert.equal(searches, 0);
  granted = true;
  assert.match(
    (await handler({ type: "HISTORY", days: 100 }, sender)).error,
    /Invalid/,
  );
  const r = await handler({ type: "HISTORY", days: 7 }, sender);
  assert.equal(r.records.length, 1);
  assert.equal(r.records[0].url, "https://example.com/laptop");
  assert.equal((await handler({ type: "REVOKE" }, sender)).type, "REVOKED");
  assert.equal(granted, false);
});
test("manifest grants no standing history or broad site permissions", () => {
  const m = JSON.parse(
    fs.readFileSync(
      new URL("../extension/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(m.optional_permissions, ["history"]);
  assert.equal(m.permissions, undefined);
  assert.equal(m.host_permissions, undefined);
  assert.deepEqual(m.content_scripts[0].matches, [
    "https://connornee-1.github.io/connors-repository/consumer-lab/*",
  ]);
});
