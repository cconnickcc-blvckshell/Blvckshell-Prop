import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/guards/rbac";
import { recordPayment } from "@/server/actions/payment-actions";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for client self-pay.
 * Blvckshell remains the system of record; Stripe is a settlement rail.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { invoiceId } = body;

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      totalCents: true,
      client: { select: { name: true, primaryContactEmail: true, requiredPaymentRail: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status !== "Sent") {
    return NextResponse.json(
      { error: "Only sent invoices can be paid via Stripe" },
      { status: 400 }
    );
  }

  if (invoice.client.requiredPaymentRail !== "STRIPE") {
    return NextResponse.json(
      { error: `This client uses ${invoice.client.requiredPaymentRail}, not Stripe` },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: invoice.client.primaryContactEmail,
      line_items: [
        {
          price_data: {
            currency: "cad",
            unit_amount: invoice.totalCents,
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Payment for ${invoice.client.name}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      success_url: `${process.env.NEXTAUTH_URL}/client/invoices?paid=${invoice.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/client/invoices?cancelled=${invoice.id}`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
