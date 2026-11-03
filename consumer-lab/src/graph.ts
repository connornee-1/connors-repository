import type { RecordItem, Product } from "./engine";
export type GraphNode = {
  id: string;
  label: string;
  category: string;
  weight: number;
  records: RecordItem[];
  hub?: boolean;
  kind: string;
  community?: number;
};
export type GraphLink = { source: string; target: string; weight: number };
const brandRules: Record<string, RegExp> = {
  Apple: /\bapple\b|apple\.com/i,
  Nike: /\bnike\b|nike\.com/i,
  Adidas: /\badidas\b/i,
  Samsung: /\bsamsung\b/i,
  Sony: /\bsony\b/i,
  IKEA: /\bikea\b/i,
  Patagonia: /\bpatagonia\b/i,
  LEGO: /\blego\b/i,
};
export function buildGraph(records: RecordItem[], products: Product[] = []) {
  const map = new Map<string, GraphNode>(),
    edgeMap = new Map<string, GraphLink>();
  const recordIds = new Map<string, Set<string>>();
  function add(
    id: string,
    label: string,
    category: string,
    r: RecordItem[],
    kind: string,
    hub = false,
  ) {
    const old = map.get(id);
    if (old) {
      const ids = recordIds.get(id)!;
      for (const row of r)
        if (!ids.has(row.id)) {
          old.records.push(row);
          ids.add(row.id);
        }
      old.weight = old.records.length;
      return;
    }
    recordIds.set(id, new Set(r.map((x) => x.id)));
    map.set(id, {
      id,
      label,
      category,
      records: [...r],
      weight: r.length,
      kind,
      hub,
    });
  }
  function edge(source: string, target: string, weight = 1) {
    const key = source + "→" + target;
    const old = edgeMap.get(key);
    if (old) old.weight += weight;
    else edgeMap.set(key, { source, target, weight });
  }
  for (const r of records) {
    if (r.category === "Unclassified" || r.category === "Excluded") continue;
    const cat = r.category,
      site = "site:" + r.domain;
    add(cat, cat, cat, [r], "interest", true);
    add(
      site,
      r.domain,
      cat,
      [r],
      r.kind === "statement" ? "user statement" : "website",
    );
    edge(cat, site);
    for (const [brand, pattern] of Object.entries(brandRules)) {
      if (!pattern.test(r.title + " " + r.url)) continue;
      const id = "brand:" + brand;
      add(id, brand, cat, [r], "brand mention");
      edge(site, id);
      edge(cat, id);
    }
  }
  for (const p of products) {
    const rows = map.get(p.category)?.records || [];
    if (rows.length < 3) continue;
    const id = "product:" + p.id;
    add(
      id,
      p.name,
      p.category,
      rows,
      "catalog candidate · category association",
    );
    edge(p.category, id, rows.length);
  }
  const nodes = [...map.values()]
    .sort((a, b) => Number(b.hub) - Number(a.hub) || b.weight - a.weight)
    .slice(0, 180);
  const ids = new Set(nodes.map((n) => n.id));
  const links = [...edgeMap.values()].filter(
    (l) => ids.has(l.source) && ids.has(l.target),
  );
  // Detect structural communities as connected components by breadth-first traversal.
  // These are topology groups, distinct from the explicitly labeled keyword taxonomy.
  const adjacency = new Map(nodes.map((n) => [n.id, [] as string[]]));
  for (const l of links) {
    adjacency.get(l.source)!.push(l.target);
    adjacency.get(l.target)!.push(l.source);
  }
  let count = 0;
  const seen = new Set<string>();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    if (seen.has(n.id)) continue;
    const queue = [n.id];
    seen.add(n.id);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      byId.get(id)!.community = count;
      for (const next of adjacency.get(id)!) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    count++;
  }
  return { nodes, links, communities: count };
}
