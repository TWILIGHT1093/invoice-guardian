import { Resend } from "resend";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === "re_placeholder") {
    throw new Error(
      "RESEND_API_KEY is not set. Get a free key at https://resend.com/api-keys and add it to your .env file."
    );
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: "Invoice Guardian <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
