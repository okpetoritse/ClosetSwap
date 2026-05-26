"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { items, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Initialize Stripe 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia",
});

export async function createCheckoutSession(itemId: string) {
  try {
    // 🚀 Only declared once!
    const { userId } = await auth();
    if (!userId) return { error: "You must be logged in to buy an item." };

    // 1. Fetch the item to ensure the price hasn't been tampered with
    const [item] = await db.select().from(items).where(eq(items.id, itemId));
    
    if (!item || !item.salePrice) return { error: "Item is not available for sale." };
    if (item.ownerId === userId) return { error: "You cannot buy your own item." };

    // Fetch the seller to get their connected Stripe Account ID for the split payout
    const [seller] = await db.select().from(users).where(eq(users.id, item.ownerId));
    if (!seller || !seller.stripeAccountId) {
      return { error: "Seller has not connected a bank account yet." };
    }

    // Parse image for the checkout screen
    let imageUrl = "https://placehold.co/400x400/1a1a1a/333333?text=ClosetSwap";
    try {
      const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
      if (parsed?.length > 0) imageUrl = parsed[0];
    } catch (e) {}

    // Calculate the 15% platform fee in cents
    const totalAmount = Math.round(Number(item.salePrice) * 100);
    const platformFee = Math.round(totalAmount * 0.15); 

    // 2. Create the Stripe Session with Split Payments
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.title,
              images: [imageUrl],
            },
            unit_amount: totalAmount, 
          },
          quantity: 1,
        },
      ],
      // 🚀 THE CONNECT ENGINE: Split the money
      payment_intent_data: {
        application_fee_amount: platformFee, // ClosetSwap keeps 15%
        transfer_data: {
          destination: seller.stripeAccountId, // Seller gets 85%
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/item/${item.id}`,
      metadata: {
        itemId: item.id,
        buyerId: userId,
      },
    });

    return { url: session.url };
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return { error: "Failed to initialize secure checkout." };
  }
}