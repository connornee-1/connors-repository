import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseImport,
  normalize,
  analyze,
  recommendationScore,
  safeUrl,
  timestamp,
} from "../src/engine";
test("normalization strips credentials, query tokens, fragments and rejects sensitive records", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("https://user:pass@example.com"), "");
  assert.equal(
    safeUrl("https://example.com/product?token=private#secret"),
    "https://example.com/product",
  );
  const r = normalize(
    [
      { url: "https://example.com", title: "Cancer diagnosis" },
      { url: "https://example.com", title: "Laptop", visitCount: 900 },
    ],
    "fixture",
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].category, "Technology");
  assert.equal(analyze(r).visits.length, 1);
});
test("ChatGPT imports use user text, excluding assistant and explicit quotations", () => {
  const data = [
    {
      mapping: {
        a: {
          message: {
            author: { role: "assistant" },
            content: { parts: ["I love fashion"] },
          },
        },
        b: {
          message: {
            author: { role: "user" },
            content: { parts: ['> sneaker\nI use software "clothing"'] },
            create_time: 1700000000,
          },
        },
      },
    },
  ];
  const r = parseImport(JSON.stringify(data), "conversations.json");
  assert.equal(r.records.length, 1);
  assert.equal(r.records[0].kind, "statement");
  assert.equal(r.records[0].category, "Technology");
  assert.equal(analyze(r.records).visits.length, 0);
  assert.ok(!r.records[0].title.includes("sneaker"));
});
test("Takeout timestamps and CSV quoted commas parse without inventing visits", () => {
  const r = parseImport(
    JSON.stringify({
      "Browser History": [
        { url: "https://example.com/laptop", time_usec: 1700000000000000 },
      ],
    }),
    "history.json",
  );
  assert.equal(r.records[0].time, 1700000000000);
  const c = parseImport(
    'url,title\nhttps://example.com,"Laptop, camera"',
    "history.csv",
  );
  assert.equal(c.records[0].title, "Laptop, camera");
  assert.equal(timestamp("bad"), null);
  assert.throws(() => parseImport("{}", "bad.json"));
});
test("recommendations require evidence, honor negative feedback, and never invent metadata", () => {
  const p = {
    id: "p",
    name: "Fixture laptop",
    url: "https://example.com/product",
    category: "Technology",
  };
  const rows = normalize(
    Array.from({ length: 3 }, () => ({ url: "https://example.com/laptop" })),
    "fixture",
  );
  assert.equal(recommendationScore(p, analyze(rows.slice(0, 2)).groups), null);
  assert.ok(recommendationScore(p, analyze(rows).groups)! >= 40);
  assert.equal(
    recommendationScore(p, analyze(rows, { Technology: "inaccurate" }).groups),
    null,
  );
  assert.equal(
    parseImport(
      JSON.stringify([
        { name: "Fixture laptop", url: p.url, category: "Technology" },
      ]),
      "products.json",
    ).products[0].price,
    undefined,
  );
});
test("malformed rows and missing dates remain safe", () => {
  assert.equal(normalize([null, 42, {}], "fixture").length, 0);
  const r = normalize([{ title: "software" }], "fixture");
  assert.equal(r[0].time, null);
  assert.equal(analyze(r).dated.length, 0);
});

test("graph detects evidence communities, brand mentions, catalog associations and limits display", async () => {
  const { buildGraph } = await import("../src/graph");
  const rows = normalize(
    [
      { url: "https://apple.com/laptop", title: "Apple laptop" },
      { url: "https://nike.com/sneaker", title: "Nike sneaker" },
    ],
    "fixture",
  );
  const graph = buildGraph(rows);
  assert.equal(graph.communities, 2);
  assert.ok(
    graph.nodes.some((n) => n.label === "Apple" && n.kind === "brand mention"),
  );
  assert.ok(
    graph.links.every(
      (e) =>
        graph.nodes.some((n) => n.id === e.source) &&
        graph.nodes.some((n) => n.id === e.target),
    ),
  );
  const many = normalize(
    Array.from({ length: 10000 }, (_, i) => ({
      url: `https://fixture-${i}.example/laptop`,
    })),
    "fixture",
  );
  const large = buildGraph(many);
  assert.equal(large.nodes.length, 180);
  assert.equal(large.communities, 1);
});
