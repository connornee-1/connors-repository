import Papa from "papaparse";
export type RecordItem = {
  id: string;
  url: string;
  title: string;
  time: number | null;
  source: string;
  kind: "visit" | "statement" | "order";
  category: string;
  domain: string;
};
export type Product = {
  id: string;
  name: string;
  url: string;
  category: string;
  price?: string;
  image?: string;
  capturedAt?: string;
};
export const taxonomy: Record<string, string[]> = {
  Technology: [
    "computer",
    "laptop",
    "software",
    "camera",
    "headphone",
    "electronics",
    "github",
    "bestbuy",
  ],
  Style: [
    "clothing",
    "sneaker",
    "apparel",
    "fashion",
    "nike",
    "adidas",
    "uniqlo",
  ],
  Home: ["furniture", "decor", "kitchen", "ikea", "wayfair"],
  Outdoors: ["camping", "hiking", "outdoor", "bicycle", "cycling", "rei.com"],
  Entertainment: ["gaming", "game", "music", "movie", "steam", "spotify"],
  Food: ["recipe", "restaurant", "cooking", "coffee", "food"],
  Travel: ["hotel", "flight", "travel", "airbnb", "booking.com"],
  Learning: ["course", "tutorial", "education", "learning", "udemy"],
};
const sensitive =
  /\b(health|medical|cancer|diabetes|therapy|religion|church|mosque|politic|democrat|republican|sexual|gay|lesbian|pregnan|prescription|diagnos|mental|suicide|porn)\w*/i;
