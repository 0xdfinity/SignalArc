"use client";

import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import type { GraphEdge, GraphNode } from "@/lib/types";

const nodeColors: Record<GraphNode["type"], string> = {
  user: "#7dd3fc",
  agent: "#d7ecff",
  action: "#7dd3fc",
  venue: "#5aa7ff",
  fee: "#2f7df4",
};

export function LiveFlow({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const flowNodes: Node[] = nodes.map((node, index) => ({
    id: node.id,
    type: "default",
    position: getPosition(node, index),
    data: {
      label: (
        <div className="min-w-[150px] max-w-[190px]">
          <div className="truncate text-sm font-semibold">{node.label}</div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{node.value}</div>
        </div>
      ),
    },
    style: {
      background: "#08111f",
      color: "#f4f9ff",
      border: `1px solid ${nodeColors[node.type]}`,
      borderRadius: 8,
      padding: 10,
      width: 172,
    },
  }));

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.animated,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: edge.animated ? "#7dd3fc" : "#4a5e77" },
    labelStyle: { fill: "#9caec2", fontSize: 11 },
  }));

  return (
    <div className="h-[460px] overflow-hidden rounded-lg border border-border/70 bg-card">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.55}
        maxZoom={1.3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#21334a" gap={24} />
        <MiniMap pannable zoomable nodeStrokeWidth={3} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function getPosition(node: GraphNode, index: number) {
  const fixed: Record<string, { x: number; y: number }> = {
    user: { x: 10, y: 180 },
    "agent-alpha": { x: 240, y: 60 },
    "agent-macro": { x: 240, y: 180 },
    "agent-event": { x: 240, y: 300 },
    "rec-001": { x: 500, y: 60 },
    "rec-003": { x: 500, y: 180 },
    "rec-004": { x: 500, y: 300 },
    "venue-dex": { x: 760, y: 90 },
    "venue-prediction": { x: 760, y: 260 },
    fee: { x: 1000, y: 180 },
  };

  return fixed[node.id] ?? { x: 500 + index * 20, y: 60 + index * 40 };
}
