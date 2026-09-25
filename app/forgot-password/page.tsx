import AuthCard from "@/components/auth/AuthCard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset password · Prime Conversion" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
