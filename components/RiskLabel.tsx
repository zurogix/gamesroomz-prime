import { CSSProperties } from "react";
import { riskColor } from "@/lib/sections";
import { Risk } from "@/lib/types";

export default function RiskLabel({ risk, suffix = "" }: { risk: Risk; suffix?: string }) {
  const style = { "--c": riskColor(risk) } as CSSProperties;
  return (
    <span className="risk" style={style}>
      {risk}
      {suffix}
    </span>
  );
}
