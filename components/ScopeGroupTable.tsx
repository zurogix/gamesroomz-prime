import { CSSProperties } from "react";
import { ScopeGroup } from "@/lib/scopeProfile";
import { CLASS_LABEL, formatDays } from "@/lib/sections";

const GROUP_TITLE = { game: "Game workstreams", platform: "Platform workstreams" };

export default function ScopeGroupTable({ group }: { group: ScopeGroup }) {
  return (
    <div className="scope-group">
      <div className="scope-group-head">
        <b>{GROUP_TITLE[group.category]}</b>
        <span className="hint num">{group.count} · {formatDays(group.days)} d</span>
      </div>
      <table className="scope-table">
        <thead>
          <tr><th>Label</th><th className="n">Count</th><th className="n">Person-days</th></tr>
        </thead>
        <tbody>
          {group.rows.map((r) => (
            <tr key={r.classification} className={r.count === 0 ? "muted" : ""}>
              <td><span className="risk" style={{ "--c": `var(--${r.classification})` } as CSSProperties}>{CLASS_LABEL[r.classification]}</span></td>
              <td className="n">{r.count}</td>
              <td className="n">{formatDays(r.days)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
