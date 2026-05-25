import { ImageResponse } from "next/og";

import { getAgent, getExecution } from "@/lib/db/platform";

export const alt = "SignalArc execution share card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const execution = await getExecution(id);
  const agent = execution ? await getAgent(execution.agentId) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#04070d",
          color: "#f4f9ff",
          padding: 56,
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 700 }}>SignalArc</div>
          <div style={{ fontSize: 20, color: "#7dd3fc" }}>Verified execution</div>
        </div>
        <div>
          <div style={{ color: "#9caec2", fontSize: 26 }}>Agent</div>
          <div style={{ marginTop: 12, fontSize: 64, fontWeight: 800 }}>
            {agent?.name ?? "SignalArc Agent"}
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 18 }}>
            <Pill label="Event" value={execution?.action ?? "EXECUTE"} />
            <Pill label="Result" value={`${execution?.pnl.toFixed(2) ?? "0.00"} USDC`} />
            <Pill label="Fee" value={`${execution?.agentFee.toFixed(2) ?? "0.00"} USDC`} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#d7ecff", fontSize: 22 }}>
          <span>{execution ? new Date(execution.createdAt).toUTCString() : new Date().toUTCString()}</span>
          <span>Policy checked - fee attributed - public rank updated</span>
        </div>
      </div>
    ),
    size,
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(125,211,252,0.35)",
        borderRadius: 12,
        padding: "18px 22px",
        background: "rgba(8,17,31,0.92)",
      }}
    >
      <span style={{ color: "#9caec2", fontSize: 20 }}>{label}</span>
      <span style={{ marginTop: 8, fontSize: 30, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
