import { ReactNode } from "react";

export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <b>Prime Conversion</b>
            <small>Gamesroomz</small>
          </div>
        </div>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
