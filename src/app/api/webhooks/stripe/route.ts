import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateShippingLabel } from "@/actions/shippo";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: Request) {
  const body = await req.text();
  
  // 1. Properly await the headers and get the signature
  const headerList = await headers();
  const signature = headerList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // 2. Verify request came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error("❌ Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // 3. Listen for successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const itemId = session.metadata?.itemId;
    const buyerId = session.metadata?.buyerId;

    if (itemId && buyerId) {
      try {
        // Lock the item down in the database
        await db.update(items)
          .set({ status: "sold" })
          .where(eq(items.id, itemId));
          
        console.log(`🔒 Item ${itemId} officially marked as sold!`);

        // Fire logistics engine
        const labelResult = await generateShippingLabel();
        if (labelResult?.success) {
          console.log("📦 Tracking URL generated:", labelResult.labelUrl);
        }
        
      } catch (dbError) {
        console.error("❌ Failed to update database after payment:", dbError);
        return new NextResponse("Database Error", { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}