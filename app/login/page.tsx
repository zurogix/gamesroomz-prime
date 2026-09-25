import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in · Prime Conversion" };

export default function LoginPage() {
  return (
    <AuthCard title="Sign in">
      <LoginForm />
    </AuthCard>
  );
}
