import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods, NodeObject, LinkObject } from "react-force-graph-2d";
import {
  fetchPublicationRelationshipNetwork,
} from "./services/publicationService";
import type { PublicationRelationshipNetworkDto } from "./services/publicationService";

interface PublicationNetworkGraphProps {
  publicationId: number;
  threshold?: number;
}

interface GraphNode extends NodeObject {
  id: string;
  title?: string;
  year?: number;
  citationCount?: number;
  authors?: string[];
  type: string;
  val: number;
}

interface GraphLink extends LinkObject {
  source: string;
  target: string;
  weight: number;
  relationType: string;
}

const getNodeLabel = (node: GraphNode) => {
  const firstAuthor = node.authors?.[0] || "Unknown";
  const yearLabel = node.year ? `, ${node.year}` : "";
  return `${firstAuthor}${yearLabel}`;
};

const getTooltip = (node: GraphNode) => {
  const title = node.title || node.id;
  const authors = node.authors?.join(", ") || "Không rõ tác giả";
  const year = node.year ?? "Không rõ";
  const citations = node.citationCount ?? 0;
  return `${title}\n${authors}\nNăm: ${year}\nTrích dẫn: ${citations}`;
};

const PublicationNetworkGraph = ({ publicationId, threshold = 0.3 }: PublicationNetworkGraphProps) => {
  const [network, setNetwork] = useState<PublicationRelationshipNetworkDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPublicationId, setCurrentPublicationId] = useState(publicationId);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);

  useEffect(() => {
    setCurrentPublicationId(publicationId);
  }, [publicationId]);

  useEffect(() => {
    let active = true;
    const loadNetwork = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchPublicationRelationshipNetwork(currentPublicationId, threshold);
        if (!active) return;
        setNetwork(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Lỗi khi tải dữ liệu mạng liên kết.");
        setNetwork(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNetwork();

    return () => {
      active = false;
    };
  }, [currentPublicationId, threshold]);

  useEffect(() => {
    if (!network || !graphRef.current) return;
    const timer = window.setTimeout(() => {
      graphRef.current?.zoomToFit(400, 50, (node) => (node as GraphNode).type === "Central");
    }, 150);
    return () => window.clearTimeout(timer);
  }, [network]);

  const graphData = useMemo(() => {
    if (!network) return { nodes: [], links: [] };

    const degreeCount = new Map<string, number>();
    network.edges.forEach((edge) => {
      degreeCount.set(edge.source, (degreeCount.get(edge.source) || 0) + 1);
      degreeCount.set(edge.target, (degreeCount.get(edge.target) || 0) + 1);
    });

    const nodes = network.nodes.map((node) => ({
      ...node,
      val: Math.max(5, (degreeCount.get(node.id) || 0) * 3 + 5),
    })) as GraphNode[];

    const links = network.edges.map((edge) => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    })) as GraphLink[];

    return { nodes, links };
  }, [network]);

  const hasGraphData = graphData.nodes.length > 0;
  const centralItem = graphData.nodes.find((node) => node.type === "Central") || graphData.nodes[0];

  return (
    <div className="network-card">
      <div className="network-header">
        <div>
          <h2>Biểu đồ mạng trích dẫn / liên kết</h2>
          <p>
            {centralItem
              ? `Tập trung quanh bài báo: ${centralItem.title ?? centralItem.label}`
              : "Không có dữ liệu network cho publication này."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="network-empty">Đang tải dữ liệu mạng liên kết...</div>
      ) : error ? (
        <div className="network-empty">{error}</div>
      ) : !hasGraphData ? (
        <div className="network-empty">Không có dữ liệu liên kết để hiển thị.</div>
      ) : (
        <div className="graph-wrapper">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            linkColor={() => "rgba(148, 163, 184, 0.9)"}
            linkWidth={1}
            linkDirectionalParticles={0}
            nodeLabel={(node) => getTooltip(node as GraphNode)}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const graphNode = node as GraphNode;
              const label = getNodeLabel(graphNode);
              const fontSize = Math.max(10, 12 / globalScale);
              const radius = Math.max(6, graphNode.val ?? 6);
              const x = node.x ?? 0;
              const y = node.y ?? 0;

              ctx.save();
              ctx.beginPath();
              ctx.fillStyle = graphNode.type === "Central" ? "#eef2ff" : "#f8fafc";
              ctx.strokeStyle = graphNode.type === "Central" ? "#7c3aed" : "#94a3b8";
              ctx.lineWidth = graphNode.type === "Central" ? 3 : 1;
              ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
              ctx.fill();
              ctx.stroke();

              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#111827";
              ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
              ctx.fillText(label, x + radius + 8, y);
              ctx.restore();
            }}
            onNodeClick={(node) => {
              const nodeId = String((node as GraphNode).id);
              if (Number(nodeId) !== currentPublicationId) {
                setCurrentPublicationId(Number(nodeId));
              }
            }}
            nodeCanvasObjectMode={() => "after"}
          />
        </div>
      )}

      <div className="network-footer">
        <small>
          Nhấp vào node khác để tải lại mạng liên kết xung quanh bài báo đó.
        </small>
      </div>
    </div>
  );
};

export default PublicationNetworkGraph;
