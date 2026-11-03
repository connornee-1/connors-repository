import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Orbit,
  LayoutDashboard,
  Network as NetworkIcon,
  Fingerprint,
  ScanFace,
  Layers,
  Compass,
  Sparkles,
  Split,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Sun,
  Moon,
  Upload,
  Link2,
  X,
  Trash2,
  Search,
  ChevronRight,
  Download,
  Activity,
  Lock,
  Chrome,
  CheckCircle2,
} from "lucide-react";
import Network from "./Network";
import {
  RecordItem,
  Product,
  parseImport,
  analyze,
  normalize,
  recommendationScore,
} from "./engine";
const sections = [
  ["Consumer overview", LayoutDashboard],
  ["Interest universe", NetworkIcon],
  ["Digital footprint", Fingerprint],
  ["Personality & shopping", ScanFace],
  ["Consumer segments", Layers],
  ["Product discovery", Compass],
  ["Recommendations", Sparkles],
  ["AI vs. reality", Split],
  ["Data & privacy", ShieldCheck],
] as const;
const palette = [
  "#c1f574",
  "#9d9bff",
  "#6adbd0",
  "#f3a98b",
  "#e5cd75",
  "#96bafa",
  "#f3a4dc",
  "#9bcfb1",
];
export default function App() {
  const [page, setPage] = useState(0),
    [records, setRecords] = useState<RecordItem[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [feedback, setFeedback] = useState<Record<string, string>>({}),
    [theme, setTheme] = useState("dark"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All interests"),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(false),
    [extension, setExtension] = useState(false),
    [days, setDays] = useState(30),
    [evidence, setEvidence] = useState<RecordItem[] | null>(null),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const request = useRef<string | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    if (!modal && !evidence) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,[tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModal(false);
        setEvidence(null);
      }
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [modal, !!evidence]);
  const profile = useMemo(
    () => analyze(records, feedback),
    [records, feedback],
  );
  const filtered = useMemo(
    () =>
      records.filter(
        (r) => filter === "All interests" || r.category === filter,
      ),
    [records, filter],
  );
  const selectEvidence = useCallback((r: RecordItem[]) => setEvidence(r), []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    function receive(e: MessageEvent) {
      if (
        e.source !== window ||
        e.origin !== location.origin ||
        e.data?.channel !== "orbit-extension"
      )
        return;
      const m = e.data;
      if (m.type === "READY") setExtension(true);
      if (m.id !== request.current) return;
      if (m.type === "RESULT") {
        setBusy(false);
        request.current = null;
        if (m.error) {
          setNotice(m.error);
          return;
        }
        setRecords((old) => [
          ...old.filter((r) => r.source !== "Chrome"),
          ...normalize(m.records || [], "Chrome"),
        ]);
        setModal(false);
        setNotice(
          `${m.records?.length || 0} Chrome visit records received. ${m.truncated ? "Coverage limited to 5,000 URLs; choose a shorter period." : ""}`,
        );
      }
      if (m.type === "REVOKED") {
        setBusy(false);
        request.current = null;
        setRecords((old) => old.filter((r) => r.source !== "Chrome"));
        setNotice(
          m.error ||
            "Chrome history permission revoked and Chrome records removed.",
        );
      }
    }
    window.addEventListener("message", receive);
    window.postMessage(
      { channel: "orbit-dashboard", type: "PING" },
      location.origin,
    );
    return () => window.removeEventListener("message", receive);
  }, []);
  async function importFiles(files: FileList | File[]) {
    const epoch = generation.current;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        if (f.size > 30 * 1024 * 1024)
          throw Error("Please split files larger than 30 MB.");
        const result = parseImport(await f.text(), f.name);
        if (epoch !== generation.current) return;
        setRecords((old) => [...old, ...result.records]);
        setProducts((old) => [...old, ...result.products]);
        setNotice(
          `${result.records.length} records and ${result.products.length} products imported. ${result.note}`,
        );
      }
    } catch (e) {
      setNotice(String(e));
    } finally {
      setBusy(false);
    }
  }
  function send(type: string) {
    const id = crypto.randomUUID();
    request.current = id;
    setBusy(true);
    window.postMessage(
      { channel: "orbit-dashboard", type, id, days },
      location.origin,
    );
    window.setTimeout(() => {
      if (request.current === id) {
        request.current = null;
        setBusy(false);
        setNotice(
          "Extension did not respond. Open its popup to grant permission, then reload this dashboard.",
        );
      }
    }, 60000);
  }
  function reset() {
    generation.current++;
    request.current = null;
    setBusy(false);
    setRecords([]);
    setProducts([]);
    setFeedback({});
    setEvidence(null);
    setNotice(
      "All in-memory data and feedback deleted. Reloading also clears this session.",
    );
  }
  const empty = (
    <div className="empty">
      <Orbit size={36} />
      <h3>Your signal starts with your data.</h3>
      <p>
        Connect Chrome or import records to reveal your interests.
        <br />
        No sample profile. No invented evidence.
      </p>
      <button className="primary" onClick={() => setModal(true)}>
        Connect a data source <ArrowRight size={16} />
      </button>
    </div>
  );
  function table(rows: RecordItem[]) {
    return (
      <div className="records">
        {rows.slice(0, 150).map((r) => (
          <div className="record" key={r.id}>
            <div>
              <strong>{r.title || r.domain}</strong>
              <small>
                {r.domain} · {r.source} · {r.kind} ·{" "}
                {r.time
                  ? new Date(r.time).toLocaleString()
                  : "Date unavailable"}
              </small>
            </div>
            <button
              aria-label="Delete record"
              onClick={() => {
                setRecords((old) => old.filter((x) => x.id !== r.id));
                setEvidence((old) => old?.filter((x) => x.id !== r.id) || null);
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {rows.length > 150 && (
          <p>
            Showing 150 of {rows.length}. Use source removal to delete an entire
            import.
          </p>
        )}
      </div>
    );
  }
  function networkPanel() {
    return (
      <div className="panel universe">
        <div className="panel-head">
          <div>
            <span className="eyebrow">A MAP OF YOUR ATTENTION</span>
            <h2>
              Interest universe{" "}
              <span className="pill">{profile.groups.length} communities</span>
            </h2>
          </div>
          <button onClick={() => setPage(1)}>
            Explore network <ArrowUpRight size={15} />
          </button>
        </div>
        {profile.groups.length ? (
          <Network
            records={filtered}
            products={products}
            query={query}
            onSelect={selectEvidence}
          />
        ) : (
          <div className="universe-empty">
            <div className="orbit-ring ring1" />
            <div className="orbit-ring ring2" />
            <div className="orbit-ring ring3" />
            <div className="orbit-core">
              <Orbit size={45} />
              <h3>An undiscovered universe</h3>
              <p>Your real interests will take shape here.</p>
              <button className="primary" onClick={() => setModal(true)}>
                Connect Chrome <ArrowRight size={16} />
              </button>
            </div>
            <span className="star s1" />
            <span className="star s2" />
            <span className="star s3" />
          </div>
        )}
        <div className="network-footer">
          <span>
            <i className="dot" /> Interest, website, brand & catalog nodes ·
            evidence-weighted
          </span>
          <span>Drag to explore · Scroll to zoom · Click for evidence</span>
        </div>
      </div>
    );
  }
  const title = [
    "Your consumer intelligence,\nin perspective.",
    "A universe of interests.",
    "The rhythm of your digital life.",
    "Patterns, with perspective.",
    "Where your interests overlap.",
    "Discover with intention.",
    "Relevant to your world.",
    "You are the ground truth.",
    "Your data. Your control.",
  ][page];
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage(0);
          }}
        >
          <span className="brand-icon">
            <Orbit size={25} />
          </span>
          orbit<span className="beta">LAB</span>
        </a>
        <div className="workspace">
          <span className="avatar">P</span>
          <div>
            Personal laboratory<small>Consumer intelligence</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <span className="nav-label">EXPLORATION</span>
        <nav>
          {sections.map(([label, Icon], i) => (
            <button
              key={label} aria-label={label}
              className={page === i ? "active" : ""}
              onClick={() => {
                setPage(i);
                setQuery("");
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {i === 6 && <span className="count">{products.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <Lock size={16} />
            <div>
              Private by design
              <small>
                Processed on this device.
                <br />
                Never sent to an AI service.
              </small>
            </div>
          </div>
          <button
            className="theme"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}Switch to{" "}
            {theme === "dark" ? "light" : "dark"} mode
          </button>
          <small className="version">ORBIT INTELLIGENCE / 01</small>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumb">
            Laboratory <ChevronRight size={13} />{" "}
            <span>{sections[page][0]}</span>
          </div>
          <div className="header-right">
            <button
              className="icon"
              aria-label="Toggle color theme"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <span className="session">
              <i className="dot" />
              Local session
            </span>
            <button
              className="icon"
              aria-label="Data connections"
              onClick={() => setPage(8)}
            >
              <ShieldCheck size={19} />
            </button>
            <span className="avatar">P</span>
          </div>
        </header>
        <div className="content">
          <div className="intro">
            <div>
              <span className="eyebrow">
                <span className="tiny-line" /> PERSONAL INTELLIGENCE /{" "}
                {String(page + 1).padStart(2, "0")}
              </span>
              <h1>
                {title.split("\n").map((s, i) => (
                  <span key={s}>
                    {s}
                    {i === 0 && title.includes("\n") && <br />}
                  </span>
                ))}
              </h1>
              <p>
                Understand the signals. Question the inferences. Discover what
                resonates.
              </p>
            </div>
            <button className="primary" onClick={() => setModal(true)}>
              <Link2 size={16} />
              Connect data <span>↗</span>
            </button>
          </div>
          {notice && (
            <div className="notice" role="status">
              <CheckCircle2 size={17} />
              <span>{notice}</span>
              <button aria-label="Dismiss" onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}
          {page === 0 && (
            <>
              <div className="stats">
                {[
                  [
                    "Records analyzed",
                    records.length,
                    "Voluntarily connected records",
                  ],
                  [
                    "Interest clusters",
                    profile.groups.length,
                    "Evidence-based communities",
                  ],
                  [
                    "Shopping signals",
                    profile.shopping.length,
                    "Retail and product page records",
                  ],
                  [
                    "Data confidence",
                    records.length >= 30 ? "Limited" : "Insufficient",
                    "Coverage ≠ certainty",
                  ],
                ].map(([label, value, sub], i) => (
                  <div className="stat" key={label}>
                    <span>
                      {label}
                      <span className="stat-index">0{i + 1}</span>
                    </span>
                    <strong>{value}</strong>
                    <small>{sub}</small>
                  </div>
                ))}
              </div>
              {networkPanel()}
              <div className="two-cols">
                <div className="panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">SIGNALS, EXPLAINED</span>
                      <h2>Emerging interests</h2>
                    </div>
                    <Activity size={19} />
                  </div>
                  {profile.groups.length ? (
                    profile.groups.slice(0, 4).map((g, i) => (
                      <button
                        className="interest-row"
                        key={g.name}
                        onClick={() => setEvidence(g.evidence)}
                      >
                        <span
                          className="category-dot"
                          style={{ background: palette[i] }}
                        />
                        <div>
                          <strong>{g.name}</strong>
                          <small>
                            {g.evidence.length} records · {g.confidence} ·{" "}
                            {g.feedback || "Not reviewed"}
                          </small>
                        </div>
                        <b>{g.score}%</b>
                        <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <div className="mini-empty">
                      <span>01 — WAITING FOR SIGNAL</span>
                      <h3>A profile built on evidence.</h3>
                      <p>
                        Your strongest interest clusters appear here after you
                        connect a source.
                      </p>
                    </div>
                  )}
                </div>
                <div className="panel insight-card">
                  <span className="eyebrow">THE HUMAN IN THE LOOP</span>
                  <Split size={29} />
                  <h2>
                    AI makes an inference.
                    <br />
                    You give it perspective.
                  </h2>
                  <p>
                    A visit is a signal, not an identity. Review the evidence
                    and tell the lab what it gets right.
                  </p>
                  <button onClick={() => setPage(7)}>
                    Explore AI vs. reality <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
          {page === 1 && (
            <>
              <div className="toolbar">
                <label>
                  <Search size={16} />
                  <input
                    placeholder="Find a website or interest…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {["All interests", ...profile.groups.map((g) => g.name)].map(
                    (c) => (
                      <option key={c}>{c}</option>
                    ),
                  )}
                </select>
              </div>
              {networkPanel()}
              <div className="panel prose">
                <h3>How to read this universe</h3>
                <p>
                  Large nodes are interest categories. Smaller nodes are websites, literal brand mentions, or catalog candidates associated by category. Link thickness counts supporting records. Structural communities are detected as connected components; hover a node for its community. Taxonomy hubs remain explicit keyword categories, not psychological identities. Catalog links do not establish observed product visits. The graph displays up to 180 nodes for responsive interaction.
            </p>
              </div>
            </>
          )}
          {page === 2 && (
            <>
              {!records.length ? (
                empty
              ) : (
                <>
                  <div className="two-cols">
                    <div className="panel">
                      <div className="panel-head">
                        <h2>Daily orbit</h2>
                        <span className="pill">Local time</span>
                      </div>
                      <svg
                        viewBox="0 0 400 340"
                        className="radial"
                        aria-label="Hourly visit frequency"
                      >
                        {Array.from({ length: 24 }, (_, h) => {
                          const count = profile.dated.filter(
                            (r) => new Date(r.time!).getHours() === h,
                          ).length;
                          const max = Math.max(
                            1,
                            ...Array.from(
                              { length: 24 },
                              (_, i) =>
                                profile.dated.filter(
                                  (r) => new Date(r.time!).getHours() === i,
                                ).length,
                            ),
                          );
                          const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
                          return (
                            <g key={h}>
                              <line
                                x1={200 + 65 * Math.cos(a)}
                                y1={170 + 65 * Math.sin(a)}
                                x2={
                                  200 + (70 + (count / max) * 65) * Math.cos(a)
                                }
                                y2={
                                  170 + (70 + (count / max) * 65) * Math.sin(a)
                                }
                                stroke={count ? "#c1f574" : "#35423a"}
                                strokeWidth="9"
                                strokeLinecap="round"
                              >
                                <title>
                                  {h}:00 — {count} visit records
                                </title>
                              </line>
                              <text
                                x={200 + 154 * Math.cos(a)}
                                y={174 + 154 * Math.sin(a)}
                                textAnchor="middle"
                                fill="currentColor"
                                fontSize="10"
                              >
                                {h}
                              </text>
                            </g>
                          );
                        })}
                        <text
                          x="200"
                          y="166"
                          textAnchor="middle"
                          fill="currentColor"
                          fontSize="24"
                        >
                          {profile.dated.length}
                        </text>
                        <text
                          x="200"
                          y="190"
                          textAnchor="middle"
                          fill="currentColor"
                          fontSize="11"
                        >
                          DATED VISITS
                        </text>
                      </svg>
                    </div>
                    <div className="panel">
                      <div className="panel-head">
                        <h2>Weekly rhythm</h2>
                      </div>
                      <div className="heatmap">
                        {Array.from({ length: 7 }, (_, day) => (
                          <div key={day}>
                            <small>
                              {
                                [
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat",
                                ][day]
                              }
                            </small>
                            {Array.from({ length: 24 }, (_, hour) => {
                              const count = profile.dated.filter((r) => {
                                const d = new Date(r.time!);
                                return (
                                  d.getDay() === day && d.getHours() === hour
                                );
                              }).length;
                              return (
                                <button
                                  key={hour}
                                  style={{
                                    background: count
                                      ? `rgba(193,245,116,${Math.min(0.95, 0.2 + count * 0.08)})`
                                      : "var(--surface2)",
                                  }}
                                  aria-label={`${day} ${hour}: ${count} visits`}
                                  title={`${hour}:00 · ${count} records`}
                                  onClick={() =>
                                    setEvidence(
                                      profile.dated.filter((r) => {
                                        const d = new Date(r.time!);
                                        return (
                                          d.getDay() === day &&
                                          d.getHours() === hour
                                        );
                                      }),
                                    )
                                  }
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <p className="muted">
                        Midnight → 23:00 · Only dated visit records. Missing
                        timestamps are excluded.
                      </p>
                      <h3>Repeated vs. exploratory</h3>
                      <p>
                        {profile.domains.filter((d) => d.count > 1).length}{" "}
                        repeatedly visited domains;{" "}
                        {profile.domains.filter((d) => d.count === 1).length}{" "}
                        single-record domains. Import coverage affects this
                        interpretation.
                      </p>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-head">
                      <h2>Interest changes</h2>
                      <span className="pill">Last 30 days vs. previous 30</span>
                    </div>
                    {profile.groups.map((g) => {
                      const now = Date.now();
                      const recent = g.evidence.filter(
                        (r) => r.time && now - r.time <= 30 * 86400000,
                      ).length;
                      const prior = g.evidence.filter(
                        (r) =>
                          r.time &&
                          now - r.time > 30 * 86400000 &&
                          now - r.time <= 60 * 86400000,
                      ).length;
                      return (
                        <div className="interest-row" key={g.name}>
                          <strong>{g.name}</strong>
                          <span>
                            {prior} → {recent} records
                          </span>
                          <small>
                            {prior < 3 || recent < 3
                              ? "INSUFFICIENT DATA for trend"
                              : "Observed count change; coverage may differ"}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                  <div className="panel">
                    <div className="panel-head">
                      <h2>Observed websites</h2>
                    </div>
                    {profile.domains.slice(0, 15).map((d) => (
                      <button
                        className="interest-row"
                        key={d.name}
                        onClick={() =>
                          setEvidence(
                            records.filter((r) => r.domain === d.name),
                          )
                        }
                      >
                        <strong>{d.name}</strong>
                        <span>{d.count} visit records</span>
                        <ArrowUpRight size={16} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {page === 3 && (
            <div className="cards">
              {[
                "Research intensity",
                "Novelty seeking",
                "Brand exploration",
                "Convenience orientation",
                "Price sensitivity",
                "Premium vs. value",
              ].map((name, i) => {
                const n = profile.visits.length;
                const domains = profile.domains.length;
                const known = i < 3 && n >= 20;
                const value =
                  i === 0
                    ? Math.round(
                        (profile.shopping.length / Math.max(1, n)) * 100,
                      )
                    : i === 1
                      ? Math.round((domains / Math.max(1, n)) * 100)
                      : domains;
                return (
                  <div className="panel tendency" key={name}>
                    <span className="eyebrow">
                      BEHAVIORAL HYPOTHESIS / 0{i + 1}
                    </span>
                    <h2>{name}</h2>
                    <strong className="big-number">
                      {known ? `${value}${i < 2 ? "%" : ""}` : "—"}
                    </strong>
                    <span className="pill">
                      {known
                        ? "Tentative · low confidence"
                        : "INSUFFICIENT DATA"}
                    </span>
                    <p>
                      {i === 0
                        ? "Proxy: retail / product records divided by visit records. It does not measure time spent researching."
                        : i === 1
                          ? "Proxy: distinct domains divided by visit records. New domains may reflect unrelated tasks."
                          : i === 2
                            ? "Distinct website count is only a proxy for exploration; websites are not necessarily brands."
                            : "This tendency requires explicit comparable product, price, or purchase evidence. Visits alone do not establish it."}
                    </p>
                    {known && (
                      <button
                        onClick={() =>
                          setEvidence(
                            i === 0 ? profile.shopping : profile.visits,
                          )
                        }
                      >
                        Inspect supporting records <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
              <div className="panel prose">
                <h3>Interpretation, not a personality test</h3>
                <p>
                  These local rules are not a trained AI model or validated
                  psychological measurement. Browsing may represent work, gifts,
                  shared devices, or curiosity. No sensitive characteristics are
                  inferred.
                </p>
              </div>
            </div>
          )}
          {page === 4 && (
            <>
              {profile.groups.length ? (
                <div className="cards">
                  {profile.groups.map((g, i) => (
                    <div className="panel segment" key={g.name}>
                      <span className="eyebrow">
                        OVERLAPPING INTEREST SEGMENT
                      </span>
                      <div
                        className="segment-circle"
                        style={{ borderColor: palette[i % 8] }}
                      >
                        {g.score}
                        <small>% of records</small>
                      </div>
                      <h2>{g.name} explorer</h2>
                      <span className="pill">{g.confidence}</span>
                      <p>
                        {g.evidence.length} of {records.length} records match
                        disclosed {g.name.toLowerCase()} keywords. This is
                        possible segment membership, not purchase intent.
                      </p>
                      <button onClick={() => setEvidence(g.evidence)}>
                        View evidence <ArrowUpRight size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                empty
              )}
            </>
          )}
          {page === 5 && (
            <>
              <div className="panel discovery">
                <span className="eyebrow">PRODUCT DISCOVERY</span>
                <h2>Bring the products. Find the connection.</h2>
                <p>
                  Add a retailer or product URL to open it directly. Import a
                  catalog with actual product details to compare against your
                  interests. This static dashboard does not scrape retailers or
                  bypass access restrictions.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      const u = new URL(url);
                      if (u.protocol !== "https:" || u.username || u.password)
                        throw Error();
                      window.open(u.href, "_blank", "noopener,noreferrer");
                      setNotice(
                        "Retailer opened. Import a product catalog to use verified or user-supplied metadata.",
                      );
                    } catch {
                      setNotice("Enter a valid HTTPS retailer or product URL.");
                    }
                  }}
                >
                  <input
                    type="url"
                    placeholder="https://www.bestbuy.com/…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <button className="primary">
                    Open retailer <ArrowUpRight size={16} />
                  </button>
                </form>
                <button onClick={() => file.current?.click()}>
                  <Upload size={16} />
                  Import product catalog
                </button>
                <p className="muted">
                  JSON array or CSV: name, url, category, optional price, image,
                  capturedAt. Prices are labeled user supplied until
                  independently verified. Remote images load only when you
                  request them.
                </p>
              </div>
              {productCards(products, false)}
            </>
          )}
          {page === 6 && (
            <>
              <div className="panel prose">
                <h3>Recommendations with a paper trail</h3>
                <p>
                  Matches require at least 3 supporting records in a product’s
                  category. Scores express category alignment, not likelihood of
                  purchase. Incorrect feedback excludes that category. No
                  catalog means no invented products.
                </p>
              </div>
              {productCards(
                products.filter(
                  (p) => recommendationScore(p, profile.groups) !== null,
                ),
                true,
              )}
            </>
          )}
          {page === 7 && (
            <>
              {profile.groups.length ? (
                <div className="cards">
                  {profile.groups.map((g) => (
                    <div className="panel" key={g.name}>
                      <span className="eyebrow">INFERENCE TO REVIEW</span>
                      <h2>Interested in {g.name.toLowerCase()}?</h2>
                      <p>
                        {g.evidence.length} matching records suggest an
                        interest. {g.confidence}. A visit does not establish a
                        preference.
                      </p>
                      <button onClick={() => setEvidence(g.evidence)}>
                        See evidence <ArrowUpRight size={15} />
                      </button>
                      <div className="feedback">
                        {["accurate", "inaccurate", "uncertain"].map((v) => (
                          <button
                            className={feedback[g.name] === v ? "chosen" : ""}
                            onClick={() =>
                              setFeedback((f) => ({ ...f, [g.name]: v }))
                            }
                            key={v}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <small>
                        Self-report: {feedback[g.name] || "Not evaluated"}.{" "}
                        {feedback[g.name] === "inaccurate"
                          ? "Excluded from recommendation matching."
                          : feedback[g.name] === "uncertain"
                            ? "Retained as uncertain; no score boost."
                            : "Observed records remain available for inspection."}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                empty
              )}
            </>
          )}
          {page === 8 && (
            <>
              <div
                className="panel upload-area"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  importFiles(e.dataTransfer.files);
                }}
              >
                <Upload size={30} />
                <h2>Only the data you choose to share.</h2>
                <p>
                  Drop JSON or CSV here, or choose files. Selecting a file
                  authorizes local analysis.
                  <br />
                  Google Takeout · ChatGPT conversations.json · browsing records
                  · order exports · product catalogs
                </p>
                <button
                  className="primary"
                  onClick={() => file.current?.click()}
                >
                  Choose files <ArrowRight size={16} />
                </button>
                <small>
                  Unzip exports first · 30 MB per file · no persistent record
                  storage
                </small>
              </div>
              <div className="two-cols">
                <div className="panel">
                  <div className="panel-head">
                    <h2>Connected sources</h2>
                  </div>
                  <div className="source">
                    <Chrome size={21} />
                    <div>
                      <strong>Google Chrome</strong>
                      <small>
                        {extension
                          ? "Extension detected; permission requested in popup"
                          : "Extension required · not connected"}
                      </small>
                    </div>
                    <button onClick={() => setModal(true)}>Connect</button>
                  </div>
                  {[...new Set(records.map((r) => r.source))].map((source) => (
                    <div className="source" key={source}>
                      <Fingerprint size={19} />
                      <div>
                        <strong>{source}</strong>
                        <small>
                          {records.filter((r) => r.source === source).length}{" "}
                          records
                        </small>
                      </div>
                      <button
                        aria-label={`Remove ${source}`}
                        onClick={() =>
                          setRecords((r) =>
                            r.filter((x) => x.source !== source),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => send("REVOKE")}
                    disabled={!extension || busy}
                  >
                    Revoke Chrome history permission
                  </button>
                </div>
                <div className="panel prose">
                  <ShieldCheck size={24} />
                  <h2>Local by default. Transparent always.</h2>
                  <p>
                    No external AI APIs, telemetry, analytics, cookies, or
                    persistent personal-record storage. Reloading clears your
                    session. GitHub hosts application assets and receives normal
                    page requests, not imported records.
                  </p>
                  <p>
                    Record names and titles can still contain personal
                    information. Sensitive-keyword filtering is imperfect;
                    inspect and delete records you do not want analyzed. No
                    sensitive segments are generated.
                  </p>
                  <button className="danger" onClick={reset}>
                    <Trash2 size={16} />
                    Delete all session data
                  </button>
                </div>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <h2>Record inspector</h2>
                  <span className="pill">{records.length} records</span>
                </div>
                {table(records)}
              </div>
            </>
          )}
          <footer>
            <span>
              <Orbit size={14} /> ORBIT · CONSUMER INTELLIGENCE LABORATORY
            </span>
            <span>
              Observed signals. Tentative inferences. Human perspective.
            </span>
          </footer>
        </div>
      </main>
      <input
        ref={file}
        type="file"
        accept=".json,.csv"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) importFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Connect your data"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Close"
              onClick={() => setModal(false)}
            >
              <X />
            </button>
            <span className="brand-icon">
              <Orbit size={27} />
            </span>
            <span className="eyebrow">CONNECT → APPROVE → EXPLORE</span>
            <h2>Connect your digital world.</h2>
            <p>
              Chrome history requires an extension and explicit permission.
              Nothing is read by visiting this dashboard.
            </p>
            <div className="connection-steps">
              <div>
                <b>01</b>
                <div>
                  <strong>Install the test extension</strong>
                  <p>
                    Not published to the Chrome Web Store. Download and unzip
                    the extension, open <code>chrome://extensions</code>, turn
                    on Developer mode, and choose “Load unpacked”. Select the
                    extension folder.
                  </p>
                  <a
                    className="button"
                    href={`${import.meta.env.BASE_URL}orbit-extension.zip`}
                    download
                  >
                    <Download size={16} />
                    Download test extension
                  </a>
                </div>
              </div>
              <div>
                <b>02</b>
                <div>
                  <strong>Approve in the extension popup</strong>
                  <p>
                    Click the Orbit extension icon, then “Approve history
                    access”. Chrome asks for the optional history permission.
                    Read the disclosure first. Reload this dashboard after
                    installation.
                  </p>
                </div>
              </div>
              <div>
                <b>03</b>
                <div>
                  <strong>Choose coverage and explore</strong>
                  <p>
                    Transfers visited URLs, page titles, and visit timestamps
                    into this tab only. Up to 5,000 URLs per analysis. History
                    permission technically allows wider history access; this
                    extension reads only your chosen period.
                  </p>
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    {[7, 30, 90].map((n) => (
                      <option key={n} value={n}>
                        Last {n} days
                      </option>
                    ))}
                  </select>
                  <button
                    className="primary"
                    disabled={!extension || busy}
                    onClick={() => send("HISTORY")}
                  >
                    {busy ? "Working…" : "Analyze approved history"}
                    <ArrowRight size={15} />
                  </button>
                  <small>
                    {extension
                      ? "Extension detected. Approval happens in its popup."
                      : "Waiting for extension · reload after installation"}
                  </small>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setModal(false);
                setPage(8);
                file.current?.click();
              }}
            >
              <Upload size={16} />
              Or import your own files
            </button>
          </div>
        </div>
      )}
      {evidence && (
        <div className="overlay" onClick={() => setEvidence(null)}>
          <div
            className="modal evidence"
            role="dialog"
            aria-modal="true"
            aria-label="Supporting evidence"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Close"
              onClick={() => setEvidence(null)}
            >
              <X />
            </button>
            <span className="eyebrow">EVIDENCE INSPECTOR</span>
            <h2>Behind the signal</h2>
            <p>
              Observed records below support a keyword-based category
              association. This does not establish ownership, intent, or a
              validated preference. You can delete any record.
            </p>
            {table(evidence)}
          </div>
        </div>
      )}
    </div>
  );
  function productCards(items: Product[], matches: boolean) {
    return items.length ? (
      <div className="cards">
        {items.map((p) => (
          <div className="panel product" key={p.id}>
            <span className="eyebrow">
              {p.category} / USER-SUPPLIED CATALOG
            </span>
            <h2>{p.name}</h2>
            <p>
              {p.price
                ? `${p.price} · user supplied, not independently verified`
                : "Price unavailable"}
            </p>
            {p.capturedAt && <small>Catalog timestamp: {p.capturedAt}</small>}
            {matches && (
              <>
                <strong className="match">
                  {recommendationScore(p, profile.groups)}% category match
                </strong>
                <p>
                  Matches{" "}
                  {
                    profile.groups.find((g) => g.name === p.category)?.evidence
                      .length
                  }{" "}
                  records categorized as {p.category}.{" "}
                  {feedback[p.category] === "uncertain"
                    ? "Your feedback marks this preference uncertain."
                    : ""}
                </p>
                <button
                  onClick={() =>
                    setEvidence(
                      profile.groups.find((g) => g.name === p.category)
                        ?.evidence || [],
                    )
                  }
                >
                  Why this match <ArrowUpRight size={15} />
                </button>
              </>
            )}
            <a
              className="button"
              href={p.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              View source <ArrowUpRight size={16} />
            </a>
            {p.image && (
              <button
                onClick={(e) => {
                  const img = document.createElement("img");
                  img.src = p.image!;
                  img.alt = p.name;
                  img.referrerPolicy = "no-referrer";
                  img.className = "product-image";
                  e.currentTarget.replaceWith(img);
                }}
              >
                Load source image (contacts image host)
              </button>
            )}
            <button
              aria-label="Remove product"
              onClick={() =>
                setProducts((old) => old.filter((x) => x.id !== p.id))
              }
            >
              <Trash2 size={15} />
              Remove
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div className="panel">
        {empty}
        <p className="muted centered">
          {matches
            ? "INSUFFICIENT DATA: import a real product catalog and at least 3 matching records."
            : "No product catalog connected. No prices, ratings, or availability invented."}
        </p>
      </div>
    );
  }
}
