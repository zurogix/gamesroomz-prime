import SignOutButton from "./SignOutButton";

export default function NoAccess({ email }: { email: string }) {
  return (
    <main className="auth-page">
      <section className="auth-card" role="alert">
        <h1>No access yet</h1>
        <p>Your account doesn&apos;t have access to this portal yet</p>
        {email && <p className="hint">Signed in as {email}. Ask a product team member to invite you.</p>}
        <SignOutButton className="btn primary" />
      </section>
    </main>
  );
}