export function category(text: string) {
  if (sensitive.test(text)) return "Excluded";
  return (
    Object.entries(taxonomy).find(([, words]) =>
      words.some((w) => text.toLowerCase().includes(w)),
    )?.[0] || "Unclassified"
  );
}
export function safeUrl(raw: unknown) {
  try {
    const u = new URL(String(raw));
    if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
      return "";
    u.search = "";
    u.hash = "";
    return u.href;
  } catch {
    return "";
  }
}
export function timestamp(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string" && /^\d+(\.\d+)?$/.test(v)
        ? Number(v)
        : NaN;
  const t = Number.isFinite(n)
    ? n > 1e14
      ? n / 1000
      : n < 1e11
        ? n * 1000
        : n
    : Date.parse(String(v));
  return Number.isFinite(t) && t > 0 && t <= Date.now() + 86400000 ? t : null;
}
export function normalize(rows: any[], source: string): RecordItem[] {
  const out: RecordItem[] = [];
  for (const r of rows.slice(0, 100000)) {
    if (!r || typeof r !== "object") continue;
    const url = safeUrl(r.url || r.titleUrl || r.link);
    const title = String(
      r.title || r.name || r.text || r["Product Name"] || r["Item Name"] || "",
    ).slice(0, 500);
    if (!url && !title) continue;
    const cat = category(title + " " + url);
    if (cat === "Excluded") continue;
    out.push({
      id: crypto.randomUUID(),
      url,
      title,
      time: timestamp(
        r.time ??
          r.timestamp ??
          r.lastVisitTime ??
          r.time_usec ??
          r.date ??
          r["Order Date"],
      ),
      source,
      kind:
        r.kind === "statement"
          ? "statement"
          : r.kind === "order" || r["Order Date"] !== undefined
            ? "order"
            : "visit",
      category: cat,
      domain: url
        ? new URL(url).hostname.replace(/^www\./, "")
        : "User statement",
    });
  }
  return out;
}
export function parseImport(
  text: string,
  filename: string,
): { records: RecordItem[]; products: Product[]; note: string } {
  let data: any;
  if (filename.toLowerCase().endsWith(".csv")) {
    const p = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (p.errors.length)
      throw new Error(
        "CSV could not be parsed. Check quoted fields and headers.",
      );
    data = p.data;
  } else data = JSON.parse(text);
  const arr = Array.isArray(data)
    ? data
    : data["Browser History"] ||
      data.history ||
      data.records ||
      data.products ||
      data.conversations;
  if (!Array.isArray(arr))
    throw new Error(
      "Expected an array, Browser History, records, products, or conversations. Export ZIPs must be unzipped first.",
    );
  if (arr.some((r) => r?.mapping)) {
    const messages: any[] = [];
    for (const c of arr)
      for (const item of Object.values(c.mapping || {}) as any[]) {
        const m = item?.message;
        if (m?.author?.role !== "user") continue;
        const text = (m.content?.parts || [])
          .filter((p: any) => typeof p === "string")
          .join(" ")
          .split("\n")
          .filter((s: string) => !s.trim().startsWith(">"))
          .join(" ")
          .replace(/"[^"\n]*"|“[^”]*”/g, "");
        if (text.trim())
          messages.push({ text, time: m.create_time, kind: "statement" });
      }
    return {
      records: normalize(messages, filename),
      products: [],
      note: "Only user-role text used; blockquotes and quoted strings removed. Unmarked copied material cannot be reliably identified. Statements are not visits or purchases.",
    };
  }
  if (
    arr.length &&
    arr.every(
      (r) =>
        r?.name && r?.url && ("price" in r || "category" in r || "image" in r),
    )
  ) {
    return {
      records: [],
      products: arr
        .map((r) => ({
          id: crypto.randomUUID(),
          name: String(r.name).slice(0, 200),
          url: safeUrl(r.url),
          category:
            category(String(r.name)) === "Excluded"
              ? "Excluded"
              : Object.keys(taxonomy).find(
                  (c) => c.toLowerCase() === String(r.category).toLowerCase(),
                ) || category(String(r.name)),
          price:
            r.price === undefined ? undefined : String(r.price).slice(0, 60),
          image: safeUrl(r.image),
          capturedAt: r.capturedAt,
        }))
        .filter((p) => p.url && p.category !== "Excluded"),
      note: "Catalog metadata is user supplied, not independently verified. Prices may be stale.",
    };
  }
  return {
    records: normalize(arr, filename),
    products: [],
    note: "URLs are stripped of query strings and fragments. Sensitive-keyword records excluded. Each row is one record; aggregate visitCount is not expanded into invented visits.",
  };
}
export function analyze(
  records: RecordItem[],
  feedback: Record<string, string> = {},
) {
  const usable = records.filter((r) => r.category !== "Excluded");
  const visits = usable.filter((r) => r.kind === "visit");
  const groups = Object.keys(taxonomy)
    .map((name) => {
      const evidence = usable.filter((r) => r.category === name);
      const observed = evidence.filter((r) => r.kind !== "statement").length;
      const score = Math.round(
        (100 * evidence.length) / Math.max(1, usable.length),
      );
      return {
        name,
        evidence,
        observed,
        score,
        feedback: feedback[name],
        confidence:
          evidence.length >= 10
            ? "Moderate"
            : evidence.length >= 3
              ? "Low"
              : "INSUFFICIENT DATA",
      };
    })
    .filter((g) => g.evidence.length)
    .sort((a, b) => b.score - a.score);
  const counts = new Map<string, number>();
  for (const r of visits) counts.set(r.domain, (counts.get(r.domain) || 0) + 1);
  const domains = [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return {
    groups,
    domains,
    visits,
    dated: visits.filter((r) => r.time !== null),
    shopping: visits.filter((r) =>
      /amazon\.|walmart\.|target\.|bestbuy\.|etsy\.|ebay\.|shop|product|cart/i.test(
        r.url + " " + r.title,
      ),
    ),
  };
}
export function recommendationScore(
  p: Product,
  groups: ReturnType<typeof analyze>["groups"],
) {
  const g = groups.find(
    (g) => g.name === p.category && g.feedback !== "inaccurate",
  );
  if (!g || g.evidence.length < 3) return null;
  return Math.min(
    95,
    Math.round(40 + g.score * 0.45 + Math.min(10, g.evidence.length)),
  );
}
