import { CHANGE_PASSWORD_PATH } from "@/lib/passwordGate";
import SignOutButton from "./auth/SignOutButton";

export type CurrentUser = { id: string; name: string; email: string; role: "product" | "developer" };

export const ROLE_LABEL = { product: "Product", developer: "Developer" } as const;

export default function UserBadge({ user }: { user: CurrentUser }) {
  return (
    <div className="user-badge">
      <div>
        <b>{user.name}</b>
        <small>{ROLE_LABEL[user.role]}</small>
      </div>
      <div className="user-actions">
        <a className="btn quiet" href={CHANGE_PASSWORD_PATH}>Change password</a>
        <SignOutButton />
      </div>
    </div>
  );
}
