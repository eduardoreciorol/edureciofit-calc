import { Resend } from "resend";
import InvitationEmail from "./templates/invitation";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail({
  to,
  name,
  token,
}: {
  to: string;
  name?: string;
  token: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@edureciofit.com",
    to,
    subject: "Eduardo te ha invitado a la Calculadora de Equivalencias",
    react: InvitationEmail({ name, inviteUrl }),
  });

  if (error) throw new Error(`Error enviando email: ${error.message}`);
  return data;
}
