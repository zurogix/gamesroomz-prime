import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in · Prime Conversion" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <AuthCard title="Sign in">
      {error === "link" && <p className="form-error" role="alert">That sign-in link is invalid or has expired.</p>}
      <LoginForm />
    </AuthCard>
  );
}
