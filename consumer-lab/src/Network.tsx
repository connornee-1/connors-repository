import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { RecordItem, Product } from "./engine";
import { buildGraph } from "./graph";
export default function Network({
  records,
  products,
  query,
  onSelect,
}: {
  records: RecordItem[];
  products: Product[];
  query: string;
  onSelect: (r: RecordItem[]) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    const width = 1000,
      height = 560;
    const layer = svg.append("g");
    svg.call(
      d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.25, 5])
        .on("zoom", (e) => layer.attr("transform", e.transform)) as any,
    );
    const graph = buildGraph(records, products);
    const capped: any[] = graph.nodes;
    const edges: any[] = graph.links;
    const colors = d3.scaleOrdinal(d3.schemeTableau10);
    const line = layer
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "var(--line-bright)")
      .attr("stroke-width", (d) => Math.min(5, Math.sqrt(d.weight)))
      .attr("opacity", 0.45);
    const node = layer
      .append("g")
      .selectAll("g")
      .data(capped)
      .join("g")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => d.label)
      .style("cursor", "pointer")
      .attr("opacity", (d) =>
        !query || d.label.toLowerCase().includes(query.toLowerCase())
          ? 1
          : 0.12,
      )
      .on("click", (_, d) => onSelect(d.records))
      .on("keydown", (e, d) => {
        if (e.key === "Enter") onSelect(d.records);
      });
    node
      .append("circle")
      .attr("r", (d) =>
        d.hub
          ? 22 + Math.min(18, Math.sqrt(d.weight) * 2)
          : 5 + Math.min(15, Math.sqrt(d.weight) * 2),
      )
      .attr("fill", (d) => colors(d.category))
      .attr("fill-opacity", (d) => (d.hub ? 0.22 : 0.75))
      .attr("stroke", (d) => colors(d.category))
      .attr("stroke-width", (d) => (d.hub ? 2 : 1));
    node
      .append("text")
      .text((d) => d.label)
      .attr("y", (d) => (d.hub ? -34 : 24))
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text)")
      .attr("font-size", (d) => (d.hub ? 14 : 10))
      .attr("font-weight", (d) => (d.hub ? 700 : 400));
    node
      .append("title")
      .text(
        (d) =>
          `${d.label} · ${d.kind} · topology community ${d.community + 1}: ${d.weight} supporting records. Click for evidence.`,
      );
    const sim = d3
      .forceSimulation(capped)
      .force(
        "link",
        d3
          .forceLink<any, any>(edges)
          .id((d) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-210))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide<any>().radius((d) => (d.hub ? 65 : 38)),
      );
    node.call(
      d3
        .drag<any, any>()
        .on("start", (e, d) => {
          if (!e.active) sim.alphaTarget(0.2).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (e, d) => {
          d.fx = e.x;
          d.fy = e.y;
        })
        .on("end", (e, d) => {
          if (!e.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );
    sim.on("tick", () => {
      line
        .attr("x1", (d) => (d.source as any).x)
        .attr("y1", (d) => (d.source as any).y)
        .attr("x2", (d) => (d.target as any).x)
        .attr("y2", (d) => (d.target as any).y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });
    return () => {
      sim.stop();
    };
  }, [records, products, query, onSelect]);
  return (
    <svg
      ref={ref}
      viewBox="0 0 1000 560"
      aria-label="Interest network. Drag nodes, scroll to zoom, click for evidence."
    />
  );
}
