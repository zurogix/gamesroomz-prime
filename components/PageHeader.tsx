import { ReactNode } from "react";
import SavedIndicator from "./SavedIndicator";

type Props = {
  title: string;
  crumb: ReactNode;
  actions?: ReactNode;
};

export default function PageHeader({ title, crumb, actions }: Props) {
  return (
    <header className="top">
      <div>
        <div className="crumb">{crumb}</div>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <SavedIndicator />
        {actions}
      </div>
    </header>
  );
}
