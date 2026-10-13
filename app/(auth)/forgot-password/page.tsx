import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { passwordResetAvailable } from "@/server/config";

export const metadata: Metadata = { title: "Reset your password · Thought Orchard" };

export default function ForgotPasswordPage() {
  // Production without an email provider says so instead of pretending to send.
  return <ForgotPasswordForm available={passwordResetAvailable()} />;
}
