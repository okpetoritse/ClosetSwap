import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateShippingLabel } from "@/actions/shippo"; // Your logistics engine

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // 1. Verify this request actually came from Stripe, not a hacker
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    console.error("❌ Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // 2. Listen for the exact moment the money clears
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract the metadata we passed in Step 2
    const itemId = session.metadata?.itemId;
    const buyerId = session.metadata?.buyerId;

    if (itemId && buyerId) {
      try {
        // 3. Lock the item down in the database
        await db.update(items)
          .set({ status: "sold" })
          .where(eq(items.id, itemId));
          
        console.log(`🔒 Item ${itemId} officially marked as sold!`);

        // 4. Fire the Logistics Engine silently in the background
        // In a full production app, you'd pass the specific buyer/seller IDs here
        const labelResult = await generateShippingLabel();
        if (labelResult?.success) {
          console.log("📦 Tracking URL generated:", labelResult.labelUrl);
          // Here is where you would email the seller their PDF!
        }
        
      } catch (dbError) {
        console.error("❌ Failed to update database after payment:", dbError);
        return new NextResponse("Database Error", { status: 500 });
      }
    }
  }

  // 5. Always return a 200 OK so Stripe knows we received the message
  return new NextResponse(null, { status: 200 });
}