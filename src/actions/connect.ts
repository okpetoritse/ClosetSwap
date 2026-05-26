"use server";

import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia",
});

export async function createStripeConnectAccount() {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    // 1. Fetch the user to see if they already have a Stripe Account ID
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return { error: "User not found." };

    let accountId = user.stripeAccountId;

    // 2. If they don't have one, create a new connected account in Stripe
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      
      accountId = account.id;

      // Save this new ID to your TiDB database
      await db.update(users).set({ stripeAccountId: accountId }).where(eq(users.id, userId));
    }

    // 3. Generate the secure onboarding link so they can type in their bank details
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/closet`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/closet?banking=success`,
      type: "account_onboarding",
    });

    return { success: true, url: accountLink.url };

  } catch (error: any) {
    console.error("❌ Stripe Connect Error:", error);
    return { error: "Failed to initialize banking portal." };
  }
}

// forcing git update.