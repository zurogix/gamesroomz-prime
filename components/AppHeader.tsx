import UserBadge, { CurrentUser } from "./UserBadge";

/** Top bar for pages outside the assessment workspace. */
export default function AppHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="app-header">
      <a className="brand" href="/">
        <div className="brand-mark">P</div>
        <div>
          <b>Prime Conversion</b>
          <small>Gamesroomz</small>
        </div>
      </a>
      <nav className="app-nav" aria-label="Main">
        <a href="/">Games</a>
        {user.role === "product" && <a href="/settings/team">Team</a>}
      </nav>
      <UserBadge user={user} />
    </header>
  );
}
