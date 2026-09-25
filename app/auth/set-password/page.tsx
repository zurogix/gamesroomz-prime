import AuthCard from "@/components/auth/AuthCard";
import SetPasswordForm from "@/components/auth/SetPasswordForm";

export const metadata = { title: "Set password · Prime Conversion" };

export default function SetPasswordPage() {
  return (
    <AuthCard title="Set your password">
      <SetPasswordForm />
    </AuthCard>
  );
}
