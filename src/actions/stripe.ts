"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Initialize Stripe (You will need to add STRIPE_SECRET_KEY to your .env.local file)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

export async function createCheckoutSession(itemId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "You must be logged in to buy an item." };

    // 1. Fetch the item to ensure the price hasn't been tampered with
    const [item] = await db.select().from(items).where(eq(items.id, itemId));
    
    if (!item || !item.salePrice) return { error: "Item is not available for sale." };
    if (item.ownerId === userId) return { error: "You cannot buy your own item." };

    // Parse image for the checkout screen
    let imageUrl = "https://placehold.co/400x400/1a1a1a/333333?text=ClosetSwap";
    try {
      const parsed = typeof item.mediaUrls === 'string' ? JSON.parse(item.mediaUrls) : item.mediaUrls;
      if (parsed?.length > 0) imageUrl = parsed[0];
    } catch (e) {}

    // 2. Create the Stripe Session
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
            // Stripe requires prices in cents! ($150.00 = 15000 cents)
            unit_amount: Math.round(Number(item.salePrice) * 100), 
          },
          quantity: 1,
        },
      ],
      // We will build this success page later to officially transfer ownership
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

  // Inside your createCheckoutSession function:

    // 1. Fetch the item AND the seller's Stripe Account ID
    const [item] = await db.select().from(items).where(eq(items.id, itemId));
    // Assume we also fetch the seller's user profile here to get their stripeAccountId
    const sellerStripeAccountId = "acct_1DummyTestID"; // We will make this dynamic later

    // Calculate the 15% platform fee in cents
    const totalAmount = Math.round(Number(item.salePrice) * 100);
    const platformFee = Math.round(totalAmount * 0.15); 

    // 2. Create the Stripe Session with Split Payments
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [ /* ... same as before ... */ ],
      
      // 🚀 THE CONNECT ENGINE: Split the money
      payment_intent_data: {
        application_fee_amount: platformFee, // ClosetSwap keeps 15%
        transfer_data: {
          destination: sellerStripeAccountId, // Seller gets 85%
        },
      },
      
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/item/${item.id}`,
      metadata: {
        itemId: item.id,
        buyerId: userId,
      },
    });
}