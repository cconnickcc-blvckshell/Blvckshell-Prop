import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey);
}
