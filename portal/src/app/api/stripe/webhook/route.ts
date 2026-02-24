import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { queueNotification } from "@/server/actions/notification-actions";
import type { Prisma } from "@prisma/client";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events. Settles payments when checkout completes.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not set" }, { status: 503 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;

    if (!invoiceId) {
      console.warn("Stripe webhook: no invoiceId in session metadata");
      return NextResponse.json({ received: true });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, clientId: true, totalCents: true, status: true },
    });

    if (!invoice || invoice.status === "Paid") {
      return NextResponse.json({ received: true });
    }

    // Record and immediately settle the payment
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          clientId: invoice.clientId,
          provider: "STRIPE",
          providerRef: session.id,
          amountCents: session.amount_total ?? invoice.totalCents,
          status: "SETTLED",
          settledAt: new Date(),
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntent: session.payment_intent,
          } as Prisma.InputJsonValue,
        },
      });

      // Check if fully paid
      const settledPayments = await tx.payment.aggregate({
        where: { invoiceId, status: "SETTLED" },
        _sum: { amountCents: true },
      });
      const totalSettled = settledPayments._sum.amountCents ?? 0;

      if (totalSettled >= invoice.totalCents) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: "Paid" },
        });
        await tx.job.updateMany({
          where: { invoiceId },
          data: { billableStatus: "Invoiced" },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: "system",
          entityType: "Payment",
          entityId: payment.id,
          fromState: null,
          toState: "SETTLED",
          metadata: {
            source: "stripe_webhook",
            event: event.type,
            sessionId: session.id,
            invoiceId,
          } as Prisma.InputJsonValue,
        },
      });
    });

    // Queue payment confirmation notification
    const client = await prisma.clientOrganization.findUnique({
      where: { id: invoice.clientId },
      select: { primaryContactEmail: true, name: true },
    });
    if (client) {
      await queueNotification({
        channel: "EMAIL",
        templateKey: "payment_received",
        recipient: client.primaryContactEmail,
        payload: { invoiceId, clientName: client.name, amountCents: session.amount_total },
        relatedEntityType: "Payment",
        relatedEntityId: invoiceId,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
