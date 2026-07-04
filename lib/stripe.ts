import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

export async function getStripeInvoices(stripeAccountId: string) {
  const accountStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
  });

  const invoices = await accountStripe.invoices.list(
    {
      limit: 100,
    },
    {
      stripeAccount: stripeAccountId,
    }
  );

  return invoices.data;
}

export async function createAccountLink(accountId: string, origin: string) {
  const accountLinks = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/api/stripe/callback`,
    return_url: `${origin}/api/stripe/callback`,
    type: "account_onboarding",
  });

  return accountLinks;
}

export async function createConnectedAccount(email: string) {
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}
